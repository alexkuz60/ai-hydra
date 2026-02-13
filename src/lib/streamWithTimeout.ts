/**
 * Streams an SSE response from hydra-stream with a timeout and one automatic retry.
 * Used by both contest and duel execution hooks.
 */

const DEFAULT_TIMEOUT_MS = 90_000; // 90 seconds
const MAX_RETRIES = 1;

interface StreamOptions {
  url: string;
  body: Record<string, unknown>;
  authToken: string | null;
  apiKey: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  onToken: (accumulated: string, tokenCount: number) => void;
}

interface StreamResult {
  text: string;
  tokenCount: number;
  elapsedMs: number;
}

export async function streamWithTimeout(opts: StreamOptions): Promise<StreamResult> {
  const { url, body, authToken, apiKey, signal, timeoutMs = DEFAULT_TIMEOUT_MS, onToken } = opts;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`[stream-retry] Retry attempt ${attempt} for ${body.model_id}`);
      // Small delay before retry
      await new Promise(r => setTimeout(r, 2000));
    }

    try {
      const result = await doStream(url, body, authToken, apiKey, signal, timeoutMs, onToken);
      return result;
    } catch (err: any) {
      if (err.name === 'AbortError') throw err; // User-initiated cancel
      lastError = err;
      console.warn(`[stream-timeout] Attempt ${attempt + 1} failed for ${body.model_id}:`, err.message);
    }
  }

  throw lastError || new Error('Stream failed after retries');
}

async function doStream(
  url: string,
  body: Record<string, unknown>,
  authToken: string | null,
  apiKey: string,
  outerSignal: AbortSignal | undefined,
  timeoutMs: number,
  onToken: (accumulated: string, tokenCount: number) => void,
): Promise<StreamResult> {
  const timeoutController = new AbortController();
  const startTime = Date.now();

  // Combine outer signal (user cancel) with timeout signal
  const combinedAbort = new AbortController();

  const onOuterAbort = () => combinedAbort.abort();
  const onTimeoutAbort = () => combinedAbort.abort();
  outerSignal?.addEventListener('abort', onOuterAbort);
  timeoutController.signal.addEventListener('abort', onTimeoutAbort);

  // Set timeout
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, timeoutMs);

  // Reset timeout on each received chunk (idle timeout)
  let idleTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const IDLE_TIMEOUT_MS = 30_000; // 30s without any data = stalled

  const resetIdleTimeout = () => {
    if (idleTimeoutId) clearTimeout(idleTimeoutId);
    idleTimeoutId = setTimeout(() => {
      timeoutController.abort();
    }, IDLE_TIMEOUT_MS);
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken || apiKey}`,
        'apikey': apiKey,
      },
      body: JSON.stringify(body),
      signal: combinedAbort.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${response.status}: ${errText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';
    let tokenCount = 0;

    resetIdleTimeout(); // Start idle timer

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      resetIdleTimeout(); // Got data, reset idle timer
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '' || line.startsWith('event:')) continue;
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            accumulated += content;
            tokenCount++;
            onToken(accumulated, tokenCount);
          }
        } catch { /* partial JSON */ }
      }
    }

    const elapsed = Date.now() - startTime;

    // If response is empty after successful stream, treat as timeout
    if (!accumulated.trim()) {
      throw new Error('Empty response from model');
    }

    return { text: accumulated, tokenCount, elapsedMs: elapsed };
  } finally {
    clearTimeout(timeoutId);
    if (idleTimeoutId) clearTimeout(idleTimeoutId);
    outerSignal?.removeEventListener('abort', onOuterAbort);
    timeoutController.signal.removeEventListener('abort', onTimeoutAbort);
  }
}
