import { useCallback, useEffect, useRef } from 'react';
import { useSessionMemory, ChunkType } from './useSessionMemory';
import { Message } from '@/types/messages';
import { supabase } from '@/integrations/supabase/client';

// Evaluation score structure for arbiter assessments
export interface EvaluationScore {
  criterion: string;
  score: number;
  maxScore: number;
  justification?: string;
}

export interface EvaluationData {
  evaluatedMessageId: string;
  evaluatedModel: string | null;
  scores: EvaluationScore[];
  totalScore: number;
  maxTotalScore: number;
  recommendation?: string;
  evaluatorModel?: string;
  evaluatedAt: string;
}

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
  // Keywords for arbiter evaluations
  EVALUATION_KEYWORDS: [
    '| критерий |', '| criterion |',
    'фактологичность', 'релевантность', 'полнота',
    'итоговая оценка:', 'total score:', 'рекомендация:',
    '/10', 'баллов из',
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
  saveEvaluation: (messageId: string, evaluatedMessageId: string, content: string, evaluationData: EvaluationData) => Promise<void>;
  // Check if message is saved
  savedMessageIds: Set<string>;
  // Delete memory by message ID
  deleteMemoryByMessageId: (messageId: string) => Promise<void>;
  // Memory stats
  memoryStats: { total: number; byType: Record<ChunkType, number> } | null;
  // Search
  searchByText: (query: string) => Promise<any[]>;
  // Get evaluations for a specific model
  getModelEvaluations: (modelName: string) => EvaluationData[];
  // Get all evaluations
  getAllEvaluations: () => EvaluationData[];
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
    deleteByMessageId,
    searchByText,
    getStats,
    savedMessageIds,
  } = useSessionMemory(sessionId);

  // Track which messages have been processed to avoid duplicates
  const processedMessagesRef = useRef<Set<string>>(new Set());

  // Detect chunk type based on content keywords
  const detectChunkType = useCallback((content: string): ChunkType | null => {
    const lowerContent = content.toLowerCase();

    // Check for evaluation keywords (arbiter assessments)
    if (MEMORY_TRIGGERS.EVALUATION_KEYWORDS.some(kw => lowerContent.includes(kw))) {
      return 'evaluation';
    }

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

  // Save arbiter evaluation
  const saveEvaluation = useCallback(async (
    messageId: string,
    evaluatedMessageId: string,
    content: string,
    evaluationData: EvaluationData
  ) => {
    if (!sessionId) return;

    // Convert EvaluationData to Json-compatible format
    const jsonMetadata = {
      evaluation_data: {
        evaluatedMessageId: evaluationData.evaluatedMessageId,
        evaluatedModel: evaluationData.evaluatedModel,
        scores: evaluationData.scores.map(s => ({
          criterion: s.criterion,
          score: s.score,
          maxScore: s.maxScore,
          justification: s.justification || null,
        })),
        totalScore: evaluationData.totalScore,
        maxTotalScore: evaluationData.maxTotalScore,
        recommendation: evaluationData.recommendation || null,
        evaluatorModel: evaluationData.evaluatorModel || null,
        evaluatedAt: evaluationData.evaluatedAt,
      },
      evaluated_message_id: evaluatedMessageId,
      saved_at: new Date().toISOString(),
    };

    await createChunk({
      session_id: sessionId,
      content: content.slice(0, 3000), // Evaluations can be longer
      chunk_type: 'evaluation',
      source_message_id: messageId,
      metadata: jsonMetadata,
    });
  }, [sessionId, createChunk]);

  // Get evaluations for a specific model
  const getModelEvaluations = useCallback((modelName: string): EvaluationData[] => {
    return chunks
      .filter(chunk => chunk.chunk_type === 'evaluation')
      .map(chunk => {
        const metadata = chunk.metadata as { evaluation_data?: EvaluationData } | null;
        return metadata?.evaluation_data;
      })
      .filter((data): data is EvaluationData => 
        data !== undefined && data.evaluatedModel === modelName
      );
  }, [chunks]);

  // Get all evaluations
  const getAllEvaluations = useCallback((): EvaluationData[] => {
    return chunks
      .filter(chunk => chunk.chunk_type === 'evaluation')
      .map(chunk => {
        const metadata = chunk.metadata as { evaluation_data?: EvaluationData } | null;
        return metadata?.evaluation_data;
      })
      .filter((data): data is EvaluationData => data !== undefined);
  }, [chunks]);

  // Text-based search wrapper
  const handleSearchByText = useCallback(async (query: string) => {
    return searchByText(query, { limit: 20 });
  }, [searchByText]);

  return {
    saveDecision,
    saveContext,
    saveInstruction,
    saveEvaluation,
    savedMessageIds,
    deleteMemoryByMessageId: deleteByMessageId,
    memoryStats: chunks.length > 0 ? getStats() : null,
    searchByText: handleSearchByText,
    getModelEvaluations,
    getAllEvaluations,
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
