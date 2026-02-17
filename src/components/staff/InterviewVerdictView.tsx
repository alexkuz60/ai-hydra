import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { cn } from '@/lib/utils';
import {
  Loader2, CheckCircle2, AlertTriangle, Shield,
  UserCheck, UserX, RotateCcw,
} from 'lucide-react';
import { getCompetencyLabel } from './interviewUtils';
import type { InterviewVerdict } from '@/hooks/useInterviewVerdict';
import type { InterviewSession } from '@/types/interview';

interface VerdictSectionProps {
  session: InterviewSession | null;
  verdict: InterviewVerdict | null;
  phases: Array<{ phase: string; status: string }>;
  isRu: boolean;
  onDecision: (d: 'hire' | 'reject' | 'retest') => void;
}

export function VerdictSection({ session, verdict, phases, isRu, onDecision }: VerdictSectionProps) {
  const isPodium = !!session?.source_contest_id;
  if (!verdict && phases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {isRu ? 'Вердикт ещё не вынесен' : 'No verdict yet'}
      </p>
    );
  }

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
          {isPodium ? (
            <div className="grid grid-cols-1 gap-2">
              <Button size="sm" variant="outline" className="gap-1 text-hydra-critical border-hydra-critical/30 hover:bg-hydra-critical/10" onClick={() => onDecision('reject')}>
                <UserX className="h-3.5 w-3.5" />
                {isRu ? 'Отклонить результаты' : 'Reject Results'}
              </Button>
            </div>
          ) : (
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
          )}
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
