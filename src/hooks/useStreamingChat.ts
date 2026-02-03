import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export type ConsultantMode = 'web_search' | 'expert' | 'critic' | 'arbiter' | 'moderator';

export interface StreamingMessage {
  id: string;
  role: 'user' | 'consultant';
  content: string;
  mode: ConsultantMode;
  model_name: string | null;
  created_at: string;
  isStreaming?: boolean;
  sourceMessageId?: string | null;
}

interface MemoryChunk {
  content: string;
  chunk_type: string;
  metadata?: Record<string, unknown>;
}

interface UseStreamingChatProps {
  sessionId: string | null;
}

interface UseStreamingChatReturn {
  messages: StreamingMessage[];
  streaming: boolean;
  sendQuery: (
    content: string,
    mode: ConsultantMode,
    modelId: string,
    sourceMessageId?: string | null,
    hideUserMessage?: boolean,
    memoryContext?: MemoryChunk[]
  ) => Promise<void>;
  stopStreaming: () => void;
  clearMessages: () => void;
}

// Map consultant mode to role for edge function
const modeToRole: Record<ConsultantMode, string> = {
  web_search: 'consultant',
  expert: 'assistant',
  critic: 'critic',
  arbiter: 'arbiter',
  moderator: 'moderator',
};

export function useStreamingChat({
  sessionId,
}: UseStreamingChatProps): UseStreamingChatReturn {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreaming(false);
  }, []);

  const sendQuery = useCallback(
    async (
      content: string,
      mode: ConsultantMode,
      modelId: string,
      sourceMessageId?: string | null,
      hideUserMessage?: boolean,
      memoryContext?: MemoryChunk[]
    ) => {
      if (!sessionId || !content.trim() || !modelId) return;

      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setStreaming(true);

      // Create assistant message placeholder
      const assistantId = crypto.randomUUID();
      const assistantMessage: StreamingMessage = {
        id: assistantId,
        role: 'consultant',
        content: '',
        mode,
        model_name: modelId,
        created_at: new Date().toISOString(),
        isStreaming: true,
        sourceMessageId: sourceMessageId || null,
      };

      // Add messages
      if (hideUserMessage) {
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const userMessage: StreamingMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content,
          mode,
          model_name: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage, assistantMessage]);
      }

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
              message: content,
              model_id: modelId,
              role: modeToRole[mode],
              memory_context: memoryContext || [],
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        // Handle error responses
        if (!response.ok) {
          if (response.status === 429) {
            toast.error('Превышен лимит запросов. Попробуйте позже.');
          } else if (response.status === 402) {
            toast.error('Требуется пополнение баланса Lovable AI.');
          } else {
            const errorData = await response.json().catch(() => ({}));
            toast.error(errorData.error || `Ошибка: ${response.status}`);
          }
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setStreaming(false);
          return;
        }

        if (!response.body) {
          throw new Error('No response body');
        }

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
                // Update message content in real-time
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: accumulatedContent }
                      : m
                  )
                );
              }
            } catch {
              // Incomplete JSON, put back in buffer
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }

        // Final flush of any remaining content
        if (buffer.trim()) {
          for (let raw of buffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (raw.startsWith(':') || raw.trim() === '') continue;
            if (!raw.startsWith('data: ')) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulatedContent += delta;
              }
            } catch {
              // Ignore partial leftovers
            }
          }
        }

        // Mark streaming as complete
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: accumulatedContent, isStreaming: false }
              : m
          )
        );

      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          // User cancelled - mark as complete with current content
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, isStreaming: false }
                : m
            )
          );
        } else {
          console.error('[useStreamingChat] Error:', error);
          toast.error(error instanceof Error ? error.message : 'Ошибка подключения');
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        }
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [sessionId]
  );

  const clearMessages = useCallback(() => {
    stopStreaming();
    setMessages([]);
  }, [stopStreaming]);

  return {
    messages,
    streaming,
    sendQuery,
    stopStreaming,
    clearMessages,
  };
}
