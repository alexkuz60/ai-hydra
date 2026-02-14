// Provider-specific streaming logic

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateUser, getUserApiKey } from "./auth.ts";
import { CORS_HEADERS, SSE_HEADERS, wrapStreamWithProviderInfo, type ProviderGateway, type ProxyApiSettings } from "./types.ts";

// ── Google Gemini (BYOK - streaming via SSE adapter) ────

export async function streamGemini(params: ProviderStreamParams): Promise<Response> {
  const { req, model_id, systemPrompt, message, temperature, max_tokens } = params;

  const auth = await authenticateUser(req, "Gemini");
  if (!auth.ok) return auth.response;

  const keyResult = await getUserApiKey(auth.supabase, "google_gemini_api_key", "Google Gemini");
  if ("response" in keyResult) return keyResult.response;

  const geminiModel = model_id || 'gemini-2.5-flash';
  console.log(`[hydra-stream] Gemini streaming: model=${geminiModel}`);

  // Gemini uses streamGenerateContent with alt=sse
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${keyResult.key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${params.history?.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n\n') || ''}${params.history?.length ? '\n\n' : ''}User: ${message}` }] }],
        generationConfig: { temperature, maxOutputTokens: max_tokens },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[hydra-stream] Gemini error:", response.status, errorText);
    return new Response(
      JSON.stringify({ error: `Gemini error: ${response.status}` }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // Transform Gemini SSE format to OpenAI-compatible SSE format
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = response.body!.getReader();

  const transformedStream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                // Re-format as OpenAI-compatible SSE
                const openaiChunk = {
                  choices: [{ delta: { content: text }, index: 0 }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
              }
            } catch { /* skip partial JSON */ }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  console.log("[hydra-stream] Gemini streaming started");
  return new Response(wrapStreamWithProviderInfo(transformedStream, 'gemini'), { headers: SSE_HEADERS });
}

/** Universal ProxyAPI endpoint (OpenAI-compatible for all providers) */
const PROXYAPI_UNIVERSAL_URL = "https://openai.api.proxyapi.ru/v1/chat/completions";

// ProxyAPI maps imported from shared module
import { PROXYAPI_MODEL_MAP, PROXYAPI_TO_LOVABLE_MAP, resolveProxyApiModel } from "../_shared/proxyapi.ts";

interface ProviderStreamParams {
  req: Request;
  model_id: string;
  systemPrompt: string;
  message: string;
  temperature: number;
  max_tokens: number;
  proxyapi_settings?: ProxyApiSettings;
  /** Conversation history for multi-turn contexts */
  history?: { role: string; content: string }[];
}

/** Build messages array with optional conversation history */
function buildMessages(systemPrompt: string, message: string, history?: { role: string; content: string }[]): { role: string; content: string }[] {
  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];
  if (history && history.length > 0) {
    messages.push(...history);
  }
  messages.push({ role: "user", content: message });
  return messages;
}

// ── DeepSeek ────────────────────────────────────────────

export async function streamDeepSeek(params: ProviderStreamParams): Promise<Response> {
  const { req, model_id, systemPrompt, message, temperature, max_tokens } = params;

  const auth = await authenticateUser(req, "DeepSeek");
  if (!auth.ok) return auth.response;

  const keyResult = await getUserApiKey(auth.supabase, "deepseek_api_key", "DeepSeek");
  if ("response" in keyResult) return keyResult.response;

  const isReasoning = model_id === "deepseek-reasoner";
  console.log(`[hydra-stream] DeepSeek streaming: model=${model_id}`);

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${keyResult.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model_id,
      messages: buildMessages(systemPrompt, message, params.history),
      stream: true,
      temperature: isReasoning ? undefined : temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[hydra-stream] DeepSeek error:", response.status, errorText);
    return new Response(
      JSON.stringify({ error: `DeepSeek error: ${response.status}` }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  console.log("[hydra-stream] DeepSeek streaming started");
  return new Response(wrapStreamWithProviderInfo(response.body!, 'deepseek'), { headers: SSE_HEADERS });
}

// ── Mistral ─────────────────────────────────────────────

export async function streamMistral(params: ProviderStreamParams): Promise<Response> {
  const { req, model_id, systemPrompt, message, temperature, max_tokens } = params;

  const auth = await authenticateUser(req, "Mistral");
  if (!auth.ok) return auth.response;

  const keyResult = await getUserApiKey(auth.supabase, "mistral_api_key", "Mistral");
  if ("response" in keyResult) return keyResult.response;

  console.log(`[hydra-stream] Mistral streaming: model=${model_id}`);

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${keyResult.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model_id,
      messages: buildMessages(systemPrompt, message, params.history),
      stream: true,
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[hydra-stream] Mistral error:", response.status, errorText);
    return new Response(
      JSON.stringify({ error: `Mistral error: ${response.status}` }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  console.log("[hydra-stream] Mistral streaming started");
  return new Response(wrapStreamWithProviderInfo(response.body!, 'mistral'), { headers: SSE_HEADERS });
}

// ── Groq ────────────────────────────────────────────────

export async function streamGroq(params: ProviderStreamParams): Promise<Response> {
  const { req, model_id, systemPrompt, message, temperature, max_tokens } = params;

  const auth = await authenticateUser(req, "Groq");
  if (!auth.ok) return auth.response;

  const keyResult = await getUserApiKey(auth.supabase, "groq_api_key", "Groq");
  if ("response" in keyResult) return keyResult.response;

  console.log(`[hydra-stream] Groq streaming: model=${model_id}`);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${keyResult.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model_id,
      messages: buildMessages(systemPrompt, message, params.history),
      stream: true,
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[hydra-stream] Groq error:", response.status, errorText);
    return new Response(
      JSON.stringify({ error: `Groq error: ${response.status}` }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  console.log("[hydra-stream] Groq streaming started");
  return new Response(wrapStreamWithProviderInfo(response.body!, 'groq'), { headers: SSE_HEADERS });
}

// ── Lovable AI (OpenAI, Google, etc.) ───────────────────


export async function streamLovableAI(params: ProviderStreamParams): Promise<Response> {
  const { model_id, systemPrompt, message, temperature, max_tokens } = params;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const isOpenAI = model_id.startsWith("openai/");
  const tokenParam = isOpenAI
    ? { max_completion_tokens: max_tokens }
    : { max_tokens };
  const tempParam = isOpenAI ? {} : { temperature };

  console.log(`[hydra-stream] Lovable AI streaming: model=${model_id}`);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model_id,
      messages: buildMessages(systemPrompt, message, params.history),
      stream: true,
      ...tempParam,
      ...tokenParam,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      console.error("[hydra-stream] Rate limit exceeded");
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
    if (response.status === 402) {
      console.error("[hydra-stream] Payment required");
      return new Response(
        JSON.stringify({ error: "Payment required. Please add funds to your Lovable AI workspace." }),
        { status: 402, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
    const errorText = await response.text();
    console.error("[hydra-stream] AI gateway error:", response.status, errorText);
    return new Response(
      JSON.stringify({ error: `AI gateway error: ${response.status}` }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  console.log("[hydra-stream] Lovable AI streaming started");
  return new Response(wrapStreamWithProviderInfo(response.body!, 'lovable_ai'), { headers: SSE_HEADERS });
}

/** Lovable AI with fallback metadata (used when ProxyAPI falls back) */
async function streamLovableAIWithFallbackInfo(
  params: ProviderStreamParams,
  fallbackFrom: ProviderGateway,
  fallbackReason: string
): Promise<Response> {
  const result = await streamLovableAI(params);
  if (!result.ok || !result.body) return result;
  
  // Re-wrap with fallback info
  return new Response(
    wrapStreamWithProviderInfo(result.body, 'lovable_ai', { 
      fallback_from: fallbackFrom, 
      fallback_reason: fallbackReason 
    }),
    { headers: SSE_HEADERS }
  );
}


const PROXYAPI_DEFAULT_MAX_RETRIES = 2;
const PROXYAPI_DEFAULT_RETRY_BASE_MS = 1000;
const PROXYAPI_DEFAULT_TIMEOUT_MS = 30_000;

/** Fetch with timeout */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Check if error is retryable */
function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

export async function streamProxyApi(params: ProviderStreamParams): Promise<Response> {
  const { req, model_id, systemPrompt, message, temperature, max_tokens, proxyapi_settings } = params;
  const maxRetries = proxyapi_settings?.max_retries ?? PROXYAPI_DEFAULT_MAX_RETRIES;
  const timeoutMs = (proxyapi_settings?.timeout_sec ?? 30) * 1000;
  const fallbackEnabled = proxyapi_settings?.fallback_enabled ?? true;
  const startTime = Date.now();

  console.log(`[hydra-stream] ProxyAPI settings: timeout=${timeoutMs}ms, retries=${maxRetries}, fallback=${fallbackEnabled}`);
  const auth = await authenticateUser(req, "ProxyAPI");
  if (!auth.ok) return auth.response;

  const keyResult = await getUserApiKey(auth.supabase, "proxyapi_api_key", "ProxyAPI");
  if ("response" in keyResult) return keyResult.response;

  // Map to universal OpenAI-compatible model ID with provider prefix
  const realModel = resolveProxyApiModel(model_id);
  const isReasoning = realModel.endsWith("deepseek-reasoner") || realModel.endsWith("o3-mini");
  const isOpenAIModel = realModel.startsWith("openai/");

  // GPT-5 reasoning models need higher min tokens for reasoning + response
  const effectiveMaxTokens = isOpenAIModel ? Math.max(max_tokens, 2000) : max_tokens;
  const tokenParam = isOpenAIModel
    ? { max_completion_tokens: effectiveMaxTokens }
    : { max_tokens };

  console.log(`[hydra-stream] ProxyAPI streaming (universal): model=${realModel}`);

  const requestBody = JSON.stringify({
    model: realModel,
    messages: buildMessages(systemPrompt, message, params.history),
    stream: true,
    temperature: (isReasoning || isOpenAIModel) ? undefined : temperature,
    ...tokenParam,
  });

  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${keyResult.key}`,
      "Content-Type": "application/json",
    },
    body: requestBody,
  };

  // Helper to log to proxy_api_logs (fire-and-forget)
  const logRequest = (status: string, errorMsg?: string, fallbackProvider?: string) => {
    const latency = Date.now() - startTime;
    auth.supabase.from("proxy_api_logs").insert({
      user_id: auth.userId,
      model_id: model_id,
      request_type: "stream",
      status,
      latency_ms: latency,
      error_message: errorMsg || null,
      fallback_provider: fallbackProvider || null,
    }).then(({ error }) => {
      if (error) console.error("[hydra-stream] Failed to log proxy request:", error.message);
    });
  };

  // Retry loop with exponential backoff
  let lastError = "";
  let lastStatus = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = PROXYAPI_DEFAULT_RETRY_BASE_MS * Math.pow(2, attempt - 1);
      console.log(`[hydra-stream] ProxyAPI retry ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      const response = await fetchWithTimeout(PROXYAPI_UNIVERSAL_URL, requestInit, timeoutMs);

      if (response.ok) {
        console.log(`[hydra-stream] ProxyAPI streaming started (attempt ${attempt + 1})`);
        logRequest("success");
        return new Response(wrapStreamWithProviderInfo(response.body!, 'proxyapi'), { headers: SSE_HEADERS });
      }

      lastStatus = response.status;
      lastError = await response.text();
      console.error(`[hydra-stream] ProxyAPI error (attempt ${attempt + 1}):`, lastStatus, lastError);

      // Don't retry client errors (4xx) except 429
      if (!isRetryable(lastStatus)) break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      lastStatus = 0;
      console.error(`[hydra-stream] ProxyAPI timeout/network error (attempt ${attempt + 1}):`, lastError);
      // Timeouts and network errors are always retryable
    }
  }

  // All retries exhausted — try Lovable AI fallback for mapped models
  const lovableModelId = PROXYAPI_TO_LOVABLE_MAP[model_id];
  if (fallbackEnabled && lovableModelId) {
    const reason = lastStatus === 404 ? "model not available"
      : lastStatus >= 500 ? `server error ${lastStatus}`
      : lastStatus === 429 ? "rate limited"
      : lastStatus === 0 ? "timeout/network error"
      : `error ${lastStatus}`;
    console.log(`[hydra-stream] ProxyAPI fallback -> Lovable AI: ${model_id} -> ${lovableModelId} (reason: ${reason})`);
    logRequest("fallback", reason, "lovable_ai");
    return streamLovableAIWithFallbackInfo({ ...params, model_id: lovableModelId }, 'proxyapi', reason);
  }

  logRequest("error", `${lastStatus}: ${lastError}`);
  return new Response(
    JSON.stringify({ error: `ProxyAPI error after ${maxRetries + 1} attempts: ${lastError}` }),
    { status: lastStatus || 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
}

// ── OpenRouter (with ProxyAPI fallback) ─────────────────

export async function streamOpenRouter(params: ProviderStreamParams): Promise<Response> {
  const { req, model_id, systemPrompt, message, temperature, max_tokens } = params;

  const auth = await authenticateUser(req, "OpenRouter");
  if (!auth.ok) return auth.response;

  // Fetch profile to check proxyapi_priority
  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("proxyapi_priority")
    .eq("user_id", auth.userId)
    .single();

  const proxyapiPriority = !!(profile as any)?.proxyapi_priority;

  // Get both keys in parallel
  const { data: apiKeys } = await auth.supabase.rpc("get_my_api_keys").single();
  const keys = apiKeys as Record<string, string | null> | null;

  const openrouterKey = keys?.openrouter_api_key;
  const proxyapiKey = keys?.proxyapi_api_key;

  const useProxyApi = proxyapiPriority && !!proxyapiKey;
  const effectiveKey = useProxyApi ? proxyapiKey : openrouterKey;

  if (!effectiveKey) {
    const label = useProxyApi ? "ProxyAPI" : "OpenRouter";
    return new Response(
      JSON.stringify({ error: `${label} API key not configured. Please add it in your profile settings.` }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const baseUrl = useProxyApi
    ? "https://openai.api.proxyapi.ru/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";

  const extraHeaders: Record<string, string> = useProxyApi
    ? {}
    : { "HTTP-Referer": "https://ai-hydra.lovable.app", "X-Title": "Hydra AI" };

  console.log(`[hydra-stream] OpenRouter streaming: model=${model_id}, via=${useProxyApi ? "ProxyAPI" : "OpenRouter"}`);

  const timeoutMs = useProxyApi 
    ? (params.proxyapi_settings?.timeout_sec ?? 30) * 1000 
    : 60_000;

  const response = await fetchWithTimeout(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${effectiveKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({
      model: model_id,
      messages: buildMessages(systemPrompt, message, params.history),
      stream: true,
      temperature,
      max_tokens,
    }),
  }, timeoutMs);

  if (!response.ok) {
    const errorText = await response.text();
    const label = useProxyApi ? "ProxyAPI" : "OpenRouter";
    console.error(`[hydra-stream] ${label} error:`, response.status, errorText);
    return new Response(
      JSON.stringify({ error: `${label} error: ${response.status}` }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const gateway: ProviderGateway = useProxyApi ? 'proxyapi' : 'openrouter';
  console.log(`[hydra-stream] OpenRouter streaming started via ${useProxyApi ? "ProxyAPI" : "OpenRouter"}`);
  return new Response(wrapStreamWithProviderInfo(response.body!, gateway), { headers: SSE_HEADERS });
}
