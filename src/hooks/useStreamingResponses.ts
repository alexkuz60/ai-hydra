import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
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
  onStreamComplete?: (modelId: string, content: string) => void;
}

interface UseStreamingResponsesReturn {
  streamingResponses: Map<string, StreamingResponse>;
  pendingResponses: Map<string, PendingResponseState>;
  startStreaming: (
    models: RequestStartInfo[],
    message: string,
    timeoutSeconds: number
  ) => void;
  stopStreaming: (modelId: string) => void;
  stopAllStreaming: () => void;
  clearCompleted: () => void;
}

export function useStreamingResponses({
  onStreamComplete,
}: UseStreamingResponsesProps = {}): UseStreamingResponsesReturn {
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

    // Mark as complete
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
  }, []);

  // Stop all streaming
  const stopAllStreaming = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();
    
    timersRef.current.forEach(timer => clearInterval(timer));
    timersRef.current.clear();

    setStreamingResponses(prev => {
      const updated = new Map(prev);
      for (const [key, value] of updated) {
        updated.set(key, { ...value, isStreaming: false });
      }
      return updated;
    });

    setPendingResponses(new Map());
  }, []);

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

  // Start parallel streaming for multiple models
  const startStreaming = useCallback((
    models: RequestStartInfo[],
    message: string,
    timeoutSeconds: number
  ) => {
    const now = Date.now();

    // Initialize pending responses for skeleton display
    const newPending = new Map<string, PendingResponseState>();
    models.forEach(m => {
      newPending.set(m.modelId, {
        modelId: m.modelId,
        modelName: m.modelName,
        role: m.role,
        status: 'sent',
        startTime: now,
        elapsedSeconds: 0,
      });
    });
    setPendingResponses(newPending);

    // Start a stream for each model
    models.forEach(model => {
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
      streamModel(model, message, controller, now);
    });

    async function streamModel(
      model: RequestStartInfo,
      messageContent: string,
      controller: AbortController,
      startTime: number
    ) {
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
            }),
            signal: controller.signal,
          }
        );

        // Handle error responses
        if (!response.ok) {
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
        
        // Keep skeleton on error, mark as timedout for retry options
        setPendingResponses(prev => {
          const updated = new Map(prev);
          const existing = updated.get(model.modelId);
          if (existing) {
            updated.set(model.modelId, { ...existing, status: 'timedout' });
          } else {
            // Re-add to pending if it was removed
            updated.set(model.modelId, {
              modelId: model.modelId,
              modelName: model.modelName,
              role: model.role,
              status: 'timedout',
              startTime: Date.now(),
              elapsedSeconds: 0,
            });
          }
          return updated;
        });

        // Remove from streaming
        setStreamingResponses(prev => {
          const updated = new Map(prev);
          updated.delete(model.modelId);
          return updated;
        });

        clearInterval(timersRef.current.get(model.modelId));
        timersRef.current.delete(model.modelId);
        abortControllersRef.current.delete(model.modelId);
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
  }, [onStreamComplete]);

  return {
    streamingResponses,
    pendingResponses,
    startStreaming,
    stopStreaming,
    stopAllStreaming,
    clearCompleted,
  };
}
