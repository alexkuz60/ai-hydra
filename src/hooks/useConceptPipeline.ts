import { useState, useCallback, useRef, useEffect } from 'react';
import { useConceptInvoke, ConceptExpertType, PipelineContext } from './useConceptInvoke';
import { useConceptResponses, ConceptResponses } from './useConceptResponses';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export type PhaseStatus = 'idle' | 'running' | 'done' | 'failed';

export interface ConceptPipelineState {
  phaseStatuses: Record<ConceptExpertType, PhaseStatus>;
  activePhase: ConceptExpertType | null;
  isRunning: boolean;
}

const PIPELINE_ORDER: ConceptExpertType[] = ['visionary', 'strategist', 'patent'];

interface UseConceptPipelineOptions {
  planId: string;
  planTitle: string;
  planGoal: string;
  onStepComplete?: () => void;
}

export function useConceptPipeline({ planId, planTitle, planGoal, onStepComplete }: UseConceptPipelineOptions) {
  const { language } = useLanguage();
  const { responses, loading: responsesLoading, refetch } = useConceptResponses(planId || null);
  const abortRef = useRef(false);

  const [state, setState] = useState<ConceptPipelineState>({
    phaseStatuses: {
      visionary: 'idle',
      strategist: 'idle',
      patent: 'idle',
    },
    activePhase: null,
    isRunning: false,
  });

  // Derive initial statuses from existing responses
  const getInitialStatuses = useCallback((): Record<ConceptExpertType, PhaseStatus> => {
    return {
      visionary: responses.visionary ? 'done' : 'idle',
      strategist: responses.strategist ? 'done' : 'idle',
      patent: responses.patent ? 'done' : 'idle',
    };
  }, [responses]);

  // Auto-sync timeline from loaded responses on mount / when responses change
  useEffect(() => {
    if (!state.isRunning && !responsesLoading) {
      setState(prev => ({
        ...prev,
        phaseStatuses: {
          visionary: responses.visionary ? 'done' : prev.phaseStatuses.visionary === 'failed' ? 'failed' : 'idle',
          strategist: responses.strategist ? 'done' : prev.phaseStatuses.strategist === 'failed' ? 'failed' : 'idle',
          patent: responses.patent ? 'done' : prev.phaseStatuses.patent === 'failed' ? 'failed' : 'idle',
        },
      }));
    }
  }, [responses, responsesLoading, state.isRunning]);

  const { invoke, loading: singleLoading } = useConceptInvoke({
    planId,
    planTitle,
    planGoal,
    onComplete: () => {
      refetch();
      onStepComplete?.();
    },
  });

  /** Run a single step with cascading context */
  const runStep = useCallback(async (step: ConceptExpertType) => {
    // Refresh responses to get latest data
    await refetch();
    
    const pipelineCtx: PipelineContext = {};

    // Build context from existing responses
    if (step === 'strategist' || step === 'patent') {
      // Need visionary response
      const freshResponses = await refetch();
      // refetch returns void, so we read from state after await
    }

    setState(prev => ({
      ...prev,
      activePhase: step,
      isRunning: true,
      phaseStatuses: { ...prev.phaseStatuses, [step]: 'running' },
    }));

    try {
      // Get latest context from responses (they should be updated by now)
      const ctx: PipelineContext = {};
      if (step === 'strategist') {
        ctx.visionaryResponse = responses.visionary?.content || null;
      } else if (step === 'patent') {
        ctx.visionaryResponse = responses.visionary?.content || null;
        ctx.strategistResponse = responses.strategist?.content || null;
      }

      await invoke(step, ctx);

      setState(prev => ({
        ...prev,
        activePhase: null,
        isRunning: false,
        phaseStatuses: { ...prev.phaseStatuses, [step]: 'done' },
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        activePhase: null,
        isRunning: false,
        phaseStatuses: { ...prev.phaseStatuses, [step]: 'failed' },
      }));
      throw err;
    }
  }, [invoke, refetch, responses]);

  /** Run the full pipeline: Visionary → Strategist → Patent */
  const runFullPipeline = useCallback(async () => {
    if (!planGoal?.trim()) {
      toast.error(language === 'ru' ? 'Заполните концепцию проекта' : 'Please fill in the project concept');
      return;
    }

    abortRef.current = false;

    // Reset all statuses
    setState({
      phaseStatuses: { visionary: 'idle', strategist: 'idle', patent: 'idle' },
      activePhase: null,
      isRunning: true,
    });

    for (const step of PIPELINE_ORDER) {
      if (abortRef.current) break;

      setState(prev => ({
        ...prev,
        activePhase: step,
        phaseStatuses: { ...prev.phaseStatuses, [step]: 'running' },
      }));

      try {
        // Build cascading context from completed steps
        const ctx: PipelineContext = {};
        
        // After step completes, responses are refetched via onComplete
        // For the pipeline, we need to wait and get fresh data
        if (step === 'strategist' || step === 'patent') {
          // Re-fetch to get latest responses from previous steps
          await refetch();
          // Small delay to ensure data is available
          await new Promise(r => setTimeout(r, 500));
          await refetch();
        }

        if (step === 'strategist') {
          ctx.visionaryResponse = responses.visionary?.content || null;
        } else if (step === 'patent') {
          ctx.visionaryResponse = responses.visionary?.content || null;
          ctx.strategistResponse = responses.strategist?.content || null;
        }

        await invoke(step, ctx);

        setState(prev => ({
          ...prev,
          phaseStatuses: { ...prev.phaseStatuses, [step]: 'done' },
        }));

        // Wait for response to be stored and refetch
        await new Promise(r => setTimeout(r, 2000));
        await refetch();
      } catch (err) {
        setState(prev => ({
          ...prev,
          activePhase: null,
          isRunning: false,
          phaseStatuses: { ...prev.phaseStatuses, [step]: 'failed' },
        }));
        return;
      }
    }

    setState(prev => ({
      ...prev,
      activePhase: null,
      isRunning: false,
    }));

    toast.success(
      language === 'ru'
        ? 'Полный анализ завершён'
        : 'Full analysis completed'
    );
  }, [planGoal, language, invoke, refetch, responses]);

  /** Abort the pipeline */
  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  /** Sync phase statuses from existing responses */
  const syncFromResponses = useCallback(() => {
    if (!state.isRunning) {
      setState(prev => ({
        ...prev,
        phaseStatuses: getInitialStatuses(),
      }));
    }
  }, [state.isRunning, getInitialStatuses]);

  return {
    state,
    responses,
    singleLoading,
    runStep,
    runFullPipeline,
    abort,
    syncFromResponses,
    refetch,
  };
}