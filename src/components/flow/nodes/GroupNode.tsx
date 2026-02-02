import React, { memo } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { FlowNodeData } from '@/types/flow';
import { useTheme } from '@/contexts/ThemeContext';

export const GroupNode = memo(({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const nodeData = data as FlowNodeData;
  const groupColor = nodeData.color as string | undefined;

  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        lineClassName="!border-primary"
        handleClassName="!w-3 !h-3 !bg-primary !border-2 !border-background !rounded"
      />
      <div
        className={`
          min-w-[200px] min-h-[150px] w-full h-full
          rounded-xl border-2 border-dashed
          transition-all duration-200
          ${selected 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/30 bg-muted/20'
          }
          ${theme === 'dark' ? 'backdrop-blur-sm' : ''}
        `}
        style={{
          backgroundColor: groupColor 
            ? `${groupColor}15` 
            : undefined,
          borderColor: groupColor || undefined,
        }}
      >
        {/* Header */}
        <div 
          className={`
            px-3 py-2 border-b border-dashed
            ${selected ? 'border-primary/50' : 'border-muted-foreground/20'}
          `}
          style={{ borderColor: groupColor ? `${groupColor}50` : undefined }}
        >
          <span 
            className="text-sm font-medium text-foreground/80"
            style={{ color: groupColor || undefined }}
          >
            {nodeData.label || 'Группа'}
          </span>
          {nodeData.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {nodeData.description}
            </p>
          )}
        </div>
        
        {/* Content area - nodes will be positioned inside */}
        <div className="p-2 w-full h-full" />
      </div>
    </>
  );
});

GroupNode.displayName = 'GroupNode';
