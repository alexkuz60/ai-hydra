import { FlowNodeType } from './flow';

// Edge line types supported by React Flow
export type EdgeLineType = 'bezier' | 'smoothstep' | 'step' | 'straight';

// Marker/arrow types for edges
export type EdgeMarkerType = 'arrow' | 'arrowclosed' | 'none';

// Data flow types for color coding
export type FlowDataType = 'text' | 'json' | 'file' | 'signal' | 'any';

// Edge direction based on node positions
export type EdgeDirection = 'forward' | 'backward';

// Custom edge data stored with each edge
export interface FlowEdgeData {
  dataType?: FlowDataType;
  label?: string;
  animated?: boolean;
  strokeWidth?: number;
  lineType?: EdgeLineType;
  markerType?: EdgeMarkerType;
  // Index signature for React Flow compatibility
  [key: string]: unknown;
}

// Edge style settings (global defaults)
export interface EdgeStyleSettings {
  defaultLineType: EdgeLineType;
  defaultMarkerType: EdgeMarkerType;
  defaultAnimated: boolean;
  showDirectionStyles: boolean; // Different styles for forward/backward
}

// Color palette for data types (HSL values matching design system)
export const FLOW_DATA_COLORS: Record<FlowDataType, string> = {
  text: '210 90% 55%',     // Blue
  json: '270 70% 60%',      // Purple
  file: '35 90% 55%',       // Orange
  signal: '220 15% 50%',    // Gray
  any: '190 95% 50%',       // Cyan (primary)
};

// Edge style presets
export const EDGE_LINE_OPTIONS: { value: EdgeLineType; label: string; labelRu: string }[] = [
  { value: 'bezier', label: 'Bezier (smooth)', labelRu: 'Безье (плавные)' },
  { value: 'smoothstep', label: 'Smooth Step', labelRu: 'Плавные ступени' },
  { value: 'step', label: 'Step', labelRu: 'Ступенчатые' },
  { value: 'straight', label: 'Straight', labelRu: 'Прямые' },
];

export const EDGE_MARKER_OPTIONS: { value: EdgeMarkerType; label: string; labelRu: string }[] = [
  { value: 'arrowclosed', label: 'Closed Arrow', labelRu: 'Закрытая стрелка' },
  { value: 'arrow', label: 'Open Arrow', labelRu: 'Открытая стрелка' },
  { value: 'none', label: 'No Arrow', labelRu: 'Без стрелки' },
];

export const DATA_TYPE_OPTIONS: { value: FlowDataType; label: string; labelRu: string }[] = [
  { value: 'text', label: 'Text', labelRu: 'Текст' },
  { value: 'json', label: 'JSON/Object', labelRu: 'JSON/Объект' },
  { value: 'file', label: 'File', labelRu: 'Файл' },
  { value: 'signal', label: 'Signal', labelRu: 'Сигнал' },
  { value: 'any', label: 'Any', labelRu: 'Любой' },
];

// Default edge style settings
export const DEFAULT_EDGE_SETTINGS: EdgeStyleSettings = {
  defaultLineType: 'smoothstep',
  defaultMarkerType: 'arrowclosed',
  defaultAnimated: true,
  showDirectionStyles: true,
};
