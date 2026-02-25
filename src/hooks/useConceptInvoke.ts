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

/** Tools enabled per expert type */
const TOOLS_MAP: Record<ConceptExpertType, string[]> = {
  visionary: ['web_search', 'current_datetime'],
  strategist: ['web_search', 'current_datetime'],
  patent: ['web_search', 'current_datetime', 'patent_search'],
};

interface UseConceptInvokeOptions {
  planId: string;
  planTitle: string;
  planGoal: string;
  onComplete?: () => void;
}

/** Detect which search provider the user has configured */
async function detectSearchProvider(): Promise<'tavily' | 'perplexity' | 'both'> {
  try {
    const { data } = await supabase.rpc('get_my_api_key_status');
    if (data && data.length > 0) {
      const status = data[0] as { has_perplexity?: boolean; has_tavily?: boolean };
      const hasPplx = status.has_perplexity || false;
      const hasTavily = status.has_tavily || false;
      if (hasPplx && hasTavily) return 'both';
      if (hasPplx) return 'perplexity';
    }
  } catch (e) {
    console.warn('[concept-invoke] Could not detect search provider:', e);
  }
  return 'tavily'; // system key fallback
}

function currentDateString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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

      // 2. Detect search provider in parallel with building message
      const searchProviderPromise = detectSearchProvider();
      const today = currentDateString();

      // 3. Build user message with date context
      const messages: Record<ConceptExpertType, Record<string, string>> = {
        visionary: {
          ru: `[Видение Визионера] Дата запроса: ${today}. Сформулируй визионерскую концепцию проекта "${planTitle}". Рассмотри созвучность актуальным трендам, рыночным потребностям и конкурентный ландшафт по теме плана. Используй web_search для поиска самых свежих данных о трендах и рынке. Концепция: ${planGoal}`,
          en: `[Visionary Vision] Request date: ${today}. Formulate a visionary concept for the project "${planTitle}". Consider alignment with current trends, market needs, and the competitive landscape for this plan's topic. Use web_search to find the latest data on trends and market. Concept: ${planGoal}`,
        },
        strategist: {
          ru: `[Стратегическая структура] Дата запроса: ${today}. Декомпозируй цели проекта "${planTitle}" в иерархию аспектов и задач. Используй web_search для поиска актуальных методологий и лучших практик. Концепция: ${planGoal}`,
          en: `[Strategic Structure] Request date: ${today}. Decompose the goals of project "${planTitle}" into a hierarchy of aspects and tasks. Use web_search to find current methodologies and best practices. Concept: ${planGoal}`,
        },
        patent: {
          ru: `[Патентный прогноз] Дата запроса: ${today}. Проведи патентный анализ концепции "${planTitle}". Используй patent_search и web_search для поиска актуальных патентных аналогов и уровня техники. Описание: ${planGoal}`,
          en: `[Patent Forecast] Request date: ${today}. Conduct a patent analysis for the concept "${planTitle}". Use patent_search and web_search to find current patent analogues and prior art. Description: ${planGoal}`,
        },
      };

      const messageContent = messages[expertType][language === 'ru' ? 'ru' : 'en'];
      const requestGroupId = crypto.randomUUID();
      const invokeTimestamp = new Date().toISOString();

      // 4. Insert user message with concept_type metadata
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

      // 5. Determine model and search provider
      const config = conceptSession?.session_config as any;
      const selectedModels: string[] = config?.selectedModels || [];
      const modelId = selectedModels[0] || DEFAULT_MODEL;
      const searchProvider = await searchProviderPromise;

      // 6. Call hydra-orchestrator with tools enabled
      const role = ROLE_MAP[expertType];
      const enabledTools = TOOLS_MAP[expertType];

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
            enable_tools: true,
            enabled_tools: enabledTools,
            enabled_custom_tools: [],
            search_provider: searchProvider,
          }],
          request_group_id: requestGroupId,
          history: [],
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to get AI response');
      }

      // 7. Tag the AI response with concept_type metadata
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
