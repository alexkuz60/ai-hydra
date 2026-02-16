import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Knowledge snapshot stored in user_settings when a role is certified.
 * Used to detect if knowledge/prompts changed since last hire.
 */
export interface KnowledgeSnapshot {
  /** Count of role_knowledge entries at snapshot time */
  knowledge_count: number;
  /** Latest updated_at from role_knowledge */
  knowledge_latest_at: string | null;
  /** Count of prompt_library entries for this role */
  prompts_count: number;
  /** Latest updated_at from prompt_library */
  prompts_latest_at: string | null;
  /** When the snapshot was taken */
  snapshotted_at: string;
}

interface CurrentKnowledgeState {
  knowledge_count: number;
  knowledge_latest_at: string | null;
  prompts_count: number;
  prompts_latest_at: string | null;
}

interface VersioningResult {
  /** Whether knowledge has changed since last certification */
  hasChanged: boolean;
  /** Current state counts */
  current: CurrentKnowledgeState | null;
  /** Saved snapshot from last certification */
  snapshot: KnowledgeSnapshot | null;
  /** Loading state */
  loading: boolean;
  /** Change details for tooltip */
  changeSummary: string | null;
}

function settingsKey(role: string) {
  return `knowledge_snapshot_${role}`;
}

/**
 * Detect whether a role's knowledge/prompts changed since last certification.
 * Compares current DB state with the snapshot saved at hire time.
 */
export function useKnowledgeVersioning(role: string | null): VersioningResult {
  const { user } = useAuth();

  // Fetch snapshot from user_settings
  const { data: snapshot, isLoading: loadingSnapshot } = useQuery({
    queryKey: ['knowledge-snapshot', user?.id, role],
    queryFn: async () => {
      if (!user?.id || !role) return null;
      const { data, error } = await supabase
        .from('user_settings')
        .select('setting_value')
        .eq('user_id', user.id)
        .eq('setting_key', settingsKey(role))
        .maybeSingle();
      if (error || !data) return null;
      return data.setting_value as unknown as KnowledgeSnapshot;
    },
    enabled: !!user?.id && !!role,
    staleTime: 60_000,
  });

  // Fetch current knowledge state
  const { data: current, isLoading: loadingCurrent } = useQuery({
    queryKey: ['knowledge-current-state', user?.id, role],
    queryFn: async (): Promise<CurrentKnowledgeState | null> => {
      if (!user?.id || !role) return null;

      // role_knowledge count & latest
      const { count: knowledgeCount, data: knowledgeLatest } = await supabase
        .from('role_knowledge' as any)
        .select('updated_at', { count: 'exact', head: false })
        .eq('user_id', user.id)
        .eq('role', role)
        .order('updated_at', { ascending: false })
        .limit(1);

      // prompt_library count & latest for this role
      const { count: promptsCount, data: promptsLatest } = await supabase
        .from('prompt_library')
        .select('updated_at', { count: 'exact', head: false })
        .eq('user_id', user.id)
        .eq('role', role)
        .order('updated_at', { ascending: false })
        .limit(1);

      return {
        knowledge_count: knowledgeCount ?? 0,
        knowledge_latest_at: (knowledgeLatest as any)?.[0]?.updated_at || null,
        prompts_count: promptsCount ?? 0,
        prompts_latest_at: (promptsLatest as any)?.[0]?.updated_at || null,
      };
    },
    enabled: !!user?.id && !!role,
    staleTime: 30_000,
  });

  // Compare
  const hasChanged = (() => {
    if (!snapshot || !current) return false;

    // Count changed
    if (current.knowledge_count !== snapshot.knowledge_count) return true;
    if (current.prompts_count !== snapshot.prompts_count) return true;

    // Content updated after snapshot
    if (current.knowledge_latest_at && snapshot.snapshotted_at &&
        current.knowledge_latest_at > snapshot.snapshotted_at) return true;
    if (current.prompts_latest_at && snapshot.snapshotted_at &&
        current.prompts_latest_at > snapshot.snapshotted_at) return true;

    return false;
  })();

  // Build change summary for tooltip
  const changeSummary = (() => {
    if (!hasChanged || !snapshot || !current) return null;
    const parts: string[] = [];
    const kDiff = current.knowledge_count - snapshot.knowledge_count;
    if (kDiff !== 0) parts.push(`knowledge: ${kDiff > 0 ? '+' : ''}${kDiff}`);
    const pDiff = current.prompts_count - snapshot.prompts_count;
    if (pDiff !== 0) parts.push(`prompts: ${pDiff > 0 ? '+' : ''}${pDiff}`);
    if (parts.length === 0 && (
      (current.knowledge_latest_at && current.knowledge_latest_at > snapshot.snapshotted_at) ||
      (current.prompts_latest_at && current.prompts_latest_at > snapshot.snapshotted_at)
    )) {
      parts.push('content updated');
    }
    return parts.join(', ');
  })();

  return {
    hasChanged,
    current,
    snapshot,
    loading: loadingSnapshot || loadingCurrent,
    changeSummary,
  };
}

/**
 * Save a knowledge snapshot for a role (called on hire).
 */
export async function saveKnowledgeSnapshot(
  userId: string,
  role: string,
): Promise<void> {
  // Get current counts
  const { count: knowledgeCount, data: knowledgeLatest } = await supabase
    .from('role_knowledge' as any)
    .select('updated_at', { count: 'exact', head: false })
    .eq('user_id', userId)
    .eq('role', role)
    .order('updated_at', { ascending: false })
    .limit(1);

  const { count: promptsCount, data: promptsLatest } = await supabase
    .from('prompt_library')
    .select('updated_at', { count: 'exact', head: false })
    .eq('user_id', userId)
    .eq('role', role)
    .order('updated_at', { ascending: false })
    .limit(1);

  const snapshot: KnowledgeSnapshot = {
    knowledge_count: knowledgeCount ?? 0,
    knowledge_latest_at: (knowledgeLatest as any)?.[0]?.updated_at || null,
    prompts_count: promptsCount ?? 0,
    prompts_latest_at: (promptsLatest as any)?.[0]?.updated_at || null,
    snapshotted_at: new Date().toISOString(),
  };

  const key = settingsKey(role);

  // Upsert into user_settings
  const { data: existing } = await supabase
    .from('user_settings')
    .select('id')
    .eq('user_id', userId)
    .eq('setting_key', key)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('user_settings')
      .update({ setting_value: snapshot as any })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        setting_key: key,
        setting_value: snapshot as any,
      });
  }
}
