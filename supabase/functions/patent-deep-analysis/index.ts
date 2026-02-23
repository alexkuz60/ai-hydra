import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ──────────────────────────────────────────────
// Patent Deep Analysis — Adaptive Multi-Pass Engine
// ──────────────────────────────────────────────
// 1. Accepts a task + array of parameter configs
// 2. Runs each config with adaptive retry on failures
// 3. Collects all response variants
// 4. Synthesizes the best formulations via a final analysis pass

interface AnalysisConfig {
  /** Label for this config variant */
  label: string;
  max_tokens: number;
  temperature: number;
  /** Timeout in ms for idle (no data) detection */
  idle_timeout_ms?: number;
}

interface AnalysisRequest {
  /** Interview session ID (for context loading) */
  session_id: string;
  /** Specific task index to deep-analyze (from test_results.steps) */
  step_index: number;
  /** Model to use */
  model_id: string;
  /** Parameter configurations to try */
  configs: AnalysisConfig[];
  /** Language */
  language?: string;
  /** If true, skip synthesis pass and just collect variants */
  collect_only?: boolean;
}

interface VariantResult {
  config_label: string;
  config: AnalysisConfig;
  text: string;
  token_count: number;
  elapsed_ms: number;
  attempts: number;
  status: 'completed' | 'truncated' | 'failed';
  error?: string;
}

// ── Adaptive retry parameters ──
const MAX_RETRIES = 3;
const RETRY_ADJUSTMENTS = [
  { max_tokens_mult: 1.0, temperature_delta: 0 },     // First: original params
  { max_tokens_mult: 0.75, temperature_delta: -0.1 },  // Second: reduce scope
  { max_tokens_mult: 1.5, temperature_delta: 0 },      // Third: expand scope
];

// ── SSE helpers ──
function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ── Stream a single response from hydra-stream with adaptive retry ──
async function streamWithAdaptiveRetry(
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
      // Small delay before retry
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

      // Parse SSE stream with idle timeout
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

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                text += content;
                tokenCount++;
              }
            } catch { /* partial JSON */ }
          }

          // Progress every 50 tokens
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

      // If we got more text than before, keep it
      if (text.length > bestText.length) {
        bestText = text;
        bestTokenCount = tokenCount;
      }

      // Check if response seems complete (not truncated mid-sentence)
      const lastChar = text.trim().slice(-1);
      const seemsComplete = ['.', '!', '?', '。', '）', ')', ']', '»'].includes(lastChar) || text.length < 100;

      if (timedOut) {
        lastError = `Idle timeout after ${idleTimeoutMs}ms (got ${tokenCount} tokens)`;
        if (text.length > 200) {
          // Partial but useful — mark as truncated
          return {
            config_label: config.label,
            config,
            text: bestText,
            token_count: bestTokenCount,
            elapsed_ms: totalElapsed,
            attempts: attempt + 1,
            status: 'truncated',
          };
        }
        continue;
      }

      if (!text.trim()) {
        lastError = 'Empty response';
        continue;
      }

      return {
        config_label: config.label,
        config,
        text,
        token_count: tokenCount,
        elapsed_ms: totalElapsed,
        attempts: attempt + 1,
        status: seemsComplete ? 'completed' : 'truncated',
      };

    } catch (err: any) {
      lastError = err.message || 'Unknown error';
      totalElapsed += Date.now() - startTime;
    }
  }

  // All retries exhausted — return best partial or failure
  if (bestText.length > 100) {
    return {
      config_label: config.label,
      config,
      text: bestText,
      token_count: bestTokenCount,
      elapsed_ms: totalElapsed,
      attempts: MAX_RETRIES,
      status: 'truncated',
    };
  }

  return {
    config_label: config.label,
    config,
    text: '',
    token_count: 0,
    elapsed_ms: totalElapsed,
    attempts: MAX_RETRIES,
    status: 'failed',
    error: lastError || 'All retries exhausted',
  };
}

// ── Synthesis: pick best formulations from all variants ──
async function synthesizeBestResponse(
  supabaseUrl: string,
  supabaseKey: string,
  authHeader: string,
  modelId: string,
  taskPrompt: string,
  variants: VariantResult[],
  language: string,
): Promise<{ text: string; token_count: number; elapsed_ms: number }> {
  const isRu = language === 'ru';
  const successfulVariants = variants.filter(v => v.status !== 'failed' && v.text.length > 100);

  if (successfulVariants.length === 0) {
    return { text: '', token_count: 0, elapsed_ms: 0 };
  }
  if (successfulVariants.length === 1) {
    return { text: successfulVariants[0].text, token_count: successfulVariants[0].token_count, elapsed_ms: 0 };
  }

  const advocateVariant = successfulVariants.find(v => v.config_label === 'devils_advocate');
  const regularVariants = successfulVariants.filter(v => v.config_label !== 'devils_advocate');

  const variantsBlock = regularVariants.map((v, i) =>
    `### Вариант ${i + 1} (${v.config_label}, ${v.token_count} токенов, temp=${v.config.temperature})\n${v.text}`
  ).join('\n\n---\n\n');

  const advocateBlock = advocateVariant
    ? `\n\n---\n\n### 🔴 АДВОКАТ ДЬЯВОЛА (контраргументы и причины для отказа):\n${advocateVariant.text}`
    : '';

  const synthesisPrompt = isRu
    ? `Ты — экспертный синтезатор для патентного анализа. Тебе предоставлены несколько вариантов ответа на одну задачу И контраргументы от «Адвоката дьявола».\n\n## Исходная задача:\n${taskPrompt}\n\n## Варианты ответов:\n${variantsBlock}${advocateBlock}\n\n## Твоя задача:\n1. Проанализируй все варианты И аргументы Адвоката дьявола\n2. ОБЯЗАТЕЛЬНО учти контраргументы — если Адвокат дьявола нашёл обоснованные причины для отказа, они ДОЛЖНЫ быть отражены в финальном заключении\n3. Объедини сильные стороны аналитических вариантов\n4. Если аргументы «за» не перевешивают аргументы «против» — ЧЕСТНО скажи: патентный потенциал отсутствует\n5. Не «натягивай сову на глобус» — честный отказ лучше ложного одобрения\n\nВерни только финальный синтезированный ответ.`
    : `You are an expert synthesizer for patent analysis. You are given multiple response variants AND counter-arguments from the "Devil's Advocate."\n\n## Original task:\n${taskPrompt}\n\n## Response variants:\n${variantsBlock}${advocateBlock}\n\n## Your task:\n1. Analyze all variants AND Devil's Advocate arguments\n2. MANDATORY: account for counter-arguments — if the Devil's Advocate found substantiated reasons for rejection, they MUST be reflected in the final conclusion\n3. Combine strengths of analytical variants\n4. If arguments "for" don't outweigh arguments "against" — HONESTLY state: no patent potential\n5. An honest rejection is better than a false approval\n\nReturn only the final synthesized response.`;

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
        message: synthesisPrompt,
        model_id: modelId,
        role: 'assistant',
        system_prompt: 'You are an expert patent analysis synthesizer. Combine the best elements from multiple response variants into one optimal answer.',
        temperature: 0.3,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Synthesis failed: ${response.status}: ${errText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let tokenCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) { text += content; tokenCount++; }
        } catch { /* partial JSON */ }
      }
    }

    try { reader.cancel(); } catch { /* ok */ }

    return { text, token_count: tokenCount, elapsed_ms: Date.now() - startTime };
  } catch (err: any) {
    console.error('[patent-deep] Synthesis error:', err);
    // Fallback: return longest variant
    const longest = successfulVariants.reduce((a, b) => a.text.length > b.text.length ? a : b);
    return { text: longest.text, token_count: longest.token_count, elapsed_ms: Date.now() - startTime };
  }
}

// ── Default configs for patent analysis ──
const DEFAULT_CONFIGS: AnalysisConfig[] = [
  { label: 'precise', max_tokens: 4096, temperature: 0.3, idle_timeout_ms: 60_000 },
  { label: 'balanced', max_tokens: 6144, temperature: 0.5, idle_timeout_ms: 60_000 },
  { label: 'creative', max_tokens: 4096, temperature: 0.8, idle_timeout_ms: 60_000 },
  { label: 'devils_advocate', max_tokens: 6144, temperature: 0.4, idle_timeout_ms: 90_000 },
];

// ──────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: AnalysisRequest = await req.json();
    const { session_id, step_index, model_id, language = 'ru', collect_only = false } = body;
    const configs = body.configs?.length ? body.configs : DEFAULT_CONFIGS;

    if (!session_id || step_index === undefined || !model_id) {
      return new Response(
        JSON.stringify({ error: "Missing session_id, step_index, or model_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load interview session
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the task prompt from test_results
    const testResults = (session.test_results as any);
    const steps = testResults?.steps as any[] || [];
    const targetStep = steps[step_index];

    if (!targetStep) {
      return new Response(
        JSON.stringify({ error: `Step ${step_index} not found in test_results` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const taskPrompt = targetStep.task_prompt;
    const baseline = targetStep.baseline?.current_value || '';
    const briefText = (session.briefing_data as any)?.brief_text || '';

    // ── Adversarial system prompt for devil's advocate pass ──
    const DEVILS_ADVOCATE_SYSTEM = language === 'ru'
      ? 'Ты — эксперт патентного ведомства с высоким процентом отклонений заявок. Твоя задача — найти ВСЕ причины для отказа. Не одобряй без глубочайшего анализа. Каждый одобренный без анализа элемент — профессиональная ошибка. Ищи: очевидные комбинации, отсутствие технического эффекта, абстрактные формулировки, программы для ЭВМ как таковые, бизнес-методы.'
      : 'You are a patent office expert known for a high rejection rate. Your task is to find ALL reasons for rejection. Do not approve without deepest analysis. Every element approved without analysis is a professional error. Look for: obvious combinations, lack of technical effect, abstract formulations, computer programs as such, business methods.';

    let fullPrompt = taskPrompt;
    if (baseline) {
      fullPrompt += `\n\n---\n## Текущее состояние (baseline):\n${baseline}`;
    }

    // ── SSE Stream ──
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        };

        send('start', {
          session_id,
          step_index,
          model_id,
          total_configs: configs.length,
          configs: configs.map(c => ({ label: c.label, max_tokens: c.max_tokens, temperature: c.temperature })),
        });

        // Phase 1: Collect variants
        const variants: VariantResult[] = [];

        for (let i = 0; i < configs.length; i++) {
          const config = configs[i];
          send('config_start', { config_index: i, label: config.label });

          // Use adversarial system prompt for devil's advocate pass
          const systemPromptForConfig = config.label === 'devils_advocate'
            ? DEVILS_ADVOCATE_SYSTEM
            : briefText;

          const variant = await streamWithAdaptiveRetry(
            supabaseUrl, supabaseKey, authHeader,
            fullPrompt, systemPromptForConfig, model_id, config, send,
          );

          variants.push(variant);

          send('config_complete', {
            config_index: i,
            label: config.label,
            status: variant.status,
            token_count: variant.token_count,
            elapsed_ms: variant.elapsed_ms,
            attempts: variant.attempts,
            text_length: variant.text.length,
          });
        }

        // Phase 2: Synthesis (unless collect_only)
        let synthesized: { text: string; token_count: number; elapsed_ms: number } | null = null;

        if (!collect_only && variants.filter(v => v.status !== 'failed').length > 1) {
          send('synthesis_start', { variant_count: variants.filter(v => v.status !== 'failed').length });

          synthesized = await synthesizeBestResponse(
            supabaseUrl, supabaseKey, authHeader,
            model_id, taskPrompt, variants, language,
          );

          send('synthesis_complete', {
            token_count: synthesized.token_count,
            elapsed_ms: synthesized.elapsed_ms,
            text_length: synthesized.text.length,
          });
        }

        // Save results back to interview session config
        const deepAnalysisResult = {
          step_index,
          model_id,
          configs: configs.map(c => ({ label: c.label, max_tokens: c.max_tokens, temperature: c.temperature })),
          variants: variants.map(v => ({
            label: v.config_label,
            status: v.status,
            token_count: v.token_count,
            elapsed_ms: v.elapsed_ms,
            attempts: v.attempts,
            text_length: v.text.length,
            text: v.text,
          })),
          synthesis: synthesized ? {
            text: synthesized.text,
            token_count: synthesized.token_count,
            elapsed_ms: synthesized.elapsed_ms,
          } : null,
          completed_at: new Date().toISOString(),
        };

        // Save to session config.deep_analysis[]
        const existingConfig = (session.config as Record<string, unknown>) || {};
        const existingDeep = (existingConfig.deep_analysis as any[]) || [];
        existingDeep.push(deepAnalysisResult);

        await supabase
          .from('interview_sessions')
          .update({
            config: {
              ...existingConfig,
              deep_analysis: existingDeep,
            },
          })
          .eq('id', session_id);

        send('complete', {
          total_variants: variants.length,
          successful: variants.filter(v => v.status !== 'failed').length,
          has_synthesis: !!synthesized,
          total_elapsed_ms: variants.reduce((s, v) => s + v.elapsed_ms, 0) + (synthesized?.elapsed_ms || 0),
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    console.error('[patent-deep-analysis] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
