import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInterviewSession, type InterviewSession, type InterviewTestStep } from '@/hooks/useInterviewSession';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { cn } from '@/lib/utils';
import {
  X, Play, Loader2, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronRight, FileText, Columns2,
  SquareArrowOutUpRight, RefreshCw,
} from 'lucide-react';
import type { AgentRole } from '@/config/roles';
import { ROLE_CONFIG } from '@/config/roles';

interface InterviewPanelProps {
  role: AgentRole;
  onClose: () => void;
}

type ViewMode = 'progress' | 'results';

export function InterviewPanel({ role, onClose }: InterviewPanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const interview = useInterviewSession();

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('progress');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Load existing sessions for this role
  useEffect(() => {
    interview.listSessions().then(all => {
      const roleSessions = all.filter(s => s.role === role);
      setSessions(roleSessions);
      if (roleSessions.length > 0 && !selectedSessionId) {
        // Auto-select the latest
        setSelectedSessionId(roleSessions[0].id);
        interview.loadSession(roleSessions[0].id);
      }
    });
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  const session = interview.session;
  const testResults = session?.test_results;
  const steps = testResults?.steps ?? [];

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const totalCount = testResults?.total_steps ?? steps.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
    await interview.runTests(session.id);
  }, [session, interview]);

  const handleReload = useCallback(async () => {
    if (selectedSessionId) {
      await interview.loadSession(selectedSessionId);
    }
  }, [selectedSessionId, interview]);

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
            {isRu ? 'Собеседование' : 'Interview'}: {isRu ? config.label.replace('roles.', '') : role}
          </h3>
          {session && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {session.id.slice(0, 8)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* View mode toggle */}
          {steps.length > 0 && (
            <div className="flex border border-border rounded-md overflow-hidden">
              <button
                className={cn(
                  "px-2 py-1 text-xs transition-colors",
                  viewMode === 'progress' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                )}
                onClick={() => setViewMode('progress')}
              >
                <FileText className="h-3.5 w-3.5" />
              </button>
              <button
                className={cn(
                  "px-2 py-1 text-xs transition-colors",
                  viewMode === 'results' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                )}
                onClick={() => setViewMode('results')}
              >
                <Columns2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReload} disabled={interview.loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", interview.loading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Session status bar */}
      {session && (
        <div className="px-3 py-2 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2 text-xs">
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
          {(interview.testing || steps.length > 0) && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{completedCount}/{totalCount} {isRu ? 'шагов' : 'steps'}</span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-1.5" />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {session && session.status === 'briefed' && !interview.testing && (
        <div className="p-3 border-b border-border shrink-0">
          <Button size="sm" className="w-full gap-2" onClick={handleRunTests}>
            <Play className="h-3.5 w-3.5" />
            {isRu ? 'Запустить тесты' : 'Run Tests'}
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
            />
          ))}

          {/* Side-by-side results view */}
          {viewMode === 'results' && steps.filter(s => s.status === 'completed').map((step, idx) => (
            <SideBySideCard key={idx} step={step} index={idx} isRu={isRu} />
          ))}

          {/* Session history */}
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
  step, index, expanded, onToggle, statusIcon, isRu,
}: {
  step: InterviewTestStep;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  statusIcon: React.ReactNode;
  isRu: boolean;
}) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-xs",
          expanded ? "bg-muted/40" : "hover:bg-muted/20",
        )}>
          {statusIcon}
          <div className="flex-1 min-w-0">
            <span className="font-medium">{step.competency}</span>
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
  step, index, isRu,
}: {
  step: InterviewTestStep;
  index: number;
  isRu: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasBaseline = !!step.baseline?.current_value;
  const hasCandidate = !!step.candidate_output?.proposed_value;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/20 transition-colors text-xs">
          <Columns2 className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium flex-1">{step.competency}</span>
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
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
