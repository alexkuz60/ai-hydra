import React, { memo, useMemo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react';
import { cn } from '@/lib/utils';
import {
  EdgeLineType,
  FlowDataType,
  FlowEdgeData,
  FLOW_DATA_COLORS,
  EdgeDirection,
} from '@/types/edgeTypes';

// Get path based on line type
function getEdgePath(
  lineType: EdgeLineType,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: any,
  targetPosition: any
): [string, number, number] {
  switch (lineType) {
    case 'bezier':
      const [bezierPath, bezierLabelX, bezierLabelY] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
      });
      return [bezierPath, bezierLabelX, bezierLabelY];
    
    case 'straight':
      const [straightPath, straightLabelX, straightLabelY] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
      return [straightPath, straightLabelX, straightLabelY];
    
    case 'step':
      const [stepPath, stepLabelX, stepLabelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        borderRadius: 0,
      });
      return [stepPath, stepLabelX, stepLabelY];
    
    case 'smoothstep':
    default:
      const [smoothPath, smoothLabelX, smoothLabelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        borderRadius: 8,
      });
      return [smoothPath, smoothLabelX, smoothLabelY];
  }
}

// Determine edge direction based on node positions
function getEdgeDirection(sourceX: number, targetX: number): EdgeDirection {
  return sourceX < targetX ? 'forward' : 'backward';
}

export const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) => {
  // Cast data to our expected type
  const edgeData = (data || {}) as FlowEdgeData;
  
  const lineType: EdgeLineType = (edgeData.lineType as EdgeLineType) || 'smoothstep';
  const dataType: FlowDataType = (edgeData.dataType as FlowDataType) || 'any';
  const label = edgeData.label as string | undefined;
  const animated = edgeData.animated !== false;
  const strokeWidth = (edgeData.strokeWidth as number) || 2;

  // Calculate path
  const [edgePath, labelX, labelY] = useMemo(() => 
    getEdgePath(lineType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition),
    [lineType, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]
  );

  // Determine direction for styling
  const direction = useMemo(() => 
    getEdgeDirection(sourceX, targetX),
    [sourceX, targetX]
  );

  // Get color based on data type
  const edgeColor = useMemo(() => {
    const colorHSL = FLOW_DATA_COLORS[dataType];
    return `hsl(${colorHSL})`;
  }, [dataType]);

  // Build edge style
  const edgeStyle = useMemo((): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      stroke: edgeColor,
      strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
      transition: 'stroke-width 0.2s, stroke 0.2s, opacity 0.2s',
    };

    // Backward connections get dashed style
    if (direction === 'backward') {
      baseStyle.strokeDasharray = '8 4';
      baseStyle.stroke = 'hsl(35 90% 55%)'; // Orange for backward
    }

    return { ...baseStyle, ...(style as React.CSSProperties) };
  }, [edgeColor, strokeWidth, selected, direction, style]);

  // Animation class
  const animationClass = animated && direction === 'forward' ? 'react-flow__edge-path-animated' : '';

  return (
    <>
      {/* Invisible wider path for easier selection */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className="react-flow__edge-interaction"
      />
      
      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
        markerEnd={markerEnd as string}
        className={cn(
          'transition-all duration-200',
          animationClass,
          selected && 'drop-shadow-[0_0_6px_hsl(var(--primary))]'
        )}
      />

      {/* Edge label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              'bg-card border border-border shadow-sm',
              'transition-all duration-200',
              selected && 'ring-1 ring-primary'
            )}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Direction indicator for backward edges */}
      {direction === 'backward' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 16}px)`,
              pointerEvents: 'none',
            }}
            className="text-[10px] text-hydra-warning font-medium opacity-70"
          >
            ↩ обратная связь
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';
