import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import type { AgentRole } from '@/config/roles';
import type { PendingResponseState, RequestStartInfo } from '@/types/pending';
import type { ProviderInfo } from '@/types/messages';

export interface StreamingResponse {
  modelId: string;
  modelName: string;
  role: AgentRole;
  content: string;
  isStreaming: boolean;
  startTime: number;
  elapsedSeconds: number;
  status: PendingResponseState['status'];
  providerInfo?: ProviderInfo;
}

interface UseStreamingResponsesProps {
  sessionId: string | null;
  userId?: string | null;
  onStreamComplete?: (modelId: string, content: string) => void;
  onFallbackToOrchestrator?: (modelId: string, message: string) => void;
  onMessageSaved?: () => void;
}

interface UseStreamingResponsesReturn {
  streamingResponses: Map<string, StreamingResponse>;
  pendingResponses: Map<string, PendingResponseState>;
  startStreaming: (
    models: RequestStartInfo[],
    message: string,
    timeoutSeconds: number,
    perModelSettings?: Record<string, { temperature?: number; maxTokens?: number; systemPrompt?: string }>,
    userMessageContent?: string,
    streamContext?: { memoryContext?: Array<{ content: string; chunk_type: string; metadata?: Record<string, unknown> }>; history?: Array<{ role: string; content: string }> }
  ) => Promise<void>;
  stopStreaming: (modelId: string) => void;
  stopAllStreaming: () => void;
  clearCompleted: () => void;
}

type PerModelSettings = Record<string, { temperature?: number; maxTokens?: number; systemPrompt?: string }>;
type StreamContext = {
  memoryContext?: Array<{ content: string; chunk_type: string; metadata?: Record<string, unknown> }>;
  history?: Array<{ role: string; content: string }>;
};

// Models supported by Lovable AI gateway for streaming
const LOVABLE_AI_SUPPORTED_MODELS = [
  'openai/gpt-5-mini',
  'openai/gpt-5',
  'openai/gpt-5-nano',
  'openai/gpt-5.2',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-preview',
  'google/gemini-3-flash-preview',
  'google/gemini-3-pro-image-preview',
];

function isStreamingSupported(modelId: string): boolean {
  return LOVABLE_AI_SUPPORTED_MODELS.includes(modelId);
}

export function useStreamingResponses({
  sessionId,
  userId,
  onStreamComplete,
  onFallbackToOrchestrator,
  onMessageSaved,
}: UseStreamingResponsesProps): UseStreamingResponsesReturn {
  const [streamingResponses, setStreamingResponses] = useState<Map<string, StreamingResponse>>(new Map());
  const [pendingResponses, setPendingResponses] = useState<Map<string, PendingResponseState>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const timersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const streamingResponsesRef = useRef(streamingResponses);
  streamingResponsesRef.current = streamingResponses;

  // Stable refs for callbacks to avoid stale closures in long-running async functions
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const onStreamCompleteRef = useRef(onStreamComplete);
  onStreamCompleteRef.current = onStreamComplete;
  const onMessageSavedRef = useRef(onMessageSaved);
  onMessageSavedRef.current = onMessageSaved;
  const onFallbackToOrchestratorRef = useRef(onFallbackToOrchestrator);
  onFallbackToOrchestratorRef.current = onFallbackToOrchestrator;

  // Save AI response to database — stable, uses refs
  const saveAIResponseToDb = useCallback(async (
    modelId: string,
    modelName: string,
    role: string,
    content: string,
    providerInfo?: ProviderInfo
  ) => {
    const currentSessionId = sessionIdRef.current;
    const currentUserId = userIdRef.current;

    if (!currentSessionId || !currentUserId || !content.trim()) return;

    try {
      const metadata: Record<string, unknown> = {};
      if (providerInfo) {
        metadata.provider_info = providerInfo;
        if (providerInfo.fallback_from) {
          metadata.used_fallback = true;
          metadata.fallback_reason = 'error';
        }
      }

      const { error } = await supabase.from('messages').insert({
        session_id: currentSessionId,
        user_id: currentUserId,
        role: (role === 'assistant' ? 'assistant' : role) as 'user' | 'assistant' | 'critic' | 'arbiter' | 'consultant',
        content: content.trim(),
        model_name: modelName,
        metadata: Object.keys(metadata).length > 0 ? (metadata as unknown as Json) : null,
      });

      if (error) {
        toast.error(`Не удалось сохранить ответ ${modelName}`);
      } else {
        onMessageSavedRef.current?.();
      }
    } catch {
      // Silently ignore network errors during save
    }
  }, []); // no dependencies — uses refs exclusively

  // Fallback to orchestrator for a single model — stable
  const fallbackToOrchestrator = useCallback(async (
    model: RequestStartInfo,
    messageContent: string,
    perModelSettings?: PerModelSettings,
    fallbackReason?: 'rate_limit' | 'error' | 'unsupported'
  ) => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;

    onFallbackToOrchestratorRef.current?.(model.modelId, messageContent);

    try {
      const session = await supabase.auth.getSession();
      const settings = perModelSettings?.[model.modelId] || {};

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hydra-orchestrator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify({
            session_id: currentSessionId,
            message: messageContent,
            attachments: [],
            models: [{
              model_id: model.modelId,
              use_lovable_ai: !model.modelId.startsWith('openrouter/') && !model.modelId.startsWith('proxyapi/'),
              provider: model.modelId.split('/')[0],
              temperature: settings.temperature ?? 0.7,
              max_tokens: settings.maxTokens ?? 4096,
              system_prompt: settings.systemPrompt,
              role: model.role,
              enable_tools: false,
              fallback_metadata: fallbackReason ? {
                used_fallback: true,
                fallback_reason: fallbackReason,
              } : undefined,
            }],
          }),
        }
      );

      if (!response.ok) {
        setPendingResponses(prev => {
          const updated = new Map(prev);
          const existing = updated.get(model.modelId);
          if (existing) updated.set(model.modelId, { ...existing, status: 'timedout' });
          return updated;
        });
      } else {
        setPendingResponses(prev => {
          const updated = new Map(prev);
          updated.delete(model.modelId);
          return updated;
        });
      }
    } catch {
      setPendingResponses(prev => {
        const updated = new Map(prev);
        const existing = updated.get(model.modelId);
        if (existing) updated.set(model.modelId, { ...existing, status: 'timedout' });
        return updated;
      });
    }

    clearInterval(timersRef.current.get(model.modelId));
    timersRef.current.delete(model.modelId);
    abortControllersRef.current.delete(model.modelId);
  }, []); // stable — uses refs

  // Stream a single model — stable
  const streamModel = useCallback(async (
    model: RequestStartInfo,
    messageContent: string,
    controller: AbortController,
    startTime: number,
    modelSettings?: PerModelSettings,
    streamCtx?: StreamContext
  ) => {
    // Capture session at stream start — used to detect race condition at save time
    const capturedSessionId = sessionIdRef.current;
    const settings = modelSettings?.[model.modelId] || {};

    let proxyapi_settings: Record<string, unknown> | undefined;
    if (model.modelId.startsWith('proxyapi/') || model.modelId.includes('/')) {
      try {
        const saved = localStorage.getItem('proxyapi_settings');
        if (saved) proxyapi_settings = JSON.parse(saved) as Record<string, unknown>;
      } catch { /* ignore */ }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hydra-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            message: messageContent,
            model_id: model.modelId,
            role: model.role,
            temperature: settings.temperature,
            max_tokens: settings.maxTokens,
            system_prompt: settings.systemPrompt,
            memory_context: streamCtx?.memoryContext || [],
            history: streamCtx?.history || [],
            proxyapi_settings,
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.warning(`Превышен лимит. ${model.modelName} отправлен в очередь.`);
          await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
          await fallbackToOrchestrator(model, messageContent, modelSettings, 'rate_limit');
          return;
        }
        if (response.status === 500 || response.status === 400 || response.status === 401) {
          await fallbackToOrchestrator(model, messageContent, modelSettings, 'error');
          return;
        }
        handleStreamError(model.modelId, response.status);
        return;
      }

      if (!response.body) throw new Error('No response body');

      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      setStreamingResponses(prev => {
        const updated = new Map(prev);
        updated.set(model.modelId, {
          modelId: model.modelId,
          modelName: model.modelName,
          role: model.role,
          content: '',
          isStreaming: true,
          startTime,
          elapsedSeconds: elapsed,
          status: 'waiting',
        });
        return updated;
      });

      setPendingResponses(prev => {
        const updated = new Map(prev);
        updated.delete(model.modelId);
        return updated;
      });

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let providerInfo: ProviderInfo | undefined;
      let currentEventType = '';
      let doneSignalReceived = false;
      let consecutiveParseErrors = 0;

      try {
        while (!doneSignalReceived) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':')) continue;
            if (line.trim() === '') { currentEventType = ''; continue; }

            if (line.startsWith('event: ')) {
              currentEventType = line.slice(7).trim();
              continue;
            }

            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') { doneSignalReceived = true; break; }

            try {
              const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
              consecutiveParseErrors = 0; // reset on success

              if (currentEventType === 'provider') {
                providerInfo = parsed as unknown as ProviderInfo;
                setStreamingResponses(prev => {
                  const updated = new Map(prev);
                  const existing = updated.get(model.modelId);
                  if (existing) updated.set(model.modelId, { ...existing, providerInfo });
                  return updated;
                });
                currentEventType = '';
                continue;
              }

              const choices = parsed.choices as Array<{ delta?: { content?: string } }> | undefined;
              const delta = choices?.[0]?.delta?.content;

              if (delta) {
                accumulatedContent += delta;
                setStreamingResponses(prev => {
                  const updated = new Map(prev);
                  const existing = updated.get(model.modelId);
                  if (existing) updated.set(model.modelId, { ...existing, content: accumulatedContent });
                  return updated;
                });
              }
            } catch {
              // Incomplete JSON chunk — tolerate up to 50 consecutive errors, then bail
              consecutiveParseErrors++;
              if (consecutiveParseErrors > 50) {
                reader.cancel();
                break;
              }
            }
          }
        }
      } finally {
        // Always release the reader lock, even on abort
        try { reader.cancel(); } catch { /* already released */ }
      }

      // Stream complete — clean up
      clearInterval(timersRef.current.get(model.modelId));
      timersRef.current.delete(model.modelId);
      abortControllersRef.current.delete(model.modelId);

      setStreamingResponses(prev => {
        const updated = new Map(prev);
        const existing = updated.get(model.modelId);
        if (existing) {
          updated.set(model.modelId, {
            ...existing,
            content: accumulatedContent,
            isStreaming: false,
            providerInfo,
          });
        }
        return updated;
      });

      if (accumulatedContent.trim()) {
        // Race condition guard: only save if session hasn't changed since stream started
        if (sessionIdRef.current === capturedSessionId) {
          await saveAIResponseToDb(model.modelId, model.modelName, model.role, accumulatedContent, providerInfo);
        }
        // Always fire completion callback regardless of session (caller decides)
        onStreamCompleteRef.current?.(model.modelId, accumulatedContent);
      }

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      await fallbackToOrchestrator(model, messageContent, modelSettings);
    }

  }, [fallbackToOrchestrator, saveAIResponseToDb]);

  // Stop streaming for a specific model
  const stopStreaming = useCallback((modelId: string) => {
    abortControllersRef.current.get(modelId)?.abort();
    abortControllersRef.current.delete(modelId);

    const timer = timersRef.current.get(modelId);
    if (timer) { clearInterval(timer); timersRef.current.delete(modelId); }

    const accumulatedContent = streamingResponsesRef.current.get(modelId)?.content || '';

    setStreamingResponses(prev => {
      const updated = new Map(prev);
      const existing = updated.get(modelId);
      if (existing) updated.set(modelId, { ...existing, isStreaming: false });
      return updated;
    });

    setPendingResponses(prev => {
      const updated = new Map(prev);
      updated.delete(modelId);
      return updated;
    });

    if (accumulatedContent.trim().length > 0) {
      onStreamCompleteRef.current?.(modelId, accumulatedContent);
    }
  }, []);

  // Stop all streaming
  const stopAllStreaming = useCallback(() => {
    abortControllersRef.current.forEach(c => c.abort());
    abortControllersRef.current.clear();
    timersRef.current.forEach(t => clearInterval(t));
    timersRef.current.clear();

    const responsesToSave: Array<{ modelId: string; content: string }> = [];
    for (const [key, value] of streamingResponsesRef.current) {
      if (value.content?.trim().length > 0) {
        responsesToSave.push({ modelId: key, content: value.content });
      }
    }

    setStreamingResponses(prev => {
      const updated = new Map(prev);
      for (const [key, value] of updated) updated.set(key, { ...value, isStreaming: false });
      return updated;
    });

    setPendingResponses(new Map());

    responsesToSave.forEach(({ modelId, content }) => {
      onStreamCompleteRef.current?.(modelId, content);
    });
  }, []);

  // Clear completed (non-streaming) responses
  const clearCompleted = useCallback(() => {
    setStreamingResponses(prev => {
      const updated = new Map(prev);
      for (const [key, value] of updated) {
        if (!value.isStreaming) updated.delete(key);
      }
      return updated;
    });
  }, []);

  function handleStreamError(modelId: string, status: number) {
    if (status === 429) {
      toast.error('Превышен лимит запросов. Попробуйте позже.');
    } else if (status === 402) {
      toast.error('Требуется пополнение баланса Lovable AI.');
    } else {
      toast.error(`Ошибка модели ${modelId}: ${status}`);
    }

    setPendingResponses(prev => {
      const updated = new Map(prev);
      const existing = updated.get(modelId);
      if (existing) updated.set(modelId, { ...existing, status: 'timedout' });
      return updated;
    });

    clearInterval(timersRef.current.get(modelId));
    timersRef.current.delete(modelId);
    abortControllersRef.current.delete(modelId);
  }

  // Start parallel streaming for multiple models
  const startStreaming = useCallback(async (
    models: RequestStartInfo[],
    message: string,
    timeoutSeconds: number,
    perModelSettings?: PerModelSettings,
    _userMessageContent?: string,
    streamContext?: StreamContext
  ) => {
    const now = Date.now();

    const streamableModels = models.filter(m => isStreamingSupported(m.modelId));
    const nonStreamableModels = models.filter(m => !isStreamingSupported(m.modelId));

    // Fallback non-streaming models immediately
    nonStreamableModels.forEach(model => {
      fallbackToOrchestrator(model, message, perModelSettings, 'unsupported');
    });

    // Initialize pending responses for skeleton display
    setPendingResponses(prev => {
      const updated = new Map(prev);
      streamableModels.forEach(m => {
        updated.set(m.modelId, {
          modelId: m.modelId,
          modelName: m.modelName,
          role: m.role,
          status: 'sent',
          startTime: now,
          elapsedSeconds: 0,
        });
      });
      return updated;
    });

    // Start elapsed timers and staggered stream requests
    streamableModels.forEach((model, index) => {
      const controller = new AbortController();
      abortControllersRef.current.set(model.modelId, controller);

      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - now) / 1000);

        setPendingResponses(prev => {
          const updated = new Map(prev);
          const existing = updated.get(model.modelId);
          if (existing) {
            let status: PendingResponseState['status'] = 'sent';
            if (elapsed >= timeoutSeconds) status = 'timedout';
            else if (elapsed >= 5) status = 'waiting';
            else if (elapsed >= 2) status = 'confirmed';
            updated.set(model.modelId, { ...existing, elapsedSeconds: elapsed, status });
          }
          return updated;
        });

        setStreamingResponses(prev => {
          const updated = new Map(prev);
          const existing = updated.get(model.modelId);
          if (existing?.isStreaming) {
            updated.set(model.modelId, { ...existing, elapsedSeconds: elapsed });
          }
          return updated;
        });
      }, 1000);

      timersRef.current.set(model.modelId, timer);

      // Stagger 150ms between models to reduce rate-limit pressure
      setTimeout(() => {
        if (!controller.signal.aborted) {
          streamModel(model, message, controller, now, perModelSettings, streamContext);
        }
      }, index * 150);
    });
  }, [fallbackToOrchestrator, streamModel]);

  return {
    streamingResponses,
    pendingResponses,
    startStreaming,
    stopStreaming,
    stopAllStreaming,
    clearCompleted,
  };
}
