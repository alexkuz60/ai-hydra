import { getModelRegistryEntry, ModelRegistryEntry } from '@/config/modelRegistry';

/** Provider markup multipliers */
const PROVIDER_MULTIPLIERS: Record<string, number> = {
  openrouter: 1.25,
  proxyapi: 2,
  dotpoint: 2,
};

/**
 * Get effective price string for a model, applying provider markups.
 * Returns null if pricing is unavailable/free/included.
 */
export function getModelPriceLabel(
  modelId: string,
  provider: string,
): { input: string; output: string } | 'free' | 'included' | null {
  const entry = getModelRegistryEntry(modelId);
  if (!entry) return null;

  const pricing = entry.pricing;
  if (pricing === 'free' || pricing === 'included') return pricing;

  const multiplier = PROVIDER_MULTIPLIERS[provider] ?? 1;
  if (multiplier === 1) return pricing;

  return {
    input: applyMultiplier(pricing.input, multiplier),
    output: applyMultiplier(pricing.output, multiplier),
  };
}

/** Parse "$X.XX" and multiply, returning formatted string */
function applyMultiplier(priceStr: string, multiplier: number): string {
  const cleaned = priceStr.replace(/[≈$]/g, '').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return priceStr;
  const result = num * multiplier;
  return `$${result.toFixed(2)}`;
}

/**
 * Compact price label for selector display: "$in/$out" per 1M tokens
 */
export function getCompactPriceLabel(modelId: string, provider: string): string | null {
  const pricing = getModelPriceLabel(modelId, provider);
  if (!pricing) return null;
  if (pricing === 'free') return 'FREE';
  if (pricing === 'included') return '✓';

  const inVal = pricing.input.replace('$', '');
  const outVal = pricing.output.replace('$', '');
  return `$${inVal}/$${outVal}`;
}
