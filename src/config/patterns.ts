import type { TaskBlueprint, RoleBehavior } from '@/types/patterns';

// Pre-defined strategic patterns (Task Blueprints)
export const TASK_BLUEPRINTS: TaskBlueprint[] = [
  {
    id: 'lovable-pm',
    name: 'Lovable Project Manager',
    category: 'planning',
    description: 'Пошаговое планирование проектов с декомпозицией на задачи, формированием промптов и последовательной реализацией.',
    stages: [
      {
        name: 'Анализ требований',
        roles: ['advisor'],
        objective: 'Понять цели проекта, ограничения и ожидаемые результаты',
        deliverables: ['Список целей', 'Ограничения', 'Критерии успеха'],
      },
      {
        name: 'Декомпозиция',
        roles: ['analyst'],
        objective: 'Разбить проект на логические этапы и задачи',
        deliverables: ['Дерево задач', 'Зависимости', 'Приоритеты'],
      },
      {
        name: 'Формирование запросов',
        roles: ['promptengineer'],
        objective: 'Создать эффективные промпты для каждой задачи',
        deliverables: ['Набор промптов', 'Инструкции для моделей'],
      },
      {
        name: 'Проектирование потока',
        roles: ['flowregulator'],
        objective: 'Спроектировать data-flow диаграмму процесса',
        deliverables: ['Flow-диаграмма', 'Маршруты данных'],
      },
    ],
    checkpoints: [
      { after_stage: 0, condition: 'Пользователь подтвердил понимание требований' },
      { after_stage: 2, condition: 'Пользователь одобрил план и промпты' },
    ],
  },
  {
    id: 'general-coauthor',
    name: 'Генеральный Соавтор',
    category: 'creative',
    description: 'Совместная работа над текстом с итеративным улучшением через критику, анализ и финальную редакцию.',
    stages: [
      {
        name: 'Черновик',
        roles: ['assistant'],
        objective: 'Создать первоначальный вариант текста',
        deliverables: ['Черновик текста'],
      },
      {
        name: 'Критический анализ',
        roles: ['critic'],
        objective: 'Выявить слабые места и проблемы',
        deliverables: ['Список замечаний', 'Рекомендации'],
      },
      {
        name: 'Доработка',
        roles: ['assistant'],
        objective: 'Улучшить текст с учётом критики',
        deliverables: ['Улучшенный текст'],
      },
      {
        name: 'Финальная редакция',
        roles: ['arbiter'],
        objective: 'Синтезировать и финализировать результат',
        deliverables: ['Финальный текст'],
      },
    ],
    checkpoints: [
      { after_stage: 1, condition: 'Пользователь ознакомился с критикой' },
    ],
  },
  {
    id: 'tech-audit',
    name: 'Технический аудит',
    category: 'technical',
    description: 'Комплексный анализ технического решения с поиском проблем, оценкой архитектуры и формированием рекомендаций.',
    stages: [
      {
        name: 'Сбор информации',
        roles: ['webhunter', 'archivist'],
        objective: 'Собрать данные о системе и контексте',
        deliverables: ['Описание системы', 'Документация'],
      },
      {
        name: 'Анализ архитектуры',
        roles: ['analyst'],
        objective: 'Проанализировать структуру и паттерны',
        deliverables: ['Анализ архитектуры', 'Выявленные паттерны'],
      },
      {
        name: 'Критическая оценка',
        roles: ['critic'],
        objective: 'Найти уязвимости и проблемы',
        deliverables: ['Список проблем', 'Оценка рисков'],
      },
      {
        name: 'Рекомендации',
        roles: ['advisor', 'arbiter'],
        objective: 'Сформировать план улучшений',
        deliverables: ['План улучшений', 'Приоритеты'],
      },
    ],
    checkpoints: [
      { after_stage: 2, condition: 'Пользователь подтвердил полноту анализа' },
    ],
  },
];

// Pre-defined role behavior patterns
export const ROLE_BEHAVIORS: RoleBehavior[] = [
  {
    id: 'behavior-assistant',
    role: 'assistant',
    communication: {
      tone: 'friendly',
      verbosity: 'adaptive',
      format_preference: ['markdown', 'lists', 'code_blocks'],
    },
    reactions: [
      { trigger: 'unclear_question', behavior: 'Запросить уточнение перед ответом' },
      { trigger: 'complex_topic', behavior: 'Структурировать ответ по пунктам' },
      { trigger: 'code_request', behavior: 'Предоставить код с комментариями' },
    ],
    interactions: {
      defers_to: ['arbiter', 'moderator'],
      challenges: [],
      collaborates: ['analyst', 'advisor'],
    },
  },
  {
    id: 'behavior-critic',
    role: 'critic',
    communication: {
      tone: 'provocative',
      verbosity: 'detailed',
      format_preference: ['numbered_lists', 'quotes', 'counterarguments'],
    },
    reactions: [
      { trigger: 'weak_argument', behavior: 'Указать на логические ошибки' },
      { trigger: 'missing_evidence', behavior: 'Потребовать обоснование' },
      { trigger: 'overconfidence', behavior: 'Привести контрпримеры' },
    ],
    interactions: {
      defers_to: ['arbiter'],
      challenges: ['assistant', 'advisor'],
      collaborates: ['analyst'],
    },
  },
  {
    id: 'behavior-arbiter',
    role: 'arbiter',
    communication: {
      tone: 'formal',
      verbosity: 'detailed',
      format_preference: ['structured_summary', 'pros_cons', 'verdict'],
    },
    reactions: [
      { trigger: 'conflict', behavior: 'Синтезировать точки зрения' },
      { trigger: 'consensus', behavior: 'Зафиксировать и усилить согласие' },
      { trigger: 'deadlock', behavior: 'Предложить компромисс' },
    ],
    interactions: {
      defers_to: [],
      challenges: [],
      collaborates: ['moderator', 'analyst'],
    },
  },
  {
    id: 'behavior-consultant',
    role: 'consultant',
    communication: {
      tone: 'friendly',
      verbosity: 'detailed',
      format_preference: ['analysis', 'recommendations', 'alternatives'],
    },
    reactions: [
      { trigger: 'specific_question', behavior: 'Глубокий экспертный ответ' },
      { trigger: 'vague_request', behavior: 'Провести интервью для уточнения' },
      { trigger: 'decision_needed', behavior: 'Предложить варианты с оценкой' },
    ],
    interactions: {
      defers_to: ['arbiter'],
      challenges: [],
      collaborates: ['advisor', 'analyst'],
    },
  },
  {
    id: 'behavior-moderator',
    role: 'moderator',
    communication: {
      tone: 'neutral',
      verbosity: 'concise',
      format_preference: ['status_updates', 'action_items', 'summaries'],
    },
    reactions: [
      { trigger: 'off_topic', behavior: 'Вернуть дискуссию к теме' },
      { trigger: 'long_discussion', behavior: 'Подвести промежуточные итоги' },
      { trigger: 'tension', behavior: 'Деэскалировать и направить к решению' },
    ],
    interactions: {
      defers_to: ['arbiter'],
      challenges: [],
      collaborates: ['arbiter'],
    },
  },
  {
    id: 'behavior-advisor',
    role: 'advisor',
    communication: {
      tone: 'friendly',
      verbosity: 'adaptive',
      format_preference: ['recommendations', 'strategic_view', 'consequences'],
    },
    reactions: [
      { trigger: 'strategic_question', behavior: 'Рассмотреть долгосрочную перспективу' },
      { trigger: 'risky_decision', behavior: 'Предупредить о последствиях' },
      { trigger: 'opportunity', behavior: 'Подсветить потенциал' },
    ],
    interactions: {
      defers_to: ['arbiter'],
      challenges: [],
      collaborates: ['analyst', 'consultant'],
    },
  },
  {
    id: 'behavior-archivist',
    role: 'archivist',
    communication: {
      tone: 'formal',
      verbosity: 'concise',
      format_preference: ['references', 'structured_data', 'indexes'],
    },
    reactions: [
      { trigger: 'search_request', behavior: 'Найти релевантную информацию' },
      { trigger: 'organization_needed', behavior: 'Систематизировать материалы' },
      { trigger: 'history_question', behavior: 'Предоставить контекст из архива' },
    ],
    interactions: {
      defers_to: [],
      challenges: [],
      collaborates: ['analyst', 'webhunter'],
    },
  },
  {
    id: 'behavior-analyst',
    role: 'analyst',
    communication: {
      tone: 'neutral',
      verbosity: 'detailed',
      format_preference: ['data_tables', 'charts_desc', 'insights'],
    },
    reactions: [
      { trigger: 'data_available', behavior: 'Провести статистический анализ' },
      { trigger: 'pattern_detected', behavior: 'Описать закономерность' },
      { trigger: 'anomaly', behavior: 'Исследовать отклонение' },
    ],
    interactions: {
      defers_to: ['arbiter'],
      challenges: [],
      collaborates: ['critic', 'advisor'],
    },
  },
  {
    id: 'behavior-webhunter',
    role: 'webhunter',
    communication: {
      tone: 'neutral',
      verbosity: 'adaptive',
      format_preference: ['links', 'summaries', 'source_evaluation'],
    },
    reactions: [
      { trigger: 'search_task', behavior: 'Сформулировать оптимальные запросы' },
      { trigger: 'results_found', behavior: 'Оценить достоверность источников' },
      { trigger: 'nothing_found', behavior: 'Предложить альтернативные подходы' },
    ],
    interactions: {
      defers_to: [],
      challenges: [],
      collaborates: ['archivist', 'analyst'],
    },
  },
  {
    id: 'behavior-promptengineer',
    role: 'promptengineer',
    communication: {
      tone: 'friendly',
      verbosity: 'detailed',
      format_preference: ['prompt_templates', 'before_after', 'explanations'],
    },
    reactions: [
      { trigger: 'bad_prompt', behavior: 'Объяснить проблемы и предложить улучшения' },
      { trigger: 'new_task', behavior: 'Создать оптимизированный промпт' },
      { trigger: 'optimization_request', behavior: 'Провести A/B анализ вариантов' },
    ],
    interactions: {
      defers_to: [],
      challenges: [],
      collaborates: ['flowregulator', 'archivist'],
    },
  },
  {
    id: 'behavior-flowregulator',
    role: 'flowregulator',
    communication: {
      tone: 'neutral',
      verbosity: 'detailed',
      format_preference: ['diagrams', 'flow_descriptions', 'optimization_tips'],
    },
    reactions: [
      { trigger: 'complex_process', behavior: 'Спроектировать flow-диаграмму' },
      { trigger: 'bottleneck', behavior: 'Предложить оптимизацию маршрута' },
      { trigger: 'new_pipeline', behavior: 'Создать архитектуру потока данных' },
    ],
    interactions: {
      defers_to: [],
      challenges: [],
      collaborates: ['promptengineer', 'analyst'],
    },
  },
];

// Get all patterns combined
export function getAllPatterns() {
  return {
    blueprints: TASK_BLUEPRINTS,
    behaviors: ROLE_BEHAVIORS,
  };
}

// Get pattern by ID
export function getPatternById(id: string): TaskBlueprint | RoleBehavior | undefined {
  return (
    TASK_BLUEPRINTS.find((p) => p.id === id) ||
    ROLE_BEHAVIORS.find((p) => p.id === id)
  );
}
