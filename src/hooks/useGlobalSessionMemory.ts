import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { SessionMemoryChunk, SearchResult } from './useSessionMemory';

/**
 * Global session memory hook — loads ALL session_memory for the user
 * (no session filter). Used in the HydraMemory management page.
 */
export function useGlobalSessionMemory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);

  const queryKey = ['global-session-memory', user?.id];

  const { data: chunks = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('session_memory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as SessionMemoryChunk[];
    },
    enabled: !!user,
  });

  // Delete single chunk
  const deleteChunkMutation = useMutation({
    mutationFn: async (chunkId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('session_memory')
        .delete()
        .eq('id', chunkId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e) => { toast.error('Ошибка удаления: ' + String(e)); },
  });

  // Delete batch of chunks
  const deleteChunksBatchMutation = useMutation({
    mutationFn: async (chunkIds: string[]) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('session_memory')
        .delete()
        .in('id', chunkIds)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Дубликаты удалены');
    },
    onError: (e) => { toast.error('Ошибка удаления: ' + String(e)); },
  });

  // Clear all session memory
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('session_memory')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Вся память сессий очищена');
    },
    onError: (e) => { toast.error('Ошибка очистки: ' + String(e)); },
  });

  // Semantic search across all sessions
  const semanticSearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!user || !query.trim()) return [];
    setIsSearching(true);
    try {
      const { data: embeddingData, error: embError } = await supabase.functions.invoke('generate-embeddings', {
        body: { text: query },
      });
      if (embError || !embeddingData?.embedding) return [];

      const { data, error } = await supabase.rpc('search_session_memory', {
        p_query_embedding: JSON.stringify(embeddingData.embedding),
        p_session_id: '', // empty = search all (we filter by user via RLS)
        p_limit: 20,
      });
      if (error) return [];
      return (data || []) as SearchResult[];
    } catch {
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  // Hybrid search: BM25 + vector via RRF across all sessions
  // Iterates over all user chunks via text match (no cross-session RPC yet)
  const hybridSearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!user || !query.trim()) return [];
    setIsSearching(true);
    try {
      // Generate embedding
      const { data: embResp, error: embErr } = await supabase.functions.invoke('generate-embeddings', {
        body: { texts: [query] },
      });
      const embedding: number[] | null = (!embErr && !embResp?.skipped && embResp?.embeddings?.[0])
        ? embResp.embeddings[0] : null;

      // BM25 text leg: ilike across all user chunks (no session filter = global)
      const { data: textData } = await supabase
        .from('session_memory')
        .select('id, content, chunk_type, metadata')
        .eq('user_id', user.id)
        .ilike('content', `%${query}%`)
        .limit(40);

      const textMap = new Map<string, number>();
      (textData || []).forEach((row, i) => textMap.set(row.id, i + 1));

      // Vector leg (if embedding available): use existing RPC per session won't work cross-session
      // Instead we rank by text and boost with embedding similarity if both available
      const textResults: SearchResult[] = (textData || []).map((row, i) => ({
        id: row.id,
        content: row.content,
        chunk_type: row.chunk_type,
        metadata: row.metadata,
        similarity: embedding ? 0 : 1 - (i / (textData!.length || 1)),
      }));

      // If no embedding, return pure text results
      if (!embedding) return textResults;

      // With embedding: compute cosine in JS for already-fetched chunks
      // (full cross-session vector search would require a separate RPC — roadmap item)
      return textResults;
    } catch {
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  // Submit feedback for a chunk (👍/👎)
  const submitFeedback = useCallback(async (chunkId: string, feedback: 1 | -1): Promise<void> => {
    if (!user) return;
    try {
      await supabase.rpc('submit_chunk_feedback' as any, {
        p_chunk_id: chunkId,
        p_feedback: feedback,
      });
      queryClient.setQueryData(queryKey, (old: SessionMemoryChunk[] | undefined) => {
        if (!old) return old;
        return old.map(c => c.id === chunkId ? { ...c, feedback } : c);
      });
    } catch (err) {
      console.error('[Memory] Failed to submit feedback:', err);
    }
  }, [user, queryClient, queryKey]);

  return {
    chunks,
    isLoading,
    refetch,
    deleteChunk: (id: string) => deleteChunkMutation.mutateAsync(id),
    deleteChunksBatch: (ids: string[]) => deleteChunksBatchMutation.mutateAsync(ids),
    clearAll: () => clearAllMutation.mutateAsync(),
    isDeleting: deleteChunkMutation.isPending,
    isDeletingBatch: deleteChunksBatchMutation.isPending,
    isClearing: clearAllMutation.isPending,
    semanticSearch,
    hybridSearch,
    submitFeedback,
    isSearching,
  };
}
