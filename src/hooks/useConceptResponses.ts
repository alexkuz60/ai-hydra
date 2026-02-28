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
        .select('id, role, content, content_en, model_name, created_at, metadata, request_group_id')
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
      const userMessages = allMessages.filter(m => m.role === 'user');

      const latestRequests = {
        visionary: userMessages.find(m => (m.metadata as Record<string, unknown> | null)?.concept_type === 'visionary') || null,
        strategist: userMessages.find(m => (m.metadata as Record<string, unknown> | null)?.concept_type === 'strategist') || null,
        patent: userMessages.find(m => (m.metadata as Record<string, unknown> | null)?.concept_type === 'patent') || null,
      };

      const findByRequestGroup = (conceptType: 'visionary' | 'strategist' | 'patent'): ConceptResponse | null => {
        const req = latestRequests[conceptType] as { request_group_id?: string | null } | null;
        const requestGroupId = req?.request_group_id;
        if (!requestGroupId) return null;

        const byGroup = nonUserMessages.filter(
          (m: any) => m.request_group_id && m.request_group_id === requestGroupId
        );
        if (byGroup.length === 0) return null;

        const exact = byGroup.find((m: any) => {
          const meta = m.metadata as Record<string, unknown> | null;
          return meta?.concept_type === conceptType;
        });

        return (exact || byGroup[0]) as unknown as ConceptResponse;
      };

      // Priority 1: strict match by the latest request_group_id (prevents stale fallback)
      let latestVisionary: ConceptResponse | null = findByRequestGroup('visionary');
      let latestStrategist: ConceptResponse | null = findByRequestGroup('strategist');
      let latestPatent: ConceptResponse | null = findByRequestGroup('patent');

      // Priority 2: metadata concept_type (only when there is no newer pending request)
      if (!latestVisionary && !latestRequests.visionary) {
        latestVisionary = (nonUserMessages.find((m: any) => (m.metadata as Record<string, unknown> | null)?.concept_type === 'visionary') as unknown as ConceptResponse) || null;
      }
      if (!latestStrategist && !latestRequests.strategist) {
        latestStrategist = (nonUserMessages.find((m: any) => (m.metadata as Record<string, unknown> | null)?.concept_type === 'strategist') as unknown as ConceptResponse) || null;
      }
      if (!latestPatent && !latestRequests.patent) {
        latestPatent = (nonUserMessages.find((m: any) => (m.metadata as Record<string, unknown> | null)?.concept_type === 'patent') as unknown as ConceptResponse) || null;
      }

      // Priority 3: legacy role-based fallback (no pending request only)
      if (!latestVisionary && !latestRequests.visionary) {
        latestVisionary = (nonUserMessages.find(m => m.role === 'visionary') as unknown as ConceptResponse) || null;
      }
      if (!latestStrategist && !latestRequests.strategist) {
        latestStrategist = (nonUserMessages.find(m => m.role === 'strategist') as unknown as ConceptResponse) || null;
      }

      // Priority 4: legacy patent fallback for old data without request_group_id/concept_type
      if (!latestPatent && !latestRequests.patent) {
        for (const userMsg of userMessages) {
          const uMeta = userMsg.metadata as Record<string, unknown> | null;
          const isPatentRequest = uMeta?.concept_type === 'patent' ||
            userMsg.content?.includes('[Патентный прогноз]') ||
            userMsg.content?.includes('[Patent Forecast]');

          if (isPatentRequest) {
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
