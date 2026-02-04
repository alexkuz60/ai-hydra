// Behavior Dictionaries for Role Pattern Editor
// Provides structured, localized options for triggers, behaviors, and formats

export interface DictionaryEntry {
  key: string;
  label: { ru: string; en: string };
  description?: { ru: string; en: string };
  category?: string;
}

export interface DictionaryCategory {
  key: string;
  label: { ru: string; en: string };
}

export interface Dictionary {
  entries: DictionaryEntry[];
  categories?: DictionaryCategory[];
}

// Trigger categories
export const TRIGGER_CATEGORIES: DictionaryCategory[] = [
  { key: 'dialogue', label: { ru: 'Диалог', en: 'Dialogue' } },
  { key: 'quality', label: { ru: 'Качество', en: 'Quality' } },
  { key: 'decisions', label: { ru: 'Решения', en: 'Decisions' } },
  { key: 'data', label: { ru: 'Данные', en: 'Data' } },
  { key: 'process', label: { ru: 'Процесс', en: 'Process' } },
];

// Trigger dictionary - categorized triggers for role reactions
export const TRIGGER_DICTIONARY: Dictionary = {
  categories: TRIGGER_CATEGORIES,
  entries: [
    // Dialogue category
    { key: 'unclear_question', label: { ru: 'Неясный вопрос', en: 'Unclear question' }, category: 'dialogue' },
    { key: 'complex_topic', label: { ru: 'Сложная тема', en: 'Complex topic' }, category: 'dialogue' },
    { key: 'vague_request', label: { ru: 'Размытый запрос', en: 'Vague request' }, category: 'dialogue' },
    { key: 'off_topic', label: { ru: 'Отклонение от темы', en: 'Off topic' }, category: 'dialogue' },
    { key: 'long_discussion', label: { ru: 'Затянувшееся обсуждение', en: 'Long discussion' }, category: 'dialogue' },
    { key: 'tension', label: { ru: 'Напряжённость', en: 'Tension' }, category: 'dialogue' },
    { key: 'greeting', label: { ru: 'Приветствие', en: 'Greeting' }, category: 'dialogue' },
    { key: 'thanks', label: { ru: 'Благодарность', en: 'Thanks' }, category: 'dialogue' },
    { key: 'frustration', label: { ru: 'Фрустрация пользователя', en: 'User frustration' }, category: 'dialogue' },
    
    // Quality category
    { key: 'weak_argument', label: { ru: 'Слабый аргумент', en: 'Weak argument' }, category: 'quality' },
    { key: 'missing_evidence', label: { ru: 'Отсутствие доказательств', en: 'Missing evidence' }, category: 'quality' },
    { key: 'overconfidence', label: { ru: 'Чрезмерная уверенность', en: 'Overconfidence' }, category: 'quality' },
    { key: 'bad_prompt', label: { ru: 'Плохой промпт', en: 'Bad prompt' }, category: 'quality' },
    { key: 'logical_error', label: { ru: 'Логическая ошибка', en: 'Logical error' }, category: 'quality' },
    { key: 'contradiction', label: { ru: 'Противоречие', en: 'Contradiction' }, category: 'quality' },
    { key: 'incomplete_answer', label: { ru: 'Неполный ответ', en: 'Incomplete answer' }, category: 'quality' },
    
    // Decisions category
    { key: 'conflict', label: { ru: 'Конфликт мнений', en: 'Conflict' }, category: 'decisions' },
    { key: 'consensus', label: { ru: 'Достигнут консенсус', en: 'Consensus reached' }, category: 'decisions' },
    { key: 'deadlock', label: { ru: 'Тупик', en: 'Deadlock' }, category: 'decisions' },
    { key: 'decision_needed', label: { ru: 'Требуется решение', en: 'Decision needed' }, category: 'decisions' },
    { key: 'multiple_options', label: { ru: 'Несколько вариантов', en: 'Multiple options' }, category: 'decisions' },
    { key: 'risk_detected', label: { ru: 'Обнаружен риск', en: 'Risk detected' }, category: 'decisions' },
    
    // Data category
    { key: 'data_available', label: { ru: 'Данные доступны', en: 'Data available' }, category: 'data' },
    { key: 'pattern_detected', label: { ru: 'Обнаружен паттерн', en: 'Pattern detected' }, category: 'data' },
    { key: 'anomaly', label: { ru: 'Аномалия', en: 'Anomaly' }, category: 'data' },
    { key: 'search_request', label: { ru: 'Поисковый запрос', en: 'Search request' }, category: 'data' },
    { key: 'missing_data', label: { ru: 'Недостаток данных', en: 'Missing data' }, category: 'data' },
    { key: 'outdated_info', label: { ru: 'Устаревшая информация', en: 'Outdated info' }, category: 'data' },
    
    // Process category
    { key: 'code_request', label: { ru: 'Запрос кода', en: 'Code request' }, category: 'process' },
    { key: 'new_task', label: { ru: 'Новая задача', en: 'New task' }, category: 'process' },
    { key: 'optimization_request', label: { ru: 'Запрос оптимизации', en: 'Optimization request' }, category: 'process' },
    { key: 'bottleneck', label: { ru: 'Узкое место', en: 'Bottleneck' }, category: 'process' },
    { key: 'complex_process', label: { ru: 'Сложный процесс', en: 'Complex process' }, category: 'process' },
    { key: 'deadline_pressure', label: { ru: 'Давление сроков', en: 'Deadline pressure' }, category: 'process' },
    { key: 'scope_creep', label: { ru: 'Расширение scope', en: 'Scope creep' }, category: 'process' },
  ],
};

// Behavior dictionary - response behaviors for triggers
export const BEHAVIOR_DICTIONARY: Dictionary = {
  entries: [
    // Clarification & structuring
    { key: 'ask_clarification', label: { ru: 'Запросить уточнение', en: 'Ask for clarification' } },
    { key: 'structure_response', label: { ru: 'Структурировать ответ', en: 'Structure the response' } },
    { key: 'provide_code', label: { ru: 'Предоставить код с комментариями', en: 'Provide code with comments' } },
    { key: 'break_down_steps', label: { ru: 'Разбить на шаги', en: 'Break down into steps' } },
    
    // Critical analysis
    { key: 'point_logical_errors', label: { ru: 'Указать на логические ошибки', en: 'Point out logical errors' } },
    { key: 'demand_justification', label: { ru: 'Потребовать обоснование', en: 'Demand justification' } },
    { key: 'give_counterexamples', label: { ru: 'Привести контрпримеры', en: 'Give counterexamples' } },
    { key: 'challenge_assumptions', label: { ru: 'Оспорить предположения', en: 'Challenge assumptions' } },
    
    // Mediation & consensus
    { key: 'synthesize_views', label: { ru: 'Синтезировать точки зрения', en: 'Synthesize viewpoints' } },
    { key: 'reinforce_consensus', label: { ru: 'Зафиксировать консенсус', en: 'Reinforce consensus' } },
    { key: 'suggest_compromise', label: { ru: 'Предложить компромисс', en: 'Suggest compromise' } },
    { key: 'de_escalate', label: { ru: 'Деэскалировать', en: 'De-escalate' } },
    
    // Expert responses
    { key: 'deep_expert_answer', label: { ru: 'Глубокий экспертный ответ', en: 'Deep expert answer' } },
    { key: 'conduct_interview', label: { ru: 'Провести интервью', en: 'Conduct interview' } },
    { key: 'offer_options', label: { ru: 'Предложить варианты с оценкой', en: 'Offer evaluated options' } },
    { key: 'provide_examples', label: { ru: 'Привести примеры', en: 'Provide examples' } },
    
    // Moderation
    { key: 'redirect_to_topic', label: { ru: 'Вернуть к теме', en: 'Redirect to topic' } },
    { key: 'summarize_interim', label: { ru: 'Подвести промежуточные итоги', en: 'Summarize interim results' } },
    { key: 'set_boundaries', label: { ru: 'Установить границы', en: 'Set boundaries' } },
    
    // Strategic advice
    { key: 'long_term_perspective', label: { ru: 'Долгосрочная перспектива', en: 'Long-term perspective' } },
    { key: 'warn_consequences', label: { ru: 'Предупредить о последствиях', en: 'Warn about consequences' } },
    { key: 'highlight_potential', label: { ru: 'Подсветить потенциал', en: 'Highlight potential' } },
    { key: 'risk_assessment', label: { ru: 'Оценить риски', en: 'Assess risks' } },
    
    // Information management
    { key: 'find_relevant_info', label: { ru: 'Найти релевантную информацию', en: 'Find relevant information' } },
    { key: 'systematize_materials', label: { ru: 'Систематизировать материалы', en: 'Systematize materials' } },
    { key: 'provide_archive_context', label: { ru: 'Контекст из архива', en: 'Provide archive context' } },
    { key: 'cite_sources', label: { ru: 'Сослаться на источники', en: 'Cite sources' } },
    
    // Analysis
    { key: 'statistical_analysis', label: { ru: 'Статистический анализ', en: 'Statistical analysis' } },
    { key: 'describe_pattern', label: { ru: 'Описать закономерность', en: 'Describe pattern' } },
    { key: 'investigate_anomaly', label: { ru: 'Исследовать отклонение', en: 'Investigate anomaly' } },
    { key: 'compare_alternatives', label: { ru: 'Сравнить альтернативы', en: 'Compare alternatives' } },
    
    // Search & research
    { key: 'formulate_queries', label: { ru: 'Сформулировать запросы', en: 'Formulate queries' } },
    { key: 'evaluate_sources', label: { ru: 'Оценить достоверность источников', en: 'Evaluate source credibility' } },
    { key: 'suggest_alternatives', label: { ru: 'Предложить альтернативы', en: 'Suggest alternatives' } },
    
    // Prompt engineering
    { key: 'explain_improve_prompt', label: { ru: 'Объяснить и улучшить промпт', en: 'Explain and improve prompt' } },
    { key: 'create_optimized_prompt', label: { ru: 'Создать оптимизированный промпт', en: 'Create optimized prompt' } },
    { key: 'ab_analysis', label: { ru: 'A/B анализ вариантов', en: 'A/B variant analysis' } },
    
    // Flow design
    { key: 'design_flow_diagram', label: { ru: 'Спроектировать flow-диаграмму', en: 'Design flow diagram' } },
    { key: 'optimize_route', label: { ru: 'Оптимизировать маршрут', en: 'Optimize route' } },
    { key: 'create_pipeline', label: { ru: 'Создать архитектуру потока', en: 'Create pipeline architecture' } },
  ],
};

// Format dictionary - output format preferences
export const FORMAT_DICTIONARY: Dictionary = {
  entries: [
    // Basic formats
    { key: 'markdown', label: { ru: 'Markdown', en: 'Markdown' } },
    { key: 'lists', label: { ru: 'Списки', en: 'Lists' } },
    { key: 'numbered_lists', label: { ru: 'Нумерованные списки', en: 'Numbered lists' } },
    { key: 'code_blocks', label: { ru: 'Блоки кода', en: 'Code blocks' } },
    { key: 'tables', label: { ru: 'Таблицы', en: 'Tables' } },
    { key: 'quotes', label: { ru: 'Цитаты', en: 'Quotes' } },
    
    // Analysis formats
    { key: 'counterarguments', label: { ru: 'Контраргументы', en: 'Counterarguments' } },
    { key: 'structured_summary', label: { ru: 'Структурированная сводка', en: 'Structured summary' } },
    { key: 'pros_cons', label: { ru: 'За и Против', en: 'Pros & Cons' } },
    { key: 'verdict', label: { ru: 'Вердикт', en: 'Verdict' } },
    { key: 'analysis', label: { ru: 'Анализ', en: 'Analysis' } },
    
    // Action-oriented
    { key: 'recommendations', label: { ru: 'Рекомендации', en: 'Recommendations' } },
    { key: 'alternatives', label: { ru: 'Альтернативы', en: 'Alternatives' } },
    { key: 'status_updates', label: { ru: 'Статусы', en: 'Status updates' } },
    { key: 'action_items', label: { ru: 'Пункты действий', en: 'Action items' } },
    { key: 'summaries', label: { ru: 'Сводки', en: 'Summaries' } },
    
    // Strategic
    { key: 'strategic_view', label: { ru: 'Стратегический взгляд', en: 'Strategic view' } },
    { key: 'consequences', label: { ru: 'Последствия', en: 'Consequences' } },
    { key: 'references', label: { ru: 'Ссылки', en: 'References' } },
    
    // Data-oriented
    { key: 'structured_data', label: { ru: 'Структурированные данные', en: 'Structured data' } },
    { key: 'indexes', label: { ru: 'Индексы', en: 'Indexes' } },
    { key: 'data_tables', label: { ru: 'Таблицы данных', en: 'Data tables' } },
    { key: 'charts_desc', label: { ru: 'Описания графиков', en: 'Charts description' } },
    { key: 'insights', label: { ru: 'Инсайты', en: 'Insights' } },
    
    // Research
    { key: 'links', label: { ru: 'Ссылки URL', en: 'URL links' } },
    { key: 'source_evaluation', label: { ru: 'Оценка источников', en: 'Source evaluation' } },
    
    // Prompt-related
    { key: 'prompt_templates', label: { ru: 'Шаблоны промптов', en: 'Prompt templates' } },
    { key: 'before_after', label: { ru: 'До/После', en: 'Before/After' } },
    { key: 'explanations', label: { ru: 'Объяснения', en: 'Explanations' } },
    
    // Visual/Flow
    { key: 'diagrams', label: { ru: 'Диаграммы', en: 'Diagrams' } },
    { key: 'flow_descriptions', label: { ru: 'Описания потоков', en: 'Flow descriptions' } },
    { key: 'optimization_tips', label: { ru: 'Советы по оптимизации', en: 'Optimization tips' } },
  ],
};

// Helper to get label by language
export function getEntryLabel(entry: DictionaryEntry, language: 'ru' | 'en'): string {
  return entry.label[language];
}

// Helper to find entry by key
export function findEntryByKey(dictionary: Dictionary, key: string): DictionaryEntry | undefined {
  return dictionary.entries.find(e => e.key === key);
}

// Helper to get category label
export function getCategoryLabel(dictionary: Dictionary, categoryKey: string, language: 'ru' | 'en'): string {
  const category = dictionary.categories?.find(c => c.key === categoryKey);
  return category?.label[language] || categoryKey;
}

// Helper to get entries by category
export function getEntriesByCategory(dictionary: Dictionary, categoryKey: string): DictionaryEntry[] {
  return dictionary.entries.filter(e => e.category === categoryKey);
}
