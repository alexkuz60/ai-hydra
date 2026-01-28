import React, { useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Message, MessageRole } from '@/types/messages';
import { UserDisplayInfo } from './ChatMessage';
import { PerModelSettingsData } from './PerModelSettings';
import { 
  Crown, 
  Brain, 
  Shield, 
  Scale, 
  Lightbulb, 
  Users, 
  Info,
  ChevronsUpDown,
  ChevronDown,
  Filter,
  X,
  Trash2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AIResponse {
  id: string;
  modelName: string;
  role: MessageRole;
  icon: LucideIcon;
  color: string;
  displayName: string;
}

interface DialogBlock {
  id: string;
  type: 'supervisor-block' | 'standalone-ai';
  supervisorMessage?: Message;
  contentPreview: string;
  aiResponses: AIResponse[];
  responseCount: number;
}

interface ChatTreeNavProps {
  messages: Message[];
  perModelSettings: PerModelSettingsData;
  userDisplayInfo: UserDisplayInfo;
  onMessageClick: (messageId: string) => void;
  onMessageDoubleClick?: (messageId: string) => void;
  onDeleteMessageGroup?: (userMessageId: string) => void;
  activeParticipant: string | null;
  filteredParticipant?: string | null;
  allCollapsed?: boolean;
  onCollapseAllToggle?: () => void;
}

const roleConfig: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  user: { icon: Crown, color: 'text-amber-500', label: 'supervisor' },
  assistant: { icon: Brain, color: 'text-hydra-expert', label: 'assistant' },
  critic: { icon: Shield, color: 'text-hydra-critical', label: 'critic' },
  arbiter: { icon: Scale, color: 'text-hydra-arbiter', label: 'arbiter' },
  consultant: { icon: Lightbulb, color: 'text-amber-400', label: 'consultant' },
};

function getModelShortName(modelId: string | null): string {
  if (!modelId) return 'Unknown';
  const parts = modelId.split('/');
  const name = parts[parts.length - 1];
  return name.toUpperCase().replace(/-/g, ' ').replace(/\./g, ' ');
}

export function ChatTreeNav({
  messages,
  perModelSettings,
  onMessageClick,
  onMessageDoubleClick,
  onDeleteMessageGroup,
  activeParticipant,
  filteredParticipant,
  allCollapsed,
  onCollapseAllToggle,
}: ChatTreeNavProps) {
  const { t } = useLanguage();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<DialogBlock | null>(null);

  const dialogBlocks = useMemo(() => {
    const blocks: DialogBlock[] = [];
    let currentBlock: DialogBlock | null = null;

    messages.forEach((msg) => {
      if (msg.role === 'user') {
        // Start a new supervisor block
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          id: msg.id,
          type: 'supervisor-block',
          supervisorMessage: msg,
          contentPreview: msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : ''),
          aiResponses: [],
          responseCount: 0,
        };
      } else {
        // AI response
        const settings = perModelSettings[msg.model_name || ''];
        const role = settings?.role || msg.role;
        const config = roleConfig[role] || roleConfig.assistant;

        const aiResponse: AIResponse = {
          id: msg.id,
          modelName: msg.model_name || 'unknown',
          role: role as MessageRole,
          icon: config.icon,
          color: config.color,
          displayName: `${t(`role.${role}`)} ${getModelShortName(msg.model_name)}`,
        };

        if (currentBlock) {
          // Add to current supervisor block
          currentBlock.aiResponses.push(aiResponse);
          currentBlock.responseCount++;
        } else {
          // Standalone AI message (e.g., consultant without preceding user message)
          blocks.push({
            id: msg.id,
            type: 'standalone-ai',
            contentPreview: msg.content.slice(0, 50) + '...',
            aiResponses: [aiResponse],
            responseCount: 1,
          });
        }
      }
    });

    // Push the last block
    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  }, [messages, perModelSettings, t]);

  const handleDeleteClick = (e: React.MouseEvent, block: DialogBlock) => {
    e.stopPropagation();
    setBlockToDelete(block);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (blockToDelete && onDeleteMessageGroup) {
      onDeleteMessageGroup(blockToDelete.id);
    }
    setDeleteDialogOpen(false);
    setBlockToDelete(null);
  };

  if (dialogBlocks.length === 0) {
    return (
      <div className="flex flex-col h-full bg-sidebar">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-sidebar-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('chat.participants')}
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">{t('chat.noParticipants')}</p>
        </div>
      </div>
    );
  }

  // Count supervisor blocks for numbering
  let supervisorIndex = 0;

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-sidebar-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('chat.participants')}
        </h3>
        
        {onCollapseAllToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onCollapseAllToggle}
              >
                {allCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronsUpDown className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {allCollapsed ? t('chat.expandAll') : t('chat.collapseAll')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Filter indicator */}
      {filteredParticipant && (
        <div className="flex items-center gap-2 p-2 mx-2 mt-2 bg-primary/10 rounded-md">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-xs flex-1">{t('chat.filtered')}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5"
            onClick={() => onMessageDoubleClick?.('')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {dialogBlocks.map((block) => {
            if (block.type === 'supervisor-block') {
              supervisorIndex++;
              const currentIndex = supervisorIndex;
              
              return (
                <div key={block.id} className="space-y-0.5 group/block">
                  {/* Supervisor node */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                          activeParticipant === block.id && "bg-sidebar-accent",
                          filteredParticipant === block.id && "ring-2 ring-primary",
                          "hover:bg-sidebar-accent/50"
                        )}
                        onClick={() => onMessageClick(block.id)}
                        onDoubleClick={() => onMessageDoubleClick?.(block.id)}
                      >
                        <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="flex-1 text-sm truncate text-sidebar-foreground">
                          {t('role.supervisor')} #{currentIndex}
                        </span>
                        {block.responseCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            +{block.responseCount}
                          </span>
                        )}
                        {onDeleteMessageGroup && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover/block:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDeleteClick(e, block)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-sm italic">"{block.contentPreview}"</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* AI responses under this supervisor */}
                  {block.aiResponses.map((ai) => {
                    const Icon = ai.icon;
                    return (
                      <div
                        key={ai.id}
                        className={cn(
                          "relative flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ml-4",
                          activeParticipant === ai.id && "bg-sidebar-accent",
                          filteredParticipant === ai.id && "ring-2 ring-primary",
                          "hover:bg-sidebar-accent/50"
                        )}
                        onClick={() => onMessageClick(ai.id)}
                        onDoubleClick={() => onMessageDoubleClick?.(ai.id)}
                      >
                        {/* Tree connector line */}
                        <div className="absolute -left-2 top-0 bottom-0 w-px bg-border" />

                        <Icon className={cn("h-4 w-4 shrink-0", ai.color)} />
                        <span className="flex-1 text-sm truncate text-sidebar-foreground">
                          {ai.displayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            } else {
              // Standalone AI block (consultant etc.)
              const ai = block.aiResponses[0];
              if (!ai) return null;
              const Icon = ai.icon;

              return (
                <Tooltip key={block.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                        activeParticipant === ai.id && "bg-sidebar-accent",
                        filteredParticipant === ai.id && "ring-2 ring-primary",
                        "hover:bg-sidebar-accent/50"
                      )}
                      onClick={() => onMessageClick(ai.id)}
                      onDoubleClick={() => onMessageDoubleClick?.(ai.id)}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", ai.color)} />
                      <span className="flex-1 text-sm truncate text-sidebar-foreground">
                        {ai.displayName}
                      </span>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm italic">"{block.contentPreview}"</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
          })}
        </div>
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('messages.deleteGroupTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('messages.deleteGroupConfirm').replace('{count}', String((blockToDelete?.responseCount || 0) + 1))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
