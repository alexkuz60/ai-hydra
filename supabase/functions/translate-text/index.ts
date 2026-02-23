import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TRANSLATION_MODEL = "google/gemini-2.5-flash";

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

    // Get user's OpenRouter key
    let openrouterKey: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: apiKeys } = await supabase.rpc("get_my_api_keys");
      const keyData = Array.isArray(apiKeys) ? apiKeys[0] : apiKeys;
      openrouterKey = (keyData?.openrouter_api_key as string) || null;
    }

    const systemPrompt = `You are a professional translator. Translate the following text to ${targetLang}. Return ONLY the translation, without any explanations or additional text. Preserve the original formatting and line breaks.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ];

    let translation: string | null = null;
    let gateway = "none";

    // 1. Try OpenRouter (primary — fast)
    if (openrouterKey) {
      try {
        const resp = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai-hydra.lovable.app",
            "X-Title": "Hydra Translator",
          },
          body: JSON.stringify({ model: TRANSLATION_MODEL, messages, max_tokens: 8192, temperature: 0.1 }),
        });
        if (resp.ok) {
          const data = await resp.json();
          translation = data.choices?.[0]?.message?.content || null;
          if (translation) gateway = "openrouter";
        } else {
          console.warn(`[translate-text] OpenRouter ${resp.status}`);
          if (resp.status === 429) {
            // Don't fallback on rate limit — propagate
            return new Response(
              JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } catch (e) {
        console.warn("[translate-text] OpenRouter error:", e);
      }
    }

    // 2. Fallback to Lovable AI
    if (!translation && lovableKey) {
      try {
        const resp = await fetch(LOVABLE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: "google/gemini-2.5-flash-lite", messages, max_completion_tokens: 8192 }),
        });
        if (resp.ok) {
          const data = await resp.json();
          translation = data.choices?.[0]?.message?.content || null;
          if (translation) gateway = "lovable_ai";
        } else {
          if (resp.status === 429) {
            return new Response(
              JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (resp.status === 402) {
            return new Response(
              JSON.stringify({ error: "Payment required" }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          console.warn(`[translate-text] Lovable AI ${resp.status}`);
        }
      } catch (e) {
        console.warn("[translate-text] Lovable AI error:", e);
      }
    }

    if (!translation) {
      return new Response(
        JSON.stringify({ error: "All translation providers failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[translate-text] OK via ${gateway}, len=${translation.length}`);

    return new Response(
      JSON.stringify({ translation, gateway }),
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
