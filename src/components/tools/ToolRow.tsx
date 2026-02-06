import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Globe, FileText, Pencil, Trash2, Users, Lock, Calculator, Clock, Search, Copy, Code2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { CustomTool, SystemTool } from '@/types/customTools';

type ToolItem = CustomTool | SystemTool;

function isSystemTool(tool: ToolItem): tool is SystemTool {
  return 'is_system' in tool && tool.is_system === true;
}

function getToolIcon(tool: ToolItem) {
  if (isSystemTool(tool)) {
    switch (tool.name) {
      case 'calculator': return Calculator;
      case 'current_datetime': return Clock;
      case 'web_search': return Search;
      case 'html_to_markdown': return Code2;
      case 'evaluate_response': return Star;
      default: return Lock;
    }
  }
  return tool.tool_type === 'http_api' ? Globe : FileText;
}

interface ToolRowProps {
  tool: ToolItem;
  isSelected: boolean;
  isOwned: boolean;
  onSelect: (tool: ToolItem) => void;
  onEdit?: (tool: CustomTool, e: React.MouseEvent) => void;
  onDelete?: (tool: CustomTool, e: React.MouseEvent) => void;
  onDuplicate?: (tool: CustomTool, e: React.MouseEvent) => void;
}

export function ToolRow({
  tool,
  isSelected,
  isOwned,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
}: ToolRowProps) {
  const { t } = useLanguage();
  const isSystem = isSystemTool(tool);
  const Icon = getToolIcon(tool);

  const getTypeBadge = () => {
    if (isSystem) return t('tools.systemTool');
    return tool.tool_type === 'http_api' ? 'HTTP' : 'Prompt';
  };

  return (
    <TableRow
      className={cn(
        'cursor-pointer transition-colors group',
        isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
      )}
      onClick={() => onSelect(tool)}
    >
      <TableCell className="pl-6">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          isSystem ? "bg-amber-500/10" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-5 w-5",
            isSystem ? "text-amber-500" : "text-primary"
          )} />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{tool.display_name}</span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                {tool.name}
              </code>
              <Badge 
                variant={isSystem ? "outline" : "secondary"} 
                className={cn(
                  "text-[10px]",
                  isSystem && "border-amber-500/50 text-amber-600 dark:text-amber-400"
                )}
              >
                {getTypeBadge()}
              </Badge>
              {isSystem && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>{t('tools.systemReadOnly')}</TooltipContent>
                </Tooltip>
              )}
              {!isSystem && (tool as CustomTool).is_shared && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>{t('tools.shared')}</TooltipContent>
                </Tooltip>
              )}
            </div>
            {!isSystem && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{t('tools.usageCount')}: {(tool as CustomTool).usage_count}</span>
                <span>{format(new Date((tool as CustomTool).updated_at), 'dd.MM.yyyy')}</span>
              </div>
            )}
            {isSystem && (
              <div className="text-xs text-muted-foreground line-clamp-1">
                {tool.description}
              </div>
            )}
          </div>
          {/* Action buttons */}
          {!isSystem && (
            <div className="flex items-center gap-1 shrink-0">
              {onDuplicate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => onDuplicate(tool as CustomTool, e)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('common.duplicate')}</TooltipContent>
                </Tooltip>
              )}
              {isOwned && onEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => onEdit(tool as CustomTool, e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('common.edit')}</TooltipContent>
                </Tooltip>
              )}
              {isOwned && onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={(e) => onDelete(tool as CustomTool, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('common.delete')}</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export { isSystemTool };
export type { ToolItem };
