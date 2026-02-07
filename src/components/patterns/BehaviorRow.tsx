import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, Copy, Lock, Trash2, Users } from 'lucide-react';
import { ROLE_CONFIG } from '@/config/roles';
import { cn } from '@/lib/utils';
import type { RoleBehaviorWithMeta } from '@/hooks/usePatterns';

interface BehaviorRowProps {
  pattern: RoleBehaviorWithMeta;
  isSelected: boolean;
  hasUnsavedChanges?: boolean;
  onSelect: (pattern: RoleBehaviorWithMeta) => void;
  onEdit: (pattern: RoleBehaviorWithMeta, e: React.MouseEvent) => void;
  onDuplicate: (pattern: RoleBehaviorWithMeta, e: React.MouseEvent) => void;
  onDelete: (pattern: RoleBehaviorWithMeta, e: React.MouseEvent) => void;
}

export function BehaviorRow({
  pattern,
  isSelected,
  hasUnsavedChanges,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: BehaviorRowProps) {
  const { t } = useLanguage();
  const config = ROLE_CONFIG[pattern.role];
  const IconComponent = config?.icon;

  return (
    <TableRow
      className={cn(
        'cursor-pointer transition-colors group',
        isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
      )}
      onClick={() => onSelect(pattern)}
    >
      <TableCell className="pl-8">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            `bg-${config?.color.replace('text-', '')}/10`
          )}
        >
          {IconComponent && <IconComponent className={cn('h-5 w-5', config?.color)} />}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('font-medium', config?.color)}>
                {t(config?.label || pattern.role)}
              </span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-hydra-warning animate-pulse-glow shrink-0" title="Unsaved changes" />
              )}
              {pattern.meta.isSystem && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>{t('patterns.systemPattern')}</TooltipContent>
                </Tooltip>
              )}
              {pattern.meta.isShared && !pattern.meta.isSystem && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Users className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>{t('patterns.publicPattern')}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {t(`patterns.tone.${pattern.communication.tone}`)} •{' '}
              {t(`patterns.verbosity.${pattern.communication.verbosity}`)}
            </span>
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
