import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiNodeProps {
  data: {
    label?: string;
    apiUrl?: string;
    apiMethod?: string;
  };
  selected?: boolean;
}

export const ApiNode = memo(({ data, selected }: ApiNodeProps) => {
  return (
    <div className={cn(
      "px-4 py-3 min-w-[160px] rounded-lg border-2 transition-all",
      "bg-hydra-webhunter/10 border-hydra-webhunter",
      selected && "ring-2 ring-hydra-webhunter ring-offset-2 ring-offset-background"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-hydra-webhunter !border-2 !border-background"
      />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-hydra-webhunter/20">
          <Globe className="h-4 w-4 text-hydra-webhunter" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{data.label || 'API'}</div>
          {data.apiMethod && (
            <div className="text-xs text-muted-foreground truncate">
              {data.apiMethod} {data.apiUrl?.slice(0, 20)}...
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-hydra-webhunter !border-2 !border-background"
      />
    </div>
  );
});

ApiNode.displayName = 'ApiNode';
