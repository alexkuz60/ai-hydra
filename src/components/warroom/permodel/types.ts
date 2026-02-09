// PerModelSettings types, constants, and utility functions
import { AgentRole, DEFAULT_SYSTEM_PROMPTS } from '@/config/roles';

export type { AgentRole };
export { DEFAULT_SYSTEM_PROMPTS };

// Pricing per 1M tokens (input/output) in USD
export interface ModelPricing {
  input: number;
  output: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'google/gemini-2.5-pro': { input: 1.25, output: 10.00 },
  'google/gemini-3-pro-preview': { input: 1.25, output: 10.00 },
  'google/gemini-3-flash-preview': { input: 0.10, output: 0.40 },
  'google/gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'google/gemini-2.5-flash-lite': { input: 0.075, output: 0.30 },
  'google/gemini-3-pro-image-preview': { input: 0.0315, output: 0.0315 },
  'openai/gpt-5': { input: 2.50, output: 10.00 },
  'openai/gpt-5-mini': { input: 0.40, output: 1.60 },
  'openai/gpt-5-nano': { input: 0.10, output: 0.40 },
  'openai/gpt-5.2': { input: 3.00, output: 12.00 },
  'openai/gpt-4o': { input: 2.50, output: 10.00 },
  'anthropic/claude-3-opus': { input: 15.00, output: 75.00 },
  'anthropic/claude-3-sonnet': { input: 3.00, output: 15.00 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
};

export function getModelPricing(modelId: string): ModelPricing | null {
  return MODEL_PRICING[modelId] || null;
}

export function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toFixed(6)}`;
  if (price < 0.01) return `$${price.toFixed(4)}`;
  if (price < 1) return `$${price.toFixed(3)}`;
  return `$${price.toFixed(2)}`;
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  const cyrillicRatio = (text.match(/[\u0400-\u04FF]/g) || []).length / text.length;
  const charsPerToken = cyrillicRatio > 0.3 ? 2 : 4;
  return Math.ceil(text.length / charsPerToken);
}

export function calculateRequestCost(
  pricing: ModelPricing, inputTokens: number, maxOutputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (maxOutputTokens / 1_000_000) * pricing.output;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

// Tools
export const AVAILABLE_TOOL_IDS = ['calculator', 'current_datetime', 'web_search'] as const;
export type ToolId = typeof AVAILABLE_TOOL_IDS[number];

export type ToolUsageMode = 'always' | 'auto' | 'on_request';

export const TOOL_USAGE_MODE_INFO: Record<ToolUsageMode, { label: { ru: string; en: string }; description: { ru: string; en: string } }> = {
  always: { label: { ru: 'Всегда', en: 'Always' }, description: { ru: 'Инструмент вызывается автоматически при каждом запросе', en: 'Tool is called automatically with every request' } },
  auto: { label: { ru: 'При необходимости', en: 'When needed' }, description: { ru: 'ИИ-роль сама решает, нужен ли инструмент', en: 'AI decides when the tool is needed' } },
  on_request: { label: { ru: 'По просьбе', en: 'On request' }, description: { ru: 'Только когда пользователь явно просит', en: 'Only when user explicitly asks' } },
};

export const DEFAULT_TOOL_USAGE_MODES: Record<ToolId, ToolUsageMode> = {
  calculator: 'on_request',
  current_datetime: 'always',
  web_search: 'auto',
};

export interface ToolSettings {
  enabled: boolean;
  usageMode: ToolUsageMode;
}

export type SearchProvider = 'tavily' | 'perplexity' | 'both';

export const TOOL_INFO: Record<ToolId, { name: string; description: string; icon: string }> = {
  calculator: { name: 'Калькулятор', description: 'Математические вычисления', icon: '🧮' },
  current_datetime: { name: 'Дата/Время', description: 'Текущая дата и время', icon: '🕐' },
  web_search: { name: 'Веб-поиск', description: 'Поиск в интернете', icon: '🔍' },
};

export const SEARCH_PROVIDER_INFO: Record<SearchProvider, { name: string; description: string }> = {
  tavily: { name: 'Tavily', description: 'Бесплатный (1000 запросов/мес)' },
  perplexity: { name: 'Perplexity', description: 'Требуется API-ключ' },
  both: { name: 'Оба', description: 'Два результата в одном ответе' },
};

export interface SingleModelSettings {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  role: AgentRole;
  enableTools: boolean;
  enabledTools?: ToolId[];
  toolSettings?: Record<ToolId | string, ToolSettings>;
  enabledCustomTools?: string[];
  searchProvider?: SearchProvider;
  requiresApproval?: boolean;
}

export interface PerModelSettingsData {
  [modelId: string]: SingleModelSettings;
}

function buildDefaultToolSettings(): Record<ToolId, ToolSettings> {
  const settings: Record<ToolId, ToolSettings> = {} as Record<ToolId, ToolSettings>;
  for (const toolId of AVAILABLE_TOOL_IDS) {
    settings[toolId] = { enabled: true, usageMode: DEFAULT_TOOL_USAGE_MODES[toolId] };
  }
  return settings;
}

export const DEFAULT_MODEL_SETTINGS: SingleModelSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: DEFAULT_SYSTEM_PROMPTS.assistant,
  role: 'assistant',
  enableTools: true,
  enabledTools: [...AVAILABLE_TOOL_IDS],
  toolSettings: buildDefaultToolSettings(),
  enabledCustomTools: [],
  searchProvider: 'tavily',
};

export function getToolSettingsForModel(modelSettings: SingleModelSettings): Record<ToolId | string, ToolSettings> {
  if (modelSettings.toolSettings) return modelSettings.toolSettings;
  const settings: Record<ToolId | string, ToolSettings> = {};
  const enabledTools = modelSettings.enabledTools ?? [...AVAILABLE_TOOL_IDS];
  for (const toolId of AVAILABLE_TOOL_IDS) {
    settings[toolId] = { enabled: enabledTools.includes(toolId), usageMode: DEFAULT_TOOL_USAGE_MODES[toolId] };
  }
  return settings;
}

export function getModelShortName(modelId: string): string {
  const parts = modelId.split('/');
  const name = parts[parts.length - 1];
  if (name.includes('gemini-3-flash')) return 'Gemini 3 Flash';
  if (name.includes('gemini-3-pro')) return 'Gemini 3 Pro';
  if (name.includes('gemini-2.5-pro')) return 'Gemini 2.5 Pro';
  if (name.includes('gemini-2.5-flash')) return 'Gemini 2.5 Flash';
  if (name.includes('gpt-5-mini')) return 'GPT-5 Mini';
  if (name.includes('gpt-5.2')) return 'GPT-5.2';
  if (name.includes('gpt-5')) return 'GPT-5';
  if (name.includes('gpt-4o')) return 'GPT-4o';
  if (name.includes('claude')) return 'Claude';
  return name.slice(0, 12);
}
