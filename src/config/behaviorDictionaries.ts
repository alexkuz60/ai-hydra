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
    { key: 'unclear_question', label: { ru: 'Неясный вопрос', en: 'Unclear question' }, description: { ru: 'Пользователь задал вопрос, который сложно интерпретировать', en: 'User asked a question that is hard to interpret' }, category: 'dialogue' },
    { key: 'complex_topic', label: { ru: 'Сложная тема', en: 'Complex topic' }, description: { ru: 'Обсуждаемая тема требует глубокой экспертизы', en: 'Topic requires deep expertise to discuss' }, category: 'dialogue' },
    { key: 'vague_request', label: { ru: 'Размытый запрос', en: 'Vague request' }, description: { ru: 'Запрос слишком общий, без конкретных деталей', en: 'Request is too general without specific details' }, category: 'dialogue' },
    { key: 'off_topic', label: { ru: 'Отклонение от темы', en: 'Off topic' }, description: { ru: 'Разговор ушёл в сторону от основной задачи', en: 'Conversation drifted away from the main task' }, category: 'dialogue' },
    { key: 'long_discussion', label: { ru: 'Затянувшееся обсуждение', en: 'Long discussion' }, description: { ru: 'Дискуссия идёт слишком долго без продвижения', en: 'Discussion going on too long without progress' }, category: 'dialogue' },
    { key: 'tension', label: { ru: 'Напряжённость', en: 'Tension' }, description: { ru: 'В обсуждении чувствуется конфликт или раздражение', en: 'Conflict or irritation is sensed in discussion' }, category: 'dialogue' },
    { key: 'greeting', label: { ru: 'Приветствие', en: 'Greeting' }, description: { ru: 'Пользователь начинает общение с приветствия', en: 'User starts conversation with a greeting' }, category: 'dialogue' },
    { key: 'thanks', label: { ru: 'Благодарность', en: 'Thanks' }, description: { ru: 'Пользователь выражает благодарность', en: 'User expresses gratitude' }, category: 'dialogue' },
    { key: 'frustration', label: { ru: 'Фрустрация пользователя', en: 'User frustration' }, description: { ru: 'Пользователь демонстрирует раздражение или разочарование', en: 'User shows irritation or disappointment' }, category: 'dialogue' },
    
    // Quality category
    { key: 'weak_argument', label: { ru: 'Слабый аргумент', en: 'Weak argument' }, description: { ru: 'Аргументация недостаточно обоснована', en: 'Argumentation is insufficiently justified' }, category: 'quality' },
    { key: 'missing_evidence', label: { ru: 'Отсутствие доказательств', en: 'Missing evidence' }, description: { ru: 'Утверждения не подкреплены фактами', en: 'Claims are not supported by facts' }, category: 'quality' },
    { key: 'overconfidence', label: { ru: 'Чрезмерная уверенность', en: 'Overconfidence' }, description: { ru: 'Слишком категоричные утверждения без оснований', en: 'Too categorical statements without grounds' }, category: 'quality' },
    { key: 'bad_prompt', label: { ru: 'Плохой промпт', en: 'Bad prompt' }, description: { ru: 'Промпт неэффективен или плохо структурирован', en: 'Prompt is ineffective or poorly structured' }, category: 'quality' },
    { key: 'logical_error', label: { ru: 'Логическая ошибка', en: 'Logical error' }, description: { ru: 'В рассуждениях присутствует логическая ошибка', en: 'Reasoning contains a logical error' }, category: 'quality' },
    { key: 'contradiction', label: { ru: 'Противоречие', en: 'Contradiction' }, description: { ru: 'Обнаружены взаимоисключающие утверждения', en: 'Mutually exclusive statements detected' }, category: 'quality' },
    { key: 'incomplete_answer', label: { ru: 'Неполный ответ', en: 'Incomplete answer' }, description: { ru: 'Ответ не охватывает все аспекты вопроса', en: 'Answer does not cover all aspects of the question' }, category: 'quality' },
    
    // Decisions category
    { key: 'conflict', label: { ru: 'Конфликт мнений', en: 'Conflict' }, description: { ru: 'Участники придерживаются противоположных позиций', en: 'Participants hold opposing positions' }, category: 'decisions' },
    { key: 'consensus', label: { ru: 'Достигнут консенсус', en: 'Consensus reached' }, description: { ru: 'Все стороны пришли к согласию', en: 'All parties have reached an agreement' }, category: 'decisions' },
    { key: 'deadlock', label: { ru: 'Тупик', en: 'Deadlock' }, description: { ru: 'Обсуждение зашло в тупик без решения', en: 'Discussion reached an impasse without resolution' }, category: 'decisions' },
    { key: 'decision_needed', label: { ru: 'Требуется решение', en: 'Decision needed' }, description: { ru: 'Необходимо принять конкретное решение', en: 'A specific decision needs to be made' }, category: 'decisions' },
    { key: 'multiple_options', label: { ru: 'Несколько вариантов', en: 'Multiple options' }, description: { ru: 'Есть несколько равнозначных вариантов решения', en: 'There are several equivalent solution options' }, category: 'decisions' },
    { key: 'risk_detected', label: { ru: 'Обнаружен риск', en: 'Risk detected' }, description: { ru: 'Выявлен потенциальный риск или угроза', en: 'Potential risk or threat identified' }, category: 'decisions' },
    
    // Data category
    { key: 'data_available', label: { ru: 'Данные доступны', en: 'Data available' }, description: { ru: 'Есть данные для анализа или обработки', en: 'Data is available for analysis or processing' }, category: 'data' },
    { key: 'pattern_detected', label: { ru: 'Обнаружен паттерн', en: 'Pattern detected' }, description: { ru: 'В данных выявлена закономерность', en: 'A pattern has been identified in the data' }, category: 'data' },
    { key: 'anomaly', label: { ru: 'Аномалия', en: 'Anomaly' }, description: { ru: 'Обнаружено отклонение от нормы', en: 'Deviation from the norm detected' }, category: 'data' },
    { key: 'search_request', label: { ru: 'Поисковый запрос', en: 'Search request' }, description: { ru: 'Требуется поиск информации', en: 'Information search is required' }, category: 'data' },
    { key: 'missing_data', label: { ru: 'Недостаток данных', en: 'Missing data' }, description: { ru: 'Для анализа не хватает информации', en: 'Not enough information for analysis' }, category: 'data' },
    { key: 'outdated_info', label: { ru: 'Устаревшая информация', en: 'Outdated info' }, description: { ru: 'Информация может быть неактуальной', en: 'Information may be outdated' }, category: 'data' },
    
    // Process category
    { key: 'code_request', label: { ru: 'Запрос кода', en: 'Code request' }, description: { ru: 'Пользователь просит написать или исправить код', en: 'User asks to write or fix code' }, category: 'process' },
    { key: 'new_task', label: { ru: 'Новая задача', en: 'New task' }, description: { ru: 'Поступила новая задача для выполнения', en: 'New task received for execution' }, category: 'process' },
    { key: 'optimization_request', label: { ru: 'Запрос оптимизации', en: 'Optimization request' }, description: { ru: 'Требуется оптимизировать решение или процесс', en: 'Need to optimize solution or process' }, category: 'process' },
    { key: 'bottleneck', label: { ru: 'Узкое место', en: 'Bottleneck' }, description: { ru: 'Обнаружено узкое место в процессе', en: 'Bottleneck detected in the process' }, category: 'process' },
    { key: 'complex_process', label: { ru: 'Сложный процесс', en: 'Complex process' }, description: { ru: 'Процесс требует декомпозиции на этапы', en: 'Process requires decomposition into stages' }, category: 'process' },
    { key: 'deadline_pressure', label: { ru: 'Давление сроков', en: 'Deadline pressure' }, description: { ru: 'Сроки поджимают, нужно ускориться', en: 'Deadlines are pressing, need to speed up' }, category: 'process' },
    { key: 'scope_creep', label: { ru: 'Расширение scope', en: 'Scope creep' }, description: { ru: 'Объём задачи неконтролируемо растёт', en: 'Task scope is growing uncontrollably' }, category: 'process' },
  ],
};

// Behavior dictionary - response behaviors for triggers
export const BEHAVIOR_DICTIONARY: Dictionary = {
  entries: [
    // Clarification & structuring
    { key: 'ask_clarification', label: { ru: 'Запросить уточнение', en: 'Ask for clarification' }, description: { ru: 'Задать уточняющие вопросы для понимания контекста', en: 'Ask clarifying questions to understand context' } },
    { key: 'structure_response', label: { ru: 'Структурировать ответ', en: 'Structure the response' }, description: { ru: 'Организовать ответ по разделам и пунктам', en: 'Organize response into sections and points' } },
    { key: 'provide_code', label: { ru: 'Предоставить код с комментариями', en: 'Provide code with comments' }, description: { ru: 'Написать код с подробными комментариями', en: 'Write code with detailed comments' } },
    { key: 'break_down_steps', label: { ru: 'Разбить на шаги', en: 'Break down into steps' }, description: { ru: 'Декомпозировать задачу на последовательные шаги', en: 'Decompose task into sequential steps' } },
    
    // Critical analysis
    { key: 'point_logical_errors', label: { ru: 'Указать на логические ошибки', en: 'Point out logical errors' }, description: { ru: 'Выявить и объяснить ошибки в рассуждениях', en: 'Identify and explain reasoning errors' } },
    { key: 'demand_justification', label: { ru: 'Потребовать обоснование', en: 'Demand justification' }, description: { ru: 'Запросить доказательства и аргументы', en: 'Request evidence and arguments' } },
    { key: 'give_counterexamples', label: { ru: 'Привести контрпримеры', en: 'Give counterexamples' }, description: { ru: 'Показать случаи, опровергающие утверждение', en: 'Show cases that disprove the statement' } },
    { key: 'challenge_assumptions', label: { ru: 'Оспорить предположения', en: 'Challenge assumptions' }, description: { ru: 'Проверить базовые предположения на обоснованность', en: 'Verify basic assumptions for validity' } },
    
    // Mediation & consensus
    { key: 'synthesize_views', label: { ru: 'Синтезировать точки зрения', en: 'Synthesize viewpoints' }, description: { ru: 'Объединить разные мнения в целостную картину', en: 'Combine different opinions into a coherent picture' } },
    { key: 'reinforce_consensus', label: { ru: 'Зафиксировать консенсус', en: 'Reinforce consensus' }, description: { ru: 'Чётко сформулировать достигнутое согласие', en: 'Clearly formulate the reached agreement' } },
    { key: 'suggest_compromise', label: { ru: 'Предложить компромисс', en: 'Suggest compromise' }, description: { ru: 'Найти решение, учитывающее все стороны', en: 'Find solution that considers all parties' } },
    { key: 'de_escalate', label: { ru: 'Деэскалировать', en: 'De-escalate' }, description: { ru: 'Снизить напряжённость в обсуждении', en: 'Reduce tension in the discussion' } },
    
    // Expert responses
    { key: 'deep_expert_answer', label: { ru: 'Глубокий экспертный ответ', en: 'Deep expert answer' }, description: { ru: 'Дать развёрнутый ответ с экспертной глубиной', en: 'Provide detailed answer with expert depth' } },
    { key: 'conduct_interview', label: { ru: 'Провести интервью', en: 'Conduct interview' }, description: { ru: 'Задать серию вопросов для сбора информации', en: 'Ask series of questions to gather information' } },
    { key: 'offer_options', label: { ru: 'Предложить варианты с оценкой', en: 'Offer evaluated options' }, description: { ru: 'Представить альтернативы с анализом плюсов и минусов', en: 'Present alternatives with pros and cons analysis' } },
    { key: 'provide_examples', label: { ru: 'Привести примеры', en: 'Provide examples' }, description: { ru: 'Проиллюстрировать идею конкретными примерами', en: 'Illustrate idea with concrete examples' } },
    
    // Moderation
    { key: 'redirect_to_topic', label: { ru: 'Вернуть к теме', en: 'Redirect to topic' }, description: { ru: 'Направить обсуждение обратно к основной теме', en: 'Guide discussion back to the main topic' } },
    { key: 'summarize_interim', label: { ru: 'Подвести промежуточные итоги', en: 'Summarize interim results' }, description: { ru: 'Резюмировать, что уже достигнуто', en: 'Summarize what has been achieved so far' } },
    { key: 'set_boundaries', label: { ru: 'Установить границы', en: 'Set boundaries' }, description: { ru: 'Определить рамки допустимого в обсуждении', en: 'Define boundaries of what is acceptable' } },
    
    // Strategic advice
    { key: 'long_term_perspective', label: { ru: 'Долгосрочная перспектива', en: 'Long-term perspective' }, description: { ru: 'Рассмотреть последствия в долгосрочной перспективе', en: 'Consider long-term consequences' } },
    { key: 'warn_consequences', label: { ru: 'Предупредить о последствиях', en: 'Warn about consequences' }, description: { ru: 'Указать на возможные негативные исходы', en: 'Point out possible negative outcomes' } },
    { key: 'highlight_potential', label: { ru: 'Подсветить потенциал', en: 'Highlight potential' }, description: { ru: 'Показать скрытые возможности и перспективы', en: 'Show hidden opportunities and prospects' } },
    { key: 'risk_assessment', label: { ru: 'Оценить риски', en: 'Assess risks' }, description: { ru: 'Проанализировать потенциальные риски решения', en: 'Analyze potential risks of the decision' } },
    
    // Information management
    { key: 'find_relevant_info', label: { ru: 'Найти релевантную информацию', en: 'Find relevant information' }, description: { ru: 'Отыскать информацию, относящуюся к вопросу', en: 'Find information related to the question' } },
    { key: 'systematize_materials', label: { ru: 'Систематизировать материалы', en: 'Systematize materials' }, description: { ru: 'Организовать информацию в структурированном виде', en: 'Organize information in a structured way' } },
    { key: 'provide_archive_context', label: { ru: 'Контекст из архива', en: 'Provide archive context' }, description: { ru: 'Добавить релевантный контекст из истории', en: 'Add relevant context from history' } },
    { key: 'cite_sources', label: { ru: 'Сослаться на источники', en: 'Cite sources' }, description: { ru: 'Указать источники информации', en: 'Indicate information sources' } },
    
    // Analysis
    { key: 'statistical_analysis', label: { ru: 'Статистический анализ', en: 'Statistical analysis' }, description: { ru: 'Провести количественный анализ данных', en: 'Conduct quantitative data analysis' } },
    { key: 'describe_pattern', label: { ru: 'Описать закономерность', en: 'Describe pattern' }, description: { ru: 'Объяснить выявленную закономерность', en: 'Explain the identified pattern' } },
    { key: 'investigate_anomaly', label: { ru: 'Исследовать отклонение', en: 'Investigate anomaly' }, description: { ru: 'Разобраться в причинах аномалии', en: 'Figure out the causes of the anomaly' } },
    { key: 'compare_alternatives', label: { ru: 'Сравнить альтернативы', en: 'Compare alternatives' }, description: { ru: 'Провести сравнительный анализ вариантов', en: 'Conduct comparative analysis of options' } },
    
    // Search & research
    { key: 'formulate_queries', label: { ru: 'Сформулировать запросы', en: 'Formulate queries' }, description: { ru: 'Составить эффективные поисковые запросы', en: 'Create effective search queries' } },
    { key: 'evaluate_sources', label: { ru: 'Оценить достоверность источников', en: 'Evaluate source credibility' }, description: { ru: 'Проверить надёжность источников информации', en: 'Check reliability of information sources' } },
    { key: 'suggest_alternatives', label: { ru: 'Предложить альтернативы', en: 'Suggest alternatives' }, description: { ru: 'Предложить другие варианты решения', en: 'Propose other solution options' } },
    
    // Prompt engineering
    { key: 'explain_improve_prompt', label: { ru: 'Объяснить и улучшить промпт', en: 'Explain and improve prompt' }, description: { ru: 'Проанализировать и оптимизировать промпт', en: 'Analyze and optimize the prompt' } },
    { key: 'create_optimized_prompt', label: { ru: 'Создать оптимизированный промпт', en: 'Create optimized prompt' }, description: { ru: 'Написать эффективный промпт с нуля', en: 'Write an effective prompt from scratch' } },
    { key: 'ab_analysis', label: { ru: 'A/B анализ вариантов', en: 'A/B variant analysis' }, description: { ru: 'Сравнить эффективность разных вариантов', en: 'Compare effectiveness of different variants' } },
    
    // Flow design
    { key: 'design_flow_diagram', label: { ru: 'Спроектировать flow-диаграмму', en: 'Design flow diagram' }, description: { ru: 'Создать визуальную схему процесса', en: 'Create visual process diagram' } },
    { key: 'optimize_route', label: { ru: 'Оптимизировать маршрут', en: 'Optimize route' }, description: { ru: 'Найти оптимальный путь выполнения', en: 'Find optimal execution path' } },
    { key: 'create_pipeline', label: { ru: 'Создать архитектуру потока', en: 'Create pipeline architecture' }, description: { ru: 'Спроектировать последовательность обработки', en: 'Design processing sequence' } },
  ],
};

// Format dictionary - output format preferences
export const FORMAT_DICTIONARY: Dictionary = {
  entries: [
    // Basic formats
    { key: 'markdown', label: { ru: 'Markdown', en: 'Markdown' }, description: { ru: 'Форматирование с заголовками, жирным, курсивом', en: 'Formatting with headers, bold, italic' } },
    { key: 'lists', label: { ru: 'Списки', en: 'Lists' }, description: { ru: 'Маркированные списки для перечислений', en: 'Bulleted lists for enumerations' } },
    { key: 'numbered_lists', label: { ru: 'Нумерованные списки', en: 'Numbered lists' }, description: { ru: 'Списки с порядковой нумерацией', en: 'Lists with ordinal numbering' } },
    { key: 'code_blocks', label: { ru: 'Блоки кода', en: 'Code blocks' }, description: { ru: 'Оформленные блоки с подсветкой синтаксиса', en: 'Formatted blocks with syntax highlighting' } },
    { key: 'tables', label: { ru: 'Таблицы', en: 'Tables' }, description: { ru: 'Табличное представление данных', en: 'Tabular data representation' } },
    { key: 'quotes', label: { ru: 'Цитаты', en: 'Quotes' }, description: { ru: 'Выделенные блоки цитат', en: 'Highlighted quote blocks' } },
    
    // Analysis formats
    { key: 'counterarguments', label: { ru: 'Контраргументы', en: 'Counterarguments' }, description: { ru: 'Аргументы против для баланса', en: 'Arguments against for balance' } },
    { key: 'structured_summary', label: { ru: 'Структурированная сводка', en: 'Structured summary' }, description: { ru: 'Организованное резюме по разделам', en: 'Organized summary by sections' } },
    { key: 'pros_cons', label: { ru: 'За и Против', en: 'Pros & Cons' }, description: { ru: 'Сравнение преимуществ и недостатков', en: 'Comparison of advantages and disadvantages' } },
    { key: 'verdict', label: { ru: 'Вердикт', en: 'Verdict' }, description: { ru: 'Итоговое заключение или решение', en: 'Final conclusion or decision' } },
    { key: 'analysis', label: { ru: 'Анализ', en: 'Analysis' }, description: { ru: 'Детальный разбор вопроса', en: 'Detailed breakdown of the issue' } },
    
    // Action-oriented
    { key: 'recommendations', label: { ru: 'Рекомендации', en: 'Recommendations' }, description: { ru: 'Конкретные советы к действию', en: 'Specific actionable advice' } },
    { key: 'alternatives', label: { ru: 'Альтернативы', en: 'Alternatives' }, description: { ru: 'Варианты выбора с описанием', en: 'Choice options with descriptions' } },
    { key: 'status_updates', label: { ru: 'Статусы', en: 'Status updates' }, description: { ru: 'Обновления о прогрессе', en: 'Progress updates' } },
    { key: 'action_items', label: { ru: 'Пункты действий', en: 'Action items' }, description: { ru: 'Конкретные задачи к выполнению', en: 'Specific tasks to complete' } },
    { key: 'summaries', label: { ru: 'Сводки', en: 'Summaries' }, description: { ru: 'Краткие выжимки ключевых моментов', en: 'Brief extracts of key points' } },
    
    // Strategic
    { key: 'strategic_view', label: { ru: 'Стратегический взгляд', en: 'Strategic view' }, description: { ru: 'Долгосрочная перспектива решения', en: 'Long-term solution perspective' } },
    { key: 'consequences', label: { ru: 'Последствия', en: 'Consequences' }, description: { ru: 'Анализ возможных результатов', en: 'Analysis of possible outcomes' } },
    { key: 'references', label: { ru: 'Ссылки', en: 'References' }, description: { ru: 'Ссылки на источники и материалы', en: 'Links to sources and materials' } },
    
    // Data-oriented
    { key: 'structured_data', label: { ru: 'Структурированные данные', en: 'Structured data' }, description: { ru: 'Данные в формате JSON, YAML и т.п.', en: 'Data in JSON, YAML format, etc.' } },
    { key: 'indexes', label: { ru: 'Индексы', en: 'Indexes' }, description: { ru: 'Указатели и оглавления', en: 'Pointers and tables of contents' } },
    { key: 'data_tables', label: { ru: 'Таблицы данных', en: 'Data tables' }, description: { ru: 'Таблицы с числовыми данными', en: 'Tables with numerical data' } },
    { key: 'charts_desc', label: { ru: 'Описания графиков', en: 'Charts description' }, description: { ru: 'Текстовое описание визуализаций', en: 'Text description of visualizations' } },
    { key: 'insights', label: { ru: 'Инсайты', en: 'Insights' }, description: { ru: 'Ключевые выводы из анализа', en: 'Key findings from analysis' } },
    
    // Research
    { key: 'links', label: { ru: 'Ссылки URL', en: 'URL links' }, description: { ru: 'Гиперссылки на внешние ресурсы', en: 'Hyperlinks to external resources' } },
    { key: 'source_evaluation', label: { ru: 'Оценка источников', en: 'Source evaluation' }, description: { ru: 'Анализ достоверности источников', en: 'Source credibility analysis' } },
    
    // Prompt-related
    { key: 'prompt_templates', label: { ru: 'Шаблоны промптов', en: 'Prompt templates' }, description: { ru: 'Готовые шаблоны для переиспользования', en: 'Ready templates for reuse' } },
    { key: 'before_after', label: { ru: 'До/После', en: 'Before/After' }, description: { ru: 'Сравнение исходного и улучшенного', en: 'Comparison of original and improved' } },
    { key: 'explanations', label: { ru: 'Объяснения', en: 'Explanations' }, description: { ru: 'Подробные разъяснения концепций', en: 'Detailed concept explanations' } },
    
    // Visual/Flow
    { key: 'diagrams', label: { ru: 'Диаграммы', en: 'Diagrams' }, description: { ru: 'Визуальные схемы и диаграммы', en: 'Visual schemes and diagrams' } },
    { key: 'flow_descriptions', label: { ru: 'Описания потоков', en: 'Flow descriptions' }, description: { ru: 'Описание последовательности шагов', en: 'Description of step sequences' } },
    { key: 'optimization_tips', label: { ru: 'Советы по оптимизации', en: 'Optimization tips' }, description: { ru: 'Рекомендации по улучшению', en: 'Improvement recommendations' } },
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
