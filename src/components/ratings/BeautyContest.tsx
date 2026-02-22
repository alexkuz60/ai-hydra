import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useContestSession, type ContestResult } from '@/hooks/useContestSession';
import { useContestExecution } from '@/hooks/useContestExecution';
import { useContestAutoAdvance } from '@/hooks/useContestAutoAdvance';
import { Crown, Loader2, ChevronDown, ChevronUp, BarChart3, MessageSquare, Scale, FileText, Users, ClipboardList, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { useToast } from '@/hooks/use-toast';
import { getRatingsText } from './i18n';

// Extracted sub-components
import { ContestScoreboard } from './ContestScoreboard';
import { ContestResponsesPanel } from './ContestResponsesPanel';
import { ContestArbiterPanel } from './ContestArbiterPanel';
import { ContestScoresTable } from './ContestScoresTable';
import { ScoringSchemeComparison } from './ScoringSchemeComparison';
import { ContestEmptyState } from './ContestEmptyState';
import { ContestFollowUpInput } from './ContestFollowUpInput';
import { ContestFinishDialog } from './ContestFinishDialog';

interface BeautyContestProps {
  selectedWinners: Set<string>;
  onToggleWinner: (modelId: string) => void;
  onContestSessionChange?: (sessionId: string | undefined) => void;
}

export function BeautyContest({ selectedWinners, onToggleWinner: handleToggleWinner, onContestSessionChange }: BeautyContestProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const contest = useContestSession();
  const execution = useContestExecution();

  const [followUpText, setFollowUpText] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeModel, setActiveModel] = useState<string>('all');
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<string>('responses');
  const [promptOpen, setPromptOpen] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [savingToTask, setSavingToTask] = useState(false);
  const [roundTransition, setRoundTransition] = useState(false);
  const prevRoundIndexRef = React.useRef<number>(-1);

  // Auto-advance hook
  useContestAutoAdvance({
    executing: execution.executing,
    arbiterRunning: execution.arbiterRunning,
    session: contest.session,
    rounds: contest.rounds,
    results: contest.results,
    updateResult: contest.updateResult,
    executeRound: execution.executeRound,
    isRu,
  });

  const handleMigrateToExpertPanel = useCallback(() => {
    if (selectedWinners.size === 0 || !contest.session) return;

    const winnerModels = [...selectedWinners];
    const winnerResults = contest.results.filter(r => winnerModels.includes(r.model_id));
    const taskPrompt = contest.rounds[0]?.prompt || '';

    const migrationData = {
      contestName: contest.session.name,
      taskPrompt,
      winners: winnerModels.map(modelId => {
        const entry = getModelRegistryEntry(modelId);
        const modelResults = winnerResults.filter(r => r.model_id === modelId);
        const userScores = modelResults.filter(r => r.user_score != null).map(r => r.user_score!);
        const arbiterScores = modelResults.filter(r => r.arbiter_score != null).map(r => r.arbiter_score!);
        const avgUser = userScores.length ? userScores.reduce((a, b) => a + b, 0) / userScores.length : null;
        const avgArbiter = arbiterScores.length ? arbiterScores.reduce((a, b) => a + b, 0) / arbiterScores.length : null;
        const bestResponse = modelResults.find(r => r.response_text)?.response_text || '';
        return {
          modelId,
          displayName: entry?.displayName || modelId.split('/').pop() || modelId,
          provider: entry?.provider || null,
          avgUserScore: avgUser,
          avgArbiterScore: avgArbiter,
          totalScore: (avgUser ?? 0) + (avgArbiter ?? 0),
          bestResponse,
        };
      }).sort((a, b) => b.totalScore - a.totalScore),
    };

    sessionStorage.setItem('contest-migration', JSON.stringify(migrationData));
    navigate('/expert-panel');
    toast({ description: `${selectedWinners.size} ${getRatingsText('winnersToExpertPanel', isRu)}` });
  }, [selectedWinners, contest.session, contest.results, contest.rounds, navigate, isRu, toast]);

  const handleSaveToTask = useCallback(async () => {
    if (!user || !contest.session) return;
    const taskId = contest.session.config?.taskId;
    if (!taskId) {
      toast({ variant: 'destructive', description: getRatingsText('noTaskInConfig', isRu) });
      return;
    }
    const exportableResults = contest.results.filter(r => r.response_text);
    if (exportableResults.length === 0) {
      toast({ variant: 'destructive', description: getRatingsText('noScoredResponses', isRu) });
      return;
    }
    setSavingToTask(true);
    try {
      const messages: Array<{
        session_id: string; user_id: string; role: string;
        content: string; model_name: string | null; metadata: Record<string, unknown>;
      }> = [];

      const roundOrder = contest.rounds.map(r => r.id);
      const resultsByRound = new Map<string, typeof exportableResults>();
      for (const result of exportableResults) {
        const arr = resultsByRound.get(result.round_id) || [];
        arr.push(result);
        resultsByRound.set(result.round_id, arr);
      }

      const initialRoundCount = contest.session.config?.rules?.roundCount ?? contest.rounds.length;

      for (const round of contest.rounds) {
        const roundResults = resultsByRound.get(round.id);
        if (!roundResults || roundResults.length === 0) continue;

        const isFollowUp = round.round_index >= initialRoundCount;

        if (round.prompt) {
          messages.push({
            session_id: taskId, user_id: user.id, role: 'user',
            content: round.prompt, model_name: null,
            metadata: {
              source: 'contest', contest_session_id: contest.session.id,
              round_index: round.round_index,
              ...(isFollowUp && { is_follow_up: true }),
            },
          });
        }

        const sorted = [...roundResults].sort((a, b) => a.model_id.localeCompare(b.model_id));
        for (const result of sorted) {
          messages.push({
            session_id: taskId, user_id: user.id, role: 'assistant',
            content: result.response_text!, model_name: result.model_id,
            metadata: {
              source: 'contest', contest_session_id: contest.session.id,
              round_index: round.round_index,
              user_score: result.user_score, arbiter_score: result.arbiter_score,
              criteria_scores: result.criteria_scores,
              response_time_ms: result.response_time_ms, token_count: result.token_count,
              rating: result.user_score != null ? result.user_score : 0,
              ...(isFollowUp && { is_follow_up: true }),
            },
          });

          if (result.arbiter_score != null || result.arbiter_comment) {
            const criteriaLines = result.criteria_scores
              ? Object.entries(result.criteria_scores as Record<string, number>)
                  .map(([k, v]) => `- **${k}**: ${v}/10`)
                  .join('\n')
              : '';
            const arbiterContent = [
              result.arbiter_comment || '',
              criteriaLines ? `\n${criteriaLines}` : '',
              result.arbiter_score != null ? `\n**⚖️ ${result.arbiter_score}/10**` : '',
            ].filter(Boolean).join('\n');

            messages.push({
              session_id: taskId, user_id: user.id, role: 'arbiter',
              content: arbiterContent, model_name: result.arbiter_model || null,
              metadata: {
                source: 'contest', contest_session_id: contest.session.id,
                round_index: round.round_index,
                arbiter_score: result.arbiter_score, criteria_scores: result.criteria_scores,
                evaluated_model: result.model_id,
                ...(isFollowUp && { is_follow_up: true }),
              },
            });
          }
        }
      }

      const { error: msgErr } = await supabase.from('messages').insert(messages as any);
      if (msgErr) throw msgErr;

      toast({ description: getRatingsText('savedToTask', isRu) });
      navigate('/tasks');
    } catch (err: any) {
      toast({ variant: 'destructive', description: err.message });
    } finally {
      setSavingToTask(false);
    }
  }, [user, contest.session, contest.results, contest.rounds, isRu, toast, navigate]);

  useEffect(() => {
    if (user && initialLoad) {
      contest.loadLatestSession().finally(() => setInitialLoad(false));
    }
  }, [user]);

  useEffect(() => {
    onContestSessionChange?.(contest.session?.id);
  }, [contest.session?.id, onContestSessionChange]);

  // Detect round change and trigger fade transition
  const effectiveRoundIndex = Math.max(0, contest.rounds.findIndex(r => r.status === 'running'));
  useEffect(() => {
    if (prevRoundIndexRef.current === -1) {
      prevRoundIndexRef.current = effectiveRoundIndex;
      return;
    }
    if (effectiveRoundIndex !== prevRoundIndexRef.current) {
      setRoundTransition(true);
      const timer = setTimeout(() => setRoundTransition(false), 500);
      prevRoundIndexRef.current = effectiveRoundIndex;
      return () => clearTimeout(timer);
    }
  }, [effectiveRoundIndex]);

  const handleLaunch = async () => {
    const result = await contest.createFromWizard();
    if (result) {
      toast({ description: getRatingsText('contestLaunched', isRu) });
      const firstRound = result.rounds.find(r => r.status === 'running') || result.rounds[0];
      if (firstRound) {
        await execution.executeRound(result.session, firstRound, result.results, contest.updateResult, result.rounds);
      }
    }
  };

  const handleSendFollowUp = async () => {
    if (!followUpText.trim() || !contest.session) return;
    setSendingFollowUp(true);
    try {
      const targetModels = activeModel === 'all' ? undefined : [activeModel];
      const followUp = await contest.createFollowUpRound(followUpText.trim(), targetModels);
      if (followUp) {
        setFollowUpText('');
        const targetName = activeModel === 'all'
          ? getRatingsText('all', isRu)
          : (getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop());
        toast({ description: `${getRatingsText('questionSentTo', isRu)} ${targetName}` });
        await execution.executeRound(contest.session, followUp.round, [...contest.results, ...followUp.results], contest.updateResult, contest.rounds);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', description: err.message });
    } finally {
      setSendingFollowUp(false);
    }
  };

  // No session — launch/restore UI
  if (!contest.session && !initialLoad) {
    return (
      <ContestEmptyState
        isRu={isRu}
        sessionHistory={contest.sessionHistory}
        onLaunch={handleLaunch}
        onLoadHistory={() => contest.loadHistory()}
        onLoadSession={(id) => contest.loadSession(id)}
      />
    );
  }

  if (initialLoad) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Active session view
  const runningIdx = contest.rounds.findIndex(r => r.status === 'running');
  const completedCount = contest.rounds.filter(r => r.status === 'completed').length;
  const currentRoundIndex = runningIdx >= 0 ? runningIdx : Math.max(0, completedCount - 1);
  const currentRound = contest.rounds[currentRoundIndex] || contest.rounds[0];

  return (
    <div className="h-full flex flex-col">
      <ContestScoreboard
        results={contest.results}
        currentRound={currentRoundIndex}
        totalRounds={contest.rounds.length || 1}
        completedRounds={completedCount}
        status={contest.session?.status || 'draft'}
        sessionName={contest.session?.name || getRatingsText('contest', isRu)}
        arbiterCount={contest.session?.config?.arbitration?.juryMode === 'ai' ? 1 : contest.session?.config?.arbitration?.juryMode === 'hybrid' ? 2 : 0}
        isRu={isRu}
        onNewContest={() => { contest.setSession(null); }}
        onFinishContest={() => setFinishDialogOpen(true)}
        arbitration={contest.session?.config?.arbitration}
        eliminatedModels={contest.getEliminatedModels()}
      />

      {/* Collapsible prompt */}
      {currentRound?.prompt && (
        <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
          <CollapsibleTrigger className="w-full flex items-center gap-2 px-4 py-1.5 border-b border-border/30 hover:bg-muted/20 transition-colors text-left">
            <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] font-medium text-muted-foreground truncate flex-1">
               {isRu ? `Промпт ${getRatingsText('round', isRu)} ${(currentRoundIndex >= 0 ? currentRoundIndex : 0) + 1}` : `Round ${(currentRoundIndex >= 0 ? currentRoundIndex : 0) + 1} prompt`}
            </span>
            {promptOpen ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 py-2 border-b border-border/30 bg-muted/10">
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">{currentRound.prompt}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Unified tabset */}
      <div className={cn(
        "flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-500 ease-out",
        roundTransition ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      )}>
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex flex-col flex-1 min-h-0">
          <div className="px-3 pt-2 flex-shrink-0">
            <TabsList className="h-8 p-1 bg-muted/30 w-full justify-start gap-1">
              <TabsTrigger value="responses" className="text-xs h-6 px-3 gap-1">
                <MessageSquare className="h-3 w-3" />
                {getRatingsText('responses', isRu)}
              </TabsTrigger>
              <TabsTrigger value="scores" className="text-xs h-6 px-3 gap-1">
                <BarChart3 className="h-3 w-3" />
                {getRatingsText('scores', isRu)}
              </TabsTrigger>
              <TabsTrigger value="arbiter" className="text-xs h-6 px-3 gap-1">
                <Scale className="h-3 w-3" />
                {getRatingsText('contestArbitration', isRu)}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="responses" className="flex-1 min-h-0 overflow-hidden mt-0">
            <ContestResponsesPanel
              results={contest.results}
              rounds={contest.rounds}
              streamingTexts={execution.streamingTexts}
              isRu={isRu}
              initialRoundCount={contest.session?.config?.rules?.roundCount ?? 1}
              onScore={async (resultId, score) => {
                await contest.updateResult(resultId, { user_score: score } as any);
              }}
              onLikertScore={async (resultId, value) => {
                const result = contest.results.find(r => r.id === resultId);
                const meta = { ...(result?.metadata || {}), user_likert: value };
                await contest.updateResult(resultId, { metadata: meta } as any);
              }}
              activeModel={activeModel}
              onActiveModelChange={setActiveModel}
            />
          </TabsContent>

          <TabsContent value="scores" className="flex-1 min-h-0 overflow-auto mt-0 p-3 space-y-3">
            <ContestScoresTable
              results={contest.results}
              rounds={contest.rounds}
              isRu={isRu}
              selectedWinners={selectedWinners}
              onToggleWinner={handleToggleWinner}
              arbitration={contest.session?.config?.arbitration as any}
              eliminatedModels={contest.getEliminatedModels()}
              eliminationRule={(contest.session?.config?.rules as any)?.elimination}
              eliminationThreshold={(contest.session?.config as any)?.rules?.eliminationThreshold ?? 3}
              onEliminateModel={async (modelId) => {
                await contest.eliminateModel(modelId);
                 toast({ description: getRatingsText('modelEliminated', isRu) });
               }}
               onRestoreModel={async (modelId) => {
                 await contest.restoreModel(modelId);
                 toast({ description: getRatingsText('modelRestored', isRu) });
              }}
            />
            <ScoringSchemeComparison
              results={contest.results}
              userWeight={(contest.session?.config?.arbitration as any)?.userWeight}
            />
            {selectedWinners.size > 0 && (
              <>
                <Button onClick={handleMigrateToExpertPanel} className="w-full gap-2" variant="outline">
                  <Crown className="h-3.5 w-3.5 text-primary" />
                  <Users className="h-3.5 w-3.5" />
                  {isRu
                    ? `Отправить ${selectedWinners.size} победител${selectedWinners.size === 1 ? 'я' : 'ей'} в Панель экспертов`
                    : `Send ${selectedWinners.size} winner${selectedWinners.size > 1 ? 's' : ''} to Expert Panel`}
                </Button>
                <Button
                  onClick={() => window.dispatchEvent(new CustomEvent('podium-navigate', { detail: { section: 'interview' } }))}
                  className="w-full gap-2"
                  variant="default"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  {isRu
                    ? `Скрининг ${selectedWinners.size} кандидат${selectedWinners.size === 1 ? 'а' : 'ов'}`
                    : `Screen ${selectedWinners.size} candidate${selectedWinners.size > 1 ? 's' : ''}`}
                </Button>
              </>
            )}
            <Button
              onClick={handleSaveToTask}
              disabled={savingToTask}
              className="w-full gap-2"
              variant="outline"
            >
              {savingToTask ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardList className="h-3.5 w-3.5" />}
              {savingToTask ? getRatingsText('savingToTask', isRu) : getRatingsText('saveToTask', isRu)}
            </Button>
          </TabsContent>

          <TabsContent value="arbiter" className="flex-1 min-h-0 overflow-hidden mt-0">
            <ContestArbiterPanel
              results={contest.results}
              rounds={contest.rounds}
              isRu={isRu}
              initialRoundCount={contest.session?.config?.rules?.roundCount ?? 1}
            />
          </TabsContent>
        </Tabs>

        <ContestFollowUpInput
          isRu={isRu}
          activeModel={activeModel}
          onActiveModelChange={setActiveModel}
          followUpText={followUpText}
          onFollowUpTextChange={setFollowUpText}
          onSend={handleSendFollowUp}
          sending={sendingFollowUp}
          executing={execution.executing}
          sessionStatus={contest.session?.status}
          currentRoundIndex={currentRoundIndex}
        />
      </div>

      <ContestFinishDialog
        open={finishDialogOpen}
        onOpenChange={setFinishDialogOpen}
        isRu={isRu}
        onConfirm={async () => {
          await contest.updateSessionStatus('completed');
          setFinishDialogOpen(false);
          toast({ description: getRatingsText('contestFinished', isRu) });
        }}
      />
    </div>
  );
}
