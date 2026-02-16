import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';

interface InterviewExpandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  meta?: { tokens?: number; elapsed?: number; cost?: string };
}

export function InterviewExpandDialog({
  open, onOpenChange, title, content, meta,
}: InterviewExpandDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2 flex-wrap">
            {title}
            {meta && (
              <span className="flex items-center gap-2 ml-auto">
                {meta.tokens != null && meta.tokens > 0 && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    🪙 {meta.tokens.toLocaleString()} tok
                  </Badge>
                )}
                {meta.elapsed != null && meta.elapsed > 0 && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    ⏱ {(meta.elapsed / 1000).toFixed(1)}s
                  </Badge>
                )}
                {meta.cost && (
                  <Badge variant="outline" className="text-[10px] font-mono text-amber-500">
                    💰 {meta.cost}
                  </Badge>
                )}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer content={content} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
