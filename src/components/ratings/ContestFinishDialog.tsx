import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ContestFinishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isRu: boolean;
}

export function ContestFinishDialog({ open, onOpenChange, onConfirm, isRu }: ContestFinishDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isRu ? 'Завершить конкурс?' : 'Finish contest?'}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {isRu
            ? 'Все текущие раунды будут завершены. Это действие нельзя отменить.'
            : 'All current rounds will be completed. This action cannot be undone.'}
        </p>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {isRu ? 'Завершить' : 'Finish'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
