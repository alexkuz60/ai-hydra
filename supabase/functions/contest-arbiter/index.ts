import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ModelResponse {
  result_id: string;
  model_id: string;
  response_text: string;
  response_time_ms: number | null;
  token_count: number | null;
}

interface ArbiterRequest {
  prompt: string;
  responses: ModelResponse[];
  criteria: string[];
  criteria_weights: Record<string, number>;
  arbiter_model?: string;
  language?: string; // 'ru' | 'en'
  role_context?: string; // expert role name for role-based evaluation
  duel_mode?: boolean; // if true, use Likert claims evaluation for arbiter duels
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ArbiterRequest = await req.json();
    const { prompt, responses, criteria, criteria_weights, arbiter_model, language, role_context, duel_mode } = body;
    const isRu = language === 'ru';
    const isLikertMode = duel_mode === true;

    if (!responses?.length || !criteria?.length) {
      return new Response(
        JSON.stringify({ error: "Missing responses or criteria" }),
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

    const model = arbiter_model || "google/gemini-3-flash-preview";

    // Build criteria description for the prompt
    const criteriaDesc = criteria
      .map(c => `- ${c} (weight: ${criteria_weights[c] ?? 10}%)`)
      .join("\n");

    const responsesDesc = responses
      .map((r, i) => {
        return `=== Contestant ${i + 1} (model_id: "${r.model_id}") ===\nResponse time: ${r.response_time_ms ? (r.response_time_ms / 1000).toFixed(1) + "s" : "N/A"}\nTokens: ${r.token_count ?? "N/A"}\n\n${r.response_text}`;
      })
      .join("\n\n---\n\n");

    // Build role context instruction if role-based contest
    const roleInstruction = role_context
      ? (isRu
        ? `\nКонтекст: Это ролевой конкурс. Конкурсанты отвечали в роли "${role_context}". Оценивайте, насколько хорошо каждый ответ соответствует ожиданиям от этой роли.`
        : `\nContext: This is a role-based contest. Contestants answered in the role of "${role_context}". Evaluate how well each response meets the expectations for this role.`)
      : '';

    const systemPrompt = isRu
      ? `Вы — беспристрастный ИИ-арбитр, оценивающий ответы нескольких ИИ-моделей в конкурсе.
Вы должны оценить каждый ответ на основе заданных критериев и выставить справедливые, детализированные оценки.
Будьте объективны и аналитичны. Учитывайте как сильные, так и слабые стороны каждого ответа.
Оценивайте ТОЛЬКО по предоставленным критериям с учётом их весов.
ВАЖНО: Все комментарии пишите ТОЛЬКО на русском языке.${roleInstruction}`
      : `You are an impartial AI arbiter evaluating responses from multiple AI models in a competition. 
You must evaluate each response based on the given criteria and provide fair, detailed scores.
Be objective and analytical. Consider both strengths and weaknesses of each response.
Evaluate ONLY based on the criteria provided, with their respective weights.${roleInstruction}`;

    const inverseNote = isRu
      ? `\nВАЖНО: Критерии «стоимость» (cost, tokens) и «скорость» (speed) — ОБРАТНЫЕ. Для них 10 = лучший результат (самый дешёвый / самый быстрый), 1 = худший (самый дорогой / самый медленный). Ориентируйтесь на response_time и token_count каждого конкурсанта.`
      : `\nIMPORTANT: Cost and speed criteria are INVERSE. For these, 10 = best (cheapest / fastest), 1 = worst (most expensive / slowest). Use the response_time and token_count of each contestant as reference.`;

    const userPrompt = isRu
      ? `## Исходный промпт для конкурсантов
${prompt}

## Критерии оценки (с весами)
${criteriaDesc}
${inverseNote}

## Ответы конкурсантов
${responsesDesc}

Оцените ответ каждого конкурсанта по КАЖДОМУ критерию отдельно. Для каждой модели укажите:
1. Оценки по каждому критерию (1-10 для каждого)
2. Краткий аналитический комментарий (2-3 предложения) с указанием сильных и слабых сторон. Комментарий ОБЯЗАТЕЛЬНО на русском языке.

ВАЖНО: Возвращайте оценки ПО КАЖДОМУ критерию отдельно в объекте criteria_scores.`
      : `## Original Prompt Given to Contestants
${prompt}

## Evaluation Criteria (with weights)
${criteriaDesc}
${inverseNote}

## Contestant Responses
${responsesDesc}

Evaluate each contestant's response BY EACH CRITERION separately. For each model, provide:
1. A score for each criterion (1-10 for each)
2. A brief analytical comment (2-3 sentences) highlighting strengths and weaknesses

IMPORTANT: Return scores FOR EACH CRITERION separately in the criteria_scores object.`;

    // Use tool calling for structured output (with Likert mode for arbiter duels)
    const toolSchema = isLikertMode ? {
      type: "function",
      function: {
        name: "submit_likert_evaluations",
        description: isRu
          ? "Оценить вердикты двух модельей-арбитров по шкале согласия Ликерта (0-5) для каждого пункта."
          : "Evaluate arbiter verdicts on Likert agreement scale (0-5) for each claim.",
        parameters: {
          type: "object",
          properties: {
            evaluations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  model_id: {
                    type: "string",
                    description: "The EXACT model_id string as shown in parentheses after 'model_id:' for each arbiter candidate.",
                  },
                  claims: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        claim: {
                          type: "string",
                          description: isRu ? "Основной пункт/утверждение вердикта" : "Main claim or argument from the verdict",
                        },
                        verdict: {
                          type: "string",
                          enum: ["fully_agree", "agree_with_nuance", "needs_clarification", "mostly_disagree", "disagree", "nonsense"],
                          description: isRu
                            ? "Уровень согласия: полностью согласен(5), согласен но есть нюансы(4), требует разъяснения(3), скорее нет(2), не согласен(1), бред(0)"
                            : "Agreement level: fully agree(5), agree with nuance(4), needs clarification(3), mostly disagree(2), disagree(1), nonsense(0)",
                        },
                        score: {
                          type: "number",
                          description: isRu
                            ? "Числовая оценка по шкале 0-5"
                            : "Numeric score 0-5",
                          minimum: 0,
                          maximum: 5,
                        },
                        reasoning: {
                          type: "string",
                          description: isRu
                            ? "Короткое обоснование оценки (1-2 предложения)"
                            : "Brief reasoning for the score (1-2 sentences)",
                        },
                      },
                      required: ["claim", "verdict", "score", "reasoning"],
                    },
                  },
                  overall_comment: {
                    type: "string",
                    description: isRu
                      ? "Итоговый комментарий о качестве арбитража (2-3 предложения). ОБЯЗАТЕЛЬНО на русском языке."
                      : "Overall comment on arbitration quality (2-3 sentences)",
                  },
                },
                required: ["model_id", "claims", "overall_comment"],
              },
            },
          },
          required: ["evaluations"],
        },
      },
    } : {
      type: "function",
      function: {
        name: "submit_evaluations",
        description: isRu
          ? "Отправить оценки по критериям и финальный балл для каждой модели-конкурсанта."
          : "Submit per-criterion scores and overall evaluation for each contestant model.",
        parameters: {
          type: "object",
          properties: {
            evaluations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  model_id: {
                    type: "string",
                    description: "The EXACT model_id string as shown in parentheses after 'model_id:' for each contestant. Copy it verbatim.",
                  },
                  criteria_scores: {
                    type: "object",
                    description: `Score each criterion on a 1-10 scale. Keys MUST be exactly: ${criteria.map(c => `"${c}"`).join(", ")}`,
                    properties: Object.fromEntries(
                      criteria.map(c => [c, { type: "number", description: `Score 1-10 for ${c}` }])
                    ),
                    required: criteria,
                  },
                  comment: {
                    type: "string",
                    description: isRu
                      ? "Краткий аналитический комментарий (2-3 предложения) о качестве ответа. ОБЯЗАТЕЛЬНО на русском языке."
                      : "Brief analytical comment (2-3 sentences) on the response quality",
                  },
                },
                required: ["model_id", "criteria_scores", "comment"],
              },
            },
          },
          required: ["evaluations"],
        },
      },
    };

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: isLikertMode ? "submit_likert_evaluations" : "submit_evaluations" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[contest-arbiter] AI gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI arbiter evaluation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("[contest-arbiter] No tool call in response:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "Arbiter did not return structured evaluation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let evaluations: { model_id: string; criteria_scores?: Record<string, number>; comment?: string; claims?: Array<{ claim: string; verdict: string; score: number; reasoning: string }>; overall_comment?: string }[];
    try {
      const parsed = JSON.parse(toolCall.function.arguments);
      evaluations = parsed.evaluations;
    } catch (e) {
      console.error("[contest-arbiter] Failed to parse tool call args:", e);
      return new Response(
        JSON.stringify({ error: "Failed to parse arbiter response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate weighted score from per-criteria scores OR from Likert claims
    const calculateWeightedScore = (
      criteriaScores: Record<string, number> | undefined,
      likertClaims: Array<{ score: number }> | undefined,
      weights: Record<string, number>
    ): number => {
      // Likert mode: average of claim scores, normalized to 0-10
      if (likertClaims && likertClaims.length > 0) {
        const avgLikert = likertClaims.reduce((sum, c) => sum + c.score, 0) / likertClaims.length; // 0-5 scale
        return Math.round((avgLikert / 5) * 10 * 10) / 10; // normalize to 0-10
      }
      
      // Criteria mode: weighted average
      if (!criteriaScores) return 0;
      const scoredCriteria = Object.entries(criteriaScores);
      if (scoredCriteria.length === 0) return 0;
      
      let totalWeight = 0;
      let weightedSum = 0;
      
      for (const [criterion, score] of scoredCriteria) {
        const weight = weights[criterion] ?? 10;
        weightedSum += score * weight;
        totalWeight += weight;
      }
      
      return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
    };

    // Map evaluations back to result_ids
    const results = responses.map(r => {
      let eval_ = evaluations.find(e => e.model_id === r.model_id);
      if (!eval_) {
        const shortId = r.model_id.split('/').pop()?.toLowerCase() || '';
        eval_ = evaluations.find(e => 
          e.model_id.toLowerCase().includes(shortId) || 
          shortId.includes(e.model_id.toLowerCase().split('/').pop() || '???')
        );
      }
      
      const criteriaScores = eval_?.criteria_scores || {};
      const likertClaims = eval_?.claims;
      const arbiterScore = calculateWeightedScore(criteriaScores, likertClaims, criteria_weights);
      
      return {
        result_id: r.result_id,
        model_id: r.model_id,
        arbiter_score: arbiterScore,
        arbiter_comment: eval_?.comment || eval_?.overall_comment || null,
        arbiter_model: model,
        criteria_scores: isLikertMode && likertClaims ? { likert_claims: likertClaims } : criteriaScores,
      };
    });

    console.log(`[contest-arbiter] Evaluated ${results.length} responses with model ${model}`);

    return new Response(
      JSON.stringify({ evaluations: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[contest-arbiter] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
