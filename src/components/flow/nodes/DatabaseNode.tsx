import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatabaseNodeProps {
  data: {
    label?: string;
    dbOperation?: string;
    tableName?: string;
  };
  selected?: boolean;
}

export const DatabaseNode = memo(({ data, selected }: DatabaseNodeProps) => {
  return (
    <div className={cn(
      "px-4 py-3 min-w-[160px] rounded-lg border-2 transition-all",
      "bg-hydra-analyst/10 border-hydra-analyst",
      selected && "ring-2 ring-hydra-analyst ring-offset-2 ring-offset-background"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-hydra-analyst !border-2 !border-background"
      />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-hydra-analyst/20">
          <Database className="h-4 w-4 text-hydra-analyst" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{data.label || 'База данных'}</div>
          {data.tableName && (
            <div className="text-xs text-muted-foreground truncate">
              {data.dbOperation}: {data.tableName}
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-hydra-analyst !border-2 !border-background"
      />
    </div>
  );
});

DatabaseNode.displayName = 'DatabaseNode';
