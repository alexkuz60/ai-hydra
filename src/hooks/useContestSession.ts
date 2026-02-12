import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// ============================================
// Types
// ============================================

export interface ContestSessionConfig {
  models: Record<string, string>; // modelId -> role
  rules: {
    roundCount: number;
    rounds: { prompt: string; label?: string }[];
  };
  taskId?: string;
  taskTitle?: string;
  mode: string;
  pipeline: string;
  arbitration?: {
    juryMode: string;
    criteria: string[];
    criteriaWeights: Record<string, number>;
    userWeight: number;
    scoringScheme: string;
    arbiterModel?: string;
  };
}

export interface ContestSession {
  id: string;
  user_id: string;
  name: string;
  config: ContestSessionConfig;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContestRound {
  id: string;
  session_id: string;
  round_index: number;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ContestResult {
  id: string;
  round_id: string;
  session_id: string;
  model_id: string;
  response_text: string | null;
  response_time_ms: number | null;
  token_count: number | null;
  user_score: number | null;
  arbiter_score: number | null;
  arbiter_model: string | null;
  arbiter_comment: string | null;
  criteria_scores: Record<string, number> | null;
  status: 'pending' | 'generating' | 'ready' | 'judged' | 'failed';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================
// Hook
// ============================================

export function useContestSession() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<ContestSession | null>(null);
  const [rounds, setRounds] = useState<ContestRound[]>([]);
  const [results, setResults] = useState<ContestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<ContestSession[]>([]);

  // Load latest session on mount
  const loadLatestSession = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('contest_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const s = { ...data, config: data.config as unknown as ContestSessionConfig } as ContestSession;
      setSession(s);
      await loadRoundsAndResults(s.id);
      return s;
    }
    return null;
  }, [user]);

  const loadRoundsAndResults = useCallback(async (sessionId: string) => {
    const [roundsRes, resultsRes] = await Promise.all([
      supabase.from('contest_rounds').select('*').eq('session_id', sessionId).order('round_index'),
      supabase.from('contest_results').select('*').eq('session_id', sessionId).order('created_at'),
    ]);
    setRounds((roundsRes.data || []) as unknown as ContestRound[]);
    setResults((resultsRes.data || []) as unknown as ContestResult[]);
  }, []);

  // Load session history
  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('contest_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);
    setSessionHistory((data || []).map(d => ({ ...d, config: d.config as unknown as ContestSessionConfig })) as ContestSession[]);
  }, [user]);

  // Create a new session from localStorage wizard config
  const createFromWizard = useCallback(async (): Promise<{ session: ContestSession; rounds: ContestRound[]; results: ContestResult[] } | null> => {
    if (!user) return null;
    setLoading(true);
    try {
      const models = JSON.parse(localStorage.getItem('hydra-contest-models') || '{}');
      const rulesStr = localStorage.getItem('hydra-contest-rules');
      const rules = rulesStr ? JSON.parse(rulesStr) : { roundCount: 1, rounds: [{ prompt: '' }] };
      const taskId = localStorage.getItem('hydra-contest-task-id') || undefined;
      const taskTitle = localStorage.getItem('hydra-contest-task-title') || undefined;
      const mode = localStorage.getItem('hydra-contest-mode') || 'contest';
      const pipeline = localStorage.getItem('hydra-contest-pipeline') || 'none';
      const arbStr = localStorage.getItem('hydra-contest-arbitration');
      const arbitration = arbStr ? JSON.parse(arbStr) : undefined;

      const config: ContestSessionConfig = { models, rules, taskId, taskTitle, mode, pipeline, arbitration };
      const name = taskTitle || (mode === 'interview' ? 'Собеседование' : 'Конкурс');

      const { data, error } = await supabase
        .from('contest_sessions')
        .insert({ user_id: user.id, name, config: config as any, status: 'running', started_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;

      const newSession = { ...data, config } as ContestSession;

      const roundInserts = rules.rounds.map((r: { prompt: string }, i: number) => ({
        session_id: newSession.id,
        round_index: i,
        prompt: r.prompt || '',
        status: i === 0 ? 'running' : 'pending',
        started_at: i === 0 ? new Date().toISOString() : null,
      }));

      const { data: roundsData } = await supabase
        .from('contest_rounds')
        .insert(roundInserts)
        .select();

      const newRounds = (roundsData || []) as unknown as ContestRound[];
      setRounds(newRounds);

      let newResults: ContestResult[] = [];
      const modelIds = Object.keys(models);
      if (newRounds.length > 0 && modelIds.length > 0) {
        const resultInserts = modelIds.map(modelId => ({
          round_id: newRounds[0].id,
          session_id: newSession.id,
          model_id: modelId,
          status: 'pending',
        }));
        const { data: resultsData } = await supabase
          .from('contest_results')
          .insert(resultInserts)
          .select();
        newResults = (resultsData || []) as unknown as ContestResult[];
        setResults(newResults);
      }

      setSession(newSession);
      return { session: newSession, rounds: newRounds, results: newResults };
    } catch (err: any) {
      toast({ variant: 'destructive', description: err.message });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Load a specific session by ID
  const loadSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contest_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (error) throw error;
      const s = { ...data, config: data.config as unknown as ContestSessionConfig } as ContestSession;
      setSession(s);
      await loadRoundsAndResults(s.id);
    } catch (err: any) {
      toast({ variant: 'destructive', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [toast, loadRoundsAndResults]);

  // Update a result (score, response, etc.)
  const updateResult = useCallback(async (resultId: string, updates: Partial<ContestResult>) => {
    const { error } = await supabase
      .from('contest_results')
      .update(updates as any)
      .eq('id', resultId);
    if (error) {
      toast({ variant: 'destructive', description: error.message });
      return;
    }
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, ...updates } : r));
  }, [toast]);

  // Update session status
  const updateSessionStatus = useCallback(async (status: ContestSession['status']) => {
    if (!session) return;
    const updates: any = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    const { error } = await supabase
      .from('contest_sessions')
      .update(updates)
      .eq('id', session.id);
    if (error) {
      toast({ variant: 'destructive', description: error.message });
      return;
    }
    setSession(prev => prev ? { ...prev, ...updates } : null);
  }, [session, toast]);

  // Create a follow-up round targeting specific or all models
  const createFollowUpRound = useCallback(async (
    prompt: string,
    targetModelIds?: string[], // undefined = all models in session
  ): Promise<{ round: ContestRound; results: ContestResult[] } | null> => {
    if (!session) return null;
    setLoading(true);
    try {
      const allModelIds = targetModelIds || Object.keys(session.config.models || {});
      if (allModelIds.length === 0) return null;

      const nextIndex = rounds.length;

      const { data: roundData, error: roundErr } = await supabase
        .from('contest_rounds')
        .insert({
          session_id: session.id,
          round_index: nextIndex,
          prompt,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (roundErr) throw roundErr;
      const newRound = roundData as unknown as ContestRound;

      const resultInserts = allModelIds.map(modelId => ({
        round_id: newRound.id,
        session_id: session.id,
        model_id: modelId,
        status: 'pending',
      }));

      const { data: resultsData, error: resErr } = await supabase
        .from('contest_results')
        .insert(resultInserts)
        .select();

      if (resErr) throw resErr;
      const newResults = (resultsData || []) as unknown as ContestResult[];

      setRounds(prev => [...prev, newRound]);
      setResults(prev => [...prev, ...newResults]);

      // Also ensure session stays running
      if (session.status !== 'running') {
        await supabase.from('contest_sessions').update({ status: 'running' }).eq('id', session.id);
        setSession(prev => prev ? { ...prev, status: 'running' } : null);
      }

      return { round: newRound, results: newResults };
    } catch (err: any) {
      toast({ variant: 'destructive', description: err.message });
      return null;
    } finally {
      setLoading(false);
    }
  }, [session, rounds, toast]);

  // Realtime subscription for contest_results
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`contest-results-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contest_results',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setResults(prev => {
              if (prev.some(r => r.id === (payload.new as ContestResult).id)) return prev;
              return [...prev, payload.new as ContestResult];
            });
          } else if (payload.eventType === 'UPDATE') {
            // Merge to preserve fields (e.g. response_text) that may be omitted from realtime payload
            setResults(prev => prev.map(r => r.id === (payload.new as ContestResult).id ? { ...r, ...(payload.new as ContestResult) } : r));
          } else if (payload.eventType === 'DELETE') {
            setResults(prev => prev.filter(r => r.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  return {
    session,
    rounds,
    results,
    loading,
    sessionHistory,
    loadLatestSession,
    loadHistory,
    createFromWizard,
    createFollowUpRound,
    loadSession,
    updateResult,
    updateSessionStatus,
    setSession,
  };
}
