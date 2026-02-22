import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PROXYAPI_URL = "https://openai.api.proxyapi.ru/v1/chat/completions";

// ProxyAPI maps imported from shared module
import { PROXYAPI_MODEL_MAP, resolveProxyApiModel, detectModelType, getEndpointForType, buildTestPayload, type ProxyModelType } from "../_shared/proxyapi.ts";

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
      // Allow client to override detected type
      const modelType: ProxyModelType = body.model_type || detectModelType(model_id);

      // STT requires audio file upload — not testable automatically
      if (modelType === "stt" || modelType === "image_edit") {
        return new Response(JSON.stringify({
          status: "skipped",
          model_type: modelType,
          message: modelType === "stt"
            ? "STT models require audio file upload — manual testing needed"
            : "Image edit models require image upload — manual testing needed",
        }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      const endpointPath = getEndpointForType(modelType);
      const baseUrl = "https://openai.api.proxyapi.ru";
      const testUrl = `${baseUrl}${endpointPath}`;
      const payload = buildTestPayload(realModel, modelType);
      const start = Date.now();

      try {
        const resp = await fetch(testUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${proxyapiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30_000),
        });

        const latency = Date.now() - start;

        if (resp.ok) {
          // Different model types return different response shapes
          let content = "";
          let tokensIn = 0;
          let tokensOut = 0;

          if (modelType === "tts") {
            // TTS returns binary audio — just confirm 200
            content = `[audio ${resp.headers.get("content-type") || "binary"}]`;
            // Consume body
            await resp.arrayBuffer();
          } else if (modelType === "image") {
            const data = await resp.json();
            content = data.data?.[0]?.url ? "[image generated]" : "[ok]";
          } else if (modelType === "embedding") {
            const data = await resp.json();
            const dims = data.data?.[0]?.embedding?.length || 0;
            content = `[embedding ${dims}d]`;
            tokensIn = data.usage?.prompt_tokens || 0;
          } else {
            const data = await resp.json();
            content = data.choices?.[0]?.message?.content || "";
            tokensIn = data.usage?.prompt_tokens || 0;
            tokensOut = data.usage?.completion_tokens || 0;
          }

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
            model_type: modelType,
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
