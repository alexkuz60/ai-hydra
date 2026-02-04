import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Check, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FlowCheckpointDialogProps {
  open: boolean;
  nodeId: string;
  message: string;
  onApprove: (userInput?: string) => void;
  onReject: () => void;
}

export function FlowCheckpointDialog({
  open,
  nodeId,
  message,
  onApprove,
  onReject,
}: FlowCheckpointDialogProps) {
  const { t } = useLanguage();
  const [userInput, setUserInput] = useState('');

  const handleApprove = () => {
    onApprove(userInput.trim() || undefined);
    setUserInput('');
  };

  const handleReject = () => {
    onReject();
    setUserInput('');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t('flowEditor.checkpoint')}
          </DialogTitle>
          <DialogDescription>
            {t('flowEditor.checkpointDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Checkpoint message */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm">{message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Node: {nodeId}
            </p>
          </div>

          {/* Optional user input */}
          <div className="space-y-2">
            <Label htmlFor="checkpoint-input">
              {t('flowEditor.checkpointInput')}
            </Label>
            <Textarea
              id="checkpoint-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={t('flowEditor.checkpointInputPlaceholder')}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReject}>
            <X className="h-4 w-4 mr-2" />
            {t('flowEditor.reject')}
          </Button>
          <Button onClick={handleApprove}>
            <Check className="h-4 w-4 mr-2" />
            {t('flowEditor.approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
