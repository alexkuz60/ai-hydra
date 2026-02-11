import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ContestResult, ContestRound, ContestSession } from './useContestSession';

interface ExecutionState {
  running: boolean;
  /** model_id → accumulated text so far (for live preview) */
  streamingTexts: Record<string, string>;
}

/**
 * Sends the round prompt to every contestant model in parallel via hydra-stream,
 * collects responses and writes them back into contest_results.
 */
export function useContestExecution() {
  const { toast } = useToast();
  const [state, setState] = useState<ExecutionState>({ running: false, streamingTexts: {} });
  const abortRef = useRef<AbortController | null>(null);

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

    setState({ running: true, streamingTexts: {} });

    const prompt = round.prompt;
    const systemPrompt = session.config.arbitration
      ? `You are a contestant in an AI model competition. Answer the prompt as best you can.`
      : undefined;

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
            max_tokens: 4096,
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

        // Write final result
        await updateResult(result.id, {
          response_text: accumulated,
          response_time_ms: elapsed,
          token_count: tokenCount,
          status: 'ready',
        } as any);

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

    setState({ running: false, streamingTexts: {} });
    abortRef.current = null;
  }, [toast]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState({ running: false, streamingTexts: {} });
  }, []);

  return {
    executing: state.running,
    streamingTexts: state.streamingTexts,
    executeRound,
    cancelExecution: cancel,
  };
}
