import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageCompression';
import { sanitizeFileName } from '@/lib/fileUtils';
import { PerModelSettingsData, DEFAULT_MODEL_SETTINGS } from '@/components/warroom/PerModelSettings';
import { getModelInfo } from '@/hooks/useAvailableModels';
import { CONSULTANT_MODE_TO_MESSAGE_ROLE } from '@/config/roles';
import { AttachedFile } from '@/components/warroom/FileUpload';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Json } from '@/integrations/supabase/types';
import { markModelUnavailable, parseModelError } from '@/lib/modelAvailabilityCache';
import type { RequestStartInfo } from '@/types/pending';

// Generate a UUID v4 for request_group_id
function generateUUID(): string {
  return crypto.randomUUID();
}

// Helper function to build model configuration - centralized to avoid duplication
function buildModelConfig(
  modelId: string, 
  perModelSettings: PerModelSettingsData,
  roleOverride?: string
) {
  const { isLovable, provider } = getModelInfo(modelId);
  const settings = perModelSettings[modelId] || DEFAULT_MODEL_SETTINGS;
  
  // Build tool settings from the new format or legacy format
  const toolSettings = settings.toolSettings || {};
  const enabledTools = settings.enabledTools ?? ['calculator', 'current_datetime', 'web_search'];
  
  return {
    model_id: modelId,
    use_lovable_ai: isLovable,
    provider: provider,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    system_prompt: roleOverride === 'consultant' ? (settings.systemPrompt || DEFAULT_MODEL_SETTINGS.systemPrompt) : settings.systemPrompt,
    role: roleOverride || settings.role,
    enable_tools: settings.enableTools ?? true,
    enabled_tools: enabledTools,
    tool_settings: toolSettings, // New: includes usage modes
    enabled_custom_tools: settings.enabledCustomTools ?? [],
    search_provider: settings.searchProvider ?? 'tavily',
    requires_approval: settings.requiresApproval ?? false,
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
  selectedModelsRef?: React.MutableRefObject<string[]>;
  messages?: Array<{ id?: string; role: string; content: string; isStreaming?: boolean }>;
  /** Latest message ID to use as parent_message_id for the next user message */
  lastMessageId?: string | null;
}

interface UseSendMessageReturn {
  sending: boolean;
  uploadProgress: { current: number; total: number } | null;
  attachedFiles: AttachedFile[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<AttachedFile[]>>;
  sendMessage: (messageContent: string, extraMetadata?: Record<string, unknown>) => Promise<void>;
  sendUserMessageOnly: (messageContent: string, extraMetadata?: Record<string, unknown>) => Promise<void>;
  sendToConsultant: (messageContent: string, consultantId: string) => Promise<void>;
  copyConsultantResponse: (content: string, sourceMessageId: string | null, modelName?: string | null, role?: string | null) => Promise<void>;
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
  messages: externalMessages,
  lastMessageId,
}: UseSendMessageProps): UseSendMessageReturn {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const messagesRef = useRef(externalMessages);
  messagesRef.current = externalMessages;

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
        const { data: signedData, error: signedError } = await supabase.storage
          .from('message-files')
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year
        if (signedData && !signedError) {
          attachmentUrls.push({
            name: attached.file.name,
            url: signedData.signedUrl,
            type: attached.file.type,
          });
        }
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
    models: ReturnType<typeof buildModelConfig>[],
    requestGroupId?: string
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
          request_group_id: requestGroupId || null,
          history: (messagesRef.current || [])
            .filter(m => !m.isStreaming && (m.role === 'user' || m.role === 'assistant'))
            .slice(-10)
            .map(m => ({ role: m.role, content: m.content })),
        }),
      }
    );

    const data = await response.json() as { error?: string; errors?: Array<{ model: string; error: string }> };

    if (!response.ok) {
      if (response.status === 429) {
        toast.error(t('errors.rateLimit'));
      } else if (response.status === 402) {
        toast.error(t('errors.paymentRequired'));
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
      return;
    }

    if (data.errors && data.errors.length > 0) {
      const failedModelIds: string[] = [];
      const currentSelectedModels = selectedModelsRef?.current || selectedModels;

      data.errors.forEach((err: { model: string; error: string }) => {
        failedModelIds.push(err.model);

        const isModelStillSelected = currentSelectedModels.includes(err.model) ||
                                     err.model.includes('consultant');
        if (!isModelStillSelected) return;

        const { isUnavailable, errorCode } = parseModelError(err.model, err.error);
        if (isUnavailable) {
          markModelUnavailable(err.model, errorCode, err.error);
          toast.error(`${err.model}: Модель недоступна (${errorCode}). Она будет скрыта.`);
        } else {
          toast.error(`${err.model}: ${err.error}`);
        }
      });

      if (onRequestError && failedModelIds.length > 0) {
        onRequestError(failedModelIds);
      }
    }
  }, [sessionId, onRequestError, selectedModelsRef, selectedModels, t]);

  // Send message to selected models
  const sendMessage = useCallback(async (messageContent: string, extraMetadata?: Record<string, unknown>) => {
    if (!userId || !sessionId || !messageContent.trim() || selectedModels.length === 0) return;
    
    const currentSessionId = sessionId;
    const currentUserId = userId;
    
    setSending(true);
    const filesToUpload = [...attachedFiles];
    setAttachedFiles([]);

    try {
      const attachmentUrls = await uploadFiles(filesToUpload);

      // Generate request_group_id for grouping parallel expert responses
      const requestGroupId = generateUUID();

      // Insert user message with parent_message_id and request_group_id
      const messageMetadata: Json | undefined = (attachmentUrls.length > 0 || extraMetadata)
        ? { 
            ...(attachmentUrls.length > 0 ? { attachments: attachmentUrls } : {}),
            ...extraMetadata,
          } as unknown as Json
        : undefined;

      const insertData = {
        session_id: currentSessionId,
        user_id: currentUserId,
        role: 'user' as const,
        content: messageContent,
        metadata: messageMetadata,
        parent_message_id: lastMessageId || null,
        request_group_id: requestGroupId,
      };

      const { error } = await supabase
        .from('messages')
        .insert([insertData]);

      if (error) throw error;

      // Prepare models with their settings
      const modelsToCall = selectedModels.map(modelId => buildModelConfig(modelId, perModelSettings));

      // Notify about request start for skeleton indicators
      if (onRequestStart) {
        const requestInfo: RequestStartInfo[] = modelsToCall.map(m => {
          const modelName = m.model_id.split('/').pop() || m.model_id;
          return {
            modelId: m.model_id,
            modelName,
            role: (m.role || 'assistant') as RequestStartInfo['role'],
          };
        });
        onRequestStart(requestInfo);
      }

      await callOrchestrator(messageContent, attachmentUrls, modelsToCall, requestGroupId);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setSending(false);
    }
  }, [userId, sessionId, selectedModels, perModelSettings, attachedFiles, uploadFiles, callOrchestrator, onRequestStart, lastMessageId]);

  // Send ONLY user message to DB (for hybrid streaming - AI responses handled by streaming hook)
  const sendUserMessageOnly = useCallback(async (messageContent: string, extraMetadata?: Record<string, unknown>) => {
    if (!userId || !sessionId || !messageContent.trim()) return;
    
    const currentSessionId = sessionId;
    const currentUserId = userId;
    
    setSending(true);
    const filesToUpload = [...attachedFiles];
    setAttachedFiles([]);

    try {
      const attachmentUrls = await uploadFiles(filesToUpload);

      // Insert user message only - NO orchestrator call
      const messageMetadata: Json | undefined = (attachmentUrls.length > 0 || extraMetadata)
        ? { 
            ...(attachmentUrls.length > 0 ? { attachments: attachmentUrls } : {}),
            ...extraMetadata,
          } as unknown as Json
        : undefined;

      const { error } = await supabase
        .from('messages')
        .insert([{
          session_id: currentSessionId,
          user_id: currentUserId,
          role: 'user' as const,
          content: messageContent,
          metadata: messageMetadata,
          parent_message_id: lastMessageId || null,
          request_group_id: generateUUID(),
        }]);

      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setSending(false);
    }
  }, [userId, sessionId, attachedFiles, uploadFiles, lastMessageId]);

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

      const requestGroupId = generateUUID();
      const insertData = {
        session_id: currentSessionId,
        user_id: currentUserId,
        role: 'user' as const,
        content: messageContent,
        metadata: messageMetadata,
        parent_message_id: lastMessageId || null,
        request_group_id: requestGroupId,
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

      await callOrchestrator(messageContent, attachmentUrls, [consultantModel], requestGroupId);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setSending(false);
    }
  }, [userId, sessionId, perModelSettings, attachedFiles, uploadFiles, callOrchestrator, lastMessageId]);

  // Copy consultant response to main chat - always append at the end
  const copyConsultantResponse = useCallback(async (
    content: string,
    sourceMessageId: string | null,
    modelName?: string | null,
    role?: string | null
  ) => {
    if (!userId || !sessionId || !content.trim()) return;

    const currentSessionId = sessionId;
    const currentUserId = userId;

    try {
      const metadata: Json | undefined = sourceMessageId 
        ? { source_message_id: sourceMessageId } as unknown as Json
        : undefined;

      // Map consultant mode to message role using centralized mapping
      const validRoles = ['assistant', 'critic', 'arbiter', 'consultant', 'moderator', 'advisor', 'archivist', 'analyst', 'webhunter', 'promptengineer', 'flowregulator', 'toolsmith'];
      const mapped = role ? (CONSULTANT_MODE_TO_MESSAGE_ROLE[role] || role) : 'consultant';
      const messageRole = validRoles.includes(mapped) ? mapped : 'consultant';

      const { error } = await supabase.from('messages').insert([{
        session_id: currentSessionId,
        user_id: currentUserId,
        role: messageRole as 'assistant' | 'critic' | 'arbiter' | 'consultant' | 'moderator' | 'advisor' | 'archivist' | 'analyst' | 'webhunter' | 'promptengineer' | 'flowregulator' | 'toolsmith',
        content,
        model_name: modelName || null,
        metadata,
      }]);

      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
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
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
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
