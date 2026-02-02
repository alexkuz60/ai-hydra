import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { ConsultantPanel } from '@/components/warroom/ConsultantPanel';
import { UserDisplayInfo } from '@/components/warroom/ChatMessage';
import { ChatTreeNav } from '@/components/warroom/ChatTreeNav';
import { ChatInputArea } from '@/components/warroom/ChatInputArea';
import { ChatMessagesList } from '@/components/warroom/ChatMessagesList';
import { useAvailableModels, ModelOption, getModelInfo } from '@/hooks/useAvailableModels';
import { usePasteHandler } from '@/hooks/usePasteHandler';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useMessageCollapseState } from '@/hooks/useMessageCollapseState';
import { useSession } from '@/hooks/useSession';
import { useMessages } from '@/hooks/useMessages';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useConsultantPanelWidth } from '@/hooks/useConsultantPanelWidth';
import { useModelStatistics } from '@/hooks/useModelStatistics';
import { useStreamingResponses } from '@/hooks/useStreamingResponses';
import { PendingResponseState, RequestStartInfo } from '@/types/pending';
import { Loader2, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function ExpertPanel() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { lovableModels, personalModels } = useAvailableModels();
  const { profile } = useUserProfile();
  const { isSupervisor } = useUserRoles();
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dChatPanelRef = useRef<ImperativePanelHandle>(null);
  const selectedModelsRef = useRef<string[]>([]);
  const [input, setInput] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
  const [dChatContext, setDChatContext] = useState<{
    messageId: string;
    content: string;
    sourceMessages?: Array<{
      role: string;
      model_name: string | null;
      content: string;
    }>;
  } | null>(null);
  
  // Hybrid streaming: use streaming for real-time responses, fallback to orchestrator for persistence
  const [useHybridStreaming, setUseHybridStreaming] = useState(true);
  
  // Pending responses for skeleton indicators (used as fallback or before first token)
  const [pendingResponses, setPendingResponses] = useState<Map<string, PendingResponseState>>(new Map());
  
  // Timeout setting (10-240 seconds, default 120)
  const [timeoutSeconds, setTimeoutSeconds] = useState(120);
  
  // D-Chat panel width persistence
  const { width: consultantPanelWidth, saveWidth: saveConsultantPanelWidth, isCollapsed: isDChatCollapsed } = useConsultantPanelWidth();

  // D-Chat expand/collapse handlers using imperative API
  const handleDChatExpand = useCallback(() => {
    dChatPanelRef.current?.resize(20);
    saveConsultantPanelWidth(20);
  }, [saveConsultantPanelWidth]);

  const handleDChatCollapse = useCallback(() => {
    dChatPanelRef.current?.resize(3);
    saveConsultantPanelWidth(3);
  }, [saveConsultantPanelWidth]);

  // User display info for chat messages
  const userDisplayInfo: UserDisplayInfo = {
    displayName: profile?.displayName || null,
    isSupervisor,
  };

  // Session management hook
  const {
    currentTask,
    loading,
    selectedModels,
    setSelectedModels,
    perModelSettings,
    setPerModelSettings,
  } = useSession({ userId: user?.id, authLoading });

  // Model statistics hook for tracking dismissals
  const { incrementDismissal } = useModelStatistics(user?.id);

  // Hybrid streaming hook - manages parallel SSE streams for real-time responses
  const {
    streamingResponses,
    pendingResponses: streamingPendingResponses,
    startStreaming,
    stopStreaming,
    stopAllStreaming,
    clearCompleted,
  } = useStreamingResponses({
    onStreamComplete: useCallback((modelId: string, content: string) => {
      // When streaming completes, the message will appear via realtime subscription
      // Clear completed streaming responses after a short delay
      setTimeout(() => clearCompleted(), 500);
    }, []),
  });

  // Keep selectedModelsRef in sync for error filtering in useSendMessage
  useEffect(() => {
    selectedModelsRef.current = selectedModels;
  }, [selectedModels]);

  // Messages management hook
  const {
    messages,
    displayedMessages,
    filteredParticipant,
    setFilteredParticipant,
    activeParticipant,
    setActiveParticipant,
    handleDeleteMessage,
    handleDeleteMessageGroup,
    handleRatingChange,
  } = useMessages({ sessionId: currentTask?.id || null });

  // Callback for when request starts - initialize skeleton indicators (fallback for non-streaming)
  const handleRequestStart = useCallback((models: RequestStartInfo[]) => {
    if (useHybridStreaming) {
      // Hybrid mode: streaming handles its own state
      return;
    }
    
    // Fallback: traditional skeleton approach
    const now = Date.now();
    const newPending = new Map<string, PendingResponseState>();
    models.forEach(m => {
      newPending.set(m.modelId, {
        modelId: m.modelId,
        modelName: m.modelName,
        role: m.role,
        status: 'sent',
        startTime: now,
        elapsedSeconds: 0,
      });
    });
    setPendingResponses(newPending);
  }, [useHybridStreaming]);

  // Callback for when request errors - clear failed model skeletons
  const handleRequestError = useCallback((failedModelIds: string[]) => {
    setPendingResponses(prev => {
      const updated = new Map(prev);
      failedModelIds.forEach(modelId => {
        updated.delete(modelId);
      });
      return updated;
    });
  }, []);

  // Send message hook
  const {
    sending,
    uploadProgress,
    attachedFiles,
    setAttachedFiles,
    sendMessage,
    sendToConsultant,
    copyConsultantResponse,
    retrySingleModel,
  } = useSendMessage({
    userId: user?.id || null,
    sessionId: currentTask?.id || null,
    selectedModels,
    perModelSettings,
    onRequestStart: handleRequestStart,
    onRequestError: handleRequestError,
    selectedModelsRef,
  });

  // Timeout action handlers (after useSendMessage to access retrySingleModel)
  const handleRetryRequest = useCallback((modelId: string) => {
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) {
      toast.error('Не найдено последнее сообщение пользователя');
      return;
    }
    
    // Remove the timedout pending state - retrySingleModel will create a fresh one via onRequestStart
    setPendingResponses(prev => {
      const updated = new Map(prev);
      updated.delete(modelId);
      return updated;
    });
    
    // Trigger retry through the hook - it will call onRequestStart to create fresh skeleton
    retrySingleModel(modelId, lastUserMessage.content);
    toast.success(`Повторный запрос отправлен: ${modelId.split('/').pop()}`);
  }, [messages, retrySingleModel]);

  const handleDismissTimeout = useCallback((modelId: string) => {
    setPendingResponses(prev => {
      const updated = new Map(prev);
      updated.delete(modelId);
      return updated;
    });
    toast.info('Ожидание отменено');
  }, []);

  const handleRemoveModel = useCallback((modelId: string) => {
    // Remove from selected models - useEffect[selectedModels] will auto-cleanup pendingResponses
    // This avoids race condition between two setState calls
    setSelectedModels(prev => prev.filter(id => id !== modelId));
    
    // Record dismissal in statistics
    if (currentTask?.id) {
      incrementDismissal(modelId, currentTask.id);
    }
    
    toast.warning(`Модель ${modelId.split('/').pop()} удалена из сессии`);
  }, [setSelectedModels, currentTask?.id, incrementDismissal]);

  // Persistent collapse state per message
  const { isCollapsed, toggleCollapsed, collapseAll, expandAll, collapsedCount } = useMessageCollapseState(currentTask?.id || null);
  const allCollapsed = messages.length > 0 && collapsedCount === messages.length;

  const { handlePaste } = usePasteHandler({ 
    attachedFiles, 
    setAttachedFiles, 
    disabled: sending 
  });

  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    // Only scroll to bottom when new messages are added
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Timer to update elapsed time for pending responses
  useEffect(() => {
    if (pendingResponses.size === 0) return;
    
    const interval = setInterval(() => {
      setPendingResponses(prev => {
        const updated = new Map(prev);
        const now = Date.now();
        
        for (const [key, value] of updated) {
          const elapsed = Math.floor((now - value.startTime) / 1000);
          let status: PendingResponseState['status'] = 'sent';
          
          if (elapsed >= timeoutSeconds) status = 'timedout';
          else if (elapsed >= 5) status = 'waiting';
          else if (elapsed >= 2) status = 'confirmed';
          
          updated.set(key, { ...value, elapsedSeconds: elapsed, status });
        }
        return updated;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [pendingResponses.size, timeoutSeconds]);

  // Remove pending response when a new AI message arrives
  useEffect(() => {
    if (pendingResponses.size === 0 || messages.length === 0) return;
    
    // Check last few messages for AI responses that match pending models
    const recentMessages = messages.slice(-pendingResponses.size * 2);
    
    setPendingResponses(prev => {
      const updated = new Map(prev);
      let changed = false;
      
      for (const msg of recentMessages) {
        if (msg.role !== 'user' && msg.model_name) {
          // Find matching pending by model name
          for (const [key, value] of updated) {
            if (value.modelName === msg.model_name || 
                key.includes(msg.model_name) ||
                msg.model_name.includes(value.modelName)) {
              updated.delete(key);
              changed = true;
              break;
            }
          }
        }
      }
      
      return changed ? updated : prev;
    });
  }, [messages, pendingResponses.size]);

  // Track previous selectedModels to detect which specific model was removed
  const prevSelectedModelsRef = useRef<string[]>(selectedModels);
  
  // Auto-cleanup pending response ONLY for the specific model that was removed
  useEffect(() => {
    const prevModels = prevSelectedModelsRef.current;
    const removedModels = prevModels.filter(id => !selectedModels.includes(id));
    
    // Update ref for next comparison
    prevSelectedModelsRef.current = selectedModels;
    
    // Only cleanup if a model was actually removed
    if (removedModels.length === 0) return;
    
    setPendingResponses(prev => {
      const updated = new Map(prev);
      let changed = false;
      
      for (const removedId of removedModels) {
        if (updated.has(removedId)) {
          updated.delete(removedId);
          changed = true;
        }
      }
      
      return changed ? updated : prev;
    });
  }, [selectedModels]);

  // Combine pending responses from both sources (hybrid streaming + fallback)
  const combinedPendingResponses = new Map([
    ...pendingResponses,
    ...streamingPendingResponses,
  ]);
  
  // Filter pending responses to only show models in current task (or consultants)
  const filteredPendingResponses = new Map(
    [...combinedPendingResponses].filter(([modelId]) => 
      selectedModels.includes(modelId) || modelId.includes('consultant')
    )
  );

  // Filter streaming responses to only show models in current task
  const filteredStreamingResponses = new Map(
    [...streamingResponses].filter(([modelId]) => 
      selectedModels.includes(modelId)
    )
  );

  // Get all available models for consultant selection
  const allAvailableModels: ModelOption[] = [...lovableModels, ...personalModels];

  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const messageContent = input.trim();
    setInput('');
    
    if (useHybridStreaming && selectedModels.length > 0) {
      // Hybrid mode: start parallel SSE streams for real-time display
      const requestInfo: RequestStartInfo[] = selectedModels.map(modelId => {
        const { model } = getModelInfo(modelId);
        const settings = perModelSettings[modelId];
        return {
          modelId,
          modelName: model?.name || modelId.split('/').pop() || modelId,
          role: (settings?.role || 'assistant') as RequestStartInfo['role'],
        };
      });
      
      startStreaming(requestInfo, messageContent, timeoutSeconds);
      
      // Also send to orchestrator for persistence
      await sendMessage(messageContent);
    } else {
      // Fallback: traditional approach
      await sendMessage(messageContent);
    }
  }, [input, sendMessage, useHybridStreaming, selectedModels, perModelSettings, startStreaming, timeoutSeconds]);

  const handleSendToConsultant = useCallback(async () => {
    if (!input.trim() || !selectedConsultant) return;
    const messageContent = input.trim();
    setInput('');
    await sendToConsultant(messageContent, selectedConsultant);
  }, [input, selectedConsultant, sendToConsultant]);

  const handleMessageClick = useCallback((messageId: string) => {
    setActiveParticipant(messageId);
    messageRefs.current.get(messageId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [setActiveParticipant]);

  const handleMessageDoubleClick = useCallback((messageId: string) => {
    if (!messageId || filteredParticipant === messageId) {
      setFilteredParticipant(null);
    } else {
      setFilteredParticipant(messageId);
    }
  }, [filteredParticipant, setFilteredParticipant]);

  const handleCollapseAllToggle = useCallback(() => {
    if (allCollapsed) {
      expandAll();
    } else {
      collapseAll(messages.map(m => m.id));
    }
  }, [allCollapsed, expandAll, collapseAll, messages]);

  // D-Chat: Send message from navigator to D-Chat with full context
  const handleSendToDChat = useCallback((
    messageId: string, 
    aggregatedContent: string, 
    sourceMessages: Array<{ role: string; model_name: string | null; content: string }>
  ) => {
    setDChatContext({ messageId, content: aggregatedContent, sourceMessages });
    handleDChatExpand(); // Expand D-Chat using imperative API
  }, [handleDChatExpand]);

  // D-Chat: Copy response to main chat
  const handleCopyToMainChat = useCallback(async (content: string, sourceMessageId: string | null) => {
    await copyConsultantResponse(content, sourceMessageId);
    toast.success(t('dchat.copiedToChat'));
  }, [copyConsultantResponse, t]);

  // D-Chat: Clear initial query after it's been used
  const handleClearDChatContext = useCallback(() => {
    setDChatContext(null);
  }, []);

  // Text selection: Clarify with Specialist
  const handleClarifyWithSpecialist = useCallback((selectedText: string, messageId: string) => {
    // Find the source message for context
    const sourceMessage = messages.find(m => m.id === messageId);
    const contextMessages = sourceMessage ? [{
      role: sourceMessage.role,
      model_name: sourceMessage.model_name,
      content: sourceMessage.content
    }] : undefined;
    
    setDChatContext({
      messageId,
      content: selectedText,
      sourceMessages: contextMessages
    });
    handleDChatExpand();
  }, [messages, handleDChatExpand]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

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
        <ResizablePanelGroup direction="horizontal">
          {/* Navigation Panel - resizable */}
          <ResizablePanel 
            defaultSize={20} 
            minSize={15} 
            maxSize={35}
            className="bg-sidebar"
          >
            <ChatTreeNav
              messages={messages}
              perModelSettings={perModelSettings}
              userDisplayInfo={userDisplayInfo}
              onMessageClick={handleMessageClick}
              onMessageDoubleClick={handleMessageDoubleClick}
              onDeleteMessageGroup={handleDeleteMessageGroup}
              onSendToDChat={handleSendToDChat}
              activeParticipant={activeParticipant}
              filteredParticipant={filteredParticipant}
              allCollapsed={allCollapsed}
              onCollapseAllToggle={handleCollapseAllToggle}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main Content */}
          <ResizablePanel defaultSize={80 - consultantPanelWidth} minSize={40}>
            <div className="h-full flex flex-col min-w-0">
              {/* Task Header */}
              <div className="border-b border-border p-3 bg-background/50 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                  <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{currentTask.title}</span>
                </div>
              </div>

              {/* Messages Area */}
              <ChatMessagesList
                messages={displayedMessages}
                filteredParticipant={filteredParticipant}
                userDisplayInfo={userDisplayInfo}
                messagesEndRef={messagesEndRef}
                messageRefs={messageRefs}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapsed}
                onDelete={handleDeleteMessage}
                onRatingChange={handleRatingChange}
                onClarifyWithSpecialist={handleClarifyWithSpecialist}
                pendingResponses={filteredPendingResponses}
                streamingResponses={filteredStreamingResponses}
                timeoutSeconds={timeoutSeconds}
                onRetryRequest={handleRetryRequest}
                onDismissTimeout={handleDismissTimeout}
                onRemoveModel={handleRemoveModel}
                onStopStreaming={stopStreaming}
              />

              {/* Input Area */}
              <ChatInputArea
                input={input}
                onInputChange={setInput}
                onSend={handleSendMessage}
                onPaste={handlePaste}
                sending={sending}
                disabled={sending || !input.trim() || selectedModels.length === 0}
                attachedFiles={attachedFiles}
                onFilesChange={setAttachedFiles}
                uploadProgress={uploadProgress}
                availableModels={allAvailableModels}
                selectedConsultant={selectedConsultant}
                onSelectConsultant={setSelectedConsultant}
                onSendToConsultant={handleSendToConsultant}
                timeoutSeconds={timeoutSeconds}
                onTimeoutChange={setTimeoutSeconds}
                selectedModelsCount={selectedModels.length}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* D-Chat Panel */}
          <ResizablePanel
            ref={dChatPanelRef}
            defaultSize={consultantPanelWidth}
            minSize={3}
            maxSize={30}
            onResize={saveConsultantPanelWidth}
          >
            <ConsultantPanel
              sessionId={currentTask?.id || null}
              availableModels={allAvailableModels}
              isCollapsed={isDChatCollapsed}
              onExpand={handleDChatExpand}
              onCollapse={handleDChatCollapse}
              initialQuery={dChatContext}
              onClearInitialQuery={handleClearDChatContext}
              onCopyToMainChat={handleCopyToMainChat}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
}
