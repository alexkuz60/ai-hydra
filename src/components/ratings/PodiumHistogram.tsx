import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import type { ContestResult } from '@/hooks/useContestSession';

/** Mini podium histogram — vertical bars representing top 3 */
export function PodiumHistogram({ 
  results, className, arbitration 
}: { 
  results: ContestResult[]; 
  className?: string;
  arbitration?: { userWeight?: number; criteriaWeights?: Record<string, number> };
}) {
  const modelIds = [...new Set(results.map(r => r.model_id))];

  // Get userWeight from arbitration config (default 50 = 50/50 split)
  const userWeight = arbitration?.userWeight ?? 50;
  const arbiterWeight = 100 - userWeight;

  

  const scored = modelIds.map(modelId => {
    const mrs = results.filter(r => r.model_id === modelId);
    const uScores = mrs.filter(r => r.user_score != null).map(r => r.user_score!);
    const aScores = mrs.filter(r => r.arbiter_score != null).map(r => r.arbiter_score!);
    const avgU = uScores.length ? uScores.reduce((a, b) => a + b, 0) / uScores.length : 0;
    const avgA = aScores.length ? aScores.reduce((a, b) => a + b, 0) / aScores.length : 0;
    
    // Apply weights: total = avgU * (userWeight/100) + avgA * (arbiterWeight/100)
    // Result is normalized to 0-10 range
    const total = avgU * (userWeight / 100) + avgA * (arbiterWeight / 100);
    
    const hasScore = uScores.length > 0 || aScores.length > 0;
    return { modelId, total, hasScore, avgU, avgA };
  }).sort((a, b) => b.total - a.total);

  const hasAnyScore = scored.some(s => s.hasScore);

  const podium = [scored[1], scored[0], scored[2]]; // 2nd, 1st, 3rd
  const defaultHeights = [60, 100, 40];

  // Use absolute scale (0-10) since weighted score is already normalized
  const MAX_POSSIBLE = 10;
  const dynamicHeight = (total: number) => {
    const normalized = Math.min(total / MAX_POSSIBLE, 1);
    return 15 + normalized * 85;
  };

  const podiumColors = hasAnyScore
    ? ['hsl(var(--hydra-expert))', 'hsl(var(--hydra-arbiter))', 'hsl(var(--primary))']
    : ['hsl(220 10% 50%)', 'hsl(220 10% 50%)', 'hsl(220 10% 50%)'];
  const podiumLabels = ['2', '1', '3'];

  return (
    <div className={cn("flex-shrink-0 flex items-end justify-center gap-[3px]", className)}>
      {podium.map((entry, i) => {
        const heightPct = entry?.hasScore
          ? dynamicHeight(entry.total)
          : defaultHeights[i];
        const color = podiumColors[i];
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
                      backgroundColor: color,
                      opacity: entry?.hasScore ? 1 : 0.5,
                      transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.4s ease, opacity 0.4s ease',
                    }}
                  />
                </div>
              </TooltipTrigger>
              {entry && (
                <TooltipContent side="bottom" className="text-[10px]">
                  <div>{shortName}</div>
                  {entry.hasScore && (
                    <>
                      <div className="mt-1 opacity-80">👤 {entry.avgU.toFixed(1)}</div>
                      <div className="opacity-80">⚖️ {entry.avgA.toFixed(1)}</div>
                      <div className="mt-1 font-semibold">{entry.total.toFixed(1)}</div>
                    </>
                  )}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
