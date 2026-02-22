import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const { batchSize = 3, targetLang = "en" } = await req.json().catch(() => ({}));

    // Fetch untranslated messages
    const { data: messages, error: fetchErr } = await supabase
      .from("messages")
      .select("id, content, role")
      .is("content_en", null)
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (fetchErr) throw fetchErr;
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ translated: 0, remaining: 0, message: "All messages already translated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Translate each message via LLM
    const results: Array<{ id: string; content_en: string; role: string }> = [];

    for (const msg of messages) {
      const text = msg.content.length > 4000 ? msg.content.slice(0, 4000) : msg.content;
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are a professional translator specializing in AI/ML and software development terminology.
Translate the following text from Russian to ${targetLang === "en" ? "English" : "Russian"}.
Preserve all markdown formatting, code blocks, technical terms, and structure.
Glossary: Техно-Арбитр → Techno-Arbiter, ОТК → QCD (Quality Control Department), Логистик → Logistician, Архивариус → Archivist, Штаб → HQ (War Room), Конкурс → Contest, Дуэль → Duel, Гидрапедия → Hydrapedia.
Output ONLY the translation, nothing else.`,
            },
            { role: "user", content: text },
          ],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        console.error(`Translation failed for ${msg.id}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const translation = data.choices?.[0]?.message?.content;
      if (translation) {
        results.push({ id: msg.id, content_en: translation, role: msg.role });
      }
    }

    // Save translations
    let savedCount = 0;
    for (const r of results) {
      const { error: updateErr } = await supabase
        .from("messages")
        .update({ content_en: r.content_en })
        .eq("id", r.id);

      if (!updateErr) savedCount++;
      else console.error(`Failed to save ${r.id}:`, updateErr);
    }

    // Count remaining
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .is("content_en", null);

    return new Response(JSON.stringify({
      translated: savedCount,
      remaining: count || 0,
      details: results.map(r => ({ id: r.id, role: r.role, preview: r.content_en.slice(0, 100) })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-messages error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
