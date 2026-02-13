import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ContestSession, ContestRound, ContestResult, ContestSessionConfig } from './useContestSession';
import type { DuelConfigData } from './useDuelConfig';

export function useDuelSession() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<ContestSession | null>(null);
  const [rounds, setRounds] = useState<ContestRound[]>([]);
  const [results, setResults] = useState<ContestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<ContestSession[]>([]);

  const loadRoundsAndResults = useCallback(async (sessionId: string) => {
    const [roundsRes, resultsRes] = await Promise.all([
      supabase.from('contest_rounds').select('*').eq('session_id', sessionId).order('round_index'),
      supabase.from('contest_results').select('*').eq('session_id', sessionId).order('created_at'),
    ]);
    setRounds((roundsRes.data || []) as unknown as ContestRound[]);
    setResults((resultsRes.data || []) as unknown as ContestResult[]);
  }, []);

  const loadLatestDuel = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('contest_sessions')
      .select('*')
      .eq('user_id', user.id)
      .filter('config->>mode', 'eq', 'duel')
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
  }, [user, loadRoundsAndResults]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('contest_sessions')
      .select('*')
      .eq('user_id', user.id)
      .filter('config->>mode', 'eq', 'duel')
      .order('updated_at', { ascending: false })
      .limit(50);
    setSessionHistory((data || []).map(d => ({ ...d, config: d.config as unknown as ContestSessionConfig })) as ContestSession[]);
  }, [user]);

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

  const createFromConfig = useCallback(async (
    duelConfig: DuelConfigData,
  ): Promise<{ session: ContestSession; rounds: ContestRound[]; results: ContestResult[] } | null> => {
    if (!user || !duelConfig.modelA || !duelConfig.modelB) return null;
    setLoading(true);
    try {
      const models: Record<string, string> = {
        [duelConfig.modelA]: 'duelist',
        [duelConfig.modelB]: 'duelist',
      };

      const roundConfigs = Array.from({ length: duelConfig.roundCount }, (_, i) => ({
        prompt: i === 0 ? duelConfig.duelPrompt : '', // subsequent round prompts built dynamically
      }));

      const config: ContestSessionConfig = {
        models,
        rules: { roundCount: duelConfig.roundCount, rounds: roundConfigs },
        mode: 'duel',
        pipeline: 'duel-critic',
        arbitration: {
          juryMode: 'arbiter',
          criteria: duelConfig.criteria,
          criteriaWeights: duelConfig.criteriaWeights,
          userWeight: duelConfig.userEvaluation ? 0.4 : 0,
          scoringScheme: duelConfig.scoringScheme,
          arbiterModel: duelConfig.arbiterModel || undefined,
        },
        userEvaluation: duelConfig.userEvaluation,
        duelType: duelConfig.duelType,
      } as any;

      const name = `Дуэль: ${getShortName(duelConfig.modelA)} vs ${getShortName(duelConfig.modelB)}`;

      const { data, error } = await supabase
        .from('contest_sessions')
        .insert({
          user_id: user.id,
          name,
          config: config as any,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      const newSession = { ...data, config } as ContestSession;

      // Create all rounds
      const roundInserts = roundConfigs.map((r, i) => ({
        session_id: newSession.id,
        round_index: i,
        prompt: r.prompt,
        status: i === 0 ? 'running' : 'pending',
        started_at: i === 0 ? new Date().toISOString() : null,
      }));

      const { data: roundsData } = await supabase
        .from('contest_rounds')
        .insert(roundInserts)
        .select();

      const newRounds = (roundsData || []) as unknown as ContestRound[];
      setRounds(newRounds);

      // Create results only for round 0
      const resultInserts = [duelConfig.modelA, duelConfig.modelB].map(modelId => ({
        round_id: newRounds[0].id,
        session_id: newSession.id,
        model_id: modelId,
        status: 'pending',
      }));

      const { data: resultsData } = await supabase
        .from('contest_results')
        .insert(resultInserts)
        .select();

      const newResults = (resultsData || []) as unknown as ContestResult[];
      setResults(newResults);
      setSession(newSession);

      return { session: newSession, rounds: newRounds, results: newResults };
    } catch (err: any) {
      toast({ variant: 'destructive', description: err.message });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

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

  const updateSessionStatus = useCallback(async (status: ContestSession['status']) => {
    if (!session) return;
    const updates: any = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    await supabase.from('contest_sessions').update(updates).eq('id', session.id);
    setSession(prev => prev ? { ...prev, ...updates } : null);
  }, [session]);

  /** Add an extra round on-the-fly after all planned rounds are done */
  const addExtraRound = useCallback(async (prompt: string): Promise<{ round: ContestRound; results: ContestResult[] } | null> => {
    if (!session || !user) return null;
    const nextIndex = rounds.length;
    const modelA = Object.keys(session.config.models || {})[0];
    const modelB = Object.keys(session.config.models || {})[1];
    if (!modelA || !modelB) return null;

    // Create round
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

    if (roundErr || !roundData) {
      toast({ variant: 'destructive', description: roundErr?.message || 'Failed to create round' });
      return null;
    }

    const newRound = roundData as unknown as ContestRound;
    setRounds(prev => [...prev, newRound]);

    // Create results for both models
    const { data: resultsData } = await supabase
      .from('contest_results')
      .insert([modelA, modelB].map(modelId => ({
        round_id: newRound.id,
        session_id: session.id,
        model_id: modelId,
        status: 'pending',
      })))
      .select();

    const newResults = (resultsData || []) as unknown as ContestResult[];
    setResults(prev => [...prev, ...newResults]);

    // Re-open session if it was completed
    if (session.status === 'completed') {
      await supabase.from('contest_sessions').update({ status: 'running', completed_at: null }).eq('id', session.id);
      setSession(prev => prev ? { ...prev, status: 'running', completed_at: null } : null);
    }

    return { round: newRound, results: newResults };
  }, [session, user, rounds, toast]);

  /** Build the composite prompt for round N, including previous arguments */
  const buildDuelPrompt = useCallback((
    roundIndex: number,
    modelId: string,
    originalPrompt: string,
    allResults: ContestResult[],
    allRounds: ContestRound[],
    modelA: string,
    modelB: string,
  ): string => {
    if (roundIndex === 0) return originalPrompt;

    const opponentId = modelId === modelA ? modelB : modelA;
    const prevRound = allRounds.find(r => r.round_index === roundIndex - 1);
    if (!prevRound) return originalPrompt;

    const ownPrev = allResults.find(r => r.round_id === prevRound.id && r.model_id === modelId);
    const oppPrev = allResults.find(r => r.round_id === prevRound.id && r.model_id === opponentId);

    return [
      originalPrompt,
      '---',
      `Ваш предыдущий аргумент:\n${ownPrev?.response_text || '(нет)'}`,
      '',
      `Аргумент противника:\n${oppPrev?.response_text || '(нет)'}`,
      '---',
      'Сформулируйте свой следующий аргумент, учитывая позицию противника.',
    ].join('\n');
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`duel-results-${session.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'contest_results',
        filter: `session_id=eq.${session.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setResults(prev => {
            if (prev.some(r => r.id === (payload.new as ContestResult).id)) return prev;
            return [...prev, payload.new as ContestResult];
          });
        } else if (payload.eventType === 'UPDATE') {
          setResults(prev => prev.map(r => r.id === (payload.new as ContestResult).id ? { ...r, ...(payload.new as ContestResult) } : r));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  return {
    session, rounds, results, loading, sessionHistory,
    loadLatestDuel, loadHistory, loadSession,
    createFromConfig, updateResult, updateSessionStatus,
    addExtraRound, buildDuelPrompt, setSession,
  };
}

function getShortName(modelId: string): string {
  return modelId.split('/').pop()?.slice(0, 20) || modelId;
}
