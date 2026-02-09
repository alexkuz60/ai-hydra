/**
 * Static Model Registry — metadata catalog for AI model dossiers.
 * Data sourced from public announcements and pricing pages.
 */

export interface ModelRegistryEntry {
  id: string;
  displayName: string;
  provider: string;
  /** Provider display name */
  creator: string;
  /** Release date in "YYYY-MM" format */
  releaseDate: string;
  /** Parameter count (human-readable) */
  parameterCount: string;
  /** Innate talents / strengths */
  strengths: string[];
  /** Pricing per 1M tokens { input, output } or "free" or "included" */
  pricing: { input: string; output: string } | 'free' | 'included';
}

const registry: ModelRegistryEntry[] = [
  // ─── Lovable AI (built-in) ───
  { id: 'google/gemini-3-flash-preview', displayName: 'Gemini 3 Flash Preview', provider: 'lovable', creator: 'Google DeepMind', releaseDate: '2025-06', parameterCount: 'unknown', strengths: ['speed', 'multimodal'], pricing: 'included' },
  { id: 'google/gemini-3-pro-preview', displayName: 'Gemini 3 Pro Preview', provider: 'lovable', creator: 'Google DeepMind', releaseDate: '2025-06', parameterCount: 'unknown', strengths: ['reasoning', 'multimodal', 'coding'], pricing: 'included' },
  { id: 'google/gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', provider: 'lovable', creator: 'Google DeepMind', releaseDate: '2025-03', parameterCount: 'unknown', strengths: ['reasoning', 'vision', 'coding', 'long-context'], pricing: 'included' },
  { id: 'google/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', provider: 'lovable', creator: 'Google DeepMind', releaseDate: '2025-03', parameterCount: 'unknown', strengths: ['speed', 'multimodal', 'reasoning'], pricing: 'included' },
  { id: 'google/gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash Lite', provider: 'lovable', creator: 'Google DeepMind', releaseDate: '2025-04', parameterCount: 'unknown', strengths: ['speed', 'efficiency'], pricing: 'included' },
  { id: 'openai/gpt-5', displayName: 'GPT-5', provider: 'lovable', creator: 'OpenAI', releaseDate: '2025-06', parameterCount: 'unknown', strengths: ['reasoning', 'multimodal', 'coding', 'long-context'], pricing: 'included' },
  { id: 'openai/gpt-5-mini', displayName: 'GPT-5 Mini', provider: 'lovable', creator: 'OpenAI', releaseDate: '2025-06', parameterCount: 'unknown', strengths: ['reasoning', 'multimodal', 'efficiency'], pricing: 'included' },
  { id: 'openai/gpt-5-nano', displayName: 'GPT-5 Nano', provider: 'lovable', creator: 'OpenAI', releaseDate: '2025-06', parameterCount: 'unknown', strengths: ['speed', 'efficiency'], pricing: 'included' },
  { id: 'openai/gpt-5.2', displayName: 'GPT-5.2', provider: 'lovable', creator: 'OpenAI', releaseDate: '2025-07', parameterCount: 'unknown', strengths: ['reasoning', 'coding', 'multimodal'], pricing: 'included' },

  // ─── OpenAI (BYOK) ───
  { id: 'gpt-4o', displayName: 'GPT-4o', provider: 'openai', creator: 'OpenAI', releaseDate: '2024-05', parameterCount: '~200B (est.)', strengths: ['reasoning', 'vision', 'coding', 'multimodal'], pricing: { input: '$2.50', output: '$10.00' } },
  { id: 'gpt-4o-mini', displayName: 'GPT-4o Mini', provider: 'openai', creator: 'OpenAI', releaseDate: '2024-07', parameterCount: '~8B (est.)', strengths: ['speed', 'efficiency', 'coding'], pricing: { input: '$0.15', output: '$0.60' } },
  { id: 'gpt-4-turbo', displayName: 'GPT-4 Turbo', provider: 'openai', creator: 'OpenAI', releaseDate: '2024-04', parameterCount: '~200B (est.)', strengths: ['reasoning', 'coding', 'long-context'], pricing: { input: '$10.00', output: '$30.00' } },
  { id: 'o1', displayName: 'o1 (Reasoning)', provider: 'openai', creator: 'OpenAI', releaseDate: '2024-12', parameterCount: 'unknown', strengths: ['deep-reasoning', 'math', 'coding'], pricing: { input: '$15.00', output: '$60.00' } },
  { id: 'o1-mini', displayName: 'o1 Mini', provider: 'openai', creator: 'OpenAI', releaseDate: '2024-09', parameterCount: 'unknown', strengths: ['reasoning', 'math', 'efficiency'], pricing: { input: '$3.00', output: '$12.00' } },
  { id: 'o3-mini', displayName: 'o3 Mini', provider: 'openai', creator: 'OpenAI', releaseDate: '2025-01', parameterCount: 'unknown', strengths: ['reasoning', 'math', 'coding'], pricing: { input: '$1.10', output: '$4.40' } },

  // ─── Anthropic ───
  { id: 'claude-3-5-sonnet', displayName: 'Claude 3.5 Sonnet', provider: 'anthropic', creator: 'Anthropic', releaseDate: '2024-10', parameterCount: 'unknown', strengths: ['coding', 'reasoning', 'creative', 'analysis'], pricing: { input: '$3.00', output: '$15.00' } },
  { id: 'claude-3-5-haiku', displayName: 'Claude 3.5 Haiku', provider: 'anthropic', creator: 'Anthropic', releaseDate: '2024-10', parameterCount: 'unknown', strengths: ['speed', 'coding', 'efficiency'], pricing: { input: '$0.80', output: '$4.00' } },
  { id: 'claude-3-opus', displayName: 'Claude 3 Opus', provider: 'anthropic', creator: 'Anthropic', releaseDate: '2024-03', parameterCount: 'unknown', strengths: ['deep-reasoning', 'creative', 'analysis'], pricing: { input: '$15.00', output: '$75.00' } },
  { id: 'claude-3-haiku', displayName: 'Claude 3 Haiku', provider: 'anthropic', creator: 'Anthropic', releaseDate: '2024-03', parameterCount: 'unknown', strengths: ['speed', 'efficiency'], pricing: { input: '$0.25', output: '$1.25' } },

  // ─── Google Gemini (BYOK) ───
  { id: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', provider: 'gemini', creator: 'Google DeepMind', releaseDate: '2025-02', parameterCount: 'unknown', strengths: ['speed', 'multimodal', 'coding'], pricing: { input: '$0.10', output: '$0.40' } },
  { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', provider: 'gemini', creator: 'Google DeepMind', releaseDate: '2024-05', parameterCount: 'unknown', strengths: ['long-context', 'reasoning', 'multimodal'], pricing: { input: '$1.25', output: '$5.00' } },
  { id: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', provider: 'gemini', creator: 'Google DeepMind', releaseDate: '2024-05', parameterCount: 'unknown', strengths: ['speed', 'multimodal'], pricing: { input: '$0.075', output: '$0.30' } },

  // ─── xAI Grok ───
  { id: 'grok-3', displayName: 'Grok 3', provider: 'xai', creator: 'xAI', releaseDate: '2025-02', parameterCount: 'unknown', strengths: ['reasoning', 'coding', 'math'], pricing: { input: '$3.00', output: '$15.00' } },
  { id: 'grok-3-fast', displayName: 'Grok 3 Fast', provider: 'xai', creator: 'xAI', releaseDate: '2025-02', parameterCount: 'unknown', strengths: ['speed', 'reasoning'], pricing: { input: '$5.00', output: '$25.00' } },
  { id: 'grok-3-mini', displayName: 'Grok 3 Mini', provider: 'xai', creator: 'xAI', releaseDate: '2025-02', parameterCount: 'unknown', strengths: ['efficiency', 'reasoning'], pricing: { input: '$0.30', output: '$0.50' } },
  { id: 'grok-3-mini-fast', displayName: 'Grok 3 Mini Fast', provider: 'xai', creator: 'xAI', releaseDate: '2025-02', parameterCount: 'unknown', strengths: ['speed', 'efficiency'], pricing: { input: '$0.60', output: '$4.00' } },

  // ─── OpenRouter ───
  { id: 'qwen/qwen3-0.6b-04-28:free', displayName: 'Qwen3 0.6B', provider: 'openrouter', creator: 'Alibaba Cloud', releaseDate: '2025-04', parameterCount: '0.6B', strengths: ['efficiency', 'multilingual'], pricing: 'free' },
  { id: 'z-ai/glm-4.5-air:free', displayName: 'GLM 4.5 Air', provider: 'openrouter', creator: 'Zhipu AI', releaseDate: '2025-01', parameterCount: 'unknown', strengths: ['multilingual', 'general'], pricing: 'free' },
  { id: 'tngtech/tng-r1t-chimera:free', displayName: 'R1T Chimera', provider: 'openrouter', creator: 'TNG Technology', releaseDate: '2025-03', parameterCount: 'unknown', strengths: ['reasoning'], pricing: 'free' },

  // ─── Groq ───
  { id: 'llama-3.3-70b-versatile', displayName: 'Llama 3.3 70B Versatile', provider: 'groq', creator: 'Meta AI', releaseDate: '2024-12', parameterCount: '70B', strengths: ['coding', 'reasoning', 'multilingual'], pricing: { input: '$0.59', output: '$0.79' } },
  { id: 'llama-3.1-8b-instant', displayName: 'Llama 3.1 8B Instant', provider: 'groq', creator: 'Meta AI', releaseDate: '2024-07', parameterCount: '8B', strengths: ['speed', 'efficiency'], pricing: { input: '$0.05', output: '$0.08' } },
  { id: 'llama-3.2-90b-vision-preview', displayName: 'Llama 3.2 90B Vision', provider: 'groq', creator: 'Meta AI', releaseDate: '2024-09', parameterCount: '90B', strengths: ['vision', 'reasoning', 'multimodal'], pricing: { input: '$0.90', output: '$0.90' } },
  { id: 'mixtral-8x7b-32768', displayName: 'Mixtral 8x7B', provider: 'groq', creator: 'Mistral AI', releaseDate: '2023-12', parameterCount: '46.7B (MoE)', strengths: ['coding', 'multilingual', 'efficiency'], pricing: { input: '$0.24', output: '$0.24' } },
  { id: 'gemma2-9b-it', displayName: 'Gemma 2 9B', provider: 'groq', creator: 'Google DeepMind', releaseDate: '2024-06', parameterCount: '9B', strengths: ['efficiency', 'coding'], pricing: { input: '$0.20', output: '$0.20' } },

  // ─── DeepSeek ───
  { id: 'deepseek-chat', displayName: 'DeepSeek-V3', provider: 'deepseek', creator: 'DeepSeek AI', releaseDate: '2024-12', parameterCount: '671B (MoE)', strengths: ['coding', 'math', 'reasoning', 'multilingual'], pricing: { input: '$0.27', output: '$1.10' } },
  { id: 'deepseek-reasoner', displayName: 'DeepSeek-R1 (Reasoning)', provider: 'deepseek', creator: 'DeepSeek AI', releaseDate: '2025-01', parameterCount: '671B (MoE)', strengths: ['deep-reasoning', 'math', 'coding'], pricing: { input: '$0.55', output: '$2.19' } },

  // ─── Mistral AI ───
  { id: 'mistral-large-latest', displayName: 'Mistral Large', provider: 'mistral', creator: 'Mistral AI', releaseDate: '2024-11', parameterCount: '123B', strengths: ['reasoning', 'coding', 'multilingual'], pricing: { input: '$2.00', output: '$6.00' } },
  { id: 'mistral-small-latest', displayName: 'Mistral Small', provider: 'mistral', creator: 'Mistral AI', releaseDate: '2024-09', parameterCount: '22B', strengths: ['efficiency', 'coding'], pricing: { input: '$0.10', output: '$0.30' } },
  { id: 'codestral-latest', displayName: 'Codestral', provider: 'mistral', creator: 'Mistral AI', releaseDate: '2024-05', parameterCount: '22B', strengths: ['coding', 'code-generation'], pricing: { input: '$0.30', output: '$0.90' } },
  { id: 'mistral-medium-latest', displayName: 'Mistral Medium', provider: 'mistral', creator: 'Mistral AI', releaseDate: '2024-12', parameterCount: 'unknown', strengths: ['reasoning', 'multilingual'], pricing: { input: '$0.40', output: '$2.00' } },

  // ─── ProxyAPI (Russian gateway) ───
  { id: 'proxyapi/gpt-4o', displayName: 'GPT-4o (ProxyAPI)', provider: 'proxyapi', creator: 'OpenAI via ProxyAPI', releaseDate: '2024-05', parameterCount: '~200B (est.)', strengths: ['reasoning', 'vision', 'coding', 'multimodal'], pricing: { input: '≈$3.00', output: '≈$12.00' } },
  { id: 'proxyapi/gpt-4o-mini', displayName: 'GPT-4o Mini (ProxyAPI)', provider: 'proxyapi', creator: 'OpenAI via ProxyAPI', releaseDate: '2024-07', parameterCount: '~8B (est.)', strengths: ['speed', 'efficiency', 'coding'], pricing: { input: '≈$0.20', output: '≈$0.80' } },
  { id: 'proxyapi/o3-mini', displayName: 'o3 Mini (ProxyAPI)', provider: 'proxyapi', creator: 'OpenAI via ProxyAPI', releaseDate: '2025-01', parameterCount: 'unknown', strengths: ['reasoning', 'math', 'coding'], pricing: { input: '≈$1.50', output: '≈$6.00' } },
  { id: 'proxyapi/gpt-5', displayName: 'GPT-5 (ProxyAPI)', provider: 'proxyapi', creator: 'OpenAI via ProxyAPI', releaseDate: '2025-06', parameterCount: 'unknown', strengths: ['reasoning', 'multimodal', 'coding', 'long-context'], pricing: { input: '≈$5.00', output: '≈$15.00' } },
  { id: 'proxyapi/gpt-5-mini', displayName: 'GPT-5 Mini (ProxyAPI)', provider: 'proxyapi', creator: 'OpenAI via ProxyAPI', releaseDate: '2025-06', parameterCount: 'unknown', strengths: ['reasoning', 'multimodal', 'efficiency'], pricing: { input: '≈$1.00', output: '≈$4.00' } },
  { id: 'proxyapi/gpt-5.2', displayName: 'GPT-5.2 (ProxyAPI)', provider: 'proxyapi', creator: 'OpenAI via ProxyAPI', releaseDate: '2025-07', parameterCount: 'unknown', strengths: ['reasoning', 'coding', 'multimodal'], pricing: { input: '≈$6.00', output: '≈$18.00' } },
  { id: 'proxyapi/gpt-oss-20b', displayName: 'GPT-OSS 20B (ProxyAPI)', provider: 'proxyapi', creator: 'OpenAI via ProxyAPI', releaseDate: '2025-06', parameterCount: '20B', strengths: ['efficiency', 'coding'], pricing: { input: '≈$0.50', output: '≈$2.00' } },
  { id: 'proxyapi/gpt-oss-120b', displayName: 'GPT-OSS 120B (ProxyAPI)', provider: 'proxyapi', creator: 'OpenAI via ProxyAPI', releaseDate: '2025-06', parameterCount: '120B', strengths: ['reasoning', 'coding', 'multilingual'], pricing: { input: '≈$2.00', output: '≈$8.00' } },
  { id: 'proxyapi/claude-sonnet-4', displayName: 'Claude Sonnet 4 (ProxyAPI)', provider: 'proxyapi', creator: 'Anthropic via ProxyAPI', releaseDate: '2025-05', parameterCount: 'unknown', strengths: ['coding', 'reasoning', 'creative', 'analysis'], pricing: { input: '≈$4.00', output: '≈$20.00' } },
  { id: 'proxyapi/claude-opus-4', displayName: 'Claude Opus 4 (ProxyAPI)', provider: 'proxyapi', creator: 'Anthropic via ProxyAPI', releaseDate: '2025-06', parameterCount: 'unknown', strengths: ['deep-reasoning', 'coding', 'creative', 'analysis'], pricing: { input: '≈$15.00', output: '≈$75.00' } },
  { id: 'proxyapi/claude-3-5-sonnet', displayName: 'Claude 3.5 Sonnet (ProxyAPI)', provider: 'proxyapi', creator: 'Anthropic via ProxyAPI', releaseDate: '2024-10', parameterCount: 'unknown', strengths: ['coding', 'reasoning', 'creative', 'analysis'], pricing: { input: '≈$4.00', output: '≈$20.00' } },
  { id: 'proxyapi/claude-3-5-haiku', displayName: 'Claude 3.5 Haiku (ProxyAPI)', provider: 'proxyapi', creator: 'Anthropic via ProxyAPI', releaseDate: '2024-10', parameterCount: 'unknown', strengths: ['speed', 'coding', 'efficiency'], pricing: { input: '≈$1.00', output: '≈$5.00' } },
  { id: 'proxyapi/gemini-3-pro-preview', displayName: 'Gemini 3 Pro (ProxyAPI)', provider: 'proxyapi', creator: 'Google via ProxyAPI', releaseDate: '2025-06', parameterCount: 'unknown', strengths: ['reasoning', 'multimodal', 'coding'], pricing: { input: '≈$2.00', output: '≈$8.00' } },
  { id: 'proxyapi/gemini-3-flash-preview', displayName: 'Gemini 3 Flash (ProxyAPI)', provider: 'proxyapi', creator: 'Google via ProxyAPI', releaseDate: '2025-06', parameterCount: 'unknown', strengths: ['speed', 'multimodal'], pricing: { input: '≈$0.15', output: '≈$0.60' } },
  { id: 'proxyapi/gemini-2.5-pro', displayName: 'Gemini 2.5 Pro (ProxyAPI)', provider: 'proxyapi', creator: 'Google via ProxyAPI', releaseDate: '2025-03', parameterCount: 'unknown', strengths: ['reasoning', 'vision', 'coding', 'long-context'], pricing: { input: '≈$1.50', output: '≈$6.00' } },
  { id: 'proxyapi/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash (ProxyAPI)', provider: 'proxyapi', creator: 'Google via ProxyAPI', releaseDate: '2025-03', parameterCount: 'unknown', strengths: ['speed', 'multimodal', 'reasoning'], pricing: { input: '≈$0.15', output: '≈$0.60' } },
  { id: 'proxyapi/gemini-2.0-flash', displayName: 'Gemini 2.0 Flash (ProxyAPI)', provider: 'proxyapi', creator: 'Google via ProxyAPI', releaseDate: '2025-02', parameterCount: 'unknown', strengths: ['speed', 'multimodal', 'coding'], pricing: { input: '≈$0.15', output: '≈$0.60' } },
  { id: 'proxyapi/deepseek-chat', displayName: 'DeepSeek-V3 (ProxyAPI) ⚠️', provider: 'proxyapi', creator: 'DeepSeek via ProxyAPI', releaseDate: '2024-12', parameterCount: '671B (MoE)', strengths: ['coding', 'math', 'reasoning', 'multilingual'], pricing: { input: '≈$0.40', output: '≈$1.60' } },
  { id: 'proxyapi/deepseek-reasoner', displayName: 'DeepSeek-R1 (ProxyAPI) ⚠️', provider: 'proxyapi', creator: 'DeepSeek via ProxyAPI', releaseDate: '2025-01', parameterCount: '671B (MoE)', strengths: ['deep-reasoning', 'math', 'coding'], pricing: { input: '≈$0.80', output: '≈$3.00' } },
];

// Lookup map for O(1) access
const registryMap = new Map<string, ModelRegistryEntry>(
  registry.map(entry => [entry.id, entry])
);

export function getModelRegistryEntry(modelId: string): ModelRegistryEntry | undefined {
  return registryMap.get(modelId);
}

export function getAllRegistryEntries(): ModelRegistryEntry[] {
  return registry;
}

/** Strength tag localization */
export const STRENGTH_LABELS: Record<string, { ru: string; en: string }> = {
  'coding': { ru: 'Программирование', en: 'Coding' },
  'code-generation': { ru: 'Генерация кода', en: 'Code Generation' },
  'reasoning': { ru: 'Рассуждения', en: 'Reasoning' },
  'deep-reasoning': { ru: 'Глубокие рассуждения', en: 'Deep Reasoning' },
  'math': { ru: 'Математика', en: 'Math' },
  'creative': { ru: 'Креатив', en: 'Creative' },
  'vision': { ru: 'Зрение', en: 'Vision' },
  'multimodal': { ru: 'Мультимодальность', en: 'Multimodal' },
  'speed': { ru: 'Скорость', en: 'Speed' },
  'efficiency': { ru: 'Эффективность', en: 'Efficiency' },
  'multilingual': { ru: 'Мультиязычность', en: 'Multilingual' },
  'long-context': { ru: 'Длинный контекст', en: 'Long Context' },
  'analysis': { ru: 'Анализ', en: 'Analysis' },
  'general': { ru: 'Общее', en: 'General' },
};
