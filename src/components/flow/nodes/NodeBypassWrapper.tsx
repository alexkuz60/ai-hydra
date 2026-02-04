import React from 'react';
import { SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodeBypassWrapperProps {
  bypassed?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper component that adds visual bypass indication to flow nodes.
 * When bypassed, the node appears faded with a skip indicator.
 */
export function NodeBypassWrapper({ 
  bypassed, 
  children, 
  className 
}: NodeBypassWrapperProps) {
  if (!bypassed) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Bypass overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Diagonal stripes pattern */}
        <div 
          className="absolute inset-0 rounded-lg opacity-20"
          style={{
            background: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              hsl(var(--muted-foreground) / 0.3) 4px,
              hsl(var(--muted-foreground) / 0.3) 8px
            )`,
          }}
        />
      </div>
      
      {/* Skip indicator badge */}
      <div className="absolute -top-2 -right-2 z-20">
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground text-[10px] font-medium shadow-sm">
          <SkipForward className="h-3 w-3" />
          <span>BYPASS</span>
        </div>
      </div>
      
      {/* Faded content */}
      <div className="opacity-50 grayscale pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
