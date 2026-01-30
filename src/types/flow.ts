import { Node, Edge, Viewport } from '@xyflow/react';

export type FlowNodeType = 'input' | 'output' | 'prompt' | 'model' | 'condition' | 'tool';

export interface FlowNodeData {
  label: string;
  description?: string;
  // Input node specific
  inputType?: 'user' | 'file' | 'api';
  // Prompt node specific
  promptId?: string;
  promptContent?: string;
  // Model node specific
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  // Condition node specific
  condition?: string;
  trueLabel?: string;
  falseLabel?: string;
  // Tool node specific
  toolId?: string;
  toolName?: string;
  toolConfig?: Record<string, unknown>;
  // Output node specific
  outputType?: 'chat' | 'file' | 'api';
  // Allow additional properties
  [key: string]: unknown;
}

export interface FlowDiagram {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  viewport: Viewport;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlowDiagramInsert {
  name: string;
  description?: string;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  viewport?: Viewport;
  is_shared?: boolean;
  user_id: string;
}

// Node palette items for sidebar
export interface NodePaletteItem {
  type: FlowNodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const NODE_PALETTE: NodePaletteItem[] = [
  {
    type: 'input',
    label: 'Вход',
    description: 'Входные данные',
    icon: 'ArrowDownToLine',
    color: 'hydra-info',
  },
  {
    type: 'prompt',
    label: 'Промпт',
    description: 'Системный промпт',
    icon: 'FileText',
    color: 'primary',
  },
  {
    type: 'model',
    label: 'AI Модель',
    description: 'Обработка AI',
    icon: 'Brain',
    color: 'hydra-success',
  },
  {
    type: 'condition',
    label: 'Условие',
    description: 'Ветвление логики',
    icon: 'GitBranch',
    color: 'hydra-warning',
  },
  {
    type: 'tool',
    label: 'Инструмент',
    description: 'Вызов инструмента',
    icon: 'Wrench',
    color: 'hydra-expert',
  },
  {
    type: 'output',
    label: 'Выход',
    description: 'Результат',
    icon: 'ArrowUpFromLine',
    color: 'hydra-glow',
  },
];
