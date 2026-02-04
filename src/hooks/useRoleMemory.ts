import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { AgentRole } from '@/config/roles';

export type MemoryType = 'experience' | 'preference' | 'skill' | 'mistake' | 'success';

export interface RoleMemoryEntry {
  id: string;
  role: string;
  content: string;
  memory_type: MemoryType;
  confidence_score: number;
  usage_count: number;
  last_used_at: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  source_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleMemoryStats {
  total: number;
  by_type: Record<MemoryType, number>;
  avg_confidence: number;
  most_used: RoleMemoryEntry | null;
}

interface SaveMemoryParams {
  content: string;
  memory_type: MemoryType;
  confidence?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  source_session_id?: string;
}

interface SearchResult {
  id: string;
  content: string;
  memory_type: string;
  confidence_score: number;
  tags: string[];
  metadata: Record<string, unknown>;
  similarity: number;
}

export function useRoleMemory(role: AgentRole) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState<RoleMemoryEntry[]>([]);

  // Fetch all memories for this role
  const fetchMemories = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('role_memory')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', role)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemories((data || []) as unknown as RoleMemoryEntry[]);
    } catch (error) {
      console.error('[useRoleMemory] Error fetching:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, role]);

  // Save a new memory entry
  const saveMemory = useCallback(async (params: SaveMemoryParams): Promise<string | null> => {
    if (!user?.id) {
      toast.error('Необходима авторизация');
      return null;
    }

    try {
      // First, generate embedding for the content
      const embeddingResponse = await supabase.functions.invoke('generate-embeddings', {
        body: { text: params.content }
      });

      if (embeddingResponse.error) {
        console.warn('[useRoleMemory] Embedding generation failed:', embeddingResponse.error);
      }

      const embedding = embeddingResponse.data?.embedding || null;

      const insertData = {
        user_id: user.id,
        role,
        content: params.content,
        memory_type: params.memory_type,
        confidence_score: params.confidence ?? 0.7,
        tags: params.tags ?? [],
        metadata: (params.metadata ?? {}) as unknown as Record<string, never>,
        source_session_id: params.source_session_id ?? null,
        embedding,
      };

      const { data, error } = await supabase
        .from('role_memory')
        .insert(insertData)
        .select('id')
        .single();

      if (error) throw error;
      
      // Refresh memories list
      await fetchMemories();
      
      return data?.id || null;
    } catch (error) {
      console.error('[useRoleMemory] Error saving:', error);
      toast.error('Ошибка сохранения опыта');
      return null;
    }
  }, [user?.id, role, fetchMemories]);

  // Search memories semantically
  const searchMemory = useCallback(async (
    query: string,
    memoryTypes?: MemoryType[],
    limit = 5
  ): Promise<SearchResult[]> => {
    if (!user?.id) return [];

    try {
      // Generate embedding for query
      const embeddingResponse = await supabase.functions.invoke('generate-embeddings', {
        body: { text: query }
      });

      if (embeddingResponse.error || !embeddingResponse.data?.embedding) {
        console.warn('[useRoleMemory] Query embedding failed');
        return [];
      }

      const { data, error } = await supabase.rpc('search_role_memory', {
        p_role: role,
        p_query_embedding: embeddingResponse.data.embedding,
        p_limit: limit,
        p_memory_types: memoryTypes ?? null,
      });

      if (error) throw error;
      return (data || []) as SearchResult[];
    } catch (error) {
      console.error('[useRoleMemory] Search error:', error);
      return [];
    }
  }, [user?.id, role]);

  // Delete a memory entry
  const deleteMemory = useCallback(async (memoryId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('role_memory')
        .delete()
        .eq('id', memoryId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      return true;
    } catch (error) {
      console.error('[useRoleMemory] Delete error:', error);
      toast.error('Ошибка удаления');
      return false;
    }
  }, [user?.id]);

  // Update a memory entry
  const updateMemory = useCallback(async (
    memoryId: string, 
    updates: Partial<Pick<RoleMemoryEntry, 'content' | 'confidence_score' | 'tags' | 'metadata'>>
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // If content is being updated, regenerate embedding
      let embedding = undefined;
      if (updates.content) {
        const embeddingResponse = await supabase.functions.invoke('generate-embeddings', {
          body: { text: updates.content }
        });
        if (!embeddingResponse.error) {
          embedding = embeddingResponse.data?.embedding;
        }
      }

      // Build update object with proper types
      const updateData: Record<string, unknown> = {};
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.confidence_score !== undefined) updateData.confidence_score = updates.confidence_score;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
      if (embedding) updateData.embedding = embedding;

      const { error } = await supabase
        .from('role_memory')
        .update(updateData)
        .eq('id', memoryId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchMemories();
      return true;
    } catch (error) {
      console.error('[useRoleMemory] Update error:', error);
      toast.error('Ошибка обновления');
      return false;
    }
  }, [user?.id, fetchMemories]);

  // Increment usage count
  const markAsUsed = useCallback(async (memoryId: string): Promise<void> => {
    try {
      await supabase.rpc('increment_role_memory_usage', { p_memory_id: memoryId });
    } catch (error) {
      console.warn('[useRoleMemory] Usage increment failed:', error);
    }
  }, []);

  // Get statistics
  const getStats = useCallback((): RoleMemoryStats => {
    const byType: Record<MemoryType, number> = {
      experience: 0,
      preference: 0,
      skill: 0,
      mistake: 0,
      success: 0,
    };

    let totalConfidence = 0;
    let mostUsed: RoleMemoryEntry | null = null;

    for (const memory of memories) {
      byType[memory.memory_type as MemoryType]++;
      totalConfidence += memory.confidence_score;
      
      if (!mostUsed || memory.usage_count > mostUsed.usage_count) {
        mostUsed = memory;
      }
    }

    return {
      total: memories.length,
      by_type: byType,
      avg_confidence: memories.length > 0 ? totalConfidence / memories.length : 0,
      most_used: mostUsed,
    };
  }, [memories]);

  return {
    memories,
    loading,
    fetchMemories,
    saveMemory,
    searchMemory,
    deleteMemory,
    updateMemory,
    markAsUsed,
    getStats,
  };
}
