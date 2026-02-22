import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { estimateCost, formatCost } from './interviewUtils';
import { getProviderFromModelId } from '@/components/ui/ModelNameWithIcon';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { s } from './i18n';
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

const ROUTER_LABELS: Record<string, { short: string; full: string }> = {
  proxyapi: { short: 'Proxy', full: 'ProxyAPI' },
  lovable: { short: 'Lovable', full: 'Lovable AI' },
  openrouter: { short: 'OR', full: 'OpenRouter' },
  direct: { short: 'Direct', full: 'Direct API' },
};

/** Detect which router/gateway a model goes through based on its ID prefix */
function getRouterFromModelId(modelId: string): string {
  const lower = modelId.toLowerCase();
  if (lower.startsWith('proxyapi/')) return 'proxyapi';
  if (lower.startsWith('google/') || lower.startsWith('openai/')) return 'lovable';
  if (lower.includes(':free')) return 'openrouter';
  return 'direct';
}

// ── Helpers ──

function groupByProvider(sessions: InterviewSession[]) {
  const groups: Record<string, InterviewSession[]> = {};
  for (const sess of sessions) {
    const provider = getProviderFromModelId(sess.candidate_model) || 'other';
    if (!groups[provider]) groups[provider] = [];
    groups[provider].push(sess);
  }
  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
}

// ── Component ──

interface SessionHistoryTableProps {
  sessions: InterviewSession[];
  selectedSessionId: string | null;
  currentSessionId?: string;
  onSelect: (id: string) => void;
  onDeleted?: () => void;
  isRu: boolean;
}

export function SessionHistoryTable({
  sessions, selectedSessionId, currentSessionId, onSelect, onDeleted, isRu,
}: SessionHistoryTableProps) {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleting) return;
    if (!window.confirm(s('confirmDeleteSession', isRu))) return;
    setDeleting(sessionId);
    try {
      const { error } = await supabase.from('interview_sessions').delete().eq('id', sessionId);
      if (error) throw error;
      toast({ description: s('sessionDeleted', isRu) });
      onDeleted?.();
    } catch (err: any) {
      toast({ variant: 'destructive', description: err.message });
    } finally {
      setDeleting(null);
    }
  };

  if (sessions.length === 0) return null;

  const groups = groupByProvider(sessions);

  const toggleGroup = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const hiredSessions = sessions
    .map(sess => {
      const v = sess.verdict as Record<string, any> | null;
      const dec = v?.final_decision;
      const decidedAt = v?.decided_at ? new Date(v.decided_at).getTime() : 0;
      return { id: sess.id, decision: dec, decidedAt };
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
          {s('interviewHistory', isRu)}
        </div>
        {isViewingOld && currentSessionId && (
          <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2 text-primary" onClick={() => onSelect(currentSessionId)}>
            ← {s('backToCurrent', isRu)}
          </Button>
        )}
      </div>
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[10px] py-1.5 px-2 h-auto">{s('thModel', isRu)}</TableHead>
              <TableHead className="text-[10px] py-1.5 px-2 h-auto">{s('thRouter', isRu)}</TableHead>
              <TableHead className="text-[10px] py-1.5 px-2 h-auto text-right">{s('thTokens', isRu)}</TableHead>
              <TableHead className="text-[10px] py-1.5 px-2 h-auto text-right">{s('thTime', isRu)}</TableHead>
              <TableHead className="text-[10px] py-1.5 px-2 h-auto text-right">{s('thCost', isRu)}</TableHead>
              <TableHead className="text-[10px] py-1.5 px-2 h-auto text-center">{s('thScore', isRu)}</TableHead>
              <TableHead className="text-[10px] py-1.5 px-2 h-auto text-center">{s('thDecision', isRu)}</TableHead>
              <TableHead className="text-[10px] py-1.5 px-1 h-auto w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map(([providerKey, groupSessions]) => {
              const isCollapsed = collapsed.has(providerKey);
              const Logo = PROVIDER_LOGOS[providerKey];
              const color = PROVIDER_COLORS[providerKey] || 'text-muted-foreground';
              const BRAND_LABELS: Record<string, string> = {
                gemini: 'Google Gemini', openai: 'OpenAI', anthropic: 'Anthropic',
                xai: 'xAI', deepseek: 'DeepSeek', mistral: 'Mistral', groq: 'Groq', openrouter: 'OpenRouter',
              };
              const label = BRAND_LABELS[providerKey] || providerKey;

              return (
                <React.Fragment key={providerKey}>
                  <TableRow className="bg-muted/20 hover:bg-muted/30 cursor-pointer border-b-0" onClick={() => toggleGroup(providerKey)}>
                    <TableCell colSpan={8} className="py-1.5 px-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                        {isCollapsed ? <ChevronRight className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />}
                        {Logo && <Logo className={cn("h-3 w-3 shrink-0", color)} />}
                        <span>{label}</span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1 ml-1 font-mono">{groupSessions.length}</Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  {!isCollapsed && groupSessions.map(sess => (
                    <SessionRow
                      key={sess.id}
                      s={sess}
                      isSelected={selectedSessionId === sess.id}
                      isCurrent={sess.id === currentSessionId}
                      latestHireId={latestHireId}
                      isRu={isRu}
                      onSelect={onSelect}
                      onDelete={handleDelete}
                      deleting={deleting}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

// ── Session Row ──

function SessionRow({
  s: sess, isSelected, isCurrent, latestHireId, isRu, onSelect, onDelete, deleting,
}: {
  s: InterviewSession;
  isSelected: boolean;
  isCurrent: boolean;
  latestHireId: string | null;
  isRu: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  deleting: string | null;
}) {
  const config = sess.config as Record<string, any> | null;
  const tokens = config?.actual_tokens_used ?? 0;
  const elapsed = config?.actual_elapsed_ms ?? 0;
  const cost = tokens > 0 ? estimateCost(sess.candidate_model, tokens) : null;

  const verdict = sess.verdict as Record<string, any> | null;
  const decision = verdict?.final_decision || verdict?.arbiter?.recommendation;

  let decBadge: { label: { ru: string; en: string }; className: string } | null = null;
  if (decision === 'hire' && sess.id !== latestHireId) {
    decBadge = SUPERSEDED_BADGE;
  } else if (decision) {
    decBadge = DECISION_BADGE[decision] || null;
  }

  const scores = verdict?.arbiter?.scores as Record<string, number> | undefined;
  const avgScore = scores
    ? (Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length).toFixed(1)
    : null;

  const locale = isRu ? 'ru-RU' : 'en-US';
  const decidedAt = verdict?.decided_at;
  const dateStr = decidedAt
    ? new Date(decidedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : new Date(sess.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  const modelShort = sess.candidate_model.replace(/^proxyapi\//, '').replace(/^google\//, '').replace(/^openai\//, '');
  const routerKey = getRouterFromModelId(sess.candidate_model);
  const routerInfo = ROUTER_LABELS[routerKey];
  const brandKey = getProviderFromModelId(sess.candidate_model);
  const iconKey = routerKey === 'direct' && brandKey ? brandKey : routerKey;
  const CellLogo = PROVIDER_LOGOS[iconKey];
  const cellColor = PROVIDER_COLORS[iconKey] || 'text-muted-foreground';

  return (
    <TableRow
      className={cn(
        "cursor-pointer transition-colors text-[11px]",
        isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/20",
        isCurrent && "border-l-2 border-l-primary",
      )}
      onClick={() => onSelect(sess.id)}
    >
      <TableCell className="py-1.5 px-2 pl-5">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] truncate max-w-[120px]" title={sess.candidate_model}>{modelShort}</span>
          <span className={cn("text-[9px]", STATUS_COLORS[sess.status] || 'text-muted-foreground')}>{sess.status} • {dateStr}</span>
        </div>
      </TableCell>
      <TableCell className="py-1.5 px-2">
        <div className="flex items-center gap-1" title={routerInfo?.full}>
          {CellLogo && <CellLogo className={cn("h-3 w-3 shrink-0", cellColor)} />}
          <span className="text-[10px] text-muted-foreground">{routerInfo?.short || '—'}</span>
        </div>
      </TableCell>
      <TableCell className="py-1.5 px-2 text-right text-[10px] text-muted-foreground font-mono">
        {tokens > 0 ? tokens.toLocaleString() : '—'}
      </TableCell>
      <TableCell className="py-1.5 px-2 text-right text-[10px] text-muted-foreground font-mono">
        {elapsed > 0 ? `${(elapsed / 1000).toFixed(0)}s` : '—'}
      </TableCell>
      <TableCell className="py-1.5 px-2 text-right text-[10px] font-mono">
        {cost ? <span className="text-amber-500">{formatCost(cost.total)}</span> : '—'}
      </TableCell>
      <TableCell className="py-1.5 px-2 text-center">
        {avgScore ? <span className="text-[10px] font-mono font-medium">{avgScore}</span> : <span className="text-[10px] text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="py-1.5 px-2 text-center">
        {decBadge ? (
          <Badge variant="outline" className={cn("text-[9px] py-0 px-1.5", decBadge.className)}>
            {decBadge.label[isRu ? 'ru' : 'en']}
          </Badge>
        ) : <span className="text-[10px] text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="py-1.5 px-1 text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-destructive"
          onClick={(e) => onDelete(sess.id, e)}
          disabled={deleting === sess.id}
          title={s('deleteSession', isRu)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
