import React, { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Crown, ChevronDown, ChevronRight, ArrowRight, ArrowLeft,
  MessageSquare, Star, GitBranch,
} from 'lucide-react';
import type { Message, MessageGraphNode, MessageLink } from '@/types/messages';
import { getRoleConfig } from '@/config/roles';
import { ModelNameWithIcon } from '@/components/ui/ModelNameWithIcon';

// ==================== Types ====================

interface RequestGroup {
  id: string;
  userMessage: Message;
  nodes: MessageGraphNode[];
  crossChatLinks: MessageLink[];
  bestPathScore: number | null;
  alternativePaths: Array<{ description: string; score: number }>;
}

interface GraphNavigatorProps {
  requestGroups: RequestGroup[];
  crossChatLinks: MessageLink[];
  activeParticipant: string | null;
  onMessageClick: (messageId: string) => void;
  supervisorDisplayName?: string | null;
  isMinimized?: boolean;
}

// ==================== Score Badge ====================

const ScoreBadge = memo(function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color = score >= 4 ? 'text-emerald-400' : score >= 3 ? 'text-amber-400' : 'text-red-400';
  return (
    <span className={cn('text-xs font-mono font-medium', color)}>
      ★{score.toFixed(1)}
    </span>
  );
});

// ==================== RoleBranchNode ====================

interface RoleBranchNodeProps {
  node: MessageGraphNode;
  activeParticipant: string | null;
  onMessageClick: (messageId: string) => void;
  indentLevel: number;
}

const RoleBranchNode = memo(function RoleBranchNode({
  node,
  activeParticipant,
  onMessageClick,
  indentLevel,
}: RoleBranchNodeProps) {
  const { t } = useLanguage();
  const { message, children, pathScore } = node;
  const config = getRoleConfig(message.role);
  const Icon = config.icon;
  const hasChildren = children.length > 0;
  const [isOpen, setIsOpen] = React.useState(true);

  const handleClick = useCallback(() => onMessageClick(message.id), [onMessageClick, message.id]);

  // Check for cross-chat links
  const hasCrossChatOut = node.links.some(l =>
    l.link_type === 'forward_to_dchat' && l.source_message_id === message.id
  );
  const hasCrossChatIn = node.links.some(l =>
    l.link_type === 'return_from_dchat' && l.target_message_id === message.id
  );

  return (
    <div className="relative">
      {/* Vertical connector line */}
      {indentLevel > 0 && (
        <div
          className="absolute top-0 bottom-0 border-l border-border/50"
          style={{ left: `${(indentLevel - 1) * 16 + 8}px` }}
        />
      )}

      {/* Horizontal branch line */}
      {indentLevel > 0 && (
        <div
          className="absolute top-4 border-t border-border/50"
          style={{
            left: `${(indentLevel - 1) * 16 + 8}px`,
            width: '8px',
          }}
        />
      )}

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            'flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors group/branch',
            activeParticipant === message.id && 'bg-sidebar-accent',
            'hover:bg-sidebar-accent/50',
          )}
          style={{ paddingLeft: `${indentLevel * 16 + 4}px` }}
          onClick={handleClick}
        >
          {/* Expand/collapse toggle */}
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <button
                className="p-0.5 rounded hover:bg-muted/50"
                onClick={(e) => e.stopPropagation()}
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
          ) : (
            <span className="w-4" />
          )}

          {/* Role icon */}
          <Icon className={cn('h-3.5 w-3.5 shrink-0', config.color)} />

          {/* Role label */}
          <span className="text-xs truncate flex-1 text-sidebar-foreground">
            {t(`role.${message.role}`)}
          </span>

          {/* Cross-chat indicators */}
          {hasCrossChatOut && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ArrowRight className="h-3 w-3 text-hydra-consultant shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">→ Д-чат</TooltipContent>
            </Tooltip>
          )}
          {hasCrossChatIn && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ArrowLeft className="h-3 w-3 text-primary shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">← из Д-чата</TooltipContent>
            </Tooltip>
          )}

          {/* Score */}
          <ScoreBadge score={pathScore} />

          {/* Model name (compact) */}
          <ModelNameWithIcon
            modelName={message.model_name}
            className="hidden group-hover/branch:flex text-[10px] text-muted-foreground"
            iconSize="h-2.5 w-2.5"
          />
        </div>

        {/* Children */}
        {hasChildren && (
          <CollapsibleContent>
            {children.map((child) => (
              <RoleBranchNode
                key={child.message.id}
                node={child}
                activeParticipant={activeParticipant}
                onMessageClick={onMessageClick}
                indentLevel={indentLevel + 1}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
});

// ==================== RequestGroupNode ====================

interface RequestGroupNodeProps {
  group: RequestGroup;
  index: number;
  activeParticipant: string | null;
  onMessageClick: (messageId: string) => void;
  supervisorDisplayName?: string | null;
}

const RequestGroupNode = memo(function RequestGroupNode({
  group,
  index,
  activeParticipant,
  onMessageClick,
  supervisorDisplayName,
}: RequestGroupNodeProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(true);
  const handleUserClick = useCallback(() => onMessageClick(group.userMessage.id), [onMessageClick, group.userMessage.id]);

  const hasCrossChat = group.crossChatLinks.length > 0;
  const preview = group.userMessage.content.slice(0, 40) + (group.userMessage.content.length > 40 ? '…' : '');

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-1">
      {/* Request header */}
      <div
        className={cn(
          'flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer transition-colors',
          'bg-hydra-supervisor/8 hover:bg-hydra-supervisor/15',
          activeParticipant === group.userMessage.id && 'bg-hydra-supervisor/20',
        )}
        onClick={handleUserClick}
      >
        <CollapsibleTrigger asChild>
          <button
            className="p-0.5 rounded hover:bg-muted/50"
            onClick={(e) => e.stopPropagation()}
          >
            {isOpen ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <Crown className="h-3.5 w-3.5 text-hydra-supervisor shrink-0" />

        <span className="text-xs font-medium text-sidebar-foreground truncate flex-1">
          {supervisorDisplayName || t('role.supervisor')} #{index}
        </span>

        {/* Response count */}
        {group.nodes.length > 0 && (
          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
            {group.nodes.length}
          </Badge>
        )}

        {/* Cross-chat indicator */}
        {hasCrossChat && (
          <Tooltip>
            <TooltipTrigger asChild>
              <GitBranch className="h-3 w-3 text-hydra-consultant shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {group.crossChatLinks.length} кросс-чат связей
            </TooltipContent>
          </Tooltip>
        )}

        {/* Best path score */}
        <ScoreBadge score={group.bestPathScore} />
      </div>

      {/* Preview (when collapsed) */}
      {!isOpen && (
        <p className="text-[10px] text-muted-foreground truncate px-6 pb-0.5 italic">
          "{preview}"
        </p>
      )}

      {/* Response tree */}
      <CollapsibleContent>
        <div className="ml-2 border-l border-border/30 pl-1">
          {group.nodes.length > 0 ? (
            group.nodes.map((node) => (
              <RoleBranchNode
                key={node.message.id}
                node={node}
                activeParticipant={activeParticipant}
                onMessageClick={onMessageClick}
                indentLevel={1}
              />
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground px-4 py-1 italic">
              "{preview}"
            </p>
          )}

          {/* Cross-chat summary */}
          {hasCrossChat && (
            <div className="mt-1 mx-2 px-2 py-1 rounded bg-hydra-consultant/5 border border-hydra-consultant/20">
              <div className="flex items-center gap-1 text-[10px] text-hydra-consultant">
                <GitBranch className="h-2.5 w-2.5" />
                <span className="font-medium">Д-чат</span>
              </div>
              {group.crossChatLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                  {link.link_type === 'forward_to_dchat' ? (
                    <>
                      <ArrowRight className="h-2.5 w-2.5 text-hydra-consultant" />
                      <span>→ Отправлено</span>
                    </>
                  ) : (
                    <>
                      <ArrowLeft className="h-2.5 w-2.5 text-primary" />
                      <span>← Возврат</span>
                      {link.weight != null && <ScoreBadge score={link.weight} />}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Path comparison (when multiple scored paths exist) */}
          {group.bestPathScore !== null && group.alternativePaths.length > 0 && (
            <div className="mt-1 mx-2 px-2 py-1 rounded bg-muted/30 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-2.5 w-2.5 text-amber-400" />
                <span>Лучший: ★{group.bestPathScore.toFixed(1)}</span>
              </div>
              {group.alternativePaths.map((alt, i) => (
                <div key={i} className="ml-4">
                  Альт. {i + 1}: ★{alt.score.toFixed(1)}
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

// ==================== GraphNavigator (main) ====================

export const GraphNavigator = memo(function GraphNavigator({
  requestGroups,
  crossChatLinks,
  activeParticipant,
  onMessageClick,
  supervisorDisplayName,
  isMinimized,
}: GraphNavigatorProps) {
  const { t } = useLanguage();

  if (requestGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center space-y-2">
          <GitBranch className="h-8 w-8 mx-auto text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">
            Граф решений пуст
          </p>
        </div>
      </div>
    );
  }

  // Minimized mode — just request count icons
  if (isMinimized) {
    return (
      <TooltipProvider delayDuration={200}>
        <ScrollArea className="flex-1">
          <div className="p-1 space-y-1">
            {requestGroups.map((group, i) => (
              <Tooltip key={group.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors',
                      activeParticipant === group.userMessage.id
                        ? 'bg-hydra-supervisor/20'
                        : 'hover:bg-muted/30',
                    )}
                    onClick={() => onMessageClick(group.userMessage.id)}
                  >
                    <div className="relative">
                      <MessageSquare className="h-4 w-4 text-hydra-supervisor" />
                      {group.nodes.length > 0 && (
                        <span className="absolute -top-1 -right-2 text-[8px] font-bold text-primary">
                          {group.nodes.length}
                        </span>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[240px]">
                  <div className="space-y-1">
                    <span className="text-xs font-medium">
                      Запрос #{i + 1} • {group.nodes.length} ответов
                    </span>
                    <ScoreBadge score={group.bestPathScore} />
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </ScrollArea>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {requestGroups.map((group, i) => (
            <RequestGroupNode
              key={group.id}
              group={group}
              index={i + 1}
              activeParticipant={activeParticipant}
              onMessageClick={onMessageClick}
              supervisorDisplayName={supervisorDisplayName}
            />
          ))}
        </div>
      </ScrollArea>
    </TooltipProvider>
  );
});
