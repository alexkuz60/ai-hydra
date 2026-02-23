import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  callLLM,
  assessSemanticSimilarity,
  splitIntoSentences,
  getUserOpenRouterKey,
  TRANSLATION_MODEL,
  HYDRA_GLOSSARY,
} from "../_shared/translation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REFINEMENT_THRESHOLD = 0.85;
const SENTENCE_THRESHOLD = 0.80;
const MAX_RETRIES = 2;

interface RequestBody {
  originalText: string;
  translatedText: string;
  targetLang: string;
  overallScore?: number;
}

interface SentenceScore {
  index: number;
  original: string;
  translated: string;
  score: number;
}

interface RefinementResult {
  refinedTranslation: string;
  originalScore: number;
  refinedScore: number;
  sentenceScores: SentenceScore[];
  refinedSentences: number;
  totalSentences: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalText, translatedText, targetLang, overallScore }: RequestBody = await req.json();

    if (!originalText || !translatedText || !targetLang) {
      return new Response(
        JSON.stringify({ error: "originalText, translatedText, and targetLang are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Skip if overall score is already good
    if (overallScore != null && overallScore >= REFINEMENT_THRESHOLD) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Score already above threshold", overallScore }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY") || null;
    const openrouterKey = await getUserOpenRouterKey(req.headers.get("Authorization"));

    // Step 1: Split into sentences
    const originalSentences = splitIntoSentences(originalText);
    const translatedSentences = splitIntoSentences(translatedText);

    // If sentence counts don't match closely, fall back to full re-translation
    if (Math.abs(originalSentences.length - translatedSentences.length) > Math.ceil(originalSentences.length * 0.3)) {
      console.log(`[refine-translation] Sentence count mismatch: ${originalSentences.length} vs ${translatedSentences.length}, re-translating fully`);
      
      const fullRetranslation = await callLLM(
        [
          { role: "system", content: `You are a professional technical translator for the Hydra AI platform. Translate to ${targetLang}. Return ONLY the translation. Preserve formatting and Markdown.\n${HYDRA_GLOSSARY}` },
          { role: "user", content: originalText },
        ],
        8192, openrouterKey, lovableKey, TRANSLATION_MODEL
      );

      if (!fullRetranslation) {
        return new Response(
          JSON.stringify({ error: "Re-translation failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newScore = await assessSemanticSimilarity(originalText, fullRetranslation, openrouterKey, lovableKey);

      return new Response(
        JSON.stringify({
          refinedTranslation: fullRetranslation,
          originalScore: overallScore ?? -1,
          refinedScore: newScore,
          sentenceScores: [],
          refinedSentences: originalSentences.length,
          totalSentences: originalSentences.length,
          method: "full_retranslation",
        } satisfies RefinementResult & { method: string }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Score each sentence pair
    const sentenceScores: SentenceScore[] = [];
    const minLen = Math.min(originalSentences.length, translatedSentences.length);

    for (let i = 0; i < minLen; i++) {
      const score = await assessSemanticSimilarity(
        originalSentences[i], translatedSentences[i], openrouterKey, lovableKey
      );
      sentenceScores.push({
        index: i,
        original: originalSentences[i],
        translated: translatedSentences[i],
        score,
      });
    }

    console.log(`[refine-translation] Sentence scores: ${sentenceScores.map(s => s.score.toFixed(2)).join(', ')}`);

    // Step 3: Find weak sentences and re-translate them
    const weakSentences = sentenceScores
      .filter(s => s.score >= 0 && s.score < SENTENCE_THRESHOLD)
      .sort((a, b) => a.score - b.score);

    if (weakSentences.length === 0) {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: "All sentences above threshold",
          sentenceScores,
          totalSentences: minLen,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[refine-translation] Found ${weakSentences.length} weak sentence(s), re-translating...`);

    const refinedParts = [...translatedSentences];
    let refinedCount = 0;

    for (const weak of weakSentences) {
      let bestTranslation = weak.translated;
      let bestScore = weak.score;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const retranslated = await callLLM(
          [
            {
              role: "system",
              content: `You are a professional technical translator for the Hydra AI platform. Translate this single sentence to ${targetLang}. Return ONLY the translation. Use alternative synonyms for key terms to improve accuracy.\n${HYDRA_GLOSSARY}`,
            },
            {
              role: "user",
              content: `Original: ${weak.original}\nPrevious translation (low quality): ${weak.translated}\n\nProvide a better translation:`,
            },
          ],
          512, openrouterKey, lovableKey, TRANSLATION_MODEL
        );

        if (!retranslated) break;

        const newScore = await assessSemanticSimilarity(
          weak.original, retranslated, openrouterKey, lovableKey
        );

        console.log(`[refine-translation] Sentence ${weak.index} attempt ${attempt + 1}: ${weak.score.toFixed(3)} → ${newScore.toFixed(3)}`);

        if (newScore > bestScore) {
          bestScore = newScore;
          bestTranslation = retranslated;
        }

        if (newScore >= REFINEMENT_THRESHOLD) break; // good enough
      }

      if (bestScore > weak.score) {
        refinedParts[weak.index] = bestTranslation;
        refinedCount++;
        console.log(`[refine-translation] Improved sentence ${weak.index}: ${weak.score.toFixed(3)} → ${bestScore.toFixed(3)}`);
      }
    }

    // Step 4: Reassemble and verify overall score
    const refinedTranslation = refinedParts.join(" ");
    const refinedScore = await assessSemanticSimilarity(
      originalText, refinedTranslation, openrouterKey, lovableKey
    );

    console.log(`[refine-translation] Overall: ${(overallScore ?? -1).toFixed(3)} → ${refinedScore.toFixed(3)}, refined ${refinedCount}/${weakSentences.length} sentences`);

    const result: RefinementResult = {
      refinedTranslation,
      originalScore: overallScore ?? -1,
      refinedScore,
      sentenceScores,
      refinedSentences: refinedCount,
      totalSentences: minLen,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[refine-translation] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "RATE_LIMIT") {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (message === "PAYMENT_REQUIRED") {
      return new Response(
        JSON.stringify({ error: "Payment required" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
