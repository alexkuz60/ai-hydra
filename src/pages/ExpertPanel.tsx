import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/imageCompression';
import { sanitizeFileName } from '@/lib/fileUtils';
import { Message, MessageRole } from '@/types/messages';

import { PerModelSettingsData, DEFAULT_MODEL_SETTINGS } from '@/components/warroom/PerModelSettings';
import { ChatMessage, UserDisplayInfo } from '@/components/warroom/ChatMessage';
import { FileUpload, AttachedFile } from '@/components/warroom/FileUpload';
import { ConsultantSelector } from '@/components/warroom/ConsultantSelector';
import { useAvailableModels, LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS, ModelOption } from '@/hooks/useAvailableModels';
import { usePasteHandler } from '@/hooks/usePasteHandler';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserRoles } from '@/hooks/useUserRoles';
import { 
  Send, 
  Loader2, 
  Sparkles,
  Target
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
}


export default function ExpertPanel() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { lovableModels, personalModels } = useAvailableModels();
  const { profile } = useUserProfile();
  const { isSupervisor } = useUserRoles();
  
  // User display info for chat messages
  const userDisplayInfo: UserDisplayInfo = {
    displayName: profile?.displayName || null,
    isSupervisor,
  };

  // Get initial state from navigation (passed from Tasks page)
  const initialState = location.state as {
    selectedModels?: string[];
    perModelSettings?: PerModelSettingsData;
  } | null;

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(initialState?.selectedModels || []);
  const [perModelSettings, setPerModelSettings] = useState<PerModelSettingsData>(initialState?.perModelSettings || {});
  const [initialStateApplied, setInitialStateApplied] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
  
  const { handlePaste } = usePasteHandler({ 
    attachedFiles, 
    setAttachedFiles, 
    disabled: sending 
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      const taskId = searchParams.get('task');
      if (taskId) {
        fetchTask(taskId);
      } else {
        // No task specified, load last task
        fetchLastTask();
      }
    }
  }, [user, authLoading, navigate, searchParams]);

  const prevMessagesLengthRef = useRef(messages.length);
  
  useEffect(() => {
    // Only scroll to bottom when new messages are added, not on rating updates
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Set default model when available models change (only if no initial state was passed)
  useEffect(() => {
    // Skip if initial state from Tasks page was applied
    if (initialStateApplied || (initialState?.selectedModels && initialState.selectedModels.length > 0)) {
      if (!initialStateApplied) setInitialStateApplied(true);
      return;
    }
    
    if (selectedModels.length === 0 && (lovableModels.length > 0 || personalModels.length > 0)) {
      if (lovableModels.length > 0) {
        setSelectedModels([lovableModels[0].id]);
      } else if (personalModels.length > 0) {
        setSelectedModels([personalModels[0].id]);
      }
    }
  }, [lovableModels, personalModels, selectedModels, initialState, initialStateApplied]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!currentTask) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${currentTask.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentTask]);

  const fetchTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, session_config')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setCurrentTask(data);
      
      // Apply saved model configuration if not passed via navigation state
      if (!initialState?.selectedModels && data.session_config) {
        const config = data.session_config as { selectedModels?: string[]; perModelSettings?: PerModelSettingsData };
        if (config.selectedModels) {
          setSelectedModels(config.selectedModels);
        }
        if (config.perModelSettings) {
          setPerModelSettings(config.perModelSettings);
        }
      }
      
      fetchMessages(taskId);
    } catch (error: any) {
      toast.error(error.message);
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchLastTask = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, session_config')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // No tasks — redirect to tasks page
        navigate('/tasks');
        return;
      }

      setCurrentTask(data);

      // Apply saved model configuration
      if (data.session_config) {
        const config = data.session_config as { selectedModels?: string[]; perModelSettings?: PerModelSettingsData };
        if (config.selectedModels) {
          setSelectedModels(config.selectedModels);
        }
        if (config.perModelSettings) {
          setPerModelSettings(config.perModelSettings);
        }
      }

      fetchMessages(data.id);
    } catch (error) {
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(messages.filter(m => m.id !== messageId));
      toast.success(t('messages.deleted'));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRatingChange = async (messageId: string, rating: number) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const currentMetadata = (message?.metadata as Record<string, unknown>) || {};

      const { error } = await supabase
        .from('messages')
        .update({
          metadata: { ...currentMetadata, rating }
        })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(msgs => msgs.map(m =>
        m.id === messageId
          ? { ...m, metadata: { ...currentMetadata, rating } }
          : m
      ));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Get all available models for consultant selection
  const allAvailableModels: ModelOption[] = [...lovableModels, ...personalModels];

  const handleSendToConsultant = async () => {
    if (!user || !currentTask || !input.trim() || !selectedConsultant) return;
    setSending(true);

    const messageContent = input.trim();
    setInput('');
    const filesToUpload = [...attachedFiles];
    setAttachedFiles([]);

    try {
      // Upload files (same logic as handleSendMessage)
      const attachmentUrls: { name: string; url: string; type: string }[] = [];
      const totalFiles = filesToUpload.length;
      
      if (totalFiles > 0) {
        setUploadProgress({ current: 0, total: totalFiles });
      }
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const attached = filesToUpload[i];
        setUploadProgress({ current: i, total: totalFiles });
        
        const fileToUpload = await compressImage(attached.file);
        const safeName = sanitizeFileName(attached.file.name);
        const filePath = `${user.id}/${currentTask.id}/${Date.now()}_${safeName}`;
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

      // Insert user message
      const messageMetadata = attachmentUrls.length > 0 ? { attachments: attachmentUrls } : undefined;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          session_id: currentTask.id,
          user_id: user.id,
          role: 'user' as MessageRole,
          content: messageContent,
          metadata: messageMetadata,
        });

      if (error) throw error;

      // Prepare ONLY the consultant model with consultant role
      const isLovable = LOVABLE_AI_MODELS.some(m => m.id === selectedConsultant);
      const personalModel = PERSONAL_KEY_MODELS.find(m => m.id === selectedConsultant);
      const settings = perModelSettings[selectedConsultant] || DEFAULT_MODEL_SETTINGS;
      
      const consultantModel = {
        model_id: selectedConsultant,
        use_lovable_ai: isLovable,
        provider: personalModel?.provider || null,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        system_prompt: settings.systemPrompt || DEFAULT_MODEL_SETTINGS.systemPrompt,
        role: 'consultant' as const, // Force consultant role
      };

      // Call the Hydra orchestrator with only the consultant model
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hydra-orchestrator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            session_id: currentTask.id,
            message: messageContent,
            attachments: attachmentUrls,
            models: [consultantModel], // Only one model
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
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !currentTask || !input.trim() || selectedModels.length === 0) return;
    setSending(true);

    const messageContent = input.trim();
    setInput('');
    const filesToUpload = [...attachedFiles];
    setAttachedFiles([]);

    try {
      // Upload files to storage with progress tracking
      const attachmentUrls: { name: string; url: string; type: string }[] = [];
      const totalFiles = filesToUpload.length;
      
      if (totalFiles > 0) {
        setUploadProgress({ current: 0, total: totalFiles });
      }
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const attached = filesToUpload[i];
        setUploadProgress({ current: i, total: totalFiles });
        
        // Compress image before upload
        const fileToUpload = await compressImage(attached.file);
        
        const safeName = sanitizeFileName(attached.file.name);
        const filePath = `${user.id}/${currentTask.id}/${Date.now()}_${safeName}`;
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
        
        // Revoke preview URL
        if (attached.preview) {
          URL.revokeObjectURL(attached.preview);
        }
        
        setUploadProgress({ current: i + 1, total: totalFiles });
      }
      
      setUploadProgress(null);

      // Insert user message with attachments in metadata
      const messageMetadata = attachmentUrls.length > 0 ? { attachments: attachmentUrls } : undefined;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          session_id: currentTask.id,
          user_id: user.id,
          role: 'user' as MessageRole,
          content: messageContent,
          metadata: messageMetadata,
        });

      if (error) throw error;

      // Prepare models with their metadata and individual settings
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
        };
      });

      // Call the Hydra orchestrator with multiple models (each with its own settings)
      // Include attachments for multimodal AI processing
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hydra-orchestrator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            session_id: currentTask.id,
            message: messageContent,
            attachments: attachmentUrls, // Pass attachments for multimodal AI
            models: modelsToCall,
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

      // Check for partial errors
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((err: { model: string; error: string }) => {
          toast.error(`${err.model}: ${err.error}`);
        });
      }
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // If no task, show redirect message (will redirect via useEffect)
  if (!currentTask) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Task Header */}
          <div className="border-b border-border p-3 bg-background/50 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
              <Target className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{currentTask.title}</span>
            </div>
          </div>


          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 hydra-scrollbar">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-16">
                  <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse-glow" />
                  <p className="text-muted-foreground">
                    Начните диалог с AI-Hydra
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message}
                    userDisplayInfo={userDisplayInfo}
                    onDelete={handleDeleteMessage}
                    onRatingChange={handleRatingChange}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-background/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              {/* Upload progress indicator */}
              {uploadProgress && (
                <div className="mb-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground">{t('files.uploading')}</span>
                        <span className="text-muted-foreground">
                          {uploadProgress.current}/{uploadProgress.total}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300 ease-out"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* File preview area */}
              {attachedFiles.length > 0 && !uploadProgress && (
                <div className="mb-3 flex flex-wrap gap-2 p-2 rounded-lg border border-dashed border-border/50 bg-muted/30">
                  {attachedFiles.map((attached) => {
                    const isImage = attached.file.type.startsWith('image/');
                    return (
                      <div
                        key={attached.id}
                        className={cn(
                          "relative group rounded-md overflow-hidden border border-border/50",
                          "bg-background/80 flex items-center",
                          isImage ? "w-16 h-16" : "px-2 py-1 gap-1"
                        )}
                      >
                        {isImage && attached.preview ? (
                          <img
                            src={attached.preview}
                            alt={attached.file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs truncate max-w-[100px]">
                            {attached.file.name}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (attached.preview) URL.revokeObjectURL(attached.preview);
                            setAttachedFiles(files => files.filter(f => f.id !== attached.id));
                          }}
                          className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="sr-only">Remove</span>
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="flex gap-3 items-end">
                {/* Attach button */}
                <FileUpload
                  files={attachedFiles}
                  onFilesChange={setAttachedFiles}
                  disabled={sending}
                />
                
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('expertPanel.placeholder')}
                  className="flex-1 min-h-[60px] max-h-[200px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  onPaste={handlePaste}
                />
                
                {/* Consultant selector */}
                <ConsultantSelector
                  availableModels={allAvailableModels}
                  selectedConsultant={selectedConsultant}
                  onSelectConsultant={setSelectedConsultant}
                  onSendToConsultant={handleSendToConsultant}
                  disabled={sending}
                  sending={sending}
                  hasMessage={!!input.trim()}
                />
                
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !input.trim() || selectedModels.length === 0}
                  className="hydra-glow-sm"
                  size="lg"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
