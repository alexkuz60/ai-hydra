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

/** Context from previous pipeline steps */
export interface PipelineContext {
  visionaryResponse?: string | null;
  strategistResponse?: string | null;
  fileDigests?: string | null;
}

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

/** Returns the AI response content string (or null on failure) */
export function useConceptInvoke({ planId, planTitle, planGoal, onComplete }: UseConceptInvokeOptions) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState<ConceptExpertType | null>(null);

  const invoke = useCallback(async (expertType: ConceptExpertType, pipelineContext?: PipelineContext, modelOverride?: string): Promise<string | null> => {
    if (!user?.id || !planGoal?.trim()) return null;

    setLoading(expertType);

    try {
      // 1. Find the concept session
      const { data: conceptSession } = await supabase
        .from('sessions')
        .select('id, session_config')
        .eq('plan_id', planId)
        .eq('user_id', user.id)
        .or('title.ilike.%цели и концепция%,title.ilike.%goals and concept%')
        .order('sort_order', { ascending: true })
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
        return null;
      }

      // 2. Detect search provider in parallel with building message
      const searchProviderPromise = detectSearchProvider();
      const today = currentDateString();

      // 3. Build user message with date context
      // Build context sections from pipeline
      const vCtx = pipelineContext?.visionaryResponse;
      const sCtx = pipelineContext?.strategistResponse;
      const fCtx = pipelineContext?.fileDigests;
      const visionCtxRu = vCtx ? `\n\n--- Видение Визионера ---\n${vCtx}` : '';
      const visionCtxEn = vCtx ? `\n\n--- Visionary's Vision ---\n${vCtx}` : '';
      const stratCtxRu = sCtx ? `\n\n--- Стратегическая структура ---\n${sCtx}` : '';
      const stratCtxEn = sCtx ? `\n\n--- Strategic Structure ---\n${sCtx}` : '';
      const filesCtxRu = fCtx ? `\n\n--- Прикреплённые материалы (дайджесты файлов) ---\n${fCtx}` : '';
      const filesCtxEn = fCtx ? `\n\n--- Attached Materials (File Digests) ---\n${fCtx}` : '';

      const messages: Record<ConceptExpertType, Record<string, string>> = {
        visionary: {
          ru: `[Видение Визионера] Дата запроса: ${today}. Сформулируй визионерскую концепцию проекта "${planTitle}". Рассмотри созвучность актуальным трендам, рыночным потребностям и конкурентный ландшафт по теме плана. Используй web_search для поиска самых свежих данных о трендах и рынке. Концепция: ${planGoal}${filesCtxRu}`,
          en: `[Visionary Vision] Request date: ${today}. Formulate a visionary concept for the project "${planTitle}". Consider alignment with current trends, market needs, and the competitive landscape for this plan's topic. Use web_search to find the latest data on trends and market. Concept: ${planGoal}${filesCtxEn}`,
        },
        strategist: {
          ru: `[Стратегическая структура] Дата запроса: ${today}. Декомпозируй цели проекта "${planTitle}" в иерархию аспектов и задач. Используй web_search для поиска актуальных методологий и лучших практик. Концепция: ${planGoal}${visionCtxRu}${filesCtxRu}`,
          en: `[Strategic Structure] Request date: ${today}. Decompose the goals of project "${planTitle}" into a hierarchy of aspects and tasks. Use web_search to find current methodologies and best practices. Concept: ${planGoal}${visionCtxEn}${filesCtxEn}`,
        },
        patent: {
          ru: `[Патентный прогноз] Дата запроса: ${today}. Проведи патентный анализ концепции "${planTitle}". Используй patent_search и web_search для поиска актуальных патентных аналогов и уровня техники. Описание: ${planGoal}${visionCtxRu}${stratCtxRu}${filesCtxRu}`,
          en: `[Patent Forecast] Request date: ${today}. Conduct a patent analysis for the concept "${planTitle}". Use patent_search and web_search to find current patent analogues and prior art. Description: ${planGoal}${visionCtxEn}${stratCtxEn}${filesCtxEn}`,
        },
      };

      const messageContent = messages[expertType][language === 'ru' ? 'ru' : 'en'];
      const requestGroupId = crypto.randomUUID();

      // 4. Clean up old concept messages & associated memory chunks before re-invocation
      const { data: oldConceptMsgs } = await supabase
        .from('messages')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .filter('metadata->>concept_type', 'eq', expertType);

      if (oldConceptMsgs && oldConceptMsgs.length > 0) {
        const oldMsgIds = oldConceptMsgs.map(m => m.id);
        
        // Delete session_memory chunks tagged with this concept_type
        // (chunks created by archivist during previous expert runs)
        await supabase
          .from('session_memory')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .filter('metadata->>concept_type', 'eq', expertType);

        // Also delete chunks linked via source_message_id to old concept messages
        await supabase
          .from('session_memory')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .in('source_message_id', oldMsgIds);

        // Delete old concept messages themselves
        await supabase
          .from('messages')
          .delete()
          .in('id', oldMsgIds)
          .eq('user_id', user.id);

        console.log(`[concept-invoke] Cleaned up ${oldMsgIds.length} old ${expertType} messages and associated memory chunks`);
      }

      // 5. Insert user message with concept_type metadata
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

      // 6. Determine model and search provider
      const modelId = modelOverride || DEFAULT_MODEL;
      const searchProvider = await searchProviderPromise;

      // 7. Call hydra-orchestrator with tools enabled
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
          concept_type: expertType,
          history: [],
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to get AI response');
      }

      // 8. Extract AI response content from orchestrator result
      let responseContent: string | null = null;
      if (fnData?.results && Array.isArray(fnData.results)) {
        const successResult = fnData.results.find((r: any) => r.content && !r.error);
        if (successResult) {
          responseContent = successResult.content;
        }
      }

      // 9. Poll for DB persistence so that useConceptResponses can find the response
      if (!responseContent) {
        // Orchestrator may return content differently; poll DB as fallback
        for (let attempt = 0; attempt < 20; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          const { data: aiResponses } = await supabase
            .from('messages')
            .select('id, content, metadata, request_group_id')
            .eq('session_id', sessionId)
            .eq('request_group_id', requestGroupId)
            .neq('role', 'user')
            .order('created_at', { ascending: false })
            .limit(5);

          if (aiResponses && aiResponses.length > 0) {
            responseContent = aiResponses[0].content;
            break;
          }
        }
      } else {
        // We got content from orchestrator response; still wait briefly for DB write
        // so that useConceptResponses picks it up for UI display
        for (let attempt = 0; attempt < 10; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: check } = await supabase
            .from('messages')
            .select('id')
            .eq('session_id', sessionId)
            .eq('request_group_id', requestGroupId)
            .neq('role', 'user')
            .limit(1);

          if (check && check.length > 0) break;
        }
      }

      if (!responseContent) {
        console.warn(`[concept-invoke] No AI response content received for ${expertType}`);
      }

      toast.success(
        language === 'ru' 
          ? 'Ответ эксперта получен' 
          : 'Expert response received'
      );

      onComplete?.();
      return responseContent;
    } catch (err) {
      console.error(`[concept-invoke] ${expertType} error:`, err);
      toast.error(
        language === 'ru'
          ? 'Ошибка при вызове эксперта'
          : 'Error invoking expert'
      );
      return null;
    } finally {
      setLoading(null);
    }
  }, [user?.id, planId, planTitle, planGoal, language, onComplete]);

  return { invoke, loading };
}
