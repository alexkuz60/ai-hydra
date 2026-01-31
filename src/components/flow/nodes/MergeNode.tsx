import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Combine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MergeNodeProps {
  data: {
    label?: string;
    mergeStrategy?: string;
  };
  selected?: boolean;
}

export const MergeNode = memo(({ data, selected }: MergeNodeProps) => {
  return (
    <div className={cn(
      "px-4 py-3 min-w-[160px] rounded-lg border-2 transition-all",
      "bg-hydra-advisor/10 border-hydra-advisor",
      selected && "ring-2 ring-hydra-advisor ring-offset-2 ring-offset-background"
    )}>
      {/* Multiple input handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="input-1"
        className="!w-3 !h-3 !bg-hydra-advisor !border-2 !border-background"
        style={{ left: '30%' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="input-2"
        className="!w-3 !h-3 !bg-hydra-advisor !border-2 !border-background"
        style={{ left: '70%' }}
      />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-hydra-advisor/20">
          <Combine className="h-4 w-4 text-hydra-advisor" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{data.label || 'Слияние'}</div>
          {data.mergeStrategy && (
            <div className="text-xs text-muted-foreground truncate">
              {data.mergeStrategy}
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-hydra-advisor !border-2 !border-background"
      />
    </div>
  );
});

MergeNode.displayName = 'MergeNode';
