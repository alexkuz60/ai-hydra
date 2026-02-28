import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StalenessInfo {
  role: string;
  /** Number of knowledge updates since last hire */
  updatesSinceHire: number;
  /** Whether a different model is now the default vs what was hired */
  modelChanged: boolean;
  /** Current default model */
  currentModel: string | null;
  /** Model that was hired */
  hiredModel: string | null;
}

interface StalenessResult {
  /** Roles that need attention */
  staleRoles: StalenessInfo[];
  /** Quick check: any staleness detected */
  hasStaleRoles: boolean;
  /** Loading state */
  loading: boolean;
}

/**
 * Client-side hook to detect knowledge staleness for active role assignments.
 * Used in D-Chat expert panel, SPRZ concept development, and contest/duel selection.
 * 
 * Complements backend triggers (which create supervisor_notifications)
 * by providing real-time UI warnings during active work.
 */
export function useKnowledgeStaleness(roles?: string[]): StalenessResult {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-staleness', user?.id, roles],
    queryFn: async (): Promise<StalenessInfo[]> => {
      if (!user?.id) return [];

      // 1. Get all active assignments
      const { data: assignments, error: assignErr } = await supabase
        .from('role_assignment_history')
        .select('role, model_id, assigned_at')
        .eq('user_id', user.id)
        .is('removed_at', null)
        .order('assigned_at', { ascending: false });

      if (assignErr || !assignments?.length) return [];

      // Deduplicate: latest assignment per role
      const latestByRole = new Map<string, { model_id: string; assigned_at: string }>();
      for (const a of assignments) {
        if (!latestByRole.has(a.role)) {
          latestByRole.set(a.role, { model_id: a.model_id, assigned_at: a.assigned_at });
        }
      }

      // Filter to requested roles if specified
      const targetRoles = roles
        ? [...latestByRole.keys()].filter(r => roles.includes(r))
        : [...latestByRole.keys()];

      if (!targetRoles.length) return [];

      // 2. Get default models from user_settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('setting_value')
        .eq('user_id', user.id)
        .eq('setting_key', 'tech-role-defaults')
        .maybeSingle();

      const defaults = (settingsData?.setting_value as Record<string, string>) || {};

      // 3. Count knowledge updates per role since hire
      const results: StalenessInfo[] = [];

      for (const role of targetRoles) {
        const assignment = latestByRole.get(role)!;

        const { count } = await supabase
          .from('role_knowledge' as any)
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('role', role)
          .gt('updated_at', assignment.assigned_at);

        const currentDefault = defaults[role] || null;
        const modelChanged = currentDefault !== null && currentDefault !== assignment.model_id;

        const updatesSinceHire = count ?? 0;

        if (updatesSinceHire >= 2 || modelChanged) {
          results.push({
            role,
            updatesSinceHire,
            modelChanged,
            currentModel: currentDefault,
            hiredModel: assignment.model_id,
          });
        }
      }

      return results;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    staleRoles: data ?? [],
    hasStaleRoles: (data?.length ?? 0) > 0,
    loading: isLoading,
  };
}
