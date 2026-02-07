import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { StreamingMessage } from '@/components/warroom/StreamingMessage';
import { SupervisorWishesPicker } from '@/components/warroom/SupervisorWishesPicker';
import { HorizontalResizeHandle } from '@/components/ui/horizontal-resize-handle';
import { ModelOption } from '@/hooks/useAvailableModels';
import { useStreamingChat, ConsultantMode } from '@/hooks/useStreamingChat';
import { useSessionMemory } from '@/hooks/useSessionMemory';
import { cn } from '@/lib/utils';
import { PromptEngineerTools, PromptEngineerTool } from './PromptEngineerTools';
import type { AgentRole } from '@/config/roles';
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
  ChevronUp,
  ChevronDown,
  Trash2,
  Users,
  Wand2,
  Sparkles,
  Swords,
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
  onCopyToMainChat?: (content: string, sourceMessageId: string | null, modelName?: string | null, role?: string | null) => void;
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
  { id: 'promptengineer', icon: Wand2, labelKey: 'dchat.promptEngineer', color: 'text-hydra-promptengineer' },
  { id: 'duel', icon: Swords, labelKey: 'dchat.duel', color: 'text-hydra-critical' },
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
  const [selectedWishes, setSelectedWishes] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<typeof messages>([]);

  const { messages, streaming, sendQuery, stopStreaming, clearMessages } = useStreamingChat({
    sessionId,
  });
  
  // Keep ref in sync for async access
  messagesRef.current = messages;

  // Memory integration
  const { 
    chunks, 
   } = useSessionMemory(sessionId);

   // Load supervisor wishes from localStorage on session change
   useEffect(() => {
     if (!sessionId) return;
     
     try {
       const key = `hydra-supervisor-wishes-${sessionId}`;
       const saved = localStorage.getItem(key);
       if (saved) {
         const wishes = JSON.parse(saved);
         if (Array.isArray(wishes)) {
           setSelectedWishes(wishes);
         }
       }
     } catch (error) {
       console.error('Failed to load supervisor wishes from localStorage:', error);
     }
   }, [sessionId]);

   // Save supervisor wishes to localStorage when they change
   useEffect(() => {
     if (!sessionId) return;
     
     try {
       const key = `hydra-supervisor-wishes-${sessionId}`;
       localStorage.setItem(key, JSON.stringify(selectedWishes));
     } catch (error) {
       console.error('Failed to save supervisor wishes to localStorage:', error);
     }
   }, [selectedWishes, sessionId]);
   const [inputCollapsed, setInputCollapsed] = useState(false);
   const [inputHeight, setInputHeight] = useState(60);
   const isResizing = useRef(false);
   const textareaRef = useRef<HTMLTextAreaElement>(null);
   
   // Derive active roles from selected mode
   const activeRoles = useMemo((): AgentRole[] => {
     // Map consultant mode to agent roles
     const modeToRole: Record<ConsultantMode, AgentRole> = {
       'web_search': 'webhunter',
       'expert': 'assistant',
       'critic': 'critic',
       'arbiter': 'arbiter',
       'moderator': 'moderator',
       'promptengineer': 'promptengineer',
       'duel': 'arbiter', // Duel mode placeholder
     };
     return [modeToRole[selectedMode]];
   }, [selectedMode]);
   
   // Handle prompt engineer tool selection
   const handlePromptEngineerTool = useCallback((tool: PromptEngineerTool, instruction: string) => {
     if (!input.trim() || !selectedModel || streaming) return;
     
     const fullMessage = `${instruction}\n\n"${input.trim()}"`;
     const sourceId = currentSourceMessageId;
     setInput('');
     setCurrentSourceMessageId(null);
     
     // Prepare memory context
     const memoryContext = chunks.map(chunk => ({
       content: chunk.content,
       chunk_type: chunk.chunk_type,
       metadata: chunk.metadata as Record<string, unknown> | undefined,
     }));
     
     sendQuery(fullMessage, 'promptengineer', selectedModel, sourceId, true, memoryContext);
   }, [input, selectedModel, streaming, currentSourceMessageId, chunks, sendQuery]);
   
   // Load saved input height
   useEffect(() => {
     try {
       const saved = localStorage.getItem('hydra-dchat-input-height');
       if (saved) {
         const h = parseInt(saved, 10);
         if (!isNaN(h) && h >= 40 && h <= 200) {
           setInputHeight(h);
         }
       }
       const collapsedSaved = localStorage.getItem('hydra-dchat-input-collapsed');
       if (collapsedSaved) {
         setInputCollapsed(collapsedSaved === 'true');
       }
     } catch { /* ignore */ }
   }, []);
 
   // Handle resize drag
   const handleResizeStart = useCallback((e: React.MouseEvent) => {
     e.preventDefault();
     isResizing.current = true;
     const startY = e.clientY;
     const startHeight = inputHeight;
 
     const handleMouseMove = (moveEvent: MouseEvent) => {
       if (!isResizing.current) return;
       const delta = startY - moveEvent.clientY;
       const newHeight = Math.max(40, Math.min(200, startHeight + delta));
       setInputHeight(newHeight);
     };
 
     const handleMouseUp = () => {
       isResizing.current = false;
       document.removeEventListener('mousemove', handleMouseMove);
       document.removeEventListener('mouseup', handleMouseUp);
       try {
         localStorage.setItem('hydra-dchat-input-height', String(inputHeight));
       } catch { /* ignore */ }
     };
 
     document.addEventListener('mousemove', handleMouseMove);
     document.addEventListener('mouseup', handleMouseUp);
   }, [inputHeight]);
 
   // Toggle input collapse
   const toggleInputCollapse = useCallback(() => {
     setInputCollapsed(prev => {
       const next = !prev;
       try {
         localStorage.setItem('hydra-dchat-input-collapsed', String(next));
       } catch { /* ignore */ }
       return next;
     });
   }, []);
 
   // Focus textarea when expanding
   useEffect(() => {
     if (!inputCollapsed && textareaRef.current) {
       textareaRef.current.focus();
     }
   }, [inputCollapsed]);

  // Handle initial query from navigator - auto-trigger moderator if multiple AI responses
  // Then chain to the selected mode (e.g., Arbiter) if different from moderator
  useEffect(() => {
    if (!initialQuery || !selectedModel) return;
    
    // Prepare memory context for the request
    const memoryContext = chunks.map(chunk => ({
      content: chunk.content,
      chunk_type: chunk.chunk_type,
      metadata: chunk.metadata as Record<string, unknown> | undefined,
    }));
    
    // Check if we have AI responses (sourceMessages > 1 means supervisor + AI responses)
    if (initialQuery.sourceMessages && initialQuery.sourceMessages.length > 1) {
      // Has AI responses - auto-trigger moderator first (hide user message with aggregated text)
      setIsModeratingContext(true);
      
      const targetMode = selectedMode; // Capture current mode before async
      
      sendQuery(
        initialQuery.content,
        'moderator',
        selectedModel,
        initialQuery.messageId,
        true, // hideUserMessage - don't show aggregated text in D-chat
        memoryContext // Pass memory context
      ).then(() => {
        setIsModeratingContext(false);
        
        // If user selected a mode other than moderator, auto-forward moderator's summary
        if (targetMode !== 'moderator' && targetMode !== 'expert' && targetMode !== 'web_search') {
          // Get the last moderator response content
          // We need a small delay to let the streaming state settle
          setTimeout(() => {
            const moderatorResponse = messagesRef.current.filter(m => m.role === 'consultant' && m.mode === 'moderator').pop();
            if (moderatorResponse?.content) {
              sendQuery(
                moderatorResponse.content,
                targetMode,
                selectedModel,
                initialQuery.messageId,
                true, // hide the forwarded moderator text
                memoryContext
              );
            }
          }, 200);
        }
      }).finally(() => {
        onClearInitialQuery?.();
      });
    } else {
      // Only supervisor message - just set input for manual query
      setInput(initialQuery.content);
      setCurrentSourceMessageId(initialQuery.messageId);
      onClearInitialQuery?.();
    }
  }, [initialQuery, selectedModel, sendQuery, onClearInitialQuery, chunks]);

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
    
    // Prepare memory context for the request
    const memoryContext = chunks.map(chunk => ({
      content: chunk.content,
      chunk_type: chunk.chunk_type,
      metadata: chunk.metadata as Record<string, unknown> | undefined,
    }));
    
    await sendQuery(messageContent, selectedMode, selectedModel, sourceId, false, memoryContext);
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

       {/* Prompt Engineer Tools - show only when mode is promptengineer */}
       {selectedMode === 'promptengineer' && (
         <PromptEngineerTools
           onSelectTool={handlePromptEngineerTool}
           disabled={streaming}
           isLoading={streaming}
           hasInput={!!input.trim()}
         />
       )}
 
      {/* Model selector */}
      <div className="p-2 border-b border-border">
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="h-8 text-xs min-w-0 [&>span]:!flex [&>span]:items-center [&>span]:gap-1.5 [&>span]:min-w-0 [&>span]:overflow-hidden">
            {(() => {
              const sel = availableModels.find(m => m.id === selectedModel);
              if (!sel) return <SelectValue placeholder={t('dchat.selectModel')} />;
              const Logo = PROVIDER_LOGOS[sel.provider];
              const color = PROVIDER_COLORS[sel.provider] || 'text-muted-foreground';
              return (
                <span className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                  {Logo && <Logo className={cn('h-3.5 w-3.5 shrink-0', color)} />}
                  <span className="truncate whitespace-nowrap">{sel.name}</span>
                </span>
              );
            })()}
          </SelectTrigger>
          <SelectContent>
            {(() => {
              const PROVIDER_LABELS: Record<string, string> = {
                lovable: 'Lovable AI',
                openai: 'OpenAI',
                anthropic: 'Anthropic',
                gemini: 'Google Gemini',
                xai: 'xAI (Grok)',
                openrouter: 'OpenRouter (Free)',
                groq: 'Groq (Fast)',
                deepseek: 'DeepSeek',
              };
              const ORDER = ['lovable', 'openai', 'anthropic', 'gemini', 'xai', 'groq', 'deepseek', 'openrouter'];
              const grouped = new Map<string, typeof availableModels>();
              availableModels.forEach(m => {
                const list = grouped.get(m.provider) || [];
                list.push(m);
                grouped.set(m.provider, list);
              });
              return ORDER.filter(p => grouped.has(p)).map(provider => {
                const models = grouped.get(provider)!;
                const Logo = PROVIDER_LOGOS[provider];
                const color = PROVIDER_COLORS[provider] || 'text-muted-foreground';
                return (
                  <SelectGroup key={provider}>
                    <SelectLabel className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-sm mx-1 px-2 py-1">
                      {Logo && <Logo className={cn('h-3.5 w-3.5', color)} />}
                      {PROVIDER_LABELS[provider] || provider}
                    </SelectLabel>
                    {models.map(model => (
                      <SelectItem key={model.id} value={model.id} className="text-xs">
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              });
            })()}
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
      <div className="border-t border-border bg-card/50 shrink-0">
         {inputCollapsed ? (
           <div className="flex items-center gap-2 px-3 py-3 h-14">
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant="ghost"
                   size="icon"
                   className="h-8 w-8 shrink-0"
                   onClick={toggleInputCollapse}
                 >
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
             <Button
               onClick={handleSend}
               disabled={streaming || !input.trim() || !selectedModel}
               size="icon"
               className="h-9 w-9 shrink-0 hydra-glow-sm"
             >
               {streaming ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
               ) : (
                 <Send className="h-4 w-4" />
               )}
             </Button>
           </div>
         ) : (
           <div className="px-3 py-3">
              {/* Resize handle */}
              <HorizontalResizeHandle onResizeStart={handleResizeStart} className="mb-1" />
             
              <div className="flex gap-2 items-end">
                {/* Left toolbar */}
                <div className="flex flex-col gap-1 shrink-0 self-start">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={toggleInputCollapse}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('dchat.collapseInput')}</TooltipContent>
                  </Tooltip>
                  
                  {/* Supervisor Wishes Picker */}
                  <SupervisorWishesPicker
                    selectedWishes={selectedWishes}
                    onWishesChange={setSelectedWishes}
                    activeRoles={activeRoles}
                  />
                </div>
                
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('dchat.placeholder')}
                  style={{ height: inputHeight }}
                  className="resize-none text-sm"
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
                   className="self-end shrink-0 hydra-glow-sm"
                 >
                   {streaming ? (
                     <Loader2 className="h-4 w-4 animate-spin" />
                   ) : (
                     <Send className="h-4 w-4" />
                   )}
                 </Button>
              </div>
           </div>
         )}
      </div>
    </div>
  );
}
