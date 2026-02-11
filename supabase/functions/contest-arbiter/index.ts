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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ArbiterRequest = await req.json();
    const { prompt, responses, criteria, criteria_weights, arbiter_model } = body;

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
        const modelLabel = r.model_id.split("/").pop() || r.model_id;
        return `=== Contestant ${i + 1}: ${modelLabel} ===\nResponse time: ${r.response_time_ms ? (r.response_time_ms / 1000).toFixed(1) + "s" : "N/A"}\nTokens: ${r.token_count ?? "N/A"}\n\n${r.response_text}`;
      })
      .join("\n\n---\n\n");

    const systemPrompt = `You are an impartial AI arbiter evaluating responses from multiple AI models in a competition. 
You must evaluate each response based on the given criteria and provide fair, detailed scores.
Be objective and analytical. Consider both strengths and weaknesses of each response.
Evaluate ONLY based on the criteria provided, with their respective weights.`;

    const userPrompt = `## Original Prompt Given to Contestants
${prompt}

## Evaluation Criteria (with weights)
${criteriaDesc}

## Contestant Responses
${responsesDesc}

Evaluate each contestant's response. For each model, provide:
1. A weighted score from 1-10 (considering criteria weights)
2. A brief analytical comment (2-3 sentences) highlighting strengths and weaknesses`;

    // Use tool calling for structured output
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
        tools: [
          {
            type: "function",
            function: {
              name: "submit_evaluations",
              description: "Submit evaluation scores and comments for each contestant model.",
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
                          description: "The model identifier exactly as provided",
                        },
                        score: {
                          type: "number",
                          description: "Weighted overall score from 1 to 10 (can use decimals like 7.5)",
                        },
                        comment: {
                          type: "string",
                          description: "Brief analytical comment (2-3 sentences) on the response quality",
                        },
                      },
                      required: ["model_id", "score", "comment"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["evaluations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_evaluations" } },
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

    let evaluations: { model_id: string; score: number; comment: string }[];
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

    // Map evaluations back to result_ids
    const results = responses.map(r => {
      const eval_ = evaluations.find(e => e.model_id === r.model_id);
      return {
        result_id: r.result_id,
        model_id: r.model_id,
        arbiter_score: eval_ ? Math.round(eval_.score * 10) / 10 : null,
        arbiter_comment: eval_?.comment || null,
        arbiter_model: model,
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
