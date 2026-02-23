import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ── Arbiter criteria per role category ──
const ROLE_CRITERIA: Record<string, string[]> = {
  // Technical roles
  archivist: ['knowledge_accuracy', 'organization_quality', 'completeness'],
  analyst: ['analytical_depth', 'methodology', 'actionability'],
  webhunter: ['search_strategy', 'source_quality', 'relevance'],
  promptengineer: ['prompt_quality', 'token_efficiency', 'creativity'],
  flowregulator: ['architecture_quality', 'optimization', 'scalability'],
  toolsmith: ['api_design', 'error_handling', 'usability'],
  guide: ['clarity', 'user_empathy', 'completeness'],
  // Expert roles
  assistant: ['depth', 'accuracy', 'structure'],
  critic: ['error_detection', 'constructiveness', 'thoroughness'],
  arbiter: ['objectivity', 'fairness', 'reasoning_quality'],
  moderator: ['mediation_skill', 'synthesis_quality', 'neutrality'],
  advisor: ['strategic_thinking', 'risk_awareness', 'actionability'],
  consultant: ['expertise_depth', 'practical_value', 'clarity'],
  // Legal roles
  patent_attorney: ['novelty_assessment', 'claim_structure', 'prior_art_search', 'legal_accuracy', 'risk_assessment'],
  translator: ['accuracy', 'fluency', 'terminology_consistency'],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { session_id, language = 'ru', arbiter_model } = await req.json();
    const isRu = language === 'ru';

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "Missing session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load interview session
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Interview session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.status !== 'tested') {
      return new Response(
        JSON.stringify({ error: `Cannot run verdict on status: ${session.status}. Tests must be completed first.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const role = session.role;
    const candidateModel = session.candidate_model;
    const testResults = session.test_results as any;
    const steps = testResults?.steps || [];
    const completedSteps = steps.filter((s: any) => s.status === 'completed');

    if (completedSteps.length === 0) {
      return new Response(
        JSON.stringify({ error: "No completed test steps to evaluate" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Load assignment history for threshold comparison ──
    const { data: assignmentHistory } = await supabase
      .from('role_assignment_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', role)
      .order('assigned_at', { ascending: false })
      .limit(3);

    const currentHolder = assignmentHistory?.find(h => !h.removed_at);
    const previousHolders = (assignmentHistory || []).filter(h => h.removed_at).slice(0, 2);

    console.log(`[interview-verdict] Role=${role}, candidate=${candidateModel}, current_holder=${currentHolder?.model_id || 'none'}, prev_holders=${previousHolders.length}`);

    // ── SSE Stream ──
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        };

        send('start', { session_id, role, candidate_model: candidateModel, phases: ['arbiter', 'moderator', 'decision'] });

        // ─── Phase 1: Arbiter evaluation ───
        send('phase', { phase: 'arbiter', status: 'running' });

        const criteria = ROLE_CRITERIA[role] || ['quality', 'accuracy', 'completeness'];
        const criteriaWeights: Record<string, number> = {};
        criteria.forEach(c => { criteriaWeights[c] = Math.round(100 / criteria.length); });

        // Build arbiter prompt from test results
        const stepsDesc = completedSteps.map((step: any, i: number) => {
          let desc = `### Test ${i + 1}: ${step.competency}\n**Task:** ${step.task_prompt}\n`;
          if (step.baseline?.current_value) {
            desc += `**Baseline (current state):**\n${step.baseline.current_value.slice(0, 500)}\n`;
          }
          if (step.candidate_output?.proposed_value) {
            desc += `**Candidate response:**\n${step.candidate_output.proposed_value.slice(0, 1000)}\n`;
          }
          desc += `Time: ${(step.elapsed_ms / 1000).toFixed(1)}s, Tokens: ${step.token_count}`;
          return desc;
        }).join('\n\n---\n\n');

        const arbiterSystemPrompt = isRu
          ? `Вы — беспристрастный арбитр, оценивающий кандидата на позицию "${role}" в системе AI-Hydra. Оцените результаты тестирования по заданным критериям. Будьте строги, но справедливы. Все комментарии — на русском.`
          : `You are an impartial arbiter evaluating a candidate for the "${role}" position in the AI-Hydra system. Evaluate test results by the given criteria. Be strict but fair.`;

        const arbiterUserPrompt = isRu
          ? `## Результаты тестирования кандидата (модель: ${candidateModel})\n\n${stepsDesc}\n\n## Критерии оценки\n${criteria.map(c => `- ${c} (вес: ${criteriaWeights[c]}%)`).join('\n')}\n\nОцените кандидата по каждому критерию (1-10). Укажите red flags если есть. Дайте рекомендацию: hire/reject/retest с обоснованием и уровнем уверенности (0-1).`
          : `## Candidate test results (model: ${candidateModel})\n\n${stepsDesc}\n\n## Evaluation criteria\n${criteria.map(c => `- ${c} (weight: ${criteriaWeights[c]}%)`).join('\n')}\n\nScore the candidate on each criterion (1-10). Note any red flags. Give recommendation: hire/reject/retest with justification and confidence level (0-1).`;

        const arbiterToolSchema = {
          type: "function",
          function: {
            name: "submit_verdict",
            description: "Submit structured evaluation of the interview candidate",
            parameters: {
              type: "object",
              properties: {
                scores: {
                  type: "object",
                  description: `Score each criterion 1-10. Keys: ${criteria.join(', ')}`,
                  properties: Object.fromEntries(criteria.map(c => [c, { type: "number", minimum: 1, maximum: 10 }])),
                  required: criteria,
                },
                red_flags: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of concerns or red flags (empty if none)",
                },
                recommendation: {
                  type: "string",
                  enum: ["hire", "reject", "retest"],
                  description: "Overall recommendation",
                },
                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: "Confidence in recommendation (0-1)",
                },
                comment: {
                  type: "string",
                  description: isRu ? "Развёрнутый аналитический комментарий (3-5 предложений). НА РУССКОМ." : "Detailed analytical comment (3-5 sentences)",
                },
                retest_competencies: {
                  type: "array",
                  items: { type: "string" },
                  description: "If recommendation is 'retest', which competencies to retest",
                },
              },
              required: ["scores", "red_flags", "recommendation", "confidence", "comment"],
            },
          },
        };

        const selectedArbiterModel = arbiter_model || "google/gemini-3-flash-preview";

        let arbiterResult: any = null;

        const ARBITER_MODELS = [selectedArbiterModel, "google/gemini-2.5-flash", "google/gemini-2.5-pro"];
        
        const callArbiter = async (model: string) => {
          const body: Record<string, unknown> = {
            model,
            messages: [
              { role: "system", content: arbiterSystemPrompt },
              { role: "user", content: arbiterUserPrompt },
            ],
            tools: [arbiterToolSchema],
            tool_choice: { type: "function", function: { name: "submit_verdict" } },
          };

          console.log(`[interview-verdict] Calling arbiter model=${model}`);
          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });

          if (!aiResp.ok) {
            const errBody = await aiResp.text();
            console.error(`[interview-verdict] Arbiter ${model} returned ${aiResp.status}: ${errBody.slice(0, 500)}`);
            throw new Error(`Arbiter ${model} error ${aiResp.status}: ${errBody.slice(0, 200)}`);
          }
          return aiResp;
        };

        try {
          let aiResp: Response | null = null;
          for (const model of ARBITER_MODELS) {
            try {
              aiResp = await callArbiter(model);
              break; // success
            } catch (e: any) {
              console.warn(`[interview-verdict] Arbiter fallback: ${model} failed, trying next...`, e.message);
              if (model === ARBITER_MODELS[ARBITER_MODELS.length - 1]) throw e; // last model
            }
          }
          if (!aiResp) throw new Error('All arbiter models failed');

          const aiData = await aiResp.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            arbiterResult = JSON.parse(toolCall.function.arguments);
          }
        } catch (e: any) {
          console.error('[interview-verdict] Arbiter error:', e);
          arbiterResult = {
            scores: Object.fromEntries(criteria.map(c => [c, 5])),
            red_flags: [`Arbiter error: ${e.message}`],
            recommendation: 'retest',
            confidence: 0.1,
            comment: isRu ? 'Ошибка при оценке арбитром.' : 'Error during arbiter evaluation.',
          };
        }

        send('phase', { phase: 'arbiter', status: 'done', result: arbiterResult });

        // ─── Calculate average score ───
        const scoreValues = Object.values(arbiterResult.scores) as number[];
        const avgScore = scoreValues.length > 0
          ? Math.round((scoreValues.reduce((a: number, b: number) => a + b, 0) / scoreValues.length) * 10) / 10
          : 0;

        // ─── Phase 2: Moderator summary ───
        send('phase', { phase: 'moderator', status: 'running' });

        let moderatorSummary = '';
        try {
          const modPrompt = isRu
            ? `Как Модератор, составь краткое резюме результатов собеседования:\n- Кандидат: ${candidateModel}\n- Позиция: ${role}\n- Средний балл: ${avgScore}/10\n- Рекомендация арбитра: ${arbiterResult.recommendation}\n- Комментарий: ${arbiterResult.comment}\n- Red flags: ${arbiterResult.red_flags?.join(', ') || 'нет'}\n\nРезюме для отдела кадров (2-3 предложения).`
            : `As Moderator, create a brief summary of interview results:\n- Candidate: ${candidateModel}\n- Position: ${role}\n- Average score: ${avgScore}/10\n- Arbiter recommendation: ${arbiterResult.recommendation}\n- Comment: ${arbiterResult.comment}\n- Red flags: ${arbiterResult.red_flags?.join(', ') || 'none'}\n\nSummary for HR (2-3 sentences).`;

          const modResp = await fetch(`${supabaseUrl}/functions/v1/hydra-stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': authHeader, 'apikey': supabaseKey },
            body: JSON.stringify({
              message: modPrompt,
              model_id: 'google/gemini-2.5-flash-lite',
              role: 'moderator',
              temperature: 0.3,
              max_tokens: 2048,
            }),
          });

          if (modResp.ok) {
            const reader = modResp.body!.getReader();
            const decoder = new TextDecoder();
            let buf = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              let nl: number;
              while ((nl = buf.indexOf('\n')) !== -1) {
                const line = buf.slice(0, nl).trim();
                buf = buf.slice(nl + 1);
                if (!line.startsWith('data: ')) continue;
                const json = line.slice(6).trim();
                if (json === '[DONE]') break;
                try {
                  const p = JSON.parse(json);
                  const c = p.choices?.[0]?.delta?.content;
                  if (c) moderatorSummary += c;
                } catch { /* skip */ }
              }
            }
          }
        } catch (e: any) {
          console.error('[interview-verdict] Moderator error:', e);
          moderatorSummary = arbiterResult.comment || '';
        }

        send('phase', { phase: 'moderator', status: 'done', summary: moderatorSummary });

        // ─── Phase 3: Auto-decision with dynamic thresholds ───
        send('phase', { phase: 'decision', status: 'running' });

        const currentHolderScore = currentHolder?.interview_avg_score ?? null;
        const prevScores = previousHolders.map(h => Number(h.interview_avg_score || 0));
        const prevAvg = prevScores.length > 0 ? prevScores.reduce((a, b) => a + b, 0) / prevScores.length : null;
        const hasColdStart = !currentHolder;
        const isSameModel = currentHolder?.model_id === candidateModel;

        let autoDecision: 'hire' | 'reject' | 'retest';
        let decisionReason: string;

        if (hasColdStart) {
          // Cold start: auto = hire
          autoDecision = 'hire';
          decisionReason = isRu
            ? 'Холодный старт: нет текущего назначенца. Рекомендуем нанять.'
            : 'Cold start: no current holder. Recommending hire.';
        } else if (currentHolderScore !== null && avgScore > Number(currentHolderScore)) {
          autoDecision = 'hire';
          decisionReason = isRu
            ? `Балл ${avgScore} превышает текущего назначенца (${currentHolderScore}). ${isSameModel ? 'Та же модель — повышение квалификации.' : 'Другая модель — замещение.'}`
            : `Score ${avgScore} exceeds current holder (${currentHolderScore}). ${isSameModel ? 'Same model — upskilling.' : 'Different model — replacement.'}`;
        } else if (prevAvg !== null && avgScore < prevAvg) {
          autoDecision = 'reject';
          decisionReason = isRu
            ? `Балл ${avgScore} ниже среднего предыдущих назначенцев (${prevAvg.toFixed(1)}).`
            : `Score ${avgScore} below average of previous holders (${prevAvg.toFixed(1)}).`;
        } else {
          autoDecision = 'retest';
          decisionReason = isRu
            ? `Балл ${avgScore} ≤ текущего (${currentHolderScore}), но ≥ предыдущих. Рекомендуем перетестировать.`
            : `Score ${avgScore} ≤ current (${currentHolderScore}), but ≥ previous. Recommending retest.`;
        }

        // Override auto with arbiter recommendation if confidence is high
        if (arbiterResult.confidence > 0.8 && arbiterResult.recommendation !== autoDecision) {
          console.log(`[interview-verdict] Arbiter override: ${arbiterResult.recommendation} (confidence=${arbiterResult.confidence}) vs auto=${autoDecision}`);
        }

        const verdict = {
          arbiter: {
            model: selectedArbiterModel,
            scores: arbiterResult.scores,
            red_flags: arbiterResult.red_flags || [],
            recommendation: arbiterResult.recommendation,
            confidence: arbiterResult.confidence,
            comment: arbiterResult.comment,
            retest_competencies: arbiterResult.retest_competencies || [],
          },
          moderator_summary: moderatorSummary,
          auto_decision: autoDecision,
          decision_reason: decisionReason,
          final_decision: null, // User will set this
          decided_by: null,
          decided_at: null,
          retest_history: [],
          thresholds: {
            current_holder: currentHolder ? { model_id: currentHolder.model_id, score: Number(currentHolderScore) } : null,
            previous_avg: prevAvg,
            candidate_score: avgScore,
            is_same_model: isSameModel,
            is_cold_start: hasColdStart,
          },
        };

        // Save verdict
        await supabase
          .from('interview_sessions')
          .update({
            verdict,
            status: 'verdict',
            config: {
              ...(session.config as Record<string, unknown> || {}),
              phase: 'verdict',
            },
          })
          .eq('id', session_id);

        // ─── Archivist: save experience to role_memory ───
        try {
          await supabase
            .from('role_memory')
            .insert({
              user_id: user.id,
              role,
              content: isRu
                ? `Собеседование ${candidateModel}: ${autoDecision}. ${moderatorSummary}`
                : `Interview ${candidateModel}: ${autoDecision}. ${moderatorSummary}`,
              memory_type: 'experience',
              confidence_score: arbiterResult.confidence,
              tags: ['interview', autoDecision, candidateModel],
              metadata: {
                interview_session_id: session_id,
                avg_score: avgScore,
                auto_decision: autoDecision,
              },
            });
        } catch (e: any) {
          console.warn('[interview-verdict] Archivist save failed:', e);
        }

        send('phase', { phase: 'decision', status: 'done', verdict });
        send('complete', { session_id, auto_decision: autoDecision, avg_score: avgScore });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('[interview-verdict] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
