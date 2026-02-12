import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  CORS_HEADERS,
  DEEPSEEK_MODELS,
  MISTRAL_MODELS,
  GROQ_MODELS,
  GEMINI_MODELS,
  isOpenRouterModel,
  isProxyApiModel,
  DEFAULT_PROMPTS,
  buildMemoryContext,
  type StreamRequest,
  type ProxyApiSettings,
} from "./types.ts";
import { streamDeepSeek, streamMistral, streamGroq, streamGemini, streamLovableAI, streamOpenRouter, streamProxyApi } from "./providers.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const {
      message,
      model_id,
      role = "assistant",
      system_prompt,
      temperature = 0.7,
      max_tokens = 4096,
      memory_context = [],
      proxyapi_settings,
      history,
    }: StreamRequest = await req.json();

    if (!message || !model_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: message, model_id" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Build final system prompt with memory context
    const basePrompt = system_prompt || DEFAULT_PROMPTS[role] || DEFAULT_PROMPTS.assistant;
    const finalSystemPrompt = basePrompt + buildMemoryContext(memory_context);

    if (memory_context.length > 0) {
      console.log(`[hydra-stream] Including ${memory_context.length} memory chunks`);
    }
    if (history && history.length > 0) {
      console.log(`[hydra-stream] Including ${history.length} history messages for multi-turn context`);
    }

    // Route to the correct provider
    const params = {
      req,
      model_id,
      systemPrompt: finalSystemPrompt,
      message,
      temperature,
      max_tokens,
      proxyapi_settings,
      history,
    };

    if (DEEPSEEK_MODELS.includes(model_id)) {
      return streamDeepSeek(params);
    }

    if (MISTRAL_MODELS.includes(model_id)) {
      return streamMistral(params);
    }

    if (GROQ_MODELS.includes(model_id)) {
      return streamGroq(params);
    }

    if (GEMINI_MODELS.includes(model_id)) {
      return streamGemini(params);
    }

    if (isProxyApiModel(model_id)) {
      return streamProxyApi(params);
    }

    if (isOpenRouterModel(model_id)) {
      return streamOpenRouter(params);
    }

    return streamLovableAI(params);
  } catch (error) {
    console.error("[hydra-stream] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
