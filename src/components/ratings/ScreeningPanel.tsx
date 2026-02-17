import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScreeningSession, type ScreeningCandidate } from '@/hooks/useScreeningSession';
import { useInterviewVerdict, type InterviewVerdict } from '@/hooks/useInterviewVerdict';
import { useHiredTechnoArbiter } from '@/hooks/useHiredTechnoArbiter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Play, Loader2, CheckCircle2, XCircle, Clock,
  UserCheck, RefreshCw, Gavel, DollarSign, AlertTriangle,
} from 'lucide-react';
import { ModelNameWithIcon } from '@/components/ui/ModelNameWithIcon';
import { InterviewTimeline } from '@/components/staff/InterviewTimeline';
import { StepCard, SideBySideCard } from '@/components/staff/InterviewStepCards';
import { VerdictSection } from '@/components/staff/InterviewVerdictView';
import { isThinkingModel, estimateCost, formatCost } from '@/components/staff/interviewUtils';

interface ScreeningPanelProps {
  role: string;
  selectedWinners: Set<string>;
  sourceContestId?: string;
}

type ViewMode = 'progress' | 'results' | 'verdict';

export function ScreeningPanel({ role, selectedWinners, sourceContestId }: ScreeningPanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const screening = useScreeningSession();
  const verdictHook = useInterviewVerdict();
  const { effectiveArbiter } = useHiredTechnoArbiter();

  const [activeTab, setActiveTab] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('progress');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [budgetMultiplier, setBudgetMultiplier] = useState(1);
  const [historicalForecast, setHistoricalForecast] = useState<{ median: number; count: number } | null>(null);

  // Init candidates when winners change
  const winnersArray = useMemo(() => Array.from(selectedWinners), [selectedWinners]);

  useEffect(() => {
    if (winnersArray.length > 0) {
      screening.initCandidates(winnersArray);
      setActiveTab(winnersArray[0]);
    }
  }, [winnersArray]); // eslint-disable-line react-hooks/exhaustive-deps

  const completedCount = screening.candidates.filter(c => c.status === 'tested' || c.status === 'completed').length;
  const failedCount = screening.candidates.filter(c => c.status === 'failed').length;
  const totalCount = screening.candidates.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleRunBatch = useCallback(() => {
    screening.runBatch(role, sourceContestId);
  }, [screening, role, sourceContestId]);

  // Load session detail when switching tabs
  const handleTabChange = useCallback((modelId: string) => {
    setActiveTab(modelId);
    setViewMode('progress');
    setExpandedSteps(new Set());
    const candidate = screening.candidates.find(c => c.modelId === modelId);
    if (candidate?.sessionId) {
      screening.loadCandidateSession(candidate.sessionId);
    }
  }, [screening]);

  // Auto-detect thinking model
  useEffect(() => {
    const modelId = screening.session?.candidate_model;
    if (modelId && isThinkingModel(modelId) && screening.session?.status === 'briefed') {
      setBudgetMultiplier(2);
    }
  }, [screening.session?.candidate_model, screening.session?.status]);

  // Fetch historical forecast
  useEffect(() => {
    if (screening.session?.status === 'briefed' && screening.session.candidate_model) {
      screening.getHistoricalTokenUsage(screening.session.candidate_model, role).then(setHistoricalForecast);
    }
  }, [screening.session?.status, screening.session?.candidate_model, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStep = useCallback((idx: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  // Session-level data
  const session = screening.session;
  const testResults = session?.test_results;
  const steps = testResults?.steps ?? [];

  // Auto-expand all steps when they load
  useEffect(() => {
    if (steps.length > 0) {
      setExpandedSteps(new Set(steps.map((_, i) => i)));
    }
  }, [steps.length]);

  // Live SSE data
  const liveCompleted = Array.from(screening.stepStatuses.values()).filter(
    s => s.status === 'completed' || s.status === 'failed'
  ).length;
  const liveRunning = Array.from(screening.stepStatuses.values()).filter(
    s => s.status === 'running'
  ).length;

  const sessionCompletedCount = screening.testing ? liveCompleted : steps.filter(s => s.status === 'completed').length;
  const sessionTotalCount = screening.testing && screening.totalSteps > 0 ? screening.totalSteps : (testResults?.total_steps ?? steps.length);
  const sessionProgressPct = sessionTotalCount > 0 ? Math.round((sessionCompletedCount / sessionTotalCount) * 100) : 0;

  // Cost calculation
  const totalTokens = useMemo(() => {
    if (screening.testing && screening.stepStatuses.size > 0) {
      return Array.from(screening.stepStatuses.values()).reduce((sum, s) => sum + (s.token_count || 0), 0);
    }
    return steps.reduce((sum, s) => sum + (s.token_count || 0), 0);
  }, [screening.testing, screening.stepStatuses, steps]);

  const totalElapsed = useMemo(() => {
    if (screening.testing && screening.stepStatuses.size > 0) {
      return Array.from(screening.stepStatuses.values()).reduce((sum, s) => sum + (s.elapsed_ms || 0), 0);
    }
    return steps.reduce((sum, s) => sum + (s.elapsed_ms || 0), 0);
  }, [screening.testing, screening.stepStatuses, steps]);

  const costEstimate = useMemo(() => {
    const modelId = session?.candidate_model;
    if (!modelId || totalTokens === 0) return null;
    return estimateCost(modelId, totalTokens);
  }, [session?.candidate_model, totalTokens]);

  // Pre-test budget estimate
  const preTestBudget = useMemo(() => {
    const modelId = session?.candidate_model;
    if (!modelId || session?.status !== 'briefed') return null;
    const baseTokens = historicalForecast?.median || 5000;
    const multiplier = budgetMultiplier;
    const totalEstimatedTokens = baseTokens * multiplier;
    const cost = estimateCost(modelId, totalEstimatedTokens);
    const isThinking = isThinkingModel(modelId);
    return {
      estimatedTokens: totalEstimatedTokens,
      baseTokens,
      multiplier,
      cost,
      isThinking,
      isHistorical: !!historicalForecast,
      historicalCount: historicalForecast?.count || 0,
    };
  }, [session?.candidate_model, session?.status, budgetMultiplier, historicalForecast]);

  const handleRunTests = useCallback(async () => {
    if (!session) return;
    setViewMode('progress');
    const maxTokens = budgetMultiplier > 1 ? 2048 * budgetMultiplier : undefined;
    await screening.runTests(session.id, maxTokens);
  }, [session, screening, budgetMultiplier]);

  const handleRunVerdict = useCallback(async () => {
    if (!session) return;
    setViewMode('verdict');
    await verdictHook.runVerdict(session.id, effectiveArbiter);
    await screening.loadSession(session.id);
  }, [session, verdictHook, screening, effectiveArbiter]);

  const handleApplyDecision = useCallback(async (decision: 'hire' | 'reject' | 'retest') => {
    if (!session) return;
    const retestComps = decision === 'retest'
      ? (verdictHook.verdict?.arbiter?.retest_competencies || [])
      : undefined;
    await verdictHook.applyDecision(session.id, decision, retestComps);
    await screening.loadSession(session.id);
  }, [session, verdictHook, screening]);

  const getStatusIcon = (status: ScreeningCandidate['status']) => {
    switch (status) {
      case 'tested':
      case 'completed':
        return <CheckCircle2 className="h-3.5 w-3.5 text-hydra-success" />;
      case 'briefing':
      case 'testing':
        return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
      case 'failed':
        return <XCircle className="h-3.5 w-3.5 text-hydra-critical" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-hydra-success" />;
      case 'running': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4 text-hydra-critical" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (winnersArray.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3 max-w-sm">
          <UserCheck className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-lg font-medium">
            {isRu ? 'Скрининг-интервью' : 'Screening Interview'}
          </p>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Выберите победителей конкурса (👑) в таблице результатов, чтобы запустить пакетное тестирование'
              : 'Select contest winners (👑) in the scores table to start batch screening'}
          </p>
        </div>
      </div>
    );
  }

  const activeCandidate = screening.candidates.find(c => c.modelId === activeTab);
  const isActiveSessionLoaded = session && session.candidate_model === activeTab;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              {isRu ? 'Скрининг-интервью' : 'Screening Interview'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRu
                ? `${totalCount} кандидат${totalCount > 1 ? 'ов' : ''} · Роль: ${role} · Параллельно: 2`
                : `${totalCount} candidate${totalCount > 1 ? 's' : ''} · Role: ${role} · Concurrency: 2`}
            </p>
          </div>
          {!screening.running && completedCount < totalCount && (
            <Button size="sm" className="gap-2" onClick={handleRunBatch}>
              <Play className="h-3.5 w-3.5" />
              {isRu ? 'Запустить скрининг' : 'Run Screening'}
            </Button>
          )}
          {screening.running && (
            <Button size="sm" variant="destructive" className="gap-2" onClick={screening.cancelBatch}>
              <XCircle className="h-3.5 w-3.5" />
              {isRu ? 'Остановить' : 'Cancel'}
            </Button>
          )}
        </div>

        {/* Batch progress */}
        {(screening.running || completedCount > 0) && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {completedCount}/{totalCount} {isRu ? 'завершено' : 'done'}
                {failedCount > 0 && (
                  <span className="text-hydra-critical ml-1">
                    ({failedCount} {isRu ? 'ошибок' : 'failed'})
                  </span>
                )}
              </span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>
        )}
      </div>

      {/* Candidate Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start px-4 pt-2 pb-0 bg-transparent border-b border-border rounded-none h-auto flex-wrap gap-1">
          {screening.candidates.map((candidate) => {
            const shortName = candidate.modelId.split('/').pop() || candidate.modelId;
            return (
              <TabsTrigger
                key={candidate.modelId}
                value={candidate.modelId}
                className="gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-md rounded-b-none"
              >
                {getStatusIcon(candidate.status)}
                <span className="max-w-[120px] truncate">{shortName}</span>
                {candidate.status === 'testing' && candidate.completedSteps != null && candidate.totalSteps != null && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                    {candidate.completedSteps}/{candidate.totalSteps}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {screening.candidates.map((candidate) => (
          <TabsContent
            key={candidate.modelId}
            value={candidate.modelId}
            className="flex-1 m-0 min-h-0 flex flex-col data-[state=inactive]:hidden"
          >
            {/* Session-level info bar when loaded */}
            {isActiveSessionLoaded && (
              <div className="px-4 py-2 border-b border-border bg-muted/20 shrink-0 space-y-2">
                <InterviewTimeline
                  status={session.status}
                  isTesting={screening.testing}
                  isVerdicting={verdictHook.running}
                  activePhase={
                    viewMode === 'progress' ? 'briefing'
                      : viewMode === 'results' ? 'testing'
                      : viewMode === 'verdict' ? 'verdict'
                      : undefined
                  }
                  onPhaseClick={(phase) => {
                    if (phase === 'briefing') setViewMode('progress');
                    else if (phase === 'testing') setViewMode('results');
                    else if (phase === 'verdict') setViewMode('verdict');
                  }}
                />
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px]">
                    {session.status}
                  </Badge>
                  <span className="text-muted-foreground">
                    <ModelNameWithIcon modelName={session.candidate_model} />
                  </span>
                  {session.briefing_token_count && (
                    <span className="text-muted-foreground ml-auto">
                      ~{session.briefing_token_count.toLocaleString()} tok
                    </span>
                  )}
                </div>

                {/* Session progress */}
                {(screening.testing || steps.length > 0 || totalTokens > 0) && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {sessionCompletedCount}/{sessionTotalCount} {isRu ? 'шагов' : 'steps'}
                        {screening.testing && liveRunning > 0 && (
                          <span className="text-primary ml-1">
                            ({liveRunning} {isRu ? 'выполняется' : 'running'})
                          </span>
                        )}
                      </span>
                      <span>{sessionProgressPct}%</span>
                    </div>
                    <Progress value={sessionProgressPct} className="h-1.5" />
                    {totalTokens > 0 && (
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1 flex-wrap">
                        <span>🪙 {totalTokens.toLocaleString()} tok</span>
                        {totalElapsed > 0 && (
                          <span>⏱ {(totalElapsed / 1000).toFixed(1)}s</span>
                        )}
                        {costEstimate && (
                          <span className="text-amber-500 font-medium">
                            💰 {formatCost(costEstimate.total)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Budget Estimate (pre-test) */}
            {isActiveSessionLoaded && session.status === 'briefed' && preTestBudget && (
              <div className="px-4 py-3 border-b border-border shrink-0 space-y-2">
                <div className="text-xs font-medium flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                  {isRu ? 'Оценка бюджета' : 'Budget Estimate'}
                </div>
                <div className="bg-muted/50 rounded-md p-2 text-[10px] space-y-1.5">
                  {preTestBudget.isHistorical ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {isRu ? `Прогноз (${preTestBudget.historicalCount} интервью)` : `Forecast (${preTestBudget.historicalCount} interviews)`}:
                      </span>
                      <span className="font-mono">~{preTestBudget.baseTokens.toLocaleString()} tok</span>
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic">
                      {isRu ? 'Нет истории — используется базовая оценка' : 'No history — using base estimate'}
                    </div>
                  )}
                  {preTestBudget.isThinking && (
                    <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 rounded px-1.5 py-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>
                        {isRu
                          ? 'Модель с рассуждениями — рекомендуется 2x бюджет'
                          : 'Thinking model — 2x budget recommended'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{isRu ? 'Множитель' : 'Multiplier'}:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(m => (
                        <button
                          key={m}
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono transition-colors",
                            budgetMultiplier === m
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          )}
                          onClick={() => setBudgetMultiplier(m)}
                        >
                          {m}x
                        </button>
                      ))}
                    </div>
                  </div>
                  {preTestBudget.cost && (
                    <div className="flex justify-between pt-1 border-t border-border font-medium">
                      <span>{isRu ? 'Оценка стоимости' : 'Est. cost'}:</span>
                      <span className="font-mono text-amber-500">
                        ≤{formatCost(preTestBudget.cost.total)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {isActiveSessionLoaded && !screening.testing && (session.status === 'briefed' || session.status === 'testing') && (
              <div className="px-4 py-3 border-b border-border shrink-0">
                <Button size="sm" className="w-full gap-2" onClick={handleRunTests}>
                  {session.status === 'testing' ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      {isRu ? 'Возобновить тесты' : 'Resume Tests'}
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      {isRu ? 'Запустить тесты' : 'Run Tests'}
                      {budgetMultiplier > 1 && (
                        <Badge variant="secondary" className="text-[10px] ml-1">
                          {budgetMultiplier}x
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Verdict action */}
            {isActiveSessionLoaded && session.status === 'tested' && !verdictHook.running && (
              <div className="px-4 py-3 border-b border-border shrink-0">
                <Button size="sm" className="w-full gap-2" onClick={handleRunVerdict}>
                  <Gavel className="h-3.5 w-3.5" />
                  {isRu ? 'Вынести вердикт' : 'Run Verdict'}
                </Button>
              </div>
            )}

            {verdictHook.running && activeCandidate?.modelId === activeTab && (
              <div className="px-4 py-3 border-b border-border shrink-0 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>{isRu ? 'Фаза' : 'Phase'}: {verdictHook.currentPhase}</span>
                </div>
                <Button size="sm" variant="destructive" className="w-full gap-2" onClick={verdictHook.cancelVerdict}>
                  <XCircle className="h-3.5 w-3.5" />
                  {isRu ? 'Остановить' : 'Cancel'}
                </Button>
              </div>
            )}

            {screening.testing && activeCandidate?.modelId === activeTab && (
              <div className="px-4 py-3 border-b border-border shrink-0">
                <Button size="sm" variant="destructive" className="w-full gap-2" onClick={screening.cancelTests}>
                  <XCircle className="h-3.5 w-3.5" />
                  {isRu ? 'Остановить' : 'Cancel'}
                </Button>
              </div>
            )}

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {/* Pending state */}
                {candidate.status === 'pending' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                    <Clock className="h-4 w-4" />
                    {isRu ? 'В очереди' : 'Queued'}
                  </div>
                )}

                {/* Briefing state */}
                {candidate.status === 'briefing' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isRu ? 'Сбор брифинга...' : 'Assembling briefing...'}
                  </div>
                )}

                {/* Error state */}
                {candidate.status === 'failed' && candidate.error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {candidate.error}
                  </div>
                )}

                {/* Loading session */}
                {screening.loading && !isActiveSessionLoaded && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Full interview content when session is loaded */}
                {isActiveSessionLoaded && (
                  <>
                    {/* Progress view — expandable step cards */}
                    {viewMode === 'progress' && steps.map((step, idx) => (
                      <StepCard
                        key={idx}
                        step={step}
                        index={idx}
                        expanded={expandedSteps.has(idx)}
                        onToggle={() => toggleStep(idx)}
                        statusIcon={getStepStatusIcon(step.status)}
                        isRu={isRu}
                        modelId={session.candidate_model}
                      />
                    ))}

                    {/* Side-by-side results view */}
                    {viewMode === 'results' && steps.filter(s => s.status === 'completed').map((step, idx) => (
                      <SideBySideCard key={idx} step={step} index={idx} isRu={isRu} modelId={session.candidate_model} />
                    ))}

                    {/* Verdict view */}
                    {viewMode === 'verdict' && (
                      <VerdictSection
                        session={session}
                        verdict={verdictHook.verdict || (session.verdict as unknown as InterviewVerdict | null)}
                        phases={verdictHook.phases}
                        isRu={isRu}
                        onDecision={handleApplyDecision}
                      />
                    )}

                    {/* Empty state for progress with no steps yet */}
                    {viewMode === 'progress' && steps.length === 0 && !screening.testing && session.status === 'briefed' && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {isRu ? 'Брифинг собран — запустите тесты' : 'Briefing ready — run tests to proceed'}
                      </p>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
