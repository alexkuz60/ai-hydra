import React, { useState } from 'react';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';
import { 
  Brain, 
  Shield, 
  Scale, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Trash2 
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

type MessageRole = 'user' | 'assistant' | 'critic' | 'arbiter';

interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  model_name: string | null;
  content: string;
  reasoning_path: string | null;
  confidence_score: number | null;
  created_at: string;
}

const roleConfig = {
  user: {
    icon: User,
    label: 'role.user',
    variant: 'user' as const,
    color: 'text-primary',
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
};

interface ChatMessageProps {
  message: Message;
  onDelete: (messageId: string) => void;
}

const MAX_COLLAPSED_LINES = 3;

export function ChatMessage({ message, onDelete }: ChatMessageProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const config = roleConfig[message.role];
  const Icon = config.icon;

  // Check if content is long enough to be collapsible
  const lines = message.content.split('\n');
  const isLongContent = lines.length > MAX_COLLAPSED_LINES || message.content.length > 300;
  
  // Get truncated content for collapsed state
  const truncatedContent = isLongContent && !isExpanded
    ? lines.slice(0, MAX_COLLAPSED_LINES).join('\n').slice(0, 300) + '...'
    : message.content;

  return (
    <HydraCard 
      variant={config.variant}
      className="animate-slide-up group relative"
    >
      <HydraCardHeader>
        <Icon className={cn('h-5 w-5', config.color)} />
        <HydraCardTitle className={config.color}>
          {t(config.label)}
          {message.model_name && (
            <span className="text-muted-foreground font-normal ml-2">
              ({message.model_name})
            </span>
          )}
        </HydraCardTitle>
        {message.confidence_score && (
          <span className="text-xs text-muted-foreground ml-auto">
            Confidence: {(message.confidence_score * 100).toFixed(0)}%
          </span>
        )}
      </HydraCardHeader>
      
      <HydraCardContent className="text-foreground/90">
        {message.role === 'user' ? (
          <p className="whitespace-pre-wrap">{truncatedContent}</p>
        ) : (
          <MarkdownRenderer content={truncatedContent} className="text-sm" />
        )}
      </HydraCardContent>
      
      {message.reasoning_path && isExpanded && (
        <div className="mt-3 pt-3 border-t border-border/50 px-4 pb-4">
          <p className="text-xs text-muted-foreground font-mono">
            Chain of Thought: {message.reasoning_path}
          </p>
        </div>
      )}

      {/* Message controls */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isLongContent && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
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
