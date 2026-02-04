import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeBypassWrapper } from './NodeBypassWrapper';

interface SwitchNodeProps {
  data: {
    label?: string;
    switchCases?: { label: string; condition: string }[];
    bypassed?: boolean;
  };
  selected?: boolean;
}

export const SwitchNode = memo(({ data, selected }: SwitchNodeProps) => {
  const casesCount = data.switchCases?.length || 3;
  
  return (
    <NodeBypassWrapper bypassed={data.bypassed}>
      <div className={cn(
        "px-4 py-3 min-w-[160px] rounded-lg border-2 transition-all",
        "bg-hydra-warning/10 border-hydra-warning",
        selected && "ring-2 ring-hydra-warning ring-offset-2 ring-offset-background"
      )}>
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-hydra-warning !border-2 !border-background"
        />
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-hydra-warning/20">
            <LayoutList className="h-4 w-4 text-hydra-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{data.label || 'Переключатель'}</div>
            <div className="text-xs text-muted-foreground">
              {casesCount} вариантов
            </div>
          </div>
        </div>
        {/* Multiple output handles for cases */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="case-1"
          className="!w-3 !h-3 !bg-hydra-warning !border-2 !border-background"
          style={{ left: '25%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="case-2"
          className="!w-3 !h-3 !bg-hydra-warning !border-2 !border-background"
          style={{ left: '50%' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="case-default"
          className="!w-3 !h-3 !bg-hydra-warning/50 !border-2 !border-background"
          style={{ left: '75%' }}
        />
      </div>
    </NodeBypassWrapper>
  );
});

SwitchNode.displayName = 'SwitchNode';
