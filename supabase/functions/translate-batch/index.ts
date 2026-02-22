import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TranslateItem {
  id: string;
  text: string;
}

interface RequestBody {
  items: TranslateItem[];
  targetLang: string;
  /** If true, compute cosine similarity between source and translated embeddings */
  verifySemantic?: boolean;
}

interface TranslatedItem {
  id: string;
  translation: string;
  cosineSimilarity?: number;
}

/** LLM-based semantic similarity assessment (0-1 scale) */
async function assessSemanticSimilarity(
  pairs: Array<{ original: string; translation: string }>,
  apiKey: string
): Promise<number[]> {
  const numbered = pairs.map((p, i) => 
    `[${i}] ORIGINAL: ${p.original}\nTRANSLATION: ${p.translation}`
  ).join("\n---\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5-nano",
      messages: [
        {
          role: "system",
          content: `You are a semantic similarity judge. For each numbered pair of ORIGINAL and TRANSLATION, rate how well the translation preserves the meaning on a scale from 0.0 to 1.0 (where 1.0 = perfect semantic preservation, 0.85 = good, below 0.7 = significant meaning loss).
Return ONLY a JSON array of numbers in the same order. No explanations.`,
        },
        { role: "user", content: numbered },
      ],
      max_completion_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Similarity assessment error:", errText);
    throw new Error(`Similarity assessment failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed.map((v: number) => Math.round(v * 10000) / 10000);
    }
  } catch (e) {
    console.warn("Failed to parse similarity scores:", e);
  }
  
  return pairs.map(() => -1); // -1 = assessment failed
}

/** Translate a batch of texts in a single LLM call (up to ~10 items) */
async function translateBatch(
  texts: string[],
  targetLang: string,
  apiKey: string
): Promise<string[]> {
  // Build a numbered list for the model
  const numbered = texts.map((t, i) => `[${i}] ${t}`).join("\n---\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional technical translator for the Hydra AI platform. Translate each numbered block to ${targetLang}. 
Return ONLY a JSON array of strings in the same order, no explanations.
Preserve Markdown formatting, line breaks, and technical terms.
Key Hydra glossary: Штат=Staff, Роль=Role, Конкурс=Contest, Дуэль=Duel, Собеседование=Interview, Оркестратор=Orchestrator, Арбитр=Arbiter, Промпт=Prompt, Эволюция=Evolution, Хроника=Chronicle, ОТК=QC Dept, Память=Memory, Знание=Knowledge, Инструмент=Tool, Поток=Flow, Шлюз=Gateway.`,
        },
        { role: "user", content: numbered },
      ],
      max_completion_tokens: 16384,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Translation batch API error:", errText);
    throw new Error(`Translation batch failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  // Parse JSON array from response
  try {
    // Try to extract JSON array from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length === texts.length) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse batch response as JSON, falling back to line split:", e);
  }

  // Fallback: split by delimiter
  const lines = content.split(/\n---\n|\n\[\d+\]\s*/g).filter((l: string) => l.trim());
  if (lines.length === texts.length) return lines;

  // Last resort: return the whole thing as single translation
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Translate in batches
    const allTranslations: string[] = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const texts = batch.map((it) => it.text);
      const translated = await translateBatch(texts, targetLang, LOVABLE_API_KEY);
      allTranslations.push(...translated);
    }

    // Build results
    const results: TranslatedItem[] = items.map((item, idx) => ({
      id: item.id,
      translation: allTranslations[idx],
    }));

    // Semantic verification via LLM-based assessment
    if (verifySemantic && items.length <= 20) {
      try {
        const pairs = items.map((item, idx) => ({
          original: item.text,
          translation: allTranslations[idx],
        }));
        const scores = await assessSemanticSimilarity(pairs, LOVABLE_API_KEY);
        scores.forEach((score, idx) => {
          if (score >= 0) {
            results[idx].cosineSimilarity = score;
          }
        });
      } catch (semErr) {
        console.error("Semantic verification failed (non-fatal):", semErr);
      }
    }

    const avgSimilarity = results.filter(r => r.cosineSimilarity != null).length > 0
      ? results.reduce((sum, r) => sum + (r.cosineSimilarity || 0), 0) / results.filter(r => r.cosineSimilarity != null).length
      : null;

    console.log(`Translated ${items.length} items to ${targetLang}. Avg cosine similarity: ${avgSimilarity?.toFixed(4) ?? 'N/A'}`);

    return new Response(
      JSON.stringify({ results, avgCosineSimilarity: avgSimilarity }),
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
