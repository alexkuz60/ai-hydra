import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// ReAct Trajectory Types
// ============================================

interface TrajectoryStep {
  step: "think" | "act" | "observe";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface StructuredRevision {
  trajectory: TrajectoryStep[];
  revision: string;
  confidence: number;
  strategy_tags: string[];
  token_usage?: { input: number; output: number };
}

// ============================================
// AI Gateway Helper
// ============================================

async function callAI(
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

// ============================================
// ReAct Pipeline: Think → Act → Observe → Revise
// ============================================

async function executeReActPipeline(
  supabase: ReturnType<typeof createClient>,
  entry: Record<string, unknown>,
  apiKey: string,
  promptTemplate: string | null,
): Promise<StructuredRevision> {
  const trajectory: TrajectoryStep[] = [];
  const now = () => new Date().toISOString();

  // ── Step 1: THINK — Analyze the rejected entry ──
  const thinkPrompt = `Проанализируй отклонённую запись Хроник Hydra.

Запись: ${entry.entry_code} — ${entry.title}
Объект: ${entry.role_object || "не указан"}
Гипотеза: ${entry.hypothesis || "не указана"}
Комментарий Супервизора: ${entry.supervisor_comment || "не указан"}
Метрики ДО: ${JSON.stringify(entry.metrics_before || {}, null, 2)}
Метрики ПОСЛЕ: ${JSON.stringify(entry.metrics_after || {}, null, 2)}

Определи:
1. Тип проблемы (промпт / модель / неясный запрос / конфигурация)
2. Корневую причину отклонения
3. Какие данные из памяти Hydra помогут сформировать ревизию

Ответь кратко, структурированно.`;

  const thinkResult = await callAI(
    apiKey,
    "Ты — аналитик первого шага ReAct-цикла Эволюционера Hydra. Твоя задача — диагностировать проблему, а не решать её. Будь лаконичен.",
    thinkPrompt,
    400,
    0.5,
  );

  trajectory.push({
    step: "think",
    content: thinkResult.content,
    timestamp: now(),
    metadata: { tokens: thinkResult.usage },
  });

  // ── Step 2: ACT — Search role memory for similar cases ──
  const roleObj = ((entry.role_object as string) || "").toLowerCase();
  let roleForSearch = "assistant";
  if (roleObj.includes("technoarbiter") || roleObj.includes("арбитр")) roleForSearch = "technoarbiter";
  else if (roleObj.includes("technocritic") || roleObj.includes("критик")) roleForSearch = "technocritic";
  else if (roleObj.includes("guide") || roleObj.includes("гид")) roleForSearch = "guide";
  else if (roleObj.includes("moderator") || roleObj.includes("модератор")) roleForSearch = "moderator";

  // Search role_memory for similar past experiences (using service role — system-level search)
  const { data: memoryResults } = await supabase
    .from("role_memory")
    .select("content, memory_type, confidence_score, tags, metadata")
    .eq("role", roleForSearch)
    .in("memory_type", ["experience", "mistake", "success"])
    .order("updated_at", { ascending: false })
    .limit(5);

  // Search chronicles for past revisions on the same role
  const { data: pastRevisions } = await supabase
    .from("chronicles")
    .select("entry_code, title, ai_revision, supervisor_resolution, status")
    .eq("role_object", entry.role_object as string)
    .neq("id", entry.id as string)
    .not("ai_revision", "is", null)
    .order("updated_at", { ascending: false })
    .limit(3);

  const actContent = [
    `Поиск в role_memory (роль: ${roleForSearch}): найдено ${memoryResults?.length || 0} записей`,
    memoryResults?.length
      ? memoryResults.map((m) => `- [${m.memory_type}] ${m.content.substring(0, 100)}...`).join("\n")
      : "Релевантный опыт не найден.",
    `\nПоиск в chronicles (объект: ${entry.role_object}): найдено ${pastRevisions?.length || 0} прошлых ревизий`,
    pastRevisions?.length
      ? pastRevisions.map((r) => `- ${r.entry_code}: ${r.title} → ${r.supervisor_resolution}`).join("\n")
      : "Прошлых ревизий не найдено.",
  ].join("\n");

  trajectory.push({
    step: "act",
    content: actContent,
    timestamp: now(),
    metadata: {
      role_searched: roleForSearch,
      memory_count: memoryResults?.length || 0,
      past_revisions_count: pastRevisions?.length || 0,
    },
  });

  // ── Step 3: OBSERVE — Synthesize findings ──
  const observePrompt = `На основе анализа (THINK) и собранных данных (ACT), сформулируй наблюдения.

THINK-анализ:
${thinkResult.content}

ACT-данные:
${actContent}

Ответь:
1. Какие паттерны видны в прошлом опыте?
2. Какие стратегии ревизий были успешны / неуспешны для этой роли?
3. Какой подход рекомендуешь для текущей ревизии?

Кратко, не более 150 слов.`;

  const observeResult = await callAI(
    apiKey,
    "Ты — наблюдатель ReAct-цикла. Синтезируй информацию из предыдущих шагов в actionable insights.",
    observePrompt,
    300,
    0.5,
  );

  trajectory.push({
    step: "observe",
    content: observeResult.content,
    timestamp: now(),
    metadata: { tokens: observeResult.usage },
  });

  // ── Step 4: REVISE — Generate the final revision ──
  const contextFromMemory = memoryResults?.length
    ? `\n\nКонтекст из памяти роли:\n${memoryResults.map((m) => `[${m.memory_type}] ${m.content.substring(0, 200)}`).join("\n")}`
    : "";

  const revisionPrompt = promptTemplate
    ? promptTemplate
        .replace("{{entry_code}}", entry.entry_code as string)
        .replace("{{title}}", entry.title as string)
        .replace("{{role_object}}", (entry.role_object as string) || "")
        .replace("{{hypothesis}}", (entry.hypothesis as string) || "Не указана")
        .replace("{{metrics_before}}", JSON.stringify(entry.metrics_before || {}, null, 2))
        .replace("{{metrics_after}}", JSON.stringify(entry.metrics_after || {}, null, 2))
        .replace("{{supervisor_comment}}", (entry.supervisor_comment as string) || "Не указан")
        .replace("{{summary}}", (entry.summary as string) || "Не указан")
    : `Запись: ${entry.entry_code} — ${entry.title}. Объект: ${entry.role_object}. Гипотеза: ${entry.hypothesis}. Комментарий Супервизора: ${entry.supervisor_comment}.`;

  const fullRevisionPrompt = `${revisionPrompt}

Результаты ReAct-анализа:
THINK: ${thinkResult.content}
OBSERVE: ${observeResult.content}
${contextFromMemory}

На основе полного анализа предложи пересмотренную гипотезу с конкретными метриками (не более 200 слов).`;

  const revisionResult = await callAI(
    apiKey,
    "Ты — Evolutioner, системный аналитик качества AI-ролей платформы Hydra. Специализируешься на оптимизации промптов и конфигураций моделей. Отвечаешь кратко, с конкретными метриками. Учитывай результаты ReAct-анализа.",
    fullRevisionPrompt,
    800,
    0.7,
  );

  // Calculate confidence based on available context
  let confidence = 0.5; // base
  if (memoryResults?.length) confidence += 0.15; // memory context available
  if (pastRevisions?.length) confidence += 0.15; // past revisions available
  if ((entry.supervisor_comment as string)?.length > 20) confidence += 0.1; // detailed supervisor feedback
  if (entry.metrics_before && entry.metrics_after) confidence += 0.1; // metrics available
  confidence = Math.min(confidence, 0.95);

  // Extract strategy tags
  const strategyTags: string[] = [];
  const analysis = thinkResult.content.toLowerCase();
  if (analysis.includes("промпт")) strategyTags.push("prompt_optimization");
  if (analysis.includes("модел")) strategyTags.push("model_selection");
  if (analysis.includes("запрос") || analysis.includes("неясн")) strategyTags.push("query_clarification");
  if (analysis.includes("конфигурац")) strategyTags.push("config_adjustment");
  if (strategyTags.length === 0) strategyTags.push("general_revision");

  // Calculate total token usage
  const totalInput = (thinkResult.usage?.prompt_tokens || 0) +
    (observeResult.usage?.prompt_tokens || 0) +
    (revisionResult.usage?.prompt_tokens || 0);
  const totalOutput = (thinkResult.usage?.completion_tokens || 0) +
    (observeResult.usage?.completion_tokens || 0) +
    (revisionResult.usage?.completion_tokens || 0);

  return {
    trajectory,
    revision: revisionResult.content,
    confidence,
    strategy_tags: strategyTags,
    token_usage: { input: totalInput, output: totalOutput },
  };
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const { mode, chronicle_id } = body;

    let targetEntries: Record<string, unknown>[] = [];

    // Helper: load role-specific prompt from prompt_library
    const loadEvolutionerPrompt = async (promptKey: string): Promise<string | null> => {
      const { data } = await supabase
        .from("prompt_library")
        .select("content")
        .eq("role", "evolutioner")
        .eq("name", promptKey)
        .eq("is_default", true)
        .maybeSingle();
      return data?.content || null;
    };

    if (mode === "single" && chronicle_id) {
      const { data, error } = await supabase
        .from("chronicles")
        .select("*")
        .eq("id", chronicle_id)
        .eq("supervisor_resolution", "rejected")
        .single();
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Chronicle not found or not rejected" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetEntries = [data];
    } else if (mode === "autorun") {
      const { data, error } = await supabase
        .from("chronicles")
        .select("*")
        .eq("supervisor_resolution", "rejected");
      if (error) throw error;
      targetEntries = data || [];
    } else {
      return new Response(JSON.stringify({ error: "Invalid mode. Use 'single' or 'autorun'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (targetEntries.length === 0) {
      return new Response(JSON.stringify({ message: "No rejected entries found", revised: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const results = [];

    for (const entry of targetEntries) {
      try {
        // Determine prompt key based on role_object
        const roleObj = ((entry.role_object as string) || "").toLowerCase();
        let promptKey = "rejected_default";
        if (roleObj.includes("technoarbiter") || roleObj.includes("арбитр") || roleObj.includes("contest-arbiter")) {
          promptKey = "rejected_technoarbiter";
        } else if (roleObj.includes("technocritic") || roleObj.includes("критик")) {
          promptKey = "rejected_technocritic";
        } else if (roleObj.includes("guide") || roleObj.includes("гид")) {
          promptKey = "rejected_guide";
        }

        // Load prompt template
        const promptTemplate = await loadEvolutionerPrompt(promptKey) ||
          await loadEvolutionerPrompt("rejected_default");

        // Execute ReAct pipeline
        const structured = await executeReActPipeline(supabase, entry, LOVABLE_API_KEY, promptTemplate);

        // Save structured revision to chronicles
        const { error: updateError } = await supabase
          .from("chronicles")
          .update({
            ai_revision: JSON.stringify(structured),
            status: "revised",
          })
          .eq("id", entry.id as string);

        if (updateError) {
          console.error(`Update error for ${entry.entry_code}:`, updateError);
          results.push({ entry_code: entry.entry_code, status: "update_error" });
          continue;
        }

        results.push({
          entry_code: entry.entry_code,
          status: "revised",
          confidence: structured.confidence,
          strategy_tags: structured.strategy_tags,
          trajectory_steps: structured.trajectory.length,
          token_usage: structured.token_usage,
        });

        // Notify supervisors
        const { data: supervisors } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "supervisor");

        if (supervisors && supervisors.length > 0) {
          const notifRows = supervisors.map((s: { user_id: string }) => ({
            user_id: s.user_id,
            chronicle_id: entry.id,
            entry_code: entry.entry_code,
            message: `🧬 ReAct-ревизия Эволюционера готова для записи ${entry.entry_code}: «${entry.title}». Уверенность: ${Math.round(structured.confidence * 100)}%. Стратегия: ${structured.strategy_tags.join(", ")}.`,
            is_read: false,
          }));
          const { error: notifError } = await supabase.from("supervisor_notifications").insert(notifRows);
          if (notifError) console.error("Notification insert error:", notifError);
        }
      } catch (entryError) {
        console.error(`ReAct pipeline error for ${entry.entry_code}:`, entryError);
        results.push({
          entry_code: entry.entry_code,
          status: "ai_error",
          error: entryError instanceof Error ? entryError.message : "Unknown",
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Evolution cycle complete (ReAct)`,
        revised: results.filter((r) => r.status === "revised").length,
        total: targetEntries.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("evolution-trigger error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
