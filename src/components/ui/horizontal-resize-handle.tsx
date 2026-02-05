import * as React from 'react';
import { cn } from '@/lib/utils';

interface HorizontalResizeHandleProps {
  onResizeStart: (e: React.MouseEvent) => void;
  className?: string;
}

export function HorizontalResizeHandle({ 
  onResizeStart, 
  className 
}: HorizontalResizeHandleProps) {
  return (
    <div
      onMouseDown={onResizeStart}
      className={cn(
        "h-1.5 w-full cursor-ns-resize flex items-center justify-center",
        "group relative transition-colors",
        "hover:bg-primary/10",
        className
      )}
    >
      {/* Visible handle bar */}
      <div className={cn(
        "h-1 w-16 rounded-full",
        "bg-border/60",
        "group-hover:bg-primary/50",
        "transition-all duration-200",
        "group-hover:h-1.5 group-hover:w-20"
      )} />
      
      {/* Extended hit area (invisible) */}
      <div className="absolute inset-x-0 -top-1 -bottom-1" />
    </div>
  );
}
