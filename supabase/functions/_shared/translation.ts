/**
 * Shared translation utilities for Hydra Edge Functions.
 * Used by: translate-text, translate-batch, refine-translation
 */

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const TRANSLATION_MODEL = "google/gemini-2.5-flash";
export const SEMANTIC_MODEL = "google/gemini-2.5-flash-lite";

export const HYDRA_GLOSSARY = `Key Hydra glossary: Штат=Staff, Роль=Role, Конкурс=Contest, Дуэль=Duel, Собеседование=Interview, Оркестратор=Orchestrator, Арбитр=Arbiter, Промпт=Prompt, Эволюция=Evolution, Хроника=Chronicle, ОТК=QC Dept, Память=Memory, Знание=Knowledge, Инструмент=Tool, Поток=Flow, Шлюз=Gateway, Техно-Арбитр=Techno-Arbiter, Логистик=Logistician, Архивариус=Archivist, Штаб=HQ (War Room), Гидрапедия=Hydrapedia.`;

/** Call LLM with OpenRouter-first, Lovable AI fallback */
export async function callLLM(
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
      console.warn(`[translation] LLM OpenRouter ${resp.status}`);
      if (resp.status === 429) throw new Error("RATE_LIMIT");
    } catch (e) {
      if (e instanceof Error && e.message === "RATE_LIMIT") throw e;
      console.warn("[translation] LLM OpenRouter error:", e);
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
      console.warn(`[translation] LLM Lovable ${resp.status}`);
    } catch (e) {
      if (e instanceof Error && (e.message === "RATE_LIMIT" || e.message === "PAYMENT_REQUIRED")) throw e;
      console.warn("[translation] LLM Lovable error:", e);
    }
  }
  return null;
}

/** Assess semantic similarity between original and translation (LLM-based) */
export async function assessSemanticSimilarity(
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

/** Split text into sentences for granular evaluation */
export function splitIntoSentences(text: string): string[] {
  // Split by sentence-ending punctuation, preserving the punctuation
  const raw = text.split(/(?<=[.!?。])\s+/);
  return raw
    .map(s => s.trim())
    .filter(s => s.length > 3); // skip very short fragments
}

/** Get user's OpenRouter key from Supabase auth context */
export async function getUserOpenRouterKey(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;
  
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: apiKeys } = await supabase.rpc("get_my_api_keys");
  const keyData = Array.isArray(apiKeys) ? apiKeys[0] : apiKeys;
  return (keyData?.openrouter_api_key as string) || null;
}
