import { Node, Edge, Viewport } from '@xyflow/react';

export type FlowNodeType = 
  | 'input' | 'output' | 'prompt' | 'model' | 'condition' | 'tool'
  // Data processing
  | 'transform' | 'filter' | 'merge' | 'split'
  // Integrations
  | 'database' | 'api' | 'storage'
  // Logic & control
  | 'loop' | 'delay' | 'switch'
  // AI-specific
  | 'embedding' | 'memory' | 'classifier';

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
  // Transform node specific
  transformType?: 'json' | 'text' | 'format';
  transformExpression?: string;
  // Filter node specific
  filterCondition?: string;
  // Merge node specific
  mergeStrategy?: 'concat' | 'object' | 'array';
  // Split node specific
  splitKey?: string;
  // Database node specific
  dbOperation?: 'read' | 'write' | 'update' | 'delete';
  tableName?: string;
  // API node specific
  apiUrl?: string;
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  // Storage node specific
  storagePath?: string;
  storageOperation?: 'read' | 'write';
  // Loop node specific
  loopVariable?: string;
  maxIterations?: number;
  // Delay node specific
  delayMs?: number;
  // Switch node specific
  switchCases?: { label: string; condition: string }[];
  // Embedding node specific
  embeddingModel?: string;
  // Memory node specific
  memoryType?: 'short' | 'long' | 'rag';
  // Classifier node specific
  classifierLabels?: string[];
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
  category: 'basic' | 'data' | 'integration' | 'logic' | 'ai';
}

export const NODE_PALETTE: NodePaletteItem[] = [
  // Basic nodes
  {
    type: 'input',
    label: 'Вход',
    description: 'Входные данные',
    icon: 'ArrowDownToLine',
    color: 'hydra-info',
    category: 'basic',
  },
  {
    type: 'prompt',
    label: 'Промпт',
    description: 'Системный промпт',
    icon: 'FileText',
    color: 'primary',
    category: 'basic',
  },
  {
    type: 'model',
    label: 'AI Модель',
    description: 'Обработка AI',
    icon: 'Brain',
    color: 'hydra-success',
    category: 'basic',
  },
  {
    type: 'condition',
    label: 'Условие',
    description: 'Ветвление логики',
    icon: 'GitBranch',
    color: 'hydra-warning',
    category: 'basic',
  },
  {
    type: 'tool',
    label: 'Инструмент',
    description: 'Вызов инструмента',
    icon: 'Wrench',
    color: 'hydra-expert',
    category: 'basic',
  },
  {
    type: 'output',
    label: 'Выход',
    description: 'Результат',
    icon: 'ArrowUpFromLine',
    color: 'hydra-glow',
    category: 'basic',
  },
  // Data processing nodes
  {
    type: 'transform',
    label: 'Трансформация',
    description: 'Преобразование данных',
    icon: 'Shuffle',
    color: 'hydra-analyst',
    category: 'data',
  },
  {
    type: 'filter',
    label: 'Фильтр',
    description: 'Фильтрация данных',
    icon: 'Filter',
    color: 'hydra-warning',
    category: 'data',
  },
  {
    type: 'merge',
    label: 'Слияние',
    description: 'Объединение входов',
    icon: 'Combine',
    color: 'hydra-advisor',
    category: 'data',
  },
  {
    type: 'split',
    label: 'Разделение',
    description: 'Разделение данных',
    icon: 'Split',
    color: 'hydra-archivist',
    category: 'data',
  },
  // Integration nodes
  {
    type: 'database',
    label: 'База данных',
    description: 'Работа с БД',
    icon: 'Database',
    color: 'hydra-analyst',
    category: 'integration',
  },
  {
    type: 'api',
    label: 'API',
    description: 'HTTP запрос',
    icon: 'Globe',
    color: 'hydra-webhunter',
    category: 'integration',
  },
  {
    type: 'storage',
    label: 'Хранилище',
    description: 'Файловое хранилище',
    icon: 'HardDrive',
    color: 'hydra-archivist',
    category: 'integration',
  },
  // Logic & control nodes
  {
    type: 'loop',
    label: 'Цикл',
    description: 'Итерация',
    icon: 'Repeat',
    color: 'hydra-moderator',
    category: 'logic',
  },
  {
    type: 'delay',
    label: 'Задержка',
    description: 'Пауза выполнения',
    icon: 'Clock',
    color: 'muted',
    category: 'logic',
  },
  {
    type: 'switch',
    label: 'Переключатель',
    description: 'Множественное ветвление',
    icon: 'LayoutList',
    color: 'hydra-warning',
    category: 'logic',
  },
  // AI-specific nodes
  {
    type: 'embedding',
    label: 'Эмбеддинг',
    description: 'Векторизация текста',
    icon: 'Sparkles',
    color: 'hydra-expert',
    category: 'ai',
  },
  {
    type: 'memory',
    label: 'Память',
    description: 'Контекстная память',
    icon: 'MemoryStick',
    color: 'hydra-advisor',
    category: 'ai',
  },
  {
    type: 'classifier',
    label: 'Классификатор',
    description: 'Классификация',
    icon: 'Tags',
    color: 'hydra-success',
    category: 'ai',
  },
];
