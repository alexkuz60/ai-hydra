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
