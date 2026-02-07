import React, { useMemo, useState, memo, useCallback, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Users, 
  Info,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  Trash2,
  Lightbulb
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROLE_CONFIG, getRoleConfig } from '@/config/roles';
import { ModelNameWithIcon } from '@/components/ui/ModelNameWithIcon';

// ==================== Types ====================

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

// Source message structure for moderator context
export interface SourceMessage {
  role: string;
  model_name: string | null;
  content: string;
}

interface ChatTreeNavProps {
  messages: Message[];
  perModelSettings: PerModelSettingsData;
  userDisplayInfo: UserDisplayInfo;
  onMessageClick: (messageId: string) => void;
  onMessageDoubleClick?: (messageId: string) => void;
  onDeleteMessageGroup?: (userMessageId: string) => void;
  onSendToDChat?: (messageId: string, aggregatedContent: string, sourceMessages: SourceMessage[]) => void;
  activeParticipant: string | null;
  filteredParticipant?: string | null;
  allCollapsed?: boolean;
  onCollapseAllToggle?: () => void;
  supervisorDisplayName?: string | null;
  isMinimized?: boolean;
}

// ==================== Constants ====================

function getModelShortName(modelId: string | null): string {
  if (!modelId) return 'Unknown';
  const parts = modelId.split('/');
  const name = parts[parts.length - 1];
  return name.toUpperCase().replace(/-/g, ' ').replace(/\./g, ' ');
}

// Get role label for moderator context
function getRoleLabelForModerator(role: string, supervisorName?: string | null): string {
  const labels: Record<string, string> = {
    user: supervisorName || 'Супервизор',
    assistant: 'Эксперт',
    critic: 'Критик',
    arbiter: 'Арбитр',
    consultant: 'Консультант',
    moderator: 'Модератор',
    advisor: 'Советник',
    archivist: 'Архивариус',
    analyst: 'Аналитик',
    webhunter: 'Web-Охотник',
  };
  return labels[role] || role;
}

// Format messages for moderator analysis
function formatForModerator(sourceMessages: SourceMessage[], supervisorName?: string | null): string {
  const sections = sourceMessages.map((msg, idx) => {
    if (msg.role === 'user') {
      const label = supervisorName ? `ЗАПРОС: ${supervisorName}` : 'ЗАПРОС СУПЕРВИЗОРА';
      return `## ${label.toUpperCase()}\n${msg.content}`;
    }
    const roleLabel = getRoleLabelForModerator(msg.role, supervisorName);
    const modelLabel = msg.model_name?.split('/').pop() || 'Unknown';
    return `## ОТВЕТ ${idx}: ${roleLabel} (${modelLabel})\n${msg.content}`;
  });
  
  return sections.join('\n\n---\n\n');
}

// ==================== Subcomponents ====================

interface TreeHeaderProps {
  allCollapsed?: boolean;
  onCollapseAllToggle?: () => void;
}

const TreeHeader = memo(function TreeHeader({ allCollapsed, onCollapseAllToggle }: TreeHeaderProps) {
  const { t } = useLanguage();
  
  return (
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
  );
});

interface FilterIndicatorProps {
  filteredParticipant: string;
  onClear: () => void;
}

const FilterIndicator = memo(function FilterIndicator({ filteredParticipant, onClear }: FilterIndicatorProps) {
  const { t } = useLanguage();
  
  if (!filteredParticipant) return null;
  
  return (
    <div className="flex items-center gap-2 p-2 mx-2 mt-2 bg-primary/10 rounded-md">
      <Filter className="h-4 w-4 text-primary" />
      <span className="text-xs flex-1">{t('chat.filtered')}</span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-5 w-5"
        onClick={onClear}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
});

interface AIResponseNodeProps {
  ai: AIResponse;
  isActive: boolean;
  isFiltered: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

const AIResponseNode = memo(function AIResponseNode({ 
  ai, 
  isActive, 
  isFiltered, 
  onClick, 
  onDoubleClick 
}: AIResponseNodeProps) {
  const Icon = ai.icon;
  
  return (
    <div
      className={cn(
        "relative flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ml-4",
        isActive && "bg-sidebar-accent",
        isFiltered && "ring-2 ring-primary",
        "hover:bg-sidebar-accent/50"
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Tree connector line */}
      <div className="absolute -left-2 top-0 bottom-0 w-px bg-border" />
      <Icon className={cn("h-4 w-4 shrink-0", ai.color)} />
      <span className="text-sm truncate text-sidebar-foreground">
        {ai.displayName}
      </span>
      <ModelNameWithIcon modelName={ai.modelName} className="flex-1 text-xs text-muted-foreground" iconSize="h-3 w-3" />
    </div>
  );
});

interface SupervisorNodeProps {
  block: DialogBlock;
  index: number;
  activeParticipant: string | null;
  filteredParticipant: string | null;
  onMessageClick: (id: string) => void;
  onMessageDoubleClick?: (id: string) => void;
  onDeleteClick: (e: React.MouseEvent, block: DialogBlock) => void;
  onSendToDChat?: (messageId: string, aggregatedContent: string, sourceMessages: SourceMessage[]) => void;
  canDelete: boolean;
  messages: Message[];
  isTreeCollapsed: boolean;
  onToggleTreeCollapse: (blockId: string) => void;
  supervisorDisplayName?: string | null;
}

const SupervisorNode = memo(function SupervisorNode({
  block,
  index,
  activeParticipant,
  filteredParticipant,
  onMessageClick,
  onMessageDoubleClick,
  onDeleteClick,
  onSendToDChat,
  canDelete,
  messages,
  isTreeCollapsed,
  onToggleTreeCollapse,
  supervisorDisplayName,
}: SupervisorNodeProps) {
  const { t } = useLanguage();
  
  const handleClick = useCallback(() => onMessageClick(block.id), [onMessageClick, block.id]);
  const handleDoubleClick = useCallback(() => onMessageDoubleClick?.(block.id), [onMessageDoubleClick, block.id]);
  const handleDelete = useCallback((e: React.MouseEvent) => onDeleteClick(e, block), [onDeleteClick, block]);
  const handleToggleTree = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleTreeCollapse(block.id);
  }, [onToggleTreeCollapse, block.id]);
  
  // Collect full context: supervisor message + all AI responses
  const handleSendToDChat = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Build source messages array with full content
    const sourceMessages: SourceMessage[] = [
      { 
        role: 'user', 
        model_name: null, 
        content: block.supervisorMessage?.content || '' 
      },
      ...block.aiResponses.map(ai => ({
        role: ai.role,
        model_name: ai.modelName,
        content: messages.find(m => m.id === ai.id)?.content || ''
      }))
    ];
    
    // Format aggregated content for moderator
    const aggregatedContent = formatForModerator(sourceMessages, supervisorDisplayName);
    
    onSendToDChat?.(block.id, aggregatedContent, sourceMessages);
  }, [onSendToDChat, block, messages, supervisorDisplayName]);
  
  const hasResponses = block.aiResponses.length > 0;
  
  return (
    <div className="space-y-0.5 group/block">
      {/* Supervisor node */}
      <Tooltip>
        <TooltipTrigger asChild>
        <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
              "bg-hydra-supervisor/10",
              activeParticipant === block.id && "bg-hydra-supervisor/20",
              filteredParticipant === block.id && "ring-2 ring-primary",
              "hover:bg-hydra-supervisor/15"
            )}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
          >
            {/* Collapse toggle for AI responses */}
            {hasResponses ? (
              <button
                onClick={handleToggleTree}
                className="p-0.5 -ml-1 rounded hover:bg-sidebar-accent/50 transition-colors"
              >
                {isTreeCollapsed ? (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
            <Crown className="h-4 w-4 text-hydra-supervisor shrink-0" />
            <span className="flex-1 text-sm truncate text-sidebar-foreground">
              {supervisorDisplayName || t('role.supervisor')} #{index}
            </span>
            {block.responseCount > 0 && isTreeCollapsed && (
              <span className="text-xs text-muted-foreground">
                +{block.responseCount}
              </span>
            )}
            {onSendToDChat && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover/block:opacity-100 transition-opacity text-hydra-consultant hover:text-hydra-consultant/80"
                    onClick={handleSendToDChat}
                  >
                    <Lightbulb className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('dchat.sendToConsultant')}</TooltipContent>
              </Tooltip>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover/block:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[280px]">
          <div className="space-y-1.5">
            <p className="text-sm italic">"{block.contentPreview}"</p>
            {block.aiResponses.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-border/50">
                {block.aiResponses.map(ai => (
                  <div key={ai.id} className="flex items-center gap-1.5">
                    <ai.icon className={cn("h-3 w-3 shrink-0", ai.color)} />
                    <span className="text-xs">{ai.displayName}:</span>
                    <ModelNameWithIcon modelName={ai.modelName} className="text-xs text-muted-foreground" iconSize="h-3 w-3" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {/* AI responses under this supervisor - collapsible */}
      {!isTreeCollapsed && block.aiResponses.map((ai) => (
        <AIResponseNode
          key={ai.id}
          ai={ai}
          isActive={activeParticipant === ai.id}
          isFiltered={filteredParticipant === ai.id}
          onClick={() => onMessageClick(ai.id)}
          onDoubleClick={() => onMessageDoubleClick?.(ai.id)}
        />
      ))}
    </div>
  );
});

interface StandaloneAINodeProps {
  block: DialogBlock;
  activeParticipant: string | null;
  filteredParticipant: string | null;
  onMessageClick: (id: string) => void;
  onMessageDoubleClick?: (id: string) => void;
}

const StandaloneAINode = memo(function StandaloneAINode({
  block,
  activeParticipant,
  filteredParticipant,
  onMessageClick,
  onMessageDoubleClick,
}: StandaloneAINodeProps) {
  const ai = block.aiResponses[0];
  
  const handleClick = useCallback(() => {
    if (ai) onMessageClick(ai.id);
  }, [onMessageClick, ai?.id]);
  
  const handleDoubleClick = useCallback(() => {
    if (ai) onMessageDoubleClick?.(ai.id);
  }, [onMessageDoubleClick, ai?.id]);

  if (!ai) return null;
  
  const Icon = ai.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
            activeParticipant === ai.id && "bg-sidebar-accent",
            filteredParticipant === ai.id && "ring-2 ring-primary",
            "hover:bg-sidebar-accent/50"
          )}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <Icon className={cn("h-4 w-4 shrink-0", ai.color)} />
          <span className="flex-1 text-sm truncate text-sidebar-foreground">
            {ai.displayName}
          </span>
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[280px]">
        <div className="space-y-1.5">
          <ModelNameWithIcon modelName={ai.modelName} className="text-xs text-muted-foreground" iconSize="h-3 w-3" />
          <p className="text-sm italic">"{block.contentPreview}"</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageCount: number;
  onConfirm: () => void;
}

const DeleteDialog = memo(function DeleteDialog({ 
  open, 
  onOpenChange, 
  messageCount, 
  onConfirm 
}: DeleteDialogProps) {
  const { t } = useLanguage();
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('messages.deleteGroupTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('messages.deleteGroupConfirm').replace('{count}', String(messageCount))}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

const EmptyState = memo(function EmptyState() {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col h-full bg-sidebar">
      <TreeHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">{t('chat.noParticipants')}</p>
      </div>
    </div>
  );
});

// ==================== Main Component ====================

export const ChatTreeNav = memo(function ChatTreeNav({
  messages,
  perModelSettings,
  onMessageClick,
  onMessageDoubleClick,
  onDeleteMessageGroup,
  onSendToDChat,
  activeParticipant,
  filteredParticipant,
  allCollapsed,
  onCollapseAllToggle,
  supervisorDisplayName,
  isMinimized,
}: ChatTreeNavProps) {
  const { t } = useLanguage();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<DialogBlock | null>(null);
  
  // Local state for tree collapse (which supervisor blocks have AI responses hidden)
  const [treeCollapsedBlocks, setTreeCollapsedBlocks] = useState<Set<string>>(new Set());

  // Sync tree collapse state with allCollapsed prop
  useEffect(() => {
    if (allCollapsed !== undefined) {
      // When allCollapsed changes, sync tree state
      setTreeCollapsedBlocks(prev => {
        if (allCollapsed && prev.size === 0) {
          // Collapse all - we'll populate this when dialogBlocks are available
          return new Set(['__all__']); // marker to collapse all
        } else if (!allCollapsed && prev.size > 0) {
          return new Set();
        }
        return prev;
      });
    }
  }, [allCollapsed]);

  // Callbacks - must be before any early returns
  const handleDeleteClick = useCallback((e: React.MouseEvent, block: DialogBlock) => {
    e.stopPropagation();
    setBlockToDelete(block);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (blockToDelete && onDeleteMessageGroup) {
      onDeleteMessageGroup(blockToDelete.id);
    }
    setDeleteDialogOpen(false);
    setBlockToDelete(null);
  }, [blockToDelete, onDeleteMessageGroup]);

  const handleClearFilter = useCallback(() => {
    onMessageDoubleClick?.('');
  }, [onMessageDoubleClick]);
  
  const toggleTreeCollapse = useCallback((blockId: string) => {
    setTreeCollapsedBlocks(prev => {
      const next = new Set(prev);
      next.delete('__all__'); // Clear the marker if present
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  }, []);
  
  const isTreeBlockCollapsed = useCallback((blockId: string) => {
    return treeCollapsedBlocks.has('__all__') || treeCollapsedBlocks.has(blockId);
  }, [treeCollapsedBlocks]);

  // Memoized dialog blocks computation
  const dialogBlocks = useMemo(() => {
    const blocks: DialogBlock[] = [];
    let currentBlock: DialogBlock | null = null;

    messages.forEach((msg) => {
      if (msg.role === 'user') {
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
        const settings = perModelSettings[msg.model_name || ''];
        const role = settings?.role || msg.role;
        const config = getRoleConfig(role);

        const aiResponse: AIResponse = {
          id: msg.id,
          modelName: msg.model_name || 'unknown',
          role: role as MessageRole,
          icon: config.icon,
          color: config.color,
          displayName: t(`role.${role}`),
        };

        if (currentBlock) {
          currentBlock.aiResponses.push(aiResponse);
          currentBlock.responseCount++;
        } else {
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

    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  }, [messages, perModelSettings, t]);

  // Memoized supervisor indices
  const supervisorIndices = useMemo(() => {
    const indices = new Map<string, number>();
    let idx = 0;
    dialogBlocks.forEach((block) => {
      if (block.type === 'supervisor-block') {
        idx++;
        indices.set(block.id, idx);
      }
    });
    return indices;
  }, [dialogBlocks]);

  if (dialogBlocks.length === 0) {
    return <EmptyState />;
  }

  // Minimized mode - icons only with tooltips
  if (isMinimized) {
    return (
      <div className="flex flex-col h-full">
        <TooltipProvider delayDuration={200}>
          <ScrollArea className="flex-1">
            <div className="p-1 space-y-1">
              {dialogBlocks.map((block) => {
                if (block.type === 'supervisor-block') {
                  return (
                    <Tooltip key={block.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                            activeParticipant === block.id ? "bg-hydra-supervisor/20" : "hover:bg-muted/30"
                          )}
                          onClick={() => onMessageClick(block.id)}
                        >
                          <Crown className="h-5 w-5 text-hydra-supervisor" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[260px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-hydra-supervisor" />
                            <span className="font-medium text-sm">#{supervisorIndices.get(block.id)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground italic">"{block.contentPreview}"</p>
                          {block.aiResponses.length > 0 && (
                            <div className="space-y-1 pt-1 border-t border-border/50">
                              {block.aiResponses.map(ai => (
                                <div key={ai.id} className="flex items-center gap-1.5">
                                  <ai.icon className={cn("h-3 w-3 shrink-0", ai.color)} />
                                  <span className="text-xs">{ai.displayName}:</span>
                                  <ModelNameWithIcon modelName={ai.modelName} className="text-xs text-muted-foreground" iconSize="h-3 w-3" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                const ai = block.aiResponses[0];
                if (!ai) return null;
                const Icon = ai.icon;
                return (
                  <Tooltip key={block.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                          activeParticipant === ai.id ? "bg-sidebar-accent" : "hover:bg-muted/30"
                        )}
                        onClick={() => onMessageClick(ai.id)}
                      >
                        <Icon className={cn("h-5 w-5", ai.color)} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[260px]">
                      <div className="space-y-1.5">
                        <span className="font-medium text-sm">{ai.displayName}</span>
                        <ModelNameWithIcon modelName={ai.modelName} className="text-xs text-muted-foreground" iconSize="h-3 w-3" />
                        <p className="text-xs text-muted-foreground italic">"{block.contentPreview}"</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </ScrollArea>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <TreeHeader 
        allCollapsed={allCollapsed} 
        onCollapseAllToggle={onCollapseAllToggle} 
      />

      {filteredParticipant && (
        <FilterIndicator 
          filteredParticipant={filteredParticipant} 
          onClear={handleClearFilter} 
        />
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {dialogBlocks.map((block) => {
            if (block.type === 'supervisor-block') {
              return (
                <SupervisorNode
                  key={block.id}
                  block={block}
                  index={supervisorIndices.get(block.id) || 0}
                  activeParticipant={activeParticipant}
                  filteredParticipant={filteredParticipant || null}
                  onMessageClick={onMessageClick}
                  onMessageDoubleClick={onMessageDoubleClick}
                  onDeleteClick={handleDeleteClick}
                  onSendToDChat={onSendToDChat}
                  canDelete={!!onDeleteMessageGroup}
                  messages={messages}
                  isTreeCollapsed={isTreeBlockCollapsed(block.id)}
                  onToggleTreeCollapse={toggleTreeCollapse}
                  supervisorDisplayName={supervisorDisplayName}
                />
              );
            } else {
              return (
                <StandaloneAINode
                  key={block.id}
                  block={block}
                  activeParticipant={activeParticipant}
                  filteredParticipant={filteredParticipant || null}
                  onMessageClick={onMessageClick}
                  onMessageDoubleClick={onMessageDoubleClick}
                />
              );
            }
          })}
        </div>
      </ScrollArea>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        messageCount={(blockToDelete?.responseCount || 0) + 1}
        onConfirm={confirmDelete}
      />
    </div>
  );
});
