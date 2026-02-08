import { useEffect, useRef, useState, useCallback } from 'react';
import { ConsultantMode } from '@/hooks/useStreamingChat';

interface SourceMessage {
  role: string;
  model_name: string | null;
  content: string;
}

interface InitialQuery {
  messageId: string;
  content: string;
  sourceMessages?: SourceMessage[];
}

interface StreamingMessage {
  role: string;
  mode?: string;
  content: string;
}

interface MemoryChunk {
  content: string;
  chunk_type: string;
  metadata: unknown;
}

interface UseDChatInitialQueryOptions {
  initialQuery: InitialQuery | null | undefined;
  selectedModel: string;
  selectedMode: ConsultantMode;
  chunks: MemoryChunk[];
  messages: StreamingMessage[];
  sendQuery: (
    message: string,
    mode: ConsultantMode,
    model: string,
    sourceId: string | null,
    hideUserMessage: boolean,
    memoryContext?: Array<{ content: string; chunk_type: string; metadata?: Record<string, unknown> }>
  ) => Promise<void>;
  onClearInitialQuery?: () => void;
  setInput: (v: string) => void;
  setCurrentSourceMessageId: (v: string | null) => void;
}

export function useDChatInitialQuery({
  initialQuery,
  selectedModel,
  selectedMode,
  chunks,
  messages,
  sendQuery,
  onClearInitialQuery,
  setInput,
  setCurrentSourceMessageId,
}: UseDChatInitialQueryOptions) {
  const [isModeratingContext, setIsModeratingContext] = useState(false);
  const chunksRef = useRef(chunks);
  chunksRef.current = chunks;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    if (!initialQuery || !selectedModel) return;

    const currentMemoryContext = chunksRef.current.map(chunk => ({
      content: chunk.content,
      chunk_type: chunk.chunk_type,
      metadata: chunk.metadata as Record<string, unknown> | undefined,
    }));

    if (initialQuery.sourceMessages && initialQuery.sourceMessages.length > 1) {
      setIsModeratingContext(true);
      const targetMode = selectedMode;
      const capturedModel = selectedModel;

      sendQuery(
        initialQuery.content,
        'moderator',
        capturedModel,
        initialQuery.messageId,
        true,
        currentMemoryContext
      ).then(() => {
        setIsModeratingContext(false);

        if (targetMode !== 'moderator' && targetMode !== 'expert' && targetMode !== 'web_search') {
          setTimeout(() => {
            const moderatorResponse = messagesRef.current
              .filter(m => m.role === 'consultant' && m.mode === 'moderator')
              .pop();
            if (moderatorResponse?.content) {
              sendQuery(
                moderatorResponse.content,
                targetMode,
                capturedModel,
                initialQuery.messageId,
                true,
                currentMemoryContext
              );
            }
          }, 200);
        }
      }).finally(() => {
        onClearInitialQuery?.();
      });
    } else {
      setInput(initialQuery.content);
      setCurrentSourceMessageId(initialQuery.messageId);
      onClearInitialQuery?.();
    }
  }, [initialQuery, selectedModel, sendQuery, onClearInitialQuery]);

  return { isModeratingContext };
}
