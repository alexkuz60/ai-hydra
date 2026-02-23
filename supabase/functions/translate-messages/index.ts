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
const SEMANTIC_THRESHOLD = 0.70;

const SYSTEM_PROMPT = `You are a professional translator specializing in AI/ML and software development terminology.
Translate the following text from Russian to English.
Preserve all markdown formatting, code blocks, technical terms, and structure.
Glossary: Техно-Арбитр → Techno-Arbiter, ОТК → QCD (Quality Control Department), Логистик → Logistician, Архивариус → Archivist, Штаб → HQ (War Room), Конкурс → Contest, Дуэль → Duel, Гидрапедия → Hydrapedia.
Output ONLY the translation, nothing else.`;

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
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      } else {
        console.warn(`[translate-messages] LLM OpenRouter ${resp.status}`);
      }
    } catch (e) {
      console.warn("[translate-messages] LLM OpenRouter error:", e);
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
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      } else {
        console.warn(`[translate-messages] LLM Lovable ${resp.status}`);
      }
    } catch (e) {
      console.warn("[translate-messages] LLM Lovable error:", e);
    }
  }
  return null;
}

/** Assess semantic similarity for a batch of original→translation pairs */
async function assessSemanticSimilarity(
  pairs: Array<{ original: string; translation: string }>,
  openrouterKey: string | null,
  lovableKey: string | null
): Promise<number[]> {
  const numbered = pairs.map((p, i) =>
    `[${i}] ORIGINAL: ${p.original.slice(0, 500)}\nTRANSLATION: ${p.translation.slice(0, 500)}`
  ).join("\n---\n");

  const result = await callLLM(
    [
      {
        role: "system",
        content: `You are a semantic similarity judge. For each numbered pair of ORIGINAL and TRANSLATION, rate how well the translation preserves the meaning on a scale from 0.0 to 1.0 (1.0 = perfect, 0.85 = good, below 0.7 = significant loss).
Return ONLY a JSON array of numbers in the same order. No explanations.`,
      },
      { role: "user", content: numbered },
    ],
    1024,
    openrouterKey,
    lovableKey,
    SEMANTIC_MODEL
  );

  if (!result) return pairs.map(() => -1);

  try {
    const jsonMatch = result.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed.map((v: number) => Math.round(v * 10000) / 10000);
    }
  } catch (e) {
    console.warn("[translate-messages] Failed to parse similarity scores:", e);
  }
  return pairs.map(() => -1);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY") || null;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const { batchSize = 3, targetLang = "en" } = await req.json().catch(() => ({}));

    // Fetch untranslated messages
    const { data: messages, error: fetchErr } = await supabase
      .from("messages")
      .select("id, content, role")
      .is("content_en", null)
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (fetchErr) throw fetchErr;
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ translated: 0, remaining: 0, message: "All messages already translated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's OpenRouter key
    const { data: apiKeys } = await supabase.rpc("get_my_api_keys");
    const keyData = Array.isArray(apiKeys) ? apiKeys[0] : apiKeys;
    const openrouterKey = (keyData?.openrouter_api_key as string) || null;

    const gateway = openrouterKey ? "openrouter" : "lovable_ai";
    console.log(`[translate-messages] Gateway: ${gateway}, batch: ${messages.length}`);

    // Translate each message
    const results: Array<{ id: string; content_en: string; role: string }> = [];

    for (const msg of messages) {
      const text = msg.content.length > 4000 ? msg.content.slice(0, 4000) : msg.content;
      
      let translation: string | null = null;
      if (openrouterKey) {
        translation = await callLLM(
          [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: text }],
          4096, openrouterKey, null, TRANSLATION_MODEL
        );
      }
      if (!translation && lovableKey) {
        translation = await callLLM(
          [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: text }],
          4096, null, lovableKey, "google/gemini-2.5-flash-lite"
        );
      }

      if (translation) {
        results.push({ id: msg.id, content_en: translation, role: msg.role });
      }
    }

    // Semantic verification
    let semanticScores: number[] = [];
    if (results.length > 0) {
      try {
        const pairs = results.map(r => {
          const orig = messages.find(m => m.id === r.id);
          return { original: orig?.content || "", translation: r.content_en };
        });
        semanticScores = await assessSemanticSimilarity(pairs, openrouterKey, lovableKey);
        
        const avgScore = semanticScores.filter(s => s >= 0).reduce((a, b) => a + b, 0) / Math.max(semanticScores.filter(s => s >= 0).length, 1);
        console.log(`[translate-messages] Semantic avg: ${avgScore.toFixed(4)}`);

        // Flag low-quality translations
        const lowQuality = semanticScores.filter(s => s >= 0 && s < SEMANTIC_THRESHOLD);
        if (lowQuality.length > 0) {
          console.warn(`[translate-messages] ${lowQuality.length} translation(s) below ${SEMANTIC_THRESHOLD} threshold`);
        }
      } catch (semErr) {
        console.error("[translate-messages] Semantic verification failed (non-fatal):", semErr);
        semanticScores = results.map(() => -1);
      }
    }

    // Save translations (skip those below threshold)
    let savedCount = 0;
    let skippedCount = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const score = semanticScores[i] ?? -1;

      // Skip saving if score is known and below threshold
      if (score >= 0 && score < SEMANTIC_THRESHOLD) {
        console.warn(`[translate-messages] Skipping ${r.id}: semantic score ${score} < ${SEMANTIC_THRESHOLD}`);
        skippedCount++;
        continue;
      }

      const { error: updateErr } = await supabase
        .from("messages")
        .update({ content_en: r.content_en })
        .eq("id", r.id);

      if (!updateErr) savedCount++;
      else console.error(`Failed to save ${r.id}:`, updateErr);
    }

    // Count remaining
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .is("content_en", null);

    return new Response(JSON.stringify({
      translated: savedCount,
      skipped: skippedCount,
      remaining: count || 0,
      gateway,
      semanticScores: results.map((r, i) => ({ id: r.id, score: semanticScores[i] ?? -1 })),
      avgSimilarity: semanticScores.filter(s => s >= 0).length > 0
        ? semanticScores.filter(s => s >= 0).reduce((a, b) => a + b, 0) / semanticScores.filter(s => s >= 0).length
        : null,
      details: results
        .filter((_, i) => (semanticScores[i] ?? -1) < 0 || (semanticScores[i] ?? 0) >= SEMANTIC_THRESHOLD)
        .map(r => ({ id: r.id, role: r.role, preview: r.content_en.slice(0, 100) })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-messages error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
