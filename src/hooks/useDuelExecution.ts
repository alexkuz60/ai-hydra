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
    allRounds: ContestRound[],
    updateResult: (id: string, updates: Partial<ContestResult>) => Promise<void>,
    duelConfig: DuelConfigData,
  ) => {
    let roundResults = allResults.filter(r => r.round_id === round.id);

    // If no results exist for this round, create them (rounds 1+ aren't pre-populated)
    if (roundResults.length === 0) {
      const modelA_ = duelConfig.modelA!;
      const modelB_ = duelConfig.modelB!;
      const { data: newResults } = await supabase
        .from('contest_results')
        .insert([modelA_, modelB_].map(modelId => ({
          round_id: round.id,
          session_id: session.id,
          model_id: modelId,
          status: 'pending',
        })))
        .select();

      if (!newResults || newResults.length === 0) return;
      roundResults = newResults as unknown as ContestResult[];

      // Update round status to running
      await supabase.from('contest_rounds')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', round.id);

      // Note: new results will be picked up by realtime subscription in useDuelSession
    }

    const abortController = new AbortController();
    abortRef.current = abortController;
    setState({ executing: true, streamingTexts: {}, arbiterRunning: false });

    const modelA = duelConfig.modelA!;
    const modelB = duelConfig.modelB!;
    const originalPrompt = duelConfig.duelPrompt;

    // Build prompts for this round (cross-pollination for round > 0)
    // Includes cumulative history: condensed excerpts of earlier rounds + full previous round
    const buildPromptForModel = (modelId: string): string => {
      if (round.round_index === 0) return originalPrompt;

      const opponentId = modelId === modelA ? modelB : modelA;

      // Collect all previous rounds in order
      const prevRoundsSorted = allRounds
        .filter(r => r.round_index < round.round_index)
        .sort((a, b) => a.round_index - b.round_index);

      if (prevRoundsSorted.length === 0) return originalPrompt;

      const EXCERPT_LENGTH = 300; // chars for condensed earlier rounds
      const sections: string[] = [originalPrompt, '\n---'];

      if (isRu) {
        sections.push('## История дебатов');
      } else {
        sections.push('## Debate History');
      }

      for (let i = 0; i < prevRoundsSorted.length; i++) {
        const prevRound = prevRoundsSorted[i];
        const isLastPrevRound = i === prevRoundsSorted.length - 1;

        const ownResult = allResults.find(r => r.round_id === prevRound.id && r.model_id === modelId);
        const oppResult = allResults.find(r => r.round_id === prevRound.id && r.model_id === opponentId);

        const ownText = ownResult?.response_text || (isRu ? '(нет ответа)' : '(no response)');
        const oppText = oppResult?.response_text || (isRu ? '(нет ответа)' : '(no response)');

        // Full text for the last previous round, condensed for earlier ones
        const formatText = (text: string) => {
          if (isLastPrevRound) return text;
          if (text.length <= EXCERPT_LENGTH) return text;
          return text.slice(0, EXCERPT_LENGTH) + '…';
        };

        const roundLabel = isRu ? `Раунд ${prevRound.round_index + 1}` : `Round ${prevRound.round_index + 1}`;
        const condensedNote = !isLastPrevRound && ownText.length > EXCERPT_LENGTH
          ? (isRu ? ' (сокращено)' : ' (condensed)')
          : '';

        sections.push(`\n### ${roundLabel}${condensedNote}`);
        sections.push(isRu ? '**Ваш аргумент:**' : '**Your argument:**');
        sections.push(formatText(ownText));
        sections.push(isRu ? '**Аргумент противника:**' : '**Opponent\'s argument:**');
        sections.push(formatText(oppText));
      }

      sections.push('\n---');
      sections.push(
        isRu
          ? 'Сформулируйте свой следующий аргумент, учитывая всю историю дебатов и позицию противника.'
          : 'Formulate your next argument, considering the full debate history and the opponent\'s position.',
      );

      return sections.join('\n');
    };

    const systemPrompt = duelConfig.duelType === 'critic'
      ? (isRu
          ? 'Вы — эксперт-критик, участвующий в дуэли. Дайте аргументированную критическую оценку.'
          : 'You are an expert critic in a duel. Provide a well-argued critical evaluation.')
      : (isRu
          ? 'Вы — арбитр, участвующий в дуэли. Дайте справедливую и обоснованную оценку.'
          : 'You are an arbiter in a duel. Provide a fair and justified evaluation.');

    const completedResults: ContestResult[] = [];

    // Build and save both model prompts to round record for preview
    const promptA = buildPromptForModel(modelA);
    const promptB = buildPromptForModel(modelB);
    if (round.round_index > 0) {
      // Save promptA as the main prompt, encode promptB in a marker block at the end
      const combinedPrompt = promptA + '\n\n<!-- PROMPT_B_START -->\n' + promptB + '\n<!-- PROMPT_B_END -->';
      await supabase.from('contest_rounds')
        .update({ prompt: combinedPrompt })
        .eq('id', round.id);
    }

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
