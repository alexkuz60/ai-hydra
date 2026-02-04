import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Split } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeBypassWrapper } from './NodeBypassWrapper';

interface SplitNodeProps {
  data: {
    label?: string;
    splitKey?: string;
    bypassed?: boolean;
  };
  selected?: boolean;
}

export const SplitNode = memo(({ data, selected }: SplitNodeProps) => {
  return (
    <NodeBypassWrapper bypassed={data.bypassed}>
      <div className={cn(
        "px-4 py-3 min-w-[160px] rounded-lg border-2 transition-all",
        "bg-hydra-archivist/10 border-hydra-archivist",
        selected && "ring-2 ring-hydra-archivist ring-offset-2 ring-offset-background"
      )}>
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-hydra-archivist !border-2 !border-background"
        />
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-hydra-archivist/20">
            <Split className="h-4 w-4 text-hydra-archivist" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{data.label || 'Разделение'}</div>
            {data.splitKey && (
              <div className="text-xs text-muted-foreground truncate">
                {data.splitKey}
              </div>
            )}
          </div>
        </div>
        {/* Multiple output handles */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="output-1"
          className="!w-3 !h-3 !bg-hydra-archivist !border-2 !border-background"
          style={{ left: '30%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="output-2"
          className="!w-3 !h-3 !bg-hydra-archivist !border-2 !border-background"
          style={{ left: '70%' }}
        />
      </div>
    </NodeBypassWrapper>
  );
});

SplitNode.displayName = 'SplitNode';
