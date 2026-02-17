import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScreeningSession, type ScreeningCandidate } from '@/hooks/useScreeningSession';
import { useInterviewVerdict, type InterviewVerdict } from '@/hooks/useInterviewVerdict';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Play, Loader2, CheckCircle2, XCircle, Clock,
  UserCheck, AlertTriangle,
} from 'lucide-react';
import { ModelNameWithIcon } from '@/components/ui/ModelNameWithIcon';
import { StepCard } from '@/components/staff/InterviewStepCards';
import { estimateCost, formatCost } from '@/components/staff/interviewUtils';

interface ScreeningPanelProps {
  role: string;
  selectedWinners: Set<string>;
  sourceContestId?: string;
}

export function ScreeningPanel({ role, selectedWinners, sourceContestId }: ScreeningPanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const screening = useScreeningSession();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

  // Init candidates when winners change
  useEffect(() => {
    const models = Array.from(selectedWinners);
    if (models.length > 0) {
      screening.initCandidates(models);
    }
  }, [selectedWinners]); // eslint-disable-line react-hooks/exhaustive-deps

  const winnersArray = useMemo(() => Array.from(selectedWinners), [selectedWinners]);

  const completedCount = screening.candidates.filter(c => c.status === 'tested' || c.status === 'completed').length;
  const failedCount = screening.candidates.filter(c => c.status === 'failed').length;
  const totalCount = screening.candidates.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleRunBatch = useCallback(() => {
    screening.runBatch(role, sourceContestId);
  }, [screening, role, sourceContestId]);

  const handleViewCandidate = useCallback((index: number) => {
    setSelectedCandidate(index);
    const candidate = screening.candidates[index];
    if (candidate?.sessionId) {
      screening.loadCandidateSession(candidate.sessionId);
    }
  }, [screening]);

  const getStatusIcon = (status: ScreeningCandidate['status']) => {
    switch (status) {
      case 'tested':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-hydra-success" />;
      case 'briefing':
      case 'testing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-hydra-critical" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: ScreeningCandidate['status']) => {
    const labels: Record<string, { ru: string; en: string }> = {
      pending: { ru: 'Ожидание', en: 'Pending' },
      briefing: { ru: 'Брифинг...', en: 'Briefing...' },
      testing: { ru: 'Тестирование...', en: 'Testing...' },
      tested: { ru: 'Протестирован', en: 'Tested' },
      completed: { ru: 'Завершён', en: 'Completed' },
      failed: { ru: 'Ошибка', en: 'Failed' },
      verdict: { ru: 'Вердикт', en: 'Verdict' },
    };
    return isRu ? labels[status]?.ru || status : labels[status]?.en || status;
  };

  // Session detail view
  const session = screening.session;
  const steps = session?.test_results?.steps ?? [];

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
                ? `${totalCount} кандидат${totalCount > 1 ? 'ов' : ''} · Роль: ${role}`
                : `${totalCount} candidate${totalCount > 1 ? 's' : ''} · Role: ${role}`}
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

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {/* Candidate list */}
          {screening.candidates.map((candidate, idx) => (
            <button
              key={candidate.modelId}
              onClick={() => handleViewCandidate(idx)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                selectedCandidate === idx
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:bg-muted/30",
                screening.running && screening.currentIndex === idx && "ring-1 ring-primary/30"
              )}
            >
              {getStatusIcon(candidate.status)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  <ModelNameWithIcon modelName={candidate.modelId} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {getStatusLabel(candidate.status)}
                  {candidate.error && (
                    <span className="text-hydra-critical ml-1">— {candidate.error}</span>
                  )}
                </div>
              </div>
              {candidate.sessionId && (
                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                  {candidate.sessionId.slice(0, 6)}
                </Badge>
              )}
            </button>
          ))}

          {/* Selected candidate detail */}
          {selectedCandidate !== null && session && steps.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <h3 className="text-sm font-medium">
                {isRu ? 'Результаты тестов' : 'Test Results'}
              </h3>
              {steps.map((step, idx) => (
                <StepCard
                  key={idx}
                  step={step}
                  index={idx}
                  expanded={false}
                  onToggle={() => {}}
                  statusIcon={
                    step.status === 'completed'
                      ? <CheckCircle2 className="h-4 w-4 text-hydra-success" />
                      : step.status === 'failed'
                        ? <XCircle className="h-4 w-4 text-hydra-critical" />
                        : <Clock className="h-4 w-4 text-muted-foreground" />
                  }
                  isRu={isRu}
                  modelId={session.candidate_model}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
