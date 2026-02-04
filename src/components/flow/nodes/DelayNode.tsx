import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeBypassWrapper } from './NodeBypassWrapper';

interface DelayNodeProps {
  data: {
    label?: string;
    delayMs?: number;
    bypassed?: boolean;
  };
  selected?: boolean;
}

export const DelayNode = memo(({ data, selected }: DelayNodeProps) => {
  const formatDelay = (ms?: number) => {
    if (!ms) return '';
    if (ms >= 1000) return `${ms / 1000}s`;
    return `${ms}ms`;
  };

  return (
    <NodeBypassWrapper bypassed={data.bypassed}>
      <div className={cn(
        "px-4 py-3 min-w-[140px] rounded-lg border-2 transition-all",
        "bg-muted/50 border-muted-foreground/30",
        selected && "ring-2 ring-muted-foreground ring-offset-2 ring-offset-background"
      )}>
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-muted">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{data.label || 'Задержка'}</div>
            {data.delayMs && (
              <div className="text-xs text-muted-foreground truncate">
                {formatDelay(data.delayMs)}
              </div>
            )}
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      </div>
    </NodeBypassWrapper>
  );
});

DelayNode.displayName = 'DelayNode';
