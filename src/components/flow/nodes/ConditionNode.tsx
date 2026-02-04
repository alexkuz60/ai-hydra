import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeBypassWrapper } from './NodeBypassWrapper';

interface ConditionNodeProps {
  data: {
    label?: string;
    condition?: string;
    trueLabel?: string;
    falseLabel?: string;
    bypassed?: boolean;
  };
  selected?: boolean;
}

export const ConditionNode = memo(({ data, selected }: ConditionNodeProps) => {
  return (
    <NodeBypassWrapper bypassed={data.bypassed}>
      <div className={cn(
        "px-4 py-3 min-w-[140px] rounded-lg border-2 transition-all",
        "bg-hydra-warning/10 border-hydra-warning",
        "relative",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}>
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-hydra-warning !border-2 !border-background"
        />
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-hydra-warning/20">
            <GitBranch className="h-4 w-4 text-hydra-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{data.label || 'Условие'}</div>
            {data.condition && (
              <div className="text-xs text-muted-foreground truncate">{data.condition}</div>
            )}
          </div>
        </div>
        {/* Two outputs for true/false branches */}
        <Handle
          type="source"
          position={Position.Left}
          id="false"
          className="!w-3 !h-3 !bg-destructive !border-2 !border-background"
          style={{ top: '50%' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="true"
          className="!w-3 !h-3 !bg-hydra-success !border-2 !border-background"
          style={{ top: '50%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
          className="!w-3 !h-3 !bg-hydra-warning !border-2 !border-background"
        />
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1 -mx-1">
          <span className="text-destructive">{data.falseLabel || 'Нет'}</span>
          <span className="text-hydra-success">{data.trueLabel || 'Да'}</span>
        </div>
      </div>
    </NodeBypassWrapper>
  );
});

ConditionNode.displayName = 'ConditionNode';
