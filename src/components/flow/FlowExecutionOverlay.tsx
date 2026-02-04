import React from 'react';
import { NodeStatus } from '@/hooks/useFlowRuntime';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Loader2, Pause, Clock, SkipForward } from 'lucide-react';

interface FlowExecutionOverlayProps {
  nodeId: string;
  status?: NodeStatus;
}

/**
 * Visual overlay for node execution status
 * This component is rendered as an overlay on each node during flow execution
 */
export function FlowExecutionOverlay({ nodeId, status }: FlowExecutionOverlayProps) {
  if (!status) return null;

  const stateConfig = {
    pending: {
      icon: Clock,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      ring: 'ring-muted',
      animate: false,
    },
    ready: {
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      ring: 'ring-blue-500/50',
      animate: false,
    },
    running: {
      icon: Loader2,
      color: 'text-primary',
      bg: 'bg-primary/10',
      ring: 'ring-primary',
      animate: true,
    },
    waiting_user: {
      icon: Pause,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      ring: 'ring-amber-500',
      animate: true,
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      ring: 'ring-green-500',
      animate: false,
    },
    failed: {
      icon: XCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      ring: 'ring-destructive',
      animate: false,
    },
    skipped: {
      icon: SkipForward,
      color: 'text-muted-foreground',
      bg: 'bg-muted/30',
      ring: 'ring-muted',
      animate: false,
    },
  };

  const config = stateConfig[status.state];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'absolute inset-0 rounded-lg pointer-events-none z-10',
        'ring-2 ring-inset',
        config.ring,
        config.bg
      )}
    >
      {/* Status indicator in corner */}
      <div
        className={cn(
          'absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center',
          'bg-background shadow-md border border-border'
        )}
      >
        <Icon
          className={cn(
            'w-3 h-3',
            config.color,
            config.animate && status.state === 'running' && 'animate-spin'
          )}
        />
      </div>

      {/* Progress text */}
      {status.progress && (
        <div
          className={cn(
            'absolute -bottom-6 left-1/2 -translate-x-1/2',
            'text-[10px] font-medium whitespace-nowrap',
            'bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded',
            'border border-border shadow-sm',
            config.color
          )}
        >
          {status.progress}
        </div>
      )}

      {/* Error tooltip */}
      {status.error && (
        <div
          className={cn(
            'absolute top-full left-1/2 -translate-x-1/2 mt-2',
            'text-xs bg-destructive text-destructive-foreground',
            'px-2 py-1 rounded shadow-lg max-w-48 truncate'
          )}
        >
          {status.error}
        </div>
      )}
    </div>
  );
}
