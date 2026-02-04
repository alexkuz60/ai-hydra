import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeBypassWrapper } from './NodeBypassWrapper';

interface EmbeddingNodeProps {
  data: {
    label?: string;
    embeddingModel?: string;
    bypassed?: boolean;
  };
  selected?: boolean;
}

export const EmbeddingNode = memo(({ data, selected }: EmbeddingNodeProps) => {
  return (
    <NodeBypassWrapper bypassed={data.bypassed}>
      <div className={cn(
        "px-4 py-3 min-w-[160px] rounded-lg border-2 transition-all",
        "bg-hydra-expert/10 border-hydra-expert",
        selected && "ring-2 ring-hydra-expert ring-offset-2 ring-offset-background"
      )}>
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-hydra-expert !border-2 !border-background"
        />
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-hydra-expert/20">
            <Sparkles className="h-4 w-4 text-hydra-expert" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{data.label || 'Эмбеддинг'}</div>
            {data.embeddingModel && (
              <div className="text-xs text-muted-foreground truncate">
                {data.embeddingModel}
              </div>
            )}
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-hydra-expert !border-2 !border-background"
        />
      </div>
    </NodeBypassWrapper>
  );
});

EmbeddingNode.displayName = 'EmbeddingNode';
