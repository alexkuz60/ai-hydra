// Prompt Editor Dictionaries
// Provides structured, localized snippets for prompt sections

import type { DictionaryEntry, DictionaryCategory, Dictionary } from './behaviorDictionaries';

// ================== SECTION MAPPING ==================
// Maps which dictionaries apply to which prompt sections
export const SECTION_DICTIONARIES: Record<string, string[]> = {
  identity: ['tone'],
  competencies: ['aspects'],
  methodology: ['aspects', 'instructions'],
  format: ['formats', 'instructions'],
  teamwork: ['tone'],
  limitations: ['instructions'],
  supervisor: ['instructions', 'formats', 'tone'],
  custom: ['instructions', 'formats'],
};

// ================== TYPICAL INSTRUCTIONS ==================
export const INSTRUCTION_CATEGORIES: DictionaryCategory[] = [
  { key: 'depth', label: { ru: 'Глубина', en: 'Depth' } },
  { key: 'structure', label: { ru: 'Структура', en: 'Structure' } },
  { key: 'focus', label: { ru: 'Фокус', en: 'Focus' } },
  { key: 'style', label: { ru: 'Стиль', en: 'Style' } },
];

export const INSTRUCTIONS_DICTIONARY: Dictionary = {
  categories: INSTRUCTION_CATEGORIES,
  entries: [
    // Depth category
    { 
      key: 'max_details', 
      label: { ru: 'Максимум деталей', en: 'Maximum details' }, 
      description: { ru: 'Предоставляй развёрнутые, детализированные ответы', en: 'Provide comprehensive, detailed responses' },
      category: 'depth',
    },
    { 
      key: 'key_points_only', 
      label: { ru: 'Только ключевые тезисы', en: 'Key points only' }, 
      description: { ru: 'Фокусируйся на самом важном, опуская детали', en: 'Focus on the essentials, skip details' },
      category: 'depth',
    },
    { 
      key: 'brief_summary', 
      label: { ru: 'Краткое резюме', en: 'Brief summary' }, 
      description: { ru: 'Давай сжатый обзор в 2-3 предложения', en: 'Provide a concise overview in 2-3 sentences' },
      category: 'depth',
    },
    { 
      key: 'deep_dive', 
      label: { ru: 'Глубокое погружение', en: 'Deep dive' }, 
      description: { ru: 'Исследуй тему до мельчайших подробностей', en: 'Explore the topic to the finest detail' },
      category: 'depth',
    },
    
    // Structure category
    { 
      key: 'step_by_step', 
      label: { ru: 'Пошаговая инструкция', en: 'Step-by-step' }, 
      description: { ru: 'Структурируй ответ как нумерованную последовательность шагов', en: 'Structure response as numbered sequence of steps' },
      category: 'structure',
    },
    { 
      key: 'compare_options', 
      label: { ru: 'Сравни варианты', en: 'Compare options' }, 
      description: { ru: 'Представь альтернативы с анализом плюсов и минусов', en: 'Present alternatives with pros and cons analysis' },
      category: 'structure',
    },
    { 
      key: 'practical_steps', 
      label: { ru: 'Практические шаги', en: 'Practical steps' }, 
      description: { ru: 'Сосредоточься на конкретных действиях, которые можно выполнить', en: 'Focus on concrete actionable steps' },
      category: 'structure',
    },
    { 
      key: 'checklist', 
      label: { ru: 'Чек-лист', en: 'Checklist' }, 
      description: { ru: 'Оформи в виде списка для проверки', en: 'Format as a verification checklist' },
      category: 'structure',
    },
    { 
      key: 'decision_tree', 
      label: { ru: 'Дерево решений', en: 'Decision tree' }, 
      description: { ru: 'Покажи логику выбора через условия «если-то»', en: 'Show decision logic through if-then conditions' },
      category: 'structure',
    },
    
    // Focus category
    { 
      key: 'focus_problem', 
      label: { ru: 'Фокус на проблеме', en: 'Focus on problem' }, 
      description: { ru: 'Сначала чётко сформулируй проблему, потом решение', en: 'First clearly state the problem, then the solution' },
      category: 'focus',
    },
    { 
      key: 'focus_solution', 
      label: { ru: 'Фокус на решении', en: 'Focus on solution' }, 
      description: { ru: 'Сразу переходи к решению без длинных преамбул', en: 'Jump straight to solution without long preambles' },
      category: 'focus',
    },
    { 
      key: 'ask_before_answer', 
      label: { ru: 'Сначала уточни', en: 'Ask before answering' }, 
      description: { ru: 'При неясностях задавай вопросы перед ответом', en: 'Ask clarifying questions before answering if unclear' },
      category: 'focus',
    },
    { 
      key: 'examples_first', 
      label: { ru: 'Сначала примеры', en: 'Examples first' }, 
      description: { ru: 'Начинай с конкретных примеров, потом обобщай', en: 'Start with concrete examples, then generalize' },
      category: 'focus',
    },
    { 
      key: 'theory_first', 
      label: { ru: 'Сначала теория', en: 'Theory first' }, 
      description: { ru: 'Начинай с концепций и принципов, потом практика', en: 'Start with concepts and principles, then practice' },
      category: 'focus',
    },
    
    // Style category
    { 
      key: 'explain_simply', 
      label: { ru: 'Объясни простым языком', en: 'Explain simply' }, 
      description: { ru: 'Избегай жаргона, объясняй как неспециалисту', en: 'Avoid jargon, explain as if to a non-specialist' },
      category: 'style',
    },
    { 
      key: 'be_critical', 
      label: { ru: 'Будь критичен', en: 'Be critical' }, 
      description: { ru: 'Указывай на слабые места и возможные проблемы', en: 'Point out weaknesses and potential issues' },
      category: 'style',
    },
    { 
      key: 'be_encouraging', 
      label: { ru: 'Поддерживающий тон', en: 'Be encouraging' }, 
      description: { ru: 'Подчёркивай сильные стороны и возможности', en: 'Emphasize strengths and opportunities' },
      category: 'style',
    },
    { 
      key: 'no_fluff', 
      label: { ru: 'Без воды', en: 'No fluff' }, 
      description: { ru: 'Избегай вводных фраз и лишних оборотов', en: 'Avoid introductory phrases and filler' },
      category: 'style',
    },
    { 
      key: 'cite_sources', 
      label: { ru: 'Ссылайся на источники', en: 'Cite sources' }, 
      description: { ru: 'Указывай, откуда взята информация', en: 'Indicate where information comes from' },
      category: 'style',
    },
  ],
};

// ================== RESPONSE FORMATS ==================
export const FORMAT_CATEGORIES: DictionaryCategory[] = [
  { key: 'text', label: { ru: 'Текстовые', en: 'Text' } },
  { key: 'structured', label: { ru: 'Структурированные', en: 'Structured' } },
  { key: 'visual', label: { ru: 'Визуальные', en: 'Visual' } },
];

export const FORMATS_DICTIONARY: Dictionary = {
  categories: FORMAT_CATEGORIES,
  entries: [
    // Text formats
    { 
      key: 'markdown', 
      label: { ru: 'Markdown', en: 'Markdown' }, 
      description: { ru: 'Используй Markdown-разметку для форматирования', en: 'Use Markdown formatting' },
      category: 'text',
    },
    { 
      key: 'plain_text', 
      label: { ru: 'Простой текст', en: 'Plain text' }, 
      description: { ru: 'Без форматирования, чистый текст', en: 'No formatting, plain text only' },
      category: 'text',
    },
    { 
      key: 'narrative', 
      label: { ru: 'Повествование', en: 'Narrative' }, 
      description: { ru: 'Связный текст с плавными переходами', en: 'Cohesive text with smooth transitions' },
      category: 'text',
    },
    { 
      key: 'dialogue', 
      label: { ru: 'Диалоговый формат', en: 'Dialogue format' }, 
      description: { ru: 'Структура вопрос-ответ', en: 'Question-answer structure' },
      category: 'text',
    },
    
    // Structured formats
    { 
      key: 'bulleted_list', 
      label: { ru: 'Маркированный список', en: 'Bulleted list' }, 
      description: { ru: 'Оформи как список с пунктами (•)', en: 'Format as bulleted list' },
      category: 'structured',
    },
    { 
      key: 'numbered_list', 
      label: { ru: 'Нумерованный список', en: 'Numbered list' }, 
      description: { ru: 'Оформи как пронумерованный список (1, 2, 3...)', en: 'Format as numbered list' },
      category: 'structured',
    },
    { 
      key: 'table', 
      label: { ru: 'Таблица', en: 'Table' }, 
      description: { ru: 'Используй табличный формат для сравнений', en: 'Use table format for comparisons' },
      category: 'structured',
    },
    { 
      key: 'json', 
      label: { ru: 'JSON', en: 'JSON' }, 
      description: { ru: 'Структурированные данные в формате JSON', en: 'Structured data in JSON format' },
      category: 'structured',
    },
    { 
      key: 'yaml', 
      label: { ru: 'YAML', en: 'YAML' }, 
      description: { ru: 'Конфигурационный формат YAML', en: 'YAML configuration format' },
      category: 'structured',
    },
    { 
      key: 'headers_sections', 
      label: { ru: 'Разделы с заголовками', en: 'Sections with headers' }, 
      description: { ru: 'Организуй через заголовки H2/H3', en: 'Organize with H2/H3 headers' },
      category: 'structured',
    },
    
    // Visual formats
    { 
      key: 'mermaid_diagram', 
      label: { ru: 'Mermaid-диаграмма', en: 'Mermaid diagram' }, 
      description: { ru: 'Визуализируй через Mermaid (flowchart, sequence)', en: 'Visualize with Mermaid (flowchart, sequence)' },
      category: 'visual',
    },
    { 
      key: 'code_blocks', 
      label: { ru: 'Блоки кода', en: 'Code blocks' }, 
      description: { ru: 'Оформляй код в блоках с подсветкой синтаксиса', en: 'Format code in blocks with syntax highlighting' },
      category: 'visual',
    },
    { 
      key: 'ascii_art', 
      label: { ru: 'ASCII-схема', en: 'ASCII diagram' }, 
      description: { ru: 'Простая текстовая визуализация', en: 'Simple text-based visualization' },
      category: 'visual',
    },
  ],
};

// ================== ASPECTS (COMPETENCIES/METHODOLOGY) ==================
export const ASPECT_CATEGORIES: DictionaryCategory[] = [
  { key: 'cognitive', label: { ru: 'Когнитивные', en: 'Cognitive' } },
  { key: 'technical', label: { ru: 'Технические', en: 'Technical' } },
  { key: 'communication', label: { ru: 'Коммуникативные', en: 'Communication' } },
];

export const ASPECTS_DICTIONARY: Dictionary = {
  categories: ASPECT_CATEGORIES,
  entries: [
    // Cognitive aspects
    { 
      key: 'analysis', 
      label: { ru: 'Анализ', en: 'Analysis' }, 
      description: { ru: 'Разбор информации на составляющие', en: 'Breaking down information into components' },
      category: 'cognitive',
    },
    { 
      key: 'synthesis', 
      label: { ru: 'Синтез', en: 'Synthesis' }, 
      description: { ru: 'Объединение частей в целое', en: 'Combining parts into a whole' },
      category: 'cognitive',
    },
    { 
      key: 'criticism', 
      label: { ru: 'Критика', en: 'Criticism' }, 
      description: { ru: 'Объективная оценка слабых сторон', en: 'Objective assessment of weaknesses' },
      category: 'cognitive',
    },
    { 
      key: 'abstraction', 
      label: { ru: 'Абстракция', en: 'Abstraction' }, 
      description: { ru: 'Выделение общих принципов', en: 'Extracting general principles' },
      category: 'cognitive',
    },
    { 
      key: 'pattern_recognition', 
      label: { ru: 'Распознавание паттернов', en: 'Pattern recognition' }, 
      description: { ru: 'Выявление закономерностей в данных', en: 'Identifying patterns in data' },
      category: 'cognitive',
    },
    { 
      key: 'creative_thinking', 
      label: { ru: 'Креативное мышление', en: 'Creative thinking' }, 
      description: { ru: 'Генерация нестандартных решений', en: 'Generating non-standard solutions' },
      category: 'cognitive',
    },
    { 
      key: 'logical_reasoning', 
      label: { ru: 'Логическое рассуждение', en: 'Logical reasoning' }, 
      description: { ru: 'Построение обоснованных выводов', en: 'Building justified conclusions' },
      category: 'cognitive',
    },
    
    // Technical aspects
    { 
      key: 'research', 
      label: { ru: 'Исследование', en: 'Research' }, 
      description: { ru: 'Поиск и сбор информации', en: 'Searching and gathering information' },
      category: 'technical',
    },
    { 
      key: 'planning', 
      label: { ru: 'Планирование', en: 'Planning' }, 
      description: { ru: 'Разработка плана действий', en: 'Developing action plan' },
      category: 'technical',
    },
    { 
      key: 'optimization', 
      label: { ru: 'Оптимизация', en: 'Optimization' }, 
      description: { ru: 'Улучшение эффективности', en: 'Improving efficiency' },
      category: 'technical',
    },
    { 
      key: 'debugging', 
      label: { ru: 'Отладка', en: 'Debugging' }, 
      description: { ru: 'Поиск и устранение ошибок', en: 'Finding and fixing errors' },
      category: 'technical',
    },
    { 
      key: 'documentation', 
      label: { ru: 'Документирование', en: 'Documentation' }, 
      description: { ru: 'Фиксация знаний и процессов', en: 'Recording knowledge and processes' },
      category: 'technical',
    },
    { 
      key: 'implementation', 
      label: { ru: 'Реализация', en: 'Implementation' }, 
      description: { ru: 'Воплощение идей в жизнь', en: 'Bringing ideas to life' },
      category: 'technical',
    },
    
    // Communication aspects
    { 
      key: 'explanation', 
      label: { ru: 'Объяснение', en: 'Explanation' }, 
      description: { ru: 'Передача знаний понятным языком', en: 'Conveying knowledge in clear language' },
      category: 'communication',
    },
    { 
      key: 'facilitation', 
      label: { ru: 'Фасилитация', en: 'Facilitation' }, 
      description: { ru: 'Направление групповой работы', en: 'Guiding group work' },
      category: 'communication',
    },
    { 
      key: 'mediation', 
      label: { ru: 'Медиация', en: 'Mediation' }, 
      description: { ru: 'Разрешение конфликтов', en: 'Conflict resolution' },
      category: 'communication',
    },
    { 
      key: 'feedback', 
      label: { ru: 'Обратная связь', en: 'Feedback' }, 
      description: { ru: 'Конструктивная оценка результатов', en: 'Constructive evaluation of results' },
      category: 'communication',
    },
    { 
      key: 'interviewing', 
      label: { ru: 'Интервьюирование', en: 'Interviewing' }, 
      description: { ru: 'Сбор информации через вопросы', en: 'Gathering information through questions' },
      category: 'communication',
    },
  ],
};

// ================== COMMUNICATION TONE ==================
export const TONE_DICTIONARY: Dictionary = {
  entries: [
    { 
      key: 'formal', 
      label: { ru: 'Формальный', en: 'Formal' }, 
      description: { ru: 'Официальный, деловой стиль общения', en: 'Official, business communication style' },
    },
    { 
      key: 'friendly', 
      label: { ru: 'Дружелюбный', en: 'Friendly' }, 
      description: { ru: 'Тёплый, поддерживающий тон', en: 'Warm, supportive tone' },
    },
    { 
      key: 'neutral', 
      label: { ru: 'Нейтральный', en: 'Neutral' }, 
      description: { ru: 'Сбалансированный, объективный тон', en: 'Balanced, objective tone' },
    },
    { 
      key: 'provocative', 
      label: { ru: 'Провокационный', en: 'Provocative' }, 
      description: { ru: 'Вызывающий, побуждающий к размышлению', en: 'Challenging, thought-provoking' },
    },
    { 
      key: 'academic', 
      label: { ru: 'Академический', en: 'Academic' }, 
      description: { ru: 'Научный стиль с терминологией', en: 'Scientific style with terminology' },
    },
    { 
      key: 'conversational', 
      label: { ru: 'Разговорный', en: 'Conversational' }, 
      description: { ru: 'Как живой диалог', en: 'Like a live conversation' },
    },
    { 
      key: 'mentoring', 
      label: { ru: 'Менторский', en: 'Mentoring' }, 
      description: { ru: 'Наставнический, обучающий', en: 'Guiding, educational' },
    },
    { 
      key: 'socratic', 
      label: { ru: 'Сократический', en: 'Socratic' }, 
      description: { ru: 'Через наводящие вопросы', en: 'Through leading questions' },
    },
  ],
};

// ================== EXPORT ALL DICTIONARIES ==================
export const PROMPT_DICTIONARIES = {
  instructions: INSTRUCTIONS_DICTIONARY,
  formats: FORMATS_DICTIONARY,
  aspects: ASPECTS_DICTIONARY,
  tone: TONE_DICTIONARY,
} as const;

export type PromptDictionaryKey = keyof typeof PROMPT_DICTIONARIES;

// Helper to get dictionaries for a specific section
export function getDictionariesForSection(sectionKey: string): PromptDictionaryKey[] {
  const keys = SECTION_DICTIONARIES[sectionKey] || SECTION_DICTIONARIES.custom;
  return keys as PromptDictionaryKey[];
}

// Helper to get dictionary display name
export function getDictionaryLabel(key: PromptDictionaryKey, lang: 'ru' | 'en'): string {
  const labels: Record<PromptDictionaryKey, { ru: string; en: string }> = {
    instructions: { ru: 'Типичные указания', en: 'Typical Instructions' },
    formats: { ru: 'Форматы ответов', en: 'Response Formats' },
    aspects: { ru: 'Аспекты', en: 'Aspects' },
    tone: { ru: 'Тон коммуникации', en: 'Communication Tone' },
  };
  return labels[key][lang];
}
