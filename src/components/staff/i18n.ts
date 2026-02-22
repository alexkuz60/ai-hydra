/**
 * Centralized localization for staff module (roles, interviews, knowledge, recertification)
 */

export const STAFF_I18N = {
  // === Common ===
  save: { ru: 'Сохранить', en: 'Save' },
  cancel: { ru: 'Отмена', en: 'Cancel' },
  delete: { ru: 'Удалить', en: 'Delete' },
  close: { ru: 'Закрыть', en: 'Close' },
  refresh: { ru: 'Обновить', en: 'Refresh' },
  search: { ru: 'Поиск...', en: 'Search...' },
  all: { ru: 'Все', en: 'All' },
  deleted: { ru: 'Удалено', en: 'Deleted' },
  stop: { ru: 'Остановить', en: 'Cancel' },

  // === Role Settings ===
  defaultModel: { ru: 'Модель по умолчанию', en: 'Default Model' },
  defaultModelHint: { ru: 'Модель, используемая при вызове этого техника. Пользователь может переназначить.', en: 'Model used when calling this technician. User can override.' },
  defaultModelUpdated: { ru: 'Модель по умолчанию обновлена', en: 'Default model updated' },
  notAssigned: { ru: 'Не назначена', en: 'Not assigned' },
  notAssignedDash: { ru: '— Не назначена —', en: '— Not assigned —' },

  // === Role Details Panel ===
  recertify: { ru: 'Переаттестация', en: 'Re-certify' },
  interview: { ru: 'Собеседование', en: 'Interview' },

  // === Knowledge Tab ===
  domainKnowledge: { ru: 'Профильные знания', en: 'Domain Knowledge' },
  chunks: { ru: 'фрагм.', en: 'chunks' },
  sources: { ru: 'источн.', en: 'sources' },
  fromHydrapedia: { ru: 'Из Гидрапедии', en: 'From Hydrapedia' },
  reseedTitle: { ru: 'Пересидить знания из Гидрапедии (заменит существующие)', en: 'Re-seed from Hydrapedia (replaces existing)' },
  fromUrl: { ru: 'С веб-страницы', en: 'From URL' },
  add: { ru: 'Добавить', en: 'Add' },
  noKnowledge: { ru: 'Нет загруженных знаний.', en: 'No knowledge loaded.' },
  seedFromHydrapedia: { ru: 'Загрузить из Гидрапедии', en: 'Seed from Hydrapedia' },
  addManually: { ru: 'Добавить вручную', en: 'Add manually' },
  nothingFound: { ru: 'Ничего не найдено', en: 'Nothing found' },
  chunkLabel: { ru: 'чанк.', en: 'ch.' },
  addDomainKnowledge: { ru: 'Добавить профильное знание', en: 'Add Domain Knowledge' },
  pasteDocumentation: { ru: 'Вставьте текст документации для обучения роли', en: 'Paste documentation text to train the role' },
  sourceTitle: { ru: 'Название источника', en: 'Source Title' },
  category: { ru: 'Категория', en: 'Category' },
  version: { ru: 'Версия', en: 'Version' },
  contentAutoChunked: { ru: 'Содержание (будет разбито на фрагменты автоматически)', en: 'Content (will be auto-chunked)' },
  pasteDocPlaceholder: { ru: 'Вставьте текст документации, статьи или материала...', en: 'Paste documentation text, article or material...' },
  chunkCount: { ru: 'фрагмент(ов)', en: 'chunk(s)' },
  chars: { ru: 'символов', en: 'chars' },
  savingChunks: { ru: 'Сохранение чанков...', en: 'Saving chunks...' },
  confirmDeletion: { ru: 'Подтвердите удаление', en: 'Confirm deletion' },
  deleteChunkConfirm: { ru: 'Удалить этот фрагмент знания?', en: 'Delete this knowledge chunk?' },
  importFromWeb: { ru: 'Импорт с веб-страницы', en: 'Import from Web Page' },
  importFromWebDesc: { ru: 'Укажите URL — содержимое страницы будет извлечено и сохранено как профильное знание', en: 'Enter a URL — the page content will be extracted and saved as domain knowledge' },
  scrape: { ru: 'Извлечь', en: 'Scrape' },
  extractedContent: { ru: 'Извлечённый контент', en: 'Extracted Content' },
  saveKnowledge: { ru: 'Сохранить знание', en: 'Save Knowledge' },
  enterContent: { ru: 'Введите содержание', en: 'Enter content' },
  saveErrorGeneric: { ru: 'Ошибка сохранения', en: 'Save error' },

  // Knowledge toast messages
  roleHasDocs: { ru: 'У роли уже есть документов. Используйте пересидинг для обновления.', en: 'Role already has docs. Use re-seed to update.' },
  noKnowledgeAvailable: { ru: 'Нет доступных знаний для этой роли', en: 'No knowledge available for this role' },
  seedError: { ru: 'Ошибка загрузки знаний', en: 'Failed to seed knowledge' },
  failedExtract: { ru: 'Не удалось извлечь контент', en: 'Failed to extract content' },
  scrapeError: { ru: 'Ошибка скрейпинга', en: 'Scrape failed' },
  saveError: { ru: 'Ошибка сохранения', en: 'Save failed' },

  // Knowledge categories
  catGeneral: { ru: 'Общее', en: 'General' },
  catDocumentation: { ru: 'Документация', en: 'Documentation' },
  catStandard: { ru: 'Стандарты', en: 'Standards' },
  catProcedure: { ru: 'Процедуры', en: 'Procedures' },
  catSystemPrompt: { ru: 'Системный промпт', en: 'System Prompt' },
  catBestPractices: { ru: 'Лучшие практики', en: 'Best Practices' },
  catArchitecture: { ru: 'Архитектура', en: 'Architecture' },
  catApiReference: { ru: 'API Reference', en: 'API Reference' },
  catTutorial: { ru: 'Туториал', en: 'Tutorial' },
  catHydraInternals: { ru: 'Hydra Internals', en: 'Hydra Internals' },

  // === Interview Panel ===
  newInterview: { ru: 'Новое собеседование', en: 'New Interview' },
  byokOnly: { ru: 'Только модели с настроенными API-ключами (BYOK)', en: 'Only models with configured API keys (BYOK)' },
  assembleBriefing: { ru: 'Собрать брифинг', en: 'Assemble Briefing' },
  budgetEstimate: { ru: 'Оценка бюджета', en: 'Budget Estimate' },
  estimatedCost: { ru: 'Оценка стоимости', en: 'Est. cost' },
  thinkingModelWarning: { ru: 'Модель с рассуждениями — рекомендуется 2x бюджет', en: 'Thinking model — 2x budget recommended' },
  multiplier: { ru: 'Множитель', en: 'Multiplier' },
  noHistoryBaseEstimate: { ru: 'Нет истории — используется базовая оценка', en: 'No history — using base estimate' },
  steps: { ru: 'шагов', en: 'steps' },
  running: { ru: 'выполняется', en: 'running' },
  resumeTests: { ru: 'Возобновить тесты', en: 'Resume Tests' },
  runTests: { ru: 'Запустить тесты', en: 'Run Tests' },
  runVerdict: { ru: 'Вынести вердикт', en: 'Run Verdict' },
  phase: { ru: 'Фаза', en: 'Phase' },
  noSessions: { ru: 'Нет активных собеседований для этой роли', en: 'No interview sessions for this role' },

  // === Interview Timeline ===
  retry: { ru: 'Заново', en: 'Retry' },
  briefing: { ru: 'Брифинг', en: 'Briefing' },
  testsLabel: { ru: 'Тесты', en: 'Tests' },
  verdict: { ru: 'Вердикт', en: 'Verdict' },

  // === Interview Verdict ===
  noVerdictYet: { ru: 'Вердикт ещё не вынесен', en: 'No verdict yet' },
  autoDecision: { ru: 'Авто-решение', en: 'Auto Decision' },
  score: { ru: 'Балл', en: 'Score' },
  current: { ru: 'Текущий', en: 'Current' },
  prevAvg: { ru: 'Ср. пред.', en: 'Prev avg' },
  arbiterScores: { ru: 'Оценки арбитра', en: 'Arbiter Scores' },
  redFlags: { ru: 'Красные флаги', en: 'Red Flags' },
  moderatorSummary: { ru: 'Резюме модератора', en: 'Moderator Summary' },
  yourDecision: { ru: 'Ваше решение', en: 'Your Decision' },
  hire: { ru: 'Нанять', en: 'Hire' },
  reject: { ru: 'Отклонить', en: 'Reject' },
  retestVerb: { ru: 'Перетестировать', en: 'Retest' },
  rejectResults: { ru: 'Отклонить результаты', en: 'Reject Results' },
  decision: { ru: 'Решение', en: 'Decision' },
  decisionReject: { ru: 'Отказ', en: 'Reject' },
  decisionRetest: { ru: 'Ретест', en: 'Retest' },

  // === Step Cards ===
  taskLabel: { ru: 'Задание:', en: 'Task:' },
  candidateOutput: { ru: 'Ответ кандидата:', en: 'Candidate output:' },
  expand: { ru: 'Развернуть', en: 'Expand' },
  currentBaseline: { ru: 'Текущее (Baseline)', en: 'Current (Baseline)' },
  candidateLabel: { ru: 'Кандидат', en: 'Candidate' },

  // === Knowledge Changed Badge ===
  updated: { ru: 'Обновлено', en: 'Updated' },
  knowledgeChangedHint: { ru: 'Знания изменились с последней аттестации. Нажмите для переаттестации.', en: 'Knowledge changed since last certification. Click to re-certify.' },

  // === Recertification ===
  recertification: { ru: 'Переаттестация', en: 'Re-certification' },
  changesSinceLast: { ru: 'Изменения с последней аттестации', en: 'Changes since last certification' },
  noChanges: { ru: 'Нет изменений. Переаттестация не требуется.', en: 'No changes. Re-certification not needed.' },
  knowledge: { ru: 'База знаний', en: 'Knowledge' },
  prompts: { ru: 'Промпты', en: 'Prompts' },
  lastCertified: { ru: 'Последняя аттестация', en: 'Last certified' },
  deltaCert: { ru: 'Дельта-аттестация', en: 'Delta re-certification' },
  shortenedBriefing: { ru: 'Сокращённый брифинг (только изменения)', en: 'Shortened briefing (changes only)' },
  targetedTests: { ru: '2-3 точечных теста', en: '2-3 targeted tests' },
  tokenSavings: { ru: 'Экономия ~70% токенов', en: '~70% token savings' },
  startRecert: { ru: 'Запустить переаттестацию', en: 'Start Re-certification' },
  noAssignedModel: { ru: 'Нет назначенной модели. Проведите полное собеседование.', en: 'No assigned model. Run a full interview.' },
  assemblingDelta: { ru: 'Собираем дельта-брифинг...', en: 'Assembling delta briefing...' },
  tests: { ru: 'тестов', en: 'tests' },
  viewVerdict: { ru: 'Посмотреть вердикт', en: 'View Verdict' },

  // === Assignment History ===
  assignmentHistory: { ru: 'История назначений', en: 'Assignment History' },
  noAssignments: { ru: 'Назначений пока нет. Проведите собеседование.', en: 'No assignments yet. Run an interview.' },
  active: { ru: 'Активен', en: 'Active' },
  replaced: { ru: 'Замещён', en: 'Replaced' },
  manual: { ru: 'Вручную', en: 'Manual' },
  retestFailed: { ru: 'Не прошёл ретест', en: 'Retest failed' },

  // === StaffRoles Page ===
  seedAllTechRoles: { ru: 'Обучить всех техников', en: 'Seed All Tech Roles' },
  forceRefresh: { ru: 'Обновить брифинг', en: 'Force Refresh' },
  qualityControlDept: { ru: 'Отдел ТехКонтроля (ОТК)', en: 'Quality Control Dept.' },

  // === Forecast ===
  forecastLabel: { ru: 'Прогноз', en: 'Forecast' },
  interviewsLabel: { ru: 'интервью', en: 'interviews' },
} as const;

export type StaffI18nKey = keyof typeof STAFF_I18N;

/** Get localized text by key */
export function s(key: StaffI18nKey, isRu: boolean): string {
  return isRu ? STAFF_I18N[key].ru : STAFF_I18N[key].en;
}

/** Category labels map */
export const CATEGORY_LABELS: Record<string, StaffI18nKey> = {
  general: 'catGeneral',
  documentation: 'catDocumentation',
  standard: 'catStandard',
  procedure: 'catProcedure',
  system_prompt: 'catSystemPrompt',
  'best-practices': 'catBestPractices',
  architecture: 'catArchitecture',
  'api-reference': 'catApiReference',
  tutorial: 'catTutorial',
  'hydra-internals': 'catHydraInternals',
};

/** Get localized category label */
export function getCategoryLabel(value: string, isRu: boolean): string {
  const key = CATEGORY_LABELS[value];
  return key ? s(key, isRu) : value;
}
