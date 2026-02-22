// ============================================
// Shared ProxyAPI Model Mappings
// Used by: hydra-orchestrator, hydra-stream, proxy-api-test
// ============================================

/** Map proxyapi/ prefixed model IDs to universal OpenAI-compatible model IDs with provider prefix */
export const PROXYAPI_MODEL_MAP: Record<string, string> = {
  "proxyapi/gpt-4o": "openai/gpt-4o",
  "proxyapi/gpt-4o-mini": "openai/gpt-4o-mini",
  "proxyapi/o3-mini": "openai/o3-mini",
  "proxyapi/gpt-5": "openai/gpt-5",
  "proxyapi/gpt-5-mini": "openai/gpt-5-mini",
  "proxyapi/gpt-5.2": "openai/gpt-5.2",
  "proxyapi/gpt-oss-20b": "openai/gpt-oss-20b",
  "proxyapi/gpt-oss-120b": "openai/gpt-oss-120b",
  "proxyapi/claude-sonnet-4": "anthropic/claude-sonnet-4-20250514",
  "proxyapi/claude-opus-4": "anthropic/claude-opus-4-6",
  "proxyapi/claude-3-5-sonnet": "anthropic/claude-3-5-sonnet-20241022",
  "proxyapi/claude-3-5-haiku": "anthropic/claude-3-5-haiku-20241022",
  "proxyapi/gemini-3-pro-preview": "gemini/gemini-3-pro-preview",
  "proxyapi/gemini-3-flash-preview": "gemini/gemini-3-flash-preview",
  "proxyapi/gemini-2.5-pro": "gemini/gemini-2.5-pro",
  "proxyapi/gemini-2.5-flash": "gemini/gemini-2.5-flash",
  "proxyapi/gemini-2.0-flash": "gemini/gemini-2.0-flash",
  "proxyapi/deepseek-chat": "deepseek/deepseek-chat",
  "proxyapi/deepseek-reasoner": "deepseek/deepseek-reasoner",
};

/** Map proxyapi/ model IDs to Lovable AI equivalents for 404 fallback */
export const PROXYAPI_TO_LOVABLE_MAP: Record<string, string> = {
  "proxyapi/gemini-3-pro-preview": "google/gemini-3-pro-preview",
  "proxyapi/gemini-3-flash-preview": "google/gemini-3-flash-preview",
  "proxyapi/gemini-2.5-pro": "google/gemini-2.5-pro",
  "proxyapi/gemini-2.5-flash": "google/gemini-2.5-flash",
  "proxyapi/gpt-5": "openai/gpt-5",
  "proxyapi/gpt-5-mini": "openai/gpt-5-mini",
  "proxyapi/gpt-5.2": "openai/gpt-5.2",
};

/** Resolve proxyapi model ID to real provider model ID */
export function resolveProxyApiModel(modelId: string): string {
  return PROXYAPI_MODEL_MAP[modelId] || modelId.replace("proxyapi/", "");
}

/** Model capability types for endpoint routing */
export type ProxyModelType = "chat" | "embedding" | "tts" | "stt" | "image" | "image_edit" | "responses";

/** Detect model type from its ID for correct endpoint routing */
export function detectModelType(modelId: string): ProxyModelType {
  const id = modelId.toLowerCase();
  // TTS models
  if (id.includes("tts") || (id.includes("speech") && !id.includes("speech-to"))) return "tts";
  // STT / transcription models
  if (id.includes("whisper") || id.includes("transcription") || id.includes("speech-to")) return "stt";
  // Image generation models
  if (id.includes("dall-e") || id.includes("dalle") || id.includes("gpt-image") ||
      id.includes("image-generation") || id.includes("sdxl") || id.includes("stable-diffusion") ||
      id.includes("midjourney")) return "image";
  // Image edit
  if (id.includes("image-edit")) return "image_edit";
  // Embedding models
  if (id.includes("embedding") || id.includes("embed") || id.includes("text-embedding")) return "embedding";
  // Default to chat
  return "chat";
}

/** Get the full ProxyAPI URL for a given model type.
 *  Non-chat endpoints use path-based routing (api.proxyapi.ru/openai/v1/...)
 *  because the subdomain format (openai.api.proxyapi.ru) may not support them.
 */
export function getFullUrlForType(type: ProxyModelType): string {
  switch (type) {
    case "tts": return "https://api.proxyapi.ru/openai/v1/audio/speech";
    case "stt": return "https://api.proxyapi.ru/openai/v1/audio/transcriptions";
    case "image": return "https://api.proxyapi.ru/openai/v1/images/generations";
    case "image_edit": return "https://api.proxyapi.ru/openai/v1/images/edits";
    case "embedding": return "https://api.proxyapi.ru/openai/v1/embeddings";
    case "responses": return "https://openai.api.proxyapi.ru/v1/responses";
    default: return "https://openai.api.proxyapi.ru/v1/chat/completions";
  }
}

/** Strip provider prefix (e.g. "openai/", "gemini/") to get bare model name for API calls */
export function stripProviderPrefix(modelId: string): string {
  return modelId.replace(/^[a-z]+\//, "");
}

/** Build a minimal test payload for a model type (just enough for a 200 check) */
export function buildTestPayload(realModel: string, type: ProxyModelType): Record<string, unknown> {
  switch (type) {
    case "tts":
      return { model: realModel, input: "Hi", voice: "alloy", response_format: "mp3" };
    case "embedding":
      return { model: realModel, input: "test" };
    case "image":
      return { model: realModel, prompt: "white square", size: "256x256", n: 1 };
    default: {
      const isOpenAI = realModel.startsWith("openai/");
      return {
        model: realModel,
        messages: [{ role: "user", content: "Say hi in 3 words." }],
        max_tokens: isOpenAI ? undefined : 30,
        ...(isOpenAI ? { max_completion_tokens: 30 } : {}),
        stream: false,
      };
    }
  }
}
