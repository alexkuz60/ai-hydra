import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TRANSLATION_MODEL = "google/gemini-2.5-flash";
const SEMANTIC_MODEL = "google/gemini-2.5-flash-lite";

const HYDRA_GLOSSARY = `Key Hydra glossary: Штат=Staff, Роль=Role, Конкурс=Contest, Дуэль=Duel, Собеседование=Interview, Оркестратор=Orchestrator, Арбитр=Arbiter, Промпт=Prompt, Эволюция=Evolution, Хроника=Chronicle, ОТК=QC Dept, Память=Memory, Знание=Knowledge, Инструмент=Tool, Поток=Flow, Шлюз=Gateway, Техно-Арбитр=Techno-Arbiter, Логистик=Logistician, Архивариус=Archivist, Штаб=HQ (War Room), Гидрапедия=Hydrapedia.`;

interface RequestBody { text: string; targetLang: string; }

/** Call LLM with OpenRouter-first, Lovable AI fallback */
async function callLLM(
  messages: { role: string; content: string }[],
  maxTokens: number,
  openrouterKey: string | null,
  lovableKey: string | null,
  model?: string
): Promise<string | null> {
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
        body: JSON.stringify({
          model: model || TRANSLATION_MODEL,
          messages,
          max_tokens: maxTokens,
          temperature: 0.1,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.choices?.[0]?.message?.content || null;
      }
      console.warn(`[translate-text] LLM OpenRouter ${resp.status}`);
      if (resp.status === 429) throw new Error("RATE_LIMIT");
    } catch (e) {
      if (e instanceof Error && e.message === "RATE_LIMIT") throw e;
      console.warn("[translate-text] LLM OpenRouter error:", e);
    }
  }
  if (lovableKey) {
    try {
      const resp = await fetch(LOVABLE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || SEMANTIC_MODEL,
          messages,
          max_completion_tokens: maxTokens,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.choices?.[0]?.message?.content || null;
      }
      if (resp.status === 429) throw new Error("RATE_LIMIT");
      if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
      console.warn(`[translate-text] LLM Lovable ${resp.status}`);
    } catch (e) {
      if (e instanceof Error && (e.message === "RATE_LIMIT" || e.message === "PAYMENT_REQUIRED")) throw e;
      console.warn("[translate-text] LLM Lovable error:", e);
    }
  }
  return null;
}

/** Assess semantic similarity between original and translation */
async function assessSemanticSimilarity(
  original: string,
  translation: string,
  openrouterKey: string | null,
  lovableKey: string | null
): Promise<number> {
  const result = await callLLM(
    [
      {
        role: "system",
        content: `You are a semantic similarity judge. Rate how well the TRANSLATION preserves the meaning of the ORIGINAL on a scale from 0.0 to 1.0 (1.0 = perfect, 0.85 = good, below 0.7 = significant loss).
Return ONLY a single number. No explanations.`,
      },
      {
        role: "user",
        content: `ORIGINAL: ${original.slice(0, 1000)}\nTRANSLATION: ${translation.slice(0, 1000)}`,
      },
    ],
    64,
    openrouterKey,
    lovableKey,
    SEMANTIC_MODEL
  );

  if (!result) return -1;

  try {
    const num = parseFloat(result.trim());
    if (!isNaN(num) && num >= 0 && num <= 1) return Math.round(num * 10000) / 10000;
  } catch { /* ignore */ }

  return -1;
}

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
