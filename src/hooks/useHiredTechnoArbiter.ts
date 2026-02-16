import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getTechRoleDefaultModel } from './useTechRoleDefaults';

const FALLBACK_ARBITER = 'google/gemini-2.5-pro';

/**
 * Returns the model hired as TechnoArbiter via interview.
 * Falls back to tech-role default, then to a hardcoded model.
 */
export function useHiredTechnoArbiter() {
  const { user } = useAuth();

  const { data: hiredModel, isLoading } = useQuery({
    queryKey: ['hired-technoarbiter', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('role_assignment_history')
        .select('model_id')
        .eq('user_id', user.id)
        .eq('role', 'technoarbiter')
        .is('removed_at', null)
        .order('assigned_at', { ascending: false })
        .limit(1);
      return data?.[0]?.model_id ?? null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Priority: hired → tech role default → hardcoded
  const effectiveArbiter =
    hiredModel ||
    getTechRoleDefaultModel('technoarbiter') ||
    FALLBACK_ARBITER;

  return { hiredModel, effectiveArbiter, isLoading };
}

/**
 * Standalone (non-React) getter for the hired TechnoArbiter.
 * Useful in edge function call builders outside React tree.
 */
export async function getHiredTechnoArbiterModel(userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('role_assignment_history')
      .select('model_id')
      .eq('user_id', userId)
      .eq('role', 'technoarbiter')
      .is('removed_at', null)
      .order('assigned_at', { ascending: false })
      .limit(1);
    if (data?.[0]?.model_id) return data[0].model_id;
  } catch {}
  return getTechRoleDefaultModel('technoarbiter') || FALLBACK_ARBITER;
}
