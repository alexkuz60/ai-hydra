import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { TaskIndicator } from '@/components/layout/TaskIndicator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { ConsultantPanel } from '@/components/warroom/ConsultantPanel';
import { UserDisplayInfo } from '@/components/warroom/ChatMessage';
import { ChatTreeNav } from '@/components/warroom/ChatTreeNav';
import { ChatInputArea } from '@/components/warroom/ChatInputArea';
import { ChatMessagesList } from '@/components/warroom/ChatMessagesList';
import { TaskHeader } from '@/components/warroom/TaskHeader';
import { SessionMemoryDialog } from '@/components/warroom/SessionMemoryDialog';
import { MemoryControls } from '@/components/layout/MemoryControls';
import { useAvailableModels, ModelOption, getModelInfo } from '@/hooks/useAvailableModels';
import { usePasteHandler } from '@/hooks/usePasteHandler';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useMessageCollapseState } from '@/hooks/useMessageCollapseState';
import { useSession } from '@/hooks/useSession';
import { useMessages } from '@/hooks/useMessages';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useConsultantPanelWidth } from '@/hooks/useConsultantPanelWidth';
import { useMemoryIntegration } from '@/hooks/useMemoryIntegration';
import { useSupervisorWishes } from '@/hooks/useSupervisorWishes';
import { useSessionMemory } from '@/hooks/useSessionMemory';
import { usePendingResponses } from '@/hooks/usePendingResponses';
import { useExpertPanelActions } from '@/hooks/useExpertPanelActions';
import { RequestStartInfo } from '@/types/pending';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useInputAreaSize } from '@/hooks/useInputAreaSize';
import { useNavigatorResize } from '@/hooks/useNavigatorResize';
import { NavigatorHeader } from '@/components/layout/NavigatorHeader';
import { useContestMigration } from '@/hooks/useContestMigration';

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
    sourceMessages?: Array<{ role: string; model_name: string | null; content: string }>;
  } | null>(null);
  const [timeoutSeconds, setTimeoutSeconds] = useState(120);
  const [interactiveChecklists, setInteractiveChecklists] = useState(false);

  // Panel sizing
  const { width: consultantPanelWidth, saveWidth: saveConsultantPanelWidth, isCollapsed: isDChatCollapsed } = useConsultantPanelWidth();
  const nav = useNavigatorResize({ storageKey: 'expert-panel', defaultMaxSize: 25, minPanelSize: 4 });
  const { isCollapsed: isInputCollapsed, toggleCollapsed: toggleInputCollapse } = useInputAreaSize('hydra-main-chat-input-collapsed');

  // D-Chat expand/collapse
  const handleDChatExpand = useCallback(() => {
    dChatPanelRef.current?.resize(20);
    saveConsultantPanelWidth(20);
  }, [saveConsultantPanelWidth]);

  const handleDChatCollapse = useCallback(() => {
    dChatPanelRef.current?.resize(3);
    saveConsultantPanelWidth(3);
  }, [saveConsultantPanelWidth]);

  const userDisplayInfo: UserDisplayInfo = {
    displayName: profile?.displayName || null,
    isSupervisor,
  };

  // Session
  const {
    currentTask, loading, selectedModels, setSelectedModels,
    perModelSettings, setPerModelSettings,
    useHybridStreaming, setUseHybridStreaming,
  } = useSession({ userId: user?.id, authLoading });

  const { selectedWishes, setSelectedWishes } = useSupervisorWishes(currentTask?.id || null);

  // Session memory — keep for streaming context (memoryChunks)
  const {
    deleteByMessageId, chunks: memoryChunks, isLoading: memoryLoading,
    isDeleting: isMemoryDeleting, isClearing: isMemoryClearing,
    deleteChunk, deleteChunksBatch, clearSessionMemory, savedMessageIds: memorySavedIds,
    semanticSearch: memorySemanticSearch, isSearching: isMemorySearching,
    submitFeedback: submitMemoryFeedback,
  } = useSessionMemory(currentTask?.id || null);
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);


  // Messages
  const {
    messages, displayedMessages, filteredParticipant, setFilteredParticipant,
    activeParticipant, setActiveParticipant,
    handleDeleteMessage, handleDeleteMessageGroup,
    handleRatingChange, handleLikertRate, handleUpdateProposals,
    handleChecklistChange, fetchMessages,
  } = useMessages({
    sessionId: currentTask?.id || null,
    onBeforeDeleteMessage: deleteByMessageId,
  });

  // Memory integration
  const {
    memoryStats, saveDecision, savedMessageIds, isSaving: isMemorySaving,
  } = useMemoryIntegration({
    sessionId: currentTask?.id || null,
    messages,
    enabled: true,
  });

  // Streaming message saved callback
  const handleStreamMessageSaved = useCallback(() => {
    if (currentTask?.id) fetchMessages(currentTask.id);
  }, [currentTask?.id, fetchMessages]);

  // Pending responses (consolidated hook)
  const {
    filteredPendingResponses, filteredStreamingResponses, streamingResponses,
    handleRequestStart, handleRequestError,
    startStreaming, stopStreaming, stopAllStreaming, dismissPending,
    clearPendingForMessages,
  } = usePendingResponses({
    sessionId: currentTask?.id || null,
    userId: user?.id || null,
    selectedModels,
    useHybridStreaming,
    timeoutSeconds,
    onMessageSaved: handleStreamMessageSaved,
  });

  // Sync selectedModelsRef
  useEffect(() => {
    selectedModelsRef.current = selectedModels;
  }, [selectedModels]);

  // Clear pending when messages arrive
  useEffect(() => {
    clearPendingForMessages(messages);
  }, [messages, clearPendingForMessages]);

  // Send message
  const {
    sending, uploadProgress, attachedFiles, setAttachedFiles,
    sendMessage, sendUserMessageOnly, sendToConsultant,
    copyConsultantResponse, retrySingleModel,
  } = useSendMessage({
    userId: user?.id || null,
    sessionId: currentTask?.id || null,
    selectedModels,
    perModelSettings,
    onRequestStart: handleRequestStart,
    onRequestError: handleRequestError,
    selectedModelsRef,
    messages,
  });

  // All actions (consolidated hook)
  const actions = useExpertPanelActions({
    userId: user?.id,
    sessionId: currentTask?.id || null,
    messages,
    selectedModels,
    setSelectedModels,
    setInput,
    retrySingleModel,
    dismissPending,
    copyConsultantResponse,
    handleDChatExpand,
    setDChatContext,
  });

  // Collapse state
  const { isCollapsed, toggleCollapsed, collapseAll, expandAll, collapsedCount } = useMessageCollapseState(currentTask?.id || null);
  const allCollapsed = messages.length > 0 && collapsedCount === messages.length;

  const { handlePaste } = usePasteHandler({ attachedFiles, setAttachedFiles, disabled: sending });

  // Scroll to bottom on new messages
  const prevMessagesLengthRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Pick up contest migration data
  useContestMigration(setInput);

  // All available models — memoised to prevent unnecessary re-renders of children
  const allAvailableModels: ModelOption[] = useMemo(
    () => [...lovableModels, ...personalModels],
    [lovableModels, personalModels]
  );

  // Send handlers
  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const messageContent = input.trim();
    setInput('');
    const extraMeta = interactiveChecklists ? { interactive_checklists: true } : undefined;

    if (useHybridStreaming && selectedModels.length > 0) {
      await sendUserMessageOnly(messageContent, extraMeta);
      const requestInfo: RequestStartInfo[] = selectedModels.map(modelId => {
        const { model } = getModelInfo(modelId);
        const settings = perModelSettings[modelId];
        return {
          modelId,
          modelName: model?.name || modelId.split('/').pop() || modelId,
          role: (settings?.role || 'assistant') as RequestStartInfo['role'],
        };
      });
      // Build stream context: memory chunks + last 10 messages as history
      const streamContext = {
        memoryContext: memoryChunks.map(c => ({
          content: c.content,
          chunk_type: c.chunk_type,
          metadata: c.metadata as Record<string, unknown> | undefined,
        })),
        history: messages
          .slice(-10)
          .map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
      };
      startStreaming(requestInfo, messageContent, timeoutSeconds, perModelSettings, undefined, streamContext);
    } else {
      await sendMessage(messageContent, extraMeta);
    }
  }, [input, sendMessage, sendUserMessageOnly, useHybridStreaming, selectedModels, perModelSettings, startStreaming, timeoutSeconds, interactiveChecklists, memoryChunks, messages]);

  const handleSendToConsultant = useCallback(async () => {
    if (!input.trim() || !selectedConsultant) return;
    const messageContent = input.trim();
    setInput('');
    await sendToConsultant(messageContent, selectedConsultant);
  }, [input, selectedConsultant, sendToConsultant]);

  // Navigation handlers
  const handleMessageClick = useCallback((messageId: string) => {
    setActiveParticipant(messageId);
    messageRefs.current.get(messageId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [setActiveParticipant]);

  const handleMessageDoubleClick = useCallback((messageId: string) => {
    if (!messageId || filteredParticipant === messageId) {
      setFilteredParticipant(null);
    } else {
      setFilteredParticipant(messageId);
    }
  }, [filteredParticipant, setFilteredParticipant]);

  const handleCollapseAllToggle = useCallback(() => {
    if (allCollapsed) expandAll();
    else collapseAll(messages.map(m => m.id));
  }, [allCollapsed, expandAll, collapseAll, messages]);

  // Loading states
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

  const headerActions = (
    <div className="flex items-center gap-2">
      <MemoryControls
        memoryStats={memoryStats}
        isLoading={memoryLoading}
        onRefresh={() => {}}
        onOpenDialog={() => setMemoryDialogOpen(true)}
      />
      <TaskIndicator taskId={currentTask?.id || null} taskTitle={currentTask?.title || null} loading={loading} />
    </div>
  );

  return (
    <Layout headerActions={headerActions}>
      <SessionMemoryDialog
        open={memoryDialogOpen}
        onOpenChange={setMemoryDialogOpen}
        chunks={memoryChunks}
        isLoading={memoryLoading}
        isDeleting={isMemoryDeleting}
        onDeleteChunk={deleteChunk}
        onDeleteDuplicates={deleteChunksBatch}
        onClearAll={clearSessionMemory}
        isClearing={isMemoryClearing}
        onSemanticSearch={memorySemanticSearch}
        isSearching={isMemorySearching}
        onFeedback={submitMemoryFeedback}
      />
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Navigation Panel */}
          <ResizablePanel
            ref={nav.panelRef}
            defaultSize={nav.panelSize}
            minSize={4}
            maxSize={35}
            className="hydra-nav-surface"
            onResize={nav.onPanelResize}
          >
            <div className="h-full flex flex-col" data-guide="chat-tree-nav">
              <NavigatorHeader title={t('chat.participants')} isMinimized={nav.isMinimized} onToggle={nav.toggle} />
              <div className="flex-1 overflow-hidden">
                <ChatTreeNav
                  messages={messages}
                  perModelSettings={perModelSettings}
                  userDisplayInfo={userDisplayInfo}
                  onMessageClick={handleMessageClick}
                  onMessageDoubleClick={handleMessageDoubleClick}
                  onDeleteMessageGroup={handleDeleteMessageGroup}
                  onSendToDChat={actions.handleSendToDChat}
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
              <div data-guide="model-selector">
              <TaskHeader
                taskTitle={currentTask.title}
                sessionId={currentTask.id}
                allAvailableModels={allAvailableModels}
                useHybridStreaming={useHybridStreaming}
                setUseHybridStreaming={setUseHybridStreaming}
                streamingResponsesCount={streamingResponses.size}
                onStopAllStreaming={stopAllStreaming}
                onResponseComplete={actions.handleResponseComplete}
              />
              </div>

              <div data-guide="chat-messages" className="flex-1 overflow-auto">
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
                onLikertRate={handleLikertRate}
                onClarifyWithSpecialist={actions.handleClarifyWithSpecialist}
                onSaveToMemory={saveDecision}
                isSavingToMemory={isMemorySaving}
                savedMessageIds={savedMessageIds}
                pendingResponses={filteredPendingResponses}
                streamingResponses={filteredStreamingResponses}
                timeoutSeconds={timeoutSeconds}
                onRetryRequest={actions.handleRetryRequest}
                onDismissTimeout={actions.handleDismissTimeout}
                onRemoveModel={actions.handleRemoveModel}
                onStopStreaming={stopStreaming}
                onUpdateProposals={handleUpdateProposals}
                onRequestProposalDetails={actions.handleRequestProposalDetails}
                onConsultInDChat={actions.handleConsultInDChat}
                onRequestEvaluation={actions.handleRequestEvaluation}
                onChecklistChange={handleChecklistChange}
                onHallucination={actions.handleHallucination}
              />
              </div>

              <div data-guide="chat-input">
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
                interactiveChecklists={interactiveChecklists}
                onInteractiveChecklistsChange={setInteractiveChecklists}
              />
              </div>
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
            <div data-guide="consultant-panel" className="h-full">
            <ConsultantPanel
              sessionId={currentTask?.id || null}
              availableModels={allAvailableModels}
              isCollapsed={isDChatCollapsed}
              onExpand={handleDChatExpand}
              onCollapse={handleDChatCollapse}
              initialQuery={dChatContext}
              onClearInitialQuery={actions.handleClearDChatContext}
              onCopyToMainChat={actions.handleCopyToMainChat}
              onResponseComplete={actions.handleResponseComplete}
            />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
}
