import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ArrowDownToLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputNodeProps {
  data: {
    label?: string;
    description?: string;
    inputType?: string;
  };
  selected?: boolean;
}

export const InputNode = memo(({ data, selected }: InputNodeProps) => {
  return (
    <div 
      className={cn(
        "w-[120px] h-[120px] rounded-full border-2 transition-all flex items-center justify-center",
        "border-hydra-info",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      style={{
        backgroundColor: 'hsl(var(--node-bg))',
        boxShadow: '0 0 12px hsl(210 90% 65% / 0.4)',
      }}
    >
      <div className="flex flex-col items-center gap-1.5">
        <div className="p-2 rounded-full bg-hydra-info/20">
          <ArrowDownToLine className="h-5 w-5 text-hydra-info" />
        </div>
        <div className="text-sm font-medium text-hydra-info">{data.label || 'Вход'}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-hydra-info !border-2 !border-background"
      />
    </div>
  );
});

InputNode.displayName = 'InputNode';
