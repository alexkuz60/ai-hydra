import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Types for session memory
export type ChunkType = 'message' | 'summary' | 'decision' | 'context' | 'instruction';

export interface SessionMemoryChunk {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  chunk_type: ChunkType;
  source_message_id: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface CreateMemoryChunkInput {
  session_id: string;
  content: string;
  chunk_type?: ChunkType;
  source_message_id?: string;
  metadata?: Json;
}

export interface UpdateMemoryChunkInput {
  id: string;
  content?: string;
  chunk_type?: ChunkType;
  metadata?: Json;
}

export interface SearchResult {
  id: string;
  content: string;
  chunk_type: string;
  metadata: Json;
  similarity: number;
}

export function useSessionMemory(sessionId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);

  const queryKey = ['session-memory', sessionId];

  // Fetch all memory chunks for a session
  const {
    data: chunks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!sessionId || !user) return [];

      const { data, error } = await supabase
        .from('session_memory')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SessionMemoryChunk[];
    },
    enabled: !!sessionId && !!user,
  });

  // Create a new memory chunk
  const createChunkMutation = useMutation({
    mutationFn: async (input: CreateMemoryChunkInput) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('session_memory')
        .insert({
          session_id: input.session_id,
          user_id: user.id,
          content: input.content,
          chunk_type: input.chunk_type || 'message',
          source_message_id: input.source_message_id || null,
          metadata: (input.metadata || {}) as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SessionMemoryChunk;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      console.error('Failed to create memory chunk:', error);
      toast.error('Не удалось сохранить в память');
    },
  });

  // Update an existing memory chunk
  const updateChunkMutation = useMutation({
    mutationFn: async (input: UpdateMemoryChunkInput) => {
      if (!user) throw new Error('User not authenticated');

      const updateData: Record<string, unknown> = {};
      if (input.content !== undefined) updateData.content = input.content;
      if (input.chunk_type !== undefined) updateData.chunk_type = input.chunk_type;
      if (input.metadata !== undefined) updateData.metadata = input.metadata;

      const { data, error } = await supabase
        .from('session_memory')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as SessionMemoryChunk;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      console.error('Failed to update memory chunk:', error);
      toast.error('Не удалось обновить память');
    },
  });

  // Delete a memory chunk
  const deleteChunkMutation = useMutation({
    mutationFn: async (chunkId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('session_memory')
        .delete()
        .eq('id', chunkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      console.error('Failed to delete memory chunk:', error);
      toast.error('Не удалось удалить из памяти');
    },
  });

  // Delete all memory for a session
  const clearSessionMemoryMutation = useMutation({
    mutationFn: async () => {
      if (!user || !sessionId) throw new Error('Session not available');

      const { error } = await supabase
        .from('session_memory')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Память сессии очищена');
    },
    onError: (error) => {
      console.error('Failed to clear session memory:', error);
      toast.error('Не удалось очистить память');
    },
  });

  // Semantic search in session memory (requires embedding)
  // Note: This requires generating embeddings on the backend
  const searchMemory = useCallback(
    async (
      queryEmbedding: number[],
      options?: { limit?: number; chunkTypes?: ChunkType[] }
    ): Promise<SearchResult[]> => {
      if (!sessionId || !user) return [];

      setIsSearching(true);
      try {
        // Convert number array to string format for pgvector
        const embeddingStr = `[${queryEmbedding.join(',')}]`;
        
        const { data, error } = await supabase.rpc('search_session_memory', {
          p_session_id: sessionId,
          p_query_embedding: embeddingStr,
          p_limit: options?.limit || 10,
          p_chunk_types: options?.chunkTypes || null,
        });

        if (error) throw error;
        return (data as SearchResult[]) || [];
      } catch (error) {
        console.error('Semantic search failed:', error);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [sessionId, user]
  );

  // Text-based search (fallback without embeddings)
  const searchByText = useCallback(
    async (query: string, options?: { limit?: number; chunkTypes?: ChunkType[] }): Promise<SessionMemoryChunk[]> => {
      if (!sessionId || !user || !query.trim()) return [];

      setIsSearching(true);
      try {
        let queryBuilder = supabase
          .from('session_memory')
          .select('*')
          .eq('session_id', sessionId)
          .ilike('content', `%${query}%`)
          .order('created_at', { ascending: false })
          .limit(options?.limit || 20);

        if (options?.chunkTypes?.length) {
          queryBuilder = queryBuilder.in('chunk_type', options.chunkTypes);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;
        return data as SessionMemoryChunk[];
      } catch (error) {
        console.error('Text search failed:', error);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [sessionId, user]
  );

  // Get chunks by type
  const getChunksByType = useCallback(
    (type: ChunkType): SessionMemoryChunk[] => {
      return chunks.filter((chunk) => chunk.chunk_type === type);
    },
    [chunks]
  );

  // Get memory stats
  const getStats = useCallback(() => {
    const stats: Record<ChunkType, number> = {
      message: 0,
      summary: 0,
      decision: 0,
      context: 0,
      instruction: 0,
    };

    chunks.forEach((chunk) => {
      stats[chunk.chunk_type]++;
    });

    return {
      total: chunks.length,
      byType: stats,
    };
  }, [chunks]);

  // Bulk create chunks (useful for batch operations)
  const createChunksBatch = useCallback(
    async (inputs: CreateMemoryChunkInput[]): Promise<SessionMemoryChunk[]> => {
      if (!user) throw new Error('User not authenticated');

      const records = inputs.map((input) => ({
        session_id: input.session_id,
        user_id: user.id,
        content: input.content,
        chunk_type: input.chunk_type || 'message',
        source_message_id: input.source_message_id || null,
        metadata: (input.metadata || {}) as Json,
      }));

      const { data, error } = await supabase
        .from('session_memory')
        .insert(records)
        .select();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey });
      return data as SessionMemoryChunk[];
    },
    [user, queryClient, queryKey]
  );

  return {
    // Data
    chunks,
    isLoading,
    error,
    isSearching,

    // CRUD operations
    createChunk: createChunkMutation.mutateAsync,
    updateChunk: updateChunkMutation.mutateAsync,
    deleteChunk: deleteChunkMutation.mutateAsync,
    clearSessionMemory: clearSessionMemoryMutation.mutateAsync,
    createChunksBatch,

    // Mutations state
    isCreating: createChunkMutation.isPending,
    isUpdating: updateChunkMutation.isPending,
    isDeleting: deleteChunkMutation.isPending,
    isClearing: clearSessionMemoryMutation.isPending,

    // Search
    searchMemory,
    searchByText,

    // Helpers
    getChunksByType,
    getStats,
    refetch,
  };
}
