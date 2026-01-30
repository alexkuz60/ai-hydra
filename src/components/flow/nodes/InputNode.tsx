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
    <div className={cn(
      "px-4 py-3 min-w-[140px] rounded-lg border-2 transition-all",
      "bg-hydra-info/10 border-hydra-info",
      selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
    )}>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-hydra-info/20">
          <ArrowDownToLine className="h-4 w-4 text-hydra-info" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{data.label || 'Вход'}</div>
          {data.description && (
            <div className="text-xs text-muted-foreground truncate">{data.description}</div>
          )}
        </div>
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
