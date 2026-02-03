import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ============================================
// Embedding Generation Edge Function
// Uses Lovable AI Gateway for vector embeddings
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

    // Get Lovable AI API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-embeddings] Generating embeddings for ${texts.length} text(s), model=${model}`);

    // Call Lovable AI embeddings endpoint
    const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
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
      if (response.status === 402) {
        console.error("[generate-embeddings] Payment required");
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("[generate-embeddings] AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI gateway error: ${response.status}`, details: errorText }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract embeddings from OpenAI-compatible response format
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
