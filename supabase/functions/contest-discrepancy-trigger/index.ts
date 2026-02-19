import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISCREPANCY_THRESHOLD = 2.5; // баллов на шкале 0-10

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { result_id, model_id, user_score, arbiter_score, session_id, round_prompt } = body;

    if (user_score == null || arbiter_score == null) {
      return new Response(JSON.stringify({ error: "Both user_score and arbiter_score are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const delta = Math.abs(user_score - arbiter_score);

    if (delta < DISCREPANCY_THRESHOLD) {
      return new Response(
        JSON.stringify({ triggered: false, delta, threshold: DISCREPANCY_THRESHOLD }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Расхождение превышает порог — запускаем Эволюционера
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const direction = user_score > arbiter_score
      ? `Пользователь оценил ВЫШЕ Арбитра (+${delta.toFixed(1)} балла). Возможно, Арбитр занижает оценки или критерии слишком строгие.`
      : `Пользователь оценил НИЖЕ Арбитра (-${delta.toFixed(1)} балла). Возможно, Арбитр завышает оценки или не улавливает субъективные ожидания пользователя.`;

    const evolutionerPrompt = `Ты — Evolutioner (Эволюционер), системный аналитик качества AI-ролей платформы Hydra.

Зафиксировано критическое расхождение оценок на конкурсе моделей:

ДАННЫЕ РАСХОЖДЕНИЯ:
- Модель: ${model_id}
- Оценка пользователя (👤): ${user_score}/10
- Оценка арбитра (⚖️): ${arbiter_score}/10
- Дельта: ${delta.toFixed(1)} балла (порог срабатывания: ${DISCREPANCY_THRESHOLD})
- Промпт раунда: ${round_prompt ? round_prompt.slice(0, 300) : "не указан"}

АНАЛИЗ: ${direction}

Твоя задача: сформулировать ГИПОТЕЗУ об улучшении (не более 150 слов) с:
1. Предполагаемой причиной расхождения (промпт арбитра? критерии? веса?)
2. Конкретным предложением по калибровке (что именно изменить в системном промпте арбитра или критериях)
3. Ожидаемым эффектом — как изменится дельта после исправления

Отвечай кратко, без вводных оборотов, на русском языке.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Ты — Evolutioner, системный аналитик качества AI-ролей платформы Hydra. Специализируешься на калибровке оценочных систем. Отвечаешь кратко, с конкретными метриками.",
          },
          { role: "user", content: evolutionerPrompt },
        ],
        max_tokens: 600,
        temperature: 0.6,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI error:", aiResponse.status, await aiResponse.text());
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const hypothesis = aiData.choices?.[0]?.message?.content;

    if (!hypothesis) {
      throw new Error("Evolutioner did not return a hypothesis");
    }

    // Генерируем код записи
    const { data: existingEntries } = await supabase
      .from("chronicles")
      .select("entry_code")
      .ilike("entry_code", "HYDRA-EVO-%")
      .order("entry_code", { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (existingEntries && existingEntries.length > 0) {
      const lastCode = existingEntries[0].entry_code;
      const match = lastCode.match(/HYDRA-EVO-(\d+)/);
      if (match) nextNumber = parseInt(match[1]) + 1;
    }
    const entryCode = `HYDRA-EVO-${String(nextNumber).padStart(3, "0")}`;

    // Сохраняем запись в Хроники
    const { data: newEntry, error: insertError } = await supabase
      .from("chronicles")
      .insert({
        entry_code: entryCode,
        title: `Расхождение оценок: модель ${model_id.split("/").pop()} (Δ${delta.toFixed(1)} балла)`,
        role_object: `contest-arbiter — конфигурация критериев и весов`,
        initiator: "Evolutioner (автозапуск по расхождению оценок конкурса)",
        status: "pending",
        supervisor_resolution: "pending",
        hypothesis,
        metrics_before: {
          user_score,
          arbiter_score,
          delta: parseFloat(delta.toFixed(2)),
          model_id,
          session_id: session_id || null,
          trigger: "contest_discrepancy",
        },
        metrics_after: {
          target_delta: `< ${DISCREPANCY_THRESHOLD}`,
          description: "Ожидается снижение расхождения между оценкой пользователя и арбитра",
        },
        summary: `Автоматически зафиксировано расхождение оценок: пользователь — ${user_score}/10, арбитр — ${arbiter_score}/10 (дельта: ${delta.toFixed(1)}). Эволюционер предложил гипотезу для калибровки.`,
        is_visible: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Chronicle insert error:", insertError);
      throw new Error("Failed to create chronicle entry");
    }

    // Уведомляем супервизоров
    const { data: supervisors } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "supervisor");

    if (supervisors && supervisors.length > 0) {
      const notifRows = supervisors.map((s: { user_id: string }) => ({
        user_id: s.user_id,
        chronicle_id: newEntry.id,
        entry_code: entryCode,
        message: `Эволюционер зафиксировал расхождение оценок (Δ${delta.toFixed(1)} балла) по модели ${model_id.split("/").pop()}. Запись ${entryCode} в Хрониках требует вашей резолюции.`,
        is_read: false,
      }));
      await supabase.from("supervisor_notifications").insert(notifRows);
    }

    console.log(`[contest-discrepancy-trigger] Chronicle ${entryCode} created for model ${model_id}, delta=${delta}`);

    return new Response(
      JSON.stringify({
        triggered: true,
        delta,
        threshold: DISCREPANCY_THRESHOLD,
        entry_code: entryCode,
        chronicle_id: newEntry.id,
        hypothesis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("contest-discrepancy-trigger error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
