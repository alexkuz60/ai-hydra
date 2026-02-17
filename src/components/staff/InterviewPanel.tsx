import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInterviewSession, type InterviewSession } from '@/hooks/useInterviewSession';
import { useInterviewVerdict, type InterviewVerdict } from '@/hooks/useInterviewVerdict';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ModelSelector } from '@/components/warroom/ModelSelector';
import { cn } from '@/lib/utils';
import {
  X, Play, Loader2, CheckCircle2, XCircle, Clock,
  RefreshCw, Plus, DollarSign,
  Gavel, AlertTriangle,
} from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AgentRole } from '@/config/roles';
import { useHiredTechnoArbiter } from '@/hooks/useHiredTechnoArbiter';
import { ROLE_CONFIG } from '@/config/roles';
import { InterviewTimeline } from './InterviewTimeline';
import { isThinkingModel, estimateCost, formatCost } from './interviewUtils';
import { StepCard, SideBySideCard } from './InterviewStepCards';
import { VerdictSection } from './InterviewVerdictView';
import { SessionHistoryTable } from './InterviewHistoryTable';

interface InterviewPanelProps {
  role: AgentRole;
  onClose: () => void;
}

type ViewMode = 'progress' | 'results' | 'verdict';

export function InterviewPanel({ role, onClose }: InterviewPanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const interview = useInterviewSession();
  const verdictHook = useInterviewVerdict();
  const { effectiveArbiter } = useHiredTechnoArbiter();

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('progress');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [showNewForm, setShowNewForm] = useState(false);
  const [newModel, setNewModel] = useState(() => {
    try { return localStorage.getItem(`interview_model_${role}`) || ''; } catch { return ''; }
  });
  const [budgetMultiplier, setBudgetMultiplier] = useState(1);
  const [historicalForecast, setHistoricalForecast] = useState<{ median: number; count: number } | null>(null);

  const session = interview.session;
  const testResults = session?.test_results;
  const steps = testResults?.steps ?? [];

  // Load existing sessions for this role
  useEffect(() => {
    interview.listSessions().then(all => {
      const roleSessions = all.filter(s => s.role === role);
      setSessions(roleSessions);
      if (roleSessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(roleSessions[0].id);
        interview.loadSession(roleSessions[0].id);
      }
    });
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-detect thinking model and set 2x multiplier
  useEffect(() => {
    const modelId = session?.candidate_model;
    if (modelId && isThinkingModel(modelId) && session?.status === 'briefed') {
      setBudgetMultiplier(2);
    }
  }, [session?.candidate_model, session?.status]);

  // Fetch historical forecast when session is briefed
  useEffect(() => {
    if (session?.status === 'briefed' && session.candidate_model) {
      interview.getHistoricalTokenUsage(session.candidate_model, role).then(setHistoricalForecast);
    }
  }, [session?.status, session?.candidate_model, role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Use live SSE data when testing, fallback to saved test_results
  const liveTotal = interview.totalSteps;
  const liveCompleted = Array.from(interview.stepStatuses.values()).filter(
    s => s.status === 'completed' || s.status === 'failed'
  ).length;
  const liveRunning = Array.from(interview.stepStatuses.values()).filter(
    s => s.status === 'running'
  ).length;

  const completedCount = interview.testing ? liveCompleted : steps.filter(s => s.status === 'completed').length;
  const totalCount = interview.testing && liveTotal > 0 ? liveTotal : (testResults?.total_steps ?? steps.length);
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Cost calculation
  const totalTokens = useMemo(() => {
    if (interview.testing && interview.stepStatuses.size > 0) {
      return Array.from(interview.stepStatuses.values()).reduce((sum, s) => sum + (s.token_count || 0), 0);
    }
    return steps.reduce((sum, s) => sum + (s.token_count || 0), 0);
  }, [interview.testing, interview.stepStatuses, steps]);

  const totalElapsed = useMemo(() => {
    if (interview.testing && interview.stepStatuses.size > 0) {
      return Array.from(interview.stepStatuses.values()).reduce((sum, s) => sum + (s.elapsed_ms || 0), 0);
    }
    return steps.reduce((sum, s) => sum + (s.elapsed_ms || 0), 0);
  }, [interview.testing, interview.stepStatuses, steps]);

  const costEstimate = useMemo(() => {
    const modelId = session?.candidate_model;
    if (!modelId || totalTokens === 0) return null;
    return estimateCost(modelId, totalTokens);
  }, [session?.candidate_model, totalTokens]);

  // Pre-test budget estimate (for briefed sessions)
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

  const toggleStep = useCallback((idx: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const handleRunTests = useCallback(async () => {
    if (!session) return;
    setViewMode('progress');
    const maxTokens = budgetMultiplier > 1 ? 2048 * budgetMultiplier : undefined;
    await interview.runTests(session.id, maxTokens);
  }, [session, interview, budgetMultiplier]);

  const handleRunVerdict = useCallback(async () => {
    if (!session) return;
    setViewMode('verdict');
    await verdictHook.runVerdict(session.id, effectiveArbiter);
    await interview.loadSession(session.id);
    const all = await interview.listSessions();
    setSessions(all.filter(s => s.role === role));
  }, [session, verdictHook, interview, effectiveArbiter, role]);

  const handleApplyDecision = useCallback(async (decision: 'hire' | 'reject' | 'retest') => {
    if (!session) return;
    const retestComps = decision === 'retest'
      ? (verdictHook.verdict?.arbiter?.retest_competencies || [])
      : undefined;
    await verdictHook.applyDecision(session.id, decision, retestComps);
    await interview.loadSession(session.id);
    const all = await interview.listSessions();
    setSessions(all.filter(s => s.role === role));
  }, [session, verdictHook, interview, role]);

  const handleReload = useCallback(async () => {
    if (selectedSessionId) {
      await interview.loadSession(selectedSessionId);
    }
    const all = await interview.listSessions();
    setSessions(all.filter(s => s.role === role));
  }, [selectedSessionId, interview, role]);

  const handleCreateInterview = useCallback(async () => {
    if (!newModel) return;
    try { localStorage.setItem(`interview_model_${role}`, newModel); } catch {}
    const sessionId = await interview.createInterview(role, newModel);
    if (sessionId) {
      setShowNewForm(false);
      setSelectedSessionId(sessionId);
      const all = await interview.listSessions();
      setSessions(all.filter(s => s.role === role));
    }
  }, [role, newModel, interview]);

  const handleRestart = useCallback(async () => {
    if (!session) return;
    const model = session.candidate_model;
    const sessionId = await interview.createInterview(role, model);
    if (sessionId) {
      setSelectedSessionId(sessionId);
      const all = await interview.listSessions();
      setSessions(all.filter(s => s.role === role));
    }
  }, [session, role, interview]);

  const config = ROLE_CONFIG[role];
  const IconComponent = config.icon;

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-hydra-success" />;
      case 'running': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4 text-hydra-critical" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-2 shrink-0">
        <IconComponent className={cn("h-5 w-5", config.color)} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">
            {isRu ? 'Собеседование' : 'Interview'}: {role}
          </h3>
          {session && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {session.id.slice(0, 8)}
            </span>
          )}
        </div>
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNewForm(f => !f)}>
                  <Plus className={cn("h-3.5 w-3.5", showNewForm && "text-primary")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isRu ? 'Новое собеседование' : 'New Interview'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReload} disabled={interview.loading}>
                  <RefreshCw className={cn("h-3.5 w-3.5", interview.loading && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isRu ? 'Обновить' : 'Refresh'}
              </TooltipContent>
            </Tooltip>
            <div className="w-px h-5 bg-border ml-1.5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 ml-1 text-muted-foreground hover:text-destructive" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isRu ? 'Закрыть' : 'Close'}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* New Interview Form */}
      {showNewForm && (
        <div className="p-3 border-b border-border bg-muted/10 shrink-0 space-y-2">
          <div className="text-xs font-medium">
            {isRu ? 'Новое собеседование' : 'New Interview'}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {isRu ? 'Только модели с настроенными API-ключами (BYOK)' : 'Only models with configured API keys (BYOK)'}
          </div>
          <ModelSelector
            value={newModel}
            onChange={setNewModel}
            className="w-full"
            excludeLovableAI
          />
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={handleCreateInterview}
            disabled={!newModel || interview.loading}
          >
            {interview.loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {isRu ? 'Собрать брифинг' : 'Assemble Briefing'}
          </Button>
        </div>
      )}

      {session && (
        <div className="px-3 py-2 border-b border-border bg-muted/20 shrink-0">
          <InterviewTimeline
            status={session.status}
            isTesting={interview.testing}
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
            onRestart={handleRestart}
          />
          <div className="flex items-center gap-2 text-xs mt-1">
            <Badge variant="outline" className="text-[10px]">
              {session.status}
            </Badge>
            <span className="text-muted-foreground">
              {session.candidate_model}
            </span>
            {session.briefing_token_count && (
              <span className="text-muted-foreground ml-auto">
                ~{session.briefing_token_count.toLocaleString()} tok
              </span>
            )}
          </div>
          {(interview.testing || steps.length > 0 || totalTokens > 0) && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  {completedCount}/{totalCount} {isRu ? 'шагов' : 'steps'}
                  {interview.testing && liveRunning > 0 && (
                    <span className="text-primary ml-1">
                      ({liveRunning} {isRu ? 'выполняется' : 'running'})
                    </span>
                  )}
                </span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-1.5" />
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
      {session && session.status === 'briefed' && preTestBudget && (
        <div className="p-3 border-b border-border shrink-0 space-y-2">
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

      {/* Actions */}
      {session && !interview.testing && (session.status === 'briefed' || session.status === 'briefing' || (session.status === 'testing')) && (
        <div className="p-3 border-b border-border shrink-0">
          <Button size="sm" className="w-full gap-2" onClick={handleRunTests}>
            {session.status === 'testing' ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                {isRu ? 'Возобновить тесты' : 'Resume Tests'}
                {completedCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] ml-1">
                    {completedCount}/{totalCount}
                  </Badge>
                )}
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
      {session && session.status === 'tested' && !verdictHook.running && (
        <div className="p-3 border-b border-border shrink-0">
          <Button size="sm" className="w-full gap-2" onClick={handleRunVerdict}>
            <Gavel className="h-3.5 w-3.5" />
            {isRu ? 'Вынести вердикт' : 'Run Verdict'}
          </Button>
        </div>
      )}

      {verdictHook.running && (
        <div className="p-3 border-b border-border shrink-0 space-y-2">
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

      {interview.testing && (
        <div className="p-3 border-b border-border shrink-0">
          <Button size="sm" variant="destructive" className="w-full gap-2" onClick={interview.cancelTests}>
            <XCircle className="h-3.5 w-3.5" />
            {isRu ? 'Остановить' : 'Cancel'}
          </Button>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {!session && !interview.loading && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isRu ? 'Нет активных собеседований для этой роли' : 'No interview sessions for this role'}
            </p>
          )}

          {interview.loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Progress view */}
          {viewMode === 'progress' && steps.map((step, idx) => (
            <StepCard
              key={idx}
              step={step}
              index={idx}
              expanded={expandedSteps.has(idx)}
              onToggle={() => toggleStep(idx)}
              statusIcon={getStepStatusIcon(step.status)}
              isRu={isRu}
              modelId={session?.candidate_model}
            />
          ))}

          {/* Side-by-side results view */}
          {viewMode === 'results' && steps.filter(s => s.status === 'completed').map((step, idx) => (
            <SideBySideCard key={idx} step={step} index={idx} isRu={isRu} modelId={session?.candidate_model} />
          ))}

          {/* Verdict view */}
          {viewMode === 'verdict' && <VerdictSection
            session={session}
            verdict={verdictHook.verdict || (session?.verdict as unknown as InterviewVerdict | null)}
            phases={verdictHook.phases}
            isRu={isRu}
            onDecision={handleApplyDecision}
          />}

          {sessions.length > 0 && (
            <SessionHistoryTable
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              currentSessionId={sessions[0]?.id}
              onSelect={(id) => {
                setSelectedSessionId(id);
                interview.loadSession(id);
              }}
              onDeleted={async () => {
                const all = await interview.listSessions();
                const roleSessions = all.filter(s => s.role === role);
                setSessions(roleSessions);
                if (roleSessions.length > 0) {
                  setSelectedSessionId(roleSessions[0].id);
                  interview.loadSession(roleSessions[0].id);
                } else {
                  setSelectedSessionId(null);
                }
              }}
              isRu={isRu}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
