import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TRANSLATION_MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `You are a professional translator specializing in AI/ML and software development terminology.
Translate the following text from Russian to English.
Preserve all markdown formatting, code blocks, technical terms, and structure.
Glossary: Техно-Арбитр → Techno-Arbiter, ОТК → QCD (Quality Control Department), Логистик → Logistician, Архивариус → Archivist, Штаб → HQ (War Room), Конкурс → Contest, Дуэль → Duel, Гидрапедия → Hydrapedia.
Output ONLY the translation, nothing else.`;

async function translateWithOpenRouter(text: string, apiKey: string): Promise<string | null> {
  try {
    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-hydra.lovable.app",
        "X-Title": "Hydra Translator",
      },
      body: JSON.stringify({
        model: TRANSLATION_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });
    if (!resp.ok) {
      console.warn(`[translate-messages] OpenRouter ${resp.status}`);
      return null;
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.warn("[translate-messages] OpenRouter error:", e);
    return null;
  }
}

async function translateWithLovable(text: string, apiKey: string): Promise<string | null> {
  try {
    const resp = await fetch(LOVABLE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });
    if (!resp.ok) {
      console.warn(`[translate-messages] Lovable AI ${resp.status}`);
      return null;
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.warn("[translate-messages] Lovable AI error:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

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

    // Get user's OpenRouter key
    const { data: apiKeys } = await supabase.rpc("get_my_api_keys");
    const keyData = Array.isArray(apiKeys) ? apiKeys[0] : apiKeys;
    const openrouterKey = keyData?.openrouter_api_key as string | undefined;

    const gateway = openrouterKey ? "openrouter" : "lovable_ai";
    console.log(`[translate-messages] Gateway: ${gateway}, batch: ${messages.length}`);

    // Translate each message
    const results: Array<{ id: string; content_en: string; role: string }> = [];

    for (const msg of messages) {
      const text = msg.content.length > 4000 ? msg.content.slice(0, 4000) : msg.content;
      
      // Try OpenRouter first, fallback to Lovable AI
      let translation: string | null = null;
      if (openrouterKey) {
        translation = await translateWithOpenRouter(text, openrouterKey);
      }
      if (!translation && lovableKey) {
        translation = await translateWithLovable(text, lovableKey);
      }

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
      gateway,
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
