import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getRatingsText } from './i18n';

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
          <DialogTitle>{getRatingsText('finishContestTitle', isRu)}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {getRatingsText('finishContestDesc', isRu)}
        </p>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {getRatingsText('cancel', isRu)}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {getRatingsText('finish', isRu)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
