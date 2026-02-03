import { useCallback, useEffect, useRef } from 'react';
import { useSessionMemory, ChunkType } from './useSessionMemory';
import { Message } from '@/types/messages';
import { supabase } from '@/integrations/supabase/client';

// Criteria for auto-saving messages to memory
const MEMORY_TRIGGERS = {
  // Minimum rating to auto-save as decision
  MIN_RATING_FOR_DECISION: 7,
  // Keywords indicating important decisions (Russian)
  DECISION_KEYWORDS: [
    'решен', 'выбра', 'определ', 'согласован', 'утвержд',
    'итог:', 'вывод:', 'резюме:', 'рекомендация:', 'план:',
    'нужно:', 'следует:', 'важно:', 'критично:',
  ],
  // Keywords for context/background info
  CONTEXT_KEYWORDS: [
    'контекст:', 'справка:', 'background:', 'предыстория:',
    'для понимания:', 'необходимо знать:',
  ],
  // Keywords for instructions
  INSTRUCTION_KEYWORDS: [
    'инструкция:', 'алгоритм:', 'шаги:', 'порядок:',
    'процедура:', 'workflow:', 'как сделать:',
  ],
};

interface UseMemoryIntegrationProps {
  sessionId: string | null;
  messages: Message[];
  enabled?: boolean;
}

interface UseMemoryIntegrationReturn {
  // Manual save actions
  saveDecision: (messageId: string, content: string) => Promise<void>;
  saveContext: (content: string) => Promise<void>;
  saveInstruction: (content: string) => Promise<void>;
  // Memory stats
  memoryStats: { total: number; byType: Record<ChunkType, number> } | null;
  // Search
  searchByText: (query: string) => Promise<any[]>;
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
}

export function useMemoryIntegration({
  sessionId,
  messages,
  enabled = true,
}: UseMemoryIntegrationProps): UseMemoryIntegrationReturn {
  const {
    chunks,
    isLoading,
    isCreating,
    createChunk,
    searchByText,
    getStats,
  } = useSessionMemory(sessionId);

  // Track which messages have been processed to avoid duplicates
  const processedMessagesRef = useRef<Set<string>>(new Set());

  // Detect chunk type based on content keywords
  const detectChunkType = useCallback((content: string): ChunkType | null => {
    const lowerContent = content.toLowerCase();

    // Check for instruction keywords
    if (MEMORY_TRIGGERS.INSTRUCTION_KEYWORDS.some(kw => lowerContent.includes(kw))) {
      return 'instruction';
    }

    // Check for context keywords
    if (MEMORY_TRIGGERS.CONTEXT_KEYWORDS.some(kw => lowerContent.includes(kw))) {
      return 'context';
    }

    // Check for decision keywords
    if (MEMORY_TRIGGERS.DECISION_KEYWORDS.some(kw => lowerContent.includes(kw))) {
      return 'decision';
    }

    return null;
  }, []);

  // Auto-save high-rated messages as decisions
  useEffect(() => {
    if (!enabled || !sessionId || messages.length === 0) return;

    const processNewMessages = async () => {
      for (const msg of messages) {
        // Skip if already processed
        if (processedMessagesRef.current.has(msg.id)) continue;
        
        // Only process AI messages (not user)
        if (msg.role === 'user') {
          processedMessagesRef.current.add(msg.id);
          continue;
        }

        // Check if message has high rating (auto-save as decision)
        const metadata = msg.metadata as { rating?: number } | null;
        const rating = metadata?.rating ?? 0;

        if (rating >= MEMORY_TRIGGERS.MIN_RATING_FOR_DECISION) {
          // Check if chunk already exists for this message
          const existingChunk = chunks.find(c => c.source_message_id === msg.id);
          if (!existingChunk) {
            try {
              await createChunk({
                session_id: sessionId,
                content: msg.content.slice(0, 2000), // Limit content size
                chunk_type: 'decision',
                source_message_id: msg.id,
                metadata: {
                  model_name: msg.model_name,
                  rating,
                  auto_saved: true,
                  saved_at: new Date().toISOString(),
                },
              });
              console.log(`[Memory] Auto-saved decision from message ${msg.id} (rating: ${rating})`);
            } catch (error) {
              console.error('[Memory] Failed to auto-save decision:', error);
            }
          }
        }

        processedMessagesRef.current.add(msg.id);
      }
    };

    processNewMessages();
  }, [enabled, sessionId, messages, chunks, createChunk]);

  // Manual save as decision
  const saveDecision = useCallback(async (messageId: string, content: string) => {
    if (!sessionId) return;

    await createChunk({
      session_id: sessionId,
      content: content.slice(0, 2000),
      chunk_type: 'decision',
      source_message_id: messageId,
      metadata: {
        manual_save: true,
        saved_at: new Date().toISOString(),
      },
    });
  }, [sessionId, createChunk]);

  // Manual save as context
  const saveContext = useCallback(async (content: string) => {
    if (!sessionId) return;

    await createChunk({
      session_id: sessionId,
      content: content.slice(0, 2000),
      chunk_type: 'context',
      metadata: {
        manual_save: true,
        saved_at: new Date().toISOString(),
      },
    });
  }, [sessionId, createChunk]);

  // Manual save as instruction
  const saveInstruction = useCallback(async (content: string) => {
    if (!sessionId) return;

    await createChunk({
      session_id: sessionId,
      content: content.slice(0, 2000),
      chunk_type: 'instruction',
      metadata: {
        manual_save: true,
        saved_at: new Date().toISOString(),
      },
    });
  }, [sessionId, createChunk]);

  // Text-based search wrapper
  const handleSearchByText = useCallback(async (query: string) => {
    return searchByText(query, { limit: 20 });
  }, [searchByText]);

  return {
    saveDecision,
    saveContext,
    saveInstruction,
    memoryStats: chunks.length > 0 ? getStats() : null,
    searchByText: handleSearchByText,
    isLoading,
    isSaving: isCreating,
  };
}

// Utility function to generate embedding via edge function
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: { texts: [text] },
    });

    if (error) {
      console.error('[Embedding] Error:', error);
      return null;
    }

    return data?.embeddings?.[0] || null;
  } catch (err) {
    console.error('[Embedding] Failed to generate:', err);
    return null;
  }
}
