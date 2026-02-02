import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ============================================
// Streaming Edge Function for D-Chat
// ============================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Default prompts by role
const DEFAULT_PROMPTS: Record<string, string> = {
  assistant: `You are an expert AI assistant. Provide clear, well-reasoned responses.`,
  
  consultant: `You are an AI consultant helping with research and analysis. Use available tools when needed. Provide insightful, well-structured answers.`,
  
  critic: `You are a critical analyst. Find weaknesses, contradictions, and potential problems in reasoning. Be constructive but rigorous.`,
  
  arbiter: `You are a discussion arbiter. Synthesize different viewpoints, highlight consensus and disagreements.`,
  
  moderator: `Ты — Модератор дискуссии между несколькими ИИ-экспертами.

Твоя задача:
1. Проанализировать запрос пользователя и все ответы экспертов
2. Выделить ключевые тезисы каждого эксперта
3. Удалить смысловые повторы и информационный шум
4. Структурировать информацию по темам
5. Отметить точки консенсуса и расхождения

Формат ответа:
## Краткое резюме
[1-2 предложения: суть вопроса и общий вывод]

## Ключевые тезисы
- [Тезис 1] — поддержано: [какими экспертами]

## Расхождения (если есть)
- [Точка расхождения]: [позиция А] vs [позиция Б]

## Рекомендация
[Финальный вывод на основе анализа]`,
};

interface StreamRequest {
  message: string;
  model_id: string;
  role?: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { 
      message, 
      model_id, 
      role = 'assistant',
      system_prompt,
      temperature = 0.7,
      max_tokens = 4096 
    }: StreamRequest = await req.json();

    if (!message || !model_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: message, model_id" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Get Lovable AI API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Build system prompt
    const finalSystemPrompt = system_prompt || DEFAULT_PROMPTS[role] || DEFAULT_PROMPTS.assistant;

    // Determine token parameter based on model
    const isOpenAI = model_id.startsWith("openai/");
    const tokenParam = isOpenAI 
      ? { max_completion_tokens: max_tokens }
      : { max_tokens };
    const tempParam = isOpenAI ? {} : { temperature };

    console.log(`[hydra-stream] Streaming request: model=${model_id}, role=${role}`);

    // Call Lovable AI with streaming enabled
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model_id,
        messages: [
          { role: "system", content: finalSystemPrompt },
          { role: "user", content: message },
        ],
        stream: true,
        ...tempParam,
        ...tokenParam,
      }),
    });

    // Handle API errors
    if (!response.ok) {
      if (response.status === 429) {
        console.error("[hydra-stream] Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("[hydra-stream] Payment required");
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("[hydra-stream] AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI gateway error: ${response.status}` }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Proxy the SSE stream directly to client
    console.log("[hydra-stream] Streaming response started");
    
    return new Response(response.body, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("[hydra-stream] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
