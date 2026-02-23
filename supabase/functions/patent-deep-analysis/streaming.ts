// Patent Deep Analysis — Adaptive streaming with retry

import { AnalysisConfig, VariantResult, MAX_RETRIES, RETRY_ADJUSTMENTS } from "./types.ts";
import { parseSSEBuffer } from "./sse.ts";

export async function streamWithAdaptiveRetry(
  supabaseUrl: string,
  supabaseKey: string,
  authHeader: string,
  prompt: string,
  systemPrompt: string,
  modelId: string,
  config: AnalysisConfig,
  send: (event: string, data: unknown) => void,
): Promise<VariantResult> {
  const idleTimeoutMs = config.idle_timeout_ms || 45_000;
  let lastError: string | null = null;
  let bestText = '';
  let bestTokenCount = 0;
  let totalElapsed = 0;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const adj = RETRY_ADJUSTMENTS[Math.min(attempt, RETRY_ADJUSTMENTS.length - 1)];
    const adjustedMaxTokens = Math.round(config.max_tokens * adj.max_tokens_mult);
    const adjustedTemp = Math.max(0, Math.min(1, config.temperature + adj.temperature_delta));

    if (attempt > 0) {
      send('retry', {
        config_label: config.label,
        attempt: attempt + 1,
        adjusted_max_tokens: adjustedMaxTokens,
        adjusted_temperature: adjustedTemp,
        reason: lastError,
      });
      await new Promise(r => setTimeout(r, 2000));
    }

    const startTime = Date.now();
    try {
      const streamUrl = `${supabaseUrl}/functions/v1/hydra-stream`;
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          message: prompt,
          model_id: modelId,
          role: 'assistant',
          system_prompt: systemPrompt,
          temperature: adjustedTemp,
          max_tokens: adjustedMaxTokens,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `HTTP ${response.status}: ${errText}`;
        continue;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let text = '';
      let tokenCount = 0;
      let idleTimer: ReturnType<typeof setTimeout> | null = null;
      let timedOut = false;

      const resetIdle = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { timedOut = true; }, idleTimeoutMs);
      };

      resetIdle();

      try {
        while (!timedOut) {
          const { done, value } = await reader.read();
          if (done) break;
          resetIdle();
          buffer += decoder.decode(value, { stream: true });

          const { chunks, remaining } = parseSSEBuffer(buffer);
          buffer = remaining;
          for (const chunk of chunks) {
            text += chunk;
            tokenCount++;
          }

          if (tokenCount % 50 === 0 && tokenCount > 0) {
            send('variant_progress', {
              config_label: config.label,
              attempt: attempt + 1,
              tokens: tokenCount,
            });
          }
        }
      } finally {
        if (idleTimer) clearTimeout(idleTimer);
        try { reader.cancel(); } catch { /* already released */ }
      }

      const elapsed = Date.now() - startTime;
      totalElapsed += elapsed;

      if (text.length > bestText.length) {
        bestText = text;
        bestTokenCount = tokenCount;
      }

      const lastChar = text.trim().slice(-1);
      const seemsComplete = ['.', '!', '?', '。', '）', ')', ']', '»'].includes(lastChar) || text.length < 100;

      if (timedOut) {
        lastError = `Idle timeout after ${idleTimeoutMs}ms (got ${tokenCount} tokens)`;
        if (text.length > 200) {
          return {
            config_label: config.label, config, text: bestText,
            token_count: bestTokenCount, elapsed_ms: totalElapsed,
            attempts: attempt + 1, status: 'truncated',
          };
        }
        continue;
      }

      if (!text.trim()) {
        lastError = 'Empty response';
        continue;
      }

      return {
        config_label: config.label, config, text,
        token_count: tokenCount, elapsed_ms: totalElapsed,
        attempts: attempt + 1, status: seemsComplete ? 'completed' : 'truncated',
      };

    } catch (err: any) {
      lastError = err.message || 'Unknown error';
      totalElapsed += Date.now() - startTime;
    }
  }

  if (bestText.length > 100) {
    return {
      config_label: config.label, config, text: bestText,
      token_count: bestTokenCount, elapsed_ms: totalElapsed,
      attempts: MAX_RETRIES, status: 'truncated',
    };
  }

  return {
    config_label: config.label, config, text: '', token_count: 0,
    elapsed_ms: totalElapsed, attempts: MAX_RETRIES,
    status: 'failed', error: lastError || 'All retries exhausted',
  };
}
