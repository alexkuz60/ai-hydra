import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  const [size, setSize] = useState({ width: 900, height: 600 });
  const resizing = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const onResizeStart = useCallback((e: React.MouseEvent, edge: 'right' | 'bottom' | 'corner') => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.width;
    const startH = size.height;
    resizing.current = { startX, startY, startW, startH };

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const dx = ev.clientX - resizing.current.startX;
      const dy = ev.clientY - resizing.current.startY;
      setSize({
        width: Math.max(480, Math.min(window.innerWidth * 0.95, edge === 'bottom' ? resizing.current.startW : resizing.current.startW + dx * 2)),
        height: Math.max(320, Math.min(window.innerHeight * 0.92, edge === 'right' ? resizing.current.startH : resizing.current.startH + dy)),
      });
    };
    const onUp = () => {
      resizing.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [size]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col p-0 overflow-hidden"
        style={{
          width: `${size.width}px`,
          maxWidth: '95vw',
          height: `${size.height}px`,
          maxHeight: '92vh',
        }}
      >
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

        <ScrollArea className="flex-1 min-h-0 hydra-scrollbar">
          <div className="px-6 py-4 prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer content={content} />
          </div>
        </ScrollArea>

        {/* Resize handles */}
        <div
          className="absolute right-0 top-12 bottom-4 w-1.5 cursor-ew-resize hover:bg-primary/20 transition-colors rounded-full"
          onMouseDown={e => onResizeStart(e, 'right')}
        />
        <div
          className="absolute bottom-0 left-12 right-12 h-1.5 cursor-ns-resize hover:bg-primary/20 transition-colors rounded-full"
          onMouseDown={e => onResizeStart(e, 'bottom')}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-primary/20 transition-colors rounded-bl-md"
          onMouseDown={e => onResizeStart(e, 'corner')}
        />
      </DialogContent>
    </Dialog>
  );
}
