import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { FlowDiagramContext } from '@/lib/flowDiagramContext';

export interface LogisticsMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  isStreaming?: boolean;
}

interface UseFlowLogisticsReturn {
  messages: LogisticsMessage[];
  streaming: boolean;
  sendMessage: (
    content: string,
    diagramContext: FlowDiagramContext | null,
    selectedNodeId: string | null
  ) => Promise<void>;
  stopStreaming: () => void;
  clearMessages: () => void;
}

export function useFlowLogistics(): UseFlowLogisticsReturn {
  const [messages, setMessages] = useState<LogisticsMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      diagramContext: FlowDiagramContext | null,
      selectedNodeId: string | null
    ) => {
      if (!content.trim() || streaming) return;

      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setStreaming(true);

      const userMsg: LogisticsMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };

      const assistantId = crypto.randomUUID();
      const assistantMsg: LogisticsMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, userMsg, assistantMsg]);

      // Build conversation history for context
      const history = [...messages, userMsg].map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/flow-logistics`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: history,
              diagram_context: diagramContext,
              selected_node_id: selectedNodeId,
            }),
            signal: abortRef.current.signal,
          }
        );

        if (!response.ok) {
          if (response.status === 429) toast.error('Превышен лимит запросов. Попробуйте позже.');
          else if (response.status === 402) toast.error('Требуется пополнение баланса Lovable AI.');
          else toast.error(`Ошибка: ${response.status}`);
          setMessages(prev => prev.filter(m => m.id !== assistantId));
          setStreaming(false);
          return;
        }

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (json === '[DONE]') break;
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                setMessages(prev =>
                  prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m)
                );
              }
            } catch {
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }

        // Flush remaining
        if (buffer.trim()) {
          for (let raw of buffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (raw.startsWith(':') || raw.trim() === '') continue;
            if (!raw.startsWith('data: ')) continue;
            const json = raw.slice(6).trim();
            if (json === '[DONE]') continue;
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) accumulated += delta;
            } catch { /* ignore */ }
          }
        }

        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: accumulated, isStreaming: false } : m)
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m));
        } else {
          console.error('[useFlowLogistics]', err);
          toast.error('Ошибка подключения к Логистику');
          setMessages(prev => prev.filter(m => m.id !== assistantId));
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming]
  );

  const clearMessages = useCallback(() => {
    stopStreaming();
    setMessages([]);
  }, [stopStreaming]);

  return { messages, streaming, sendMessage, stopStreaming, clearMessages };
}
