import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptNodeProps {
  data: {
    label?: string;
    promptId?: string;
    promptContent?: string;
  };
  selected?: boolean;
}

export const PromptNode = memo(({ data, selected }: PromptNodeProps) => {
  return (
    <div className={cn(
      "px-4 py-3 min-w-[160px] rounded-lg border-2 transition-all",
      "bg-primary/10 border-primary",
      selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
    )}>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-primary/20">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{data.label || 'Промпт'}</div>
          {data.promptContent && (
            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
              {data.promptContent.slice(0, 30)}...
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </div>
  );
});

PromptNode.displayName = 'PromptNode';
