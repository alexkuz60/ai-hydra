import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageCompression';
import { sanitizeFileName } from '@/lib/fileUtils';
import { PerModelSettingsData, DEFAULT_MODEL_SETTINGS } from '@/components/warroom/PerModelSettings';
import { LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS } from '@/hooks/useAvailableModels';
import { AttachedFile } from '@/components/warroom/FileUpload';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Json } from '@/integrations/supabase/types';

interface AttachmentUrl {
  name: string;
  url: string;
  type: string;
}

interface UseSendMessageProps {
  userId: string | null;
  sessionId: string | null;
  selectedModels: string[];
  perModelSettings: PerModelSettingsData;
}

interface UseSendMessageReturn {
  sending: boolean;
  uploadProgress: { current: number; total: number } | null;
  attachedFiles: AttachedFile[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<AttachedFile[]>>;
  sendMessage: (messageContent: string) => Promise<void>;
  sendToConsultant: (messageContent: string, consultantId: string) => Promise<void>;
}

export function useSendMessage({
  userId,
  sessionId,
  selectedModels,
  perModelSettings,
}: UseSendMessageProps): UseSendMessageReturn {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // Upload files and return URLs
  const uploadFiles = useCallback(async (
    files: AttachedFile[]
  ): Promise<AttachmentUrl[]> => {
    if (!userId || !sessionId) return [];

    const attachmentUrls: AttachmentUrl[] = [];
    const totalFiles = files.length;

    if (totalFiles > 0) {
      setUploadProgress({ current: 0, total: totalFiles });
    }

    for (let i = 0; i < files.length; i++) {
      const attached = files[i];
      setUploadProgress({ current: i, total: totalFiles });

      const fileToUpload = await compressImage(attached.file);
      const safeName = sanitizeFileName(attached.file.name);
      const filePath = `${userId}/${sessionId}/${Date.now()}_${safeName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('message-files')
        .upload(filePath, fileToUpload);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('message-files')
          .getPublicUrl(filePath);
        attachmentUrls.push({
          name: attached.file.name,
          url: urlData.publicUrl,
          type: attached.file.type,
        });
      } else {
        console.error('Upload error:', uploadError);
        toast.error(`${t('files.uploadError')}: ${attached.file.name}`);
      }

      if (attached.preview) {
        URL.revokeObjectURL(attached.preview);
      }

      setUploadProgress({ current: i + 1, total: totalFiles });
    }

    setUploadProgress(null);
    return attachmentUrls;
  }, [userId, sessionId, t]);

  // Call the Hydra orchestrator
  const callOrchestrator = useCallback(async (
    messageContent: string,
    attachmentUrls: AttachmentUrl[],
    models: any[]
  ) => {
    const session = await supabase.auth.getSession();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hydra-orchestrator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: messageContent,
          attachments: attachmentUrls,
          models,
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
      return;
    }

    if (data.errors && data.errors.length > 0) {
      data.errors.forEach((err: { model: string; error: string }) => {
        toast.error(`${err.model}: ${err.error}`);
      });
    }
  }, [sessionId]);

  // Send message to selected models
  const sendMessage = useCallback(async (messageContent: string) => {
    if (!userId || !sessionId || !messageContent.trim() || selectedModels.length === 0) return;
    
    // Narrowed types after guard
    const currentSessionId = sessionId;
    const currentUserId = userId;
    
    setSending(true);
    const filesToUpload = [...attachedFiles];
    setAttachedFiles([]);

    try {
      const attachmentUrls = await uploadFiles(filesToUpload);

      // Insert user message
      const messageMetadata: Json | undefined = attachmentUrls.length > 0 
        ? { attachments: attachmentUrls as unknown as Json } 
        : undefined;

      const insertData = {
        session_id: currentSessionId,
        user_id: currentUserId,
        role: 'user' as const,
        content: messageContent,
        metadata: messageMetadata,
      };

      const { error } = await supabase
        .from('messages')
        .insert([insertData]);

      if (error) throw error;

      // Prepare models with their settings
      const modelsToCall = selectedModels.map(modelId => {
        const isLovable = LOVABLE_AI_MODELS.some(m => m.id === modelId);
        const personalModel = PERSONAL_KEY_MODELS.find(m => m.id === modelId);
        const settings = perModelSettings[modelId] || DEFAULT_MODEL_SETTINGS;
        return {
          model_id: modelId,
          use_lovable_ai: isLovable,
          provider: personalModel?.provider || null,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          system_prompt: settings.systemPrompt,
          role: settings.role,
          enable_tools: settings.enableTools ?? true,
          enabled_tools: settings.enabledTools ?? ['calculator', 'current_datetime', 'web_search'],
          enabled_custom_tools: settings.enabledCustomTools ?? [],
        };
      });

      await callOrchestrator(messageContent, attachmentUrls, modelsToCall);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  }, [userId, sessionId, selectedModels, perModelSettings, attachedFiles, uploadFiles, callOrchestrator]);

  // Send message to a specific consultant
  const sendToConsultant = useCallback(async (messageContent: string, consultantId: string) => {
    if (!userId || !sessionId || !messageContent.trim() || !consultantId) return;

    // Narrowed types after guard
    const currentSessionId = sessionId;
    const currentUserId = userId;

    setSending(true);
    const filesToUpload = [...attachedFiles];
    setAttachedFiles([]);

    try {
      const attachmentUrls = await uploadFiles(filesToUpload);

      // Insert user message
      const messageMetadata: Json | undefined = attachmentUrls.length > 0 
        ? { attachments: attachmentUrls as unknown as Json } 
        : undefined;

      const insertData = {
        session_id: currentSessionId,
        user_id: currentUserId,
        role: 'user' as const,
        content: messageContent,
        metadata: messageMetadata,
      };

      const { error } = await supabase
        .from('messages')
        .insert([insertData]);

      if (error) throw error;

      // Prepare consultant model
      const isLovable = LOVABLE_AI_MODELS.some(m => m.id === consultantId);
      const personalModel = PERSONAL_KEY_MODELS.find(m => m.id === consultantId);
      const settings = perModelSettings[consultantId] || DEFAULT_MODEL_SETTINGS;

      const consultantModel = {
        model_id: consultantId,
        use_lovable_ai: isLovable,
        provider: personalModel?.provider || null,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        system_prompt: settings.systemPrompt || DEFAULT_MODEL_SETTINGS.systemPrompt,
        role: 'consultant' as const,
        enable_tools: settings.enableTools ?? true,
        enabled_tools: settings.enabledTools ?? ['calculator', 'current_datetime', 'web_search'],
        enabled_custom_tools: settings.enabledCustomTools ?? [],
      };

      await callOrchestrator(messageContent, attachmentUrls, [consultantModel]);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  }, [userId, sessionId, perModelSettings, attachedFiles, uploadFiles, callOrchestrator]);

  return {
    sending,
    uploadProgress,
    attachedFiles,
    setAttachedFiles,
    sendMessage,
    sendToConsultant,
  };
}
