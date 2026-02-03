import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { StreamingMessage } from '@/components/warroom/StreamingMessage';
import { ModelOption } from '@/hooks/useAvailableModels';
import { useStreamingChat, ConsultantMode } from '@/hooks/useStreamingChat';
import { useSessionMemory } from '@/hooks/useSessionMemory';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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
  Users,
  Archive,
  RefreshCw,
  Check,
} from 'lucide-react';

// Source message structure for moderator context
interface SourceMessage {
  role: string;
  model_name: string | null;
  content: string;
}

interface ConsultantPanelProps {
  sessionId: string | null;
  availableModels: ModelOption[];
  isCollapsed: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  // Context from navigator (extended for moderator)
  initialQuery?: {
    messageId: string;
    content: string;
    sourceMessages?: SourceMessage[];
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

// Режимы D-чата — только экспертные роли (технический персонал исключён)
const MODES: ModeConfig[] = [
  { id: 'web_search', icon: Search, labelKey: 'dchat.webSearch', color: 'text-hydra-glow' },
  { id: 'expert', icon: User, labelKey: 'dchat.expert', color: 'text-hydra-success' },
  { id: 'critic', icon: Shield, labelKey: 'dchat.critic', color: 'text-hydra-critical' },
  { id: 'arbiter', icon: Scale, labelKey: 'dchat.arbiter', color: 'text-hydra-expert' },
  { id: 'moderator', icon: Users, labelKey: 'dchat.moderator', color: 'text-hydra-consultant' },
  // Технический персонал (archivist, analyst, promptengineer, flowregulator) намеренно исключён
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
  const [isModeratingContext, setIsModeratingContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, streaming, sendQuery, stopStreaming, clearMessages } = useStreamingChat({
    sessionId,
  });

  // Memory integration
  const { chunks, isLoading: memoryLoading, refetch: refetchMemory, getStats } = useSessionMemory(sessionId);
  const [memoryRefreshed, setMemoryRefreshed] = useState(false);
  const memoryStats = getStats();

  // Handle memory refresh
  const handleRefreshMemory = useCallback(async () => {
    await refetchMemory();
    setMemoryRefreshed(true);
    setTimeout(() => setMemoryRefreshed(false), 2000);
  }, [refetchMemory]);

  // Handle initial query from navigator - auto-trigger moderator if multiple AI responses
  useEffect(() => {
    if (!initialQuery || !selectedModel) return;
    
    // Check if we have AI responses (sourceMessages > 1 means supervisor + AI responses)
    if (initialQuery.sourceMessages && initialQuery.sourceMessages.length > 1) {
      // Has AI responses - auto-trigger moderator (hide user message with aggregated text)
      setIsModeratingContext(true);
      sendQuery(
        initialQuery.content,
        'moderator',
        selectedModel,
        initialQuery.messageId,
        true // hideUserMessage - don't show aggregated text in D-chat
      ).finally(() => {
        setIsModeratingContext(false);
        onClearInitialQuery?.();
      });
    } else {
      // Only supervisor message - just set input for manual query
      setInput(initialQuery.content);
      setCurrentSourceMessageId(initialQuery.messageId);
      onClearInitialQuery?.();
    }
  }, [initialQuery, selectedModel, sendQuery, onClearInitialQuery]);

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
    if (!input.trim() || !selectedModel || streaming) return;
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
        {/* Expand button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onExpand}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{t('dchat.expand')}</TooltipContent>
        </Tooltip>

        <div className="h-px w-6 bg-border" />

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
          
          {/* Memory Status Indicator */}
          {memoryStats.total > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className="h-5 px-1.5 text-[10px] font-medium bg-hydra-memory/10 text-hydra-memory border-hydra-memory/30 cursor-default"
                >
                  <Archive className="h-3 w-3 mr-1" />
                  {memoryStats.total}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div className="space-y-1">
                  <p className="font-medium">{t('memory.savedChunks')}: {memoryStats.total}</p>
                  {memoryStats.byType.decision > 0 && <p>• {t('memory.decisions')}: {memoryStats.byType.decision}</p>}
                  {memoryStats.byType.context > 0 && <p>• {t('memory.context')}: {memoryStats.byType.context}</p>}
                  {memoryStats.byType.instruction > 0 && <p>• {t('memory.instructions')}: {memoryStats.byType.instruction}</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Refresh Memory Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={handleRefreshMemory}
                disabled={memoryLoading}
                className={cn(
                  "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
                  memoryRefreshed 
                    ? "bg-hydra-success/20 text-hydra-success"
                    : "hover:bg-hydra-archivist/10 text-hydra-archivist hover:text-hydra-archivist"
                )}
                whileTap={!memoryLoading ? { scale: 0.9 } : undefined}
              >
                <AnimatePresence mode="wait">
                  {memoryRefreshed ? (
                    <motion.span
                      key="refreshed"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </motion.span>
                  ) : memoryLoading ? (
                    <motion.span
                      key="loading"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              {memoryRefreshed ? t('memory.refreshed') : t('memory.refresh')}
            </TooltipContent>
          </Tooltip>
          
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
          {/* Moderating indicator */}
          {isModeratingContext && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-hydra-consultant/10 border border-hydra-consultant/20 text-hydra-consultant">
              <Users className="h-4 w-4 animate-pulse" />
              <span className="text-sm">{t('dchat.moderating')}</span>
            </div>
          )}
          
          {messages.length === 0 && !isModeratingContext ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 text-hydra-consultant/50" />
              <p>{t('dchat.empty')}</p>
            </div>
          ) : (
            messages.map((message) => (
              <StreamingMessage 
                key={message.id}
                id={message.id}
                role={message.role}
                content={message.content}
                mode={message.mode}
                modelName={message.model_name}
                createdAt={message.created_at}
                isStreaming={message.isStreaming}
                sourceMessageId={message.sourceMessageId}
                onCopyToMainChat={onCopyToMainChat}
                onStopStreaming={message.isStreaming ? stopStreaming : undefined}
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
            disabled={streaming}
          />
          <Button
            onClick={handleSend}
            disabled={streaming || !input.trim() || !selectedModel}
            size="icon"
            className="self-end shrink-0"
          >
            {streaming ? (
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
