import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { StepStatus } from '@/types/interview';

interface TestRunnerState {
  testing: boolean;
  currentStep: number;
  totalSteps: number;
  stepStatuses: Map<number, StepStatus>;
}

/**
 * Handles SSE-based test execution for interviews.
 * Separated from session CRUD for clarity and reusability.
 */
export function useInterviewTestRunner(onComplete?: (sessionId: string) => Promise<void>) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [state, setState] = useState<TestRunnerState>({
    testing: false,
    currentStep: -1,
    totalSteps: 0,
    stepStatuses: new Map(),
  });

  const abortRef = useRef<AbortController | null>(null);

  // ── SSE event handler ──

  const handleSSEEvent = useCallback((event: string, payload: any) => {
    switch (event) {
      case 'start':
        setState(prev => ({ ...prev, totalSteps: payload.total_steps }));
        break;
      case 'step_start':
        setState(prev => {
          const newMap = new Map(prev.stepStatuses);
          newMap.set(payload.step_index, { status: 'running' });
          return { ...prev, currentStep: payload.step_index, stepStatuses: newMap };
        });
        break;
      case 'step_skipped':
        setState(prev => {
          const newMap = new Map(prev.stepStatuses);
          newMap.set(payload.step_index, { status: 'skipped' });
          return { ...prev, stepStatuses: newMap };
        });
        break;
      case 'step_progress':
        // Could update streaming preview here
        break;
      case 'step_complete':
        setState(prev => {
          const newMap = new Map(prev.stepStatuses);
          newMap.set(payload.step_index, {
            status: payload.status,
            elapsed_ms: payload.elapsed_ms,
            token_count: payload.token_count,
            error: payload.error,
          });
          return { ...prev, stepStatuses: newMap };
        });
        break;
      case 'complete':
        setState(prev => ({ ...prev, testing: false }));
        break;
    }
  }, []);

  // ── Run tests with SSE streaming ──

  const runTests = useCallback(async (sessionId: string, maxTokensOverride?: number) => {
    if (!user) return;

    const abortController = new AbortController();
    abortRef.current = abortController;

    setState({
      testing: true,
      currentStep: -1,
      totalSteps: 0,
      stepStatuses: new Map(),
    });

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const authToken = authSession?.access_token;

      const response = await fetch(`${supabaseUrl}/functions/v1/interview-test-runner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ session_id: sessionId, language, max_tokens_override: maxTokensOverride }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${response.status}: ${errText}`);
      }

      // Parse SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);

          if (line.startsWith('event: ')) {
            const eventName = line.slice(7);
            const dataIdx = buffer.indexOf('\n');
            if (dataIdx === -1) {
              buffer = line + '\n' + buffer;
              break;
            }
            const dataLine = buffer.slice(0, dataIdx).trim();
            buffer = buffer.slice(dataIdx + 1);

            if (dataLine.startsWith('data: ')) {
              try {
                const payload = JSON.parse(dataLine.slice(6));
                handleSSEEvent(eventName, payload);
              } catch { /* parse error */ }
            }
          }
        }
      }

      // Reload session to get final test_results
      if (onComplete) await onComplete(sessionId);
      toast({ description: isRu ? 'Тестирование завершено' : 'Testing completed' });

    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast({ description: isRu ? 'Тестирование отменено' : 'Testing cancelled' });
      } else {
        toast({ variant: 'destructive', description: isRu ? `Ошибка тестирования: ${err.message}` : `Testing error: ${err.message}` });
      }
    } finally {
      setState(prev => ({ ...prev, testing: false }));
      abortRef.current = null;
    }
  }, [user, language, toast, isRu, handleSSEEvent, onComplete]);

  // ── Cancel ──

  const cancelTests = useCallback(() => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, testing: false }));
  }, []);

  return {
    testing: state.testing,
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    stepStatuses: state.stepStatuses,
    runTests,
    cancelTests,
  };
}
