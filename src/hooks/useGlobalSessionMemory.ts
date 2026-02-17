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
      // Get embedding for the query via generate-embeddings function
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
    isSearching,
  };
}
