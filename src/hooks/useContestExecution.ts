import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
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
          criteria: arbitration.criteria || [],
          criteria_weights: arbitration.criteriaWeights || {},
          arbiter_model: arbitration.arbiterModel || undefined,
          language,
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
        }
      }

      toast({ description: isRu ? `Арбитр оценил ${evaluations.length} ответов` : `Arbiter evaluated ${evaluations.length} responses` });
    } catch (err: any) {
      console.error('[contest-arbiter] Error:', err);
      toast({ variant: 'destructive', description: isRu ? `Ошибка арбитра: ${err.message}` : `Arbiter error: ${err.message}` });
    } finally {
      setState(prev => ({ ...prev, arbiterRunning: false }));
    }
  }, [toast, isRu, language]);

  const executeRound = useCallback(async (
    session: ContestSession,
    round: ContestRound,
    results: ContestResult[],
    updateResult: (id: string, updates: Partial<ContestResult>) => Promise<void>,
  ) => {
    const roundResults = results.filter(r => r.round_id === round.id);
    if (roundResults.length === 0) return;

    const abortController = new AbortController();
    abortRef.current = abortController;

    setState({ running: true, streamingTexts: {}, arbiterRunning: false });

    const prompt = round.prompt;
    const systemPrompt = session.config.arbitration
      ? `You are a contestant in an AI model competition. Answer the prompt as best you can.`
      : undefined;

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

        // Get auth token for the edge function
        const { data: { session: authSession } } = await supabase.auth.getSession();
        const authToken = authSession?.access_token;

        const response = await fetch(`${supabaseUrl}/functions/v1/hydra-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken || supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            message: prompt,
            model_id: modelId,
            role: 'assistant',
            system_prompt: systemPrompt,
            temperature: 0.7,
            max_tokens: 8192,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`${response.status}: ${errText}`);
        }

        // Read SSE stream
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';
        let tokenCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;

            // Skip provider metadata events
            if (line.startsWith('event:')) continue;

            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                accumulated += content;
                tokenCount++;
                // Update streaming preview
                setState(prev => ({
                  ...prev,
                  streamingTexts: { ...prev.streamingTexts, [modelId]: accumulated },
                }));
              }
            } catch {
              // partial JSON, skip
            }
          }
        }

        const elapsed = Date.now() - startTime;

        const updatedResult = {
          ...result,
          response_text: accumulated,
          response_time_ms: elapsed,
          token_count: tokenCount,
          status: 'ready' as const,
        };

        // Write final result
        await updateResult(result.id, {
          response_text: accumulated,
          response_time_ms: elapsed,
          token_count: tokenCount,
          status: 'ready',
        } as any);

        completedResults.push(updatedResult);

      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error(`[contest-exec] ${modelId} failed:`, err);
        await updateResult(result.id, {
          status: 'failed',
          metadata: { error: err.message } as any,
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
