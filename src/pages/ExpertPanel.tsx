import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { MemoryControls } from '@/components/layout/MemoryControls';
 import { TaskIndicator } from '@/components/layout/TaskIndicator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
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
import { useMemoryIntegration } from '@/hooks/useMemoryIntegration';
import { useSupervisorWishes } from '@/hooks/useSupervisorWishes';
import { useSessionMemory } from '@/hooks/useSessionMemory';
import { PendingResponseState, RequestStartInfo } from '@/types/pending';
import { Loader2, Target, Zap, ZapOff, Square, Circle, Wrench } from 'lucide-react';
import { SessionMemoryDialog } from '@/components/warroom/SessionMemoryDialog';
import { TechSupportDialog } from '@/components/warroom/TechSupportDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
 import { useInputAreaSize } from '@/hooks/useInputAreaSize';
import { useNavigatorResize } from '@/hooks/useNavigatorResize';
import { NavigatorHeader } from '@/components/layout/NavigatorHeader';

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
  
  // Pending responses for skeleton indicators (used as fallback or before first token)
  const [pendingResponses, setPendingResponses] = useState<Map<string, PendingResponseState>>(new Map());
  
  // Timeout setting (10-240 seconds, default 120)
  const [timeoutSeconds, setTimeoutSeconds] = useState(120);
  
   // D-Chat panel width persistence
   const { width: consultantPanelWidth, saveWidth: saveConsultantPanelWidth, isCollapsed: isDChatCollapsed } = useConsultantPanelWidth();

   // Navigator resize
   const nav = useNavigatorResize({ storageKey: 'expert-panel', defaultMaxSize: 25, minPanelSize: 4 });

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
    useHybridStreaming,
    setUseHybridStreaming,
  } = useSession({ userId: user?.id, authLoading });

  // Shared supervisor wishes hook (#3 fix - no duplication with ConsultantPanel)
  const { selectedWishes, setSelectedWishes } = useSupervisorWishes(currentTask?.id || null);

  // Model statistics hook for tracking dismissals
  const { incrementDismissal } = useModelStatistics(user?.id);

// Session memory hook - full management capabilities
  const { 
    deleteByMessageId,
    chunks: memoryChunks,
    refetch: refetchMemory,
    isLoading: memoryLoading,
    deleteChunk,
    deleteChunksBatch,
    clearSessionMemory,
    isDeleting: memoryDeleting,
    isDeletingBatch: memoryDeletingBatch,
    isClearing: memoryClearing,
    semanticSearch,
    isSearching: memorySearching,
  } = useSessionMemory(currentTask?.id || null);
  
  // Memory management state
  const [memoryRefreshed, setMemoryRefreshed] = useState(false);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
  const [knowledgeByRole, setKnowledgeByRole] = useState<Record<string, number>>({});

  // Fetch knowledge counts grouped by role
  useEffect(() => {
    if (!user?.id) return;
    const fetchKnowledgeCounts = async () => {
      try {
        const { data, error } = await supabase
          .from('role_knowledge')
          .select('role')
          .eq('user_id', user.id);
        if (!error && data) {
          const counts: Record<string, number> = {};
          for (const row of data) {
            counts[row.role] = (counts[row.role] || 0) + 1;
          }
          setKnowledgeByRole(counts);
        }
      } catch { /* ignore */ }
    };
    fetchKnowledgeCounts();
  }, [user?.id]);
   
   // Input area collapse state
   const { 
     isCollapsed: isInputCollapsed, 
     toggleCollapsed: toggleInputCollapse 
   } = useInputAreaSize('hydra-main-chat-input-collapsed');
  
  // Handler for refreshing memory with animation feedback
  const handleRefreshMemory = useCallback(async () => {
    await refetchMemory();
    setMemoryRefreshed(true);
    setTimeout(() => setMemoryRefreshed(false), 2000);
  }, [refetchMemory]);

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
    handleUpdateProposals,
    fetchMessages,
  } = useMessages({ 
    sessionId: currentTask?.id || null,
    onBeforeDeleteMessage: deleteByMessageId,
  });

  // Memory integration hook - auto-saves high-rated decisions
  const { 
    memoryStats, 
    saveDecision, 
    savedMessageIds, 
    isSaving: isMemorySaving 
  } = useMemoryIntegration({
    sessionId: currentTask?.id || null,
    messages,
    enabled: true,
  });

  // Hybrid streaming hook - manages parallel SSE streams for real-time responses
  const {
    streamingResponses,
    pendingResponses: streamingPendingResponses,
    startStreaming,
    stopStreaming,
    stopAllStreaming,
    clearCompleted,
  } = useStreamingResponses({
    sessionId: currentTask?.id || null,
    userId: user?.id || null,
    onMessageSaved: useCallback(() => {
      // Immediately refetch messages when AI response is saved
      if (currentTask?.id) {
        fetchMessages(currentTask.id);
      }
    }, [currentTask?.id, fetchMessages]),
  });
  
  // Auto-clear completed streaming responses after a delay
  useEffect(() => {
    // Check if there are any completed (non-streaming) responses
    const completedResponses = Array.from(streamingResponses.values()).filter(r => !r.isStreaming);
    if (completedResponses.length > 0) {
      const timer = setTimeout(() => clearCompleted(), 500);
      return () => clearTimeout(timer);
    }
  }, [streamingResponses, clearCompleted]);

  // Keep selectedModelsRef in sync for error filtering in useSendMessage
  useEffect(() => {
    selectedModelsRef.current = selectedModels;
  }, [selectedModels]);

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
    sendUserMessageOnly,
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

  // Handler for requesting more details about specific proposals
  const handleRequestProposalDetails = useCallback(async (messageId: string, proposalIds: string[]) => {
    // Find the source message to get context
    const sourceMessage = messages.find(m => m.id === messageId);
    if (!sourceMessage) {
      toast.error('Исходное сообщение не найдено');
      return;
    }

    // Extract proposal titles for context
    const metadata = sourceMessage.metadata as { proposals?: { id: string; title: string }[] } | null;
    const proposals = metadata?.proposals || [];
    const selectedProposals = proposals.filter(p => proposalIds.includes(p.id));
    const proposalTitles = selectedProposals.map(p => `"${p.title}"`).join(', ');

    // Build follow-up message
    const followUpMessage = `Прошу подробнее раскрыть следующие предложения: ${proposalTitles || proposalIds.join(', ')}. 

Для каждого из них:
1. Детально опиши шаги реализации
2. Укажи потенциальные риски и способы их минимизации
3. Оцени необходимые ресурсы и сроки`;

    // Set the input with the follow-up message
    setInput(followUpMessage);
    toast.success('Запрос деталей подготовлен. Нажмите отправить.');
  }, [messages, setInput]);

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
      // Hybrid mode: save user message first, then start parallel SSE streams
      // AI responses will be saved by streaming hook when they complete
      await sendUserMessageOnly(messageContent);
      
      const requestInfo: RequestStartInfo[] = selectedModels.map(modelId => {
        const { model } = getModelInfo(modelId);
        const settings = perModelSettings[modelId];
        return {
          modelId,
          modelName: model?.name || modelId.split('/').pop() || modelId,
          role: (settings?.role || 'assistant') as RequestStartInfo['role'],
        };
      });
      
      // Start streaming - this will handle AI responses and save to DB
      startStreaming(requestInfo, messageContent, timeoutSeconds, perModelSettings);
    } else {
      // Fallback: traditional approach via orchestrator
      await sendMessage(messageContent);
    }
  }, [input, sendMessage, sendUserMessageOnly, useHybridStreaming, selectedModels, perModelSettings, startStreaming, timeoutSeconds]);

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

  // D-Chat: Consult on a specific AI message
  const handleConsultInDChat = useCallback((messageId: string, content: string) => {
    setDChatContext({ messageId, content });
    handleDChatExpand();
  }, [handleDChatExpand]);

  // D-Chat: Copy response to main chat
  const handleCopyToMainChat = useCallback(async (content: string, sourceMessageId: string | null, modelName?: string | null, role?: string | null) => {
    await copyConsultantResponse(content, sourceMessageId, modelName, role);
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

  // Request Arbiter evaluation for a specific AI message
  const handleRequestEvaluation = useCallback((messageId: string, content: string, modelName: string | null) => {
    // Build evaluation request with Arbiter context
    const evaluationPrompt = `Оцени следующий ответ модели ${modelName || 'ИИ'} по критериям:
1. **Точность** (0-10): насколько ответ корректен и соответствует запросу
2. **Полнота** (0-10): насколько ответ исчерпывающий
3. **Ясность** (0-10): насколько ответ понятен и хорошо структурирован
4. **Практичность** (0-10): насколько ответ применим

Формат ответа:
| Критерий | Балл | Обоснование |
|----------|------|-------------|
...

**Итоговая оценка:** X/10

---
**Ответ для оценки:**
${content.slice(0, 2000)}${content.length > 2000 ? '\n...(сокращено)' : ''}`;

    setDChatContext({
      messageId,
      content: evaluationPrompt,
      sourceMessages: [{
        role: 'assistant',
        model_name: modelName,
        content: content
      }]
    });
    handleDChatExpand();
    toast.info(t('dchat.evaluationRequested'));
  }, [handleDChatExpand, t]);

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
      <Layout headerActions={null}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Header actions with memory controls
  const headerActions = (
    <>
      <TaskIndicator
        taskId={currentTask?.id || null}
        taskTitle={currentTask?.title || null}
        loading={loading}
      />
      <MemoryControls
        memoryStats={memoryStats}
        knowledgeByRole={knowledgeByRole}
        isLoading={memoryLoading}
        isRefreshed={memoryRefreshed}
        onRefresh={handleRefreshMemory}
        onOpenDialog={() => setMemoryDialogOpen(true)}
      />
    </>
  );

  return (
    <Layout headerActions={headerActions}>
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Navigation Panel - resizable */}
          <ResizablePanel 
            ref={nav.panelRef}
            defaultSize={nav.panelSize} 
            minSize={4} 
            maxSize={35}
            className="hydra-nav-surface"
            onResize={nav.onPanelResize}
          >
            <div className="h-full flex flex-col">
              <NavigatorHeader
                title={t('chat.participants')}
                isMinimized={nav.isMinimized}
                onToggle={nav.toggle}
              />
              <div className="flex-1 overflow-hidden">
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
                  supervisorDisplayName={profile?.displayName}
                  isMinimized={nav.isMinimized}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main Content */}
          <ResizablePanel defaultSize={80 - consultantPanelWidth} minSize={25}>
            <div className="h-full flex flex-col min-w-0">
              {/* Task Header */}
              <div className="border-b border-border p-3 bg-background/50 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                  <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{currentTask.title}</span>
                </div>
                {/* Header Actions */}
                <div className="flex items-center gap-2">
                  {/* Tech Support Button */}
                  <TechSupportDialog
                    sessionId={currentTask?.id || null}
                    availableModels={allAvailableModels}
                    trigger={
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1.5 text-muted-foreground hover:text-foreground"
                            >
                              <Wrench className="h-3.5 w-3.5" />
                              <span className="text-xs hidden sm:inline">{t('techSupport.callTech')}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            {t('techSupport.callTechTooltip')}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    }
                  />
                  
                  {/* Streaming Mode Toggle */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={() => {
                            setUseHybridStreaming(!useHybridStreaming);
                            toast.success(
                              !useHybridStreaming 
                                ? t('streaming.enabledToast') 
                                : t('streaming.disabledToast')
                            );
                          }}
                          className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={useHybridStreaming ? 'streaming' : 'standard'}
                              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                              exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                            >
                              <Badge 
                                variant={useHybridStreaming ? 'default' : 'secondary'}
                                className={`flex items-center gap-1.5 cursor-pointer ${
                                  useHybridStreaming 
                                    ? 'bg-hydra-cyan/20 text-hydra-cyan border-hydra-cyan/30' 
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                <motion.span
                                  key={useHybridStreaming ? 'zap' : 'zap-off'}
                                  initial={{ rotate: -180, opacity: 0 }}
                                  animate={{ 
                                    rotate: 0, 
                                    opacity: 1,
                                    scale: useHybridStreaming ? [1, 1.2, 1] : 1,
                                  }}
                                  transition={{ 
                                    duration: 0.3, 
                                    ease: 'easeOut',
                                    scale: useHybridStreaming ? {
                                      duration: 1.5,
                                      repeat: Infinity,
                                      ease: 'easeInOut',
                                    } : undefined,
                                  }}
                                >
                                  {useHybridStreaming ? (
                                    <Zap className="h-3 w-3 drop-shadow-[0_0_4px_hsl(var(--hydra-cyan))]" />
                                  ) : (
                                    <ZapOff className="h-3 w-3" />
                                  )}
                                </motion.span>
                                <span className="text-xs">
                                  {useHybridStreaming ? 'Streaming' : 'Standard'}
                                </span>
                              </Badge>
                            </motion.div>
                          </AnimatePresence>
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">
                          {t('streaming.clickToToggle')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {/* Stop All Streaming Button - second */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={() => {
                            if (streamingResponses.size > 0) {
                              stopAllStreaming();
                              toast.info(t('streaming.stoppedAll'));
                            }
                          }}
                          disabled={streamingResponses.size === 0}
                          className={cn(
                            "relative h-7 w-7 rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
                            streamingResponses.size > 0 
                              ? "bg-hydra-critical/20 text-hydra-critical hover:bg-hydra-critical/30 cursor-pointer" 
                              : "bg-muted/50 text-muted-foreground/40 cursor-default"
                          )}
                          whileTap={streamingResponses.size > 0 ? { scale: 0.9 } : undefined}
                        >
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={streamingResponses.size > 0 ? 'active' : 'idle'}
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ 
                                scale: 1, 
                                opacity: 1,
                              }}
                              exit={{ scale: 0.5, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              {streamingResponses.size > 0 ? (
                                <Square className="h-3.5 w-3.5 fill-current" />
                              ) : (
                                <Circle className="h-3.5 w-3.5" />
                              )}
                            </motion.span>
                          </AnimatePresence>
                          
                          {/* Active streams counter badge */}
                          <AnimatePresence>
                            {streamingResponses.size > 0 && (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-hydra-critical text-[10px] font-bold text-white flex items-center justify-center shadow-sm"
                              >
                                {streamingResponses.size}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">
                          {streamingResponses.size > 0 
                            ? t('streaming.stopAll') 
                            : t('streaming.noActiveStreams')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                onSaveToMemory={saveDecision}
                isSavingToMemory={isMemorySaving}
                savedMessageIds={savedMessageIds}
                pendingResponses={filteredPendingResponses}
                streamingResponses={filteredStreamingResponses}
                timeoutSeconds={timeoutSeconds}
                onRetryRequest={handleRetryRequest}
                onDismissTimeout={handleDismissTimeout}
                onRemoveModel={handleRemoveModel}
                onStopStreaming={stopStreaming}
                onUpdateProposals={handleUpdateProposals}
                onRequestProposalDetails={handleRequestProposalDetails}
                onConsultInDChat={handleConsultInDChat}
                onRequestEvaluation={handleRequestEvaluation}
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
                selectedWishes={selectedWishes}
                onWishesChange={setSelectedWishes}
                activeRoles={selectedModels.map(modelId => {
                  const settings = perModelSettings[modelId];
                  return (settings?.role || 'assistant') as import('@/config/roles').MessageRole;
                })}
                 isCollapsed={isInputCollapsed}
                onToggleCollapse={toggleInputCollapse}
                supervisorDisplayName={profile?.displayName}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* D-Chat Panel */}
          <ResizablePanel
            ref={dChatPanelRef}
            defaultSize={consultantPanelWidth}
            minSize={3}
            maxSize={50}
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
      
      {/* Session Memory Management Dialog */}
      <SessionMemoryDialog
        open={memoryDialogOpen}
        onOpenChange={setMemoryDialogOpen}
        chunks={memoryChunks}
        isLoading={memoryLoading}
        isDeleting={memoryDeleting}
        onDeleteChunk={deleteChunk}
        onDeleteDuplicates={deleteChunksBatch}
        isDeletingDuplicates={memoryDeletingBatch}
        onClearAll={clearSessionMemory}
        isClearing={memoryClearing}
        onSemanticSearch={semanticSearch}
        isSearching={memorySearching}
      />
    </Layout>
  );
}
