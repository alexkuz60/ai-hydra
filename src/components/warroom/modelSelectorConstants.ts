/** Shared constants for ModelSelector & MultiModelSelector */

export const PROVIDER_LABELS: Record<string, string> = {
  lovable: 'Lovable AI',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  xai: 'xAI (Grok)',
  openrouter: 'OpenRouter',
  groq: 'Groq (Fast)',
  deepseek: 'DeepSeek',
  mistral: 'Mistral AI',
  proxyapi: 'ProxyAPI',
  dotpoint: 'DotPoint',
};

export const PROVIDER_BADGES: Record<string, { label: string; className: string } | undefined> = {
  groq: { label: '⚡ Fast', className: 'bg-hydra-warning/10 text-hydra-warning border-hydra-warning/30' },
  proxyapi: { label: '🇷🇺 Gateway', className: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  dotpoint: { label: '🇷🇺 Gateway', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
};

export function getOpenRouterBadge(modelId: string) {
  if (modelId.includes(':free')) {
    return { label: 'FREE', className: 'bg-hydra-success/10 text-hydra-success border-hydra-success/30' };
  }
  return { label: '💎 Premium', className: 'bg-violet-500/10 text-violet-400 border-violet-500/30' };
}
