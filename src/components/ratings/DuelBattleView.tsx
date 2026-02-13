import React, { useMemo, useState } from 'react';
import { getRatingsText } from './i18n';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS } from '@/components/ui/ProviderLogos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Swords, RotateCcw, Flag, Pause, Play, MessageSquare, BarChart3, Scale, PlusCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { DuelScoreboard } from './DuelScoreboard';
import { DuelResponsesPanel } from './DuelResponsesPanel';
import { ContestArbiterPanel } from './ContestArbiterPanel';
import { DuelScoresPanel } from './DuelScoresPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  onAddExtraRound?: (prompt: string) => void;
  onScoreResult?: (resultId: string, score: number) => void;
}

export function DuelBattleView({
  session, rounds, results, streamingTexts, executing, arbiterRunning,
  isRu, paused, onNewDuel, onFinishDuel, onPickRoundWinner, onTogglePause, onNextRound,
  onAddExtraRound, onScoreResult,
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

  const [activeTab, setActiveTab] = useState<string>('responses');
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [extraRoundOpen, setExtraRoundOpen] = useState(false);
  const [extraRoundPrompt, setExtraRoundPrompt] = useState('');

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
        nameA={nameA} nameB={nameB} LogoA={LogoA} LogoB={LogoB}
        winsA={roundWins.winsA} winsB={roundWins.winsB} draws={roundWins.draws}
        currentRound={completedRounds} totalRounds={totalRounds}
        status={session.status} executing={executing} arbiterRunning={arbiterRunning} isRu={isRu}
      />

      {/* Action buttons */}
      <div className="px-3 py-1.5 border-b border-border/30 flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          {session.status !== 'completed' && (
            <Button variant={paused ? 'default' : 'outline'} size="sm" className="h-7 text-xs gap-1" onClick={onTogglePause}>
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {paused ? (isRu ? 'Продолжить' : 'Resume') : (isRu ? 'Пауза' : 'Pause')}
            </Button>
          )}
          {canAdvance && (paused || (config as any).userEvaluation) && (
            <Button variant="default" size="sm" className="h-7 text-xs gap-1" onClick={onNextRound}>
              <Swords className="h-3 w-3" />
              {isRu ? 'Следующий раунд' : 'Next Round'}
            </Button>
          )}
          {/* Extra round button — visible when all planned rounds are done or session completed */}
          {onAddExtraRound && !executing && !arbiterRunning && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setExtraRoundOpen(true)}>
              <PlusCircle className="h-3 w-3" />
              {isRu ? 'Доп. раунд' : 'Extra Round'}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onNewDuel}>
            <RotateCcw className="h-3 w-3" />
            {getRatingsText('duelNewDuel', isRu)}
          </Button>
          {session.status !== 'completed' && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setFinishDialogOpen(true)}>
              <Flag className="h-3 w-3" />
              {getRatingsText('duelFinish', isRu)}
            </Button>
          )}
        </div>
      </div>

      {/* Tabbed content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <div className="px-3 pt-2 flex-shrink-0">
            <TabsList className="h-8 p-1 bg-muted/30 w-full justify-start gap-1">
              <TabsTrigger value="responses" className="text-xs h-6 px-3 gap-1">
                <MessageSquare className="h-3 w-3" />
                {getRatingsText('duelTabResponses', isRu)}
              </TabsTrigger>
              <TabsTrigger value="scores" className="text-xs h-6 px-3 gap-1">
                <BarChart3 className="h-3 w-3" />
                {getRatingsText('duelTabScores', isRu)}
              </TabsTrigger>
              <TabsTrigger value="arbiter" className="text-xs h-6 px-3 gap-1">
                <Scale className="h-3 w-3" />
                {getRatingsText('duelTabArbiter', isRu)}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="responses" className="flex-1 min-h-0 overflow-hidden mt-0">
            <DuelResponsesPanel
              session={session}
              rounds={rounds}
              results={results}
              streamingTexts={streamingTexts}
              executing={executing}
              isRu={isRu}
              modelA={modelA} modelB={modelB}
              nameA={nameA} nameB={nameB}
              LogoA={LogoA} LogoB={LogoB}
              roundWins={roundWins}
              onPickRoundWinner={onPickRoundWinner}
              onScoreResult={onScoreResult}
            />
          </TabsContent>

          <TabsContent value="scores" className="flex-1 min-h-0 overflow-auto mt-0 p-3 space-y-3">
            <DuelScoresPanel
              results={results}
              rounds={rounds}
              isRu={isRu}
              modelA={modelA} modelB={modelB}
              nameA={nameA} nameB={nameB}
              LogoA={LogoA} LogoB={LogoB}
              roundWins={roundWins}
              arbitration={session.config.arbitration}
            />
          </TabsContent>

          <TabsContent value="arbiter" className="flex-1 min-h-0 overflow-hidden mt-0">
            <ContestArbiterPanel
              results={results}
              rounds={rounds}
              isRu={isRu}
              initialRoundCount={totalRounds}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Final result banner */}
      {session.status === 'completed' && (
        <div className="border-t border-primary/30 bg-primary/5 px-4 py-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Swords className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">{getRatingsText('duelComplete', isRu)}</span>
          </div>
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

      {/* Finish confirmation dialog */}
      <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{getRatingsText('duelFinishConfirmTitle', isRu)}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {getRatingsText('duelFinishConfirmDesc', isRu)}
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setFinishDialogOpen(false)}>
              {getRatingsText('duelCancel', isRu)}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onFinishDuel();
                setFinishDialogOpen(false);
              }}
            >
              {getRatingsText('duelFinishConfirm', isRu)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extra round dialog */}
      <Dialog open={extraRoundOpen} onOpenChange={setExtraRoundOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              {isRu ? 'Дополнительный раунд' : 'Extra Round'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isRu
                ? 'Введите задание для дополнительного раунда дуэли. Оба дуэлянта получат этот промпт вместе с контекстом предыдущих раундов.'
                : 'Enter the prompt for the extra duel round. Both duelists will receive this prompt along with previous rounds context.'}
            </p>
            <Textarea
              value={extraRoundPrompt}
              onChange={e => setExtraRoundPrompt(e.target.value)}
              placeholder={isRu ? 'Задание для дополнительного раунда...' : 'Extra round prompt...'}
              className="min-h-[80px] text-xs resize-y"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setExtraRoundOpen(false); setExtraRoundPrompt(''); }}>
                {getRatingsText('duelCancel', isRu)}
              </Button>
              <Button
                size="sm"
                disabled={!extraRoundPrompt.trim()}
                onClick={() => {
                  onAddExtraRound?.(extraRoundPrompt.trim());
                  setExtraRoundOpen(false);
                  setExtraRoundPrompt('');
                }}
              >
                <Swords className="h-3 w-3 mr-1" />
                {isRu ? 'Запустить раунд' : 'Start Round'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}