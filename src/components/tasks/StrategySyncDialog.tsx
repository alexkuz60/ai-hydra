/**
 * Confirmation dialog showing a diff preview before applying
 * strategy sync changes to the СПРЗ session tree.
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Plus, ArrowRight, Archive, Minus, FolderOpen, FileText, Loader2,
} from 'lucide-react';
import type { SyncPlan, SyncItem } from '@/lib/strategySyncEngine';

interface StrategySyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syncPlan: SyncPlan | null;
  onConfirm: () => void;
  applying: boolean;
}

export function StrategySyncDialog({
  open, onOpenChange, syncPlan, onConfirm, applying,
}: StrategySyncDialogProps) {
  const { language } = useLanguage();

  if (!syncPlan) return null;

  const { stats } = syncPlan;
  const hasChanges = stats.create > 0 || stats.rename > 0 || stats.archive > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {language === 'ru' ? 'Синхронизация структуры СПРЗ' : 'SPSP Structure Sync'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ru'
              ? 'Утверждённая стратегия будет применена к дереву задач. Проверьте изменения:'
              : 'The approved strategy will be applied to the task tree. Review changes:'}
          </DialogDescription>
        </DialogHeader>

        {/* Stats summary */}
        <div className="flex items-center gap-2 flex-wrap">
          {stats.create > 0 && (
            <Badge variant="outline" className="text-xs border-emerald-500/50 text-emerald-500 gap-1">
              <Plus className="h-3 w-3" />
              {language === 'ru' ? `Создать: ${stats.create}` : `Create: ${stats.create}`}
            </Badge>
          )}
          {stats.rename > 0 && (
            <Badge variant="outline" className="text-xs border-primary/50 text-primary gap-1">
              <ArrowRight className="h-3 w-3" />
              {language === 'ru' ? `Переименовать: ${stats.rename}` : `Rename: ${stats.rename}`}
            </Badge>
          )}
          {stats.archive > 0 && (
            <Badge variant="outline" className="text-xs border-destructive/50 text-destructive gap-1">
              <Archive className="h-3 w-3" />
              {language === 'ru' ? `Архивировать: ${stats.archive}` : `Archive: ${stats.archive}`}
            </Badge>
          )}
          {stats.keep > 0 && (
            <Badge variant="outline" className="text-xs border-muted-foreground/50 text-muted-foreground gap-1">
              <Minus className="h-3 w-3" />
              {language === 'ru' ? `Без изменений: ${stats.keep}` : `Unchanged: ${stats.keep}`}
            </Badge>
          )}
        </div>

        {/* Changes list */}
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-1.5 pr-2">
            {syncPlan.items.map((item, i) => (
              <SyncItemRow key={i} item={item} />
            ))}
            {syncPlan.archiveItems.map((item, i) => (
              <SyncItemRow key={`archive-${i}`} item={item} />
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={applying}>
            {language === 'ru' ? 'Отмена' : 'Cancel'}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={applying || !hasChanges}
            className="gap-1.5"
          >
            {applying && <Loader2 className="h-4 w-4 animate-spin" />}
            {applying
              ? (language === 'ru' ? 'Применение...' : 'Applying...')
              : (language === 'ru' ? 'Применить изменения' : 'Apply Changes')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SyncItemRow({ item }: { item: SyncItem }) {
  const { language } = useLanguage();
  const isPhase = item.section.depth === 0;

  const actionConfig: Record<string, { icon: React.ReactNode; cls: string; label: { ru: string; en: string } }> = {
    create: { icon: <Plus className="h-3 w-3" />, cls: 'text-emerald-500', label: { ru: 'Создать', en: 'Create' } },
    rename: { icon: <ArrowRight className="h-3 w-3" />, cls: 'text-primary', label: { ru: 'Переименовать', en: 'Rename' } },
    archive: { icon: <Archive className="h-3 w-3" />, cls: 'text-destructive', label: { ru: 'Архив', en: 'Archive' } },
    keep: { icon: <Minus className="h-3 w-3" />, cls: 'text-muted-foreground', label: { ru: '—', en: '—' } },
  };

  const cfg = actionConfig[item.action];

  return (
    <div className="space-y-0.5">
      <div className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm',
        item.action === 'archive' && 'bg-destructive/5',
        item.action === 'create' && 'bg-emerald-500/5',
        item.action === 'rename' && 'bg-primary/5',
      )}>
        {isPhase ? <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-4" />}
        
        <span className="flex-1 min-w-0 truncate">
          {item.action === 'rename' && item.existingTitle ? (
            <>
              <span className="line-through text-muted-foreground">{item.existingTitle}</span>
              <span className="mx-1.5">→</span>
              <span className="font-medium">{item.section.title}</span>
            </>
          ) : (
            <span className={cn(item.action === 'archive' && 'line-through text-muted-foreground')}>
              {item.section.title}
            </span>
          )}
        </span>

        <Badge variant="outline" className={cn('text-[10px] gap-0.5 shrink-0', cfg.cls)}>
          {cfg.icon}
          {language === 'ru' ? cfg.label.ru : cfg.label.en}
        </Badge>
      </div>

      {/* Show children diffs */}
      {item.children.filter(c => c.action !== 'keep').map((child, j) => (
        <SyncItemRow key={j} item={child} />
      ))}
    </div>
  );
}
