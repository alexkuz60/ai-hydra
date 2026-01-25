import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ModelRequest {
  model_id: string;
  use_lovable_ai: boolean;
  provider?: string | null;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  role?: 'assistant' | 'critic' | 'arbiter';
}

interface RequestBody {
  session_id: string;
  message: string;
  models: ModelRequest[];
}

async function callLovableAI(
  apiKey: string,
  model: string,
  message: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number
) {
  // OpenAI models use max_completion_tokens, others use max_tokens
  const isOpenAI = model.startsWith("openai/");
  const tokenParam = isOpenAI 
    ? { max_completion_tokens: maxTokens }
    : { max_tokens: maxTokens };

  // OpenAI models via Lovable AI don't support custom temperature
  const tempParam = isOpenAI ? {} : { temperature };

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
      ...tempParam,
      ...tokenParam,
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

    const { session_id, message, models }: RequestBody = await req.json();

    if (!session_id || !message || !models || models.length === 0) {
      return new Response(JSON.stringify({ error: "session_id, message, and models are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, openai_api_key, google_gemini_api_key, anthropic_api_key")
      .eq("user_id", user.id)
      .single();

    // Default system prompts for each role
    const defaultPrompts: Record<string, string> = {
      assistant: `You are an expert participating in a multi-agent discussion. Provide clear, well-reasoned responses. Be concise but thorough. Your perspective may differ from other AI models in this conversation.`,
      critic: `You are a critical analyst. Your task is to find weaknesses, contradictions, and potential problems in reasoning. Be constructive but rigorous. Challenge assumptions and identify logical flaws.`,
      arbiter: `You are a discussion arbiter. Synthesize different viewpoints, highlight consensus and disagreements. Form a balanced final decision based on the merits of each argument.`,
    };

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const isAdmin = profile?.username === "AlexKuz";

    const errors: { model: string; error: string }[] = [];

    console.log(`Processing ${models.length} models:`, models.map(m => m.model_id));

    // Process all models in parallel with individual settings
    const modelPromises = models.map(async (modelReq) => {
      // Use per-model settings or defaults
      const temperature = modelReq.temperature ?? 0.7;
      const maxTokens = modelReq.max_tokens ?? 2048;
      const role = modelReq.role ?? 'assistant';
      const systemPrompt = modelReq.system_prompt || defaultPrompts[role] || defaultPrompts.assistant;

      console.log(`Starting request for model: ${modelReq.model_id}, role: ${role}, temp: ${temperature}`);
      
      try {
        let result: { model: string; provider: string; content: string };
        
        if (modelReq.use_lovable_ai) {
          // Check if user is admin
          if (!isAdmin) {
            throw new Error("Lovable AI access restricted to admin only");
          }
          if (!lovableKey) {
            throw new Error("Lovable AI not configured");
          }
          result = await callLovableAI(lovableKey, modelReq.model_id, message, systemPrompt, temperature, maxTokens);
        } else {
          // Use personal API key
          let apiKey: string | null = null;
          if (modelReq.provider === "openai") apiKey = profile?.openai_api_key;
          if (modelReq.provider === "gemini") apiKey = profile?.google_gemini_api_key;
          if (modelReq.provider === "anthropic") apiKey = profile?.anthropic_api_key;

          if (!apiKey) {
            throw new Error(`No API key configured for ${modelReq.provider}`);
          }

          result = await callPersonalModel(modelReq.provider!, apiKey, modelReq.model_id, message, systemPrompt, temperature, maxTokens);
        }
        
        console.log(`Success for model: ${modelReq.model_id}`);
        return { ...result, role }; // Include role in result for DB insert
      } catch (error: any) {
        console.error(`Error for model ${modelReq.model_id}:`, error.message || error);
        return { error: true, model: modelReq.model_id, message: error.message || "Unknown error" };
      }
    });

    const allResults = await Promise.all(modelPromises);
    console.log(`All results received: ${allResults.length}`);

    // Separate successes and errors
    const successResults: { model: string; provider: string; content: string; role: string }[] = [];
    for (const result of allResults) {
      if ('error' in result && result.error === true) {
        errors.push({ model: result.model, error: result.message });
      } else {
        successResults.push(result as { model: string; provider: string; content: string; role: string });
      }
    }
    
    console.log(`Results: ${successResults.length} successes, ${errors.length} errors`);

    // Save all successful responses to database with individual roles
    if (successResults.length > 0) {
      const messagesToInsert = successResults.map(result => ({
        session_id,
        user_id: user.id,
        role: result.role as 'assistant' | 'critic' | 'arbiter',
        model_name: result.model,
        content: result.content,
        metadata: { provider: result.provider },
      }));

      await supabase.from("messages").insert(messagesToInsert);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      responses: successResults,
      errors: errors.length > 0 ? errors : undefined 
    }), {
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
