import React from 'react';
import { Scale, MessageSquare, Crown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { LikertEvaluationDisplay } from './LikertEvaluationDisplay';
import { getRatingsText, getCriterionLabel } from './i18n';
import type { ContestResult } from '@/hooks/useContestSession';

interface ContestArbiterPanelProps {
  results: ContestResult[];
  rounds: { id: string; round_index: number; prompt: string }[];
  isRu: boolean;
  initialRoundCount?: number;
}

export function ContestArbiterPanel({ results, rounds, isRu, initialRoundCount = 1 }: ContestArbiterPanelProps) {
  const judged = results.filter(r => r.arbiter_comment);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-2 pb-1 border-b border-border/50">
         <div className="flex items-center gap-2">
           <Scale className="h-3.5 w-3.5 text-muted-foreground" />
           <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
             {getRatingsText('arbiterComments', isRu)}
           </span>
         </div>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
           {judged.length === 0 ? (
             <div className="text-xs text-muted-foreground text-center py-6">
               {getRatingsText('arbiterHasNotJudgedYet', isRu)}
             </div>
          ) : (
            <ArbiterRoundGroups judged={judged} rounds={rounds} initialRoundCount={initialRoundCount} isRu={isRu} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ArbiterRoundGroups({
  judged, rounds, initialRoundCount, isRu,
}: {
  judged: ContestResult[];
  rounds: { id: string; round_index: number; prompt: string }[];
  initialRoundCount: number;
  isRu: boolean;
}) {
  const roundIds = [...new Set(judged.map(r => r.round_id))];

  return (
    <>
      {roundIds.map(roundId => {
        const round = rounds.find(rd => rd.id === roundId);
        const roundResults = judged.filter(r => r.round_id === roundId);
        const isFollowUp = round ? round.round_index >= initialRoundCount : false;
        const roundLabel = round
          ? isFollowUp
            ? `${getRatingsText('arbiterFollowUp', isRu)} ${round.round_index - initialRoundCount + 1}`
            : `${getRatingsText('arbiterRound', isRu)} ${round.round_index + 1}`
          : '';

        return (
          <div key={roundId} className={cn("space-y-2", isFollowUp && "pl-5")}>
            {round && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isFollowUp ? (
                    <MessageSquare className="h-3 w-3 text-[hsl(var(--hydra-arbiter))]" />
                  ) : (
                    <Scale className="h-3 w-3 text-primary" />
                  )}
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-wider",
                    isFollowUp ? "text-[hsl(var(--hydra-arbiter))]" : "text-primary"
                  )}>
                    {roundLabel}
                  </span>
                </div>
                <Separator className="flex-1" />
              </div>
            )}
            {round?.prompt && (
              <p className={cn("text-[11px] text-muted-foreground italic line-clamp-2", isFollowUp ? "pl-0" : "pl-5")}>
                {round.prompt}
              </p>
            )}
              {roundResults.map(r => {
                const entry = getModelRegistryEntry(r.model_id);
                const shortName = entry?.displayName || r.model_id.split('/').pop() || r.model_id;
                const criteriaScores = (r as any).criteria_scores as Record<string, number> | null;
                
                // Parse Likert claims if available
                const likertClaims = (() => {
                  if (!criteriaScores) return null;
                  const arr = (criteriaScores as any).likert_claims ?? (criteriaScores as any).claims;
                  if (arr && Array.isArray(arr)) return arr;
                  return null;
                })();

                // Filter out non-numeric values from criteria_scores for traditional display
                const filteredCriteria = (() => {
                  if (likertClaims || !criteriaScores) return null;
                  const filtered: Record<string, number> = {};
                  for (const [key, val] of Object.entries(criteriaScores)) {
                    if (typeof val === 'number') filtered[key] = val;
                  }
                  return Object.keys(filtered).length > 0 ? filtered : null;
                })();

                return (
                  <div key={r.id} className="rounded-md border border-border/30 bg-muted/10 p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{shortName}</span>
                      {r.arbiter_score != null && (
                        <Badge variant="secondary" className="text-[10px]">{r.arbiter_score}/10</Badge>
                      )}
                    </div>
                    {likertClaims ? (
                      <div className="pt-1">
                        <LikertEvaluationDisplay claims={likertClaims} isRu={isRu} />
                      </div>
                    ) : (
                      <>
                        {filteredCriteria && Object.keys(filteredCriteria).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(filteredCriteria).map(([key, val]) => (
                              <Badge key={key} variant="outline" className="text-[9px] px-1.5 py-0 font-normal gap-1">
                                <span className="text-muted-foreground">{getCriterionLabel(key, isRu)}</span>
                                <span className="font-semibold">{val}</span>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.arbiter_comment}</p>
                  </div>
                );
              })}
          </div>
        );
      })}
    </>
  );
}
