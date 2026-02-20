import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Brain, BrainCog, Loader2, AlertTriangle } from 'lucide-react';
import type { DeletionMode } from '@/hooks/useTaskDeletion';

interface TaskDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  deleting: boolean;
  onConfirm: (mode: DeletionMode) => void;
  /** If true, show bulk-delete variant */
  bulk?: boolean;
  taskCount?: number;
}

export function TaskDeleteDialog({
  open,
  onOpenChange,
  taskTitle,
  deleting,
  onConfirm,
  bulk = false,
  taskCount = 0,
}: TaskDeleteDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={deleting ? undefined : onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {bulk ? t('tasks.deleteAllTitle') : t('tasks.deleteConfirmTitle')}
          </DialogTitle>
          <DialogDescription className="space-y-2">
            {bulk ? (
              <span>
                {t('tasks.deleteAllDescription')}
              </span>
            ) : (
              <>
                <span>{t('tasks.deleteChoiceDescription')}</span>
                <span className="block mt-2 font-medium text-foreground">
                  "{taskTitle}"
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {/* Option 1: Delete + clean memory */}
          <Button
            variant="destructive"
            className="w-full justify-start gap-3 h-auto py-3"
            disabled={deleting}
            onClick={() => onConfirm('clean')}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <BrainCog className="h-4 w-4 shrink-0" />
            )}
            <div className="text-left">
              <div className="font-medium">{t('tasks.deleteCleanMemory')}</div>
              <div className="text-xs opacity-80 font-normal">
                {t('tasks.deleteCleanMemoryHint')}
              </div>
            </div>
          </Button>

          {/* Option 2: Delete + keep memory (not for bulk) */}
          {!bulk && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3 border-destructive/30 text-destructive hover:bg-destructive/10"
              disabled={deleting}
              onClick={() => onConfirm('keep')}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Brain className="h-4 w-4 shrink-0" />
              )}
              <div className="text-left">
                <div className="font-medium">{t('tasks.deleteKeepMemory')}</div>
                <div className="text-xs opacity-80 font-normal">
                  {t('tasks.deleteKeepMemoryHint')}
                </div>
              </div>
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={deleting}>
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
