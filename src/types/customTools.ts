// Custom Tools type definitions

export type ToolType = 'prompt' | 'http_api' | 'system';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type OwnerFilter = 'all' | 'own' | 'shared' | 'system';
export type ToolCategory = 'general' | 'data' | 'integration' | 'ai' | 'automation' | 'utility';

export const TOOL_CATEGORIES: { value: ToolCategory; labelKey: string; icon: string }[] = [
  { value: 'general', labelKey: 'tools.category.general', icon: 'Wrench' },
  { value: 'data', labelKey: 'tools.category.data', icon: 'Database' },
  { value: 'integration', labelKey: 'tools.category.integration', icon: 'Plug' },
  { value: 'ai', labelKey: 'tools.category.ai', icon: 'Sparkles' },
  { value: 'automation', labelKey: 'tools.category.automation', icon: 'Zap' },
  { value: 'utility', labelKey: 'tools.category.utility', icon: 'Settings' },
];

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
  [key: string]: unknown;
}

// System tools - built-in, non-editable
export interface SystemTool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  parameters: ToolParameter[];
  tool_type: 'system' | 'prompt' | 'http_api';
  is_system: true;
  prompt_template?: string;
  http_config?: HttpConfig | null;
  category?: ToolCategory;
}

export const SYSTEM_TOOLS: SystemTool[] = [
  // Core system tools
  {
    id: 'system_calculator',
    name: 'calculator',
    display_name: 'Калькулятор',
    description: 'Выполняет математические вычисления. Поддерживает арифметические операции, функции (sin, cos, sqrt, log и т.д.) и константы (pi, e).',
    parameters: [
      { name: 'expression', type: 'string', description: 'Математическое выражение для вычисления', required: true },
    ],
    tool_type: 'system',
    is_system: true,
    category: 'utility',
  },
  {
    id: 'system_current_datetime',
    name: 'current_datetime',
    display_name: 'Дата и время',
    description: 'Возвращает текущие дату и время в указанном часовом поясе.',
    parameters: [
      { name: 'timezone', type: 'string', description: 'Часовой пояс (например, Europe/Moscow)', required: false },
    ],
    tool_type: 'system',
    is_system: true,
    category: 'utility',
  },
  {
    id: 'system_web_search',
    name: 'web_search',
    display_name: 'Веб-поиск',
    description: 'Выполняет поиск информации в интернете через Tavily, Perplexity или Brave Search. Возвращает релевантные результаты с краткими описаниями.',
    parameters: [
      { name: 'query', type: 'string', description: 'Поисковый запрос', required: true },
      { name: 'max_results', type: 'number', description: 'Максимальное количество результатов (1-10)', required: false },
    ],
    tool_type: 'system',
    is_system: true,
    category: 'integration',
  },
  // Built-in prompt tools by category
  {
    id: 'builtin_summarizer',
    name: 'text_summarizer',
    display_name: 'Резюмизатор текста',
    description: 'Сжимает длинный текст до ключевых тезисов. Полезен для быстрого анализа документов и выделения главного.',
    parameters: [
      { name: 'text', type: 'string', description: 'Текст для резюмирования', required: true },
      { name: 'max_points', type: 'number', description: 'Максимальное количество ключевых пунктов (по умолчанию 5)', required: false },
    ],
    tool_type: 'prompt',
    is_system: true,
    category: 'general',
    prompt_template: `Проанализируй следующий текст и выдели {{max_points}} ключевых пунктов. 
Каждый пункт должен быть кратким (1-2 предложения) и содержать самую важную информацию.

Формат ответа:
1. [Ключевой пункт]
2. [Ключевой пункт]
...

Текст для анализа:
{{text}}`,
  },
  {
    id: 'builtin_json_formatter',
    name: 'json_formatter',
    display_name: 'JSON Форматтер',
    description: 'Преобразует неструктурированные данные в JSON по заданной схеме. Извлекает сущности и атрибуты.',
    parameters: [
      { name: 'input', type: 'string', description: 'Исходные данные для преобразования', required: true },
      { name: 'schema', type: 'string', description: 'Описание схемы JSON (например: {name: string, age: number, skills: string[]})', required: true },
    ],
    tool_type: 'prompt',
    is_system: true,
    category: 'data',
    prompt_template: `Преобразуй следующие данные в валидный JSON согласно указанной схеме.

Целевая схема: {{schema}}

Правила:
- Извлеки все релевантные данные из входного текста
- Если данных недостаточно, используй null для отсутствующих полей
- Верни ТОЛЬКО валидный JSON без пояснений

Входные данные:
{{input}}`,
  },
  {
    id: 'builtin_prompt_optimizer',
    name: 'prompt_optimizer',
    display_name: 'Промпт-Оптимизатор',
    description: 'Улучшает формулировку промптов для более точных ответов ИИ. Добавляет структуру, контекст и ограничения.',
    parameters: [
      { name: 'original_prompt', type: 'string', description: 'Исходный промпт для улучшения', required: true },
      { name: 'target_role', type: 'string', description: 'Целевая роль ИИ (эксперт, критик, арбитр и т.д.)', required: false },
      { name: 'style', type: 'string', description: 'Стиль: concise (краткий), detailed (детальный), structured (структурированный), creative (креативный)', required: false },
    ],
    tool_type: 'prompt',
    is_system: true,
    category: 'ai',
    prompt_template: `Ты — эксперт по промпт-инженерии. Улучши следующий промпт.

Целевая роль: {{target_role}}
Желаемый стиль: {{style}}

Оригинальный промпт:
{{original_prompt}}

Требования к улучшению:
1. Добавь чёткий контекст и роль для ИИ
2. Структурируй инструкции по шагам
3. Укажи формат ожидаемого ответа
4. Добавь ограничения для предотвращения ошибок
5. Сохрани исходный смысл и цель

Верни улучшенную версию промпта:`,
  },
  {
    id: 'builtin_checklist_generator',
    name: 'checklist_generator',
    display_name: 'Чек-лист Генератор',
    description: 'Создаёт структурированный план действий для любой задачи. Разбивает сложные задачи на конкретные шаги.',
    parameters: [
      { name: 'task_description', type: 'string', description: 'Описание задачи', required: true },
      { name: 'steps_count', type: 'number', description: 'Количество шагов (по умолчанию 7)', required: false },
    ],
    tool_type: 'prompt',
    is_system: true,
    category: 'automation',
    prompt_template: `Создай детальный чек-лист из {{steps_count}} шагов для выполнения следующей задачи.

Задача: {{task_description}}

Требования к чек-листу:
- Каждый шаг должен быть конкретным и выполнимым
- Шаги должны идти в логическом порядке
- Добавь критерии завершения для каждого шага
- Укажи возможные риски или подводные камни

Формат:
☐ [Шаг] — [Критерий выполнения]
  ⚠️ [Риск/Примечание, если есть]`,
  },
  {
    id: 'builtin_transliterator',
    name: 'transliterator',
    display_name: 'Транслитератор',
    description: 'Конвертирует текст между форматами: кириллица↔латиница, CamelCase↔snake_case↔kebab-case и др.',
    parameters: [
      { name: 'text', type: 'string', description: 'Текст для преобразования', required: true },
      { name: 'format', type: 'string', description: 'Целевой формат: latin, cyrillic, camelCase, snake_case, kebab-case, UPPER_CASE, Title Case', required: true },
    ],
    tool_type: 'prompt',
    is_system: true,
    category: 'utility',
    prompt_template: `Преобразуй следующий текст в формат: {{format}}

Текст: {{text}}

Правила:
- Для latin/cyrillic — используй стандартную транслитерацию
- Для camelCase — первое слово с маленькой буквы, остальные с большой
- Для snake_case — все слова через подчёркивание в нижнем регистре
- Для kebab-case — все слова через дефис в нижнем регистре
- Для UPPER_CASE — всё в верхнем регистре через подчёркивание
- Для Title Case — каждое слово с заглавной буквы

Верни ТОЛЬКО преобразованный текст без пояснений.`,
  },
];

export interface HttpConfig {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body_template?: string;
  response_path?: string;
}

export interface CustomTool {
  id: string;
  name: string;
  display_name: string;
  description: string;
  prompt_template: string;
  parameters: ToolParameter[];
  is_shared: boolean;
  usage_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  tool_type: ToolType;
  http_config: HttpConfig | null;
  category: ToolCategory;
}

export interface ToolFormData {
  name: string;
  displayName: string;
  description: string;
  promptTemplate: string;
  parameters: ToolParameter[];
  isShared: boolean;
  toolType: ToolType;
  category: ToolCategory;
  httpUrl: string;
  httpMethod: HttpMethod;
  httpHeaders: { key: string; value: string }[];
  httpBodyTemplate: string;
  httpResponsePath: string;
}

export const PARAM_TYPES = [
  { value: 'string', labelKey: 'tools.paramType.string' },
  { value: 'number', labelKey: 'tools.paramType.number' },
  { value: 'boolean', labelKey: 'tools.paramType.boolean' },
] as const;

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];

export function getEmptyFormData(): ToolFormData {
  return {
    name: '',
    displayName: '',
    description: '',
    promptTemplate: '',
    parameters: [],
    isShared: false,
    toolType: 'prompt',
    category: 'general',
    httpUrl: '',
    httpMethod: 'GET',
    httpHeaders: [],
    httpBodyTemplate: '',
    httpResponsePath: '',
  };
}

export function toolToFormData(tool: CustomTool): ToolFormData {
  const hc = tool.http_config;
  return {
    name: tool.name,
    displayName: tool.display_name,
    description: tool.description,
    promptTemplate: tool.prompt_template,
    parameters: [...tool.parameters],
    isShared: tool.is_shared,
    toolType: tool.tool_type || 'prompt',
    category: tool.category || 'general',
    httpUrl: hc?.url || '',
    httpMethod: hc?.method || 'GET',
    httpHeaders: hc?.headers 
      ? Object.entries(hc.headers).map(([key, value]) => ({ key, value })) 
      : [],
    httpBodyTemplate: hc?.body_template || '',
    httpResponsePath: hc?.response_path || '',
  };
}

export function validateToolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Export tool to JSON format
export function exportToolToJson(tool: CustomTool): string {
  const exportData = {
    version: 1,
    type: 'hydra_tool',
    tool: {
      name: tool.name,
      display_name: tool.display_name,
      description: tool.description,
      prompt_template: tool.prompt_template,
      parameters: tool.parameters,
      tool_type: tool.tool_type,
      http_config: tool.http_config,
    },
  };
  return JSON.stringify(exportData, null, 2);
}

// Import tool from JSON format
export function importToolFromJson(json: string): ToolFormData | null {
  try {
    const data = JSON.parse(json);
    
    // Validate format
    if (data.type !== 'hydra_tool' || !data.tool) {
      return null;
    }
    
    const t = data.tool;
    const hc = t.http_config;
    
    return {
      name: `${t.name}_imported`,
      displayName: `${t.display_name} (импорт)`,
      description: t.description || '',
      promptTemplate: t.prompt_template || '',
      parameters: Array.isArray(t.parameters) ? t.parameters : [],
      isShared: false,
      toolType: t.tool_type || 'prompt',
      category: t.category || 'general',
      httpUrl: hc?.url || '',
      httpMethod: hc?.method || 'GET',
      httpHeaders: hc?.headers 
        ? Object.entries(hc.headers).map(([key, value]) => ({ key, value: String(value) }))
        : [],
      httpBodyTemplate: hc?.body_template || '',
      httpResponsePath: hc?.response_path || '',
    };
  } catch {
    return null;
  }
}
