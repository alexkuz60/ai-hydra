import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StreamingMessage } from '@/components/warroom/StreamingMessage';
import { SupervisorWishesPicker } from '@/components/warroom/SupervisorWishesPicker';
import { HorizontalResizeHandle } from '@/components/ui/horizontal-resize-handle';
import { DChatModelSelector } from '@/components/warroom/DChatModelSelector';
import { ModelOption } from '@/hooks/useAvailableModels';
import { useStreamingChat, ConsultantMode } from '@/hooks/useStreamingChat';
import { useSessionMemory } from '@/hooks/useSessionMemory';
import { useSupervisorWishes } from '@/hooks/useSupervisorWishes';
import { useDChatInput } from '@/hooks/useDChatInput';
import { useDChatInitialQuery } from '@/hooks/useDChatInitialQuery';
import { cn } from '@/lib/utils';
import { PromptEngineerTools, PromptEngineerTool } from './PromptEngineerTools';
import { CONSULTANT_MODE_TO_AGENT_ROLE } from '@/config/roles';
import type { AgentRole } from '@/config/roles';
import {
  Lightbulb, Search, User, Shield, Scale, Send, Loader2,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Trash2, Users, Wand2, Swords,
} from 'lucide-react';

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
  initialQuery?: { messageId: string; content: string; sourceMessages?: SourceMessage[] } | null;
  onClearInitialQuery?: () => void;
  onCopyToMainChat?: (content: string, sourceMessageId: string | null, modelName?: string | null, role?: string | null) => void;
  onResponseComplete?: (modelId: string, role: string) => void;
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
  { id: 'moderator', icon: Users, labelKey: 'dchat.moderator', color: 'text-hydra-consultant' },
  { id: 'promptengineer', icon: Wand2, labelKey: 'dchat.promptEngineer', color: 'text-hydra-promptengineer' },
  { id: 'duel', icon: Swords, labelKey: 'dchat.duel', color: 'text-hydra-critical' },
];

export function ConsultantPanel({
  sessionId, availableModels, isCollapsed, onExpand, onCollapse,
  initialQuery, onClearInitialQuery, onCopyToMainChat, onResponseComplete,
}: ConsultantPanelProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<ConsultantMode>('expert');
  const [selectedModel, setSelectedModel] = useState<string>(availableModels[0]?.id || '');
  const [currentSourceMessageId, setCurrentSourceMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Streaming chat
  const { messages, streaming, sendQuery, stopStreaming, clearMessages } = useStreamingChat({
    sessionId, onResponseComplete,
  });

  // Memory
  const { chunks } = useSessionMemory(sessionId);
  const { selectedWishes, setSelectedWishes } = useSupervisorWishes(sessionId);

  // Input resize/collapse (extracted hook)
  const { inputCollapsed, inputHeight, textareaRef, handleResizeStart, toggleInputCollapse } = useDChatInput();

  // Active roles for wishes
  const activeRoles = useMemo((): AgentRole[] => {
    return [CONSULTANT_MODE_TO_AGENT_ROLE[selectedMode]];
  }, [selectedMode]);

  // Memory context
  const memoryContext = useMemo(() => {
    return chunks.map(chunk => ({
      content: chunk.content,
      chunk_type: chunk.chunk_type,
      metadata: chunk.metadata as Record<string, unknown> | undefined,
    }));
  }, [chunks]);

  // Initial query handling (extracted hook)
  const { isModeratingContext } = useDChatInitialQuery({
    initialQuery,
    selectedModel,
    selectedMode,
    chunks,
    messages,
    sendQuery,
    onClearInitialQuery,
    setInput,
    setCurrentSourceMessageId,
  });

  // Prompt engineer tool
  const handlePromptEngineerTool = useCallback((_tool: PromptEngineerTool, instruction: string) => {
    if (!input.trim() || !selectedModel || streaming) return;
    const fullMessage = `${instruction}\n\n"${input.trim()}"`;
    const sourceId = currentSourceMessageId;
    setInput('');
    setCurrentSourceMessageId(null);
    sendQuery(fullMessage, 'promptengineer', selectedModel, sourceId, true, memoryContext);
  }, [input, selectedModel, streaming, currentSourceMessageId, memoryContext, sendQuery]);

  // Update model when available models change
  useEffect(() => {
    if (availableModels.length > 0 && !availableModels.find(m => m.id === selectedModel)) {
      setSelectedModel(availableModels[0].id);
    }
  }, [availableModels, selectedModel]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedModel || streaming) return;
    const messageContent = input.trim();
    const sourceId = currentSourceMessageId;
    setInput('');
    setCurrentSourceMessageId(null);
    await sendQuery(messageContent, selectedMode, selectedModel, sourceId, false, memoryContext);
  };

  const handleQuickAction = (mode: ConsultantMode) => {
    if (isCollapsed) onExpand();
    setSelectedMode(mode);
  };

  // Collapsed view
  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 gap-3 bg-sidebar border-l border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onExpand} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{t('dchat.expand')}</TooltipContent>
        </Tooltip>
        <div className="h-px w-6 bg-border" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onExpand} className="text-hydra-consultant hover:text-hydra-consultant/80">
              <Lightbulb className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{t('dchat.title')}</TooltipContent>
        </Tooltip>
        <div className="h-px w-6 bg-border my-1" />
        {MODES.map(mode => (
          <Tooltip key={mode.id}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleQuickAction(mode.id)} className={cn('hover:bg-accent', mode.color)}>
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
        <div className="grid grid-cols-7 gap-1">
          {MODES.map(mode => (
            <Tooltip key={mode.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedMode === mode.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedMode(mode.id)}
                  className={cn('h-8 px-2', selectedMode === mode.id && mode.color)}
                >
                  <mode.icon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t(mode.labelKey)}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Prompt Engineer Tools */}
      {selectedMode === 'promptengineer' && (
        <PromptEngineerTools
          onSelectTool={handlePromptEngineerTool}
          disabled={streaming}
          isLoading={streaming}
          hasInput={!!input.trim()}
        />
      )}

      {/* Model selector (extracted component) */}
      <DChatModelSelector
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        availableModels={availableModels}
      />

      {/* Messages area */}
      <ScrollArea className="flex-1 p-3 hydra-scrollbar">
        <div className="space-y-3">
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
            messages.map(message => (
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
                onCopyToMainChat={onCopyToMainChat ? (c, s, m) => onCopyToMainChat(c, s, m, message.mode) : undefined}
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
          <Button variant="ghost" size="icon" className="h-4 w-4 ml-auto" onClick={() => setCurrentSourceMessageId(null)}>
            <ChevronLeft className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border bg-card/50 shrink-0">
        {inputCollapsed ? (
          <div className="flex items-center gap-2 px-3 py-3 h-14">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={toggleInputCollapse}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('dchat.expandInput')}</TooltipContent>
            </Tooltip>
            <button
              onClick={toggleInputCollapse}
              className="flex-1 text-left text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted/50"
            >
              {t('dchat.clickToType')}
            </button>
            <Button onClick={handleSend} disabled={streaming || !input.trim() || !selectedModel} size="icon" className="h-9 w-9 shrink-0 hydra-glow-sm">
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <div className="px-3 py-3">
            <HorizontalResizeHandle onResizeStart={handleResizeStart} className="mb-1" />
            <div className="flex gap-2 items-end">
              <div className="flex flex-col gap-1 shrink-0 self-start">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleInputCollapse}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('dchat.collapseInput')}</TooltipContent>
                </Tooltip>
                <SupervisorWishesPicker selectedWishes={selectedWishes} onWishesChange={setSelectedWishes} activeRoles={activeRoles} />
              </div>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t('dchat.placeholder')}
                style={{ height: inputHeight }}
                className="resize-none text-sm"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={streaming}
              />
              <Button onClick={handleSend} disabled={streaming || !input.trim() || !selectedModel} size="icon" className="self-end shrink-0 hydra-glow-sm">
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
