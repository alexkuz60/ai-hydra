import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// ============================================
// Embedding Generation Edge Function
// Primary: OpenRouter (user's key) — supports many embedding models
// Fallback: OpenAI (user's key), Lovable AI Gateway
// ============================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings";
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

// Default embedding model on OpenRouter (cheap, fast, good quality)
const DEFAULT_OPENROUTER_MODEL = "openai/text-embedding-3-small";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { texts, model }: { texts: string[]; model?: string } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'texts' array" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const MAX_CHARS = 30000;
    for (let i = 0; i < texts.length; i++) {
      if (texts[i].length > MAX_CHARS) {
        return new Response(
          JSON.stringify({ error: `Text at index ${i} exceeds maximum length` }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
    }

    // Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's API keys
    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: apiKeys } = await userSupabase.rpc("get_my_api_keys");
    const keyData = Array.isArray(apiKeys) ? apiKeys[0] : apiKeys;
    const openrouterKey = keyData?.openrouter_api_key as string | undefined;
    const openaiKey = keyData?.openai_api_key as string | undefined;

    if (!openrouterKey && !openaiKey) {
      console.log("[generate-embeddings] No API keys available for embeddings");
      return new Response(
        JSON.stringify({
          embeddings: texts.map(() => null),
          model: null,
          usage: null,
          skipped: true,
          reason: "no_api_key"
        }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const embeddingModel = model || DEFAULT_OPENROUTER_MODEL;
    const BATCH_SIZE = 20;
    const allEmbeddings: (number[] | null)[] = [];
    let usedModel = embeddingModel;

    console.log(`[generate-embeddings] ${texts.length} text(s), model=${embeddingModel}, hasOR=${!!openrouterKey}, hasOAI=${!!openaiKey}`);

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      let embeddings: (number[] | null)[] | null = null;

      // 1. Try OpenRouter (primary)
      if (openrouterKey && !embeddings) {
        try {
          const resp = await fetch(OPENROUTER_EMBEDDINGS_URL, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openrouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://ai-hydra.lovable.app",
              "X-Title": "Hydra Knowledge Base",
            },
            body: JSON.stringify({ model: embeddingModel, input: batch }),
          });

          if (resp.ok) {
            const data = await resp.json();
            embeddings = data.data.map((item: { embedding: number[] }) => item.embedding);
            usedModel = data.model || embeddingModel;
            console.log(`[generate-embeddings] OpenRouter batch ${i / BATCH_SIZE + 1}: OK, dims=${embeddings![0]?.length || 0}`);
          } else {
            const errText = await resp.text();
            console.warn(`[generate-embeddings] OpenRouter ${resp.status}: ${errText.slice(0, 200)}`);
          }
        } catch (e) {
          console.warn("[generate-embeddings] OpenRouter error:", e);
        }
      }

      // 2. Fallback: OpenAI
      if (!embeddings && openaiKey) {
        try {
          const resp = await fetch(OPENAI_EMBEDDINGS_URL, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openaiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ model: "text-embedding-3-small", input: batch }),
          });

          if (resp.ok) {
            const data = await resp.json();
            embeddings = data.data.map((item: { embedding: number[] }) => item.embedding);
            usedModel = data.model || "text-embedding-3-small";
          } else {
            console.warn(`[generate-embeddings] OpenAI fallback ${resp.status}`);
          }
        } catch (e) {
          console.warn("[generate-embeddings] OpenAI fallback error:", e);
        }
      }

      // 3. If both failed, nulls
      if (embeddings) {
        allEmbeddings.push(...embeddings);
      } else {
        allEmbeddings.push(...batch.map(() => null));
      }
    }

    const successCount = allEmbeddings.filter(e => e !== null).length;
    console.log(`[generate-embeddings] Done: ${successCount}/${texts.length}, dims=${allEmbeddings.find(e => e)?.length || 0}, model=${usedModel}`);

    return new Response(
      JSON.stringify({
        embeddings: allEmbeddings,
        model: usedModel,
        usage: null,
        skipped: successCount === 0,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-embeddings] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
