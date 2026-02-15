import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useContestSession } from '@/hooks/useContestSession';
import { useContestExecution } from '@/hooks/useContestExecution';
import { Crown, Play, Loader2, ChevronDown, ChevronUp, Send, BarChart3, Archive, MessageSquare, Scale, FileText, Users, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { useToast } from '@/hooks/use-toast';
import { getRatingsText } from './i18n';

// Extracted sub-components
import { ContestScoreboard } from './ContestScoreboard';
import { ContestResponsesPanel } from './ContestResponsesPanel';
import { ContestArbiterPanel } from './ContestArbiterPanel';
import { ContestScoresTable } from './ContestScoresTable';
import { ScoringSchemeComparison } from './ScoringSchemeComparison';

export function BeautyContest() {
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
  const [selectedWinners, setSelectedWinners] = useState<Set<string>>(new Set());
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [savingToTask, setSavingToTask] = useState(false);

  const handleToggleWinner = useCallback((modelId: string) => {
    setSelectedWinners(prev => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId); else next.add(modelId);
      return next;
    });
  }, []);

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
      toast({ variant: 'destructive', description: isRu ? 'Задача не выбрана в конфигурации конкурса' : 'No task selected in contest config' });
      return;
    }
    // Include ALL results with response text, not just scored ones (follow-up answers may lack scores)
    const exportableResults = contest.results.filter(r => r.response_text);
    if (exportableResults.length === 0) {
      toast({ variant: 'destructive', description: getRatingsText('noScoredResponses', isRu) });
      return;
    }
    setSavingToTask(true);
    try {
      // Build messages to insert into the existing task
      const messages: Array<{
        session_id: string; user_id: string; role: string;
        content: string; model_name: string | null; metadata: Record<string, unknown>;
      }> = [];

      // Group results by round
      const roundOrder = contest.rounds.map(r => r.id);
      const resultsByRound = new Map<string, typeof exportableResults>();
      for (const result of exportableResults) {
        const arr = resultsByRound.get(result.round_id) || [];
        arr.push(result);
        resultsByRound.set(result.round_id, arr);
      }

      // Determine initial round count from config to identify follow-up rounds
      const initialRoundCount = contest.session.config?.rules?.roundCount ?? contest.rounds.length;

      // For each round in order, insert prompt as user message, then responses
      for (const round of contest.rounds) {
        const roundResults = resultsByRound.get(round.id);
        if (!roundResults || roundResults.length === 0) continue;

        const isFollowUp = round.round_index >= initialRoundCount;

        // Insert round prompt as supervisor (user) message
        if (round.prompt) {
          messages.push({
            session_id: taskId,
            user_id: user.id,
            role: 'user',
            content: round.prompt,
            model_name: null,
            metadata: {
              source: 'contest',
              contest_session_id: contest.session.id,
              round_index: round.round_index,
              ...(isFollowUp && { is_follow_up: true }),
            },
          });
        }

        // Insert responses sorted by model, each followed by arbiter summary
        const sorted = [...roundResults].sort((a, b) => a.model_id.localeCompare(b.model_id));
        for (const result of sorted) {
          messages.push({
            session_id: taskId,
            user_id: user.id,
            role: 'assistant',
            content: result.response_text!,
            model_name: result.model_id,
            metadata: {
              source: 'contest',
              contest_session_id: contest.session.id,
              round_index: round.round_index,
              user_score: result.user_score,
              arbiter_score: result.arbiter_score,
              criteria_scores: result.criteria_scores,
              response_time_ms: result.response_time_ms,
              token_count: result.token_count,
              rating: result.user_score != null ? result.user_score : 0,
              ...(isFollowUp && { is_follow_up: true }),
            },
          });

          // Insert arbiter evaluation as arbiter message right after the response
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
              session_id: taskId,
              user_id: user.id,
              role: 'arbiter',
              content: arbiterContent,
              model_name: result.arbiter_model || null,
              metadata: {
                source: 'contest',
                contest_session_id: contest.session.id,
                round_index: round.round_index,
                arbiter_score: result.arbiter_score,
                criteria_scores: result.criteria_scores,
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

  const handleLoadFromHistory = async (sessionId: string) => {
    await contest.loadSession(sessionId);
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
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">
                {getRatingsText('intelligenceBeautyContest', isRu)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getRatingsText('configureContestAndLaunch', isRu)}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleLaunch} className="gap-2" size="lg">
                <Play className="h-4 w-4" />
                {getRatingsText('launchFromPlan', isRu)}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2" onClick={() => contest.loadHistory()}>
                    <Archive className="h-4 w-4" />
                    {getRatingsText('loadFromArchive', isRu)}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[70vh]">
                   <DialogHeader>
                     <DialogTitle>{getRatingsText('contestArchive', isRu)}</DialogTitle>
                   </DialogHeader>
                  <ScrollArea className="max-h-[50vh]">
                    <div className="space-y-2 pr-2">
                      {contest.sessionHistory.length === 0 ? (
                         <p className="text-sm text-muted-foreground text-center py-4">
                           {getRatingsText('noSavedContests', isRu)}
                         </p>
                      ) : (
                        contest.sessionHistory.map(s => (
                          <button
                            key={s.id}
                            onClick={() => handleLoadFromHistory(s.id)}
                            className="w-full text-left rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{s.name}</span>
                              <Badge variant={s.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                                {s.status}
                              </Badge>
                            </div>
                             <div className="text-[10px] text-muted-foreground">
                               {new Date(s.created_at).toLocaleDateString()} • {Object.keys(s.config.models || {}).length} {getRatingsText('models', isRu)}
                             </div>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
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
  const currentRoundIndex = contest.rounds.findIndex(r => r.status === 'running') ?? 0;
  const currentRound = contest.rounds[currentRoundIndex >= 0 ? currentRoundIndex : 0];

  return (
    <div className="h-full flex flex-col">
       <ContestScoreboard
          results={contest.results}
          currentRound={currentRoundIndex >= 0 ? currentRoundIndex : 0}
          totalRounds={contest.rounds.length || 1}
          completedRounds={contest.rounds.filter(r => r.status === 'completed').length}
          status={contest.session?.status || 'draft'}
          sessionName={contest.session?.name || getRatingsText('contest', isRu)}
          arbiterCount={contest.session?.config?.arbitration?.juryMode === 'ai' ? 1 : contest.session?.config?.arbitration?.juryMode === 'hybrid' ? 2 : 0}
          isRu={isRu}
          onNewContest={() => { contest.setSession(null); }}
          onFinishContest={() => setFinishDialogOpen(true)}
          arbitration={contest.session?.config?.arbitration}
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
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
              onEliminateModel={async (modelId) => {
                await contest.eliminateModel(modelId);
                toast({ description: isRu ? 'Модель отсеяна из конкурса' : 'Model eliminated from contest' });
              }}
              onRestoreModel={async (modelId) => {
                await contest.restoreModel(modelId);
                toast({ description: isRu ? 'Модель возвращена в конкурс' : 'Model restored to contest' });
              }}
            />
            <ScoringSchemeComparison
              results={contest.results}
              userWeight={(contest.session?.config?.arbitration as any)?.userWeight}
            />
             {selectedWinners.size > 0 && (
                <Button onClick={handleMigrateToExpertPanel} className="w-full gap-2" variant="outline">
                  <Crown className="h-3.5 w-3.5 text-primary" />
                  <Users className="h-3.5 w-3.5" />
                  {isRu
                    ? `Отправить ${selectedWinners.size} победител${selectedWinners.size === 1 ? 'я' : 'ей'} в Панель экспертов`
                    : `Send ${selectedWinners.size} winner${selectedWinners.size > 1 ? 's' : ''} to Expert Panel`}
                </Button>
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

        {/* Follow-up input */}
         <div className="border-t border-border px-3 py-2 flex-shrink-0">
           {activeModel !== 'all' && (
             <div className="flex items-center gap-1.5 mb-1.5">
               <Badge variant="outline" className="text-[10px] gap-1 border-primary/40 bg-primary/5">
                 {(() => {
                   const entry = getModelRegistryEntry(activeModel);
                   const ProviderLogo = entry?.provider ? PROVIDER_LOGOS[entry.provider] : undefined;
                   const color = entry?.provider ? PROVIDER_COLORS[entry.provider] : '';
                   const name = entry?.displayName || activeModel.split('/').pop() || activeModel;
                   return (
                     <>
                       {ProviderLogo && <ProviderLogo className={cn("h-2.5 w-2.5", color)} />}
                       {isRu ? `Вопрос для: ${name}` : `Question for: ${name}`}
                     </>
                   );
                 })()}
               </Badge>
                <button
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setActiveModel('all')}
                >
                  {isRu ? '(всем)' : '(all)'}
                </button>
             </div>
           )}
           {currentRoundIndex > 0 && (
             <div className="flex items-center gap-1.5 mb-1.5">
               <Badge variant="secondary" className="text-[10px] gap-1 py-0.5 px-2">
                 <MessageSquare className="h-3 w-3 opacity-70" />
                 {isRu 
                   ? `с контекстом ${currentRoundIndex} ${currentRoundIndex === 1 ? 'тура' : currentRoundIndex < 5 ? 'туров' : 'туров'}`
                   : `with ${currentRoundIndex} round${currentRoundIndex !== 1 ? 's' : ''} context`}
               </Badge>
             </div>
           )}
           <div className="flex items-end gap-2">
            <Textarea
              value={followUpText}
              onChange={e => setFollowUpText(e.target.value)}
              placeholder={
                 activeModel === 'all'
                   ? getRatingsText('followUpQuestionForAll', isRu)
                   : `${getRatingsText('questionForModel', isRu).replace('{model}', getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop() || '')}`
               }
              className="min-h-[36px] max-h-[100px] text-sm resize-none"
              rows={1}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (followUpText.trim() && contest.session?.status === 'running' && !sendingFollowUp && !execution.executing) {
                    handleSendFollowUp();
                  }
                }
              }}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    disabled={!followUpText.trim() || contest.session?.status !== 'running' || sendingFollowUp || execution.executing}
                    onClick={handleSendFollowUp}
                  >
                    {sendingFollowUp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {activeModel === 'all'
                    ? (isRu ? 'Отправить всем конкурсантам' : 'Send to all contestants')
                    : (isRu ? `Отправить только ${getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop()}` : `Send only to ${getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop()}`)
                  }
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
         </div>
       </div>

       {/* Finish confirmation dialog */}
       <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
         <DialogContent className="max-w-sm">
           <DialogHeader>
             <DialogTitle>{isRu ? 'Завершить конкурс?' : 'Finish contest?'}</DialogTitle>
           </DialogHeader>
           <p className="text-sm text-muted-foreground">
             {isRu 
               ? 'Все текущие раунды будут завершены. Это действие нельзя отменить.'
               : 'All current rounds will be completed. This action cannot be undone.'}
           </p>
           <div className="flex gap-2 justify-end mt-4">
             <Button variant="outline" onClick={() => setFinishDialogOpen(false)}>
               {isRu ? 'Отмена' : 'Cancel'}
             </Button>
             <Button 
               variant="destructive"
               onClick={async () => {
                 await contest.updateSessionStatus('completed');
                 setFinishDialogOpen(false);
                 toast({ description: isRu ? 'Конкурс завершён' : 'Contest finished' });
               }}
             >
               {isRu ? 'Завершить' : 'Finish'}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
}
