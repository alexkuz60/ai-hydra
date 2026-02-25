import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ConceptResponse {
  id: string;
  role: string;
  content: string;
  content_en: string | null;
  model_name: string | null;
  created_at: string;
}

export interface ConceptResponses {
  visionary: ConceptResponse | null;
  strategist: ConceptResponse | null;
  patent: ConceptResponse | null;
}

export function useConceptResponses(planId: string | null) {
  const { user } = useAuth();
  const [responses, setResponses] = useState<ConceptResponses>({
    visionary: null,
    strategist: null,
    patent: null,
  });
  const [loading, setLoading] = useState(false);

  const fetchResponses = useCallback(async () => {
    if (!planId || !user?.id) return;

    setLoading(true);
    try {
      // Find the concept session
      const { data: conceptSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('plan_id', planId)
        .eq('user_id', user.id)
        .or('title.ilike.%цели и концепция%,title.ilike.%goals and concept%')
        .limit(1)
        .maybeSingle();

      if (!conceptSession) {
        setResponses({ visionary: null, strategist: null, patent: null });
        setLoading(false);
        return;
      }

      // Fetch latest messages with visionary/strategist roles
      const { data: roleMessages } = await supabase
        .from('messages')
        .select('id, role, content, content_en, model_name, created_at')
        .eq('session_id', conceptSession.id)
        .eq('user_id', user.id)
        .in('role', ['visionary', 'strategist'])
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch latest non-user, non-visionary, non-strategist messages (patent attorney responses)
      const { data: otherMessages } = await supabase
        .from('messages')
        .select('id, role, content, content_en, model_name, created_at')
        .eq('session_id', conceptSession.id)
        .eq('user_id', user.id)
        .not('role', 'eq', 'user')
        .not('role', 'in', '("visionary","strategist")')
        .order('created_at', { ascending: false })
        .limit(10);

      const latestVisionary = roleMessages?.find(m => m.role === 'visionary') || null;
      const latestStrategist = roleMessages?.find(m => m.role === 'strategist') || null;
      // Patent attorney — latest non-user response that's not visionary/strategist
      const latestPatent = otherMessages?.[0] || null;

      setResponses({
        visionary: latestVisionary as ConceptResponse | null,
        strategist: latestStrategist as ConceptResponse | null,
        patent: latestPatent as ConceptResponse | null,
      });
    } catch (err) {
      console.error('Failed to fetch concept responses:', err);
    } finally {
      setLoading(false);
    }
  }, [planId, user?.id]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  return { responses, loading, refetch: fetchResponses };
}
