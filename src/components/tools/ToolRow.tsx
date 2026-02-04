import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Globe, FileText, Pencil, Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { CustomTool } from '@/types/customTools';

interface ToolRowProps {
  tool: CustomTool;
  isSelected: boolean;
  isOwned: boolean;
  onSelect: (tool: CustomTool) => void;
  onEdit: (tool: CustomTool, e: React.MouseEvent) => void;
  onDelete: (tool: CustomTool, e: React.MouseEvent) => void;
}

export function ToolRow({
  tool,
  isSelected,
  isOwned,
  onSelect,
  onEdit,
  onDelete,
}: ToolRowProps) {
  const { t } = useLanguage();

  return (
    <TableRow
      className={cn(
        'cursor-pointer transition-colors group',
        isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
      )}
      onClick={() => onSelect(tool)}
    >
      <TableCell className="pl-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {tool.tool_type === 'http_api' ? (
            <Globe className="h-5 w-5 text-primary" />
          ) : (
            <FileText className="h-5 w-5 text-primary" />
          )}
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
              <Badge variant="secondary" className="text-[10px]">
                {tool.tool_type === 'http_api' ? 'HTTP' : 'Prompt'}
              </Badge>
              {tool.is_shared && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>{t('tools.shared')}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{t('tools.usageCount')}: {tool.usage_count}</span>
              <span>{format(new Date(tool.updated_at), 'dd.MM.yyyy')}</span>
            </div>
          </div>
          {isOwned && (
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => onEdit(tool, e)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.edit')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={(e) => onDelete(tool, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.delete')}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
