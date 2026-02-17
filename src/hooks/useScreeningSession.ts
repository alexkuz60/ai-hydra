import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useInterviewSession } from './useInterviewSession';
import type { InterviewSession, InterviewTestResults } from '@/types/interview';

export interface ScreeningCandidate {
  modelId: string;
  sessionId: string | null;
  status: 'pending' | 'briefing' | 'testing' | 'tested' | 'verdict' | 'completed' | 'failed';
  error?: string;
  /** Number of completed test steps */
  completedSteps?: number;
  /** Total test steps for this candidate */
  totalSteps?: number;
}

interface ScreeningState {
  candidates: ScreeningCandidate[];
  running: boolean;
}

const MAX_CONCURRENCY = 2;

/**
 * Batch wrapper for screening multiple contest winners.
 * Runs interviews in parallel with concurrency limit.
 * Each candidate goes through: briefing → tests independently.
 */
export function useScreeningSession() {
  const { user } = useAuth();
  // Single interview instance for detail viewing only
  const interview = useInterviewSession();

  const [state, setState] = useState<ScreeningState>({
    candidates: [],
    running: false,
  });

  const abortRef = useRef(false);
  const candidatesRef = useRef<ScreeningCandidate[]>([]);
  candidatesRef.current = state.candidates;

  /** Initialize candidates from selectedWinners */
  const initCandidates = useCallback((modelIds: string[]) => {
    const candidates = modelIds.map(modelId => ({
      modelId,
      sessionId: null,
      status: 'pending' as const,
    }));
    setState({ candidates, running: false });
  }, []);

  /** Update a single candidate's state by index */
  const updateCandidate = useCallback((index: number, update: Partial<ScreeningCandidate>) => {
    setState(prev => {
      const next = [...prev.candidates];
      next[index] = { ...next[index], ...update };
      return { ...prev, candidates: next };
    });
  }, []);

  /**
   * Run a single candidate through briefing + tests.
   * Standalone function — no React hook dependencies, safe for parallel use.
   */
  const runSingleCandidate = async (
    index: number,
    modelId: string,
    role: string,
    sourceContestId?: string,
    maxTokensOverride?: number,
  ) => {
    if (abortRef.current) return;

    try {
      // Phase 1: Briefing
      updateCandidate(index, { status: 'briefing' });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const authToken = authSession?.access_token;

      const briefingRes = await fetch(`${supabaseUrl}/functions/v1/interview-briefing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          role,
          candidate_model: modelId,
          source_contest_id: sourceContestId,
        }),
      });

      if (!briefingRes.ok) {
        const errText = await briefingRes.text();
        throw new Error(`Briefing ${briefingRes.status}: ${errText}`);
      }

      const briefingData = await briefingRes.json();
      const sessionId = briefingData.session_id;

      if (!sessionId) throw new Error('No session_id returned from briefing');
      updateCandidate(index, { sessionId, status: 'testing', completedSteps: 0 });

      if (abortRef.current) return;

      // Phase 2: Run tests via SSE
      await new Promise<void>((resolve, reject) => {
        const testUrl = `${supabaseUrl}/functions/v1/interview-test-runner`;

        fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken || supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            session_id: sessionId,
            max_tokens_override: maxTokensOverride,
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const errText = await response.text();
            reject(new Error(`Tests ${response.status}: ${errText}`));
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) { reject(new Error('No response body')); return; }

          const decoder = new TextDecoder();
          let buffer = '';
          let completed = 0;
          let total = 0;

          const processLine = (line: string) => {
            if (!line.startsWith('data: ')) return;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') return;

            try {
              const evt = JSON.parse(jsonStr);
              if (evt.type === 'progress' && evt.total) {
                total = evt.total;
                updateCandidate(index, { totalSteps: total });
              }
              if (evt.type === 'step_complete') {
                completed++;
                updateCandidate(index, { completedSteps: completed });
              }
              if (evt.type === 'error') {
                console.error(`[Screening] Test error for ${modelId}:`, evt.message);
              }
            } catch { /* partial JSON */ }
          };

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              let nlIdx: number;
              while ((nlIdx = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, nlIdx).replace(/\r$/, '');
                buffer = buffer.slice(nlIdx + 1);
                processLine(line);
              }
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        }).catch(reject);
      });

      updateCandidate(index, { status: 'tested' });

    } catch (err: any) {
      if (!abortRef.current) {
        updateCandidate(index, { status: 'failed', error: err.message?.slice(0, 100) });
      }
    }
  };

  /** Simple concurrency-limited parallel executor */
  const runWithConcurrency = async (
    tasks: Array<() => Promise<void>>,
    limit: number,
  ) => {
    const executing = new Set<Promise<void>>();

    for (const task of tasks) {
      if (abortRef.current) break;

      const p = task().then(() => { executing.delete(p); });
      executing.add(p);

      if (executing.size >= limit) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
  };

  /** Run screening batch with parallel concurrency */
  const runBatch = useCallback(async (
    role: string,
    sourceContestId?: string,
    maxTokensOverride?: number,
  ) => {
    if (!user) return;
    abortRef.current = false;
    setState(prev => ({ ...prev, running: true }));

    const tasks = candidatesRef.current.map((candidate, index) =>
      () => runSingleCandidate(index, candidate.modelId, role, sourceContestId, maxTokensOverride)
    );

    await runWithConcurrency(tasks, MAX_CONCURRENCY);

    setState(prev => ({ ...prev, running: false }));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Cancel the batch */
  const cancelBatch = useCallback(() => {
    abortRef.current = true;
    setState(prev => ({ ...prev, running: false }));
  }, []);

  /** Load a specific candidate's session for detail view (uses shared interview instance) */
  const loadCandidateSession = useCallback(async (sessionId: string) => {
    await interview.loadSession(sessionId);
  }, [interview]);

  return {
    candidates: state.candidates,
    running: state.running,
    // Passthrough from interview for viewing loaded session detail
    session: interview.session,
    loading: interview.loading,
    testing: interview.testing,
    stepStatuses: interview.stepStatuses,
    totalSteps: interview.totalSteps,
    currentStep: interview.currentStep,
    // Actions
    initCandidates,
    runBatch,
    cancelBatch,
    loadCandidateSession,
    listSessions: interview.listSessions,
    runTests: interview.runTests,
    cancelTests: interview.cancelTests,
    getHistoricalTokenUsage: interview.getHistoricalTokenUsage,
    loadSession: interview.loadSession,
  };
}
