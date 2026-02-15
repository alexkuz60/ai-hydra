/**
 * Shared helpers for contest components to reduce duplication.
 */

import type { ContestResult } from '@/hooks/useContestSession';

/** Parse Likert claims from criteria_scores if available */
export function parseLikertClaims(criteriaScores: Record<string, unknown> | null): unknown[] | null {
  if (!criteriaScores) return null;
  const arr = (criteriaScores as any).likert_claims ?? (criteriaScores as any).claims;
  if (arr && Array.isArray(arr)) return arr;
  return null;
}

/** Filter criteria_scores to only numeric values (excludes arrays, objects, etc.) */
export function filterNumericCriteria(
  criteriaScores: Record<string, unknown> | null,
  likertClaims: unknown[] | null,
): Record<string, number> | null {
  if (likertClaims || !criteriaScores) return null;
  const filtered: Record<string, number> = {};
  for (const [key, val] of Object.entries(criteriaScores)) {
    if (typeof val === 'number') filtered[key] = val;
  }
  return Object.keys(filtered).length > 0 ? filtered : null;
}

/** Compute average from an array of numbers */
export function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Format average for display, returns '—' if empty */
export function formatAvg(values: number[], decimals = 1): string {
  if (values.length === 0) return '—';
  return avg(values).toFixed(decimals);
}
