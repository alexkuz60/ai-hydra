import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { StreamingMessage } from '@/components/warroom/StreamingMessage';
import { ModelOption } from '@/hooks/useAvailableModels';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { ROLE_CONFIG, AGENT_ROLES, type AgentRole } from '@/config/roles';
import { cn } from '@/lib/utils';
import {
  Wrench,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';

// Technical staff roles only
type TechRole = 'archivist' | 'analyst' | 'promptengineer' | 'flowregulator';

const TECH_ROLES: TechRole[] = AGENT_ROLES.filter(
  role => ROLE_CONFIG[role].isTechnicalStaff
) as TechRole[];

interface TechSupportDialogProps {
  sessionId: string | null;
  availableModels: ModelOption[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TechSupportDialog({
  sessionId,
  availableModels,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TechSupportDialogProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<TechRole>('archivist');
  const [selectedModel, setSelectedModel] = useState<string>(
    availableModels[0]?.id || ''
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled or uncontrolled mode
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  const { messages, streaming, sendQuery, stopStreaming, clearMessages } = useStreamingChat({
    sessionId,
  });

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
    setInput('');
    
    // Use expert mode but override with specific technical role
    await sendQuery(messageContent, 'expert', selectedModel, null, false, [], selectedRole);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const roleConfig = ROLE_CONFIG[selectedRole];
  const RoleIcon = roleConfig.icon;

  return (
    <>
      {trigger && React.cloneElement(trigger as React.ReactElement, { onClick: () => onOpenChange?.(true) })}
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            {t('techSupport.title')}
          </DialogTitle>
        </DialogHeader>

        {/* Role selector */}
        <div className="p-3 border-b border-border shrink-0">
          <div className="flex flex-wrap gap-2">
            {TECH_ROLES.map((role) => {
              const config = ROLE_CONFIG[role];
              const Icon = config.icon;
              const isSelected = selectedRole === role;
              
              return (
                <TooltipProvider key={role}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isSelected ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedRole(role)}
                        className={cn(
                          'gap-2 h-8',
                          isSelected && config.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{t(config.label)}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs max-w-[200px]">{t(config.description)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Model selector */}
        <div className="p-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder={t('techSupport.selectModel')} />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="text-xs">
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {messages.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={clearMessages}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('techSupport.clear')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 p-4 hydra-scrollbar">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <RoleIcon className={cn("h-12 w-12 mx-auto mb-3 opacity-30", roleConfig.color)} />
                <p className="font-medium mb-1">{t(roleConfig.label)}</p>
                <p className="text-xs max-w-[300px] mx-auto">{t(roleConfig.description)}</p>
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
                  onStopStreaming={message.isStreaming ? stopStreaming : undefined}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('techSupport.placeholder')}
              className="min-h-[60px] max-h-[100px] resize-none text-sm"
              onKeyDown={handleKeyDown}
            />
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSend();
              }}
              disabled={!input.trim() || streaming || !selectedModel}
              size="icon"
              className={cn("h-[60px] w-10 shrink-0", roleConfig.color.replace('text-', 'bg-').replace('hydra-', 'hydra-') + '/20')}
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Current role indicator */}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <RoleIcon className={cn("h-3.5 w-3.5", roleConfig.color)} />
            <span>{t('techSupport.chatWith')} {t(roleConfig.label)}</span>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}
