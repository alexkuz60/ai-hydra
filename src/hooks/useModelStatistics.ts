import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ModelStats {
  model_id: string;
  session_id: string | null;
  response_count: number;
  total_brains: number;
  dismissal_count: number;
  first_used_at: string;
  last_used_at: string;
}

interface AggregatedModelStats {
  model_id: string;
  total_responses: number;
  total_brains: number;
  total_dismissals: number;
  sessions_count: number;
  first_used_at: string;
  last_used_at: string;
}

export function useModelStatistics(userId: string | undefined) {

  // Helper: find existing record for (user, model, session)
  const findExisting = useCallback(async (modelId: string, sessionId: string | null) => {
    let query = supabase
      .from('model_statistics')
      .select('*')
      .eq('user_id', userId!)
      .eq('model_id', modelId);
    
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    } else {
      query = query.is('session_id', null);
    }
    
    const { data } = await query.maybeSingle();
    return data;
  }, [userId]);

  // Increment response count, optionally recording role_used
  const incrementResponse = useCallback(async (
    modelId: string, sessionId: string, roleUsed?: string
  ) => {
    if (!userId) return;
    try {
      const existing = await findExisting(modelId, sessionId);
      if (existing) {
        const updates: Record<string, unknown> = {
          response_count: existing.response_count + 1,
          last_used_at: new Date().toISOString(),
        };
        if (roleUsed) updates.role_used = roleUsed;
        await supabase.from('model_statistics').update(updates).eq('id', existing.id);
      } else {
        const row: Record<string, unknown> = {
          user_id: userId, model_id: modelId, session_id: sessionId,
          response_count: 1,
          first_used_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        };
        if (roleUsed) row.role_used = roleUsed;
        await supabase.from('model_statistics').insert(row as any);
      }
    } catch (error) {
      console.error('Failed to increment response count:', error);
    }
  }, [userId, findExisting]);

  // Increment dismissal count
  const incrementDismissal = useCallback(async (modelId: string, sessionId: string) => {
    if (!userId) return;
    try {
      const existing = await findExisting(modelId, sessionId);
      if (existing) {
        await supabase.from('model_statistics')
          .update({ dismissal_count: existing.dismissal_count + 1 })
          .eq('id', existing.id);
      } else {
        await supabase.from('model_statistics').insert({
          user_id: userId, model_id: modelId, session_id: sessionId,
          dismissal_count: 1,
          first_used_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to increment dismissal count:', error);
    }
  }, [userId, findExisting]);

  // Add brains (rating)
  const addBrains = useCallback(async (modelId: string, sessionId: string, count: number = 1) => {
    if (!userId) return;
    try {
      const existing = await findExisting(modelId, sessionId);
      if (existing) {
        await supabase.from('model_statistics')
          .update({ total_brains: existing.total_brains + count })
          .eq('id', existing.id);
      } else {
        await supabase.from('model_statistics').insert({
          user_id: userId, model_id: modelId, session_id: sessionId,
          total_brains: count,
          first_used_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to add brains:', error);
    }
  }, [userId, findExisting]);

  // Increment hallucination count
  const incrementHallucination = useCallback(async (modelId: string, sessionId: string) => {
    if (!userId) return;
    try {
      const existing = await findExisting(modelId, sessionId);
      const currentCount = (existing as any)?.hallucination_count || 0;
      if (existing) {
        await supabase.from('model_statistics')
          .update({ hallucination_count: currentCount + 1 } as any)
          .eq('id', existing.id);
      } else {
        await supabase.from('model_statistics').insert({
          user_id: userId, model_id: modelId, session_id: sessionId,
          hallucination_count: 1,
          first_used_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        } as any);
      }
    } catch (error) {
      console.error('Failed to increment hallucination count:', error);
    }
  }, [userId, findExisting]);

  // Record arbiter evaluation score
  const addArbiterEval = useCallback(async (modelId: string, sessionId: string | null, score: number, summary?: string) => {
    if (!userId) return;
    try {
      const existing = await findExisting(modelId, sessionId);
      const prevScore = Number((existing as any)?.arbiter_score) || 0;
      const prevCount = (existing as any)?.arbiter_eval_count || 0;
      const newCount = prevCount + 1;
      const newAvg = (prevScore * prevCount + score) / newCount;

      const updates: Record<string, unknown> = {
        arbiter_score: newAvg,
        arbiter_eval_count: newCount,
      };
      if (summary) updates.critique_summary = summary;

      if (existing) {
        await supabase.from('model_statistics').update(updates as any).eq('id', existing.id);
      } else {
        await supabase.from('model_statistics').insert({
          user_id: userId, model_id: modelId, session_id: sessionId || undefined,
          ...updates,
          first_used_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        } as any);
      }
    } catch (error) {
      console.error('Failed to add arbiter eval:', error);
    }
  }, [userId, findExisting]);

  // Record contest participation
  const addContestResult = useCallback(async (modelId: string, sessionId: string | null, score: number) => {
    if (!userId) return;
    try {
      const existing = await findExisting(modelId, sessionId);
      const prevCount = (existing as any)?.contest_count || 0;
      const prevTotal = Number((existing as any)?.contest_total_score) || 0;

      if (existing) {
        await supabase.from('model_statistics').update({
          contest_count: prevCount + 1,
          contest_total_score: prevTotal + score,
        } as any).eq('id', existing.id);
      } else {
        await supabase.from('model_statistics').insert({
          user_id: userId, model_id: modelId, session_id: sessionId || undefined,
          contest_count: 1, contest_total_score: score,
          first_used_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        } as any);
      }
    } catch (error) {
      console.error('Failed to add contest result:', error);
    }
  }, [userId, findExisting]);

  // Update criteria_averages (running average per criterion) with optional prefix for source
  const updateCriteriaAverages = useCallback(async (
    modelId: string, sessionId: string | null, criteriaScores: Record<string, number>, sourcePrefix?: 'contest' | 'duel_critic' | 'duel_arbiter'
  ) => {
    if (!userId || !criteriaScores || Object.keys(criteriaScores).length === 0) return;
    try {
      const existing = await findExisting(modelId, sessionId);
      const prev: Record<string, { sum: number; count: number }> =
        (existing as any)?.criteria_averages || {};

      const updated: Record<string, { sum: number; count: number }> = { ...prev };
      for (const [key, score] of Object.entries(criteriaScores)) {
        // Add prefix if provided, e.g. "contest:factuality" or "duel_arbiter:impartiality"
        const prefixedKey = sourcePrefix ? `${sourcePrefix}:${key}` : key;
        const entry = updated[prefixedKey] || { sum: 0, count: 0 };
        updated[prefixedKey] = { sum: entry.sum + score, count: entry.count + 1 };
      }

      if (existing) {
        await supabase.from('model_statistics')
          .update({ criteria_averages: updated } as any)
          .eq('id', existing.id);
      } else {
        await supabase.from('model_statistics').insert({
          user_id: userId, model_id: modelId, session_id: sessionId || undefined,
          criteria_averages: updated,
          first_used_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        } as any);
      }
    } catch (error) {
      console.error('Failed to update criteria averages:', error);
    }
  }, [userId, findExisting]);
  // Get statistics for a specific model (aggregated across all sessions)
  const getModelStats = useCallback(async (modelId: string): Promise<AggregatedModelStats | null> => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('model_statistics').select('*')
        .eq('user_id', userId).eq('model_id', modelId);
      if (error || !data || data.length === 0) return null;

      const aggregated: AggregatedModelStats = {
        model_id: modelId,
        total_responses: data.reduce((sum, r) => sum + r.response_count, 0),
        total_brains: data.reduce((sum, r) => sum + r.total_brains, 0),
        total_dismissals: data.reduce((sum, r) => sum + r.dismissal_count, 0),
        sessions_count: data.length,
        first_used_at: data.reduce((earliest, r) =>
          r.first_used_at! < earliest ? r.first_used_at! : earliest, data[0].first_used_at!),
        last_used_at: data.reduce((latest, r) =>
          r.last_used_at! > latest ? r.last_used_at! : latest, data[0].last_used_at!),
      };
      return aggregated;
    } catch (error) {
      console.error('Failed to get model stats:', error);
      return null;
    }
  }, [userId]);

  // Get session-specific stats
  const getSessionStats = useCallback(async (modelId: string, sessionId: string): Promise<ModelStats | null> => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('model_statistics').select('*')
        .eq('user_id', userId).eq('model_id', modelId).eq('session_id', sessionId)
        .maybeSingle();
      if (error || !data) return null;
      return data as ModelStats;
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return null;
    }
  }, [userId]);

  // Get leaderboard
  const getLeaderboard = useCallback(async (sortBy: 'brains' | 'responses' = 'brains'): Promise<AggregatedModelStats[]> => {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('model_statistics').select('*').eq('user_id', userId);
      if (error || !data) return [];

      const modelMap = new Map<string, AggregatedModelStats>();
      for (const record of data) {
        const existing = modelMap.get(record.model_id);
        if (existing) {
          existing.total_responses += record.response_count;
          existing.total_brains += record.total_brains;
          existing.total_dismissals += record.dismissal_count;
          existing.sessions_count += 1;
          if (record.first_used_at! < existing.first_used_at) existing.first_used_at = record.first_used_at!;
          if (record.last_used_at! > existing.last_used_at) existing.last_used_at = record.last_used_at!;
        } else {
          modelMap.set(record.model_id, {
            model_id: record.model_id,
            total_responses: record.response_count,
            total_brains: record.total_brains,
            total_dismissals: record.dismissal_count,
            sessions_count: 1,
            first_used_at: record.first_used_at!,
            last_used_at: record.last_used_at!,
          });
        }
      }

      const leaderboard = Array.from(modelMap.values());
      leaderboard.sort((a, b) => sortBy === 'brains'
        ? b.total_brains - a.total_brains
        : b.total_responses - a.total_responses
      );
      return leaderboard;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }, [userId]);

  return {
    incrementResponse,
    incrementDismissal,
    addBrains,
    incrementHallucination,
    addArbiterEval,
    addContestResult,
    updateCriteriaAverages,
    getModelStats,
    getSessionStats,
    getLeaderboard,
  };
}
