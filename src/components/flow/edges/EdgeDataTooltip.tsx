import React from 'react';
import { cn } from '@/lib/utils';
import { FlowDataType, FLOW_DATA_COLORS } from '@/types/edgeTypes';

interface EdgeDataTooltipProps {
  x: number;
  y: number;
  dataType: FlowDataType;
  data?: unknown;
  label?: string;
  visible: boolean;
}

// Truncate and format data for preview
function formatDataPreview(data: unknown, maxLength = 200): string {
  if (data === undefined || data === null) {
    return 'null';
  }

  if (typeof data === 'string') {
    if (data.length > maxLength) {
      return `"${data.slice(0, maxLength)}..."`;
    }
    return `"${data}"`;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }

  if (Array.isArray(data)) {
    const preview = JSON.stringify(data, null, 2);
    if (preview.length > maxLength) {
      return `[Array(${data.length})] ${preview.slice(0, maxLength)}...`;
    }
    return preview;
  }

  if (typeof data === 'object') {
    const preview = JSON.stringify(data, null, 2);
    if (preview.length > maxLength) {
      return `{Object} ${preview.slice(0, maxLength)}...`;
    }
    return preview;
  }

  return String(data);
}

// Get icon for data type
function getDataTypeIcon(dataType: FlowDataType): string {
  switch (dataType) {
    case 'text': return '📝';
    case 'json': return '{ }';
    case 'file': return '📁';
    case 'signal': return '⚡';
    case 'any':
    default: return '•';
  }
}

export function EdgeDataTooltip({
  x,
  y,
  dataType,
  data,
  label,
  visible,
}: EdgeDataTooltipProps) {
  if (!visible) return null;

  const colorHSL = FLOW_DATA_COLORS[dataType];
  const hasData = data !== undefined;

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(-50%, -100%) translate(${x}px, ${y - 12}px)`,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
      className={cn(
        'animate-in fade-in-0 zoom-in-95 duration-150',
        'max-w-xs'
      )}
    >
      <div
        className={cn(
          'rounded-lg border shadow-lg overflow-hidden',
          'bg-popover text-popover-foreground'
        )}
      >
        {/* Header with data type */}
        <div
          className="px-3 py-1.5 flex items-center gap-2 border-b"
          style={{ backgroundColor: `hsl(${colorHSL} / 0.15)` }}
        >
          <span className="text-sm">{getDataTypeIcon(dataType)}</span>
          <span className="text-xs font-medium capitalize">{dataType}</span>
          {label && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground truncate">{label}</span>
            </>
          )}
        </div>

        {/* Data preview */}
        <div className="px-3 py-2 max-h-40 overflow-auto">
          {hasData ? (
            <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground/90">
              {formatDataPreview(data)}
            </pre>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              Нет данных (запустите поток)
            </span>
          )}
        </div>
      </div>

      {/* Arrow pointer */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-popover border-r border-b"
      />
    </div>
  );
}
