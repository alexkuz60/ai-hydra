import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getModelRegistryEntry, type ModelRegistryEntry } from '@/config/modelRegistry';

export interface DossierStats {
  totalResponses: number;
  totalBrains: number;
  totalDismissals: number;
  totalHallucinations: number;
  arbiterEvalCount: number;
  arbiterAvgScore: number;
  contestCount: number;
  contestTotalScore: number;
  sessionsCount: number;
  firstUsedAt: string | null;
  lastUsedAt: string | null;
  critiqueSummary: string | null;
  criteriaAverages: Record<string, number>;
}


export interface TaskHistory {
  sessionId: string;
  sessionTitle: string;
  role: string;
  responseCount: number;
}

export interface DuelRecord {
  opponentModelId: string;
  opponentModelName: string;
  result: 'win' | 'loss' | 'draw';
  sessionTitle: string;
}

export interface CritiqueEntry {
  text: string;
  score: number | null;
  source: 'panel' | 'dchat' | 'contest' | 'duel';
}

export interface StatsRoleDistribution {
  role: string;
  responseCount: number;
  percentage: number;
}

export interface ModelDossierData {
  modelId: string;
  registry: ModelRegistryEntry | undefined;
  stats: DossierStats;
  statsRoleDistribution: StatsRoleDistribution[];
  taskHistory: TaskHistory[];
  duels: DuelRecord[];
  critiques: CritiqueEntry[];
  loading: boolean;
}

const EMPTY_STATS: DossierStats = {
  totalResponses: 0,
  totalBrains: 0,
  totalDismissals: 0,
  totalHallucinations: 0,
  arbiterEvalCount: 0,
  arbiterAvgScore: 0,
  contestCount: 0,
  contestTotalScore: 0,
  sessionsCount: 0,
  firstUsedAt: null,
  lastUsedAt: null,
  critiqueSummary: null,
  criteriaAverages: {},
};

export function useModelDossier(modelId: string | null) {
  const { user } = useAuth();
  const [data, setData] = useState<ModelDossierData>({
    modelId: modelId || '',
    registry: undefined,
    stats: EMPTY_STATS,
    statsRoleDistribution: [],
    taskHistory: [],
    duels: [],
    critiques: [],
    loading: true,
  });

  const fetchDossier = useCallback(async () => {
    if (!user || !modelId) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Fetch aggregated statistics from model_statistics
      const { data: statsRows } = await supabase
        .from('model_statistics')
        .select('*')
        .eq('user_id', user.id)
        .eq('model_id', modelId);

      // Fetch messages history for this model
      const { data: messages } = await supabase
        .from('messages')
        .select('session_id, role, model_name, metadata, created_at')
        .eq('user_id', user.id)
        .eq('model_name', modelId)
        .neq('role', 'user');

      const registry = getModelRegistryEntry(modelId);

      // Aggregate stats
      const stats: DossierStats = { ...EMPTY_STATS };
      const criteriaAccum: Record<string, { sum: number; count: number }> = {};
      if (statsRows && statsRows.length > 0) {
        let totalArbiterScore = 0;
        for (const row of statsRows) {
          stats.totalResponses += row.response_count;
          stats.totalBrains += row.total_brains;
          stats.totalDismissals += row.dismissal_count;
          stats.totalHallucinations += (row as any).hallucination_count || 0;
          stats.arbiterEvalCount += (row as any).arbiter_eval_count || 0;
          totalArbiterScore += Number((row as any).arbiter_score) || 0;
          stats.contestCount += (row as any).contest_count || 0;
          stats.contestTotalScore += Number((row as any).contest_total_score) || 0;
          if (!stats.firstUsedAt || (row.first_used_at && row.first_used_at < stats.firstUsedAt)) {
            stats.firstUsedAt = row.first_used_at;
          }
          if (!stats.lastUsedAt || (row.last_used_at && row.last_used_at > stats.lastUsedAt)) {
            stats.lastUsedAt = row.last_used_at;
          }
          if ((row as any).critique_summary) {
            stats.critiqueSummary = (row as any).critique_summary;
          }
          // Merge criteria_averages from each row
          const rowCriteria = (row as any).criteria_averages as Record<string, { sum: number; count: number }> | null;
          if (rowCriteria) {
            for (const [key, val] of Object.entries(rowCriteria)) {
              if (!criteriaAccum[key]) criteriaAccum[key] = { sum: 0, count: 0 };
              criteriaAccum[key].sum += val.sum;
              criteriaAccum[key].count += val.count;
            }
          }
        }
        stats.sessionsCount = statsRows.length;
        stats.arbiterAvgScore = stats.arbiterEvalCount > 0 
          ? totalArbiterScore / stats.arbiterEvalCount 
          : 0;
        // Compute final averages per criterion
        for (const [key, val] of Object.entries(criteriaAccum)) {
          stats.criteriaAverages[key] = val.count > 0 ? val.sum / val.count : 0;
        }
      }

      // Role distribution from model_statistics (role_used)
      const statsRoleCounts = new Map<string, number>();
      if (statsRows) {
        for (const row of statsRows) {
          const role = row.role_used || 'assistant';
          statsRoleCounts.set(role, (statsRoleCounts.get(role) || 0) + row.response_count);
        }
      }
      const statsRoleTotal = Array.from(statsRoleCounts.values()).reduce((a, b) => a + b, 0);
      const statsRoleDistribution: StatsRoleDistribution[] = Array.from(statsRoleCounts.entries())
        .map(([role, responseCount]) => ({
          role,
          responseCount,
          percentage: statsRoleTotal > 0 ? Math.round((responseCount / statsRoleTotal) * 100) : 0,
        }))
        .sort((a, b) => b.responseCount - a.responseCount);

      // Session-role aggregation for task history
      const sessionRoles = new Map<string, Map<string, number>>();
      if (messages) {
        for (const msg of messages) {
          if (!sessionRoles.has(msg.session_id)) {
            sessionRoles.set(msg.session_id, new Map());
          }
          const sMap = sessionRoles.get(msg.session_id)!;
          sMap.set(msg.role, (sMap.get(msg.role) || 0) + 1);
        }
      }

      // Task history: fetch session titles
      const sessionIds = Array.from(sessionRoles.keys());
      let taskHistory: TaskHistory[] = [];
      if (sessionIds.length > 0) {
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id, title')
          .in('id', sessionIds.slice(0, 20));

        if (sessions) {
          taskHistory = sessions.map(s => {
            const roles = sessionRoles.get(s.id);
            const topRole = roles 
              ? Array.from(roles.entries()).sort((a, b) => b[1] - a[1])[0]
              : null;
            const totalInSession = roles 
              ? Array.from(roles.values()).reduce((a, b) => a + b, 0)
              : 0;
            return {
              sessionId: s.id,
              sessionTitle: s.title,
              role: topRole?.[0] || 'assistant',
              responseCount: totalInSession,
            };
          }).sort((a, b) => b.responseCount - a.responseCount);
        }
      }

      // Duels: find sessions with 2+ models
      let duels: DuelRecord[] = [];
      if (sessionIds.length > 0) {
        const { data: duelMessages } = await supabase
          .from('messages')
          .select('session_id, model_name, metadata')
          .eq('user_id', user.id)
          .neq('role', 'user')
          .not('model_name', 'is', null)
          .in('session_id', sessionIds.slice(0, 20));

        if (duelMessages) {
          // Group by session and find sessions with other models
          const sessionModels = new Map<string, Map<string, number>>();
          for (const msg of duelMessages) {
            if (!msg.model_name) continue;
            if (!sessionModels.has(msg.session_id)) {
              sessionModels.set(msg.session_id, new Map());
            }
            const mMap = sessionModels.get(msg.session_id)!;
            const meta = msg.metadata as Record<string, unknown> | null;
            const rating = typeof meta?.rating === 'number' ? meta.rating : 0;
            mMap.set(msg.model_name, (mMap.get(msg.model_name) || 0) + rating);
          }

          const sessionsData = await supabase
            .from('sessions')
            .select('id, title')
            .in('id', Array.from(sessionModels.keys()));

          const sessionTitleMap = new Map(
            (sessionsData.data || []).map(s => [s.id, s.title])
          );

          for (const [sid, models] of sessionModels) {
            if (models.size < 2 || !models.has(modelId)) continue;
            const myScore = models.get(modelId) || 0;
            for (const [otherId, otherScore] of models) {
              if (otherId === modelId) continue;
              let result: 'win' | 'loss' | 'draw' = 'draw';
              if (myScore > otherScore) result = 'win';
              else if (myScore < otherScore) result = 'loss';
              duels.push({
                opponentModelId: otherId,
                opponentModelName: otherId,
                result,
                sessionTitle: sessionTitleMap.get(sid) || sid,
              });
            }
          }
        }
      }

      // ── Collect critiques from multiple sources ──
      const critiques: CritiqueEntry[] = [];
      const seenTexts = new Set<string>();

      // 1) From contest_results arbiter_comment
      const { data: contestCritiques } = await supabase
        .from('contest_results')
        .select('arbiter_comment, arbiter_score, session_id')
        .eq('model_id', modelId)
        .not('arbiter_comment', 'is', null);

      if (contestCritiques) {
        // Determine session types (contest vs duel)
        const critiqueSessionIds = [...new Set(contestCritiques.map(c => c.session_id))];
        let sessionTypeMap = new Map<string, string>();
        if (critiqueSessionIds.length > 0) {
          const { data: cSessions } = await supabase
            .from('contest_sessions')
            .select('id, config')
            .in('id', critiqueSessionIds);
          if (cSessions) {
            for (const s of cSessions) {
              const cfg = s.config as Record<string, unknown> | null;
              sessionTypeMap.set(s.id, cfg?.type === 'duel' ? 'duel' : 'contest');
            }
          }
        }
        for (const cr of contestCritiques) {
          if (!cr.arbiter_comment || cr.arbiter_comment.trim().length === 0) continue;
          if (seenTexts.has(cr.arbiter_comment)) continue;
          seenTexts.add(cr.arbiter_comment);
          const source = sessionTypeMap.get(cr.session_id) === 'duel' ? 'duel' : 'contest';
          critiques.push({
            text: cr.arbiter_comment,
            score: cr.arbiter_score != null ? Number(cr.arbiter_score) : null,
            source,
          });
        }
      }

      // 2) From model_statistics critique_summary (panel / dchat evaluations)
      if (statsRows) {
        for (const row of statsRows) {
          const summary = (row as any).critique_summary as string | null;
          if (!summary || summary.trim().length === 0) continue;
          if (seenTexts.has(summary)) continue;
          seenTexts.add(summary);
          // If row has contest data it's already covered; treat remaining as panel
          const hasContestData = ((row as any).contest_count || 0) > 0;
          if (!hasContestData) {
            critiques.push({
              text: summary,
              score: (row as any).arbiter_score ? Number((row as any).arbiter_score) : null,
              source: 'panel',
            });
          }
        }
      }

      setData({
        modelId,
        registry,
        stats,
        statsRoleDistribution,
        taskHistory,
        duels,
        critiques,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to fetch model dossier:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [user, modelId]);

  useEffect(() => {
    setData(prev => ({ ...prev, loading: true, modelId: modelId || '' }));
    fetchDossier();
  }, [fetchDossier]);

  return data;
}

/**
 * Hook to get list of "veteran" model IDs (models that have been used in tasks).
 */
export function useVeteranModels() {
  const { user } = useAuth();
  const [veteranIds, setVeteranIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      try {
        // Get distinct model_names from messages
        const { data } = await supabase
          .from('messages')
          .select('model_name')
          .eq('user_id', user.id)
          .neq('role', 'user')
          .not('model_name', 'is', null);

        if (data) {
          const unique = [...new Set(data.map(m => m.model_name).filter(Boolean))] as string[];
          setVeteranIds(unique);
        }
      } catch (e) {
        console.error('Failed to fetch veteran models:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  return { veteranIds, loading };
}
