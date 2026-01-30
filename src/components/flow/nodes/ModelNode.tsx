import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelNodeProps {
  data: {
    label?: string;
    modelName?: string;
    temperature?: number;
    maxTokens?: number;
  };
  selected?: boolean;
}

export const ModelNode = memo(({ data, selected }: ModelNodeProps) => {
  return (
    <div className={cn(
      "px-4 py-3 min-w-[160px] rounded-lg border-2 transition-all",
      "bg-hydra-success/10 border-hydra-success",
      selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-hydra-success !border-2 !border-background"
      />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-hydra-success/20">
          <Brain className="h-4 w-4 text-hydra-success" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{data.label || 'AI Модель'}</div>
          {data.modelName && (
            <div className="text-xs text-muted-foreground truncate">{data.modelName}</div>
          )}
          {data.temperature !== undefined && (
            <div className="text-[10px] text-muted-foreground">
              T: {data.temperature} | Tokens: {data.maxTokens || 2048}
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
  );
});

ModelNode.displayName = 'ModelNode';
