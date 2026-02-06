import React, { useState, useRef, useCallback } from 'react';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AttachmentPreview, Attachment } from './AttachmentPreview';
import { ThinkingBlock } from './ThinkingBlock';
import { TextSelectionPopup } from './TextSelectionPopup';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { ToolCallDisplay } from './ToolCallDisplay';
import { 
  User,
  Crown,
  ChevronDown, 
  ChevronUp, 
  Trash2,
  Brain,
  RefreshCw,
  Archive,
  Check,
  Lightbulb,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Message, MessageMetadata } from '@/types/messages';
import { ToolCall, ToolResult } from '@/types/tools';
import { ROLE_CONFIG, getRoleConfig } from '@/config/roles';
import { ProposalApprovalBlock } from './ProposalApprovalBlock';
import type { Proposal } from '@/types/patterns';

// User display info passed from parent
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
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            onChange(i);
          }}
          className={cn(
            "p-0.5 transition-all hover:scale-125",
            i <= value 
              ? "text-primary" 
              : "text-muted-foreground/30"
          )}
          title={`${i}/10`}
        >
          <Brain className="h-4 w-4" />
        </button>
      ))}
      <span className="ml-2 text-xs text-muted-foreground font-medium">
        {value}/10
      </span>
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
}

const MAX_COLLAPSED_LINES = 3;

export function ChatMessage({ message, userDisplayInfo, onDelete, onRatingChange, isCollapsed, onToggleCollapse, onClarifyWithSpecialist, onSaveToMemory, isSavingToMemory, isAlreadySavedToMemory, onUpdateProposals, onRequestProposalDetails, onConsultInDChat, onRequestEvaluation }: ChatMessageProps) {
  const { t } = useLanguage();
  const contentRef = useRef<HTMLDivElement>(null);
  const [savedToMemory, setSavedToMemory] = useState(isAlreadySavedToMemory || false);
  
  // Use controlled state from parent if provided, otherwise local state
  const [localExpanded, setLocalExpanded] = useState(true);
  const isExpanded = isCollapsed !== undefined ? !isCollapsed : localExpanded;
  
  const handleToggleExpand = () => {
    if (onToggleCollapse) {
      onToggleCollapse(message.id);
    } else {
      setLocalExpanded(!localExpanded);
    }
  };
  
  const handleClarify = useCallback((text: string) => {
    if (onClarifyWithSpecialist) {
      onClarifyWithSpecialist(text, message.id);
    }
  }, [onClarifyWithSpecialist, message.id]);

  const handleSaveToMemory = useCallback(async () => {
    // Don't allow saving if already saved
    if (isAlreadySavedToMemory || savedToMemory || isSavingToMemory) return;
    
    if (onSaveToMemory) {
      try {
        await onSaveToMemory(message.id, message.content);
        setSavedToMemory(true);
        // Don't reset - it stays saved
      } catch (error) {
        // Error is handled by the hook
      }
    }
  }, [onSaveToMemory, message.id, message.content, savedToMemory, isSavingToMemory, isAlreadySavedToMemory]);
  
  const config = getRoleConfig(message.role);
  
  // For user messages, show custom display based on role
  const isUserMessage = message.role === 'user';
  const Icon = isUserMessage && userDisplayInfo?.isSupervisor ? Crown : config.icon;

  // Get rating, attachments, tool calls, and fallback info from metadata
  const metadataObj = (typeof message.metadata === 'object' && message.metadata !== null) 
    ? message.metadata as MessageMetadata
    : {} as MessageMetadata;
  const rating = (typeof metadataObj.rating === 'number' ? metadataObj.rating : 0);
  const attachments = (Array.isArray(metadataObj.attachments) ? metadataObj.attachments : []) as Attachment[];
  const toolCalls = metadataObj.tool_calls as ToolCall[] | undefined;
  const toolResults = metadataObj.tool_results as ToolResult[] | undefined;
  const usedFallback = metadataObj.used_fallback === true;
  const fallbackReason = metadataObj.fallback_reason;
  const proposals = metadataObj.proposals as Proposal[] | undefined;

  const handleUpdateProposals = useCallback((updatedProposals: Proposal[]) => {
    if (onUpdateProposals) {
      onUpdateProposals(message.id, updatedProposals);
    }
  }, [onUpdateProposals, message.id]);

  const handleRequestDetails = useCallback((proposalIds: string[]) => {
    if (onRequestProposalDetails) {
      onRequestProposalDetails(message.id, proposalIds);
    }
  }, [onRequestProposalDetails, message.id]);

  // Check if content is long enough to be collapsible
  const lines = message.content.split('\n');
  const isLongContent = lines.length > MAX_COLLAPSED_LINES || message.content.length > 300;
  
  // Get truncated content for collapsed state
  const truncatedContent = isLongContent && !isExpanded
    ? lines.slice(0, MAX_COLLAPSED_LINES).join('\n').slice(0, 300) + '...'
    : message.content;

  const isAiMessage = message.role !== 'user';

  // Determine card variant - use supervisor variant for supervisor users, or get from role config
  const cardVariant = isUserMessage && userDisplayInfo?.isSupervisor 
    ? 'supervisor' 
    : config.cardVariant || 'default';

  return (
    <HydraCard 
      variant={cardVariant}
      className="animate-slide-up group relative"
    >
      <HydraCardHeader>
        <Icon className={cn('h-5 w-5', isUserMessage && userDisplayInfo?.isSupervisor ? 'text-hydra-supervisor' : config.color)} />
        <HydraCardTitle className={isUserMessage && userDisplayInfo?.isSupervisor ? 'text-hydra-supervisor' : config.color}>
          {isUserMessage && userDisplayInfo?.isSupervisor 
            ? (userDisplayInfo.displayName || t('role.supervisor'))
            : t(config.label)
          }
          {message.model_name && (
            <span className="text-muted-foreground font-normal ml-2">
              ({message.model_name})
            </span>
          )}
          {/* Fallback indicator */}
          {usedFallback && isAiMessage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <RefreshCw className="h-3 w-3" />
                    fallback
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">
                    {fallbackReason === 'rate_limit' 
                      ? 'Модель переключена на альтернативный режим из-за превышения лимита запросов'
                      : fallbackReason === 'unsupported'
                      ? 'Модель не поддерживает стриминг, использован стандартный режим'
                      : 'Модель использовала резервный режим обработки'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </HydraCardTitle>
        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-2">
          {format(new Date(message.created_at), 'dd MMM, HH:mm', { 
            locale: t('common.locale') === 'ru' ? ru : enUS 
          })}
          {message.confidence_score && (
            <span>• {(message.confidence_score * 100).toFixed(0)}%</span>
          )}
        </span>
      </HydraCardHeader>
      
      <HydraCardContent className="text-foreground/90">
        {/* Thinking/Reasoning block for AI messages */}
        {message.reasoning_path && isAiMessage && (
          <ThinkingBlock 
            reasoning={message.reasoning_path} 
            messageId={message.id}
            savedTranslation={message.reasoning_translated}
          />
        )}
        
        {/* Tool calls display for AI messages */}
        {isAiMessage && toolCalls && toolCalls.length > 0 && (
          <ToolCallDisplay 
            toolCalls={toolCalls} 
            toolResults={toolResults}
          />
        )}
        
        {/* Content with text selection popup for AI messages */}
        <div ref={contentRef}>
          {message.role === 'user' ? (
            <p className="whitespace-pre-wrap">{truncatedContent}</p>
          ) : (
            <MarkdownRenderer content={truncatedContent} className="text-sm" />
          )}
        </div>
        
        {/* Text selection popup for AI messages */}
        {isAiMessage && onClarifyWithSpecialist && (
          <TextSelectionPopup
            containerRef={contentRef}
            onClarify={handleClarify}
          />
        )}
        
        {/* Proposals approval block for AI messages */}
        {isAiMessage && proposals && proposals.length > 0 && (
          <ProposalApprovalBlock
            proposals={proposals}
            onUpdateProposals={handleUpdateProposals}
            onRequestDetails={onRequestProposalDetails ? handleRequestDetails : undefined}
            isReadOnly={!onUpdateProposals}
          />
        )}
        
        {/* Attachments - shown for messages with file attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/30 relative z-10">
            {attachments.map((att, idx) => (
              <AttachmentPreview key={`${message.id}-att-${idx}`} attachment={att} />
            ))}
          </div>
        )}
      </HydraCardContent>
      

      {/* Rating for AI messages */}
      {isAiMessage && (
        <div className="px-4 pb-3">
          <BrainRating 
            value={rating} 
            onChange={(newRating) => onRatingChange(message.id, newRating)} 
          />
        </div>
      )}

      {/* Message controls */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Request Evaluation button for AI messages */}
        {isAiMessage && onRequestEvaluation && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-hydra-arbiter hover:text-hydra-arbiter hover:bg-hydra-arbiter/10"
                  onClick={() => onRequestEvaluation(message.id, message.content, message.model_name)}
                >
                  <Scale className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{t('dchat.requestEvaluation')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Consult in D-Chat button for AI messages */}
        {isAiMessage && onConsultInDChat && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-hydra-consultant hover:text-hydra-consultant hover:bg-hydra-consultant/10"
                  onClick={() => onConsultInDChat(message.id, message.content)}
                >
                  <Lightbulb className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{t('dchat.consultOnMessage')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Save to memory button for AI messages */}
        {isAiMessage && onSaveToMemory && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  className={cn(
                    "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
                    (isAlreadySavedToMemory || savedToMemory)
                      ? "bg-hydra-success/20 text-hydra-success cursor-default"
                      : "hover:bg-hydra-archivist/10 text-hydra-archivist hover:text-hydra-archivist"
                  )}
                  onClick={handleSaveToMemory}
                  disabled={isSavingToMemory || savedToMemory || isAlreadySavedToMemory}
                  whileTap={!(savedToMemory || isAlreadySavedToMemory) && !isSavingToMemory ? { scale: 0.9 } : undefined}
                >
                  <AnimatePresence mode="wait">
                    {(isAlreadySavedToMemory || savedToMemory) ? (
                      <motion.span
                        key="saved"
                        initial={isAlreadySavedToMemory ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 300,
                          damping: 20
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </motion.span>
                    ) : isSavingToMemory ? (
                      <motion.span
                        key="saving"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Archive className="h-4 w-4" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                      >
                        <Archive className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  {(isAlreadySavedToMemory || savedToMemory)
                    ? t('memory.alreadySaved') 
                    : isSavingToMemory 
                    ? t('memory.saving') 
                    : t('memory.saveToMemory')}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {isLongContent && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleToggleExpand}
            title={isExpanded ? t('common.collapse') : t('common.expand')}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('messages.deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('messages.deleteConfirm')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDelete(message.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </HydraCard>
  );
}
