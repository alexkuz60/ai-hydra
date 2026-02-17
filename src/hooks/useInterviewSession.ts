import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInterviewTestRunner } from './useInterviewTestRunner';
import type { InterviewSession, InterviewTestResults } from '@/types/interview';

// Re-export types for backward compatibility
export type { InterviewSession, InterviewTestStep, InterviewTestResults, StepStatus } from '@/types/interview';

interface SessionState {
  session: InterviewSession | null;
  loading: boolean;
}

/**
 * Interview session CRUD + orchestration.
 * Test execution is delegated to useInterviewTestRunner.
 */
export function useInterviewSession() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [state, setState] = useState<SessionState>({
    session: null,
    loading: false,
  });

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

      setState({
        session: {
          id: data.id,
          role: data.role,
          candidate_model: data.candidate_model,
          status: data.status,
          briefing_data: data.briefing_data as Record<string, unknown> | null,
          briefing_token_count: data.briefing_token_count,
          test_results: data.test_results as unknown as InterviewTestResults | null,
          verdict: data.verdict as Record<string, unknown> | null,
          config: data.config as Record<string, unknown> | null,
          source_contest_id: data.source_contest_id || null,
          created_at: data.created_at || '',
        },
        loading: false,
      });
    } catch (err: any) {
      toast({ variant: 'destructive', description: isRu ? `Ошибка загрузки: ${err.message}` : `Load error: ${err.message}` });
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, toast, isRu]);

  // Wire up test runner with loadSession as completion callback
  const testRunner = useInterviewTestRunner(loadSession);

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

      await loadSession(data.session_id);
      return data.session_id;
    } catch (err: any) {
      toast({ variant: 'destructive', description: isRu ? `Ошибка брифинга: ${err.message}` : `Briefing error: ${err.message}` });
      return null;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, toast, isRu, loadSession]);

  // ── List user's interview sessions ──

  const listSessions = useCallback(async (): Promise<InterviewSession[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('interview_sessions')
      .select('id, role, candidate_model, status, briefing_token_count, config, verdict, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

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
      verdict: d.verdict as Record<string, unknown> | null,
      config: d.config,
      source_contest_id: d.source_contest_id || null,
      created_at: d.created_at || '',
    }));
  }, [user]);

  // ── Historical token usage for budget forecast ──

  const getHistoricalTokenUsage = useCallback(async (
    candidateModel: string,
    role: string,
  ): Promise<{ median: number; count: number } | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('interview_sessions')
      .select('config')
      .eq('user_id', user.id)
      .eq('candidate_model', candidateModel)
      .eq('role', role)
      .eq('status', 'tested')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) return null;

    const tokenCounts = data
      .map((d: any) => (d.config as Record<string, unknown>)?.actual_tokens_used as number)
      .filter((t): t is number => typeof t === 'number' && t > 0)
      .sort((a, b) => a - b);

    if (tokenCounts.length === 0) return null;

    const mid = Math.floor(tokenCounts.length / 2);
    const median = tokenCounts.length % 2 === 0
      ? Math.round((tokenCounts[mid - 1] + tokenCounts[mid]) / 2)
      : tokenCounts[mid];

    return { median, count: tokenCounts.length };
  }, [user]);

  return {
    session: state.session,
    loading: state.loading,
    // Test runner passthrough
    testing: testRunner.testing,
    currentStep: testRunner.currentStep,
    totalSteps: testRunner.totalSteps,
    stepStatuses: testRunner.stepStatuses,
    // Session CRUD
    createInterview,
    loadSession,
    listSessions,
    getHistoricalTokenUsage,
    // Test execution
    runTests: testRunner.runTests,
    cancelTests: testRunner.cancelTests,
  };
}
