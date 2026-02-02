import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { AgentRole } from '@/config/roles';
import type { PendingResponseState, RequestStartInfo } from '@/types/pending';

export interface StreamingResponse {
  modelId: string;
  modelName: string;
  role: AgentRole;
  content: string;
  isStreaming: boolean;
  startTime: number;
  elapsedSeconds: number;
  status: PendingResponseState['status'];
}

interface UseStreamingResponsesProps {
  sessionId: string | null;
  onStreamComplete?: (modelId: string, content: string) => void;
  onFallbackToOrchestrator?: (modelId: string, message: string) => void;
}

interface UseStreamingResponsesReturn {
  streamingResponses: Map<string, StreamingResponse>;
  pendingResponses: Map<string, PendingResponseState>;
  startStreaming: (
    models: RequestStartInfo[],
    message: string,
    timeoutSeconds: number,
    perModelSettings?: Record<string, { temperature?: number; maxTokens?: number; systemPrompt?: string }>
  ) => void;
  stopStreaming: (modelId: string) => void;
  stopAllStreaming: () => void;
  clearCompleted: () => void;
}

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
  onStreamComplete,
  onFallbackToOrchestrator,
}: UseStreamingResponsesProps): UseStreamingResponsesReturn {
  const [streamingResponses, setStreamingResponses] = useState<Map<string, StreamingResponse>>(new Map());
  const [pendingResponses, setPendingResponses] = useState<Map<string, PendingResponseState>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Stop streaming for a specific model
  const stopStreaming = useCallback((modelId: string) => {
    const controller = abortControllersRef.current.get(modelId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(modelId);
    }
    
    const timer = timersRef.current.get(modelId);
    if (timer) {
      clearInterval(timer);
      timersRef.current.delete(modelId);
    }

    // Get the current content before marking as complete
    const currentResponse = streamingResponses.get(modelId);
    const accumulatedContent = currentResponse?.content || '';

    // Mark as complete (not streaming)
    setStreamingResponses(prev => {
      const updated = new Map(prev);
      const existing = updated.get(modelId);
      if (existing) {
        updated.set(modelId, { ...existing, isStreaming: false });
      }
      return updated;
    });

    // Remove from pending
    setPendingResponses(prev => {
      const updated = new Map(prev);
      updated.delete(modelId);
      return updated;
    });

    // If there was content, notify completion so it gets saved to DB
    if (accumulatedContent.trim().length > 0) {
      onStreamComplete?.(modelId, accumulatedContent);
    }
  }, [streamingResponses, onStreamComplete]);

  // Stop all streaming
  const stopAllStreaming = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();
    
    timersRef.current.forEach(timer => clearInterval(timer));
    timersRef.current.clear();

    // Collect all responses with content before marking as stopped
    const responsesToSave: Array<{ modelId: string; content: string }> = [];
    
    setStreamingResponses(prev => {
      const updated = new Map(prev);
      for (const [key, value] of updated) {
        if (value.content?.trim().length > 0) {
          responsesToSave.push({ modelId: key, content: value.content });
        }
        updated.set(key, { ...value, isStreaming: false });
      }
      return updated;
    });

    setPendingResponses(new Map());

    // Notify completion for all responses that had content
    responsesToSave.forEach(({ modelId, content }) => {
      onStreamComplete?.(modelId, content);
    });
  }, [streamingResponses, onStreamComplete]);

  // Clear completed (non-streaming) responses
  const clearCompleted = useCallback(() => {
    setStreamingResponses(prev => {
      const updated = new Map(prev);
      for (const [key, value] of updated) {
        if (!value.isStreaming) {
          updated.delete(key);
        }
      }
      return updated;
    });
  }, []);

  // Fallback to orchestrator for a single model
  const fallbackToOrchestrator = useCallback(async (
    model: RequestStartInfo,
    messageContent: string,
    perModelSettings?: Record<string, { temperature?: number; maxTokens?: number; systemPrompt?: string }>
  ) => {
    if (!sessionId) {
      console.error('[Streaming] Cannot fallback: no sessionId');
      return;
    }

    console.log(`[Streaming] Fallback to orchestrator for ${model.modelId}`);

    // Notify parent about fallback (optional callback)
    onFallbackToOrchestrator?.(model.modelId, messageContent);

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
            session_id: sessionId,
            message: messageContent,
            attachments: [],
            models: [{
              model_id: model.modelId,
              use_lovable_ai: !model.modelId.startsWith('openrouter/'),
              provider: model.modelId.split('/')[0],
              temperature: settings.temperature ?? 0.7,
              max_tokens: settings.maxTokens ?? 4096,
              system_prompt: settings.systemPrompt,
              role: model.role,
              enable_tools: false, // Disable tools for fallback
            }],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[Streaming] Orchestrator fallback failed:`, errorData);
        
        // Mark as failed
        setPendingResponses(prev => {
          const updated = new Map(prev);
          const existing = updated.get(model.modelId);
          if (existing) {
            updated.set(model.modelId, { ...existing, status: 'timedout' });
          }
          return updated;
        });
      } else {
        // Success - orchestrator will save to DB, remove from pending
        setPendingResponses(prev => {
          const updated = new Map(prev);
          updated.delete(model.modelId);
          return updated;
        });
      }
    } catch (error) {
      console.error(`[Streaming] Orchestrator fallback error:`, error);
      
      setPendingResponses(prev => {
        const updated = new Map(prev);
        const existing = updated.get(model.modelId);
        if (existing) {
          updated.set(model.modelId, { ...existing, status: 'timedout' });
        }
        return updated;
      });
    }

    // Cleanup timers
    clearInterval(timersRef.current.get(model.modelId));
    timersRef.current.delete(model.modelId);
    abortControllersRef.current.delete(model.modelId);
  }, [sessionId, onFallbackToOrchestrator]);

  // Start parallel streaming for multiple models
  const startStreaming = useCallback((
    models: RequestStartInfo[],
    message: string,
    timeoutSeconds: number,
    perModelSettings?: Record<string, { temperature?: number; maxTokens?: number; systemPrompt?: string }>
  ) => {
    const now = Date.now();

    // Separate models: streamable vs non-streamable
    const streamableModels = models.filter(m => isStreamingSupported(m.modelId));
    const nonStreamableModels = models.filter(m => !isStreamingSupported(m.modelId));

    // Immediately fallback non-streaming models to orchestrator
    nonStreamableModels.forEach(model => {
      console.log(`[Streaming] Model ${model.modelId} doesn't support streaming, using orchestrator`);
      fallbackToOrchestrator(model, message, perModelSettings);
    });

    // Initialize pending responses for skeleton display (only streamable)
    const newPending = new Map<string, PendingResponseState>();
    streamableModels.forEach(m => {
      newPending.set(m.modelId, {
        modelId: m.modelId,
        modelName: m.modelName,
        role: m.role,
        status: 'sent',
        startTime: now,
        elapsedSeconds: 0,
      });
    });
    setPendingResponses(prev => {
      const updated = new Map(prev);
      for (const [key, value] of newPending) {
        updated.set(key, value);
      }
      return updated;
    });

    // Start a stream for each streamable model
    streamableModels.forEach(model => {
      const controller = new AbortController();
      abortControllersRef.current.set(model.modelId, controller);

      // Start elapsed time timer
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
          if (existing && existing.isStreaming) {
            updated.set(model.modelId, { ...existing, elapsedSeconds: elapsed });
          }
          return updated;
        });
      }, 1000);
      timersRef.current.set(model.modelId, timer);

      // Start the SSE stream
      streamModel(model, message, controller, now, perModelSettings);
    });

    async function streamModel(
      model: RequestStartInfo,
      messageContent: string,
      controller: AbortController,
      startTime: number,
      modelSettings?: Record<string, { temperature?: number; maxTokens?: number; systemPrompt?: string }>
    ) {
      const settings = modelSettings?.[model.modelId] || {};
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hydra-stream`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              message: messageContent,
              model_id: model.modelId,
              role: model.role,
              temperature: settings.temperature,
              max_tokens: settings.maxTokens,
              system_prompt: settings.systemPrompt,
            }),
            signal: controller.signal,
          }
        );

        // Handle error responses - FALLBACK TO ORCHESTRATOR on 500
        if (!response.ok) {
          if (response.status === 500 || response.status === 400 || response.status === 401) {
            console.log(`[Streaming] Error ${response.status} for ${model.modelId}, falling back to orchestrator`);
            await fallbackToOrchestrator(model, messageContent, modelSettings);
            return;
          }
          
          handleStreamError(model.modelId, response.status);
          return;
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        // First token received - transition from skeleton to streaming
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        
        // Initialize streaming response
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

        // Remove from pending (skeleton will be replaced by streaming content)
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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process line by line
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            // Handle CRLF
            if (line.endsWith('\r')) {
              line = line.slice(0, -1);
            }

            // Skip comments and empty lines
            if (line.startsWith(':') || line.trim() === '') continue;

            // Only process data lines
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              
              if (delta) {
                accumulatedContent += delta;
                // Update streaming content in real-time
                setStreamingResponses(prev => {
                  const updated = new Map(prev);
                  const existing = updated.get(model.modelId);
                  if (existing) {
                    updated.set(model.modelId, { ...existing, content: accumulatedContent });
                  }
                  return updated;
                });
              }
            } catch {
              // Incomplete JSON, will be handled in next iteration
            }
          }
        }

        // Stream complete
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
              isStreaming: false 
            });
          }
          return updated;
        });

        // Notify completion
        onStreamComplete?.(model.modelId, accumulatedContent);

      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          // User cancelled
          return;
        }
        
        console.error(`[Streaming] Error for ${model.modelId}:`, error);
        
        // FALLBACK TO ORCHESTRATOR on any error
        console.log(`[Streaming] Error for ${model.modelId}, falling back to orchestrator`);
        await fallbackToOrchestrator(model, messageContent, modelSettings);
      }
    }

    function handleStreamError(modelId: string, status: number) {
      if (status === 429) {
        toast.error('Превышен лимит запросов. Попробуйте позже.');
      } else if (status === 402) {
        toast.error('Требуется пополнение баланса Lovable AI.');
      } else {
        toast.error(`Ошибка модели ${modelId}: ${status}`);
      }

      // Mark as timedout for retry options
      setPendingResponses(prev => {
        const updated = new Map(prev);
        const existing = updated.get(modelId);
        if (existing) {
          updated.set(modelId, { ...existing, status: 'timedout' });
        }
        return updated;
      });

      clearInterval(timersRef.current.get(modelId));
      timersRef.current.delete(modelId);
      abortControllersRef.current.delete(modelId);
    }
  }, [onStreamComplete, fallbackToOrchestrator]);

  return {
    streamingResponses,
    pendingResponses,
    startStreaming,
    stopStreaming,
    stopAllStreaming,
    clearCompleted,
  };
}
