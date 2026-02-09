import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PROXYAPI_URL = "https://openai.api.proxyapi.ru/v1/chat/completions";

/** ProxyAPI model ID → real model mapping */
const PROXYAPI_MODEL_MAP: Record<string, string> = {
  "proxyapi/gpt-4o": "openai/gpt-4o",
  "proxyapi/gpt-4o-mini": "openai/gpt-4o-mini",
  "proxyapi/o3-mini": "openai/o3-mini",
  "proxyapi/gpt-5": "openai/gpt-5",
  "proxyapi/gpt-5-mini": "openai/gpt-5-mini",
  "proxyapi/gpt-5.2": "openai/gpt-5.2",
  "proxyapi/gpt-oss-20b": "openai/gpt-oss-20b",
  "proxyapi/gpt-oss-120b": "openai/gpt-oss-120b",
  "proxyapi/claude-sonnet-4": "anthropic/claude-sonnet-4-20250514",
  "proxyapi/claude-opus-4": "anthropic/claude-opus-4-6",
  "proxyapi/claude-3-5-sonnet": "anthropic/claude-3-5-sonnet-20241022",
  "proxyapi/claude-3-5-haiku": "anthropic/claude-3-5-haiku-20241022",
  "proxyapi/gemini-3-pro-preview": "gemini/gemini-3-pro-preview",
  "proxyapi/gemini-3-flash-preview": "gemini/gemini-3-flash-preview",
  "proxyapi/gemini-2.5-pro": "gemini/gemini-2.5-pro",
  "proxyapi/gemini-2.5-flash": "gemini/gemini-2.5-flash",
  "proxyapi/gemini-2.0-flash": "gemini/gemini-2.0-flash",
  "proxyapi/deepseek-chat": "deepseek/deepseek-chat",
  "proxyapi/deepseek-reasoner": "deepseek/deepseek-reasoner",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, model_id } = body;

    // Get user's ProxyAPI key
    const { data: apiKeys } = await supabase.rpc("get_my_api_keys").single();
    const proxyapiKey = (apiKeys as Record<string, string | null>)?.proxyapi_api_key;

    if (!proxyapiKey) {
      return new Response(JSON.stringify({ error: "ProxyAPI key not configured" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (action === "ping") {
      // Simple connectivity check — lightweight models endpoint
      const start = Date.now();
      try {
        const resp = await fetch("https://openai.api.proxyapi.ru/v1/models", {
          headers: { Authorization: `Bearer ${proxyapiKey}` },
          signal: AbortSignal.timeout(10_000),
        });
        const latency = Date.now() - start;

        if (resp.ok) {
          const data = await resp.json();
          const modelCount = data?.data?.length || 0;
          return new Response(JSON.stringify({ status: "online", latency_ms: latency, model_count: modelCount }), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        } else {
          const errText = await resp.text();
          // Log to proxy_api_logs
          await supabase.from("proxy_api_logs").insert({
            user_id: user.id,
            model_id: "ping",
            provider: "proxyapi",
            request_type: "ping",
            status: "error",
            latency_ms: latency,
            error_message: `${resp.status}: ${errText.slice(0, 200)}`,
          });
          return new Response(JSON.stringify({ status: "error", latency_ms: latency, error: `HTTP ${resp.status}` }), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }
      } catch (err) {
        const latency = Date.now() - start;
        await supabase.from("proxy_api_logs").insert({
          user_id: user.id,
          model_id: "ping",
          provider: "proxyapi",
          request_type: "ping",
          status: "timeout",
          latency_ms: latency,
          error_message: String(err),
        });
        return new Response(JSON.stringify({ status: "timeout", latency_ms: latency }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "test" && model_id) {
      // Test a specific model with a minimal request
      const realModel = PROXYAPI_MODEL_MAP[model_id] || model_id.replace("proxyapi/", "");
      const isOpenAI = realModel.startsWith("openai/");
      const start = Date.now();

      try {
        const resp = await fetch(PROXYAPI_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${proxyapiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: realModel,
            messages: [{ role: "user", content: "Say hi in 3 words." }],
            max_tokens: isOpenAI ? undefined : 30,
            ...(isOpenAI ? { max_completion_tokens: 30 } : {}),
            stream: false,
          }),
          signal: AbortSignal.timeout(30_000),
        });

        const latency = Date.now() - start;

        if (resp.ok) {
          const data = await resp.json();
          const content = data.choices?.[0]?.message?.content || "";
          const tokensIn = data.usage?.prompt_tokens || 0;
          const tokensOut = data.usage?.completion_tokens || 0;

          await supabase.from("proxy_api_logs").insert({
            user_id: user.id,
            model_id,
            provider: "proxyapi",
            request_type: "test",
            status: "success",
            latency_ms: latency,
            tokens_input: tokensIn,
            tokens_output: tokensOut,
          });

          return new Response(JSON.stringify({
            status: "success",
            latency_ms: latency,
            content,
            tokens: { input: tokensIn, output: tokensOut },
          }), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        } else if (resp.status === 410) {
          await supabase.from("proxy_api_logs").insert({
            user_id: user.id,
            model_id,
            provider: "proxyapi",
            request_type: "test",
            status: "gone",
            latency_ms: latency,
            error_message: "HTTP 410 Gone — model permanently removed",
          });
          return new Response(JSON.stringify({
            status: "gone",
            latency_ms: latency,
            error: "Model permanently removed from ProxyAPI",
          }), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        } else {
          const errText = await resp.text();
          await supabase.from("proxy_api_logs").insert({
            user_id: user.id,
            model_id,
            provider: "proxyapi",
            request_type: "test",
            status: "error",
            latency_ms: latency,
            error_message: `${resp.status}: ${errText.slice(0, 500)}`,
          });
          return new Response(JSON.stringify({
            status: "error",
            latency_ms: latency,
            error: `HTTP ${resp.status}`,
            details: errText.slice(0, 500),
          }), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }
      } catch (err) {
        const latency = Date.now() - start;
        await supabase.from("proxy_api_logs").insert({
          user_id: user.id,
          model_id,
          provider: "proxyapi",
          request_type: "test",
          status: "timeout",
          latency_ms: latency,
          error_message: String(err),
        });
        return new Response(JSON.stringify({ status: "timeout", latency_ms: latency }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
