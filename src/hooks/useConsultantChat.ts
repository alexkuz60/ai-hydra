import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS } from '@/hooks/useAvailableModels';

export type ConsultantMode = 'web_search' | 'expert' | 'critic' | 'arbiter';

export interface ConsultantMessage {
  id: string;
  role: 'user' | 'consultant';
  content: string;
  mode: ConsultantMode;
  model_name: string | null;
  tool_calls?: any[];
  tool_results?: any[];
  created_at: string;
  isLoading?: boolean;
}

interface UseConsultantChatProps {
  sessionId: string | null;
}

interface UseConsultantChatReturn {
  messages: ConsultantMessage[];
  sending: boolean;
  sendQuery: (
    content: string,
    mode: ConsultantMode,
    modelId: string
  ) => Promise<void>;
  clearMessages: () => void;
}

// Map consultant mode to message role
const modeToRole: Record<ConsultantMode, 'consultant' | 'critic' | 'arbiter' | 'assistant'> = {
  web_search: 'consultant',
  expert: 'assistant',
  critic: 'critic',
  arbiter: 'arbiter',
};

export function useConsultantChat({
  sessionId,
}: UseConsultantChatProps): UseConsultantChatReturn {
  const [messages, setMessages] = useState<ConsultantMessage[]>([]);
  const [sending, setSending] = useState(false);

  const sendQuery = useCallback(
    async (content: string, mode: ConsultantMode, modelId: string) => {
      if (!sessionId || !content.trim() || !modelId) return;

      setSending(true);

      // Add user message
      const userMessage: ConsultantMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        mode,
        model_name: null,
        created_at: new Date().toISOString(),
      };

      // Add placeholder for AI response
      const placeholderId = crypto.randomUUID();
      const placeholderMessage: ConsultantMessage = {
        id: placeholderId,
        role: 'consultant',
        content: '',
        mode,
        model_name: modelId,
        created_at: new Date().toISOString(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMessage, placeholderMessage]);

      try {
        const session = await supabase.auth.getSession();
        const isLovable = LOVABLE_AI_MODELS.some((m) => m.id === modelId);
        const personalModel = PERSONAL_KEY_MODELS.find((m) => m.id === modelId);

        // Determine role and enabled tools based on mode
        const role = modeToRole[mode];
        const enabledTools = mode === 'web_search' 
          ? ['web_search'] 
          : ['calculator', 'current_datetime'];

        const modelConfig = {
          model_id: modelId,
          use_lovable_ai: isLovable,
          provider: personalModel?.provider || null,
          temperature: 0.7,
          max_tokens: 4096,
          system_prompt: null, // Use default role prompt
          role,
          enable_tools: true,
          enabled_tools: enabledTools,
          enabled_custom_tools: [],
        };

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hydra-orchestrator`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.data.session?.access_token}`,
            },
            body: JSON.stringify({
              session_id: sessionId,
              message: content,
              attachments: [],
              models: [modelConfig],
              is_dchat: true, // Mark as D-chat request
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429) {
            toast.error('Превышен лимит запросов. Попробуйте позже.');
          } else if (response.status === 402) {
            toast.error('Требуется пополнение баланса Lovable AI.');
          } else {
            throw new Error(data.error || 'Failed to get AI response');
          }
          // Remove placeholder on error
          setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
          return;
        }

        // Update placeholder with actual response
        const aiResponse = data.responses?.[0];
        if (aiResponse) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === placeholderId
                ? {
                    ...m,
                    content: aiResponse.content || '',
                    tool_calls: aiResponse.tool_calls,
                    tool_results: aiResponse.tool_results,
                    isLoading: false,
                  }
                : m
            )
          );
        } else {
          // Remove placeholder if no response
          setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
        }

        if (data.errors && data.errors.length > 0) {
          data.errors.forEach((err: { model: string; error: string }) => {
            toast.error(`${err.model}: ${err.error}`);
          });
        }
      } catch (error: any) {
        toast.error(error.message);
        // Remove placeholder on error
        setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
      } finally {
        setSending(false);
      }
    },
    [sessionId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sending,
    sendQuery,
    clearMessages,
  };
}
