// Provider-specific streaming logic

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateUser, getUserApiKey } from "./auth.ts";
import { CORS_HEADERS, SSE_HEADERS } from "./types.ts";

/** Map proxyapi/ prefixed model IDs to real model IDs for the ProxyAPI gateway */
const PROXYAPI_MODEL_MAP: Record<string, string> = {
  "proxyapi/gpt-4o": "gpt-4o",
  "proxyapi/gpt-4o-mini": "gpt-4o-mini",
  "proxyapi/o3-mini": "o3-mini",
  "proxyapi/gpt-5": "gpt-5",
  "proxyapi/gpt-5-mini": "gpt-5-mini",
  "proxyapi/gpt-5.2": "gpt-5.2",
  "proxyapi/claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
  "proxyapi/claude-3-5-haiku": "claude-3-5-haiku-20241022",
  "proxyapi/gemini-2.0-flash": "gemini-2.0-flash",
  "proxyapi/gemini-3-flash-preview": "gemini-3-flash-preview",
  "proxyapi/gemini-3-pro-preview": "gemini-3-pro-preview",
  "proxyapi/gemini-2.5-pro": "gemini-2.5-pro",
  "proxyapi/gemini-2.5-flash": "gemini-2.5-flash",
  "proxyapi/deepseek-chat": "deepseek-chat",
  "proxyapi/deepseek-reasoner": "deepseek-reasoner",
};

/** Map proxyapi/ model IDs to Lovable AI equivalents for 404 fallback */
const PROXYAPI_TO_LOVABLE_MAP: Record<string, string> = {
  "proxyapi/gemini-3-pro-preview": "google/gemini-3-pro-preview",
  "proxyapi/gemini-3-flash-preview": "google/gemini-3-flash-preview",
  "proxyapi/gemini-2.5-pro": "google/gemini-2.5-pro",
  "proxyapi/gemini-2.5-flash": "google/gemini-2.5-flash",
  "proxyapi/gpt-5": "openai/gpt-5",
  "proxyapi/gpt-5-mini": "openai/gpt-5-mini",
  "proxyapi/gpt-5.2": "openai/gpt-5.2",
};

interface ProviderStreamParams {
  req: Request;
  model_id: string;
  systemPrompt: string;
  message: string;
  temperature: number;
  max_tokens: number;
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
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
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
  return new Response(response.body, { headers: SSE_HEADERS });
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
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
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
  return new Response(response.body, { headers: SSE_HEADERS });
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
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
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
  return new Response(response.body, { headers: SSE_HEADERS });
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
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
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
  return new Response(response.body, { headers: SSE_HEADERS });
}

// ── ProxyAPI (direct, separate from OpenRouter) ─────────

export async function streamProxyApi(params: ProviderStreamParams): Promise<Response> {
  const { req, model_id, systemPrompt, message, temperature, max_tokens } = params;

  const auth = await authenticateUser(req, "ProxyAPI");
  if (!auth.ok) return auth.response;

  const keyResult = await getUserApiKey(auth.supabase, "proxyapi_api_key", "ProxyAPI");
  if ("response" in keyResult) return keyResult.response;

  const realModel = PROXYAPI_MODEL_MAP[model_id] || model_id.replace("proxyapi/", "");

  // Route Claude models to Anthropic endpoint, others to OpenAI-compatible endpoint
  const isClaude = realModel.startsWith("claude");
  const isGemini = realModel.startsWith("gemini");

  let baseUrl: string;
  if (isClaude) {
    baseUrl = "https://api.proxyapi.ru/anthropic/v1/messages";
  } else if (isGemini) {
    baseUrl = "https://api.proxyapi.ru/google/v1/chat/completions";
  } else {
    baseUrl = "https://api.proxyapi.ru/openai/v1/chat/completions";
  }

  console.log(`[hydra-stream] ProxyAPI streaming: model=${realModel}, endpoint=${isClaude ? "anthropic" : isGemini ? "google" : "openai"}`);

  if (isClaude) {
    // Anthropic format
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "x-api-key": keyResult.key,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: realModel,
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
        stream: true,
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[hydra-stream] ProxyAPI/Anthropic error:", response.status, errorText);

      // Fallback to Lovable AI if ProxyAPI returns 404
      if (response.status === 404) {
        const lovableModelId = PROXYAPI_TO_LOVABLE_MAP[model_id];
        if (lovableModelId) {
          console.log(`[hydra-stream] ProxyAPI/Anthropic 404 fallback: ${model_id} -> ${lovableModelId}`);
          return streamLovableAI({ ...params, model_id: lovableModelId });
        }
      }

      return new Response(
        JSON.stringify({ error: `ProxyAPI error: ${errorText}` }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    console.log("[hydra-stream] ProxyAPI/Anthropic streaming started");
    return new Response(response.body, { headers: SSE_HEADERS });
  }

  // OpenAI-compatible format (OpenAI, Google, DeepSeek via ProxyAPI)
  const isReasoning = realModel === "deepseek-reasoner" || realModel === "o1-mini";

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${keyResult.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: realModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      stream: true,
      temperature: isReasoning ? undefined : temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[hydra-stream] ProxyAPI error:", response.status, errorText);

    // Fallback to Lovable AI if ProxyAPI returns 404 (model not available)
    if (response.status === 404) {
      const lovableModelId = PROXYAPI_TO_LOVABLE_MAP[model_id];
      if (lovableModelId) {
        console.log(`[hydra-stream] ProxyAPI 404 fallback: ${model_id} -> ${lovableModelId}`);
        return streamLovableAI({ ...params, model_id: lovableModelId });
      }
    }

    return new Response(
      JSON.stringify({ error: `ProxyAPI error: ${errorText}` }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  console.log("[hydra-stream] ProxyAPI streaming started");
  return new Response(response.body, { headers: SSE_HEADERS });
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
    ? "https://api.proxyapi.ru/openai/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";

  const extraHeaders: Record<string, string> = useProxyApi
    ? {}
    : { "HTTP-Referer": "https://ai-hydra.lovable.app", "X-Title": "Hydra AI" };

  console.log(`[hydra-stream] OpenRouter streaming: model=${model_id}, via=${useProxyApi ? "ProxyAPI" : "OpenRouter"}`);

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${effectiveKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({
      model: model_id,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      stream: true,
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const label = useProxyApi ? "ProxyAPI" : "OpenRouter";
    console.error(`[hydra-stream] ${label} error:`, response.status, errorText);
    return new Response(
      JSON.stringify({ error: `${label} error: ${response.status}` }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  console.log(`[hydra-stream] OpenRouter streaming started via ${useProxyApi ? "ProxyAPI" : "OpenRouter"}`);
  return new Response(response.body, { headers: SSE_HEADERS });
}
