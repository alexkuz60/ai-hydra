import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoopNodeProps {
  data: {
    label?: string;
    loopVariable?: string;
    maxIterations?: number;
  };
  selected?: boolean;
}

export const LoopNode = memo(({ data, selected }: LoopNodeProps) => {
  return (
    <div className={cn(
      "px-4 py-3 min-w-[160px] rounded-xl border-2 transition-all",
      "bg-hydra-moderator/10 border-hydra-moderator",
      selected && "ring-2 ring-hydra-moderator ring-offset-2 ring-offset-background"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-hydra-moderator !border-2 !border-background"
      />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-full bg-hydra-moderator/20">
          <Repeat className="h-4 w-4 text-hydra-moderator" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{data.label || 'Цикл'}</div>
          {data.maxIterations && (
            <div className="text-xs text-muted-foreground truncate">
              max: {data.maxIterations}
            </div>
          )}
        </div>
      </div>
      {/* Loop back handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="loop-back"
        className="!w-3 !h-3 !bg-hydra-moderator/50 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="loop-exit"
        className="!w-3 !h-3 !bg-hydra-moderator !border-2 !border-background"
      />
    </div>
  );
});

LoopNode.displayName = 'LoopNode';
