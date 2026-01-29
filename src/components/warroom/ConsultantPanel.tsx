import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { ToolCallDisplay } from '@/components/warroom/ToolCallDisplay';
import { ModelOption } from '@/hooks/useAvailableModels';
import { ConsultantMessage, ConsultantMode, useConsultantChat } from '@/hooks/useConsultantChat';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  Search,
  User,
  Shield,
  Scale,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
} from 'lucide-react';

interface ConsultantPanelProps {
  sessionId: string | null;
  availableModels: ModelOption[];
  isCollapsed: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  // Context from navigator
  initialQuery?: {
    messageId: string;
    content: string;
  } | null;
  onClearInitialQuery?: () => void;
  // Copy to main chat
  onCopyToMainChat?: (content: string, sourceMessageId: string | null) => void;
}

interface ModeConfig {
  id: ConsultantMode;
  icon: React.ElementType;
  labelKey: string;
  color: string;
}

const MODES: ModeConfig[] = [
  { id: 'web_search', icon: Search, labelKey: 'dchat.webSearch', color: 'text-hydra-glow' },
  { id: 'expert', icon: User, labelKey: 'dchat.expert', color: 'text-hydra-success' },
  { id: 'critic', icon: Shield, labelKey: 'dchat.critic', color: 'text-hydra-critical' },
  { id: 'arbiter', icon: Scale, labelKey: 'dchat.arbiter', color: 'text-hydra-expert' },
];

export function ConsultantPanel({
  sessionId,
  availableModels,
  isCollapsed,
  onExpand,
  onCollapse,
  initialQuery,
  onClearInitialQuery,
  onCopyToMainChat,
}: ConsultantPanelProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<ConsultantMode>('expert');
  const [selectedModel, setSelectedModel] = useState<string>(
    availableModels[0]?.id || ''
  );
  const [currentSourceMessageId, setCurrentSourceMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sending, sendQuery, clearMessages } = useConsultantChat({
    sessionId,
  });

  // Handle initial query from navigator
  useEffect(() => {
    if (initialQuery) {
      setInput(initialQuery.content);
      setCurrentSourceMessageId(initialQuery.messageId);
      onClearInitialQuery?.();
    }
  }, [initialQuery, onClearInitialQuery]);

  // Update selected model when available models change
  useEffect(() => {
    if (availableModels.length > 0 && !availableModels.find((m) => m.id === selectedModel)) {
      setSelectedModel(availableModels[0].id);
    }
  }, [availableModels, selectedModel]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedModel || sending) return;
    const messageContent = input.trim();
    const sourceId = currentSourceMessageId;
    setInput('');
    setCurrentSourceMessageId(null);
    await sendQuery(messageContent, selectedMode, selectedModel, sourceId);
  };

  const handleQuickAction = (mode: ConsultantMode) => {
    if (isCollapsed) {
      onExpand();
    }
    setSelectedMode(mode);
  };

  // Collapsed view - just icons
  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 gap-3 bg-sidebar border-l border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onExpand}
              className="text-hydra-consultant hover:text-hydra-consultant/80"
            >
              <Lightbulb className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{t('dchat.title')}</TooltipContent>
        </Tooltip>

        <div className="h-px w-6 bg-border my-1" />

        {MODES.map((mode) => (
          <Tooltip key={mode.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleQuickAction(mode.id)}
                className={cn('hover:bg-accent', mode.color)}
              >
                <mode.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{t(mode.labelKey)}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  // Expanded view
  return (
    <div className="h-full flex flex-col bg-sidebar border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-hydra-consultant" />
          <span className="font-medium text-sm">{t('dchat.title')}</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearMessages}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('dchat.clear')}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCollapse}>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('dchat.collapse')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Mode selector */}
      <div className="p-2 border-b border-border">
        <div className="grid grid-cols-4 gap-1">
          {MODES.map((mode) => (
            <Tooltip key={mode.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedMode === mode.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedMode(mode.id)}
                  className={cn(
                    'h-8 px-2',
                    selectedMode === mode.id && mode.color
                  )}
                >
                  <mode.icon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t(mode.labelKey)}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Model selector */}
      <div className="p-2 border-b border-border">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={t('dchat.selectModel')} />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model.id} value={model.id} className="text-xs">
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-3 hydra-scrollbar">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 text-hydra-consultant/50" />
              <p>{t('dchat.empty')}</p>
            </div>
          ) : (
            messages.map((message) => (
              <ConsultantMessageItem 
                key={message.id} 
                message={message} 
                onCopyToMainChat={onCopyToMainChat}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Context indicator */}
      {currentSourceMessageId && (
        <div className="px-2 py-1 bg-hydra-consultant/10 border-t border-hydra-consultant/20 text-xs text-hydra-consultant flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          <span>{t('dchat.contextFrom').replace('{index}', currentSourceMessageId.slice(0, 8))}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-auto"
            onClick={() => setCurrentSourceMessageId(null)}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="p-2 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('dchat.placeholder')}
            className="min-h-[60px] max-h-[100px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !input.trim() || !selectedModel}
            size="icon"
            className="self-end shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Message item component
function ConsultantMessageItem({ 
  message, 
  onCopyToMainChat 
}: { 
  message: ConsultantMessage;
  onCopyToMainChat?: (content: string, sourceMessageId: string | null) => void;
}) {
  const { t } = useLanguage();
  const isUser = message.role === 'user';
  const modeConfig = MODES.find((m) => m.id === message.mode);

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
          {isUser
            ? 'Вы'
            : message.model_name?.split('/').pop() || 'Консультант'}
        </span>
      </div>

      {/* Content */}
      {message.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Думаю...</span>
        </div>
      ) : (
        <>
          {/* Tool calls */}
          {message.tool_calls && message.tool_calls.length > 0 && (
            <div className="mb-2">
              <ToolCallDisplay
                toolCalls={message.tool_calls}
                toolResults={message.tool_results}
              />
            </div>
          )}

          {/* Message content */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer content={message.content} />
          </div>

          {/* Copy to chat button (only for consultant responses) */}
          {!isUser && onCopyToMainChat && message.content && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onCopyToMainChat(message.content, message.sourceMessageId || null)}
              >
                <Copy className="h-3 w-3 mr-1" />
                {t('dchat.copyToChat')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
