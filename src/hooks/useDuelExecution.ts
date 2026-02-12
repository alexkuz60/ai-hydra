import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import type { ContestSession, ContestRound, ContestResult } from './useContestSession';
import type { DuelConfigData } from './useDuelConfig';

interface DuelExecutionState {
  executing: boolean;
  streamingTexts: Record<string, string>;
  arbiterRunning: boolean;
}

/**
 * Executes a duel round: sends prompts to both models (with cross-pollination),
 * then triggers arbiter evaluation.
 */
export function useDuelExecution() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const [state, setState] = useState<DuelExecutionState>({ executing: false, streamingTexts: {}, arbiterRunning: false });
  const abortRef = useRef<AbortController | null>(null);

  const executeDuelRound = useCallback(async (
    session: ContestSession,
    round: ContestRound,
    allResults: ContestResult[],
    updateResult: (id: string, updates: Partial<ContestResult>) => Promise<void>,
    duelConfig: DuelConfigData,
  ) => {
    const roundResults = allResults.filter(r => r.round_id === round.id);
    if (roundResults.length === 0) return;

    const abortController = new AbortController();
    abortRef.current = abortController;
    setState({ executing: true, streamingTexts: {}, arbiterRunning: false });

    const modelA = duelConfig.modelA!;
    const modelB = duelConfig.modelB!;
    const originalPrompt = duelConfig.duelPrompt;

    // Build prompts for this round (cross-pollination for round > 0)
    const buildPromptForModel = (modelId: string): string => {
      if (round.round_index === 0) return originalPrompt;

      const opponentId = modelId === modelA ? modelB : modelA;
      const prevRounds = (session.config.rules?.rounds || [])
        .map((_, i) => i)
        .filter(i => i < round.round_index);

      // Find the most recent previous round results
      const prevRoundIndex = round.round_index - 1;
      const prevResults = allResults.filter(r => {
        // Match by round_index via finding the round
        return true; // We'll match via status below
      });

      // Find previous round's results for both models
      const ownPrev = allResults.find(r =>
        r.model_id === modelId && r.response_text && r.status === 'judged' &&
        r.round_id !== round.id
      );
      const oppPrev = allResults.find(r =>
        r.model_id === opponentId && r.response_text && r.status === 'judged' &&
        r.round_id !== round.id
      );

      // Sort by created_at desc to get the latest
      const ownLatest = allResults
        .filter(r => r.model_id === modelId && r.response_text && r.round_id !== round.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      const oppLatest = allResults
        .filter(r => r.model_id === opponentId && r.response_text && r.round_id !== round.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

      return [
        originalPrompt,
        '---',
        isRu ? 'Ваш предыдущий аргумент:' : 'Your previous argument:',
        ownLatest?.response_text || (isRu ? '(нет)' : '(none)'),
        '',
        isRu ? 'Аргумент противника:' : 'Opponent\'s argument:',
        oppLatest?.response_text || (isRu ? '(нет)' : '(none)'),
        '---',
        isRu
          ? 'Сформулируйте свой следующий аргумент, учитывая позицию противника.'
          : 'Formulate your next argument, considering the opponent\'s position.',
      ].join('\n');
    };

    const systemPrompt = duelConfig.duelType === 'critic'
      ? (isRu
          ? 'Вы — эксперт-критик, участвующий в дуэли. Дайте аргументированную критическую оценку.'
          : 'You are an expert critic in a duel. Provide a well-argued critical evaluation.')
      : (isRu
          ? 'Вы — арбитр, участвующий в дуэли. Дайте справедливую и обоснованную оценку.'
          : 'You are an arbiter in a duel. Provide a fair and justified evaluation.');

    const completedResults: ContestResult[] = [];

    // Execute both models sequentially (to allow cross-reference for round > 0)
    for (const result of roundResults) {
      const modelId = result.model_id;
      const prompt = buildPromptForModel(modelId);
      const startTime = Date.now();

      await updateResult(result.id, { status: 'generating' } as any);

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
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
            max_tokens: 4096,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`${response.status}: ${errText}`);
        }

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
            if (line.startsWith(':') || line.trim() === '' || line.startsWith('event:')) continue;
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                accumulated += content;
                tokenCount++;
                setState(prev => ({
                  ...prev,
                  streamingTexts: { ...prev.streamingTexts, [modelId]: accumulated },
                }));
              }
            } catch { /* skip partial JSON */ }
          }
        }

        const elapsed = Date.now() - startTime;
        await updateResult(result.id, {
          response_text: accumulated,
          response_time_ms: elapsed,
          token_count: tokenCount,
          status: 'ready',
        } as any);

        completedResults.push({ ...result, response_text: accumulated, response_time_ms: elapsed, token_count: tokenCount, status: 'ready' as const });

      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error(`[duel-exec] ${modelId} failed:`, err);
        await updateResult(result.id, { status: 'failed', metadata: { error: err.message } as any } as any);
      }
    }

    // Mark round as completed
    await supabase.from('contest_rounds')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', round.id);

    setState(prev => ({ ...prev, executing: false, streamingTexts: {} }));
    abortRef.current = null;

    // Run arbiter evaluation
    if (completedResults.length === 2 && session.config.arbitration) {
      setState(prev => ({ ...prev, arbiterRunning: true }));
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const { data: { session: authSession } } = await supabase.auth.getSession();
        const authToken = authSession?.access_token;

        const arbResponse = await fetch(`${supabaseUrl}/functions/v1/contest-arbiter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken || supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            prompt: round.round_index === 0 ? originalPrompt : buildPromptForModel(modelA),
            responses: completedResults.map(r => ({
              result_id: r.id,
              model_id: r.model_id,
              response_text: r.response_text,
              response_time_ms: r.response_time_ms,
              token_count: r.token_count,
            })),
            criteria: duelConfig.criteria,
            criteria_weights: duelConfig.criteriaWeights || {},
            language,
          }),
        });

        if (arbResponse.ok) {
          const data = await arbResponse.json();
          for (const eval_ of (data.evaluations || [])) {
            if (eval_.arbiter_score != null) {
              const orig = completedResults.find(r => r.id === eval_.result_id);
              await updateResult(eval_.result_id, {
                arbiter_score: eval_.arbiter_score,
                arbiter_comment: eval_.arbiter_comment,
                arbiter_model: eval_.arbiter_model,
                criteria_scores: eval_.criteria_scores || {},
                status: 'judged',
                ...(orig ? { response_text: orig.response_text, response_time_ms: orig.response_time_ms, token_count: orig.token_count } : {}),
              } as any);
            }
          }
          toast({ description: isRu ? 'Арбитр оценил раунд дуэли' : 'Arbiter evaluated the duel round' });
        }
      } catch (err: any) {
        console.error('[duel-arbiter] Error:', err);
      } finally {
        setState(prev => ({ ...prev, arbiterRunning: false }));
      }

      // Auto-advance is handled by the caller (DuelArena) based on userEvaluation setting.
      // When userEvaluation is true, execution pauses for user to pick a winner.
      // When userEvaluation is false, DuelArena auto-advances after arbiter evaluation.
    }
  }, [toast, isRu, language]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState({ executing: false, streamingTexts: {}, arbiterRunning: false });
  }, []);

  return {
    executing: state.executing,
    arbiterRunning: state.arbiterRunning,
    streamingTexts: state.streamingTexts,
    executeDuelRound,
    cancelExecution: cancel,
  };
}
