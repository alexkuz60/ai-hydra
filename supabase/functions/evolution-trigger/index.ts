import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, generateEmbedding } from "./ai.ts";
import {
  resolveRoleForSearch,
  searchRoleMemoryText,
  searchRoleMemoryVector,
  searchRoleKnowledgeHybrid,
  searchPastRevisions,
  analyzePastRevisions,
  buildVerification,
} from "./memory.ts";
import type { TrajectoryStep, StructuredRevision, MemoryHit, KnowledgeHit } from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// ReAct Pipeline: Think → Act → Observe → Verify → Revise
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
4. Ключевые слова для поиска в базе знаний роли

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

  // ── Step 2: ACT — Search memory with semantic retrieval (Phase 2) ──
  const roleForSearch = resolveRoleForSearch((entry.role_object as string) || "");

  // Build search query from Think analysis + entry context
  const searchQuery = `${entry.title} ${entry.hypothesis || ""} ${entry.supervisor_comment || ""}`.trim();

  // Generate embedding for semantic search
  const embedding = await generateEmbedding(apiKey, searchQuery);

  // Parallel searches: memory + knowledge + past revisions
  let memoryResults: MemoryHit[];
  let knowledgeResults: KnowledgeHit[] = [];

  if (embedding) {
    // Phase 2: Vector-based semantic search
    const [memVec, knowledge, pastRevs] = await Promise.all([
      searchRoleMemoryVector(supabase, roleForSearch, embedding, ["experience", "mistake", "success"], 8),
      searchRoleKnowledgeHybrid(supabase, roleForSearch, searchQuery, embedding, null, 5),
      searchPastRevisions(supabase, entry.role_object as string, entry.id as string, 5),
    ]);
    memoryResults = memVec;
    knowledgeResults = knowledge;

    trajectory.push({
      step: "act",
      content: [
        `🔍 Семантический поиск (embedding ${embedding.length}d):`,
        `  role_memory (${roleForSearch}): ${memoryResults.length} релевантных записей`,
        memoryResults.length
          ? memoryResults.map(m => `  - [${m.memory_type}] (sim: ${(m.similarity || 0).toFixed(3)}) ${m.content.substring(0, 100)}...`).join("\n")
          : "  Релевантный опыт не найден.",
        `  role_knowledge (${roleForSearch}): ${knowledgeResults.length} документов`,
        knowledgeResults.length
          ? knowledgeResults.map(k => `  - [${k.category}] ${k.content.substring(0, 100)}...`).join("\n")
          : "  Релевантные документы не найдены.",
        `  chronicles (${entry.role_object}): ${pastRevs.length} прошлых ревизий`,
        pastRevs.length
          ? pastRevs.map(r => `  - ${r.entry_code}: ${r.title} → ${r.supervisor_resolution}`).join("\n")
          : "  Прошлых ревизий не найдено.",
      ].join("\n"),
      timestamp: now(),
      metadata: {
        search_mode: "semantic",
        role_searched: roleForSearch,
        memory_count: memoryResults.length,
        knowledge_count: knowledgeResults.length,
        past_revisions_count: pastRevs.length,
        embedding_dimensions: embedding.length,
      },
    });

    // ── Step 3: VERIFY — Hypothesis verification against memory (Phase 2) ──
    const analysis = analyzePastRevisions(pastRevs);
    const verification = buildVerification(memoryResults, knowledgeResults, pastRevs, analysis);

    const verifyPrompt = `Верифицируй гипотезу на основе собранных данных из памяти Hydra.

THINK-диагноз:
${thinkResult.content}

Найдено в role_memory: ${memoryResults.length} записей
${memoryResults.slice(0, 3).map(m => `[${m.memory_type}] ${m.content.substring(0, 200)}`).join("\n")}

Найдено в role_knowledge: ${knowledgeResults.length} документов  
${knowledgeResults.slice(0, 3).map(k => `[${k.category}] ${k.content.substring(0, 200)}`).join("\n")}

Статистика прошлых ревизий:
- Success rate: ${analysis.successRate !== null ? Math.round(analysis.successRate * 100) + "%" : "N/A"}
- Успешные стратегии: ${analysis.successfulStrategies.join(", ") || "нет данных"}
- Неуспешные стратегии: ${analysis.failedStrategies.join(", ") || "нет данных"}
- Оценка риска: ${verification.risk_assessment}

Ответь:
1. Подтверждается ли диагноз данными из памяти? (да/частично/нет)
2. Какие паттерны подтверждены или опровергнуты?
3. Рекомендуемая стратегия ревизии с учётом прошлого опыта
4. Уровень уверенности (0.0-1.0)

Кратко, не более 150 слов.`;

    const verifyResult = await callAI(
      apiKey,
      "Ты — верификатор ReAct-цикла Эволюционера Hydra. Проверяешь гипотезы против накопленных данных. Если данных мало — честно указывай на неопределённость.",
      verifyPrompt,
      300,
      0.4,
    );

    trajectory.push({
      step: "verify",
      content: verifyResult.content,
      timestamp: now(),
      metadata: {
        tokens: verifyResult.usage,
        verification,
      },
    });

    // ── Step 4: OBSERVE — Synthesize with verification context ──
    const observePrompt = `Синтезируй результаты полного ReAct-цикла (THINK → ACT → VERIFY).

THINK: ${thinkResult.content}
VERIFY: ${verifyResult.content}

Риск: ${verification.risk_assessment}
Рекомендация: ${verification.recommended_strategy}

Сформулируй финальные наблюдения:
1. Итоговая оценка ситуации
2. Конкретный подход к ревизии  
3. Какие аспекты требуют особой осторожности

Кратко, не более 120 слов.`;

    const observeResult = await callAI(
      apiKey,
      "Ты — наблюдатель ReAct-цикла. Синтезируй информацию из всех предыдущих шагов в actionable plan.",
      observePrompt,
      250,
      0.5,
    );

    trajectory.push({
      step: "observe",
      content: observeResult.content,
      timestamp: now(),
      metadata: { tokens: observeResult.usage },
    });

    // ── Step 5: REVISE — Generate final revision with full context ──
    const contextFromMemory = memoryResults.length
      ? `\nКонтекст из памяти роли:\n${memoryResults.slice(0, 5).map(m => `[${m.memory_type}] ${m.content.substring(0, 200)}`).join("\n")}`
      : "";
    const contextFromKnowledge = knowledgeResults.length
      ? `\nКонтекст из базы знаний:\n${knowledgeResults.slice(0, 3).map(k => `[${k.category}] ${k.content.substring(0, 200)}`).join("\n")}`
      : "";

    const revisionPrompt = buildRevisionPrompt(entry, promptTemplate);
    const fullRevisionPrompt = `${revisionPrompt}

Результаты ReAct-анализа (с верификацией):
THINK: ${thinkResult.content}
VERIFY: ${verifyResult.content}
OBSERVE: ${observeResult.content}
Риск: ${verification.risk_assessment} | Стратегия: ${verification.recommended_strategy}
${contextFromMemory}${contextFromKnowledge}

На основе полного верифицированного анализа предложи пересмотренную гипотезу с конкретными метриками (не более 200 слов).`;

    const revisionResult = await callAI(
      apiKey,
      "Ты — Evolutioner, системный аналитик качества AI-ролей платформы Hydra. Специализируешься на оптимизации промптов и конфигураций моделей. Отвечаешь кратко, с конкретными метриками. Учитывай результаты верификации — если риск высокий, предлагай консервативные изменения.",
      fullRevisionPrompt,
      800,
      0.7,
    );

    // Calculate confidence with verification boost
    let confidence = calculateConfidence(entry, memoryResults.length, pastRevs.length, verification);

    const strategyTags = extractStrategyTags(thinkResult.content);

    const totalInput = (thinkResult.usage?.prompt_tokens || 0) +
      (verifyResult.usage?.prompt_tokens || 0) +
      (observeResult.usage?.prompt_tokens || 0) +
      (revisionResult.usage?.prompt_tokens || 0);
    const totalOutput = (thinkResult.usage?.completion_tokens || 0) +
      (verifyResult.usage?.completion_tokens || 0) +
      (observeResult.usage?.completion_tokens || 0) +
      (revisionResult.usage?.completion_tokens || 0);

    return {
      trajectory,
      revision: revisionResult.content,
      confidence,
      strategy_tags: strategyTags,
      token_usage: { input: totalInput, output: totalOutput },
      verification,
    };
  } else {
    // Fallback: Phase 1 text-based search (no embeddings available)
    const [memText, pastRevs] = await Promise.all([
      searchRoleMemoryText(supabase, roleForSearch),
      searchPastRevisions(supabase, entry.role_object as string, entry.id as string, 3),
    ]);
    memoryResults = memText;

    const actContent = [
      `Поиск в role_memory (роль: ${roleForSearch}): найдено ${memoryResults.length} записей (текстовый поиск)`,
      memoryResults.length
        ? memoryResults.map(m => `- [${m.memory_type}] ${m.content.substring(0, 100)}...`).join("\n")
        : "Релевантный опыт не найден.",
      `\nПоиск в chronicles (объект: ${entry.role_object}): найдено ${pastRevs.length} прошлых ревизий`,
      pastRevs.length
        ? pastRevs.map(r => `- ${r.entry_code}: ${r.title} → ${r.supervisor_resolution}`).join("\n")
        : "Прошлых ревизий не найдено.",
    ].join("\n");

    trajectory.push({
      step: "act",
      content: actContent,
      timestamp: now(),
      metadata: { search_mode: "text_fallback", role_searched: roleForSearch, memory_count: memoryResults.length, past_revisions_count: pastRevs.length },
    });

    // OBSERVE (simplified, no verification)
    const observePrompt = `На основе анализа (THINK) и собранных данных (ACT), сформулируй наблюдения.

THINK-анализ:
${thinkResult.content}

ACT-данные:
${actContent}

Ответь:
1. Какие паттерны видны в прошлом опыте?
2. Какой подход рекомендуешь для текущей ревизии?

Кратко, не более 120 слов.`;

    const observeResult = await callAI(apiKey, "Ты — наблюдатель ReAct-цикла.", observePrompt, 250, 0.5);

    trajectory.push({ step: "observe", content: observeResult.content, timestamp: now(), metadata: { tokens: observeResult.usage } });

    // REVISE
    const revisionPrompt = buildRevisionPrompt(entry, promptTemplate);
    const contextFromMemory = memoryResults.length
      ? `\nКонтекст из памяти роли:\n${memoryResults.map(m => `[${m.memory_type}] ${m.content.substring(0, 200)}`).join("\n")}`
      : "";

    const fullRevisionPrompt = `${revisionPrompt}\n\nTHINK: ${thinkResult.content}\nOBSERVE: ${observeResult.content}${contextFromMemory}\n\nПредложи ревизию (не более 200 слов).`;

    const revisionResult = await callAI(
      apiKey,
      "Ты — Evolutioner, системный аналитик качества AI-ролей платформы Hydra. Отвечаешь кратко, с конкретными метриками.",
      fullRevisionPrompt,
      800,
      0.7,
    );

    let confidence = 0.5;
    if (memoryResults.length) confidence += 0.1;
    if (pastRevs.length) confidence += 0.1;
    if ((entry.supervisor_comment as string)?.length > 20) confidence += 0.1;
    if (entry.metrics_before && entry.metrics_after) confidence += 0.1;
    confidence = Math.min(confidence, 0.85); // cap lower without verification

    const strategyTags = extractStrategyTags(thinkResult.content);
    const totalInput = (thinkResult.usage?.prompt_tokens || 0) + (observeResult.usage?.prompt_tokens || 0) + (revisionResult.usage?.prompt_tokens || 0);
    const totalOutput = (thinkResult.usage?.completion_tokens || 0) + (observeResult.usage?.completion_tokens || 0) + (revisionResult.usage?.completion_tokens || 0);

    return {
      trajectory,
      revision: revisionResult.content,
      confidence,
      strategy_tags: strategyTags,
      token_usage: { input: totalInput, output: totalOutput },
    };
  }
}

// ============================================
// Helpers
// ============================================

function buildRevisionPrompt(entry: Record<string, unknown>, promptTemplate: string | null): string {
  if (promptTemplate) {
    return promptTemplate
      .replace("{{entry_code}}", entry.entry_code as string)
      .replace("{{title}}", entry.title as string)
      .replace("{{role_object}}", (entry.role_object as string) || "")
      .replace("{{hypothesis}}", (entry.hypothesis as string) || "Не указана")
      .replace("{{metrics_before}}", JSON.stringify(entry.metrics_before || {}, null, 2))
      .replace("{{metrics_after}}", JSON.stringify(entry.metrics_after || {}, null, 2))
      .replace("{{supervisor_comment}}", (entry.supervisor_comment as string) || "Не указан")
      .replace("{{summary}}", (entry.summary as string) || "Не указан");
  }
  return `Запись: ${entry.entry_code} — ${entry.title}. Объект: ${entry.role_object}. Гипотеза: ${entry.hypothesis}. Комментарий Супервизора: ${entry.supervisor_comment}.`;
}

function calculateConfidence(
  entry: Record<string, unknown>,
  memoryCount: number,
  pastRevisionsCount: number,
  verification: { risk_assessment: string; success_rate: number | null },
): number {
  let confidence = 0.5;
  if (memoryCount > 0) confidence += 0.1;
  if (memoryCount > 3) confidence += 0.05;
  if (pastRevisionsCount > 0) confidence += 0.1;
  if ((entry.supervisor_comment as string)?.length > 20) confidence += 0.1;
  if (entry.metrics_before && entry.metrics_after) confidence += 0.05;

  // Phase 2: verification adjustments
  if (verification.risk_assessment === "low") confidence += 0.1;
  else if (verification.risk_assessment === "high") confidence -= 0.1;

  if (verification.success_rate !== null && verification.success_rate >= 0.7) confidence += 0.05;

  return Math.min(Math.max(confidence, 0.2), 0.95);
}

function extractStrategyTags(thinkContent: string): string[] {
  const tags: string[] = [];
  const analysis = thinkContent.toLowerCase();
  if (analysis.includes("промпт")) tags.push("prompt_optimization");
  if (analysis.includes("модел")) tags.push("model_selection");
  if (analysis.includes("запрос") || analysis.includes("неясн")) tags.push("query_clarification");
  if (analysis.includes("конфигурац")) tags.push("config_adjustment");
  if (tags.length === 0) tags.push("general_revision");
  return tags;
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
        const roleObj = ((entry.role_object as string) || "").toLowerCase();
        let promptKey = "rejected_default";
        if (roleObj.includes("technoarbiter") || roleObj.includes("арбитр") || roleObj.includes("contest-arbiter")) {
          promptKey = "rejected_technoarbiter";
        } else if (roleObj.includes("technocritic") || roleObj.includes("критик")) {
          promptKey = "rejected_technocritic";
        } else if (roleObj.includes("guide") || roleObj.includes("гид")) {
          promptKey = "rejected_guide";
        }

        const promptTemplate = await loadEvolutionerPrompt(promptKey) ||
          await loadEvolutionerPrompt("rejected_default");

        const structured = await executeReActPipeline(supabase, entry, LOVABLE_API_KEY, promptTemplate);

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
          verification: structured.verification ? {
            risk: structured.verification.risk_assessment,
            success_rate: structured.verification.success_rate,
            similar_cases: structured.verification.similar_cases_found,
          } : null,
        });

        // Notify supervisors
        const { data: supervisors } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "supervisor");

        if (supervisors && supervisors.length > 0) {
          const riskEmoji = structured.verification?.risk_assessment === "low" ? "🟢"
            : structured.verification?.risk_assessment === "high" ? "🔴" : "🟡";
          const notifRows = supervisors.map((s: { user_id: string }) => ({
            user_id: s.user_id,
            chronicle_id: entry.id,
            entry_code: entry.entry_code,
            message: `🧬 ReAct-ревизия (v2) для ${entry.entry_code}: «${entry.title}». ${riskEmoji} Риск: ${structured.verification?.risk_assessment || "N/A"} | Уверенность: ${Math.round(structured.confidence * 100)}% | Стратегия: ${structured.strategy_tags.join(", ")}.`,
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
        message: `Evolution cycle complete (ReAct v2 — verified)`,
        revised: results.filter(r => r.status === "revised").length,
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
