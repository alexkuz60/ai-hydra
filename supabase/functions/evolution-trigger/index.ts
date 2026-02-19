import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { mode, chronicle_id } = body;

    // mode: 'single' (triggered by rejection) or 'autorun' (all rejected)
    let targetEntries = [];

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
      // Determine which prompt key to use based on role_object
      const roleObj = (entry.role_object || "").toLowerCase();
      let promptKey = "rejected_default";
      if (roleObj.includes("technoarbiter") || roleObj.includes("арбитр") || roleObj.includes("contest-arbiter")) {
        promptKey = "rejected_technoarbiter";
      } else if (roleObj.includes("technocritic") || roleObj.includes("критик")) {
        promptKey = "rejected_technocritic";
      } else if (roleObj.includes("guide") || roleObj.includes("гид")) {
        promptKey = "rejected_guide";
      }

      // Load prompt template from DB, fall back to hardcoded
      const promptTemplate = await loadEvolutionerPrompt(promptKey)
        || await loadEvolutionerPrompt("rejected_default");

      const evolutionerPrompt = promptTemplate
        ? promptTemplate
            .replace("{{entry_code}}", entry.entry_code)
            .replace("{{title}}", entry.title)
            .replace("{{role_object}}", entry.role_object || "")
            .replace("{{hypothesis}}", entry.hypothesis || "Не указана")
            .replace("{{metrics_before}}", JSON.stringify(entry.metrics_before || {}, null, 2))
            .replace("{{metrics_after}}", JSON.stringify(entry.metrics_after || {}, null, 2))
            .replace("{{supervisor_comment}}", entry.supervisor_comment || "Не указан")
            .replace("{{summary}}", entry.summary || "Не указан")
        : `Ты — Эволюционер, системная роль Hydra. Запись: ${entry.entry_code} — ${entry.title}. Объект: ${entry.role_object}. Гипотеза: ${entry.hypothesis}. Комментарий Супервизора: ${entry.supervisor_comment}. Предложи пересмотренную гипотезу с конкретными метриками (не более 200 слов).`;

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
              content:
                "Ты — Evolutioner, системный аналитик качества AI-ролей платформы Hydra. Специализируешься на оптимизации промптов и конфигураций моделей. Отвечаешь кратко, с конкретными метриками.",
            },
            { role: "user", content: evolutionerPrompt },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!aiResponse.ok) {
        console.error(`AI error for ${entry.entry_code}:`, aiResponse.status);
        results.push({ entry_code: entry.entry_code, status: "ai_error" });
        continue;
      }

      const aiData = await aiResponse.json();
      const revision = aiData.choices?.[0]?.message?.content;

      if (revision) {
        // Save revision to the chronicle entry
        const { error: updateError } = await supabase
          .from("chronicles")
          .update({
            ai_revision: revision,
            status: "revised",
          })
          .eq("id", entry.id);

        if (updateError) {
          console.error(`Update error for ${entry.entry_code}:`, updateError);
          results.push({ entry_code: entry.entry_code, status: "update_error" });
        } else {
          results.push({ entry_code: entry.entry_code, status: "revised", revision });

          // Notify all supervisors about the new AI revision
          const { data: supervisors } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "supervisor");

          if (supervisors && supervisors.length > 0) {
            const notifRows = supervisors.map((s: { user_id: string }) => ({
              user_id: s.user_id,
              chronicle_id: entry.id,
              entry_code: entry.entry_code,
              message: `ИИ-ревизия Эволюционера готова для записи ${entry.entry_code}: «${entry.title}». Требует вашей оценки.`,
              is_read: false,
            }));
            const { error: notifError } = await supabase.from("supervisor_notifications").insert(notifRows);
            if (notifError) console.error("Notification insert error:", notifError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Evolution cycle complete`,
        revised: results.filter((r) => r.status === "revised").length,
        total: targetEntries.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("evolution-trigger error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
