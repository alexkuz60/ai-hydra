import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useConceptInvoke, ConceptExpertType, PipelineContext } from './useConceptInvoke';
import { useConceptResponses, ConceptResponses } from './useConceptResponses';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export type PhaseStatus = 'idle' | 'running' | 'done' | 'failed';

export interface ConceptPipelineState {
  phaseStatuses: Record<ConceptExpertType, PhaseStatus>;
  activePhase: ConceptExpertType | null;
  isRunning: boolean;
}

const PIPELINE_ORDER_FULL: ConceptExpertType[] = ['visionary', 'strategist', 'patent'];
const PIPELINE_ORDER_NO_PATENT: ConceptExpertType[] = ['visionary', 'strategist'];

export type ConceptModelOverrides = Partial<Record<ConceptExpertType, string>>;

interface UseConceptPipelineOptions {
  planId: string;
  planTitle: string;
  planGoal: string;
  includePatent?: boolean;
  onStepComplete?: () => void;
}

/** Fetch combined file digests for a plan's concept session */
async function fetchFileDigestsForPlan(planId: string, userId: string): Promise<string> {
  try {
    // Find the concept session
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('plan_id', planId)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!session?.id) return '';

    const { data: digests } = await supabase
      .from('file_digests')
      .select('digest, source_file_name, digest_type')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (!digests || digests.length === 0) return '';

    return digests
      .map((d: any) => `### ${d.source_file_name || 'Файл'} (${d.digest_type})\n${d.digest}`)
      .join('\n\n');
  } catch (e) {
    console.warn('[pipeline] Failed to fetch file digests:', e);
    return '';
  }
}

export function useConceptPipeline({ planId, planTitle, planGoal, includePatent = false, onStepComplete }: UseConceptPipelineOptions) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { responses, loading: responsesLoading, refetch } = useConceptResponses(planId || null);
  const abortRef = useRef(false);
  const fileDigestsCache = useRef<string | null>(null);

  /** Fetch and cache file digests for this plan */
  const getFileDigests = useCallback(async (): Promise<string> => {
    if (fileDigestsCache.current !== null) return fileDigestsCache.current;
    if (!user?.id) return '';
    const digests = await fetchFileDigestsForPlan(planId, user.id);
    fileDigestsCache.current = digests;
    return digests;
  }, [planId, user?.id]);

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
  const runStep = useCallback(async (step: ConceptExpertType, modelOverrides?: ConceptModelOverrides) => {
    // Refresh responses to get latest data for context
    await refetch();

    setState(prev => ({
      ...prev,
      activePhase: step,
      isRunning: true,
      phaseStatuses: { ...prev.phaseStatuses, [step]: 'running' },
    }));

    try {
      const ctx: PipelineContext = {};
      const fileDigests = await getFileDigests();
      if (fileDigests) ctx.fileDigests = fileDigests;
      
      if (step === 'strategist') {
        ctx.visionaryResponse = responses.visionary?.content || null;
      } else if (step === 'patent') {
        ctx.visionaryResponse = responses.visionary?.content || null;
        ctx.strategistResponse = responses.strategist?.content || null;
      }

      await invoke(step, ctx, modelOverrides?.[step]);

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
  }, [invoke, refetch, responses, getFileDigests]);

  /** Run the full pipeline: Visionary → Strategist → Patent */
  const runFullPipeline = useCallback(async (modelOverrides?: ConceptModelOverrides) => {
    if (!planGoal?.trim()) {
      toast.error(language === 'ru' ? 'Заполните концепцию проекта' : 'Please fill in the project concept');
      return;
    }

    abortRef.current = false;
    fileDigestsCache.current = null; // Reset cache for fresh data
    // Reset all statuses
    setState({
      phaseStatuses: { visionary: 'idle', strategist: 'idle', patent: 'idle' },
      activePhase: null,
      isRunning: true,
    });

    // Accumulate responses through pipeline steps (don't rely on React state)
    const pipelineResults: Record<string, string | null> = {
      visionary: null,
      strategist: null,
      patent: null,
    };

    for (const step of (includePatent ? PIPELINE_ORDER_FULL : PIPELINE_ORDER_NO_PATENT)) {
      if (abortRef.current) break;

      setState(prev => ({
        ...prev,
        activePhase: step,
        phaseStatuses: { ...prev.phaseStatuses, [step]: 'running' },
      }));

      try {
        // Build cascading context from accumulated pipeline results + file digests
        const ctx: PipelineContext = {};
        const fileDigests = await getFileDigests();
        if (fileDigests) ctx.fileDigests = fileDigests;
        
        if (step === 'strategist') {
          ctx.visionaryResponse = pipelineResults.visionary || null;
        } else if (step === 'patent') {
          ctx.visionaryResponse = pipelineResults.visionary || null;
          ctx.strategistResponse = pipelineResults.strategist || null;
        }

        // invoke now returns the AI response content
        const responseContent = await invoke(step, ctx, modelOverrides?.[step]);
        pipelineResults[step] = responseContent;

        setState(prev => ({
          ...prev,
          phaseStatuses: { ...prev.phaseStatuses, [step]: 'done' },
        }));

        // Refetch for UI display
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
  }, [planGoal, language, invoke, refetch, includePatent, getFileDigests]);

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