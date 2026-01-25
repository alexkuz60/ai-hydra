import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  session_id: string;
  message: string;
  selected_model: string;
  use_lovable_ai: boolean;
  provider?: string;
  temperature?: number;
  max_tokens?: number;
}

async function callLovableAI(
  apiKey: string,
  model: string,
  message: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number
) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw { status: 429, message: "Rate limit exceeded" };
    }
    if (response.status === 402) {
      throw { status: 402, message: "Payment required" };
    }
    const error = await response.text();
    throw new Error(`Lovable AI error: ${error}`);
  }

  const data = await response.json();
  return {
    model,
    provider: "lovable",
    content: data.choices?.[0]?.message?.content || "",
  };
}

async function callPersonalModel(
  provider: string,
  apiKey: string,
  model: string,
  message: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number
) {
  if (provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI error: ${await response.text()}`);
    const data = await response.json();
    return { model, provider: "openai", content: data.choices?.[0]?.message?.content || "" };
  }

  if (provider === "gemini") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini error: ${await response.text()}`);
    const data = await response.json();
    return { model: "gemini-1.5-pro", provider: "gemini", content: data.candidates?.[0]?.content?.parts?.[0]?.text || "" };
  }

  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
        temperature,
      }),
    });

    if (!response.ok) throw new Error(`Anthropic error: ${await response.text()}`);
    const data = await response.json();
    return { model: "claude-3-5-sonnet", provider: "anthropic", content: data.content?.[0]?.text || "" };
  }

  throw new Error(`Unknown provider: ${provider}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_id, message, selected_model, use_lovable_ai, provider, temperature = 0.7, max_tokens = 2048 }: RequestBody = await req.json();

    if (!session_id || !message || !selected_model) {
      return new Response(JSON.stringify({ error: "session_id, message, and selected_model are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, openai_api_key, google_gemini_api_key, anthropic_api_key")
      .eq("user_id", user.id)
      .single();

    const systemPrompt = `You are an expert AI assistant. Provide clear, well-reasoned responses. Be concise but thorough.`;

    let result;

    if (use_lovable_ai) {
      // Check if user is admin (AlexKuz)
      if (profile?.username !== "AlexKuz") {
        return new Response(JSON.stringify({ error: "Lovable AI access restricted to admin only" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableKey) {
        return new Response(JSON.stringify({ error: "Lovable AI not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      result = await callLovableAI(lovableKey, selected_model, message, systemPrompt, temperature, max_tokens);
    } else {
      // Use personal API key
      let apiKey: string | null = null;
      if (provider === "openai") apiKey = profile?.openai_api_key;
      if (provider === "gemini") apiKey = profile?.google_gemini_api_key;
      if (provider === "anthropic") apiKey = profile?.anthropic_api_key;

      if (!apiKey) {
        return new Response(JSON.stringify({ error: `No API key configured for ${provider}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      result = await callPersonalModel(provider!, apiKey, selected_model, message, systemPrompt, temperature, max_tokens);
    }

    // Save response to database
    await supabase.from("messages").insert({
      session_id,
      user_id: user.id,
      role: "assistant",
      model_name: result.model,
      content: result.content,
      metadata: { provider: result.provider },
    });

    return new Response(JSON.stringify({ success: true, response: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Orchestrator error:", error);
    const status = error.status || 500;
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
