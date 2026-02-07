import React from 'react';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '@/lib/utils';
import { Copy, User, Search, Shield, Scale, Users, Lightbulb, Square } from 'lucide-react';
import type { ConsultantMode } from '@/hooks/useStreamingChat';
import { ModelNameWithIcon } from '@/components/ui/ModelNameWithIcon';

interface ModeConfig {
  id: ConsultantMode;
  icon: React.ElementType;
  color: string;
}

const MODES: ModeConfig[] = [
  { id: 'web_search', icon: Search, color: 'text-hydra-glow' },
  { id: 'expert', icon: User, color: 'text-hydra-success' },
  { id: 'critic', icon: Shield, color: 'text-hydra-critical' },
  { id: 'arbiter', icon: Scale, color: 'text-hydra-expert' },
  { id: 'moderator', icon: Users, color: 'text-hydra-consultant' },
];

interface StreamingMessageProps {
  id: string;
  role: 'user' | 'consultant';
  content: string;
  mode: ConsultantMode;
  modelName: string | null;
  createdAt: string;
  isStreaming?: boolean;
  onCopyToMainChat?: (content: string, sourceMessageId: string | null, modelName?: string | null) => void;
  sourceMessageId?: string | null;
  onStopStreaming?: () => void;
}

export function StreamingMessage({
  role,
  content,
  mode,
  modelName,
  createdAt,
  isStreaming = false,
  onCopyToMainChat,
  sourceMessageId,
  onStopStreaming,
}: StreamingMessageProps) {
  const { t } = useLanguage();
  const isUser = role === 'user';
  const modeConfig = MODES.find((m) => m.id === mode);

  return (
    <div
      className={cn(
        'rounded-lg p-2 text-sm',
        isUser
          ? 'bg-primary/10 border border-primary/20'
          : 'bg-muted/50 border border-border'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-1.5 text-xs text-muted-foreground">
        {isUser ? (
          <User className="h-3 w-3" />
        ) : modeConfig ? (
          <modeConfig.icon className={cn('h-3 w-3', modeConfig.color)} />
        ) : (
          <Lightbulb className="h-3 w-3 text-hydra-consultant" />
        )}
        <span>
          {isUser ? 'Вы' : modelName ? <ModelNameWithIcon modelName={modelName} iconSize="h-3 w-3" /> : 'Консультант'}
        </span>
        <span className="ml-auto">
          {format(new Date(createdAt), 'HH:mm', {
            locale: t('common.locale') === 'ru' ? ru : enUS,
          })}
        </span>
      </div>

      {/* Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <MarkdownRenderer content={content} streaming={isStreaming} />
        
        {/* Blinking cursor during streaming */}
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-0.5 bg-primary animate-pulse" />
        )}
      </div>

      {/* Stop button during streaming */}
      {isStreaming && onStopStreaming && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
            onClick={onStopStreaming}
          >
            <Square className="h-3 w-3 mr-1 fill-current" />
            Остановить
          </Button>
        </div>
      )}

      {/* Copy to chat button (only for completed consultant responses) */}
      {!isUser && !isStreaming && onCopyToMainChat && content && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => onCopyToMainChat(content, sourceMessageId || null, modelName)}
          >
            <Copy className="h-3 w-3 mr-1" />
            {t('dchat.copyToChat')}
          </Button>
        </div>
      )}
    </div>
  );
}
