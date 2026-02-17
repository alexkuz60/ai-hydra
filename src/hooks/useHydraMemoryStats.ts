import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SessionMemoryStats {
  total: number;
  by_type: Record<string, number>;
  session_count: number;
}

export interface RoleMemoryRollup {
  role: string;
  count: number;
  avg_confidence: number;
}

export interface KnowledgeRollup {
  role: string;
  category: string;
  count: number;
}

export interface HydraMemoryStats {
  sessionMemory: SessionMemoryStats;
  roleMemory: RoleMemoryRollup[];
  knowledge: KnowledgeRollup[];
  totalRoleMemory: number;
  totalKnowledge: number;
  loading: boolean;
  refresh: () => void;
}

export function useHydraMemoryStats(): HydraMemoryStats {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessionMemory, setSessionMemory] = useState<SessionMemoryStats>({ total: 0, by_type: {}, session_count: 0 });
  const [roleMemory, setRoleMemory] = useState<RoleMemoryRollup[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeRollup[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [smRes, rmRes, rkRes] = await Promise.all([
        supabase
          .from('session_memory')
          .select('chunk_type, session_id')
          .eq('user_id', user.id),
        supabase
          .from('role_memory')
          .select('role, confidence_score')
          .eq('user_id', user.id),
        supabase
          .from('role_knowledge')
          .select('role, category')
          .eq('user_id', user.id),
      ]);

      // Session memory aggregation
      const smData = smRes.data || [];
      const byType: Record<string, number> = {};
      const sessionIds = new Set<string>();
      for (const row of smData) {
        byType[row.chunk_type] = (byType[row.chunk_type] || 0) + 1;
        if (row.session_id) sessionIds.add(row.session_id);
      }
      setSessionMemory({ total: smData.length, by_type: byType, session_count: sessionIds.size });

      // Role memory aggregation
      const rmData = rmRes.data || [];
      const rmMap: Record<string, { count: number; totalConf: number }> = {};
      for (const row of rmData) {
        if (!rmMap[row.role]) rmMap[row.role] = { count: 0, totalConf: 0 };
        rmMap[row.role].count++;
        rmMap[row.role].totalConf += (row.confidence_score || 0);
      }
      setRoleMemory(
        Object.entries(rmMap)
          .map(([role, { count, totalConf }]) => ({ role, count, avg_confidence: count ? totalConf / count : 0 }))
          .sort((a, b) => b.count - a.count)
      );

      // Knowledge aggregation
      const rkData = rkRes.data || [];
      const rkMap: Record<string, Record<string, number>> = {};
      for (const row of rkData) {
        if (!rkMap[row.role]) rkMap[row.role] = {};
        rkMap[row.role][row.category] = (rkMap[row.role][row.category] || 0) + 1;
      }
      const rkFlat: KnowledgeRollup[] = [];
      for (const [role, cats] of Object.entries(rkMap)) {
        for (const [category, count] of Object.entries(cats)) {
          rkFlat.push({ role, category, count });
        }
      }
      setKnowledge(rkFlat.sort((a, b) => b.count - a.count));
    } catch (e) {
      console.error('[useHydraMemoryStats]', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalRoleMemory = roleMemory.reduce((s, r) => s + r.count, 0);
  const totalKnowledge = knowledge.reduce((s, r) => s + r.count, 0);

  return { sessionMemory, roleMemory, knowledge, totalRoleMemory, totalKnowledge, loading, refresh: fetchAll };
}
