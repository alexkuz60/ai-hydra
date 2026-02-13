import React, { useMemo, useState } from 'react';
import { getRatingsText } from './i18n';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS } from '@/components/ui/ProviderLogos';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Swords, MessageSquare, BarChart3, Scale, PlusCircle, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { DuelPodiumScoreboard } from './DuelPodiumScoreboard';
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
  onNewDuel: () => void;
  onFinishDuel: () => void;
  onAddExtraRound?: (prompt: string) => void;
  onScoreResult?: (resultId: string, score: number) => void;
}

export function DuelBattleView({
  session, rounds, results, streamingTexts, executing, arbiterRunning,
  isRu, onNewDuel, onFinishDuel,
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
  const [promptPreviewOpen, setPromptPreviewOpen] = useState(false);
  const [promptPerspective, setPromptPerspective] = useState<'A' | 'B'>('A');

  // Parse dual prompts from stored format: promptA <!-- PROMPT_B_START --> promptB <!-- PROMPT_B_END -->
  const { promptA, promptB } = useMemo(() => {
    const completed = rounds.filter(r => r.status === 'completed' || r.status === 'running');
    const last = completed.length > 0 ? completed[completed.length - 1] : rounds[rounds.length - 1];
    const raw = last?.prompt || '';
    const markerStart = '<!-- PROMPT_B_START -->';
    const markerEnd = '<!-- PROMPT_B_END -->';
    const startIdx = raw.indexOf(markerStart);
    if (startIdx === -1) return { promptA: raw, promptB: '' };
    const pA = raw.slice(0, startIdx).trim();
    const endIdx = raw.indexOf(markerEnd);
    const pB = endIdx === -1
      ? raw.slice(startIdx + markerStart.length).trim()
      : raw.slice(startIdx + markerStart.length, endIdx).trim();
    return { promptA: pA, promptB: pB };
  }, [rounds]);

  const activePrompt = promptPerspective === 'A' ? promptA : (promptB || promptA);

  const roundWins = useMemo(() => {
    let winsA = 0, winsB = 0, draws = 0;
    for (const round of rounds) {
      const rResults = results.filter(r => r.round_id === round.id);
      const resA = rResults.find(r => r.model_id === modelA);
      const resB = rResults.find(r => r.model_id === modelB);
      // Use arbiter_score if available, fall back to user_score
      const scoreA = resA?.arbiter_score ?? resA?.user_score ?? null;
      const scoreB = resB?.arbiter_score ?? resB?.user_score ?? null;
      if (scoreA == null || scoreB == null) continue;
      if (scoreA > scoreB) winsA++;
      else if (scoreB > scoreA) winsB++;
      else draws++;
    }
    return { winsA, winsB, draws };
  }, [rounds, results, modelA, modelB]);

  const completedRounds = rounds.filter(r => r.status === 'completed').length;
  // Current active round = first non-completed, or total if all done
  const activeRoundNum = useMemo(() => {
    const running = rounds.find(r => r.status === 'running');
    if (running) return running.round_index + 1;
    return completedRounds + (completedRounds < rounds.length ? 1 : 0);
  }, [rounds, completedRounds]);
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
      {/* Podium scoreboard — replaces old banner + scoreboard */}
      <DuelPodiumScoreboard
        session={session}
        rounds={rounds}
        results={results}
        modelA={modelA} modelB={modelB}
        nameA={nameA} nameB={nameB}
        LogoA={LogoA} LogoB={LogoB}
        winsA={roundWins.winsA} winsB={roundWins.winsB} draws={roundWins.draws}
        currentRound={activeRoundNum} totalRounds={totalRounds}
        executing={executing} arbiterRunning={arbiterRunning}
        isRu={isRu}
        onNewDuel={onNewDuel}
        onFinishDuel={() => setFinishDialogOpen(true)}
      />

      {/* Action row: extra round + prompt preview */}
      <div className="px-3 py-1.5 border-b border-border/30 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setPromptPreviewOpen(true)}
          title={isRu ? 'Промпт последнего раунда' : 'Last round prompt'}>
          <FileText className="h-3.5 w-3.5" />
        </Button>
        {onAddExtraRound && !executing && !arbiterRunning && (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setExtraRoundOpen(true)}>
            <PlusCircle className="h-3 w-3" />
            {isRu ? 'Доп. раунд' : 'Extra Round'}
          </Button>
        )}
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
              session={session} rounds={rounds} results={results}
              streamingTexts={streamingTexts} executing={executing} isRu={isRu}
              modelA={modelA} modelB={modelB} nameA={nameA} nameB={nameB}
              LogoA={LogoA} LogoB={LogoB} roundWins={roundWins}
              onScoreResult={onScoreResult}
            />
          </TabsContent>

          <TabsContent value="scores" className="flex-1 min-h-0 overflow-auto mt-0 p-3 space-y-3">
            <DuelScoresPanel
              results={results} rounds={rounds} isRu={isRu}
              modelA={modelA} modelB={modelB} nameA={nameA} nameB={nameB}
              LogoA={LogoA} LogoB={LogoB} roundWins={roundWins}
              arbitration={session.config.arbitration}
            />
          </TabsContent>

          <TabsContent value="arbiter" className="flex-1 min-h-0 overflow-hidden mt-0">
            <ContestArbiterPanel
              results={results} rounds={rounds} isRu={isRu} initialRoundCount={totalRounds}
            />
          </TabsContent>
        </Tabs>
      </div>

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
            <Button variant="destructive" onClick={() => { onFinishDuel(); setFinishDialogOpen(false); }}>
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
                ? 'Введите задание для дополнительного раунда дуэли.'
                : 'Enter the prompt for the extra duel round.'}
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
                size="sm" disabled={!extraRoundPrompt.trim()}
                onClick={() => { onAddExtraRound?.(extraRoundPrompt.trim()); setExtraRoundOpen(false); setExtraRoundPrompt(''); }}
              >
                <Swords className="h-3 w-3 mr-1" />
                {isRu ? 'Запустить раунд' : 'Start Round'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Last round prompt preview with A/B toggle */}
      <Dialog open={promptPreviewOpen} onOpenChange={setPromptPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-4 w-4" />
              {isRu ? 'Промпт последнего раунда' : 'Last Round Prompt'}
              {promptB && (
                <div className="flex gap-1 ml-auto">
                  <Button
                    variant={promptPerspective === 'A' ? 'default' : 'outline'}
                    size="sm" className="h-6 text-[10px] px-2"
                    onClick={() => setPromptPerspective('A')}
                  >
                    {nameA}
                  </Button>
                  <Button
                    variant={promptPerspective === 'B' ? 'default' : 'outline'}
                    size="sm" className="h-6 text-[10px] px-2"
                    onClick={() => setPromptPerspective('B')}
                  >
                    {nameB}
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {activePrompt}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
