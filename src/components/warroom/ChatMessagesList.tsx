import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, UserDisplayInfo } from '@/components/warroom/ChatMessage';
import { DateSeparator } from '@/components/warroom/DateSeparator';
import { MessageSkeleton } from '@/components/warroom/MessageSkeleton';
import { Message } from '@/types/messages';
import { PendingResponseState } from '@/types/pending';
import { isSameDay } from 'date-fns';
import { Sparkles } from 'lucide-react';

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
  // Pending responses for skeleton indicators
  pendingResponses?: Map<string, PendingResponseState>;
  // Timeout settings
  timeoutSeconds?: number;
  // Timeout action handlers
  onRetryRequest?: (modelId: string) => void;
  onDismissTimeout?: (modelId: string) => void;
  onRemoveModel?: (modelId: string) => void;
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
  pendingResponses,
  timeoutSeconds = 120,
  onRetryRequest,
  onDismissTimeout,
  onRemoveModel,
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
                />
              </div>
            </React.Fragment>
          );
        })}
        
        {/* Skeleton indicators for pending responses */}
        {pendingResponses && pendingResponses.size > 0 && (
          <div className="space-y-4">
            {Array.from(pendingResponses.values()).map(pending => (
              <MessageSkeleton 
                key={pending.modelId} 
                pending={pending}
                timeoutSeconds={timeoutSeconds}
                onRetry={onRetryRequest}
                onDismiss={onDismissTimeout}
                onRemoveModel={onRemoveModel}
              />
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
