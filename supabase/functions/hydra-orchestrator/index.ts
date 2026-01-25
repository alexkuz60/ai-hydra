import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LLMResponse {
  model: string;
  provider: string;
  content: string;
  reasoning_path?: string;
  confidence_score?: number;
  error?: string;
}

interface RequestBody {
  session_id: string;
  message: string;
  models: {
    openai?: boolean;
    gemini?: boolean;
    anthropic?: boolean;
  };
  temperature?: number;
  max_tokens?: number;
}

async function callOpenAI(
  apiKey: string,
  message: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<LLMResponse> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return {
      model: "gpt-4o",
      provider: "openai",
      content: data.choices[0]?.message?.content || "",
      confidence_score: 0.85,
    };
  } catch (error) {
    return {
      model: "gpt-4o",
      provider: "openai",
      content: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function callGemini(
  apiKey: string,
  message: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<LLMResponse> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return {
      model: "gemini-1.5-pro",
      provider: "gemini",
      content,
      confidence_score: 0.82,
    };
  } catch (error) {
    return {
      model: "gemini-1.5-pro",
      provider: "gemini",
      content: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function callAnthropic(
  apiKey: string,
  message: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<LLMResponse> {
  try {
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

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    return {
      model: "claude-3-5-sonnet",
      provider: "anthropic",
      content: data.content?.[0]?.text || "",
      confidence_score: 0.88,
    };
  } catch (error) {
    return {
      model: "claude-3-5-sonnet",
      provider: "anthropic",
      content: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    const { session_id, message, models, temperature = 0.7, max_tokens = 2048 }: RequestBody = await req.json();

    if (!session_id || !message) {
      return new Response(
        JSON.stringify({ error: "session_id and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's API keys from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("openai_api_key, google_gemini_api_key, anthropic_api_key")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert AI assistant participating in a multi-model discussion. 
Provide clear, well-reasoned responses. Be concise but thorough.
If you're uncertain about something, express your confidence level.`;

    // Build parallel requests based on available keys and requested models
    const requests: Promise<LLMResponse>[] = [];

    if (models?.openai !== false && profile.openai_api_key) {
      requests.push(callOpenAI(profile.openai_api_key, message, systemPrompt, temperature, max_tokens));
    }

    if (models?.gemini !== false && profile.google_gemini_api_key) {
      requests.push(callGemini(profile.google_gemini_api_key, message, systemPrompt, temperature, max_tokens));
    }

    if (models?.anthropic !== false && profile.anthropic_api_key) {
      requests.push(callAnthropic(profile.anthropic_api_key, message, systemPrompt, temperature, max_tokens));
    }

    if (requests.length === 0) {
      return new Response(
        JSON.stringify({ error: "No API keys configured. Please add your API keys in your profile." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute all requests in parallel
    const responses = await Promise.all(requests);

    // Save assistant messages to database
    const successfulResponses = responses.filter(r => !r.error);
    
    if (successfulResponses.length > 0) {
      const messagesToInsert = successfulResponses.map(r => ({
        session_id,
        user_id: userId,
        role: "assistant" as const,
        model_name: r.model,
        content: r.content,
        confidence_score: r.confidence_score,
        metadata: { provider: r.provider },
      }));

      await supabase.from("messages").insert(messagesToInsert);
    }

    return new Response(
      JSON.stringify({
        success: true,
        responses,
        total: responses.length,
        successful: successfulResponses.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Orchestrator error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
