import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Pencil, Copy, Lock, Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskBlueprintWithMeta } from '@/hooks/usePatterns';

interface BlueprintRowProps {
  pattern: TaskBlueprintWithMeta;
  isSelected: boolean;
  hasUnsavedChanges?: boolean;
  onSelect: (pattern: TaskBlueprintWithMeta) => void;
  onEdit: (pattern: TaskBlueprintWithMeta, e: React.MouseEvent) => void;
  onDuplicate: (pattern: TaskBlueprintWithMeta, e: React.MouseEvent) => void;
  onDelete: (pattern: TaskBlueprintWithMeta, e: React.MouseEvent) => void;
}

const categoryColors: Record<string, string> = {
  planning: 'text-blue-400',
  creative: 'text-purple-400',
  analysis: 'text-green-400',
  technical: 'text-orange-400',
};

export function BlueprintRow({
  pattern,
  isSelected,
  hasUnsavedChanges,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: BlueprintRowProps) {
  const { t } = useLanguage();

  return (
    <TableRow
      className={cn(
        'cursor-pointer transition-colors group',
        isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
      )}
      onClick={() => onSelect(pattern)}
    >
      <TableCell className="pl-8">
        <div className="w-10 h-10 rounded-lg bg-hydra-arbiter/10 flex items-center justify-center">
          <Target className="h-5 w-5 text-hydra-arbiter" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{pattern.name}</span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-hydra-warning animate-pulse-glow shrink-0" title="Unsaved changes" />
              )}
              {pattern.meta.isSystem && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>{t('patterns.systemPattern')}</TooltipContent>
                </Tooltip>
              )}
              {pattern.meta.isShared && !pattern.meta.isSystem && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>{t('patterns.publicPattern')}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs', categoryColors[pattern.category])}>
                {t(`patterns.category.${pattern.category}`)}
              </span>
              <Badge variant="outline" className="text-xs py-0">
                {t('patterns.stages')} ({pattern.stages.length})
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {pattern.meta.isSystem && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => onDuplicate(pattern, e)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('patterns.duplicateToEdit')}</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => onEdit(pattern, e)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.edit')}</TooltipContent>
            </Tooltip>
            {!pattern.meta.isSystem && pattern.meta.isOwned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={(e) => onDelete(pattern, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.delete')}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
