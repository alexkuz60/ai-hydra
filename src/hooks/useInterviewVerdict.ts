import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';

// ── Verdict Types ──

export interface VerdictArbiter {
  model: string;
  scores: Record<string, number>;
  red_flags: string[];
  recommendation: 'hire' | 'reject' | 'retest';
  confidence: number;
  comment: string;
  retest_competencies: string[];
}

export interface VerdictThresholds {
  current_holder: { model_id: string; score: number } | null;
  previous_avg: number | null;
  candidate_score: number;
  is_same_model: boolean;
  is_cold_start: boolean;
}

export interface InterviewVerdict {
  arbiter: VerdictArbiter;
  moderator_summary: string;
  auto_decision: 'hire' | 'reject' | 'retest';
  decision_reason: string;
  final_decision: 'hire' | 'reject' | 'retest' | null;
  decided_by: 'user' | 'auto' | null;
  decided_at: string | null;
  retest_history: Array<{ competencies: string[]; date: string; result: string }>;
  thresholds: VerdictThresholds;
}

interface VerdictPhaseStatus {
  phase: string;
  status: 'running' | 'done';
  result?: any;
  summary?: string;
  verdict?: InterviewVerdict;
}

interface VerdictState {
  running: boolean;
  currentPhase: string;
  phases: VerdictPhaseStatus[];
  verdict: InterviewVerdict | null;
}

// ── Hook ──

export function useInterviewVerdict() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [state, setState] = useState<VerdictState>({
    running: false,
    currentPhase: '',
    phases: [],
    verdict: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const runVerdict = useCallback(async (sessionId: string, arbiterModel?: string) => {
    if (!user) return;

    const abortController = new AbortController();
    abortRef.current = abortController;

    setState({ running: true, currentPhase: '', phases: [], verdict: null });

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const authToken = authSession?.access_token;

      const response = await fetch(`${supabaseUrl}/functions/v1/interview-verdict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ session_id: sessionId, language, arbiter_model: arbiterModel }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${response.status}: ${errText}`);
      }

      // Parse SSE
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);

          if (line.startsWith('event: ')) {
            const eventName = line.slice(7);
            const dataIdx = buffer.indexOf('\n');
            if (dataIdx === -1) {
              buffer = line + '\n' + buffer;
              break;
            }
            const dataLine = buffer.slice(0, dataIdx).trim();
            buffer = buffer.slice(dataIdx + 1);

            if (dataLine.startsWith('data: ')) {
              try {
                const payload = JSON.parse(dataLine.slice(6));
                handleEvent(eventName, payload);
              } catch { /* parse error */ }
            }
          }
        }
      }

      toast({ description: isRu ? 'Вердикт вынесен' : 'Verdict delivered' });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast({ description: isRu ? 'Отменено' : 'Cancelled' });
      } else {
        toast({ variant: 'destructive', description: `${isRu ? 'Ошибка' : 'Error'}: ${err.message}` });
      }
    } finally {
      setState(prev => ({ ...prev, running: false }));
      abortRef.current = null;
    }
  }, [user, language, toast, isRu]);

  const handleEvent = useCallback((event: string, payload: any) => {
    switch (event) {
      case 'phase':
        setState(prev => {
          const phases = [...prev.phases];
          const existing = phases.findIndex(p => p.phase === payload.phase);
          if (existing >= 0) {
            phases[existing] = { ...phases[existing], ...payload };
          } else {
            phases.push(payload);
          }
          return {
            ...prev,
            currentPhase: payload.phase,
            phases,
            verdict: payload.verdict || prev.verdict,
          };
        });
        break;
      case 'complete':
        setState(prev => ({ ...prev, running: false }));
        break;
    }
  }, []);

  const cancelVerdict = useCallback(() => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, running: false }));
  }, []);

  // ── Apply user decision ──
  const applyDecision = useCallback(async (
    sessionId: string,
    decision: 'hire' | 'reject' | 'retest',
    retestCompetencies?: string[],
  ) => {
    if (!user) return;

    try {
      // Load current verdict
      const { data: session } = await supabase
        .from('interview_sessions')
        .select('verdict, role, candidate_model')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (!session) throw new Error('Session not found');

      const verdict = session.verdict as unknown as InterviewVerdict;
      if (!verdict) throw new Error('No verdict found');

      const updatedVerdict = {
        ...verdict,
        final_decision: decision,
        decided_by: 'user',
        decided_at: new Date().toISOString(),
      };

      // If retest, record it
      if (decision === 'retest' && retestCompetencies?.length) {
        updatedVerdict.retest_history = [
          ...(verdict.retest_history || []),
          { competencies: retestCompetencies, date: new Date().toISOString(), result: 'pending' },
        ];
      }

      const newStatus = decision === 'retest' ? 'briefed' : 'completed';

      await supabase
        .from('interview_sessions')
        .update({
          verdict: updatedVerdict as any,
          status: newStatus,
          completed_at: decision !== 'retest' ? new Date().toISOString() : null,
        })
        .eq('id', sessionId);

      // If hire, record in assignment history
      if (decision === 'hire') {
        // Close current holder
        const { data: currentHolders } = await supabase
          .from('role_assignment_history')
          .select('id')
          .eq('user_id', user.id)
          .eq('role', session.role)
          .is('removed_at', null);

        if (currentHolders && currentHolders.length > 0) {
          const isSameModel = verdict.thresholds?.is_same_model;
          for (const h of currentHolders) {
            await supabase
              .from('role_assignment_history')
              .update({
                removed_at: new Date().toISOString(),
                removal_reason: isSameModel ? 'upskilled' : 'replaced',
              })
              .eq('id', h.id);
          }
        }

        // Insert new assignment
        await supabase
          .from('role_assignment_history')
          .insert({
            user_id: user.id,
            role: session.role,
            model_id: session.candidate_model,
            interview_session_id: sessionId,
            interview_avg_score: verdict.thresholds?.candidate_score || 0,
          });

        // Cold start: also create a synthetic "phantom" predecessor
        if (verdict.thresholds?.is_cold_start) {
          const phantomScore = Math.max(0, (verdict.thresholds.candidate_score || 5) - 0.5);
          await supabase
            .from('role_assignment_history')
            .insert({
              user_id: user.id,
              role: session.role,
              model_id: session.candidate_model,
              interview_avg_score: phantomScore,
              is_synthetic: true,
              assigned_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              removed_at: new Date().toISOString(),
              removal_reason: 'replaced',
              metadata: { synthetic: true, reason: 'cold_start_phantom' },
            });
        }
      }

      setState(prev => ({
        ...prev,
        verdict: updatedVerdict as InterviewVerdict,
      }));

      toast({
        description: isRu
          ? `Решение: ${decision === 'hire' ? 'Нанять' : decision === 'reject' ? 'Отклонить' : 'Перетестировать'}`
          : `Decision: ${decision}`,
      });

      // Refresh certification badges in staff list
      queryClient.invalidateQueries({ queryKey: ['role-assignments-active'] });
    } catch (err: any) {
      toast({ variant: 'destructive', description: err.message });
    }
  }, [user, toast, isRu]);

  return {
    ...state,
    runVerdict,
    cancelVerdict,
    applyDecision,
  };
}
