import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Combine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeBypassWrapper } from './NodeBypassWrapper';

interface MergeNodeProps {
  data: {
    label?: string;
    mergeStrategy?: 'concat' | 'array' | 'object' | 'first' | 'last';
    inputCount?: number;
    waitForAll?: boolean;
    bypassed?: boolean;
  };
  selected?: boolean;
}

export const MergeNode = memo(({ data, selected }: MergeNodeProps) => {
  const inputCount = data.inputCount || 2;
  const mergeStrategy = data.mergeStrategy || 'concat';
  const waitForAll = data.waitForAll !== false; // Default to true
  
  // Generate input handles based on count (max 5)
  const handles = Array.from({ length: Math.min(inputCount, 5) }, (_, i) => i);
  
  // Calculate positions for handles
  const getHandlePosition = (index: number, total: number) => {
    if (total === 1) return '50%';
    const spacing = 60 / (total - 1);
    const startOffset = 20;
    return `${startOffset + (spacing * index)}%`;
  };
  
  const getStrategyIcon = () => {
    switch (mergeStrategy) {
      case 'concat': return '⊕';
      case 'array': return '[]';
      case 'object': return '{}';
      case 'first': return '⊳';
      case 'last': return '⊲';
      default: return '⊕';
    }
  };

  return (
    <NodeBypassWrapper bypassed={data.bypassed}>
      <div className={cn(
        "px-4 py-3 min-w-[180px] rounded-lg border-2 transition-all",
        "bg-hydra-advisor/10 border-hydra-advisor",
        selected && "ring-2 ring-hydra-advisor ring-offset-2 ring-offset-background"
      )}>
        {/* Dynamic input handles */}
        {handles.map((index) => (
          <Handle
            key={`input-${index + 1}`}
            type="target"
            position={Position.Top}
            id={`input-${index + 1}`}
            className="!w-3 !h-3 !bg-hydra-advisor !border-2 !border-background"
            style={{ left: getHandlePosition(index, handles.length) }}
          />
        ))}
        
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-hydra-advisor/20">
            <Combine className="h-4 w-4 text-hydra-advisor" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{data.label || 'Слияние'}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {getStrategyIcon()} {inputCount}
              </span>
              {waitForAll && (
                <span className="text-xs text-hydra-advisor" title="Ожидает все входы">
                  ✓
                </span>
              )}
            </div>
          </div>
        </div>
        
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-hydra-advisor !border-2 !border-background"
        />
      </div>
    </NodeBypassWrapper>
  );
});

MergeNode.displayName = 'MergeNode';
