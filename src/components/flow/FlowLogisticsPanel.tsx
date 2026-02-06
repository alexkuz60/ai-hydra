import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { useFlowLogistics, type LogisticsMessage } from '@/hooks/useFlowLogistics';
import { serializeFlowDiagram } from '@/lib/flowDiagramContext';
import { ROLE_CONFIG } from '@/config/roles';
import { cn } from '@/lib/utils';
import {
  Send,
  Loader2,
  Trash2,
  X,
  Square,
  Route,
  User,
} from 'lucide-react';

interface FlowLogisticsPanelProps {
  nodes: Node[];
  edges: Edge[];
  diagramName: string;
  selectedNodeId: string | null;
  onClose: () => void;
  /** Optional initial question to send on open */
  initialQuestion?: string;
}

function LogisticsMessageBubble({
  message,
  onStop,
}: {
  message: LogisticsMessage;
  onStop?: () => void;
}) {
  const isUser = message.role === 'user';
  const roleConfig = ROLE_CONFIG.flowregulator;

  return (
    <div
      className={cn(
        'rounded-lg p-2 text-sm',
        isUser
          ? 'bg-primary/10 border border-primary/20'
          : 'bg-muted/50 border border-border'
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5 text-xs text-muted-foreground">
        {isUser ? (
          <User className="h-3 w-3" />
        ) : (
          <Route className={cn('h-3 w-3', roleConfig.color)} />
        )}
        <span>{isUser ? 'Вы' : 'Логистик'}</span>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <MarkdownRenderer content={message.content} streaming={message.isStreaming} />
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 ml-0.5 bg-primary animate-pulse" />
        )}
      </div>

      {message.isStreaming && onStop && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
            onClick={onStop}
          >
            <Square className="h-3 w-3 mr-1 fill-current" />
            Остановить
          </Button>
        </div>
      )}
    </div>
  );
}

export function FlowLogisticsPanel({
  nodes,
  edges,
  diagramName,
  selectedNodeId,
  onClose,
  initialQuestion,
}: FlowLogisticsPanelProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialSentRef = useRef(false);
  const roleConfig = ROLE_CONFIG.flowregulator;
  const RoleIcon = roleConfig.icon;

  const { messages, streaming, sendMessage, stopStreaming, clearMessages } = useFlowLogistics();

  // Build diagram context
  const diagramContext = useMemo(
    () => serializeFlowDiagram(diagramName, nodes, edges),
    [diagramName, nodes, edges]
  );

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send initial question on mount
  useEffect(() => {
    if (initialQuestion && !initialSentRef.current) {
      initialSentRef.current = true;
      sendMessage(initialQuestion, diagramContext, selectedNodeId);
    }
  }, [initialQuestion]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg, diagramContext, selectedNodeId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-2 shrink-0">
        <RoleIcon className={cn('h-4 w-4', roleConfig.color)} />
        <span className="text-sm font-medium flex-1">{t('flowEditor.logistics.title')}</span>
        {messages.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearMessages}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('flowEditor.logistics.clear')}</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('common.close')}</TooltipContent>
        </Tooltip>
      </div>

      {/* Context indicator */}
      <div className="px-3 py-2 border-b border-border text-xs text-muted-foreground">
        <span>📊 {diagramName} • {nodes.length} {t('flowEditor.logistics.nodes')} • {edges.length} {t('flowEditor.logistics.edges')}</span>
        {selectedNodeId && (
          <span className="block mt-0.5">
            👈 {nodes.find(n => n.id === selectedNodeId)?.data?.label as string || selectedNodeId}
          </span>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 hydra-scrollbar">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <RoleIcon className={cn('h-10 w-10 mx-auto mb-3 opacity-30', roleConfig.color)} />
              <p className="font-medium mb-1">{t('flowEditor.logistics.title')}</p>
              <p className="text-xs max-w-[240px] mx-auto">{t('flowEditor.logistics.hint')}</p>
            </div>
          ) : (
            messages.map(msg => (
              <LogisticsMessageBubble
                key={msg.id}
                message={msg}
                onStop={msg.isStreaming ? stopStreaming : undefined}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('flowEditor.logistics.placeholder')}
            className="min-h-[50px] max-h-[80px] resize-none text-sm"
            onKeyDown={handleKeyDown}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            size="icon"
            className="h-[50px] w-10 shrink-0"
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
