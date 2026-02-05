import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, UserDisplayInfo } from '@/components/warroom/ChatMessage';
import { DateSeparator } from '@/components/warroom/DateSeparator';
import { MessageSkeleton } from '@/components/warroom/MessageSkeleton';
import { StreamingMessageCard } from '@/components/warroom/StreamingMessageCard';
import { Message } from '@/types/messages';
import { PendingResponseState } from '@/types/pending';
import type { StreamingResponse } from '@/hooks/useStreamingResponses';
import type { Proposal } from '@/types/patterns';
import { isSameDay } from 'date-fns';
import { Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ChatMessagesListProps {
  messages: Message[];
  filteredParticipant: string | null;
  userDisplayInfo: UserDisplayInfo;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messageRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  // Collapse state
  isCollapsed: (id: string) => boolean;
  onToggleCollapse: (id: string) => void;
  // Actions
  onDelete: (id: string) => void;
  onRatingChange: (id: string, rating: number) => void;
  onClarifyWithSpecialist?: (selectedText: string, messageId: string) => void;
  // Memory
  onSaveToMemory?: (messageId: string, content: string) => Promise<void>;
  isSavingToMemory?: boolean;
  savedMessageIds?: Set<string>;
  // Pending responses for skeleton indicators
  pendingResponses?: Map<string, PendingResponseState>;
  // Streaming responses for real-time content
  streamingResponses?: Map<string, StreamingResponse>;
  // Timeout settings
  timeoutSeconds?: number;
  // Timeout action handlers
  onRetryRequest?: (modelId: string) => void;
  onDismissTimeout?: (modelId: string) => void;
  onRemoveModel?: (modelId: string) => void;
  // Streaming handlers
  onStopStreaming?: (modelId: string) => void;
  // Proposal approval handlers
  onUpdateProposals?: (messageId: string, proposals: Proposal[]) => void;
  onRequestProposalDetails?: (messageId: string, proposalIds: string[]) => void;
  // D-Chat consultation
  onConsultInDChat?: (messageId: string, content: string) => void;
}

export function ChatMessagesList({
  messages,
  filteredParticipant,
  userDisplayInfo,
  messagesEndRef,
  messageRefs,
  isCollapsed,
  onToggleCollapse,
  onDelete,
  onRatingChange,
  onClarifyWithSpecialist,
  onSaveToMemory,
  isSavingToMemory,
  savedMessageIds,
  pendingResponses,
  streamingResponses,
  timeoutSeconds = 120,
  onRetryRequest,
  onDismissTimeout,
  onRemoveModel,
  onStopStreaming,
  onUpdateProposals,
  onRequestProposalDetails,
  onConsultInDChat,
}: ChatMessagesListProps) {
  if (messages.length === 0) {
    return (
      <ScrollArea className="flex-1 p-4 hydra-scrollbar">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse-glow" />
            <p className="text-muted-foreground">
              {filteredParticipant ? 'Нет сообщений по фильтру' : 'Начните диалог с AI-Hydra'}
            </p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4 hydra-scrollbar">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((message, index) => {
          const messageDate = new Date(message.created_at);
          const prevMessage = index > 0 ? messages[index - 1] : null;
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
                  onDelete={onDelete}
                  onRatingChange={onRatingChange}
                  isCollapsed={isCollapsed(message.id)}
                  onToggleCollapse={onToggleCollapse}
                  onClarifyWithSpecialist={onClarifyWithSpecialist}
                  onSaveToMemory={onSaveToMemory}
                  isSavingToMemory={isSavingToMemory}
                  isAlreadySavedToMemory={savedMessageIds?.has(message.id)}
                  onUpdateProposals={onUpdateProposals}
                  onRequestProposalDetails={onRequestProposalDetails}
                  onConsultInDChat={onConsultInDChat}
                />
              </div>
            </React.Fragment>
          );
        })}
        
        {/* Streaming responses - real-time content from parallel SSE streams */}
        <AnimatePresence mode="popLayout">
          {streamingResponses && Array.from(streamingResponses.values()).map(response => (
            <StreamingMessageCard
              key={`streaming-${response.modelId}`}
              response={response}
              onStop={onStopStreaming}
            />
          ))}
        </AnimatePresence>
        
        {/* Skeleton indicators for pending responses (before first token arrives) */}
        <AnimatePresence mode="popLayout">
          {pendingResponses && Array.from(pendingResponses.values()).map(pending => (
            <motion.div
              key={`pending-${pending.modelId}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0, 0.2, 1]
              }}
              layout
            >
              <MessageSkeleton 
                pending={pending}
                timeoutSeconds={timeoutSeconds}
                onRetry={onRetryRequest}
                onDismiss={onDismissTimeout}
                onRemoveModel={onRemoveModel}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
