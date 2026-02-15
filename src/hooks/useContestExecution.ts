import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useModelStatistics } from '@/hooks/useModelStatistics';
import { streamWithTimeout } from '@/lib/streamWithTimeout';
import type { ContestResult, ContestRound, ContestSession } from './useContestSession';

interface ExecutionState {
  running: boolean;
  /** model_id → accumulated text so far (for live preview) */
  streamingTexts: Record<string, string>;
  /** true while the arbiter is evaluating */
  arbiterRunning: boolean;
}

/**
 * Sends the round prompt to every contestant model in parallel via hydra-stream,
 * collects responses, then triggers arbiter evaluation.
 */
export function useContestExecution() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { updateCriteriaAverages, addContestResult, addArbiterEval } = useModelStatistics(user?.id);
  const [state, setState] = useState<ExecutionState>({ running: false, streamingTexts: {}, arbiterRunning: false });
  const abortRef = useRef<AbortController | null>(null);

  /** Call the contest-arbiter edge function to evaluate all responses */
  const runArbiterEvaluation = useCallback(async (
    session: ContestSession,
    round: ContestRound,
    roundResults: ContestResult[],
    updateResult: (id: string, updates: Partial<ContestResult>) => Promise<void>,
  ) => {
    const arbitration = session.config.arbitration;
    if (!arbitration || arbitration.juryMode === 'user') return;

    const readyResults = roundResults.filter(r => r.status === 'ready' && r.response_text);
    if (readyResults.length === 0) return;

    setState(prev => ({ ...prev, arbiterRunning: true }));

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const authToken = authSession?.access_token;

      // Merge role-specific criteria if role-based contest
      const roundConfig = session.config.rules?.rounds?.[round.round_index];
      const roleForEvaluation = roundConfig?.roleForEvaluation;
      let effectiveCriteria = arbitration.criteria || [];
      
      if (roleForEvaluation) {
        const { mergeRoleCriteria } = await import('@/lib/contestRoleCriteria');
        effectiveCriteria = mergeRoleCriteria(effectiveCriteria, roleForEvaluation as any);
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/contest-arbiter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          prompt: round.prompt,
          responses: readyResults.map(r => ({
            result_id: r.id,
            model_id: r.model_id,
            response_text: r.response_text,
            response_time_ms: r.response_time_ms,
            token_count: r.token_count,
          })),
          criteria: effectiveCriteria,
          criteria_weights: arbitration.criteriaWeights || {},
          arbiter_model: arbitration.arbiterModel || undefined,
          language,
          role_context: roleForEvaluation || undefined,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[contest-arbiter] Failed:', response.status, errText);
        toast({
          variant: 'destructive',
          description: response.status === 429
            ? (isRu ? 'Арбитр: превышен лимит запросов, попробуйте позже' : 'Arbiter: rate limit exceeded, try again later')
            : response.status === 402
              ? (isRu ? 'Арбитр: недостаточно кредитов' : 'Arbiter: insufficient credits')
              : (isRu ? `Ошибка арбитра: ${response.status}` : `Arbiter error: ${response.status}`),
        });
        return;
      }

      const data = await response.json();
      const evaluations: { result_id: string; arbiter_score: number | null; arbiter_comment: string | null; arbiter_model: string; criteria_scores?: Record<string, number> }[] = data.evaluations || [];

      // Save each evaluation — include response_text to prevent state loss
      for (const eval_ of evaluations) {
        if (eval_.arbiter_score != null) {
          const originalResult = readyResults.find(r => r.id === eval_.result_id);
          await updateResult(eval_.result_id, {
            arbiter_score: eval_.arbiter_score,
            arbiter_comment: eval_.arbiter_comment,
            arbiter_model: eval_.arbiter_model,
            criteria_scores: eval_.criteria_scores || {},
            status: 'judged',
            metadata: {
              ...(originalResult?.metadata || {}),
              criteria_scores: eval_.criteria_scores || {},
            },
            // Preserve response fields to prevent UI from losing them
            ...(originalResult ? {
              response_text: originalResult.response_text,
              response_time_ms: originalResult.response_time_ms,
              token_count: originalResult.token_count,
            } : {}),
          } as any);

          // Aggregate criteria scores into model_statistics (null session_id for contest data)
          if (eval_.criteria_scores && originalResult) {
            await updateCriteriaAverages(
              originalResult.model_id,
              null,
              eval_.criteria_scores,
              'contest' // Mark as contest criteria
            );
          }

          // Record arbiter eval + contest participation in model_statistics
          if (originalResult) {
            await addArbiterEval(
              originalResult.model_id,
              null,
              eval_.arbiter_score,
              eval_.arbiter_comment || undefined,
            );
            await addContestResult(
              originalResult.model_id,
              null,
              eval_.arbiter_score,
            );
          }
        }
      }

      toast({ description: isRu ? `Арбитр оценил ${evaluations.length} ответов` : `Arbiter evaluated ${evaluations.length} responses` });
    } catch (err: any) {
      console.error('[contest-arbiter] Error:', err);
      toast({ variant: 'destructive', description: isRu ? `Ошибка арбитра: ${err.message}` : `Arbiter error: ${err.message}` });
    } finally {
      setState(prev => ({ ...prev, arbiterRunning: false }));
    }
  }, [toast, isRu, language, updateCriteriaAverages, addArbiterEval, addContestResult]);

  const executeRound = useCallback(async (
    session: ContestSession,
    round: ContestRound,
    results: ContestResult[],
    updateResult: (id: string, updates: Partial<ContestResult>) => Promise<void>,
    allRounds?: ContestRound[],
  ) => {
    const eliminated: string[] = (session.config as any).eliminatedModels || [];
    const roundResults = results.filter(r => r.round_id === round.id && !eliminated.includes(r.model_id));
    if (roundResults.length === 0) return;

    const abortController = new AbortController();
    abortRef.current = abortController;

    setState({ running: true, streamingTexts: {}, arbiterRunning: false });

    const prompt = round.prompt;
    
    // Build system prompt: merge role prompt if role-based contest
    const roundConfig = session.config.rules?.rounds?.[round.round_index];
    const roleForEvaluation = roundConfig?.roleForEvaluation;
    let systemPrompt: string | undefined;
    
    if (roleForEvaluation) {
      // Import role system prompt dynamically
      const { DEFAULT_SYSTEM_PROMPTS } = await import('@/config/roles');
      const rolePrompt = DEFAULT_SYSTEM_PROMPTS[roleForEvaluation as keyof typeof DEFAULT_SYSTEM_PROMPTS];
      const contestPreamble = `You are a contestant in an AI model competition. Answer the prompt in the role described below.\n\n`;
      systemPrompt = contestPreamble + (rolePrompt || '');
    } else if (session.config.arbitration) {
      systemPrompt = `You are a contestant in an AI model competition. Answer the prompt as best you can.`;
    }

    // Build conversation history from previous rounds for each model
    const buildHistory = (modelId: string): { role: string; content: string }[] => {
      if (!allRounds) return [];
      const previousRounds = allRounds
        .filter(r => r.round_index < round.round_index && r.status === 'completed')
        .sort((a, b) => a.round_index - b.round_index);

      const history: { role: string; content: string }[] = [];
      for (const prevRound of previousRounds) {
        // Add the prompt as user message
        if (prevRound.prompt) {
          history.push({ role: 'user', content: prevRound.prompt });
        }
        // Find this model's response in that round
        const prevResult = results.find(
          r => r.round_id === prevRound.id && r.model_id === modelId && r.response_text
        );
        if (prevResult?.response_text) {
          history.push({ role: 'assistant', content: prevResult.response_text });
        }
      }
      return history;
    };

    // Track completed results for arbiter
    const completedResults: ContestResult[] = [];

    // Launch all models in parallel
    const promises = roundResults.map(async (result) => {
      const modelId = result.model_id;
      const startTime = Date.now();

      // Mark as generating
      await updateResult(result.id, { status: 'generating' } as any);

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const { data: { session: authSession } } = await supabase.auth.getSession();
        const authToken = authSession?.access_token;
        const conversationHistory = buildHistory(modelId);

        const streamResult = await streamWithTimeout({
          url: `${supabaseUrl}/functions/v1/hydra-stream`,
          body: {
            message: prompt,
            model_id: modelId,
            role: 'assistant',
            system_prompt: systemPrompt,
            temperature: 0.7,
            max_tokens: 8192,
            ...(conversationHistory.length > 0 ? { history: conversationHistory } : {}),
          },
          authToken: authToken || null,
          apiKey: supabaseKey,
          signal: abortController.signal,
          onToken: (accumulated) => {
            setState(prev => ({
              ...prev,
              streamingTexts: { ...prev.streamingTexts, [modelId]: accumulated },
            }));
          },
        });

        const updatedResult = {
          ...result,
          response_text: streamResult.text,
          response_time_ms: streamResult.elapsedMs,
          token_count: streamResult.tokenCount,
          status: 'ready' as const,
        };

        await updateResult(result.id, {
          response_text: streamResult.text,
          response_time_ms: streamResult.elapsedMs,
          token_count: streamResult.tokenCount,
          status: 'ready',
        } as any);

        completedResults.push(updatedResult);

      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error(`[contest-exec] ${modelId} failed:`, err);
        const isTimeout = err.message?.includes('Empty response') || err.message?.includes('aborted');
        await updateResult(result.id, {
          status: 'failed',
          metadata: { error: isTimeout ? `Timeout: ${err.message}` : err.message } as any,
        } as any);
      }
    });

    await Promise.allSettled(promises);

    // Mark round as completed
    await supabase
      .from('contest_rounds')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', round.id);

    setState(prev => ({ ...prev, running: false, streamingTexts: {} }));
    abortRef.current = null;

    // Auto-trigger arbiter evaluation if configured
    if (completedResults.length > 0 && session.config.arbitration) {
      await runArbiterEvaluation(session, round, completedResults, updateResult);
    }

    // ── Auto-elimination by threshold ──
    const elimination = (session.config as any).rules?.elimination;
    const threshold = (session.config as any).rules?.eliminationThreshold;
    if (elimination === 'threshold' && typeof threshold === 'number' && threshold > 0) {
      // Compute average arbiter score per model across ALL results so far
      const allResults = [...results.filter(r => r.round_id !== round.id), ...completedResults];
      const modelScores = new Map<string, number[]>();
      for (const r of allResults) {
        if (r.arbiter_score != null) {
          const arr = modelScores.get(r.model_id) || [];
          arr.push(r.arbiter_score);
          modelScores.set(r.model_id, arr);
        }
      }
      const toEliminate: string[] = [];
      for (const [modelId, scores] of modelScores) {
        if (eliminated.includes(modelId)) continue;
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg < threshold) toEliminate.push(modelId);
      }
      if (toEliminate.length > 0) {
        const currentEliminated = (session.config as any).eliminatedModels || [];
        const newEliminated = [...new Set([...currentEliminated, ...toEliminate])];
        const newConfig = { ...session.config, eliminatedModels: newEliminated };
        await supabase
          .from('contest_sessions')
          .update({ config: newConfig as any })
          .eq('id', session.id);
      }
    }
  }, [toast, runArbiterEvaluation]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState({ running: false, streamingTexts: {}, arbiterRunning: false });
  }, []);

  return {
    executing: state.running,
    arbiterRunning: state.arbiterRunning,
    streamingTexts: state.streamingTexts,
    executeRound,
    runArbiterEvaluation,
    cancelExecution: cancel,
  };
}
