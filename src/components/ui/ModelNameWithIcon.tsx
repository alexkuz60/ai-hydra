import React from 'react';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from './ProviderLogos';
import { cn } from '@/lib/utils';

/**
 * Extract provider key from a model ID string (e.g. "google/gemini-2.5-pro" → "gemini",
 * "claude-3-5-sonnet" → "anthropic", "gpt-4o" → "openai").
 */
export function getProviderFromModelId(modelId: string): string | null {
  const lower = modelId.toLowerCase();

  // Lovable AI format: "google/gemini-*" or "openai/gpt-*"
  if (lower.startsWith('google/')) return 'gemini';
  if (lower.startsWith('openai/')) return 'openai';

  // Direct provider model IDs
  if (lower.startsWith('gpt-') || lower.startsWith('o1') || lower.startsWith('o3')) return 'openai';
  if (lower.startsWith('claude')) return 'anthropic';
  if (lower.startsWith('gemini')) return 'gemini';
  if (lower.startsWith('grok')) return 'xai';
  if (lower.startsWith('deepseek')) return 'deepseek';
  if (lower.startsWith('mistral') || lower.startsWith('pixtral') || lower.startsWith('codestral')) return 'mistral';

  // OpenRouter free models
  if (lower.includes(':free')) return 'openrouter';

  // Groq models
  if (lower.startsWith('llama') || lower.startsWith('mixtral') || lower.startsWith('gemma')) return 'groq';

  return null;
}

/**
 * Renders a provider icon inline next to a model name.
 * Does NOT render role icons — only brand/provider logos.
 */
export function ModelNameWithIcon({
  modelName,
  className,
  iconSize = 'h-3.5 w-3.5',
}: {
  modelName: string;
  className?: string;
  iconSize?: string;
}) {
  const provider = getProviderFromModelId(modelName);
  const Logo = provider ? PROVIDER_LOGOS[provider] : null;
  const color = provider ? PROVIDER_COLORS[provider] : 'text-muted-foreground';

  // Display short name (after last /)
  const shortName = modelName.split('/').pop() || modelName;

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {Logo && <Logo className={cn(iconSize, color, 'shrink-0')} />}
      <span className="truncate">{shortName}</span>
    </span>
  );
}
