import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { ConsultantPanel } from '@/components/warroom/ConsultantPanel';
import { ChatMessage, UserDisplayInfo } from '@/components/warroom/ChatMessage';
import { ChatTreeNav } from '@/components/warroom/ChatTreeNav';
import { FileUpload } from '@/components/warroom/FileUpload';
import { ConsultantSelector } from '@/components/warroom/ConsultantSelector';
import { DateSeparator } from '@/components/warroom/DateSeparator';
import { isSameDay } from 'date-fns';
import { useAvailableModels, ModelOption } from '@/hooks/useAvailableModels';
import { usePasteHandler } from '@/hooks/usePasteHandler';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useMessageCollapseState } from '@/hooks/useMessageCollapseState';
import { useSession } from '@/hooks/useSession';
import { useMessages } from '@/hooks/useMessages';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useConsultantPanelWidth } from '@/hooks/useConsultantPanelWidth';
import { 
  Send, 
  Loader2, 
  Sparkles,
  Target
} from 'lucide-react';
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

  // Send message hook
  const {
    sending,
    uploadProgress,
    attachedFiles,
    setAttachedFiles,
    sendMessage,
    sendToConsultant,
    copyConsultantResponse,
  } = useSendMessage({
    userId: user?.id || null,
    sessionId: currentTask?.id || null,
    selectedModels,
    perModelSettings,
  });

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

  // Get all available models for consultant selection
  const allAvailableModels: ModelOption[] = [...lovableModels, ...personalModels];

  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const messageContent = input.trim();
    setInput('');
    await sendMessage(messageContent);
  }, [input, sendMessage]);

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
              <ScrollArea className="flex-1 p-4 hydra-scrollbar">
                <div className="max-w-4xl mx-auto space-y-4">
                  {displayedMessages.length === 0 ? (
                    <div className="text-center py-16">
                      <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse-glow" />
                      <p className="text-muted-foreground">
                        {filteredParticipant ? 'Нет сообщений по фильтру' : 'Начните диалог с AI-Hydra'}
                      </p>
                    </div>
                  ) : (
                    displayedMessages.map((message, index) => {
                      const messageDate = new Date(message.created_at);
                      const prevMessage = index > 0 ? displayedMessages[index - 1] : null;
                      const showDateSeparator = !prevMessage || 
                        !isSameDay(messageDate, new Date(prevMessage.created_at));

                      return (
                        <React.Fragment key={message.id}>
                          {showDateSeparator && <DateSeparator date={messageDate} />}
                          <div
                            ref={(el) => {
                              if (el) messageRefs.current.set(message.id, el);
                              else messageRefs.current.delete(message.id);
                            }}
                          >
                            <ChatMessage 
                              message={message}
                              userDisplayInfo={userDisplayInfo}
                              onDelete={handleDeleteMessage}
                              onRatingChange={handleRatingChange}
                              isCollapsed={isCollapsed(message.id)}
                              onToggleCollapse={toggleCollapsed}
                            />
                          </div>
                        </React.Fragment>
                      );
                    })
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
