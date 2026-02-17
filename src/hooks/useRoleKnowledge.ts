import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { AgentRole } from '@/config/roles';

export interface RoleKnowledgeEntry {
  id: string;
  role: string;
  content: string;
  source_title: string | null;
  source_url: string | null;
  category: string;
  version: string | null;
  chunk_index: number;
  chunk_total: number;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeStats {
  total: number;
  by_category: Record<string, number>;
  sources: number;
}

interface SaveKnowledgeParams {
  content: string;
  source_title?: string;
  source_url?: string;
  category?: string;
  version?: string;
  chunk_index?: number;
  chunk_total?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface SearchResult {
  id: string;
  content: string;
  source_title: string | null;
  source_url: string | null;
  category: string;
  version: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  similarity: number;
}

export function useRoleKnowledge(role: AgentRole) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<RoleKnowledgeEntry[]>([]);

  const fetchEntries = useCallback(async (category?: string) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('role_knowledge' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('role', role)
        .order('source_title', { ascending: true })
        .order('chunk_index', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEntries((data || []) as unknown as RoleKnowledgeEntry[]);
    } catch (error) {
      console.error('[useRoleKnowledge] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, role]);

  const saveEntry = useCallback(async (params: SaveKnowledgeParams): Promise<string | null> => {
    if (!user?.id) {
      toast.error('Необходима авторизация');
      return null;
    }

    try {
      // Generate embedding
      let embedding = null;
      try {
        const resp = await supabase.functions.invoke('generate-embeddings', {
          body: { texts: [params.content] },
        });
        if (!resp.error && !resp.data?.skipped) {
          embedding = resp.data?.embeddings?.[0] || null;
        }
      } catch {
        console.warn('[useRoleKnowledge] Embedding generation skipped');
      }

      const insertData = {
        user_id: user.id,
        role,
        content: params.content,
        embedding,
        source_title: params.source_title ?? null,
        source_url: params.source_url ?? null,
        category: params.category ?? 'general',
        version: params.version ?? null,
        chunk_index: params.chunk_index ?? 0,
        chunk_total: params.chunk_total ?? 1,
        tags: params.tags ?? [],
        metadata: params.metadata ?? {},
      };

      const { data, error } = await supabase
        .from('role_knowledge' as any)
        .insert(insertData)
        .select('id')
        .single();

      if (error) throw error;
      await fetchEntries();
      return (data as any)?.id || null;
    } catch (error) {
      console.error('[useRoleKnowledge] Save error:', error);
      toast.error('Ошибка сохранения знания');
      return null;
    }
  }, [user?.id, role, fetchEntries]);

  const saveBulk = useCallback(async (items: SaveKnowledgeParams[]): Promise<number> => {
    if (!user?.id) return 0;

    let saved = 0;
    for (const item of items) {
      const id = await saveEntry(item);
      if (id) saved++;
    }
    return saved;
  }, [user?.id, saveEntry]);

  const deleteEntry = useCallback(async (entryId: string): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { error } = await supabase
        .from('role_knowledge' as any)
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== entryId));
      return true;
    } catch (error) {
      console.error('[useRoleKnowledge] Delete error:', error);
      toast.error('Ошибка удаления');
      return false;
    }
  }, [user?.id]);

  const deleteBySource = useCallback(async (sourceTitle: string): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { error } = await supabase
        .from('role_knowledge' as any)
        .delete()
        .eq('user_id', user.id)
        .eq('role', role)
        .eq('source_title', sourceTitle);

      if (error) throw error;
      setEntries(prev => prev.filter(e => e.source_title !== sourceTitle));
      return true;
    } catch (error) {
      console.error('[useRoleKnowledge] Delete by source error:', error);
      toast.error('Ошибка удаления');
      return false;
    }
  }, [user?.id, role]);

  const searchKnowledge = useCallback(async (
    query: string,
    categories?: string[],
    limit = 5
  ): Promise<SearchResult[]> => {
    if (!user?.id) return [];

    try {
      const embResp = await supabase.functions.invoke('generate-embeddings', {
        body: { texts: [query] },
      });

      if (embResp.error || embResp.data?.skipped || !embResp.data?.embeddings?.[0]) {
        console.warn('[useRoleKnowledge] Query embedding failed');
        return [];
      }

      const { data, error } = await supabase.rpc('search_role_knowledge', {
        p_role: role,
        p_query_embedding: embResp.data.embeddings[0],
        p_limit: limit,
        p_categories: categories ?? null,
      });

      if (error) throw error;
      return (data || []) as SearchResult[];
    } catch (error) {
      console.error('[useRoleKnowledge] Search error:', error);
      return [];
    }
  }, [user?.id, role]);

  // Hybrid search: BM25 + vector via RRF (uses new SQL function)
  const hybridSearchKnowledge = useCallback(async (
    query: string,
    categories?: string[],
    limit = 5
  ): Promise<SearchResult[]> => {
    if (!user?.id) return [];
    try {
      const embResp = await supabase.functions.invoke('generate-embeddings', {
        body: { texts: [query] },
      });
      const hasEmbedding = !embResp.error && !embResp.data?.skipped && embResp.data?.embeddings?.[0];

      if (!hasEmbedding) {
        // Fallback: plain text ilike when no OpenAI key
        const { data } = await supabase
          .from('role_knowledge' as any)
          .select('id, content, source_title, source_url, category, version, tags, metadata')
          .eq('user_id', user.id)
          .eq('role', role)
          .ilike('content', `%${query}%`)
          .limit(limit);
        return (data || []).map((r: any) => ({ ...r, similarity: 0 })) as SearchResult[];
      }

      const { data, error } = await supabase.rpc('hybrid_search_role_knowledge' as any, {
        p_role: role,
        p_query_text: query,
        p_query_embedding: embResp.data.embeddings[0],
        p_limit: limit,
        p_categories: categories ?? null,
      });
      if (error) throw error;
      return (data || []) as SearchResult[];
    } catch (err) {
      console.error('[useRoleKnowledge] Hybrid search error:', err);
      return [];
    }
  }, [user?.id, role]);

  const getStats = useCallback((): KnowledgeStats => {
    const byCategory: Record<string, number> = {};
    const sources = new Set<string>();

    for (const entry of entries) {
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
      if (entry.source_title) sources.add(entry.source_title);
    }

    return {
      total: entries.length,
      by_category: byCategory,
      sources: sources.size,
    };
  }, [entries]);

  return {
    entries,
    loading,
    fetchEntries,
    saveEntry,
    saveBulk,
    deleteEntry,
    deleteBySource,
    searchKnowledge,
    hybridSearchKnowledge,
    getStats,
  };
}

