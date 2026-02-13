import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Circle, CheckCircle2, Loader2, Clock } from 'lucide-react';
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
  const [activeModel, setActiveModel] = useState<string>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleRoundExpand = (roundId: string) =>
    setExpanded(prev => ({ ...prev, [roundId]: !prev[roundId] }));

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

            const isRunning = round.status === 'running';
            const isCompleted = round.status === 'completed';
            const isPending = round.status === 'pending';
            const isExpanded = expanded[round.id] ?? false;

            const showA = activeModel === 'all' || activeModel === modelA;
            const showB = activeModel === 'all' || activeModel === modelB;
            if (!showA && !showB) return null;

            return (
              <React.Fragment key={round.id}>
                {/* Horizontal round divider */}
                {ri > 0 && (
                  <div className={cn(
                    'w-full relative z-10',
                    isRunning ? 'h-[3px]' : 'h-px',
                  )}>
                    {isRunning ? (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                    ) : (
                      <div className="absolute inset-0 bg-border/40" />
                    )}
                  </div>
                )}
                <div className={cn(
                  'rounded-lg border overflow-hidden',
                  isRunning ? 'border-primary/40' : 'border-border/30',
                )}>
                {activeModel === 'all' ? (
                  /* ── Split view with central timeline ── */
                  <div className="grid grid-cols-[1fr_auto_1fr] min-h-0">
                    {/* Left: Model A */}
                    <DuelResponseCard
                      result={resultA}
                      streamingText={isRunning ? streamingTexts[modelA] : undefined}
                      name={nameA}
                      Logo={LogoA}
                      score={scoreA}
                      executing={executing && isRunning}
                      isRu={isRu}
                      isExpanded={isExpanded}
                      onScore={onScoreResult}
                    />

                    {/* Center: Timeline separator */}
                    <RoundTimelineDivider
                      roundIndex={ri}
                      status={round.status}
                      isRunning={isRunning}
                      isCompleted={isCompleted}
                      isPending={isPending}
                      arbiterDone={arbiterDone}
                      roundWinner={roundWinner}
                      nameA={nameA}
                      nameB={nameB}
                      isExpanded={isExpanded}
                      onToggle={() => toggleRoundExpand(round.id)}
                      isRu={isRu}
                      hasContent={!!(resultA?.response_text || resultB?.response_text || (isRunning && (streamingTexts[modelA] || streamingTexts[modelB])))}
                    />

                    {/* Right: Model B */}
                    <DuelResponseCard
                      result={resultB}
                      streamingText={isRunning ? streamingTexts[modelB] : undefined}
                      name={nameB}
                      Logo={LogoB}
                      score={scoreB}
                      executing={executing && isRunning}
                      isRu={isRu}
                      isExpanded={isExpanded}
                      onScore={onScoreResult}
                    />
                  </div>
                ) : (
                  /* ── Single model view ── */
                  <div>
                    {/* Compact round header for single view */}
                    <button
                      onClick={() => toggleRoundExpand(round.id)}
                      className="w-full flex items-center justify-between px-3 py-1.5 bg-muted/20 border-b border-border/20 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <TimelineIcon status={round.status} isRunning={isRunning} arbiterDone={arbiterDone} />
                        <span className="text-xs font-medium">
                          {getRatingsText('duelRoundN', isRu)} {ri + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {roundWinner && (
                          <Badge variant={roundWinner === 'draw' ? 'secondary' : 'default'} className="text-[10px]">
                            {roundWinner === 'draw'
                              ? getRatingsText('duelDraw', isRu)
                              : `${roundWinner === 'A' ? nameA : nameB}`}
                          </Badge>
                        )}
                        {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </button>
                    <DuelResponseCard
                      result={showA ? resultA : resultB}
                      streamingText={isRunning ? (showA ? streamingTexts[modelA] : streamingTexts[modelB]) : undefined}
                      name={showA ? nameA : nameB}
                      Logo={showA ? LogoA : LogoB}
                      score={showA ? scoreA : scoreB}
                      executing={executing && isRunning}
                      isRu={isRu}
                      isExpanded={isExpanded}
                      fullWidth
                      onScore={onScoreResult}
                    />
                  </div>
                )}
              </div>
              </React.Fragment>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ── Timeline status icon ── */
function TimelineIcon({ status, isRunning, arbiterDone }: {
  status: string; isRunning: boolean; arbiterDone: boolean;
}) {
  if (isRunning) return <Loader2 className="h-3 w-3 animate-spin text-primary" />;
  if (arbiterDone) return <CheckCircle2 className="h-3 w-3 text-green-500" />;
  if (status === 'completed') return <CheckCircle2 className="h-3 w-3 text-muted-foreground" />;
  return <Circle className="h-3 w-3 text-muted-foreground/50" />;
}

/* ── Central timeline divider between duelists ── */
function RoundTimelineDivider({
  roundIndex, status, isRunning, isCompleted, isPending, arbiterDone,
  roundWinner, nameA, nameB, isExpanded, onToggle, isRu, hasContent,
}: {
  roundIndex: number;
  status: string;
  isRunning: boolean;
  isCompleted: boolean;
  isPending: boolean;
  arbiterDone: boolean;
  roundWinner: string | null;
  nameA: string;
  nameB: string;
  isExpanded: boolean;
  onToggle: () => void;
  isRu: boolean;
  hasContent: boolean;
}) {
  return (
    <div className="flex flex-col items-center w-10 py-2 relative">
      {/* Top connector line */}
      <div className={cn(
        "w-px flex-1 min-h-[8px]",
        isRunning ? "bg-primary/40" : isCompleted ? "bg-border" : "bg-border/30"
      )} />

      {/* Round node — the circle IS the expand/collapse button */}
      <div
        role={hasContent ? "button" : undefined}
        tabIndex={hasContent ? 0 : undefined}
        onClick={hasContent ? onToggle : undefined}
        onKeyDown={hasContent ? (e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); } : undefined}
        className={cn(
          "relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all my-1",
          isRunning && "border-primary bg-primary/10 text-primary",
          isCompleted && arbiterDone && "border-green-500/60 bg-green-500/10 text-green-600",
          isCompleted && !arbiterDone && "border-muted-foreground/40 bg-muted/30 text-muted-foreground",
          isPending && "border-border bg-background text-muted-foreground/50",
          hasContent && "cursor-pointer hover:scale-125 hover:shadow-md",
          hasContent && isExpanded && "ring-2 ring-primary/30",
        )}
        title={hasContent
          ? (isExpanded ? (isRu ? 'Свернуть' : 'Collapse') : (isRu ? 'Развернуть' : 'Expand'))
          : undefined}
      >
        {isRunning ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : roundWinner ? (
          <span>{roundWinner === 'draw' ? '=' : (roundWinner === 'A' ? '◀' : '▶')}</span>
        ) : (
          <span>{roundIndex + 1}</span>
        )}
      </div>

      {/* Bottom connector line */}
      <div className={cn(
        "w-px flex-1 min-h-[8px]",
        isRunning ? "bg-primary/40" : isCompleted ? "bg-border" : "bg-border/30"
      )} />
    </div>
  );
}

/* ── Single duelist response card (no expand button inside) ── */
function DuelResponseCard({
  result, streamingText, name, Logo, score,
  executing, isRu, isExpanded, fullWidth, onScore,
}: {
  result?: ContestResult;
  streamingText?: string;
  name: string;
  Logo: React.ComponentType<{ className?: string }> | null;
  score?: number | null;
  executing: boolean;
  isRu: boolean;
  isExpanded: boolean;
  fullWidth?: boolean;
  onScore?: (resultId: string, score: number) => void;
}) {
  const text = result?.response_text || streamingText || '';
  const canScore = result && (result.status === 'ready' || result.status === 'judged') && onScore;
  const isPending = !text && executing;

  return (
    <div className={cn(
      "p-3 space-y-2 relative",
      fullWidth && "px-4",
      isPending && "after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/60 after:to-transparent after:animate-pulse",
    )}>
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
        <div className={cn(
          'text-xs text-foreground/80 whitespace-pre-wrap min-h-[40px]',
          'duel-response-content',
          !isExpanded && 'line-clamp-3',
        )}>
          <MarkdownRenderer content={text} />
        </div>
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
