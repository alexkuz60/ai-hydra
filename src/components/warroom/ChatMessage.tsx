import React, { useState, useRef, useCallback } from 'react';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AttachmentPreview, Attachment } from './AttachmentPreview';
import { ThinkingBlock } from './ThinkingBlock';
import { TextSelectionPopup } from './TextSelectionPopup';
import { ChatMessageActions } from './ChatMessageActions';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { ToolCallDisplay } from './ToolCallDisplay';
import { User, Crown, ChevronDown, ChevronUp, Brain, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ModelNameWithIcon } from '@/components/ui/ModelNameWithIcon';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Message, MessageMetadata, type ProviderInfo } from '@/types/messages';
import { ProviderBadge } from './ProviderBadge';
import { ToolCall, ToolResult } from '@/types/tools';
import { getRoleConfig } from '@/config/roles';
import { ProposalApprovalBlock } from './ProposalApprovalBlock';
import type { Proposal } from '@/types/patterns';

export interface UserDisplayInfo {
  displayName: string | null;
  isSupervisor: boolean;
}

interface BrainRatingProps {
  value: number;
  onChange: (value: number) => void;
}

function BrainRating({ value, onChange }: BrainRatingProps) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-xs text-muted-foreground mr-1">{t('messages.rating')}:</span>
      {Array.from({ length: 11 }, (_, i) => (
        <button key={i} onClick={e => { e.stopPropagation(); onChange(i); }}
          className={cn("p-0.5 transition-all hover:scale-125", i <= value ? "text-primary" : "text-muted-foreground/30")} title={`${i}/10`}>
          <Brain className="h-4 w-4" />
        </button>
      ))}
      <span className="ml-2 text-xs text-muted-foreground font-medium">{value}/10</span>
    </div>
  );
}

interface ChatMessageProps {
  message: Message;
  userDisplayInfo?: UserDisplayInfo;
  onDelete: (messageId: string) => void;
  onRatingChange: (messageId: string, rating: number) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (messageId: string) => void;
  onClarifyWithSpecialist?: (selectedText: string, messageId: string) => void;
  onSaveToMemory?: (messageId: string, content: string) => Promise<void>;
  isSavingToMemory?: boolean;
  isAlreadySavedToMemory?: boolean;
  onUpdateProposals?: (messageId: string, proposals: Proposal[]) => void;
  onRequestProposalDetails?: (messageId: string, proposalIds: string[]) => void;
  onConsultInDChat?: (messageId: string, content: string) => void;
  onRequestEvaluation?: (messageId: string, content: string, modelName: string | null) => void;
  onHallucination?: (messageId: string, modelName: string | null, sessionId: string) => void;
  onChecklistChange?: (messageId: string, checklistState: Record<number, boolean>) => void;
  forceInteractiveChecklists?: boolean;
}

const MAX_COLLAPSED_LINES = 3;

export function ChatMessage({ message, userDisplayInfo, onDelete, onRatingChange, isCollapsed, onToggleCollapse, onClarifyWithSpecialist, onSaveToMemory, isSavingToMemory, isAlreadySavedToMemory, onUpdateProposals, onRequestProposalDetails, onConsultInDChat, onRequestEvaluation, onHallucination, onChecklistChange, forceInteractiveChecklists }: ChatMessageProps) {
  const { t } = useLanguage();
  const contentRef = useRef<HTMLDivElement>(null);
  const [localExpanded, setLocalExpanded] = useState(true);
  const isExpanded = isCollapsed !== undefined ? !isCollapsed : localExpanded;

  const handleToggleExpand = () => {
    if (onToggleCollapse) onToggleCollapse(message.id);
    else setLocalExpanded(!localExpanded);
  };

  const handleClarify = useCallback((text: string) => {
    onClarifyWithSpecialist?.(text, message.id);
  }, [onClarifyWithSpecialist, message.id]);

  const config = getRoleConfig(message.role);
  const isUserMessage = message.role === 'user';
  const Icon = isUserMessage && userDisplayInfo?.isSupervisor ? Crown : config.icon;
  const isAiMessage = !isUserMessage;

  const metadataObj = (typeof message.metadata === 'object' && message.metadata !== null) ? message.metadata as MessageMetadata : {} as MessageMetadata;
  const rating = typeof metadataObj.rating === 'number' ? metadataObj.rating : 0;
  const attachments = (Array.isArray(metadataObj.attachments) ? metadataObj.attachments : []) as Attachment[];
  const toolCalls = metadataObj.tool_calls as ToolCall[] | undefined;
  const toolResults = metadataObj.tool_results as ToolResult[] | undefined;
  const usedFallback = metadataObj.used_fallback === true;
  const fallbackReason = metadataObj.fallback_reason;
  const providerInfo = metadataObj.provider_info as ProviderInfo | undefined;
  const proposals = metadataObj.proposals as Proposal[] | undefined;
  const interactiveChecklists = forceInteractiveChecklists || metadataObj.interactive_checklists === true;
  const checklistState = (metadataObj.checklist_state as Record<number, boolean>) || {};

  const handleChecklistItemChange = useCallback((index: number, checked: boolean) => {
    if (!onChecklistChange) return;
    onChecklistChange(message.id, { ...checklistState, [index]: checked });
  }, [onChecklistChange, checklistState, message.id]);

  const handleUpdateProposals = useCallback((updatedProposals: Proposal[]) => {
    onUpdateProposals?.(message.id, updatedProposals);
  }, [onUpdateProposals, message.id]);

  const handleRequestDetails = useCallback((proposalIds: string[]) => {
    onRequestProposalDetails?.(message.id, proposalIds);
  }, [onRequestProposalDetails, message.id]);

  const lines = message.content.split('\n');
  const isLongContent = lines.length > MAX_COLLAPSED_LINES || message.content.length > 300;
  const truncatedContent = isLongContent && !isExpanded
    ? lines.slice(0, MAX_COLLAPSED_LINES).join('\n').slice(0, 300) + '...'
    : message.content;

  const cardVariant = isUserMessage && userDisplayInfo?.isSupervisor ? 'supervisor' : config.cardVariant || 'default';

  return (
    <HydraCard variant={cardVariant} className="animate-slide-up group relative">
      <HydraCardHeader>
        <Icon className={cn('h-5 w-5', isUserMessage && userDisplayInfo?.isSupervisor ? 'text-hydra-supervisor' : config.color)} />
        <HydraCardTitle className={isUserMessage && userDisplayInfo?.isSupervisor ? 'text-hydra-supervisor' : config.color}>
          {isUserMessage && userDisplayInfo?.isSupervisor ? (userDisplayInfo.displayName || t('role.supervisor')) : t(config.label)}
          {message.model_name && (
            <span className="text-muted-foreground font-normal ml-2">(<ModelNameWithIcon modelName={message.model_name} />)</span>
          )}
          {usedFallback && isAiMessage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <RefreshCw className="h-3 w-3" />fallback
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">
                    {fallbackReason === 'rate_limit' ? 'Модель переключена на альтернативный режим из-за превышения лимита запросов'
                      : fallbackReason === 'unsupported' ? 'Модель недоступна у ProxyAPI — ответ получен через Lovable AI'
                      : 'Модель использовала резервный режим обработки'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {providerInfo && isAiMessage && !usedFallback && <ProviderBadge providerInfo={providerInfo} />}
        </HydraCardTitle>
        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-2">
          {format(new Date(message.created_at), 'dd MMM, HH:mm', { locale: t('common.locale') === 'ru' ? ru : enUS })}
          {message.confidence_score && <span>• {(message.confidence_score * 100).toFixed(0)}%</span>}
        </span>
      </HydraCardHeader>

      <HydraCardContent className="text-foreground/90">
        {message.reasoning_path && isAiMessage && (
          <ThinkingBlock reasoning={message.reasoning_path} messageId={message.id} savedTranslation={message.reasoning_translated} />
        )}
        {isAiMessage && toolCalls && toolCalls.length > 0 && <ToolCallDisplay toolCalls={toolCalls} toolResults={toolResults} />}
        <div ref={contentRef}>
          {isUserMessage ? (
            <p className="whitespace-pre-wrap">{truncatedContent}</p>
          ) : (
            <MarkdownRenderer content={truncatedContent} className="text-sm" interactiveChecklists={interactiveChecklists} checklistState={checklistState} onChecklistChange={handleChecklistItemChange} />
          )}
        </div>
        {isAiMessage && onClarifyWithSpecialist && <TextSelectionPopup containerRef={contentRef} onClarify={handleClarify} />}
        {isAiMessage && proposals && proposals.length > 0 && (
          <ProposalApprovalBlock proposals={proposals} onUpdateProposals={handleUpdateProposals} onRequestDetails={onRequestProposalDetails ? handleRequestDetails : undefined} isReadOnly={!onUpdateProposals} />
        )}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/30 relative z-10">
            {attachments.map((att, idx) => <AttachmentPreview key={`${message.id}-att-${idx}`} attachment={att} />)}
          </div>
        )}
      </HydraCardContent>

      {isAiMessage && (
        <div className="px-4 pb-3">
          <BrainRating value={rating} onChange={newRating => onRatingChange(message.id, newRating)} />
        </div>
      )}

      {/* Expand/collapse button */}
      {isLongContent && (
        <div className="absolute bottom-2 right-28 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleToggleExpand}>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{isExpanded ? t('messages.collapse') : t('messages.expand')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <ChatMessageActions
        messageId={message.id}
        content={message.content}
        modelName={message.model_name}
        sessionId={message.session_id}
        isAiMessage={isAiMessage}
        onDelete={onDelete}
        onSaveToMemory={onSaveToMemory}
        isSavingToMemory={isSavingToMemory}
        isAlreadySavedToMemory={isAlreadySavedToMemory}
        onConsultInDChat={onConsultInDChat}
        onRequestEvaluation={onRequestEvaluation}
        onHallucination={onHallucination}
      />
    </HydraCard>
  );
}
