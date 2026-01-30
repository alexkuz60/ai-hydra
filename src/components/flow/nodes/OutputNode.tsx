import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ArrowUpFromLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutputNodeProps {
  data: {
    label?: string;
    description?: string;
    outputType?: string;
  };
  selected?: boolean;
}

export const OutputNode = memo(({ data, selected }: OutputNodeProps) => {
  return (
    <div className={cn(
      "px-4 py-3 min-w-[140px] rounded-lg border-2 transition-all shadow-sm",
      "bg-[hsl(45_15%_92%)] border-hydra-glow",
      "dark:!bg-[hsl(225_30%_12%)] dark:border-hydra-glow dark:shadow-[0_0_10px_hsl(190_100%_55%/0.3)]",
      selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-hydra-glow !border-2 !border-background"
      />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-hydra-glow/20">
          <ArrowUpFromLine className="h-4 w-4 text-hydra-glow" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-hydra-glow">{data.label || 'Выход'}</div>
          {data.description && (
            <div className="text-xs text-muted-foreground truncate">{data.description}</div>
          )}
        </div>
      </div>
    </div>
  );
});

OutputNode.displayName = 'OutputNode';
