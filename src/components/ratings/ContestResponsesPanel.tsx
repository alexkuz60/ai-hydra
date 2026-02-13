import React, { useState } from 'react';
import { Crown, Loader2, MessageSquare, FileText } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { UserScoreWidget } from './UserScoreWidget';
import { LikertEvaluationDisplay } from './LikertEvaluationDisplay';
import { getRatingsText } from './i18n';
import type { ContestResult } from '@/hooks/useContestSession';

interface ContestResponsesPanelProps {
  results: ContestResult[];
  rounds: { id: string; round_index: number; prompt: string }[];
  streamingTexts: Record<string, string>;
  isRu: boolean;
  initialRoundCount?: number;
  onScore?: (resultId: string, score: number) => void;
  activeModel: string;
  onActiveModelChange: (model: string) => void;
}

export function ContestResponsesPanel({
  results, rounds, streamingTexts, isRu,
  initialRoundCount = 1, onScore, activeModel, onActiveModelChange,
}: ContestResponsesPanelProps) {
  const modelIds = [...new Set(results.map(r => r.model_id))];

  const displayable = activeModel === 'all'
    ? results.filter(r => r.response_text || streamingTexts[r.model_id])
    : results.filter(r => r.model_id === activeModel && (r.response_text || streamingTexts[r.model_id]));

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeModel} onValueChange={onActiveModelChange} className="flex flex-col h-full">
        <div className="px-3 pt-2 pb-1 border-b border-border/50">
           <TabsList className="h-8 p-1 bg-muted/30 w-full justify-start gap-1">
             <TabsTrigger value="all" className="text-xs h-6 px-3">
               {getRatingsText('allResponses', isRu)}
             </TabsTrigger>
            {modelIds.map(id => {
              const entry = getModelRegistryEntry(id);
              const short = entry?.displayName || id.split('/').pop() || id;
              return (
                <TabsTrigger key={id} value={id} className="text-xs h-6 px-3 max-w-[140px] truncate">
                  {short}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
             {displayable.length === 0 ? (
               <div className="text-xs text-muted-foreground text-center py-8">
                 {getRatingsText('responsesWillAppearAfterLaunch', isRu)}
               </div>
            ) : (
              <RoundGroupedResults
                filtered={displayable}
                rounds={rounds}
                streamingTexts={streamingTexts}
                initialRoundCount={initialRoundCount}
                isRu={isRu}
                onScore={onScore}
              />
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

/** Groups results by round and renders them */
function RoundGroupedResults({
  filtered, rounds, streamingTexts, initialRoundCount, isRu, onScore,
}: {
  filtered: ContestResult[];
  rounds: { id: string; round_index: number; prompt: string }[];
  streamingTexts: Record<string, string>;
  initialRoundCount: number;
  isRu: boolean;
  onScore?: (resultId: string, score: number) => void;
}) {
  const roundGroups = rounds
    .filter(round => filtered.some(r => r.round_id === round.id))
    .map(round => ({ round, results: filtered.filter(r => r.round_id === round.id) }));

  const orphans = filtered.filter(r => !rounds.some(rd => rd.id === r.round_id));
  if (orphans.length > 0) {
    roundGroups.push({ round: { id: '__orphan', round_index: -1, prompt: '' }, results: orphans });
  }

  return (
    <>
      {roundGroups.map(({ round, results: groupResults }) => {
        const isFollowUp = round.round_index >= initialRoundCount;
        const roundLabel = round.round_index < 0
          ? ''
          : isFollowUp
            ? (isRu ? `Дополнительный вопрос ${round.round_index - initialRoundCount + 1}` : `Follow-up ${round.round_index - initialRoundCount + 1}`)
            : (isRu ? `Тур ${round.round_index + 1}` : `Round ${round.round_index + 1}`);

        return (
          <div key={round.id} className={cn("space-y-2", isFollowUp && "pl-5")}>
            {round.round_index >= 0 && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isFollowUp ? (
                    <MessageSquare className="h-3 w-3 text-[hsl(var(--hydra-arbiter))]" />
                  ) : (
                    <Crown className="h-3 w-3 text-primary" />
                  )}
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-wider",
                    isFollowUp ? "text-[hsl(var(--hydra-arbiter))]" : "text-primary"
                  )}>
                    {roundLabel}
                  </span>
                </div>
                <Separator className="flex-1" />
                {round.prompt && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-xs whitespace-pre-wrap">
                        {round.prompt}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
            {round.prompt && round.round_index >= 0 && (
              <p className={cn("text-[11px] text-muted-foreground italic line-clamp-2", isFollowUp ? "pl-0" : "pl-5")}>
                {round.prompt}
              </p>
            )}
            {groupResults.map(result => (
              <ResponseCard
                key={result.id}
                result={result}
                streamingTexts={streamingTexts}
                isRu={isRu}
                onScore={onScore}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}
function CollapsibleResponse({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="text-sm relative">
      <div className={cn(!expanded && "line-clamp-3", "transition-all")}>
        <MarkdownRenderer content={content} />
        {isStreaming && <Loader2 className="h-3 w-3 animate-spin text-primary inline ml-1" />}
      </div>
      {content.length > 200 && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-[10px] text-primary hover:underline mt-0.5"
        >
          {expanded ? '▲ Свернуть' : '▼ Развернуть'}
        </button>
      )}
    </div>
  );
}

function ResponseCard({
  result, streamingTexts, isRu, onScore,
}: {
  result: ContestResult;
  streamingTexts: Record<string, string>;
  isRu: boolean;
  onScore?: (resultId: string, score: number) => void;
}) {
  const entry = getModelRegistryEntry(result.model_id);
  const shortName = entry?.displayName || result.model_id.split('/').pop() || result.model_id;
  const ProviderLogo = entry?.provider ? PROVIDER_LOGOS[entry.provider] : undefined;
  const color = entry?.provider ? PROVIDER_COLORS[entry.provider] : '';

  // Parse Likert claims from criteria_scores if available
  const likertClaims = (() => {
    if (!result.criteria_scores) return null;
    const scores = result.criteria_scores as any;
    if (scores.claims && Array.isArray(scores.claims)) {
      return scores.claims;
    }
    return null;
  })();

  return (
    <div className="rounded-lg border border-border/40 bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {ProviderLogo && <ProviderLogo className={cn("h-3.5 w-3.5", color)} />}
          <span className="text-xs font-semibold">{shortName}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {result.response_time_ms && <span>{(result.response_time_ms / 1000).toFixed(1)}s</span>}
          {result.token_count && <span>{result.token_count} tok</span>}
        </div>
      </div>
      <CollapsibleResponse
        content={result.response_text || streamingTexts[result.model_id] || ''}
        isStreaming={result.status === 'generating' && !result.response_text && !!streamingTexts[result.model_id]}
      />
      {(result.status === 'ready' || result.status === 'judged') && onScore && (
        <UserScoreWidget resultId={result.id} currentScore={result.user_score} onScore={onScore} isRu={isRu} />
      )}
      {likertClaims && (
        <div className="pt-2 border-t border-border/30">
          <LikertEvaluationDisplay claims={likertClaims} isRu={isRu} />
        </div>
      )}
      {result.arbiter_score != null && !likertClaims && (
        <div className="flex items-center gap-3 text-[10px] pt-1 border-t border-border/30">
          <span>⚖️ {result.arbiter_score}/10</span>
        </div>
      )}
    </div>
  );
}
