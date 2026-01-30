import React, { useState } from 'react';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AttachmentPreview, Attachment } from './AttachmentPreview';
import { ThinkingBlock } from './ThinkingBlock';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { ToolCallDisplay } from './ToolCallDisplay';
import { 
  Brain, 
  Shield, 
  Scale, 
  User,
  Crown,
  ChevronDown, 
  ChevronUp, 
  Trash2,
  Lightbulb
} from 'lucide-react';
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
import { Message, MessageRole, MessageMetadata } from '@/types/messages';
import { ToolCall, ToolResult } from '@/types/tools';

// User display info passed from parent
export interface UserDisplayInfo {
  displayName: string | null;
  isSupervisor: boolean;
}

const roleConfig = {
  user: {
    icon: User,
    label: 'role.user',
    variant: 'user' as const,
    supervisorVariant: 'supervisor' as const,
    color: 'text-hydra-user',
  },
  assistant: {
    icon: Brain,
    label: 'role.assistant',
    variant: 'expert' as const,
    color: 'text-hydra-expert',
  },
  critic: {
    icon: Shield,
    label: 'role.critic',
    variant: 'critic' as const,
    color: 'text-hydra-critical',
  },
  arbiter: {
    icon: Scale,
    label: 'role.arbiter',
    variant: 'arbiter' as const,
    color: 'text-hydra-arbiter',
  },
  consultant: {
    icon: Lightbulb,
    label: 'role.consultant',
    variant: 'glass' as const,
    color: 'text-hydra-consultant',
  },
};

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
}

const MAX_COLLAPSED_LINES = 3;

export function ChatMessage({ message, userDisplayInfo, onDelete, onRatingChange, isCollapsed, onToggleCollapse }: ChatMessageProps) {
  const { t } = useLanguage();
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
  
  const config = roleConfig[message.role];
  
  // For user messages, show custom display based on role
  const isUserMessage = message.role === 'user';
  const Icon = isUserMessage && userDisplayInfo?.isSupervisor ? Crown : config.icon;

  // Get rating, attachments, and tool calls from metadata
  const metadataObj = (typeof message.metadata === 'object' && message.metadata !== null) 
    ? message.metadata as MessageMetadata
    : {} as MessageMetadata;
  const rating = (typeof metadataObj.rating === 'number' ? metadataObj.rating : 0);
  const attachments = (Array.isArray(metadataObj.attachments) ? metadataObj.attachments : []) as Attachment[];
  const toolCalls = metadataObj.tool_calls as ToolCall[] | undefined;
  const toolResults = metadataObj.tool_results as ToolResult[] | undefined;

  // Check if content is long enough to be collapsible
  const lines = message.content.split('\n');
  const isLongContent = lines.length > MAX_COLLAPSED_LINES || message.content.length > 300;
  
  // Get truncated content for collapsed state
  const truncatedContent = isLongContent && !isExpanded
    ? lines.slice(0, MAX_COLLAPSED_LINES).join('\n').slice(0, 300) + '...'
    : message.content;

  const isAiMessage = message.role !== 'user';

  // Determine card variant based on role and supervisor status
  const cardVariant = isUserMessage && userDisplayInfo?.isSupervisor 
    ? 'supervisor' as const
    : config.variant;

  return (
    <HydraCard 
      variant={cardVariant}
      className="animate-slide-up group relative"
    >
      <HydraCardHeader>
        <Icon className={cn('h-5 w-5', isUserMessage && userDisplayInfo?.isSupervisor ? 'text-hydra-supervisor' : config.color)} />
        <HydraCardTitle className={isUserMessage && userDisplayInfo?.isSupervisor ? 'text-hydra-supervisor' : config.color}>
          {isUserMessage && userDisplayInfo?.isSupervisor 
            ? `${t('role.supervisor')}${userDisplayInfo.displayName ? ` (${userDisplayInfo.displayName})` : ''}`
            : t(config.label)
          }
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
        
        {message.role === 'user' ? (
          <p className="whitespace-pre-wrap">{truncatedContent}</p>
        ) : (
          <MarkdownRenderer content={truncatedContent} className="text-sm" />
        )}
        
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/30">
            {attachments.map((att, idx) => (
              <AttachmentPreview key={idx} attachment={att} />
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
