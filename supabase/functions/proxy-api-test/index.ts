import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PROXYAPI_URL = "https://openai.api.proxyapi.ru/v1/chat/completions";

// ProxyAPI maps imported from shared module
import { PROXYAPI_MODEL_MAP, resolveProxyApiModel } from "../_shared/proxyapi.ts";

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
      const realModel = resolveProxyApiModel(model_id);
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

    if (action === "models") {
      // Fetch full model catalog from ProxyAPI
      try {
        const resp = await fetch("https://openai.api.proxyapi.ru/v1/models", {
          headers: { Authorization: `Bearer ${proxyapiKey}` },
          signal: AbortSignal.timeout(15_000),
        });
        if (!resp.ok) {
          return new Response(JSON.stringify({ error: `HTTP ${resp.status}` }), {
            status: resp.status,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }
        const data = await resp.json();
        // Return simplified model list: { id, owned_by, created }
        const models = (data?.data || []).map((m: Record<string, unknown>) => ({
          id: m.id as string,
          owned_by: (m.owned_by as string) || "unknown",
          created: m.created as number | undefined,
        }));
        return new Response(JSON.stringify({ models, total: models.length }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500,
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
