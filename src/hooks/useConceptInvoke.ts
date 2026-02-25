import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export type ConceptExpertType = 'visionary' | 'strategist' | 'patent';

const DEFAULT_MODEL = 'google/gemini-2.5-flash';

const ROLE_MAP: Record<ConceptExpertType, string> = {
  visionary: 'visionary',
  strategist: 'strategist',
  patent: 'assistant',
};

interface UseConceptInvokeOptions {
  planId: string;
  planTitle: string;
  planGoal: string;
  onComplete?: () => void;
}

export function useConceptInvoke({ planId, planTitle, planGoal, onComplete }: UseConceptInvokeOptions) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState<ConceptExpertType | null>(null);

  const invoke = useCallback(async (expertType: ConceptExpertType) => {
    if (!user?.id || !planGoal?.trim()) return;

    setLoading(expertType);

    try {
      // 1. Find the concept session
      const { data: conceptSession } = await supabase
        .from('sessions')
        .select('id, session_config')
        .eq('plan_id', planId)
        .eq('user_id', user.id)
        .or('title.ilike.%цели и концепция%,title.ilike.%goals and concept%')
        .limit(1)
        .maybeSingle();

      let sessionId = conceptSession?.id;

      if (!sessionId) {
        // Fallback to first session
        const { data: firstSession } = await supabase
          .from('sessions')
          .select('id')
          .eq('plan_id', planId)
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true })
          .limit(1)
          .maybeSingle();

        sessionId = firstSession?.id;
      }

      if (!sessionId) {
        toast.error(language === 'ru' ? 'Не найдена сессия концепции' : 'Concept session not found');
        return;
      }

      // 2. Build user message
      const messages: Record<ConceptExpertType, Record<string, string>> = {
        visionary: {
          ru: `[Видение Визионера] Сформулируй визионерскую концепцию проекта "${planTitle}". Рассмотри созвучность актуальным трендам, рыночным потребностям и конкурентный ландшафт по теме плана. Концепция: ${planGoal}`,
          en: `[Visionary Vision] Formulate a visionary concept for the project "${planTitle}". Consider alignment with current trends, market needs, and the competitive landscape for this plan's topic. Concept: ${planGoal}`,
        },
        strategist: {
          ru: `[Стратегическая структура] Декомпозируй цели проекта "${planTitle}" в иерархию аспектов и задач. Концепция: ${planGoal}`,
          en: `[Strategic Structure] Decompose the goals of project "${planTitle}" into a hierarchy of aspects and tasks. Concept: ${planGoal}`,
        },
        patent: {
          ru: `[Патентный прогноз] Проведи патентный анализ концепции "${planTitle}". Описание: ${planGoal}`,
          en: `[Patent Forecast] Conduct a patent analysis for the concept "${planTitle}". Description: ${planGoal}`,
        },
      };

      const messageContent = messages[expertType][language === 'ru' ? 'ru' : 'en'];
      const requestGroupId = crypto.randomUUID();
      const invokeTimestamp = new Date().toISOString();

      // 3. Insert user message with concept_type metadata
      const { error: insertError } = await supabase
        .from('messages')
        .insert([{
          session_id: sessionId,
          user_id: user.id,
          role: 'user' as const,
          content: messageContent,
          metadata: { concept_type: expertType },
          request_group_id: requestGroupId,
        }]);

      if (insertError) throw insertError;

      // 4. Determine model to use (from session config or default)
      const config = conceptSession?.session_config as any;
      const selectedModels: string[] = config?.selectedModels || [];
      const modelId = selectedModels[0] || DEFAULT_MODEL;

      // 5. Call hydra-orchestrator
      const role = ROLE_MAP[expertType];

      const { data: fnData, error: fnError } = await supabase.functions.invoke('hydra-orchestrator', {
        body: {
          session_id: sessionId,
          message: messageContent,
          attachments: [],
          models: [{
            model_id: modelId,
            use_lovable_ai: true,
            temperature: 0.7,
            max_tokens: 4096,
            role,
            enable_tools: false,
            enabled_tools: [],
            enabled_custom_tools: [],
          }],
          request_group_id: requestGroupId,
          history: [],
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to get AI response');
      }

      // 6. Tag the AI response with concept_type metadata
      // Poll for the AI response — search by session + time, not request_group_id
      // (orchestrator may not propagate request_group_id to the response)
      let tagged = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const { data: aiResponses } = await supabase
          .from('messages')
          .select('id, metadata')
          .eq('session_id', sessionId)
          .neq('role', 'user')
          .gt('created_at', invokeTimestamp)
          .order('created_at', { ascending: false })
          .limit(5);

        // Find the response that doesn't already have a concept_type or matches ours
        const target = aiResponses?.find(m => {
          const meta = (m.metadata as Record<string, unknown>) || {};
          return !meta.concept_type || meta.concept_type === expertType;
        });

        if (target) {
          const existing = (target.metadata as Record<string, unknown>) || {};
          await supabase
            .from('messages')
            .update({ metadata: { ...existing, concept_type: expertType } })
            .eq('id', target.id);
          tagged = true;
          break;
        }
      }

      if (!tagged) {
        console.warn(`[concept-invoke] Could not find AI response to tag for ${expertType}`);
      }

      toast.success(
        language === 'ru' 
          ? 'Ответ эксперта получен' 
          : 'Expert response received'
      );

      onComplete?.();
    } catch (err) {
      console.error(`[concept-invoke] ${expertType} error:`, err);
      toast.error(
        language === 'ru'
          ? 'Ошибка при вызове эксперта'
          : 'Error invoking expert'
      );
    } finally {
      setLoading(null);
    }
  }, [user?.id, planId, planTitle, planGoal, language, onComplete]);

  return { invoke, loading };
}
