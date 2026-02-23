import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TRANSLATION_MODEL = "google/gemini-2.5-flash";

interface TranslateItem { id: string; text: string; }
interface RequestBody { items: TranslateItem[]; targetLang: string; verifySemantic?: boolean; }
interface TranslatedItem { id: string; translation: string; cosineSimilarity?: number; }

const HYDRA_GLOSSARY = `Key Hydra glossary: Штат=Staff, Роль=Role, Конкурс=Contest, Дуэль=Duel, Собеседование=Interview, Оркестратор=Orchestrator, Арбитр=Arbiter, Промпт=Prompt, Эволюция=Evolution, Хроника=Chronicle, ОТК=QC Dept, Память=Memory, Знание=Knowledge, Инструмент=Tool, Поток=Flow, Шлюз=Gateway.`;

/** Call LLM with OpenRouter-first, Lovable AI fallback */
async function callLLM(
  messages: { role: string; content: string }[],
  maxTokens: number,
  openrouterKey: string | null,
  lovableKey: string | null,
  model?: string
): Promise<{ content: string; gateway: string } | null> {
  // 1. Try OpenRouter
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
        const content = data.choices?.[0]?.message?.content;
        if (content) return { content, gateway: "openrouter" };
      } else {
        console.warn(`[translate-batch] OpenRouter ${resp.status}`);
      }
    } catch (e) {
      console.warn("[translate-batch] OpenRouter error:", e);
    }
  }

  // 2. Fallback to Lovable AI
  if (lovableKey) {
    try {
      const resp = await fetch(LOVABLE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || "google/gemini-2.5-flash",
          messages,
          max_completion_tokens: maxTokens,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return { content, gateway: "lovable_ai" };
      } else {
        console.warn(`[translate-batch] Lovable AI ${resp.status}`);
      }
    } catch (e) {
      console.warn("[translate-batch] Lovable AI error:", e);
    }
  }

  return null;
}

/** LLM-based semantic similarity assessment (0-1 scale) */
async function assessSemanticSimilarity(
  pairs: Array<{ original: string; translation: string }>,
  openrouterKey: string | null,
  lovableKey: string | null
): Promise<number[]> {
  const numbered = pairs.map((p, i) =>
    `[${i}] ORIGINAL: ${p.original}\nTRANSLATION: ${p.translation}`
  ).join("\n---\n");

  const result = await callLLM(
    [
      {
        role: "system",
        content: `You are a semantic similarity judge. For each numbered pair of ORIGINAL and TRANSLATION, rate how well the translation preserves the meaning on a scale from 0.0 to 1.0 (where 1.0 = perfect semantic preservation, 0.85 = good, below 0.7 = significant meaning loss).
Return ONLY a JSON array of numbers in the same order. No explanations.`,
      },
      { role: "user", content: numbered },
    ],
    1024,
    openrouterKey,
    lovableKey,
    openrouterKey ? "google/gemini-2.5-flash-lite" : "google/gemini-2.5-flash-lite"
  );

  if (!result) return pairs.map(() => -1);

  try {
    const jsonMatch = result.content.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed.map((v: number) => Math.round(v * 10000) / 10000);
    }
  } catch (e) {
    console.warn("Failed to parse similarity scores:", e);
  }

  return pairs.map(() => -1);
}

/** Translate a batch of texts in a single LLM call */
async function translateBatch(
  texts: string[],
  targetLang: string,
  openrouterKey: string | null,
  lovableKey: string | null
): Promise<{ translations: string[]; gateway: string }> {
  const numbered = texts.map((t, i) => `[${i}] ${t}`).join("\n---\n");

  const result = await callLLM(
    [
      {
        role: "system",
        content: `You are a professional technical translator for the Hydra AI platform. Translate each numbered block to ${targetLang}. 
Return ONLY a JSON array of strings in the same order, no explanations.
Preserve Markdown formatting, line breaks, and technical terms.
${HYDRA_GLOSSARY}`,
      },
      { role: "user", content: numbered },
    ],
    16384,
    openrouterKey,
    lovableKey
  );

  if (!result) throw new Error("All translation providers failed");

  // Parse JSON array from response
  try {
    const jsonMatch = result.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length === texts.length) {
        return { translations: parsed, gateway: result.gateway };
      }
    }
  } catch (e) {
    console.warn("Failed to parse batch response as JSON, falling back to line split:", e);
  }

  // Fallback: split by delimiter
  const lines = result.content.split(/\n---\n|\n\[\d+\]\s*/g).filter((l: string) => l.trim());
  if (lines.length === texts.length) return { translations: lines, gateway: result.gateway };

  console.warn("Batch parse failed, texts:", texts.length, "got:", lines.length);
  throw new Error("Batch translation parsing failed");
}

const BATCH_SIZE = 8;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, targetLang, verifySemantic }: RequestBody = await req.json();

    if (!items?.length || !targetLang) {
      return new Response(
        JSON.stringify({ error: "items[] and targetLang are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (items.length > 50) {
      return new Response(
        JSON.stringify({ error: "Maximum 50 items per batch" }),
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

    if (!openrouterKey && !lovableKey) {
      return new Response(
        JSON.stringify({ error: "No API keys available for translation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[translate-batch] ${items.length} items, hasOR=${!!openrouterKey}, hasLovable=${!!lovableKey}`);

    // Translate in batches
    const allTranslations: string[] = [];
    let usedGateway = "unknown";
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const texts = batch.map((it) => it.text);
      const { translations, gateway } = await translateBatch(texts, targetLang, openrouterKey, lovableKey);
      allTranslations.push(...translations);
      usedGateway = gateway;
    }

    // Build results
    const results: TranslatedItem[] = items.map((item, idx) => ({
      id: item.id,
      translation: allTranslations[idx],
    }));

    // Semantic verification
    if (verifySemantic && items.length <= 20) {
      try {
        const pairs = items.map((item, idx) => ({
          original: item.text,
          translation: allTranslations[idx],
        }));
        const scores = await assessSemanticSimilarity(pairs, openrouterKey, lovableKey);
        scores.forEach((score, idx) => {
          if (score >= 0) results[idx].cosineSimilarity = score;
        });
      } catch (semErr) {
        console.error("Semantic verification failed (non-fatal):", semErr);
      }
    }

    const avgSimilarity = results.filter(r => r.cosineSimilarity != null).length > 0
      ? results.reduce((sum, r) => sum + (r.cosineSimilarity || 0), 0) / results.filter(r => r.cosineSimilarity != null).length
      : null;

    console.log(`[translate-batch] Done: ${items.length} items, gateway=${usedGateway}, avg similarity=${avgSimilarity?.toFixed(4) ?? 'N/A'}`);

    return new Response(
      JSON.stringify({ results, avgCosineSimilarity: avgSimilarity, gateway: usedGateway }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("translate-batch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
