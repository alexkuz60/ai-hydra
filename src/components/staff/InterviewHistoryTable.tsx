import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { estimateCost, formatCost } from './interviewUtils';
import type { InterviewSession } from '@/types/interview';

// ── Constants ──

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-hydra-success',
  tested: 'text-primary',
  verdict: 'text-primary',
  briefed: 'text-muted-foreground',
  briefing: 'text-muted-foreground',
  testing: 'text-primary',
};

const DECISION_BADGE: Record<string, { label: { ru: string; en: string }; className: string }> = {
  hire: { label: { ru: 'Нанят', en: 'Hired' }, className: 'bg-hydra-success/15 text-hydra-success border-hydra-success/30' },
  reject: { label: { ru: 'Отказ', en: 'Rejected' }, className: 'bg-hydra-critical/15 text-hydra-critical border-hydra-critical/30' },
  retest: { label: { ru: 'Ретест', en: 'Retest' }, className: 'bg-primary/15 text-primary border-primary/30' },
};

const SUPERSEDED_BADGE = {
  label: { ru: 'Замещён', en: 'Superseded' },
  className: 'bg-muted/30 text-muted-foreground border-border',
};

// ── Component ──

interface SessionHistoryTableProps {
  sessions: InterviewSession[];
  selectedSessionId: string | null;
  currentSessionId?: string;
  onSelect: (id: string) => void;
  isRu: boolean;
}

export function SessionHistoryTable({
  sessions,
  selectedSessionId,
  currentSessionId,
  onSelect,
  isRu,
}: SessionHistoryTableProps) {
  if (sessions.length === 0) return null;

  // Find the latest "hire" session to mark older hires as "superseded"
  const hiredSessions = sessions
    .map(s => {
      const v = s.verdict as Record<string, any> | null;
      const dec = v?.final_decision;
      const decidedAt = v?.decided_at ? new Date(v.decided_at).getTime() : 0;
      return { id: s.id, decision: dec, decidedAt };
    })
    .filter(h => h.decision === 'hire')
    .sort((a, b) => b.decidedAt - a.decidedAt);

  const latestHireId = hiredSessions.length > 0 ? hiredSessions[0].id : null;
  const isViewingOld = currentSessionId && selectedSessionId !== currentSessionId;

  return (
    <>
      <Separator className="my-3" />
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground font-medium">
          {isRu ? 'История собеседований' : 'Interview History'}
        </div>
        {isViewingOld && currentSessionId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[10px] px-2 text-primary"
            onClick={() => onSelect(currentSessionId)}
          >
            ← {isRu ? 'К текущему' : 'Back to current'}
          </Button>
        )}
      </div>
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[10px] py-1.5 px-2 h-auto">{isRu ? 'Модель' : 'Model'}</TableHead>
              <TableHead className="text-[10px] py-1.5 px-2 h-auto text-right">{isRu ? 'Токены' : 'Tokens'}</TableHead>
              <TableHead className="text-[10px] py-1.5 px-2 h-auto text-right">{isRu ? 'Время' : 'Time'}</TableHead>
              <TableHead className="text-[10px] py-1.5 px-2 h-auto text-right">{isRu ? 'Цена' : 'Cost'}</TableHead>
              <TableHead className="text-[10px] py-1.5 px-2 h-auto text-center">{isRu ? 'Балл' : 'Score'}</TableHead>
              <TableHead className="text-[10px] py-1.5 px-2 h-auto text-center">{isRu ? 'Решение' : 'Decision'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map(s => {
              const isSelected = selectedSessionId === s.id;
              const config = s.config as Record<string, any> | null;
              const tokens = config?.actual_tokens_used ?? 0;
              const elapsed = config?.actual_elapsed_ms ?? 0;
              const cost = tokens > 0 ? estimateCost(s.candidate_model, tokens) : null;

              const verdict = s.verdict as Record<string, any> | null;
              const decision = verdict?.final_decision || verdict?.arbiter?.recommendation;

              let decBadge: { label: { ru: string; en: string }; className: string } | null = null;
              if (decision === 'hire' && s.id !== latestHireId) {
                decBadge = SUPERSEDED_BADGE;
              } else if (decision) {
                decBadge = DECISION_BADGE[decision] || null;
              }

              const scores = verdict?.arbiter?.scores as Record<string, number> | undefined;
              const avgScore = scores
                ? (Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length).toFixed(1)
                : null;

              const decidedAt = verdict?.decided_at;
              const dateStr = decidedAt
                ? new Date(decidedAt).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : new Date(s.created_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });

              const modelShort = s.candidate_model.replace(/^proxyapi\//, '').replace(/^google\//, '').replace(/^openai\//, '');

              return (
                <TableRow
                  key={s.id}
                  className={cn(
                    "cursor-pointer transition-colors text-[11px]",
                    isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/20",
                    s.id === currentSessionId && "border-l-2 border-l-primary",
                  )}
                  onClick={() => onSelect(s.id)}
                >
                  <TableCell className="py-1.5 px-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[10px] truncate max-w-[120px]" title={s.candidate_model}>
                        {modelShort}
                      </span>
                      <span className={cn("text-[9px]", STATUS_COLORS[s.status] || 'text-muted-foreground')}>
                        {s.status} • {dateStr}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-right text-[10px] text-muted-foreground font-mono">
                    {tokens > 0 ? tokens.toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-right text-[10px] text-muted-foreground font-mono">
                    {elapsed > 0 ? `${(elapsed / 1000).toFixed(0)}s` : '—'}
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-right text-[10px] font-mono">
                    {cost ? (
                      <span className="text-amber-500">{formatCost(cost.total)}</span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-center">
                    {avgScore ? (
                      <span className="text-[10px] font-mono font-medium">{avgScore}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-center">
                    {decBadge ? (
                      <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5", decBadge.className)}>
                        {decBadge.label[isRu ? 'ru' : 'en']}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
