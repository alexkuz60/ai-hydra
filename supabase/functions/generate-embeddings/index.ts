import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// ============================================
// Embedding Generation Edge Function
// Uses user's OpenAI API key for vector embeddings
// (Lovable AI Gateway does not support embedding models)
// ============================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmbeddingRequest {
  texts: string[];
  model?: string;
}

interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { texts, model = "text-embedding-3-small" }: EmbeddingRequest = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'texts' array" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Validate text lengths (max ~8000 tokens per text for embedding models)
    const MAX_CHARS = 30000; // Approximate limit
    for (let i = 0; i < texts.length; i++) {
      if (texts[i].length > MAX_CHARS) {
        return new Response(
          JSON.stringify({ error: `Text at index ${i} exceeds maximum length of ${MAX_CHARS} characters` }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
    }

    // Get user's OpenAI API key from authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client to get user's API key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Get user's OpenAI API key from vault using service role
    // We need to call the RPC as the user, so create a user-scoped client
    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: apiKeys, error: keysError } = await userSupabase
      .rpc("get_my_api_keys");

    if (keysError) {
      console.error("[generate-embeddings] Error fetching API keys:", keysError);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve API keys" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // apiKeys is an array, get the first result
    const keyData = Array.isArray(apiKeys) ? apiKeys[0] : apiKeys;
    const openaiKey = keyData?.openai_api_key as string | undefined;
    
    if (!openaiKey) {
      // Return null embeddings gracefully - embeddings are optional
      console.log("[generate-embeddings] No OpenAI API key configured, skipping embedding generation");
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

    console.log(`[generate-embeddings] Generating embeddings for ${texts.length} text(s), model=${model}`);

    // Call OpenAI embeddings endpoint directly
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        input: texts,
      }),
    });

    // Handle API errors
    if (!response.ok) {
      if (response.status === 429) {
        console.error("[generate-embeddings] Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        console.error("[generate-embeddings] Invalid OpenAI API key");
        return new Response(
          JSON.stringify({ error: "Invalid OpenAI API key. Please check your API key in Profile settings." }),
          { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("[generate-embeddings] OpenAI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status}`, details: errorText }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract embeddings from OpenAI response format
    const embeddings: number[][] = data.data.map((item: { embedding: number[] }) => item.embedding);
    
    const result: EmbeddingResponse = {
      embeddings,
      model: data.model,
      usage: data.usage,
    };

    console.log(`[generate-embeddings] Successfully generated ${embeddings.length} embedding(s), dimensions=${embeddings[0]?.length || 0}`);

    return new Response(
      JSON.stringify(result),
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
