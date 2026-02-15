import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

// ── Types ──

export interface InterviewTestStep {
  step_index: number;
  task_type: string;
  competency: string;
  task_prompt: string;
  baseline: { current_value: string } | null;
  candidate_output: { proposed_value: string } | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string | null;
  elapsed_ms: number;
  token_count: number;
}

export interface InterviewTestResults {
  steps: InterviewTestStep[];
  total_steps: number;
  completed_steps: number;
  started_at: string;
  completed_at: string | null;
}

export interface InterviewSession {
  id: string;
  role: string;
  candidate_model: string;
  status: string;
  briefing_data: Record<string, unknown> | null;
  briefing_token_count: number | null;
  test_results: InterviewTestResults | null;
  config: Record<string, unknown> | null;
  created_at: string;
}

interface InterviewState {
  session: InterviewSession | null;
  loading: boolean;
  /** true while tests are streaming */
  testing: boolean;
  /** Current step index being executed */
  currentStep: number;
  totalSteps: number;
  /** Live step statuses from SSE */
  stepStatuses: Map<number, { status: string; elapsed_ms?: number; token_count?: number; error?: string }>;
}

// ── Hook ──

export function useInterviewSession() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [state, setState] = useState<InterviewState>({
    session: null,
    loading: false,
    testing: false,
    currentStep: -1,
    totalSteps: 0,
    stepStatuses: new Map(),
  });

  const abortRef = useRef<AbortController | null>(null);

  // ── Create interview (Phase 1: Briefing) ──

  const createInterview = useCallback(async (
    role: string,
    candidateModel: string,
    sourceContestId?: string,
  ): Promise<string | null> => {
    if (!user) return null;
    setState(prev => ({ ...prev, loading: true }));

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const authToken = authSession?.access_token;

      const response = await fetch(`${supabaseUrl}/functions/v1/interview-briefing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ role, candidate_model: candidateModel, source_contest_id: sourceContestId }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`${response.status}: ${err}`);
      }

      const data = await response.json();
      toast({ description: isRu ? `Брифинг собран (~${data.estimated_tokens} токенов)` : `Briefing assembled (~${data.estimated_tokens} tokens)` });

      // Load the created session
      await loadSession(data.session_id);
      return data.session_id;
    } catch (err: any) {
      toast({ variant: 'destructive', description: isRu ? `Ошибка брифинга: ${err.message}` : `Briefing error: ${err.message}` });
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, toast, isRu]);

  // ── Load existing session ──

  const loadSession = useCallback(async (sessionId: string) => {
    if (!user) return;
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        session: {
          id: data.id,
          role: data.role,
          candidate_model: data.candidate_model,
          status: data.status,
          briefing_data: data.briefing_data as Record<string, unknown> | null,
          briefing_token_count: data.briefing_token_count,
          test_results: data.test_results as unknown as InterviewTestResults | null,
          config: data.config as Record<string, unknown> | null,
          created_at: data.created_at || '',
        },
        loading: false,
      }));
    } catch (err: any) {
      toast({ variant: 'destructive', description: isRu ? `Ошибка загрузки: ${err.message}` : `Load error: ${err.message}` });
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, toast, isRu]);

  // ── Run tests (Phase 2) with SSE ──

  const runTests = useCallback(async (sessionId: string) => {
    if (!user) return;

    const abortController = new AbortController();
    abortRef.current = abortController;

    setState(prev => ({
      ...prev,
      testing: true,
      currentStep: -1,
      totalSteps: 0,
      stepStatuses: new Map(),
    }));

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const authToken = authSession?.access_token;

      const response = await fetch(`${supabaseUrl}/functions/v1/interview-test-runner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ session_id: sessionId, language }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${response.status}: ${errText}`);
      }

      // Parse SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);

          if (line.startsWith('event: ')) {
            const eventName = line.slice(7);
            // Next line should be data:
            const dataIdx = buffer.indexOf('\n');
            if (dataIdx === -1) {
              // Put event line back and wait for more data
              buffer = line + '\n' + buffer;
              break;
            }
            const dataLine = buffer.slice(0, dataIdx).trim();
            buffer = buffer.slice(dataIdx + 1);

            if (dataLine.startsWith('data: ')) {
              try {
                const payload = JSON.parse(dataLine.slice(6));
                handleSSEEvent(eventName, payload);
              } catch { /* parse error */ }
            }
          }
        }
      }

      // Reload session to get final test_results
      await loadSession(sessionId);
      toast({ description: isRu ? 'Тестирование завершено' : 'Testing completed' });

    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast({ description: isRu ? 'Тестирование отменено' : 'Testing cancelled' });
      } else {
        toast({ variant: 'destructive', description: isRu ? `Ошибка тестирования: ${err.message}` : `Testing error: ${err.message}` });
      }
    } finally {
      setState(prev => ({ ...prev, testing: false }));
      abortRef.current = null;
    }
  }, [user, language, toast, isRu, loadSession]);

  // ── SSE event handler ──

  const handleSSEEvent = useCallback((event: string, payload: any) => {
    switch (event) {
      case 'start':
        setState(prev => ({ ...prev, totalSteps: payload.total_steps }));
        break;
      case 'step_start':
        setState(prev => {
          const newMap = new Map(prev.stepStatuses);
          newMap.set(payload.step_index, { status: 'running' });
          return { ...prev, currentStep: payload.step_index, stepStatuses: newMap };
        });
        break;
      case 'step_skipped':
        setState(prev => {
          const newMap = new Map(prev.stepStatuses);
          newMap.set(payload.step_index, { status: 'skipped' });
          return { ...prev, stepStatuses: newMap };
        });
        break;
      case 'step_progress':
        // Could update streaming preview here
        break;
      case 'step_complete':
        setState(prev => {
          const newMap = new Map(prev.stepStatuses);
          newMap.set(payload.step_index, {
            status: payload.status,
            elapsed_ms: payload.elapsed_ms,
            token_count: payload.token_count,
            error: payload.error,
          });
          return { ...prev, stepStatuses: newMap };
        });
        break;
      case 'complete':
        setState(prev => ({ ...prev, testing: false }));
        break;
    }
  }, []);

  // ── Cancel ──

  const cancelTests = useCallback(() => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, testing: false }));
  }, []);

  // ── List user's interview sessions ──

  const listSessions = useCallback(async (): Promise<InterviewSession[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('interview_sessions')
      .select('id, role, candidate_model, status, briefing_token_count, config, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[useInterviewSession] List error:', error);
      return [];
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      role: d.role,
      candidate_model: d.candidate_model,
      status: d.status,
      briefing_data: null,
      briefing_token_count: d.briefing_token_count,
      test_results: null,
      config: d.config,
      created_at: d.created_at || '',
    }));
  }, [user]);

  return {
    session: state.session,
    loading: state.loading,
    testing: state.testing,
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    stepStatuses: state.stepStatuses,
    createInterview,
    loadSession,
    runTests,
    cancelTests,
    listSessions,
  };
}
