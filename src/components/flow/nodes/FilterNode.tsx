import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterNodeProps {
  data: {
    label?: string;
    filterCondition?: string;
  };
  selected?: boolean;
}

export const FilterNode = memo(({ data, selected }: FilterNodeProps) => {
  return (
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
          <Filter className="h-4 w-4 text-hydra-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{data.label || 'Фильтр'}</div>
          {data.filterCondition && (
            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
              {data.filterCondition.slice(0, 30)}...
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-hydra-warning !border-2 !border-background"
      />
    </div>
  );
});

FilterNode.displayName = 'FilterNode';
