import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeBypassWrapper } from './NodeBypassWrapper';

interface ClassifierNodeProps {
  data: {
    label?: string;
    classifierLabels?: string[];
    bypassed?: boolean;
  };
  selected?: boolean;
}

export const ClassifierNode = memo(({ data, selected }: ClassifierNodeProps) => {
  return (
    <NodeBypassWrapper bypassed={data.bypassed}>
      <div className={cn(
        "px-4 py-3 min-w-[160px] rounded-lg border-2 transition-all",
        "bg-hydra-success/10 border-hydra-success",
        selected && "ring-2 ring-hydra-success ring-offset-2 ring-offset-background"
      )}>
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-hydra-success !border-2 !border-background"
        />
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-hydra-success/20">
            <Tags className="h-4 w-4 text-hydra-success" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{data.label || 'Классификатор'}</div>
            {data.classifierLabels && data.classifierLabels.length > 0 && (
              <div className="text-xs text-muted-foreground truncate">
                {data.classifierLabels.length} меток
              </div>
            )}
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-hydra-success !border-2 !border-background"
        />
      </div>
    </NodeBypassWrapper>
  );
});

ClassifierNode.displayName = 'ClassifierNode';
