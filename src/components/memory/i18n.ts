import { useLanguage } from '@/contexts/LanguageContext';

const dict: Record<string, { ru: string; en: string }> = {
  // MemoryGraphTab
  'graph.hydra': { ru: 'Гидра', en: 'Hydra' },
  'graph.title': { ru: 'Граф памяти', en: 'Memory Graph' },

  // CognitiveArsenalTab
  'arsenal.title': { ru: 'Когнитивный арсенал Гидры', en: "Hydra's Cognitive Arsenal" },
  'arsenal.objects': { ru: 'объектов', en: 'objects' },
  'arsenal.summary': { ru: 'Инстинкты · Паттерны · Инструменты · Достижения · Память', en: 'Instincts · Patterns · Tools · Achievements · Memory' },

  // Layers
  'layer.instincts': { ru: 'Инстинкты', en: 'Instincts' },
  'layer.instinctsDesc': { ru: 'Системные промпты и правила', en: 'System prompts and rules' },
  'layer.patterns': { ru: 'Паттерны мышления', en: 'Thinking Patterns' },
  'layer.patternsDesc': { ru: 'Шаблоны задач и поведение', en: 'Task blueprints and behaviors' },
  'layer.tools': { ru: 'Арсенал инструментов', en: 'Tool Arsenal' },
  'layer.toolsDesc': { ru: 'Промпт-штампы и HTTP API', en: 'Prompt stamps and HTTP API' },
  'layer.flows': { ru: 'Потоки мыслей', en: 'Thought Flows' },
  'layer.flowsDesc': { ru: 'Схемы логики и оркестрации ИИ', en: 'AI logic and orchestration diagrams' },
  'layer.achievements': { ru: 'Достижения', en: 'Achievements' },
  'layer.achievementsDesc': { ru: 'Собеседования и конкурсы', en: 'Interviews and contests' },
  'layer.memory': { ru: 'Долгосрочная память', en: 'Long-term Memory' },
  'layer.memoryDesc': { ru: 'Опыт ролей · база знаний RAG · контекст сессий', en: 'Role experience · RAG knowledge · session context' },

  // Layer items
  'item.system': { ru: 'Системных', en: 'System' },
  'item.custom': { ru: 'Пользовательских', en: 'Custom' },
  'item.blueprints': { ru: 'Шаблонов задач', en: 'Blueprints' },
  'item.behaviors': { ru: 'Профилей поведения', en: 'Behaviors' },
  'item.promptStamps': { ru: 'Промпт-штампы', en: 'Prompt stamps' },
  'item.httpApi': { ru: 'HTTP API', en: 'HTTP API' },
  'item.flowDiagrams': { ru: 'Схем потоков', en: 'Flow diagrams' },
  'item.interviews': { ru: 'Собеседований', en: 'Interviews' },
  'item.contests': { ru: 'Конкурсов', en: 'Contests' },
  'item.roleMemory': { ru: 'Опыт ролей', en: 'Role memory' },
  'item.knowledge': { ru: 'База знаний', en: 'Knowledge' },
  'item.sessionMemory': { ru: 'Сессии', en: 'Session memory' },

  // Layer actions
  'action.createPrompt': { ru: 'Создать промпт', en: 'Create prompt' },
  'action.createBlueprint': { ru: 'Создать шаблон', en: 'Create blueprint' },
  'action.createTool': { ru: 'Создать инструмент', en: 'Create tool' },
  'action.newFlow': { ru: 'Новая схема', en: 'New flow' },
  'action.interview': { ru: 'Собеседование', en: 'Interview' },
  'action.contest': { ru: 'Конкурс', en: 'Contest' },
  'action.clearSessions': { ru: 'Очистить сессии', en: 'Clear sessions' },
  'action.confirm': { ru: 'Подтвердить', en: 'Confirm' },

  // CognitiveArsenalTab - memory tooltip
  'tooltip.memoryTitle': { ru: 'Три слоя долгосрочной памяти:', en: 'Three layers of long-term memory:' },
  'tooltip.roleExpTitle': { ru: '🧠 Опыт ролей', en: '🧠 Role Experience' },
  'tooltip.roleExpDesc': { ru: 'Поведенческие паттерны, стиль общения и предпочтения каждой роли, накопленные в ходе сессий', en: 'Behavioral patterns, communication style and preferences for each role, accumulated through sessions' },
  'tooltip.ragTitle': { ru: '📚 База знаний RAG', en: '📚 RAG Knowledge Base' },
  'tooltip.ragDesc': { ru: 'Семантически индексированные документы и факты, используемые для контекстного поиска при генерации ответов', en: 'Semantically indexed documents and facts used for contextual retrieval during response generation' },
  'tooltip.sessionTitle': { ru: '💬 Контекст сессий', en: '💬 Session Context' },
  'tooltip.sessionDesc': { ru: 'Чанки диалогов, решения и инсайты из прошлых сессий, доступные для повторного использования', en: 'Conversation chunks, decisions and insights from past sessions, available for reuse' },

  // Session memory clear
  'sessionCleared': { ru: 'Память сессий очищена', en: 'Session memory cleared' },
  'sessionClearError': { ru: 'Ошибка очистки памяти', en: 'Failed to clear memory' },

  // ChroniclesTab
  'chronicles.agreed': { ru: '✅ Согласен', en: '✅ Agreed' },
  'chronicles.wish': { ru: '💬 Пожелание', en: '💬 User Wish' },
  'chronicles.disagreed': { ru: '❌ Не согласен', en: '❌ Disagreed' },
  'chronicles.pending': { ru: '⏳ Ожидает', en: '⏳ Pending' },
  'chronicles.revised': { ru: '🔄 Пересмотрено ИИ', en: '🔄 AI Revised' },

  'chronicles.statusCompleted': { ru: 'Выполнено', en: 'Completed' },
  'chronicles.statusPending': { ru: 'Ожидает тестирования', en: 'Awaiting Testing' },
  'chronicles.statusSample': { ru: 'Образцовая запись', en: 'Sample Entry' },
  'chronicles.statusRevised': { ru: 'Пересмотрено ИИ', en: 'AI Revised' },

  'chronicles.saveError': { ru: 'Ошибка сохранения', en: 'Save failed' },
  'chronicles.promptUpdated': { ru: 'Промпт обновлён', en: 'Prompt updated' },

  // Evolutioner prompts
  'evo.title': { ru: 'Промпты Эволюционера', en: "Evolutioner's Prompts" },
  'evo.supervisorOnly': { ru: 'только Супервизор', en: 'Supervisor only' },
  'evo.hint': { ru: 'Роль-специфичные шаблоны для авторевизии. Нажмите, чтобы раскрыть и отредактировать.', en: 'Role-specific templates for auto-revision. Click to expand and edit.' },
  'evo.placeholders': {
    ru: 'Шаблоны используют плейсхолдеры: {{entry_code}}, {{title}}, {{role_object}}, {{hypothesis}}, {{metrics_before}}, {{metrics_after}}, {{supervisor_comment}}, {{summary}} — для записей Хроник; и {{model_id}}, {{user_score}}, {{arbiter_score}}, {{delta}}, {{threshold}}, {{round_prompt}}, {{direction}} — для расхождений конкурса.',
    en: 'Templates use placeholders: {{entry_code}}, {{title}}, {{role_object}}, {{hypothesis}}, etc. for chronicle entries; {{model_id}}, {{user_score}}, {{arbiter_score}}, {{delta}}, etc. for contest discrepancies.',
  },
  'evo.updated': { ru: 'обн.', en: 'upd.' },
  'evo.edit': { ru: 'Изменить', en: 'Edit' },
  'evo.cancel': { ru: 'Отмена', en: 'Cancel' },
  'evo.save': { ru: 'Сохранить', en: 'Save' },

  // Prompt labels
  'prompt.contestDiscrepancy': { ru: 'Расхождение оценок (Конкурс)', en: 'Score Discrepancy (Contest)' },
  'prompt.rejectedDefault': { ru: 'Отклонение (универсальный)', en: 'Rejected (default)' },
  'prompt.rejectedTechnoarbiter': { ru: 'Отклонение → ТехноАрбитр', en: 'Rejected → TechnoArbiter' },
  'prompt.rejectedTechnocritic': { ru: 'Отклонение → ТехноКритик', en: 'Rejected → TechnoCritic' },
  'prompt.rejectedGuide': { ru: 'Отклонение → Гид', en: 'Rejected → Guide' },

  // DualGraphsTab
  'dualGraph.connectionsTitle': { ru: 'Граф связей', en: 'Connections Graph' },
  'dualGraph.connectionsHint': { ru: 'Роли как мосты между слоями', en: 'Roles as bridges between layers' },
  'dualGraph.prompts': { ru: 'Промпты', en: 'Prompts' },
  'dualGraph.memory': { ru: 'Память', en: 'Memory' },
  'dualGraph.knowledge': { ru: 'Знания', en: 'Knowledge' },
  'dualGraph.objectsCount': { ru: 'Объектов', en: 'Objects' },

  // DualGraphsTab layer labels (short)
  'dualGraph.layerInstincts': { ru: 'Инстинкты', en: 'Instincts' },
  'dualGraph.layerPatterns': { ru: 'Паттерны', en: 'Patterns' },
  'dualGraph.layerTools': { ru: 'Инструменты', en: 'Tools' },
  'dualGraph.layerFlows': { ru: 'Потоки', en: 'Flows' },
  'dualGraph.layerAchieve': { ru: 'Достижения', en: 'Achieve' },
  'dualGraph.layerMemory': { ru: 'Память', en: 'Memory' },

  // ChroniclesTab MD export labels
  'export.total': { ru: 'Всего записей', en: 'Total' },
  'export.approved': { ru: 'Одобрено', en: 'Approved' },
  'export.rejected': { ru: 'Отклонено', en: 'Rejected' },
  'export.pending': { ru: 'Ожидает', en: 'Pending' },
  'export.field': { ru: 'Поле', en: 'Field' },
  'export.value': { ru: 'Значение', en: 'Value' },
  'export.date': { ru: 'Дата', en: 'Date' },
  'export.target': { ru: 'Объект', en: 'Target' },
  'export.initiator': { ru: 'Инициатор', en: 'Initiator' },
  'export.status': { ru: 'Статус', en: 'Status' },
  'export.resolution': { ru: 'Резолюция', en: 'Resolution' },
  'export.comment': { ru: 'Комментарий', en: 'Comment' },
  'export.hypothesis': { ru: 'Гипотеза', en: 'Hypothesis' },
  'export.summary': { ru: 'Результат', en: 'Summary' },
  'export.metrics': { ru: 'Метрики', en: 'Metrics' },
  'export.metric': { ru: 'Показатель', en: 'Metric' },
  'export.before': { ru: 'До', en: 'Before' },
  'export.after': { ru: 'После', en: 'After' },
  'export.aiRevision': { ru: 'ИИ-ревизия Эволюционера', en: 'AI Evolutioner Revision' },
  'export.chroniclesTitle': { ru: 'Хроники Гидры', en: 'Chronicles of Hydra' },
  'export.chroniclesSubtitle': { ru: 'Публичный артефакт Отдела Эволюционирования. Экспорт от', en: 'Public artifact of the Evolution Department. Exported on' },
  'export.statistics': { ru: 'Статистика', en: 'Statistics' },
  'export.entries': { ru: 'Записи', en: 'Entries' },

  // ChroniclesTab UI strings
  'chron.loadError': { ru: 'Ошибка загрузки хроник', en: 'Failed to load chronicles' },
  'chron.resolutionSaved': { ru: 'Резолюция сохранена', en: 'Resolution saved' },
  'chron.saveError': { ru: 'Ошибка сохранения', en: 'Save failed' },
  'chron.noAutorevise': { ru: 'Нет записей для авторевизии — все уже пересмотрены', en: 'No entries to revise — all already processed' },
  'chron.aiRevisionTriggered': { ru: 'ИИ-ревизия запущена', en: 'AI revision triggered' },
  'chron.evolutionError': { ru: 'Ошибка запуска Эволюционера', en: 'Evolution trigger failed' },
  'chron.codeAndTitleRequired': { ru: 'Заполните код и заголовок', en: 'Entry code and title are required' },
  'chron.beforeMetricsInvalid': { ru: 'Метрики "До" — невалидный JSON', en: '"Before" metrics: invalid JSON' },
  'chron.afterMetricsInvalid': { ru: 'Метрики "После" — невалидный JSON', en: '"After" metrics: invalid JSON' },
  'chron.entryCreated': { ru: 'Запись создана', en: 'Entry created' },
  'chron.mdDownloaded': { ru: 'CHRONICLES.md скачан', en: 'CHRONICLES.md downloaded' },
  'chron.title': { ru: 'Хроники Эволюции Hydra', en: 'Chronicles of Hydra Evolution' },
  'chron.subtitle': { ru: 'Публичный артефакт Отдела Эволюционирования. Каждая запись — доказательство того, что «живая архитектура» Hydra не метафора, а инженерный факт.', en: "A public artifact of the Evolution Department. Each entry proves that Hydra's \"living architecture\" is not a metaphor — it is an engineering fact." },
  'chron.evolutioner': { ru: 'Эволюционер', en: 'Evolutioner' },
  'chron.evolutionerDesc': { ru: '→ тестирует и измеряет', en: '→ tests & measures' },
  'chron.chronicler': { ru: 'Летописец', en: 'Chronicler' },
  'chron.chroniclerDesc': { ru: '→ фиксирует и архивирует', en: '→ records & archives' },
  'chron.exportMd': { ru: 'Экспорт в MD', en: 'Export MD' },
  'chron.totalEntries': { ru: 'Всего записей', en: 'Total entries' },
  'chron.approved': { ru: 'Одобрено', en: 'Approved' },
  'chron.pending': { ru: 'Ожидает', en: 'Pending' },
  'chron.addEntry': { ru: 'Добавить запись Летописца', en: 'Add Chronicle Entry' },
  'chron.newEntry': { ru: 'Новая запись Летописца', en: 'New Chronicle Entry' },
  'chron.entryCode': { ru: 'Код записи *', en: 'Entry Code *' },
  'chron.status': { ru: 'Статус', en: 'Status' },
  'chron.awaitingTesting': { ru: 'Ожидает тестирования', en: 'Awaiting Testing' },
  'chron.completed': { ru: 'Выполнено', en: 'Completed' },
  'chron.titleField': { ru: 'Заголовок *', en: 'Title *' },
  'chron.titlePlaceholder': { ru: 'Оптимизация промпта Критика...', en: 'Critic prompt optimization...' },
  'chron.targetRole': { ru: 'Объект (роль)', en: 'Target Role' },
  'chron.initiator': { ru: 'Инициатор', en: 'Initiator' },
  'chron.hypothesis': { ru: 'Гипотеза', en: 'Hypothesis' },
  'chron.hypothesisPlaceholder': { ru: 'Что предполагается улучшить...', en: 'What is expected to improve...' },
  'chron.summaryField': { ru: 'Описание / Результат', en: 'Summary / Result' },
  'chron.summaryPlaceholder': { ru: 'Что было сделано и что получилось...', en: 'What was done and the outcome...' },
  'chron.beforeMetrics': { ru: 'Метрики "До" (JSON)', en: '"Before" Metrics (JSON)' },
  'chron.afterMetrics': { ru: 'Метрики "После" (JSON)', en: '"After" Metrics (JSON)' },
  'chron.cancel': { ru: 'Отмена', en: 'Cancel' },
  'chron.saveEntry': { ru: 'Зафиксировать запись', en: 'Save Entry' },
  'chron.autoreviseAll': { ru: 'Запустить авторевизию всех отклонённых', en: 'Auto-revise all rejected' },
  'chron.searchPlaceholder': { ru: 'Поиск по тексту (заголовок, гипотеза, резолюция...)', en: 'Search text (title, hypothesis, revision...)' },
  'chron.reset': { ru: 'Сбросить', en: 'Reset' },
  'chron.allResolutions': { ru: 'Все резолюции', en: 'All resolutions' },
  'chron.allRoles': { ru: 'Все роли', en: 'All roles' },
  'chron.from': { ru: 'С', en: 'From' },
  'chron.to': { ru: 'по', en: 'to' },
  'chron.noFilterResults': { ru: 'Нет записей по выбранным фильтрам', en: 'No entries match the selected filters' },
  'chron.target': { ru: 'Объект:', en: 'Target:' },
  'chron.initiatorLabel': { ru: 'Инициатор:', en: 'Initiator:' },
  'chron.collapseDetails': { ru: 'Свернуть детали', en: 'Collapse details' },
  'chron.showDetails': { ru: 'Показать детали', en: 'Show details' },
  'chron.result': { ru: 'Результат', en: 'Summary' },
  'chron.before': { ru: 'До', en: 'Before' },
  'chron.targetArrow': { ru: 'Цель →', en: 'Target →' },
  'chron.aiRevision': { ru: 'ИИ-ревизия Эволюционера', en: 'AI Evolutioner Revision' },
  'chron.collapse': { ru: 'Свернуть', en: 'Collapse' },
  'chron.expand': { ru: 'Развернуть', en: 'Expand' },
  'chron.supervisorResolution': { ru: 'Резолюция супервизора:', en: 'Supervisor resolution:' },
  'chron.agree': { ru: 'Согласен', en: 'Agree' },
  'chron.wish': { ru: 'Пожелание', en: 'Wish' },
  'chron.reject': { ru: 'Не согласен', en: 'Reject' },
};

export function useMemoryI18n() {
  const { language } = useLanguage();
  return (key: string) => dict[key]?.[language === 'ru' ? 'ru' : 'en'] ?? key;
}

export const MEMORY_DICT = dict;
