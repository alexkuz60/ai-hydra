import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ArrowUpFromLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeBypassWrapper } from './NodeBypassWrapper';

interface OutputNodeProps {
  data: {
    label?: string;
    description?: string;
    outputType?: string;
    bypassed?: boolean;
  };
  selected?: boolean;
}

export const OutputNode = memo(({ data, selected }: OutputNodeProps) => {
  return (
    <NodeBypassWrapper bypassed={data.bypassed}>
      <div 
        className={cn(
          "w-[120px] h-[120px] rounded-full border-2 transition-all flex items-center justify-center",
          "border-hydra-glow",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
        style={{
          backgroundColor: 'hsl(var(--node-bg))',
          boxShadow: data.bypassed ? 'none' : '0 0 12px hsl(190 100% 55% / 0.4)',
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-hydra-glow !border-2 !border-background"
        />
        <div className="flex flex-col items-center gap-1.5">
          <div className="p-2 rounded-full bg-hydra-glow/20">
            <ArrowUpFromLine className="h-5 w-5 text-hydra-glow" />
          </div>
          <div className="text-sm font-medium text-hydra-glow">{data.label || 'Выход'}</div>
        </div>
      </div>
    </NodeBypassWrapper>
  );
});

OutputNode.displayName = 'OutputNode';
