import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  callLLM,
  assessSemanticSimilarity,
  getUserOpenRouterKey,
  TRANSLATION_MODEL,
  HYDRA_GLOSSARY,
} from "../_shared/translation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody { text: string; targetLang: string; }

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLang }: RequestBody = await req.json();

    if (!text || !targetLang) {
      return new Response(
        JSON.stringify({ error: "text and targetLang are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY") || null;
    const openrouterKey = await getUserOpenRouterKey(req.headers.get("Authorization"));

    const systemPrompt = `You are a professional technical translator for the Hydra AI platform. Translate the following text to ${targetLang}. Return ONLY the translation, without any explanations or additional text. Preserve the original formatting, line breaks, and Markdown.
${HYDRA_GLOSSARY}`;

    // Translate
    let translation: string | null = null;
    let gateway = "none";

    try {
      translation = await callLLM(
        [{ role: "system", content: systemPrompt }, { role: "user", content: text }],
        8192, openrouterKey, lovableKey, TRANSLATION_MODEL
      );
      gateway = openrouterKey ? "openrouter" : "lovable_ai";
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === "RATE_LIMIT") {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (e.message === "PAYMENT_REQUIRED") {
          return new Response(
            JSON.stringify({ error: "Payment required" }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      throw e;
    }

    if (!translation) {
      return new Response(
        JSON.stringify({ error: "All translation providers failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Semantic verification
    let cosineSimilarity: number | null = null;
    try {
      const score = await assessSemanticSimilarity(text, translation, openrouterKey, lovableKey);
      if (score >= 0) {
        cosineSimilarity = score;
        console.log(`[translate-text] Semantic score: ${score.toFixed(4)}, gateway=${gateway}, len=${translation.length}`);
        if (score < 0.85) {
          console.warn(`[translate-text] Below 0.85 threshold: ${score.toFixed(4)}`);
        }
      }
    } catch (semErr) {
      console.error("[translate-text] Semantic verification failed (non-fatal):", semErr);
    }

    return new Response(
      JSON.stringify({ translation, gateway, cosineSimilarity }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translate error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
