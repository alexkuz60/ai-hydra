import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageCompression';
import { sanitizeFileName } from '@/lib/fileUtils';
import { PerModelSettingsData, DEFAULT_MODEL_SETTINGS } from '@/components/warroom/PerModelSettings';
import { getModelInfo } from '@/hooks/useAvailableModels';
import { AttachedFile } from '@/components/warroom/FileUpload';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Json } from '@/integrations/supabase/types';
import { markModelUnavailable, parseModelError } from '@/lib/modelAvailabilityCache';
import type { RequestStartInfo } from '@/types/pending';

// Helper function to build model configuration - centralized to avoid duplication
function buildModelConfig(
  modelId: string, 
  perModelSettings: PerModelSettingsData,
  roleOverride?: string
) {
  const { isLovable, provider } = getModelInfo(modelId);
  const settings = perModelSettings[modelId] || DEFAULT_MODEL_SETTINGS;
  
  return {
    model_id: modelId,
    use_lovable_ai: isLovable,
    provider: provider,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    system_prompt: settings.systemPrompt || (roleOverride === 'consultant' ? DEFAULT_MODEL_SETTINGS.systemPrompt : settings.systemPrompt),
    role: roleOverride || settings.role,
    enable_tools: settings.enableTools ?? true,
    enabled_tools: settings.enabledTools ?? ['calculator', 'current_datetime', 'web_search'],
    enabled_custom_tools: settings.enabledCustomTools ?? [],
  };
}

interface AttachmentUrl {
  name: string;
  url: string;
  type: string;
  content?: string; // For inline Mermaid diagrams
}

interface UseSendMessageProps {
  userId: string | null;
  sessionId: string | null;
  selectedModels: string[];
  perModelSettings: PerModelSettingsData;
  onRequestStart?: (models: RequestStartInfo[]) => void;
  onRequestError?: (modelIds: string[]) => void;
  // Reference to current selectedModels for filtering errors from dismissed models
  selectedModelsRef?: React.MutableRefObject<string[]>;
}

interface UseSendMessageReturn {
  sending: boolean;
  uploadProgress: { current: number; total: number } | null;
  attachedFiles: AttachedFile[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<AttachedFile[]>>;
  sendMessage: (messageContent: string) => Promise<void>;
  sendUserMessageOnly: (messageContent: string) => Promise<void>;
  sendToConsultant: (messageContent: string, consultantId: string) => Promise<void>;
  copyConsultantResponse: (content: string, sourceMessageId: string | null) => Promise<void>;
  retrySingleModel: (modelId: string, messageContent: string) => Promise<void>;
}

export function useSendMessage({
  userId,
  sessionId,
  selectedModels,
  perModelSettings,
  onRequestStart,
  onRequestError,
  selectedModelsRef,
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
    // Count only files that need upload (not Mermaid)
    const filesToUpload = files.filter(f => f.file && !f.mermaidContent);
    const totalFiles = filesToUpload.length;

    if (totalFiles > 0) {
      setUploadProgress({ current: 0, total: totalFiles });
    }

    let uploadedCount = 0;

    for (const attached of files) {
      // Handle Mermaid attachments (no upload needed)
      if (attached.mermaidContent) {
        attachmentUrls.push({
          name: attached.mermaidName || 'Mermaid Diagram',
          url: '', // No URL for inline content
          type: 'text/x-mermaid',
          content: attached.mermaidContent,
        });
        continue;
      }

      // Handle regular file uploads
      if (!attached.file) continue;

      setUploadProgress({ current: uploadedCount, total: totalFiles });

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

      uploadedCount++;
      setUploadProgress({ current: uploadedCount, total: totalFiles });
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
      const failedModelIds: string[] = [];
      // Get current selected models to filter out dismissed ones
      const currentSelectedModels = selectedModelsRef?.current || selectedModels;
      
      data.errors.forEach((err: { model: string; error: string }) => {
        failedModelIds.push(err.model);
        
        // Skip showing errors for models that have been dismissed/removed from task
        const isModelStillSelected = currentSelectedModels.includes(err.model) || 
                                     err.model.includes('consultant');
        if (!isModelStillSelected) {
          console.log(`Skipping error toast for dismissed model: ${err.model}`);
          return;
        }
        
        // Check if this error indicates the model is unavailable
        const { isUnavailable, errorCode } = parseModelError(err.model, err.error);
        if (isUnavailable) {
          markModelUnavailable(err.model, errorCode, err.error);
          toast.error(`${err.model}: Модель недоступна (${errorCode}). Она будет скрыта.`);
        } else {
          toast.error(`${err.model}: ${err.error}`);
        }
      });
      // Notify about failed models to clear their skeletons
      if (onRequestError && failedModelIds.length > 0) {
        onRequestError(failedModelIds);
      }
    }
  }, [sessionId, onRequestError]);

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

      // Prepare models with their settings using centralized helper
      const modelsToCall = selectedModels.map(modelId => buildModelConfig(modelId, perModelSettings));

      // Notify about request start for skeleton indicators
      if (onRequestStart) {
        const requestInfo: RequestStartInfo[] = modelsToCall.map(m => {
          // Extract short model name from full ID
          const modelName = m.model_id.split('/').pop() || m.model_id;
          return {
            modelId: m.model_id,
            modelName,
            role: (m.role || 'assistant') as RequestStartInfo['role'],
          };
        });
        onRequestStart(requestInfo);
      }

      await callOrchestrator(messageContent, attachmentUrls, modelsToCall);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  }, [userId, sessionId, selectedModels, perModelSettings, attachedFiles, uploadFiles, callOrchestrator, onRequestStart]);

  // Send ONLY user message to DB (for hybrid streaming - AI responses handled by streaming hook)
  const sendUserMessageOnly = useCallback(async (messageContent: string) => {
    if (!userId || !sessionId || !messageContent.trim()) return;
    
    const currentSessionId = sessionId;
    const currentUserId = userId;
    
    setSending(true);
    const filesToUpload = [...attachedFiles];
    setAttachedFiles([]);

    try {
      const attachmentUrls = await uploadFiles(filesToUpload);

      // Insert user message only - NO orchestrator call
      const messageMetadata: Json | undefined = attachmentUrls.length > 0 
        ? { attachments: attachmentUrls as unknown as Json } 
        : undefined;

      const { error } = await supabase
        .from('messages')
        .insert([{
          session_id: currentSessionId,
          user_id: currentUserId,
          role: 'user' as const,
          content: messageContent,
          metadata: messageMetadata,
        }]);

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  }, [userId, sessionId, attachedFiles, uploadFiles]);

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

      // Prepare consultant model using centralized helper
      const consultantModel = buildModelConfig(consultantId, perModelSettings, 'consultant');

      // Notify about request start for skeleton indicator
      if (onRequestStart) {
        const modelName = consultantId.split('/').pop() || consultantId;
        onRequestStart([{
          modelId: consultantId,
          modelName,
          role: 'consultant',
        }]);
      }

      await callOrchestrator(messageContent, attachmentUrls, [consultantModel]);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
    setSending(false);
    }
  }, [userId, sessionId, perModelSettings, attachedFiles, uploadFiles, callOrchestrator]);

  // Copy consultant response to main chat - insert after the block of AI responses
  const copyConsultantResponse = useCallback(async (
    content: string,
    sourceMessageId: string | null
  ) => {
    if (!userId || !sessionId || !content.trim()) return;

    const currentSessionId = sessionId;
    const currentUserId = userId;

    try {
      let insertTimestamp: string | undefined;

      // If we have a source message ID, find the right position to insert
      if (sourceMessageId) {
        // Fetch all messages for this session to find the correct position
        const { data: allMessages } = await supabase
          .from('messages')
          .select('id, role, created_at')
          .eq('session_id', currentSessionId)
          .order('created_at', { ascending: true });

        if (allMessages) {
          // Find the source (supervisor) message index
          const sourceIndex = allMessages.findIndex(m => m.id === sourceMessageId);
          
          if (sourceIndex !== -1) {
            // Find the last AI response in this block (before next user message)
            let lastAiResponseIndex = sourceIndex;
            for (let i = sourceIndex + 1; i < allMessages.length; i++) {
              if (allMessages[i].role === 'user') break;
              lastAiResponseIndex = i;
            }

            // Set timestamp just after the last AI response (add 1 millisecond)
            const lastAiResponse = allMessages[lastAiResponseIndex];
            const lastTimestamp = new Date(lastAiResponse.created_at);
            lastTimestamp.setMilliseconds(lastTimestamp.getMilliseconds() + 1);
            insertTimestamp = lastTimestamp.toISOString();
          }
        }
      }

      const metadata: Json | undefined = sourceMessageId 
        ? { source_message_id: sourceMessageId } as unknown as Json
        : undefined;

      const insertData: any = {
        session_id: currentSessionId,
        user_id: currentUserId,
        role: 'consultant' as const,
        content,
        metadata,
      };

      // Set custom created_at to position the message correctly
      if (insertTimestamp) {
        insertData.created_at = insertTimestamp;
      }

      const { error } = await supabase.from('messages').insert(insertData);

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [userId, sessionId]);

  // Retry a single model with the given message content
  const retrySingleModel = useCallback(async (
    modelId: string,
    messageContent: string
  ) => {
    if (!userId || !sessionId || !messageContent.trim()) return;

    try {
      // Prepare model config using centralized helper
      const singleModel = buildModelConfig(modelId, perModelSettings);

      // Notify about request start for skeleton indicator
      if (onRequestStart) {
        const modelName = modelId.split('/').pop() || modelId;
        const settings = perModelSettings[modelId] || DEFAULT_MODEL_SETTINGS;
        onRequestStart([{
          modelId,
          modelName,
          role: settings.role,
        }]);
      }

      await callOrchestrator(messageContent, [], [singleModel]);
    } catch (error: any) {
      toast.error(error.message);
      // Notify about error to remove skeleton
      if (onRequestError) {
        onRequestError([modelId]);
      }
    }
  }, [userId, sessionId, perModelSettings, callOrchestrator, onRequestStart, onRequestError]);

  return {
    sending,
    uploadProgress,
    attachedFiles,
    setAttachedFiles,
    sendMessage,
    sendUserMessageOnly,
    sendToConsultant,
    copyConsultantResponse,
    retrySingleModel,
  };
}
