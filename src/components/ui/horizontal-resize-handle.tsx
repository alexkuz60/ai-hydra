import * as React from 'react';
import { cn } from '@/lib/utils';

interface HorizontalResizeHandleProps {
  onResizeStart: (e: React.MouseEvent) => void;
  className?: string;
  isResizing?: boolean;
  currentHeight?: number;
}

export function HorizontalResizeHandle({ 
  onResizeStart, 
  className,
  isResizing = false,
  currentHeight,
}: HorizontalResizeHandleProps) {
  return (
    <div
      onMouseDown={onResizeStart}
      className={cn(
        "h-1.5 w-full cursor-ns-resize flex items-center justify-center",
        "group relative transition-colors",
        !isResizing && "hover:bg-primary/10",
        isResizing && "bg-primary/20",
        className
      )}
    >
      {/* Visible handle bar */}
      <div className={cn(
        "h-1 w-16 rounded-full",
        isResizing ? "bg-primary/70" : "bg-border/60",
        "group-hover:bg-primary/50",
        "transition-all duration-200",
        isResizing ? "h-1.5 w-20" : "group-hover:h-1.5 group-hover:w-20"
      )} />

      {/* Height indicator during drag */}
      {isResizing && currentHeight !== undefined && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium whitespace-nowrap pointer-events-none shadow-lg">
          {currentHeight}px
        </div>
      )}
      
      {/* Extended hit area (invisible) */}
      <div className="absolute inset-x-0 -top-1 -bottom-1" />
    </div>
  );
}
