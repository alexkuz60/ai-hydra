// ============================================
// AI Gateway Helper
// ============================================

export async function callAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 800,
  temperature = 0.7,
): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number } }> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    usage: data.usage,
  };
}

/**
 * Generate embedding via Lovable AI gateway (uses Gemini embedding model)
 * Falls back to null if unavailable — text-based search will be used instead
 */
export async function generateEmbedding(
  apiKey: string,
  text: string,
): Promise<number[] | null> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/text-embedding-004",
        input: text,
      }),
    });

    if (!response.ok) {
      console.warn(`[evolution] Embedding generation failed: ${response.status}, falling back to text search`);
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (err) {
    console.warn("[evolution] Embedding generation error, falling back to text search:", err);
    return null;
  }
}
