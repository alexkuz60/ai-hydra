import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScreeningSession, type ScreeningCandidate } from '@/hooks/useScreeningSession';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Play, Loader2, CheckCircle2, XCircle, Clock,
  UserCheck,
} from 'lucide-react';
import { ModelNameWithIcon } from '@/components/ui/ModelNameWithIcon';
import { StepCard } from '@/components/staff/InterviewStepCards';

interface ScreeningPanelProps {
  role: string;
  selectedWinners: Set<string>;
  sourceContestId?: string;
}

export function ScreeningPanel({ role, selectedWinners, sourceContestId }: ScreeningPanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const screening = useScreeningSession();
  const [activeTab, setActiveTab] = useState<string>('');

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

  // Load session detail when switching tabs to a tested candidate
  const handleTabChange = useCallback((modelId: string) => {
    setActiveTab(modelId);
    const candidate = screening.candidates.find(c => c.modelId === modelId);
    if (candidate?.sessionId) {
      screening.loadCandidateSession(candidate.sessionId);
    }
  }, [screening]);

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

  // Detail view data
  const session = screening.session;
  const steps = (session?.test_results as any)?.steps ?? [];
  const activeCandidate = screening.candidates.find(c => c.modelId === activeTab);

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
            // Short model label: take last segment
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
            className="flex-1 m-0 min-h-0"
          >
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Candidate header */}
                <div className="flex items-center gap-3">
                  {getStatusIcon(candidate.status)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      <ModelNameWithIcon modelName={candidate.modelId} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>{getStatusLabel(candidate.status)}</span>
                      {candidate.sessionId && (
                        <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 h-4">
                          {candidate.sessionId.slice(0, 8)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Testing progress */}
                {candidate.status === 'testing' && candidate.totalSteps && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{isRu ? 'Прогресс тестов' : 'Test progress'}</span>
                      <span>{candidate.completedSteps ?? 0}/{candidate.totalSteps}</span>
                    </div>
                    <Progress
                      value={candidate.totalSteps > 0
                        ? Math.round(((candidate.completedSteps ?? 0) / candidate.totalSteps) * 100)
                        : 0}
                      className="h-1"
                    />
                  </div>
                )}

                {/* Briefing state */}
                {candidate.status === 'briefing' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isRu ? 'Сбор брифинга...' : 'Assembling briefing...'}
                  </div>
                )}

                {/* Pending state */}
                {candidate.status === 'pending' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                    <Clock className="h-4 w-4" />
                    {isRu ? 'В очереди' : 'Queued'}
                  </div>
                )}

                {/* Error state */}
                {candidate.status === 'failed' && candidate.error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {candidate.error}
                  </div>
                )}

                {/* Test results — show when viewing completed candidate */}
                {(candidate.status === 'tested' || candidate.status === 'completed') &&
                  activeCandidate?.modelId === candidate.modelId &&
                  session?.candidate_model === candidate.modelId &&
                  steps.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                      {isRu ? 'Результаты тестов' : 'Test Results'}
                    </h3>
                    {steps.map((step: any, idx: number) => (
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
                        modelId={candidate.modelId}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
