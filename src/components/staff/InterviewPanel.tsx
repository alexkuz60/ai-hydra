import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInterviewSession, type InterviewSession, type InterviewTestStep } from '@/hooks/useInterviewSession';
import { useInterviewVerdict, type InterviewVerdict } from '@/hooks/useInterviewVerdict';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { ModelSelector } from '@/components/warroom/ModelSelector';
import { cn } from '@/lib/utils';
import {
  X, Play, Loader2, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronRight, FileText, Columns2,
  SquareArrowOutUpRight, RefreshCw, Plus, DollarSign,
  Gavel, UserCheck, UserX, RotateCcw, AlertTriangle, Shield,
} from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AgentRole } from '@/config/roles';
import { ROLE_CONFIG } from '@/config/roles';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { InterviewTimeline } from './InterviewTimeline';

/** Models that use reasoning tokens (need higher limits) */
const THINKING_MODELS = [
  'google/gemini-2.5-pro', 'google/gemini-3-pro-preview',
  'openai/gpt-5', 'openai/gpt-5.2', 'deepseek-reasoner',
  'gemini-2.5-pro', 'o1', 'o1-mini', 'o3-mini',
  'proxyapi/gpt-5', 'proxyapi/gpt-5.2',
];

function isThinkingModel(modelId: string): boolean {
  return THINKING_MODELS.some(m => modelId.includes(m) || m.includes(modelId));
}

/** Localized competency names */
const COMPETENCY_I18N: Record<string, { ru: string; en: string }> = {
  // archivist
  knowledge_management: { ru: 'Управление знаниями', en: 'Knowledge Management' },
  experience_distillation: { ru: 'Дистилляция опыта', en: 'Experience Distillation' },
  cataloging: { ru: 'Каталогизация', en: 'Cataloging' },
  // analyst
  pattern_recognition: { ru: 'Распознавание паттернов', en: 'Pattern Recognition' },
  specification_writing: { ru: 'Написание ТЗ', en: 'Specification Writing' },
  methodology: { ru: 'Методология', en: 'Methodology' },
  // webhunter
  query_formulation: { ru: 'Формулирование запросов', en: 'Query Formulation' },
  source_assessment: { ru: 'Оценка источников', en: 'Source Assessment' },
  // promptengineer
  optimization: { ru: 'Оптимизация', en: 'Optimization' },
  template_creation: { ru: 'Создание шаблонов', en: 'Template Creation' },
  diagnosis: { ru: 'Диагностика', en: 'Diagnosis' },
  // flowregulator
  architecture: { ru: 'Архитектура', en: 'Architecture' },
  // toolsmith
  api_design: { ru: 'Проектирование API', en: 'API Design' },
  planning: { ru: 'Планирование', en: 'Planning' },
  // guide
  onboarding: { ru: 'Онбординг', en: 'Onboarding' },
  documentation: { ru: 'Документация', en: 'Documentation' },
  // critic
  error_detection: { ru: 'Обнаружение ошибок', en: 'Error Detection' },
  prompt_review: { ru: 'Обзор промпта', en: 'Prompt Review' },
  bias_analysis: { ru: 'Анализ предвзятостей', en: 'Bias Analysis' },
  // moderator
  mediation: { ru: 'Медиация', en: 'Mediation' },
  facilitation: { ru: 'Фасилитация', en: 'Facilitation' },
  quality_assessment: { ru: 'Оценка качества', en: 'Quality Assessment' },
  // advisor
  strategic_thinking: { ru: 'Стратегическое мышление', en: 'Strategic Thinking' },
  risk_analysis: { ru: 'Анализ рисков', en: 'Risk Analysis' },
  // consultant
  domain_expertise: { ru: 'Предметная экспертиза', en: 'Domain Expertise' },
  comparative_analysis: { ru: 'Сравнительный анализ', en: 'Comparative Analysis' },
  practical_guidance: { ru: 'Практическое руководство', en: 'Practical Guidance' },
  // assistant
  deep_analysis: { ru: 'Глубокий анализ', en: 'Deep Analysis' },
  creative_problem_solving: { ru: 'Креативное решение проблем', en: 'Creative Problem Solving' },
  multi_perspective_analysis: { ru: 'Многоракурсный анализ', en: 'Multi-Perspective Analysis' },
  // arbiter
  decision_synthesis: { ru: 'Синтез решений', en: 'Decision Synthesis' },
  objective_evaluation: { ru: 'Объективная оценка', en: 'Objective Evaluation' },
  fairness_assessment: { ru: 'Оценка справедливости', en: 'Fairness Assessment' },
  // generic
  self_awareness: { ru: 'Самоанализ', en: 'Self-Awareness' },
  teamwork: { ru: 'Командная работа', en: 'Teamwork' },
};

function getCompetencyLabel(key: string, isRu: boolean): string {
  const entry = COMPETENCY_I18N[key];
  if (entry) return isRu ? entry.ru : entry.en;
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Parse pricing string like '$0.15' or '≈$0.15' to number (per 1M tokens) */
function parsePricePerMillion(priceStr: string): number {
  const cleaned = priceStr.replace(/[≈$,]/g, '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/** Calculate estimated cost from token count and model pricing */
function estimateCost(modelId: string, tokenCount: number): { input: number; output: number; total: number } | null {
  const entry = getModelRegistryEntry(modelId);
  if (!entry || typeof entry.pricing === 'string') return null;
  const inputPrice = parsePricePerMillion(entry.pricing.input);
  const outputPrice = parsePricePerMillion(entry.pricing.output);
  // Interview tokens are mostly output (model generates), estimate 10% input / 90% output
  const inputTokens = Math.round(tokenCount * 0.1);
  const outputTokens = Math.round(tokenCount * 0.9);
  const inputCost = (inputTokens / 1_000_000) * inputPrice;
  const outputCost = (outputTokens / 1_000_000) * outputPrice;
  return { input: inputCost, output: outputCost, total: inputCost + outputCost };
}

function formatCost(cost: number): string {
  if (cost < 0.001) return '<$0.001';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}

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

    const baseTokens = historicalForecast?.median || 5000; // 5k default per test (~3-5 steps)
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
    await verdictHook.runVerdict(session.id);
    // Reload session to get verdict data
    await interview.loadSession(session.id);
  }, [session, verdictHook, interview]);

  const handleApplyDecision = useCallback(async (decision: 'hire' | 'reject' | 'retest') => {
    if (!session) return;
    const retestComps = decision === 'retest'
      ? (verdictHook.verdict?.arbiter?.retest_competencies || [])
      : undefined;
    await verdictHook.applyDecision(session.id, decision, retestComps);
    await interview.loadSession(session.id);
  }, [session, verdictHook, interview]);

  const handleReload = useCallback(async () => {
    if (selectedSessionId) {
      await interview.loadSession(selectedSessionId);
    }
  }, [selectedSessionId, interview]);

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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
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
          {/* Phase Timeline */}
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
              {/* Metrics: tokens, time, cost */}
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
      {session && (session.status === 'briefed' || session.status === 'briefing' || (session.status === 'testing' && !interview.testing)) && (
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

          {sessions.length > 1 && (
            <>
              <Separator className="my-3" />
              <div className="text-xs text-muted-foreground font-medium mb-1">
                {isRu ? 'Предыдущие сессии' : 'Previous sessions'}
              </div>
              {sessions.slice(1).map(s => (
                <button
                  key={s.id}
                  className={cn(
                    "w-full text-left p-2 rounded-md text-xs transition-colors",
                    selectedSessionId === s.id ? "bg-primary/10" : "hover:bg-muted/30"
                  )}
                  onClick={() => {
                    setSelectedSessionId(s.id);
                    interview.loadSession(s.id);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                    <span className="text-muted-foreground">{s.candidate_model}</span>
                    <span className="ml-auto text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Step Card (progress view) ──

function StepCard({
  step, index, expanded, onToggle, statusIcon, isRu, modelId,
}: {
  step: InterviewTestStep;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  statusIcon: React.ReactNode;
  isRu: boolean;
  modelId?: string;
}) {
  const stepCost = modelId && step.token_count > 0 ? estimateCost(modelId, step.token_count) : null;
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-xs",
          expanded ? "bg-muted/40" : "hover:bg-muted/20",
        )}>
          {statusIcon}
          <div className="flex-1 min-w-0">
            <span className="font-medium">{getCompetencyLabel(step.competency, isRu)}</span>
            <span className="text-muted-foreground ml-2">#{index + 1}</span>
          </div>
          {step.elapsed_ms > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {(step.elapsed_ms / 1000).toFixed(1)}s
            </span>
          )}
          {step.token_count > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {step.token_count} tok
            </span>
          )}
          {stepCost && (
            <span className="text-[10px] text-amber-500 font-medium">
              {formatCost(stepCost.total)}
            </span>
          )}
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 pr-2 pb-2 space-y-2">
          {/* Task prompt */}
          <div className="text-xs">
            <span className="text-muted-foreground font-medium">{isRu ? 'Задание:' : 'Task:'}</span>
            <p className="mt-0.5 text-foreground/80">{step.task_prompt}</p>
          </div>

          {/* Candidate output */}
          {step.candidate_output?.proposed_value && (
            <div className="text-xs">
              <span className="text-muted-foreground font-medium">{isRu ? 'Ответ кандидата:' : 'Candidate output:'}</span>
              <div className="mt-1 p-2 rounded-md bg-muted/30 border border-border max-h-48 overflow-y-auto">
                <MarkdownRenderer content={step.candidate_output.proposed_value} className="text-xs" />
              </div>
            </div>
          )}

          {/* Error */}
          {step.error && (
            <div className="text-xs text-hydra-critical bg-hydra-critical/5 p-2 rounded">
              {step.error}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Side-by-Side Card (results comparison view) ──

function SideBySideCard({
  step, index, isRu, modelId,
}: {
  step: InterviewTestStep;
  index: number;
  isRu: boolean;
  modelId?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasBaseline = !!step.baseline?.current_value;
  const hasCandidate = !!step.candidate_output?.proposed_value;
  const stepCost = modelId && step.token_count > 0 ? estimateCost(modelId, step.token_count) : null;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/20 transition-colors text-xs">
          <Columns2 className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium flex-1">{getCompetencyLabel(step.competency, isRu)}</span>
          <Badge variant="outline" className="text-[10px]">#{index + 1}</Badge>
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-2 pb-3 space-y-2">
          {/* Task */}
          <p className="text-[11px] text-muted-foreground italic">{step.task_prompt}</p>

          {/* Side-by-side */}
          <div className={cn("grid gap-2", hasBaseline ? "grid-cols-2" : "grid-cols-1")}>
            {/* Baseline */}
            {hasBaseline && (
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {isRu ? 'Текущее (Baseline)' : 'Current (Baseline)'}
                </div>
                <div className="p-2 rounded-md bg-muted/20 border border-border max-h-64 overflow-y-auto">
                  <MarkdownRenderer content={step.baseline!.current_value} className="text-xs" />
                </div>
              </div>
            )}

            {/* Candidate */}
            {hasCandidate && (
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-primary uppercase tracking-wider">
                  {isRu ? 'Кандидат' : 'Candidate'}
                </div>
                <div className="p-2 rounded-md bg-primary/5 border border-primary/20 max-h-64 overflow-y-auto">
                  <MarkdownRenderer content={step.candidate_output!.proposed_value} className="text-xs" />
                </div>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {step.elapsed_ms > 0 && <span>⏱ {(step.elapsed_ms / 1000).toFixed(1)}s</span>}
            {step.token_count > 0 && <span>🪙 {step.token_count} tok</span>}
            {stepCost && <span className="text-amber-500 font-medium">💰 {formatCost(stepCost.total)}</span>}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Verdict Section ──

function VerdictSection({
  session, verdict, phases, isRu, onDecision,
}: {
  session: InterviewSession | null;
  verdict: InterviewVerdict | null;
  phases: Array<{ phase: string; status: string }>;
  isRu: boolean;
  onDecision: (d: 'hire' | 'reject' | 'retest') => void;
}) {
  if (!verdict && phases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {isRu ? 'Вердикт ещё не вынесен' : 'No verdict yet'}
      </p>
    );
  }

  // Show phases progress while running
  if (!verdict && phases.length > 0) {
    return (
      <div className="space-y-2">
        {phases.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/20">
            {p.status === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <CheckCircle2 className="h-3.5 w-3.5 text-hydra-success" />}
            <span className="capitalize">{p.phase}</span>
          </div>
        ))}
      </div>
    );
  }

  if (!verdict) return null;

  const decisionColors: Record<string, string> = {
    hire: 'text-hydra-success',
    reject: 'text-hydra-critical',
    retest: 'text-primary',
  };
  const decisionLabels: Record<string, { ru: string; en: string }> = {
    hire: { ru: 'Нанять', en: 'Hire' },
    reject: { ru: 'Отклонить', en: 'Reject' },
    retest: { ru: 'Перетестировать', en: 'Retest' },
  };

  const scores = verdict.arbiter?.scores || {};
  const avgScore = Object.values(scores).length > 0
    ? (Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length).toFixed(1)
    : '0';

  return (
    <div className="space-y-3">
      {/* Auto decision */}
      <div className="p-3 rounded-md border border-border bg-muted/10">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">{isRu ? 'Авто-решение' : 'Auto Decision'}</span>
          <Badge className={cn("text-[10px] ml-auto", decisionColors[verdict.auto_decision])}>
            {decisionLabels[verdict.auto_decision]?.[isRu ? 'ru' : 'en'] || verdict.auto_decision}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">{verdict.decision_reason}</p>
        {verdict.thresholds && (
          <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
            <span>📊 {isRu ? 'Балл' : 'Score'}: {avgScore}/10</span>
            {verdict.thresholds.current_holder && (
              <span>👤 {isRu ? 'Текущий' : 'Current'}: {verdict.thresholds.current_holder.score}</span>
            )}
            {verdict.thresholds.previous_avg !== null && (
              <span>📈 {isRu ? 'Ср. пред.' : 'Prev avg'}: {verdict.thresholds.previous_avg.toFixed(1)}</span>
            )}
          </div>
        )}
      </div>

      {/* Arbiter scores */}
      <div className="space-y-1">
        <div className="text-xs font-medium">{isRu ? 'Оценки арбитра' : 'Arbiter Scores'}</div>
        {Object.entries(scores).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="flex-1 text-muted-foreground capitalize">{getCompetencyLabel(key, isRu)}</span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${(val / 10) * 100}%` }} />
            </div>
            <span className="w-6 text-right font-mono text-[10px]">{val}</span>
          </div>
        ))}
      </div>

      {/* Red flags */}
      {verdict.arbiter?.red_flags?.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs font-medium text-hydra-critical">
            <AlertTriangle className="h-3 w-3" />
            {isRu ? 'Красные флаги' : 'Red Flags'}
          </div>
          {verdict.arbiter.red_flags.map((f, i) => (
            <p key={i} className="text-[11px] text-muted-foreground pl-4">• {f}</p>
          ))}
        </div>
      )}

      {/* Moderator summary */}
      {verdict.moderator_summary && (
        <div className="p-2 rounded-md bg-muted/20 border border-border">
          <div className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
            {isRu ? 'Резюме модератора' : 'Moderator Summary'}
          </div>
          <MarkdownRenderer content={verdict.moderator_summary} className="text-xs" />
        </div>
      )}

      {/* User decision buttons */}
      {!verdict.final_decision && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-medium">{isRu ? 'Ваше решение' : 'Your Decision'}</div>
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="outline" className="gap-1 text-hydra-success border-hydra-success/30 hover:bg-hydra-success/10" onClick={() => onDecision('hire')}>
              <UserCheck className="h-3.5 w-3.5" />
              {isRu ? 'Нанять' : 'Hire'}
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-hydra-critical border-hydra-critical/30 hover:bg-hydra-critical/10" onClick={() => onDecision('reject')}>
              <UserX className="h-3.5 w-3.5" />
              {isRu ? 'Отказ' : 'Reject'}
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-primary border-primary/30 hover:bg-primary/10" onClick={() => onDecision('retest')}>
              <RotateCcw className="h-3.5 w-3.5" />
              {isRu ? 'Ретест' : 'Retest'}
            </Button>
          </div>
        </div>
      )}

      {/* Final decision badge */}
      {verdict.final_decision && (
        <div className="p-2 rounded-md border border-border bg-muted/10 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-hydra-success" />
          <span className="text-xs font-medium">
            {isRu ? 'Решение' : 'Decision'}: {decisionLabels[verdict.final_decision]?.[isRu ? 'ru' : 'en']}
          </span>
          {verdict.decided_at && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {new Date(verdict.decided_at).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
