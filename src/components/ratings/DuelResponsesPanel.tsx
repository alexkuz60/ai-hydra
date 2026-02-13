import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Swords } from 'lucide-react';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { UserScoreWidget } from './UserScoreWidget';
import { getRatingsText } from './i18n';
import type { ContestSession, ContestRound, ContestResult } from '@/hooks/useContestSession';

interface DuelResponsesPanelProps {
  session: ContestSession;
  rounds: ContestRound[];
  results: ContestResult[];
  streamingTexts: Record<string, string>;
  executing: boolean;
  isRu: boolean;
  modelA: string;
  modelB: string;
  nameA: string;
  nameB: string;
  LogoA: React.ComponentType<{ className?: string }> | null;
  LogoB: React.ComponentType<{ className?: string }> | null;
  roundWins: { winsA: number; winsB: number; draws: number };
  onScoreResult?: (resultId: string, score: number) => void;
}

export function DuelResponsesPanel({
  session, rounds, results, streamingTexts, executing, isRu,
  modelA, modelB, nameA, nameB, LogoA, LogoB, roundWins,
  onScoreResult,
}: DuelResponsesPanelProps) {
  const config = session.config;
  const [activeModel, setActiveModel] = useState<string>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpand = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col h-full">
      {/* Model filter tabs */}
      <div className="px-3 pt-2 pb-1 border-b border-border/50">
        <TabsList className="h-8 p-1 bg-muted/30 w-full justify-start gap-1">
          <TabsTrigger
            value="all"
            className={cn("text-xs h-6 px-3", activeModel === 'all' && "bg-background shadow-sm text-foreground")}
            onClick={() => setActiveModel('all')}
          >
            {isRu ? 'Все' : 'All'}
          </TabsTrigger>
          <TabsTrigger
            value={modelA}
            className={cn("text-xs h-6 px-3 gap-1 max-w-[140px] truncate", activeModel === modelA && "bg-background shadow-sm text-foreground")}
            onClick={() => setActiveModel(modelA)}
          >
            {LogoA && <LogoA className="h-3 w-3" />}
            {nameA}
          </TabsTrigger>
          <TabsTrigger
            value={modelB}
            className={cn("text-xs h-6 px-3 gap-1 max-w-[140px] truncate", activeModel === modelB && "bg-background shadow-sm text-foreground")}
            onClick={() => setActiveModel(modelB)}
          >
            {LogoB && <LogoB className="h-3 w-3" />}
            {nameB}
          </TabsTrigger>
        </TabsList>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {rounds.map((round, ri) => {
            const rResults = results.filter(r => r.round_id === round.id);
            const resultA = rResults.find(r => r.model_id === modelA);
            const resultB = rResults.find(r => r.model_id === modelB);
            const arbiterDone = resultA?.status === 'judged' && resultB?.status === 'judged';
            const scoreA = resultA?.arbiter_score;
            const scoreB = resultB?.arbiter_score;
            const roundWinner = arbiterDone
              ? (scoreA != null && scoreB != null ? (scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'draw') : null)
              : null;

            const completedRounds = rounds.filter(r => r.status === 'completed').length;
            const isCurrentRound = round.status === 'running' || (round.status === 'completed' && ri === completedRounds - 1);
            const isRunning = round.status === 'running';

            // Filter by active model
            const showA = activeModel === 'all' || activeModel === modelA;
            const showB = activeModel === 'all' || activeModel === modelB;

            if (!showA && !showB) return null;

            return (
              <div key={round.id} className={cn(
                'rounded-lg border overflow-hidden',
                isCurrentRound ? 'border-primary/40' : 'border-border/30',
              )}>
                {/* Round header */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 border-b border-border/20">
                  <span className="text-xs font-medium">
                    {getRatingsText('duelRoundN', isRu)} {ri + 1}
                  </span>
                  {roundWinner && (
                    <Badge variant={roundWinner === 'draw' ? 'secondary' : 'default'} className="text-[10px]">
                      {roundWinner === 'draw'
                        ? getRatingsText('duelDraw', isRu)
                        : `${getRatingsText('duelRoundWinner', isRu)}: ${roundWinner === 'A' ? nameA : nameB}`}
                    </Badge>
                  )}
                </div>

                {/* Split or single view */}
                {activeModel === 'all' ? (
                  <div className="grid grid-cols-2 divide-x divide-border/20">
                    <DuelResponseCard
                      result={resultA}
                      streamingText={isRunning ? streamingTexts[modelA] : undefined}
                      name={nameA}
                      Logo={LogoA}
                      score={scoreA}
                      expandKey={`${round.id}-A`}
                      expanded={expanded}
                      toggleExpand={toggleExpand}
                      executing={executing && isRunning}
                      isRu={isRu}
                      onScore={onScoreResult}
                    />
                    <DuelResponseCard
                      result={resultB}
                      streamingText={isRunning ? streamingTexts[modelB] : undefined}
                      name={nameB}
                      Logo={LogoB}
                      score={scoreB}
                      expandKey={`${round.id}-B`}
                      expanded={expanded}
                      toggleExpand={toggleExpand}
                      executing={executing && isRunning}
                      isRu={isRu}
                      onScore={onScoreResult}
                    />
                  </div>
                ) : (
                  <div className="p-0">
                    <DuelResponseCard
                      result={showA ? resultA : resultB}
                      streamingText={isRunning ? (showA ? streamingTexts[modelA] : streamingTexts[modelB]) : undefined}
                      name={showA ? nameA : nameB}
                      Logo={showA ? LogoA : LogoB}
                      score={showA ? scoreA : scoreB}
                      expandKey={`${round.id}-${showA ? 'A' : 'B'}`}
                      expanded={expanded}
                      toggleExpand={toggleExpand}
                      executing={executing && isRunning}
                      isRu={isRu}
                      fullWidth
                      onScore={onScoreResult}
                    />
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function DuelResponseCard({
  result, streamingText, name, Logo, score, expandKey, expanded, toggleExpand,
  executing, isRu, fullWidth, onScore,
}: {
  result?: ContestResult;
  streamingText?: string;
  name: string;
  Logo: React.ComponentType<{ className?: string }> | null;
  score?: number | null;
  expandKey: string;
  expanded: Record<string, boolean>;
  toggleExpand: (key: string) => void;
  executing: boolean;
  isRu: boolean;
  fullWidth?: boolean;
  onScore?: (resultId: string, score: number) => void;
}) {
  const text = result?.response_text || streamingText || '';
  const isExpanded = expanded[expandKey];
  const canScore = result && (result.status === 'ready' || result.status === 'judged') && onScore;

  return (
    <div className={cn("p-3 space-y-2", fullWidth && "px-4")}>
      <div className="flex items-center gap-1.5">
        {Logo && <Logo className="h-3.5 w-3.5" />}
        <span className="text-xs font-medium truncate">{name}</span>
        {result?.response_time_ms && (
          <span className="text-[10px] text-muted-foreground ml-auto">{(result.response_time_ms / 1000).toFixed(1)}s</span>
        )}
        {result?.token_count && (
          <span className="text-[10px] text-muted-foreground">{result.token_count} tok</span>
        )}
        {score != null && <Badge variant="outline" className="text-[10px] ml-1">{score.toFixed(1)}</Badge>}
      </div>
      {text ? (
        <button onClick={() => toggleExpand(expandKey)} className="w-full text-left group">
          <div className={cn('text-xs text-foreground/80 whitespace-pre-wrap min-h-[40px]', !isExpanded && 'line-clamp-3')}>
            <MarkdownRenderer content={text} />
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {isExpanded ? (isRu ? 'Свернуть' : 'Collapse') : (isRu ? 'Развернуть' : 'Expand')}
          </div>
        </button>
      ) : (
        <div className="text-xs text-foreground/80 whitespace-pre-wrap min-h-[40px]">
          <span className="text-muted-foreground italic">{executing ? '...' : '—'}</span>
        </div>
      )}
      {/* User score widget */}
      {canScore && (
        <UserScoreWidget resultId={result.id} currentScore={result.user_score} onScore={onScore!} isRu={isRu} />
      )}
      {/* Arbiter inline score */}
      {result?.arbiter_score != null && (
        <div className="flex items-center gap-3 text-[10px] pt-1 border-t border-border/30">
          <span>⚖️ {result.arbiter_score}/10</span>
          {result.arbiter_comment && (
            <span className="text-muted-foreground truncate">{result.arbiter_comment.slice(0, 80)}…</span>
          )}
        </div>
      )}
    </div>
  );
}