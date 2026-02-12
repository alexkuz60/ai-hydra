import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { computeScores, type ScoringScheme } from '@/lib/contestScoring';
import type { ContestResult } from '@/hooks/useContestSession';

/** Mini podium histogram — vertical bars representing top 3 */
export function PodiumHistogram({ 
  results, className, arbitration 
}: { 
  results: ContestResult[]; 
  className?: string;
  arbitration?: { userWeight?: number; criteriaWeights?: Record<string, number>; scoringScheme?: ScoringScheme };
}) {
  const scheme: ScoringScheme = arbitration?.scoringScheme || 'weighted-avg';
  const userWeight = arbitration?.userWeight ?? 50;

  const scored = computeScores({ results, scheme, userWeight });
  const hasAnyScore = scored.some(s => s.finalScore !== 0 && (s.avgUser != null || s.avgArbiter != null));

  // For podium: top 3 in order [2nd, 1st, 3rd]
  const top3 = scored.slice(0, 3);
  const podium = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
  const defaultHeights = [60, 100, 40];

  // Relative scale for bar heights
  const scoredWithScores = scored.filter(s => s.avgUser != null || s.avgArbiter != null);
  const minScore = scoredWithScores.length ? Math.min(...scoredWithScores.map(s => s.finalScore)) : 0;
  const maxScore = scoredWithScores.length ? Math.max(...scoredWithScores.map(s => s.finalScore)) : 10;
  const range = maxScore - minScore;
  const dynamicHeight = (total: number) => {
    if (range < 0.01) return 85;
    const normalized = (total - minScore) / range;
    return 15 + normalized * 85;
  };

  const podiumColors = hasAnyScore
    ? ['hsl(var(--hydra-expert))', 'hsl(var(--hydra-arbiter))', 'hsl(var(--primary))']
    : ['hsl(220 10% 50%)', 'hsl(220 10% 50%)', 'hsl(220 10% 50%)'];
  const podiumLabels = ['2', '1', '3'];

  const formatScore = (entry: typeof scored[0]) => {
    if (scheme === 'elo') return `${entry.details.eloRating}`;
    if (scheme === 'tournament') return `${entry.details.tournamentPoints}pts`;
    return entry.finalScore.toFixed(1);
  };

  return (
    <div className={cn("flex-shrink-0 flex items-end justify-center gap-[3px]", className)}>
      {podium.map((entry, i) => {
        const hasScore = entry && (entry.avgUser != null || entry.avgArbiter != null);
        const heightPct = hasScore
          ? dynamicHeight(entry.finalScore)
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
                      opacity: hasScore ? 1 : 0.5,
                      transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.4s ease, opacity 0.4s ease',
                    }}
                  />
                </div>
              </TooltipTrigger>
              {entry && (
                <TooltipContent side="bottom" className="text-[10px]">
                  <div>{shortName}</div>
                  {hasScore && (
                    <>
                      <div className="mt-1 opacity-80">👤 {entry.avgUser?.toFixed(1) ?? '—'}</div>
                      <div className="opacity-80">⚖️ {entry.avgArbiter?.toFixed(1) ?? '—'}</div>
                      {scheme === 'tournament' && (
                        <div className="opacity-80">
                          W{entry.details.wins}/D{entry.details.draws}/L{entry.details.losses}
                        </div>
                      )}
                      <div className="mt-1 font-semibold">{formatScore(entry)}</div>
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
