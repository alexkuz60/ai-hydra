import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import type { ContestResult } from '@/hooks/useContestSession';

/** Mini podium histogram — vertical bars representing top 3 */
export function PodiumHistogram({ results, className }: { results: ContestResult[]; className?: string }) {
  const modelIds = [...new Set(results.map(r => r.model_id))];

  const scored = modelIds.map(modelId => {
    const mrs = results.filter(r => r.model_id === modelId);
    const uScores = mrs.filter(r => r.user_score != null).map(r => r.user_score!);
    const aScores = mrs.filter(r => r.arbiter_score != null).map(r => r.arbiter_score!);
    const avgU = uScores.length ? uScores.reduce((a, b) => a + b, 0) / uScores.length : 0;
    const avgA = aScores.length ? aScores.reduce((a, b) => a + b, 0) / aScores.length : 0;
    const total = avgU + avgA;
    const hasScore = uScores.length > 0 || aScores.length > 0;
    return { modelId, total, hasScore };
  }).sort((a, b) => b.total - a.total);

  const hasAnyScore = scored.some(s => s.hasScore);
  const maxScore = hasAnyScore ? Math.max(...scored.map(s => s.total), 1) : 1;

  const podium = [scored[1], scored[0], scored[2]]; // 2nd, 1st, 3rd
  const defaultHeights = [60, 100, 40];

  const scores = scored.filter(s => s.hasScore).map(s => s.total);
  const minScore = scores.length > 1 ? Math.min(...scores) : 0;
  const range = maxScore - minScore;
  const dynamicHeight = (total: number) => {
    if (range < 0.01) return 100;
    const normalized = (total - minScore) / range;
    return 15 + normalized * 85;
  };

  const podiumColors = hasAnyScore
    ? ['hsl(var(--hydra-expert))', 'hsl(var(--hydra-arbiter))', 'hsl(var(--primary))']
    : ['hsl(var(--muted))', 'hsl(var(--muted))', 'hsl(var(--muted))'];
  const podiumLabels = ['2', '1', '3'];

  return (
    <div className={cn("flex-shrink-0 flex items-end justify-center gap-[3px]", className)}>
      {podium.map((entry, i) => {
        const heightPct = entry?.hasScore
          ? dynamicHeight(entry.total)
          : defaultHeights[i];
        const color = entry?.hasScore ? podiumColors[i] : undefined;
        const entryData = entry ? getModelRegistryEntry(entry.modelId) : null;
        const shortName = entryData?.displayName || entry?.modelId?.split('/').pop() || '';

        return (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-0.5" style={{ height: '100%', justifyContent: 'flex-end' }}>
                  <span className="text-[8px] font-bold text-muted-foreground">{podiumLabels[i]}</span>
                  <div
                    className="w-5 rounded-t-sm"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: color || 'hsl(var(--muted))',
                      opacity: entry?.hasScore ? 1 : 0.75,
                      transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.4s ease, opacity 0.4s ease',
                    }}
                  />
                </div>
              </TooltipTrigger>
              {entry && (
                <TooltipContent side="bottom" className="text-[10px]">
                  {shortName}{entry.hasScore ? `: ${entry.total.toFixed(1)}` : ''}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
