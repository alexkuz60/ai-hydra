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

      // Fetch ALL messages (user + assistant) ordered by recency
      const { data: allMessages } = await supabase
        .from('messages')
        .select('id, role, content, content_en, model_name, created_at, metadata')
        .eq('session_id', conceptSession.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!allMessages || allMessages.length === 0) {
        setResponses({ visionary: null, strategist: null, patent: null });
        setLoading(false);
        return;
      }

      const nonUserMessages = allMessages.filter(m => m.role !== 'user');

      // Priority 1: Match by metadata concept_type
      let latestVisionary: ConceptResponse | null = null;
      let latestStrategist: ConceptResponse | null = null;
      let latestPatent: ConceptResponse | null = null;

      for (const msg of nonUserMessages) {
        const meta = msg.metadata as Record<string, unknown> | null;
        const conceptType = meta?.concept_type as string | undefined;

        if (conceptType === 'visionary' && !latestVisionary) {
          latestVisionary = msg as unknown as ConceptResponse;
        } else if (conceptType === 'strategist' && !latestStrategist) {
          latestStrategist = msg as unknown as ConceptResponse;
        } else if (conceptType === 'patent' && !latestPatent) {
          latestPatent = msg as unknown as ConceptResponse;
        }
      }

      // Priority 2: Fallback to role-based matching
      if (!latestVisionary) {
        latestVisionary = (nonUserMessages.find(m => m.role === 'visionary') as unknown as ConceptResponse) || null;
      }
      if (!latestStrategist) {
        latestStrategist = (nonUserMessages.find(m => m.role === 'strategist') as unknown as ConceptResponse) || null;
      }

      // Priority 3: For patent (role=assistant), find assistant responses 
      // that immediately follow a patent user message
      if (!latestPatent) {
        const userMessages = allMessages.filter(m => m.role === 'user');
        for (const userMsg of userMessages) {
          const uMeta = userMsg.metadata as Record<string, unknown> | null;
          const isPatentRequest = uMeta?.concept_type === 'patent' || 
            userMsg.content?.includes('[Патентный прогноз]') || 
            userMsg.content?.includes('[Patent Forecast]');
          
          if (isPatentRequest) {
            // Find the first assistant response created after this user message
            const candidate = nonUserMessages.find(m => 
              m.role === 'assistant' && m.created_at > userMsg.created_at
            );
            if (candidate) {
              latestPatent = candidate as unknown as ConceptResponse;
              break;
            }
          }
        }
      }

      setResponses({
        visionary: latestVisionary,
        strategist: latestStrategist,
        patent: latestPatent,
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
