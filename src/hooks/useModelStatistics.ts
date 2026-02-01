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
  
  // Increment response count for a model in a session
  const incrementResponse = useCallback(async (modelId: string, sessionId: string) => {
    if (!userId) return;

    try {
      // Try to update existing record
      const { data: existing } = await supabase
        .from('model_statistics')
        .select('id, response_count')
        .eq('user_id', userId)
        .eq('model_id', modelId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('model_statistics')
          .update({
            response_count: existing.response_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert new record
        await supabase
          .from('model_statistics')
          .insert({
            user_id: userId,
            model_id: modelId,
            session_id: sessionId,
            response_count: 1,
            first_used_at: new Date().toISOString(),
            last_used_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Failed to increment response count:', error);
    }
  }, [userId]);

  // Increment dismissal count for a model in a session
  const incrementDismissal = useCallback(async (modelId: string, sessionId: string) => {
    if (!userId) return;

    try {
      // Try to update existing record
      const { data: existing } = await supabase
        .from('model_statistics')
        .select('id, dismissal_count')
        .eq('user_id', userId)
        .eq('model_id', modelId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('model_statistics')
          .update({
            dismissal_count: existing.dismissal_count + 1
          })
          .eq('id', existing.id);
      } else {
        // Insert new record with dismissal
        await supabase
          .from('model_statistics')
          .insert({
            user_id: userId,
            model_id: modelId,
            session_id: sessionId,
            dismissal_count: 1,
            first_used_at: new Date().toISOString(),
            last_used_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Failed to increment dismissal count:', error);
    }
  }, [userId]);

  // Add brains (rating) to a model in a session
  const addBrains = useCallback(async (modelId: string, sessionId: string, count: number = 1) => {
    if (!userId) return;

    try {
      const { data: existing } = await supabase
        .from('model_statistics')
        .select('id, total_brains')
        .eq('user_id', userId)
        .eq('model_id', modelId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('model_statistics')
          .update({
            total_brains: existing.total_brains + count
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('model_statistics')
          .insert({
            user_id: userId,
            model_id: modelId,
            session_id: sessionId,
            total_brains: count,
            first_used_at: new Date().toISOString(),
            last_used_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Failed to add brains:', error);
    }
  }, [userId]);

  // Get statistics for a specific model (aggregated across all sessions)
  const getModelStats = useCallback(async (modelId: string): Promise<AggregatedModelStats | null> => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('model_statistics')
        .select('*')
        .eq('user_id', userId)
        .eq('model_id', modelId);

      if (error || !data || data.length === 0) return null;

      // Aggregate stats across all sessions
      const aggregated: AggregatedModelStats = {
        model_id: modelId,
        total_responses: data.reduce((sum, r) => sum + r.response_count, 0),
        total_brains: data.reduce((sum, r) => sum + r.total_brains, 0),
        total_dismissals: data.reduce((sum, r) => sum + r.dismissal_count, 0),
        sessions_count: data.length,
        first_used_at: data.reduce((earliest, r) => 
          r.first_used_at < earliest ? r.first_used_at : earliest, 
          data[0].first_used_at
        ),
        last_used_at: data.reduce((latest, r) => 
          r.last_used_at > latest ? r.last_used_at : latest, 
          data[0].last_used_at
        )
      };

      return aggregated;
    } catch (error) {
      console.error('Failed to get model stats:', error);
      return null;
    }
  }, [userId]);

  // Get session-specific stats for a model
  const getSessionStats = useCallback(async (modelId: string, sessionId: string): Promise<ModelStats | null> => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('model_statistics')
        .select('*')
        .eq('user_id', userId)
        .eq('model_id', modelId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error || !data) return null;
      return data as ModelStats;
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return null;
    }
  }, [userId]);

  // Get leaderboard of all models by total brains or responses
  const getLeaderboard = useCallback(async (sortBy: 'brains' | 'responses' = 'brains'): Promise<AggregatedModelStats[]> => {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('model_statistics')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) return [];

      // Group by model_id and aggregate
      const modelMap = new Map<string, AggregatedModelStats>();
      
      for (const record of data) {
        const existing = modelMap.get(record.model_id);
        if (existing) {
          existing.total_responses += record.response_count;
          existing.total_brains += record.total_brains;
          existing.total_dismissals += record.dismissal_count;
          existing.sessions_count += 1;
          if (record.first_used_at < existing.first_used_at) {
            existing.first_used_at = record.first_used_at;
          }
          if (record.last_used_at > existing.last_used_at) {
            existing.last_used_at = record.last_used_at;
          }
        } else {
          modelMap.set(record.model_id, {
            model_id: record.model_id,
            total_responses: record.response_count,
            total_brains: record.total_brains,
            total_dismissals: record.dismissal_count,
            sessions_count: 1,
            first_used_at: record.first_used_at,
            last_used_at: record.last_used_at
          });
        }
      }

      const leaderboard = Array.from(modelMap.values());
      
      // Sort by specified metric
      if (sortBy === 'brains') {
        leaderboard.sort((a, b) => b.total_brains - a.total_brains);
      } else {
        leaderboard.sort((a, b) => b.total_responses - a.total_responses);
      }

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
    getModelStats,
    getSessionStats,
    getLeaderboard
  };
}
