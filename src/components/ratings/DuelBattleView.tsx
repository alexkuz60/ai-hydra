import React, { useMemo, useState } from 'react';
import { getRatingsText } from './i18n';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS } from '@/components/ui/ProviderLogos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Swords, RotateCcw, Flag, Pause, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { DuelScoreboard } from './DuelScoreboard';
import type { ContestSession, ContestRound, ContestResult } from '@/hooks/useContestSession';

interface DuelBattleViewProps {
  session: ContestSession;
  rounds: ContestRound[];
  results: ContestResult[];
  streamingTexts: Record<string, string>;
  executing: boolean;
  arbiterRunning: boolean;
  isRu: boolean;
  paused: boolean;
  onNewDuel: () => void;
  onFinishDuel: () => void;
  onPickRoundWinner: (roundId: string, winnerId: string) => void;
  onTogglePause: () => void;
  onNextRound: () => void;
}

export function DuelBattleView({
  session, rounds, results, streamingTexts, executing, arbiterRunning,
  isRu, paused, onNewDuel, onFinishDuel, onPickRoundWinner, onTogglePause, onNextRound,
}: DuelBattleViewProps) {
  const config = session.config;
  const modelA = Object.keys(config.models || {})[0] || '';
  const modelB = Object.keys(config.models || {})[1] || '';
  const entryA = getModelRegistryEntry(modelA);
  const entryB = getModelRegistryEntry(modelB);
  const nameA = entryA?.displayName || modelA.split('/').pop() || 'A';
  const nameB = entryB?.displayName || modelB.split('/').pop() || 'B';
  const LogoA = entryA?.provider ? PROVIDER_LOGOS[entryA.provider] : null;
  const LogoB = entryB?.provider ? PROVIDER_LOGOS[entryB.provider] : null;

  // Expanded state per response
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpand = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  // Score
  const roundWins = useMemo(() => {
    let winsA = 0, winsB = 0, draws = 0;
    for (const round of rounds) {
      if (round.status !== 'completed') continue;
      const rResults = results.filter(r => r.round_id === round.id);
      const scoreA = rResults.find(r => r.model_id === modelA)?.arbiter_score ?? 0;
      const scoreB = rResults.find(r => r.model_id === modelB)?.arbiter_score ?? 0;
      if (scoreA > scoreB) winsA++;
      else if (scoreB > scoreA) winsB++;
      else draws++;
    }
    return { winsA, winsB, draws };
  }, [rounds, results, modelA, modelB]);

  const completedRounds = rounds.filter(r => r.status === 'completed').length;
  const totalRounds = rounds.length || 1;
  const allJudgedLastRound = useMemo(() => {
    const lastCompleted = rounds.filter(r => r.status === 'completed').slice(-1)[0];
    if (!lastCompleted) return false;
    const rr = results.filter(r => r.round_id === lastCompleted.id);
    return rr.length >= 2 && rr.every(r => r.status === 'judged');
  }, [rounds, results]);
  const hasMoreRounds = completedRounds < totalRounds;
  const canAdvance = allJudgedLastRound && hasMoreRounds && !executing && !arbiterRunning && session.status !== 'completed';

  return (
    <div className="h-full flex flex-col">
      {/* Scoreboard header */}
      <DuelScoreboard
        nameA={nameA}
        nameB={nameB}
        LogoA={LogoA}
        LogoB={LogoB}
        winsA={roundWins.winsA}
        winsB={roundWins.winsB}
        draws={roundWins.draws}
        currentRound={completedRounds}
        totalRounds={totalRounds}
        status={session.status}
        executing={executing}
        arbiterRunning={arbiterRunning}
        isRu={isRu}
      />

      {/* Action buttons */}
      <div className="px-3 py-1.5 border-b border-border/30 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          {/* Pause / Resume toggle */}
          {session.status !== 'completed' && (
            <Button
              variant={paused ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={onTogglePause}
            >
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {paused ? (isRu ? 'Продолжить' : 'Resume') : (isRu ? 'Пауза' : 'Pause')}
            </Button>
          )}
          {/* Next Round button (visible when paused OR userEvaluation enabled) */}
          {canAdvance && (paused || (config as any).userEvaluation) && (
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={onNextRound}
            >
              <Swords className="h-3 w-3" />
              {isRu ? 'Следующий раунд' : 'Next Round'}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onNewDuel}>
            <RotateCcw className="h-3 w-3" />
            {getRatingsText('duelNewDuel', isRu)}
          </Button>
          {session.status !== 'completed' && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onFinishDuel}>
              <Flag className="h-3 w-3" />
              {getRatingsText('duelFinish', isRu)}
            </Button>
          )}
        </div>
      </div>

      {/* Split-screen battle area */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {rounds.map((round, ri) => {
            const rResults = results.filter(r => r.round_id === round.id);
            const resultA = rResults.find(r => r.model_id === modelA);
            const resultB = rResults.find(r => r.model_id === modelB);
            const textA = resultA?.response_text || streamingTexts[modelA] || '';
            const textB = resultB?.response_text || streamingTexts[modelB] || '';
            const isCurrentRound = round.status === 'running' || (round.status === 'completed' && ri === completedRounds - 1);
            const arbiterDone = resultA?.status === 'judged' && resultB?.status === 'judged';
            const scoreA = resultA?.arbiter_score;
            const scoreB = resultB?.arbiter_score;
            const roundWinner = arbiterDone
              ? (scoreA != null && scoreB != null ? (scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'draw') : null)
              : null;

            const keyA = `${round.id}-A`;
            const keyB = `${round.id}-B`;
            const isExpandedA = expanded[keyA];
            const isExpandedB = expanded[keyB];

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

                {/* Two columns */}
                <div className="grid grid-cols-2 divide-x divide-border/20">
                  {/* Model A */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      {LogoA && <LogoA className="h-3.5 w-3.5" />}
                      <span className="text-xs font-medium truncate">{nameA}</span>
                      {scoreA != null && <Badge variant="outline" className="text-[10px] ml-auto">{scoreA.toFixed(1)}</Badge>}
                    </div>
                    {textA ? (
                      <button
                        onClick={() => toggleExpand(keyA)}
                        className="w-full text-left group"
                      >
                        <div className={cn(
                          'text-xs text-foreground/80 whitespace-pre-wrap min-h-[40px]',
                          !isExpandedA && 'line-clamp-3'
                        )}>
                          {textA}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {isExpandedA ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpandedA ? (isRu ? 'Свернуть' : 'Collapse') : (isRu ? 'Развернуть' : 'Expand')}
                        </div>
                      </button>
                    ) : (
                      <div className="text-xs text-foreground/80 whitespace-pre-wrap min-h-[40px]">
                        <span className="text-muted-foreground italic">{executing ? '...' : '—'}</span>
                      </div>
                    )}
                  </div>

                  {/* Model B */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      {LogoB && <LogoB className="h-3.5 w-3.5" />}
                      <span className="text-xs font-medium truncate">{nameB}</span>
                      {scoreB != null && <Badge variant="outline" className="text-[10px] ml-auto">{scoreB.toFixed(1)}</Badge>}
                    </div>
                    {textB ? (
                      <button
                        onClick={() => toggleExpand(keyB)}
                        className="w-full text-left group"
                      >
                        <div className={cn(
                          'text-xs text-foreground/80 whitespace-pre-wrap min-h-[40px]',
                          !isExpandedB && 'line-clamp-3'
                        )}>
                          {textB}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {isExpandedB ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpandedB ? (isRu ? 'Свернуть' : 'Collapse') : (isRu ? 'Развернуть' : 'Expand')}
                        </div>
                      </button>
                    ) : (
                      <div className="text-xs text-foreground/80 whitespace-pre-wrap min-h-[40px]">
                        <span className="text-muted-foreground italic">{executing ? '...' : '—'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* User pick buttons (if enabled & round ready but not judged by user yet) */}
                {(config as any).userEvaluation && arbiterDone && (
                  <div className="flex items-center justify-center gap-2 px-3 py-2 bg-muted/10 border-t border-border/20">
                    <span className="text-[10px] text-muted-foreground">{getRatingsText('duelPickWinner', isRu)}:</span>
                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => onPickRoundWinner(round.id, modelA)}>
                      {nameA}
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => onPickRoundWinner(round.id, modelB)}>
                      {nameB}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Final result */}
          {session.status === 'completed' && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center space-y-2">
              <Swords className="h-6 w-6 text-primary mx-auto" />
              <div className="text-sm font-bold">{getRatingsText('duelComplete', isRu)}</div>
              <div className="text-xs text-muted-foreground">
                {getRatingsText('duelScore', isRu)}: {nameA} {roundWins.winsA} — {roundWins.draws} — {roundWins.winsB} {nameB}
              </div>
              {(roundWins.winsA !== roundWins.winsB) && (
                <div className="text-sm font-medium text-primary">
                  {getRatingsText('duelOverallWinner', isRu)}: {roundWins.winsA > roundWins.winsB ? nameA : nameB}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
