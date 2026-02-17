import { useState, useCallback, useRef } from 'react';
import { useInterviewSession } from './useInterviewSession';
import type { InterviewSession } from '@/types/interview';

export interface ScreeningCandidate {
  modelId: string;
  sessionId: string | null;
  status: 'pending' | 'briefing' | 'testing' | 'tested' | 'verdict' | 'completed' | 'failed';
  error?: string;
}

interface ScreeningState {
  candidates: ScreeningCandidate[];
  running: boolean;
  currentIndex: number;
}

/**
 * Batch wrapper around useInterviewSession for screening multiple contest winners.
 * Runs interviews sequentially: briefing → tests → next model.
 */
export function useScreeningSession() {
  const interview = useInterviewSession();

  const [state, setState] = useState<ScreeningState>({
    candidates: [],
    running: false,
    currentIndex: -1,
  });

  const abortRef = useRef(false);

  /** Initialize candidates from selectedWinners */
  const initCandidates = useCallback((modelIds: string[]) => {
    setState({
      candidates: modelIds.map(modelId => ({
        modelId,
        sessionId: null,
        status: 'pending',
      })),
      running: false,
      currentIndex: -1,
    });
  }, []);

  /** Update a single candidate's state */
  const updateCandidate = useCallback((index: number, update: Partial<ScreeningCandidate>) => {
    setState(prev => {
      const next = [...prev.candidates];
      next[index] = { ...next[index], ...update };
      return { ...prev, candidates: next };
    });
  }, []);

  /** Run screening batch: briefing + tests for each model sequentially */
  const runBatch = useCallback(async (
    role: string,
    sourceContestId?: string,
    maxTokensOverride?: number,
  ) => {
    abortRef.current = false;
    setState(prev => ({ ...prev, running: true, currentIndex: 0 }));

    for (let i = 0; i < state.candidates.length; i++) {
      if (abortRef.current) break;

      setState(prev => ({ ...prev, currentIndex: i }));
      const candidate = state.candidates[i];

      try {
        // Phase 1: Briefing
        updateCandidate(i, { status: 'briefing' });
        const sessionId = await interview.createInterview(role, candidate.modelId, sourceContestId);
        if (!sessionId) throw new Error('Briefing failed');
        updateCandidate(i, { sessionId, status: 'testing' });

        if (abortRef.current) break;

        // Phase 2: Run tests
        await interview.runTests(sessionId, maxTokensOverride);
        updateCandidate(i, { status: 'tested' });

      } catch (err: any) {
        updateCandidate(i, { status: 'failed', error: err.message });
      }
    }

    setState(prev => ({ ...prev, running: false }));
  }, [state.candidates, interview, updateCandidate]);

  /** Cancel the batch */
  const cancelBatch = useCallback(() => {
    abortRef.current = true;
    interview.cancelTests();
    setState(prev => ({ ...prev, running: false }));
  }, [interview]);

  /** Load a specific candidate's session for detail view */
  const loadCandidateSession = useCallback(async (sessionId: string) => {
    await interview.loadSession(sessionId);
  }, [interview]);

  return {
    candidates: state.candidates,
    running: state.running,
    currentIndex: state.currentIndex,
    // Passthrough from interview for viewing loaded session
    session: interview.session,
    loading: interview.loading,
    testing: interview.testing,
    stepStatuses: interview.stepStatuses,
    totalSteps: interview.totalSteps,
    // Actions
    initCandidates,
    runBatch,
    cancelBatch,
    loadCandidateSession,
    listSessions: interview.listSessions,
  };
}
