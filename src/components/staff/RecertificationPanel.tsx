import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useKnowledgeVersioning, type KnowledgeSnapshot } from '@/hooks/useKnowledgeVersioning';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { useInterviewVerdict, type InterviewVerdict } from '@/hooks/useInterviewVerdict';
import { useHiredTechnoArbiter } from '@/hooks/useHiredTechnoArbiter';
import { useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  X, Play, Loader2, CheckCircle2, XCircle, Clock,
  RefreshCw, Gavel, FileText, Database, Zap,
} from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AgentRole } from '@/config/roles';
import { ROLE_CONFIG } from '@/config/roles';
import { cn } from '@/lib/utils';
import { estimateCost, formatCost } from './interviewUtils';
import { VerdictSection } from './InterviewVerdictView';
import { s } from './i18n';

interface RecertificationPanelProps {
  role: AgentRole;
  onClose: () => void;
}

export function RecertificationPanel({ role, onClose }: RecertificationPanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const queryClient = useQueryClient();
  const interview = useInterviewSession();
  const verdictHook = useInterviewVerdict();
  const { effectiveArbiter } = useHiredTechnoArbiter();
  const { hasChanged, current, snapshot, changeSummary } = useKnowledgeVersioning(role);

  const [phase, setPhase] = useState<'overview' | 'briefing' | 'testing' | 'verdict'>('overview');

  const config = ROLE_CONFIG[role];
  const IconComponent = config.icon;
  const session = interview.session;
  const steps = session?.test_results?.steps ?? [];

  const [assignedModel, setAssignedModel] = useState<string>('');
  useEffect(() => {
    const cached = queryClient.getQueryData<Record<string, { model_id: string }>>(['role-assignments-active']);
    if (cached?.[role]) setAssignedModel(cached[role].model_id);
  }, [role, queryClient]);

  const delta = useMemo(() => {
    if (!snapshot) return null;
    return {
      snapshotted_at: snapshot.snapshotted_at,
      knowledge_diff: (current?.knowledge_count ?? 0) - snapshot.knowledge_count,
      prompts_diff: (current?.prompts_count ?? 0) - snapshot.prompts_count,
    };
  }, [snapshot, current]);

  const handleStartRecertDelta = useCallback(async () => {
    if (!assignedModel || !snapshot) return;
    setPhase('briefing');
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const authToken = authSession?.access_token;
      const response = await fetch(`${supabaseUrl}/functions/v1/interview-briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken || supabaseKey}`, 'apikey': supabaseKey },
        body: JSON.stringify({
          role, candidate_model: assignedModel, session_type: 'recert',
          delta: {
            snapshotted_at: snapshot.snapshotted_at,
            knowledge_diff: (current?.knowledge_count ?? 0) - snapshot.knowledge_count,
            prompts_diff: (current?.prompts_count ?? 0) - snapshot.prompts_count,
          },
        }),
      });
      if (!response.ok) { const err = await response.text(); throw new Error(`${response.status}: ${err}`); }
      const data = await response.json();
      await interview.loadSession(data.session_id);
      setPhase('testing');
    } catch (err: any) {
      console.error('[RecertificationPanel] Briefing error:', err);
      setPhase('overview');
    }
  }, [assignedModel, snapshot, current, role, interview]);

  const handleRunTests = useCallback(async () => { if (!session) return; setPhase('testing'); await interview.runTests(session.id); }, [session, interview]);

  const handleRunVerdict = useCallback(async () => {
    if (!session) return; setPhase('verdict');
    await verdictHook.runVerdict(session.id, effectiveArbiter);
    await interview.loadSession(session.id);
  }, [session, verdictHook, interview, effectiveArbiter]);

  const handleApplyDecision = useCallback(async (decision: 'hire' | 'reject' | 'retest') => {
    if (!session) return;
    const retestComps = decision === 'retest' ? (verdictHook.verdict?.arbiter?.retest_competencies || []) : undefined;
    await verdictHook.applyDecision(session.id, decision, retestComps);
    await interview.loadSession(session.id);
    queryClient.invalidateQueries({ queryKey: ['role-assignments-active'] });
    queryClient.invalidateQueries({ queryKey: ['knowledge-snapshot'] });
  }, [session, verdictHook, interview, queryClient]);

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const totalCount = session?.test_results?.total_steps ?? steps.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalTokens = steps.reduce((sum, s) => sum + (s.token_count || 0), 0);

  const costEstimate = useMemo(() => {
    if (!session?.candidate_model || totalTokens === 0) return null;
    return estimateCost(session.candidate_model, totalTokens);
  }, [session?.candidate_model, totalTokens]);

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-3 border-b border-border flex items-center gap-2 shrink-0">
        <RefreshCw className={cn("h-4 w-4", config.color)} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{s('recertification', isRu)}: {role}</h3>
          {assignedModel && <span className="text-[10px] text-muted-foreground font-mono truncate block">{assignedModel}</span>}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {phase === 'overview' && (
            <>
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-hydra-warning" />
                  {s('changesSinceLast', isRu)}
                </div>
                {!hasChanged && <p className="text-xs text-muted-foreground">{s('noChanges', isRu)}</p>}
                {hasChanged && delta && (
                  <div className="space-y-1.5">
                    {delta.knowledge_diff !== 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <Database className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{s('knowledge', isRu)}: <span className={delta.knowledge_diff > 0 ? 'text-hydra-success' : 'text-hydra-critical'}>{delta.knowledge_diff > 0 ? '+' : ''}{delta.knowledge_diff}</span></span>
                      </div>
                    )}
                    {delta.prompts_diff !== 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{s('prompts', isRu)}: <span className={delta.prompts_diff > 0 ? 'text-hydra-success' : 'text-hydra-critical'}>{delta.prompts_diff > 0 ? '+' : ''}{delta.prompts_diff}</span></span>
                      </div>
                    )}
                    {changeSummary && delta.knowledge_diff === 0 && delta.prompts_diff === 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{changeSummary}</span>
                      </div>
                    )}
                    {snapshot && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {s('lastCertified', isRu)}: {new Date(snapshot.snapshotted_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-primary/5 rounded-lg p-3 space-y-1.5">
                <div className="text-xs font-medium">{s('deltaCert', isRu)}</div>
                <ul className="text-[10px] text-muted-foreground space-y-0.5">
                  <li>• {s('shortenedBriefing', isRu)}</li>
                  <li>• {s('targetedTests', isRu)}</li>
                  <li>• {s('tokenSavings', isRu)}</li>
                </ul>
              </div>

              {hasChanged && assignedModel && (
                <Button size="sm" className="w-full gap-2" onClick={handleStartRecertDelta}>
                  <Play className="h-3.5 w-3.5" />
                  {s('startRecert', isRu)}
                </Button>
              )}
              {!assignedModel && <p className="text-xs text-muted-foreground text-center py-2">{s('noAssignedModel', isRu)}</p>}
            </>
          )}

          {phase === 'briefing' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">{s('assemblingDelta', isRu)}</span>
            </div>
          )}

          {phase === 'testing' && session && (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{completedCount}/{totalCount} {s('tests', isRu)}</span>
                  <span>{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-1.5" />
                {totalTokens > 0 && (
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>🪙 {totalTokens.toLocaleString()} tok</span>
                    {costEstimate && <span className="text-amber-500 font-medium">💰 {formatCost(costEstimate.total)}</span>}
                  </div>
                )}
              </div>

              {session.status === 'briefed' && !interview.testing && (
                <Button size="sm" className="w-full gap-2" onClick={handleRunTests}>
                  <Play className="h-3.5 w-3.5" />{s('runTests', isRu)}
                </Button>
              )}
              {interview.testing && (
                <Button size="sm" variant="destructive" className="w-full gap-2" onClick={interview.cancelTests}>
                  <XCircle className="h-3.5 w-3.5" />{s('stop', isRu)}
                </Button>
              )}
              {session.status === 'tested' && !verdictHook.running && (
                <Button size="sm" className="w-full gap-2" onClick={handleRunVerdict}>
                  <Gavel className="h-3.5 w-3.5" />{s('runVerdict', isRu)}
                </Button>
              )}
              {verdictHook.running && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>{s('phase', isRu)}: {verdictHook.currentPhase}</span>
                  </div>
                  <Button size="sm" variant="destructive" className="w-full gap-2" onClick={verdictHook.cancelVerdict}>
                    <XCircle className="h-3.5 w-3.5" />{s('stop', isRu)}
                  </Button>
                </div>
              )}

              {steps.map((step, idx) => (
                <div key={idx} className="bg-muted/20 rounded-md p-2 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    {step.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5 text-hydra-success" /> :
                     step.status === 'running' ? <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" /> :
                     step.status === 'failed' ? <XCircle className="h-3.5 w-3.5 text-hydra-critical" /> :
                     <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="font-medium truncate">{step.competency}</span>
                    {step.token_count > 0 && <span className="text-[10px] text-muted-foreground ml-auto">{step.token_count} tok</span>}
                  </div>
                </div>
              ))}
            </>
          )}

          {phase === 'verdict' && (
            <VerdictSection
              session={session}
              verdict={verdictHook.verdict || (session?.verdict as unknown as InterviewVerdict | null)}
              phases={verdictHook.phases}
              isRu={isRu}
              onDecision={handleApplyDecision}
            />
          )}

          {session?.status === 'verdict' && phase !== 'verdict' && (
            <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => setPhase('verdict')}>
              <Gavel className="h-3.5 w-3.5" />{s('viewVerdict', isRu)}
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
