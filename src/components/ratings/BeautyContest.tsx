import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useContestSession } from '@/hooks/useContestSession';
import { useContestExecution } from '@/hooks/useContestExecution';
import { Crown, Play, Loader2, ChevronDown, ChevronUp, Send, BarChart3, Archive, MessageSquare, Scale, FileText, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { useToast } from '@/hooks/use-toast';

// Extracted sub-components
import { ContestScoreboard } from './ContestScoreboard';
import { ContestResponsesPanel } from './ContestResponsesPanel';
import { ContestArbiterPanel } from './ContestArbiterPanel';
import { ContestScoresTable } from './ContestScoresTable';

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
    toast({ description: isRu ? `${selectedWinners.size} победитель(ей) отправлено в Панель экспертов` : `${selectedWinners.size} winner(s) sent to Expert Panel` });
  }, [selectedWinners, contest.session, contest.results, contest.rounds, navigate, isRu, toast]);

  useEffect(() => {
    if (user && initialLoad) {
      contest.loadLatestSession().finally(() => setInitialLoad(false));
    }
  }, [user]);

  const handleLaunch = async () => {
    const result = await contest.createFromWizard();
    if (result) {
      toast({ description: isRu ? 'Конкурс запущен!' : 'Contest launched!' });
      const firstRound = result.rounds.find(r => r.status === 'running') || result.rounds[0];
      if (firstRound) {
        await execution.executeRound(result.session, firstRound, result.results, contest.updateResult);
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
          ? (isRu ? 'всем' : 'all')
          : (getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop());
        toast({ description: isRu ? `Вопрос отправлен: ${targetName}` : `Question sent to: ${targetName}` });
        await execution.executeRound(contest.session, followUp.round, followUp.results, contest.updateResult);
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
                {isRu ? 'Конкурс интеллект-красоты' : 'Intelligence Beauty Contest'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Настройте конкурс в разделе «Правила» и запустите его здесь, или восстановите предыдущую сессию.'
                  : 'Configure the contest in "Rules" section and launch it here, or restore a previous session.'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleLaunch} className="gap-2" size="lg">
                <Play className="h-4 w-4" />
                {isRu ? 'Запустить из плана' : 'Launch from Plan'}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2" onClick={() => contest.loadHistory()}>
                    <Archive className="h-4 w-4" />
                    {isRu ? 'Загрузить из архива' : 'Load from Archive'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[70vh]">
                  <DialogHeader>
                    <DialogTitle>{isRu ? 'Архив конкурсов' : 'Contest Archive'}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[50vh]">
                    <div className="space-y-2 pr-2">
                      {contest.sessionHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {isRu ? 'Нет сохранённых конкурсов' : 'No saved contests'}
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
                              {new Date(s.created_at).toLocaleDateString()} • {Object.keys(s.config.models || {}).length} {isRu ? 'моделей' : 'models'}
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
        sessionName={contest.session?.name || (isRu ? 'Конкурс' : 'Contest')}
        arbiterCount={contest.session?.config?.arbitration?.juryMode === 'ai' ? 1 : contest.session?.config?.arbitration?.juryMode === 'hybrid' ? 2 : 0}
        isRu={isRu}
        onNewContest={() => { contest.setSession(null); }}
      />

      {/* Collapsible prompt */}
      {currentRound?.prompt && (
        <Collapsible open={promptOpen} onOpenChange={setPromptOpen}>
          <CollapsibleTrigger className="w-full flex items-center gap-2 px-4 py-1.5 border-b border-border/30 hover:bg-muted/20 transition-colors text-left">
            <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] font-medium text-muted-foreground truncate flex-1">
              {isRu ? `Промпт тура ${(currentRoundIndex >= 0 ? currentRoundIndex : 0) + 1}` : `Round ${(currentRoundIndex >= 0 ? currentRoundIndex : 0) + 1} prompt`}
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
                {isRu ? 'Ответы' : 'Responses'}
              </TabsTrigger>
              <TabsTrigger value="scores" className="text-xs h-6 px-3 gap-1">
                <BarChart3 className="h-3 w-3" />
                {isRu ? 'Оценки' : 'Scores'}
              </TabsTrigger>
              <TabsTrigger value="arbiter" className="text-xs h-6 px-3 gap-1">
                <Scale className="h-3 w-3" />
                {isRu ? 'Арбитраж' : 'Arbiter'}
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
          <div className="flex items-end gap-2">
            <Textarea
              value={followUpText}
              onChange={e => setFollowUpText(e.target.value)}
              placeholder={
                activeModel === 'all'
                  ? (isRu ? 'Дополнительный вопрос всем конкурсантам...' : 'Follow-up question for all contestants...')
                  : (isRu ? `Вопрос для ${getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop()}...` : `Question for ${getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop()}...`)
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
    </div>
  );
}
