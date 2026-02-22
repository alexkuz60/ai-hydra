/**
 * Centralized localization for ratings module (contest, beauty contest, model ratings)
 * Follows strict localization standards: all UI text must use keys from this file
 */

export const RATINGS_I18N = {
  // ===== CONTEST PODIUM (Wizard) =====
  step1: { ru: 'Шаг 1', en: 'Step 1' },
  step2: { ru: 'Шаг 2', en: 'Step 2' },
  step3: { ru: 'Шаг 3', en: 'Step 3' },
  step4: { ru: 'Шаг 4', en: 'Step 4' },
  step5: { ru: 'Шаг 5', en: 'Step 5' },

  // ===== TASK SELECTOR =====
  selectTask: { ru: 'Выберите задачу', en: 'Select Task' },
  task: { ru: 'Задача', en: 'Task' },
  noTaskSelected: { ru: 'Не выбрана', en: 'Not selected' },

  // ===== CONTEST RULES =====
  contestRules: { ru: 'Правила конкурса', en: 'Contest Rules' },
  numberOfRounds: { ru: 'Количество туров', en: 'Number of Rounds' },
  round: { ru: 'Тур', en: 'Round' },
  assignmentType: { ru: 'Тип задания', en: 'Assignment Type' },
  freePrompt: { ru: 'Свободный промпт', en: 'Free Prompt' },
  roleBased: { ru: 'По роли', en: 'Role-based' },
  roundPrompt: { ru: 'Промпт тура', en: 'Round Prompt' },
  enterAssignmentForModels: { ru: 'Введите задание для моделей...', en: 'Enter assignment for models...' },
  evaluationCriteria: { ru: 'Критерии оценки', en: 'Evaluation Criteria' },
  accuracy: { ru: 'Точность', en: 'Accuracy' },
  completeness: { ru: 'Полнота', en: 'Completeness' },
  creativity: { ru: 'Креативность', en: 'Creativity' },
  structure: { ru: 'Структурированность', en: 'Structure' },
  practicality: { ru: 'Практичность', en: 'Practicality' },
  eliminationRule: { ru: 'Правило прохождения', en: 'Elimination Rule' },
  allPass: { ru: 'Все проходят', en: 'All pass' },
  worstPercentEliminated: { ru: 'Худшие N% выбывают', en: 'Worst N% eliminated' },
  belowScoreThreshold: { ru: 'Ниже порога X баллов', en: 'Below score threshold' },
  manualSelection: { ru: 'Ручной отбор', en: 'Manual selection' },

  // ===== PIPELINE SELECTOR =====
  selectPipeline: { ru: 'Выберите пайплайн', en: 'Select Pipeline' },
  pipeline: { ru: 'Пайплайн', en: 'Pipeline' },
  notNeeded: { ru: 'Не нужен', en: 'Not needed' },

  // ===== ARBITRATION =====
  contestArbitration: { ru: 'Арбитраж конкурса', en: 'Contest Arbitration' },
  juryComposition: { ru: 'Состав жюри', en: 'Jury Composition' },
  userOnly: { ru: 'Только пользователь', en: 'User only' },
  arbiterAIOnly: { ru: 'Только Арбитр (ИИ)', en: 'Arbiter (AI) only' },
  userAndArbiter: { ru: 'Пользователь + Арбитр', en: 'User + Arbiter' },
  scoreWeight: { ru: 'Вес оценки: Пользователь vs Арбитр', en: 'Score Weight: User vs Arbiter' },
  user: { ru: 'Пользователь', en: 'User' },
  arbiter: { ru: 'Арбитр', en: 'Arbiter' },
  candidateEvaluationCategories: { ru: 'Категории оценки кандидатов', en: 'Candidate Evaluation Categories' },
  criteriaWeights: { ru: 'Веса критериев', en: 'Criteria Weights' },
  sum: { ru: 'сумма', en: 'total' },
  finalScoringScheme: { ru: 'Схема итоговой оценки', en: 'Final Scoring Scheme' },
  weightedAverage: { ru: 'Средневзвешенный балл', en: 'Weighted Average' },
  tournamentTable: { ru: 'Турнирная таблица', en: 'Tournament Table' },
  eloRating: { ru: 'Рейтинг Эло', en: 'Elo Rating' },
  weightedAverageDescription: { ru: 'Итоговый балл = среднее взвешенное по выбранным критериям', en: 'Final score = weighted average across selected criteria' },
  tournamentDescription: { ru: 'Модели проходят через сетку попарных сравнений', en: 'Models go through a bracket of pairwise comparisons' },
  eloDescription: { ru: 'Динамический рейтинг по системе Эло на основе дуэлей', en: 'Dynamic rating based on Elo system from duels' },
  factuality: { ru: 'Фактологичность', en: 'Factuality' },
  relevance: { ru: 'Релевантность', en: 'Relevance' },
  clarity: { ru: 'Ясность', en: 'Clarity' },
  consistency: { ru: 'Консистентность', en: 'Consistency' },
  costTokens: { ru: 'Стоимость (токены)', en: 'Cost (tokens)' },
  responseSpeed: { ru: 'Скорость ответа', en: 'Response Speed' },
  costEfficiency: { ru: 'Эффективность', en: 'Cost Efficiency' },
  speed: { ru: 'Скорость', en: 'Speed' },

  // ===== CONTEST SUMMARY =====
  previewAndLaunch: { ru: 'Предпросмотр и запуск', en: 'Preview & Launch' },
  mode: { ru: 'Режим', en: 'Mode' },
  contest: { ru: 'Конкурс', en: 'Contest' },
  interview: { ru: 'Собеседование', en: 'Interview' },
  participants: { ru: 'Участников', en: 'Participants' },
  rounds: { ru: 'Туров', en: 'Rounds' },
  saveContestPlan: { ru: 'Сохранить план конкурса', en: 'Save Contest Plan' },
  reSaveContestPlan: { ru: 'Пересохранить план конкурса', en: 'Re-save Contest Plan' },
  selectPipelineTemplateInStep3: { ru: 'Выберите шаблон пайплайна в Шаге 3', en: 'Select a pipeline template in Step 3' },

  // ===== CONTEST SUMMARY CONFIG =====
  mode_label: { ru: 'Режим', en: 'Mode' },
  participants_label: { ru: 'Участников', en: 'Participants' },
  rounds_label: { ru: 'Туров', en: 'Rounds' },
  task_label: { ru: 'Задача', en: 'Task' },
  pipeline_label: { ru: 'Пайплайн', en: 'Pipeline' },

  // ===== BEAUTY CONTEST EXECUTION =====
  intelligenceBeautyContest: { ru: 'Конкурс интеллект-красоты', en: 'Intelligence Beauty Contest' },
  configureContestAndLaunch: { ru: 'Настройте конкурс в разделе «Правила» и запустите его здесь, или восстановите предыдущую сессию.', en: 'Configure the contest in "Rules" section and launch it here, or restore a previous session.' },
  launchFromPlan: { ru: 'Запустить из плана', en: 'Launch from Plan' },
  loadFromArchive: { ru: 'Загрузить из архива', en: 'Load from Archive' },
  contestArchive: { ru: 'Архив конкурсов', en: 'Contest Archive' },
  noSavedContests: { ru: 'Нет сохранённых конкурсов', en: 'No saved contests' },
  models: { ru: 'моделей', en: 'models' },
  contestLaunched: { ru: 'Конкурс запущен!', en: 'Contest launched!' },
  questionSentTo: { ru: 'Вопрос отправлен:', en: 'Question sent to:' },
  all: { ru: 'всем', en: 'all' },
  roundNumber: { ru: 'Промпт тура', en: 'Round prompt' },

  // ===== RESPONSES PANEL =====
  responses: { ru: 'Ответы', en: 'Responses' },
  allResponses: { ru: 'Все', en: 'All' },
  responsesWillAppearAfterLaunch: { ru: 'Ответы появятся здесь после запуска', en: 'Responses will appear here after launch' },
  followUpQuestion: { ru: 'Дополнительный вопрос', en: 'Follow-up Question' },

  // ===== SCORES TAB =====
  scores: { ru: 'Оценки', en: 'Scores' },
  sendWinnersToExpertPanel: { ru: 'Отправить {count} победител{form} в Панель экспертов', en: 'Send {count} winner{form} to Expert Panel' },

  // ===== ARBITER PANEL =====
  arbiterComments: { ru: 'Комментарии арбитра', en: 'Arbiter Comments' },
  arbiterHasNotJudgedYet: { ru: 'Арбитр ещё не оценивал', en: 'Arbiter has not judged yet' },

  // ===== SCOREBOARD =====
  live: { ru: 'Идёт', en: 'Live' },
  done: { ru: 'Завершён', en: 'Done' },
  paused: { ru: 'Пауза', en: 'Paused' },
  new: { ru: 'Новый', en: 'New' },
  tourNumber: { ru: 'Тур', en: 'R' }, // Short for "Round"

  // ===== ROUND LABELS =====
  additionalQuestion: { ru: 'Дополнительный вопрос', en: 'Follow-up Question' },
  additionalQuestionNumber: { ru: 'Дополнительный вопрос', en: 'Follow-up' },

  // ===== WINNERS MIGRATION =====
  winnersToExpertPanel: { ru: 'победитель(ей) отправлено в Панель экспертов', en: 'winner(s) sent to Expert Panel' },
  saveToTask: { ru: 'Занести в задачу', en: 'Save to Task' },
  savedToTask: { ru: 'Ответы конкурса сохранены в задачу', en: 'Contest responses saved to task' },
  savingToTask: { ru: 'Сохраняем...', en: 'Saving...' },
  noScoredResponses: { ru: 'Нет оценённых ответов для сохранения', en: 'No scored responses to save' },

  // ===== FOLLOW-UP INPUT =====
  questionFor: { ru: 'Вопрос для:', en: 'Question for:' },
  followUpQuestionForAll: { ru: 'Дополнительный вопрос всем конкурсантам...', en: 'Follow-up question for all contestants...' },
  questionForModel: { ru: 'Вопрос для {model}...', en: 'Question for {model}...' },
  enterFollowUpQuestion: { ru: 'Введите дополнительный вопрос...', en: 'Enter follow-up question...' },
  sendToAllParticipants: { ru: 'Отправить всем участникам (Enter)', en: 'Send to all contestants (Enter)' },
  sendToSelectedModel: { ru: 'Отправить конкретной модели (Shift+Enter)', en: 'Send to selected model (Shift+Enter)' },

  // ===== MODEL DOSSIER =====
  available: { ru: 'Доступна', en: 'Available' },
  onPodium: { ru: 'На подиуме', en: 'On Podium' },
  parameters: { ru: 'Параметры', en: 'Parameters' },
  characteristics: { ru: 'Характеристики', en: 'Characteristics' },
  podiumManagement: { ru: 'Управление подиумом', en: 'Podium Management' },
  inviteToContest: { ru: 'Пригласить на конкурс', en: 'Invite to Contest' },
  activity: { ru: 'Активность', en: 'Activity' },
  veteran: { ru: 'Ветеран', en: 'Veteran' },

  // ===== CANDIDATE DETAIL =====
  stats: { ru: 'Статистика', en: 'Stats' },
  duels: { ru: 'Дуэли', en: 'Duels' },
  portfolio: { ru: 'Портфолио', en: 'Portfolio' },

  // ===== VALIDATION MESSAGES =====
  taskRequired: { ru: 'Выберите задачу', en: 'Task is required' },
  participantsRequired: { ru: 'Добавьте хотя бы одного участника', en: 'At least one participant is required' },
  promptRequired: { ru: 'Напишите промпт для первого тура', en: 'Round prompt is required' },
  pipelineRequired: { ru: 'Выберите шаблон пайплайна', en: 'Pipeline is required' },

  // ===== DUEL MODE =====
  duelTitle: { ru: 'Дуэль «К барьеру»', en: 'Duel «En Garde»' },
  duelDescription: { ru: 'Попарное состязание кандидатов', en: 'Head-to-head candidate battle' },
  duelPromptLabel: { ru: 'Стартовый промпт дуэли', en: 'Duel Starting Prompt' },
  duelPromptPlaceholder: { ru: 'Введите задание для дуэлянтов...', en: 'Enter the challenge for duelists...' },
  duelType: { ru: 'Тип дуэли', en: 'Duel Type' },
  duelTypeCritic: { ru: 'Отбор критиков', en: 'Critic Selection' },
  duelTypeArbiter: { ru: 'Отбор арбитров', en: 'Arbiter Selection' },
  duelModelA: { ru: 'Дуэлянт A', en: 'Duelist A' },
  duelModelB: { ru: 'Дуэлянт B', en: 'Duelist B' },
  duelRounds: { ru: 'Количество раундов', en: 'Number of Rounds' },
  duelUserEval: { ru: 'Оценка пользователя после каждого раунда', en: 'User evaluation after each round' },
  duelLaunch: { ru: 'К барьеру!', en: 'En Garde!' },
  duelLoadArchive: { ru: 'Архив дуэлей', en: 'Duel Archive' },
  duelNoSaved: { ru: 'Нет сохранённых дуэлей', en: 'No saved duels' },
  duelConfigureAndLaunch: { ru: 'Настройте параметры дуэли и запустите попарное состязание кандидатов.', en: 'Configure duel parameters and launch a head-to-head candidate battle.' },
  duelRoundN: { ru: 'Раунд', en: 'Round' },
  duelVs: { ru: 'против', en: 'vs' },
  duelPickWinner: { ru: 'Выберите победителя', en: 'Pick the Winner' },
  duelRoundWinner: { ru: 'Победитель раунда', en: 'Round Winner' },
  duelDraw: { ru: 'Ничья', en: 'Draw' },
  duelComplete: { ru: 'Дуэль завершена', en: 'Duel Complete' },
  duelOverallWinner: { ru: 'Общий победитель', en: 'Overall Winner' },
  duelYourArgument: { ru: 'Ваш аргумент', en: 'Your Argument' },
  duelOpponentArgument: { ru: 'Аргумент противника', en: 'Opponent\'s Argument' },
  duelNewDuel: { ru: 'Новая дуэль', en: 'New Duel' },
  duelFinish: { ru: 'Завершить дуэль', en: 'Finish Duel' },
  duelScore: { ru: 'Счёт', en: 'Score' },
  duelSelectModel: { ru: 'Выберите модель', en: 'Select model' },
  // Contest Rules tabs
  tabContest: { ru: 'Конкурс', en: 'Contest' },
  tabDuel: { ru: 'Дуэль', en: 'Duel' },
  tabInterview: { ru: 'Собеседование', en: 'Interview' },
  duelPlanTitle: { ru: 'План дуэли «К барьеру»', en: 'Duel Plan «En Garde»' },
  duelFlowTemplate: { ru: 'Шаблон потока дуэли', en: 'Duel Flow Template' },
  duelArbitration: { ru: 'Арбитраж дуэли', en: 'Duel Arbitration' },
  duelArbiterModel: { ru: 'Модель-арбитр', en: 'Arbiter Model' },
  duelSavePlan: { ru: 'Сохранить план дуэли', en: 'Save Duel Plan' },
  duelReSavePlan: { ru: 'Пересохранить план', en: 'Re-save Plan' },
  duelScoringScheme: { ru: 'Схема оценки', en: 'Scoring Scheme' },
  duelCriteria: { ru: 'Критерии', en: 'Criteria' },
  duelUserEvalEnabled: { ru: 'Пользовательская оценка', en: 'User Evaluation' },
  duelYes: { ru: 'Да', en: 'Yes' },
  duelNo: { ru: 'Нет', en: 'No' },
  duelLaunchButton: { ru: 'К барьеру!', en: 'En Garde!' },
  duelSavedFlow: { ru: 'Сохранённый поток', en: 'Saved Flow' },
  duelOpenInEditor: { ru: 'Открыть в редакторе', en: 'Open in Editor' },
  duelNodes: { ru: 'Узлов', en: 'Nodes' },
  duelEdges: { ru: 'Связей', en: 'Edges' },

  // ===== DUEL ARENA TABS =====
  duelTabResponses: { ru: 'Ответы', en: 'Responses' },
  duelTabScores: { ru: 'Оценки', en: 'Scores' },
  duelTabArbiter: { ru: 'Арбитраж', en: 'Arbitration' },
  duelFinishConfirmTitle: { ru: 'Завершить дуэль?', en: 'Finish duel?' },
  duelFinishConfirmDesc: { ru: 'Все текущие раунды будут завершены. Это действие нельзя отменить.', en: 'All current rounds will be completed. This action cannot be undone.' },
  duelCancel: { ru: 'Отмена', en: 'Cancel' },
  duelFinishConfirm: { ru: 'Завершить', en: 'Finish' },
  duelFinished: { ru: 'Дуэль завершена', en: 'Duel finished' },
  duelStatsSaved: { ru: 'Статистика дуэли обновлена', en: 'Duel statistics updated' },

  // ===== LIKERT WIDGET =====
  likertExcellent: { ru: 'Отлично', en: 'Excellent' },
  likertGood: { ru: 'Хорошо', en: 'Good' },
  likertOkay: { ru: 'Нормально', en: 'Okay' },
  likertWeak: { ru: 'Слабо', en: 'Weak' },
  likertPoor: { ru: 'Плохо', en: 'Poor' },
  likertNonsense: { ru: 'Бред', en: 'Nonsense' },

  // ===== ELIMINATION =====
  eliminate: { ru: 'Снять', en: 'Eliminate' },
  restore: { ru: 'Вернуть', en: 'Restore' },
  eliminated: { ru: 'Снята', en: 'Eliminated' },
  eliminationThreshold: { ru: 'Порог снятия (баллов из 10)', en: 'Elimination threshold (score out of 10)' },
  autoEliminatedBelow: { ru: 'Автоснятие ниже', en: 'Auto-eliminated below' },
  modelEliminated: { ru: 'Модель снята с конкурса', en: 'Model eliminated from contest' },
  modelRestored: { ru: 'Модель возвращена в конкурс', en: 'Model restored to contest' },
  cannotEliminateMinModels: { ru: 'Нельзя снять — минимум 2 модели должны остаться', en: 'Cannot eliminate — at least 2 models must remain' },

  // ===== CONTEST SCOREBOARD =====
  finish: { ru: 'Завершить', en: 'Finish' },
  contestFinished: { ru: 'Конкурс завершён', en: 'Contest finished' },

  // ===== CONTEST RESPONSES =====
  collapse: { ru: 'Свернуть', en: 'Collapse' },
  expand: { ru: 'Развернуть', en: 'Expand' },
  followUpN: { ru: 'Дополнительный вопрос', en: 'Follow-up' },
  tourN: { ru: 'Тур', en: 'Round' },

  // ===== CONTEST SCORES TABLE =====
  scoresTable: { ru: 'Таблица оценок', en: 'Scores Table' },
  selected: { ru: 'выбрано', en: 'selected' },
  model: { ru: 'Модель', en: 'Model' },
  average: { ru: 'Среднее', en: 'Average' },
  eliminateModel: { ru: 'Снять модель с конкурса?', en: 'Eliminate model?' },
  eliminateModelDesc: { ru: 'будет исключена из следующих раундов. Набранные баллы сохранятся.', en: 'will be excluded from future rounds. Earned scores are preserved.' },
  cancel: { ru: 'Отмена', en: 'Cancel' },
  confirmEliminate: { ru: 'Снять', en: 'Eliminate' },
  restoreToContest: { ru: 'Вернуть в конкурс', en: 'Restore to contest' },
  eliminateFromContest: { ru: 'Снять с конкурса', en: 'Eliminate from contest' },
  minTwoModels: { ru: 'Минимум 2 модели должны остаться', en: 'At least 2 models must remain' },
  selectWinnersToExpert: { ru: 'Выбрать победителей для отправки в Панель экспертов', en: 'Select winners to send to Expert Panel' },
  outBadge: { ru: 'снята', en: 'out' },
  dropBadge: { ru: 'снять?', en: 'drop?' },

  // ===== BEAUTY CONTEST =====
  sendWinnersToExpert: { ru: 'Отправить {count} победител{form} в Панель экспертов', en: 'Send {count} winner{formEn} to Expert Panel' },
  screenCandidates: { ru: 'Скрининг {count} кандидат{form}', en: 'Screen {count} candidate{formEn}' },
  noTaskInConfig: { ru: 'Задача не выбрана в конфигурации конкурса', en: 'No task selected in contest config' },

  // ===== DUEL BATTLE VIEW =====
  lastRoundPrompt: { ru: 'Промпт последнего раунда', en: 'Last Round Prompt' },
  extraRound: { ru: 'Доп. раунд', en: 'Extra Round' },
  extraRoundTitle: { ru: 'Дополнительный раунд', en: 'Extra Round' },
  extraRoundDesc: { ru: 'Введите задание для дополнительного раунда дуэли.', en: 'Enter the prompt for the extra duel round.' },
  extraRoundPlaceholder: { ru: 'Задание для дополнительного раунда...', en: 'Extra round prompt...' },
  startRound: { ru: 'Запустить раунд', en: 'Start Round' },
  duelStarted: { ru: 'Дуэль началась!', en: 'Duel started!' },
  extraRoundAdded: { ru: 'Дополнительный раунд добавлен', en: 'Extra round added' },

  // ===== DUEL ARENA VALIDATION =====
  selectModelA: { ru: 'Выберите модель A', en: 'Select Model A' },
  selectModelB: { ru: 'Выберите модель B', en: 'Select Model B' },
  modelsMustDiffer: { ru: 'Модели должны быть разными', en: 'Models must be different' },
  duelPromptRequired: { ru: 'Напишите стартовый промпт', en: 'Duel prompt required' },

  // ===== MODEL DOSSIER =====
  participationStats: { ru: 'Статистика участия', en: 'Participation Stats' },
  criteriaProfile: { ru: 'Профиль по критериям', en: 'Criteria Profile' },
  filterAll: { ru: 'Все', en: 'All' },
  filterContest: { ru: 'Конкурс', en: 'Contest' },
  filterDuelCritic: { ru: 'Дуэль (Критик)', en: 'Duel (Critic)' },
  filterDuelArbiter: { ru: 'Дуэль (Арбитр)', en: 'Duel (Arbiter)' },
  noDataForFilter: { ru: 'Нет данных для этого фильтра', en: 'No data for this filter' },
  roleDistribution: { ru: 'Распределение ролей', en: 'Role Distribution' },
  dChatDialogs: { ru: 'Диалоги в Д-чате', en: 'D-Chat Dialogs' },
  taskHistory: { ru: 'Послужной список', en: 'Task History' },
  noModelData: { ru: 'Нет данных об участии этой модели в задачах', en: 'No task participation data for this model' },
  win: { ru: 'Победа', en: 'Win' },
  loss: { ru: 'Поражение', en: 'Loss' },
  draw: { ru: 'Ничья', en: 'Draw' },
  other: { ru: 'Прочие', en: 'Other' },

  // ===== MODEL LIST SIDEBAR =====
  searchModel: { ru: 'Поиск модели...', en: 'Search model...' },
  ofTotal: { ru: 'из', en: 'of' },
  availableCount: { ru: 'доступно', en: 'available' },
  collapseAll: { ru: 'Свернуть все', en: 'Collapse all' },
  expandAll: { ru: 'Развернуть все', en: 'Expand all' },
  filterAvailable: { ru: 'Доступные', en: 'Available' },
  filterUnavailable: { ru: 'Недоступные', en: 'Unavailable' },
  apiKeyConfigured: { ru: 'API-ключ настроен', en: 'API key configured' },
  noApiKey: { ru: 'API-ключ не найден', en: 'No API key found' },

  // ===== SCREENING PANEL =====
  screeningInterview: { ru: 'Скрининг-интервью', en: 'Screening Interview' },
  selectWinnersForScreening: { ru: 'Выберите победителей конкурса (👑) в таблице результатов, чтобы запустить пакетное тестирование', en: 'Select contest winners (👑) in the scores table to start batch screening' },
  runScreening: { ru: 'Запустить скрининг', en: 'Run Screening' },
  cancelScreening: { ru: 'Остановить', en: 'Cancel' },
  doneCount: { ru: 'завершено', en: 'done' },
  failedCount: { ru: 'ошибок', en: 'failed' },
  stepsCount: { ru: 'шагов', en: 'steps' },
  runningCount: { ru: 'выполняется', en: 'running' },
  budgetEstimate: { ru: 'Оценка бюджета', en: 'Budget Estimate' },
  candidatesLabel: { ru: 'кандидат', en: 'candidate' },
  roleLabel: { ru: 'Роль', en: 'Role' },
  concurrency: { ru: 'Параллельно', en: 'Concurrency' },

  // ===== SCREENING PANEL (extra) =====
  queued: { ru: 'В очереди', en: 'Queued' },
  assemblingBriefing: { ru: 'Сбор брифинга...', en: 'Assembling briefing...' },
  resumeTests: { ru: 'Возобновить тесты', en: 'Resume Tests' },
  runTests: { ru: 'Запустить тесты', en: 'Run Tests' },
  runVerdict: { ru: 'Вынести вердикт', en: 'Run Verdict' },
  phase: { ru: 'Фаза', en: 'Phase' },
  stop: { ru: 'Остановить', en: 'Cancel' },
  briefingReady: { ru: 'Брифинг собран — запустите тесты', en: 'Briefing ready — run tests to proceed' },
  noHistoryBaseEstimate: { ru: 'Нет истории — используется базовая оценка', en: 'No history — using base estimate' },
  thinkingModelBudget: { ru: 'Модель с рассуждениями — рекомендуется 2x бюджет', en: 'Thinking model — 2x budget recommended' },
  multiplier: { ru: 'Множитель', en: 'Multiplier' },
  estCost: { ru: 'Оценка стоимости', en: 'Est. cost' },
  forecastLabel: { ru: 'Прогноз', en: 'Forecast' },

  // ===== MODEL DOSSIER (extra) =====
  respShort: { ru: 'отв.', en: 'resp.' },
  dismShort: { ru: 'откл.', en: 'dism.' },
  contShort: { ru: 'конк.', en: 'cont.' },
  scoreLabel: { ru: 'баллы', en: 'score' },
  hallShort: { ru: 'галл.', en: 'hall.' },
  sinceLabel: { ru: 'с ', en: 'since ' },

  // ===== CONTEST PODIUM (extra) =====
  interviewComingSoon: { ru: 'Режим собеседования — в разработке', en: 'Interview mode — coming soon' },

  // ===== CONTEST ARBITER PANEL =====
  arbiterFollowUp: { ru: 'Дополнительный вопрос', en: 'Follow-up' },
  arbiterRound: { ru: 'Тур', en: 'Round' },

  // ===== CONTEST ARBITRATION =====
  contestArbitrationStep: { ru: 'Шаг 4', en: 'Step 4' },
  juryCompositionLabel: { ru: 'Состав жюри', en: 'Jury Composition' },
  scoreWeightLabel: { ru: 'Вес оценки: Пользователь vs Арбитр', en: 'Score Weight: User vs Arbiter' },
  userLabel: { ru: 'Пользователь', en: 'User' },
  arbiterLabel: { ru: 'Арбитр', en: 'Arbiter' },
  candidateEvalCategories: { ru: 'Категории оценки кандидатов', en: 'Candidate Evaluation Categories' },
  criteriaWeightsLabel: { ru: 'Веса критериев', en: 'Criteria Weights' },
  sumLabel: { ru: 'сумма', en: 'total' },
  finalScoringSchemeLabel: { ru: 'Схема итоговой оценки', en: 'Final Scoring Scheme' },

  // ===== DUEL SCORES PANEL =====
  duelSummary: { ru: 'Итоги дуэли', en: 'Duel Summary' },
  duelDuelist: { ru: 'Дуэлянт', en: 'Duelist' },
  duelResult: { ru: 'Результат', en: 'Result' },
  duelPerRound: { ru: 'По раундам', en: 'Per Round' },
  duelWeighted: { ru: 'Средневзвеш.', en: 'Weighted' },
  duelTournament: { ru: 'Турнир', en: 'Tournament' },
  duelElo: { ru: 'Эло', en: 'Elo' },
  duelScore2: { ru: 'Итог', en: 'Score' },

  // ===== DUEL PODIUM SCOREBOARD =====
  duelWinner: { ru: 'Победитель:', en: 'Winner:' },
  duelDraws: { ru: 'ничьих', en: 'draws' },
  duelDrawResult: { ru: 'Ничья!', en: 'Draw!' },
  duelRoundProgress: { ru: 'Раунд', en: 'R' },
  duelFinishButton: { ru: 'Завершить', en: 'Finish' },

  // ===== CONTEST RULES EDITOR =====
  rulesStep2: { ru: 'Шаг 2', en: 'Step 2' },
  rulesContestRules: { ru: 'Правила конкурса', en: 'Contest Rules' },
  rulesRoundCount: { ru: 'Количество туров', en: 'Number of Rounds' },
  rulesRoundN: { ru: 'Тур', en: 'Round' },
  rulesAssignmentType: { ru: 'Тип задания', en: 'Assignment Type' },
  rulesFreePrompt: { ru: 'Свободный промпт', en: 'Free Prompt' },
  rulesRoleBased: { ru: 'По роли', en: 'Role-based' },
  rulesRolePlaceholder: { ru: 'Роль...', en: 'Role...' },
  rulesExperts: { ru: 'Эксперты', en: 'Experts' },
  rulesTechStaff: { ru: 'Технический персонал', en: 'Technical Staff' },
  rulesQC: { ru: 'ОТК', en: 'QC Dept' },
  rulesRoleTooltip: { ru: 'Ролевой промпт из Штатного расписания будет автоматически объединён с промптом тура. Ролевые критерии оценки добавятся к плану.', en: 'Role system prompt from Staff will be merged with round prompt. Role-specific evaluation criteria will be added to the plan.' },
  rulesRoleCriteria: { ru: 'Критерии роли (добавятся автоматически):', en: 'Role criteria (auto-added):' },
  rulesRoundPrompt: { ru: 'Промпт тура', en: 'Round Prompt' },
  rulesPromptPlaceholder: { ru: 'Введите задание для моделей...', en: 'Enter assignment for models...' },
  rulesEvalCriteria: { ru: 'Критерии оценки', en: 'Evaluation Criteria' },
  rulesEliminationRule: { ru: 'Правило прохождения', en: 'Elimination Rule' },
  rulesThresholdLabel: { ru: 'Порог (из 10):', en: 'Threshold (of 10):' },
  rulesThresholdDesc: { ru: 'Модели с баллом ниже будут автоматически отсеяны', en: 'Models scoring below will be auto-eliminated' },

  // ===== CONTEST SUMMARY ACTIONS =====
  actionsImport: { ru: 'Импорт', en: 'Import' },
  actionsExport: { ru: 'Экспорт', en: 'Export' },
  actionsResetAll: { ru: 'Сбросить всё', en: 'Reset All' },
  actionsResetTitle: { ru: 'Сбросить настройки конкурса?', en: 'Reset contest settings?' },
  actionsResetDesc: { ru: 'Все настройки конкурса (участники, правила, пайплайн, арбитраж, сохранённый план) будут удалены. Это действие нельзя отменить.', en: 'All contest settings (participants, rules, pipeline, arbitration, saved plan) will be cleared. This cannot be undone.' },
  actionsCancel: { ru: 'Отмена', en: 'Cancel' },
  actionsReset: { ru: 'Сбросить', en: 'Reset' },
  actionsExported: { ru: 'Настройки экспортированы', en: 'Settings exported' },
  actionsImported: { ru: 'Настройки импортированы', en: 'Settings imported' },
  actionsImportError: { ru: 'Ошибка чтения файла', en: 'Failed to read file' },
  actionsResetDone: { ru: 'Настройки конкурса сброшены', en: 'Contest settings reset' },

  // ===== CONTEST FOLLOW-UP INPUT =====
  followUpQuestionForLabel: { ru: 'Вопрос для:', en: 'Question for:' },
  followUpAllLabel: { ru: '(всем)', en: '(all)' },
  followUpSendAll: { ru: 'Отправить всем конкурсантам', en: 'Send to all contestants' },
  followUpSendModel: { ru: 'Отправить только', en: 'Send only to' },

  // ===== CONTEST SUMMARY TOASTS =====
  planSaved: { ru: 'План конкурса сохранён', en: 'Contest plan saved' },
  validationError: { ru: 'Ошибка валидации:', en: 'Validation error:' },
  errorPrefix: { ru: 'Ошибка:', en: 'Error:' },

  // ===== CONTEST FINISH DIALOG =====
  finishContestTitle: { ru: 'Завершить конкурс?', en: 'Finish contest?' },
  finishContestDesc: { ru: 'Все текущие раунды будут завершены. Это действие нельзя отменить.', en: 'All current rounds will be completed. This action cannot be undone.' },

  // ===== CONTEST PROMPT PREVIEW =====
  round1Prompt: { ru: 'Промпт тура 1', en: 'Round 1 Prompt' },

  // ===== CONTEST ARBITRATION DETAILS =====
  arbitrationSection: { ru: 'Арбитраж', en: 'Arbitration' },
  juryLabel: { ru: 'Жюри', en: 'Jury' },
  schemeLabel: { ru: 'Схема', en: 'Scheme' },

  // ===== USER SCORE WIDGET =====
  ratingLabel: { ru: 'Рейтинг:', en: 'Rating:' },

  // ===== DUEL PLAN EDITOR =====
  duelStep1: { ru: 'Шаг 1', en: 'Step 1' },
  duelStep2: { ru: 'Шаг 2', en: 'Step 2' },
  duelStep3: { ru: 'Шаг 3', en: 'Step 3' },
  duelStep4: { ru: 'Шаг 4', en: 'Step 4' },
  duelTemplateInfo: { ru: 'Шаблон определяет цепочку: аргументы дуэлянтов → перекрёстное слияние → арбитраж → итоги раунда.', en: 'Template defines the chain: duelist arguments → cross-merge → arbitration → round results.' },
  duelSelectFlowStep2: { ru: 'Выберите шаблон потока в шаге 2', en: 'Select flow template in step 2' },
  duelPlanSaved: { ru: 'План дуэли сохранён', en: 'Duel plan saved' },
  duelNotSelected: { ru: 'Не выбран', en: 'Not selected' },
  duelAutoGenDesc: { ru: 'Автогенерация из плана дуэли. Раундов:', en: 'Auto-generated from duel plan. Rounds:' },
  contestAutoGenDesc: { ru: 'Автогенерация из плана конкурса. Участников:', en: 'Auto-generated from contest plan. Participants:' },
  contestAutoGenRounds: { ru: 'Туров:', en: 'Rounds:' },
  contestPrefix: { ru: 'Конкурс', en: 'Contest' },
  duelPrefix: { ru: 'Дуэль', en: 'Duel' },

  // ===== CONTEXT ROUND LABELS =====
  withContextRounds: { ru: 'с контекстом', en: 'with' },
  roundContextSuffix: { ru: 'тура', en: 'round' },
  roundsContextSuffix: { ru: 'туров', en: 'rounds' },

  // ===== DUEL PLAN EDITOR (scoring descriptions) =====
  scoringDescWeightedAvg: { ru: 'Итоговый балл = среднее взвешенное по выбранным критериям', en: 'Final score = weighted average across selected criteria' },
  scoringDescTournament: { ru: 'Модели проходят через сетку попарных сравнений', en: 'Models go through a bracket of pairwise comparisons' },
  scoringDescElo: { ru: 'Динамический рейтинг по системе Эло на основе дуэлей', en: 'Dynamic rating based on Elo system from duels' },
  duelTemplateChainInfo: { ru: 'Шаблон определяет цепочку: аргументы дуэлянтов → перекрёстное слияние → арбитраж → итоги раунда.', en: 'Template defines the chain: duelist arguments → cross-merge → arbitration → round results.' },

  // ===== CRITIQUE SUMMARY CARD =====
  critiqueTitle: { ru: 'Критика', en: 'Critique' },

  // ===== LIKERT SUMMARY CARD =====
  likertSummaryTitle: { ru: 'Сводка оценок арбитража', en: 'Arbitration Assessment Summary' },
  likertAvgScore: { ru: 'Средний балл', en: 'Avg score' },
  likertClaims: { ru: 'Аргументов', en: 'Claims' },
  likertSessions: { ru: 'Сессий', en: 'Sessions' },
  likertDistribution: { ru: 'Распределение оценок', en: 'Score Distribution' },
  likertDisputed: { ru: 'Спорные аргументы', en: 'Disputed Arguments' },

  // ===== LIKERT EVALUATION DISPLAY =====
  likertArgumentAssessment: { ru: 'Оценка аргументов', en: 'Argument Assessment' },
  likertShowArguments: { ru: 'Показать {count} аргументов', en: 'Show {count} arguments' },

  // ===== CONTEST TASK SELECTOR =====
  taskStep1: { ru: 'Шаг 1', en: 'Step 1' },
  taskParticipantsAndTask: { ru: 'Участники и Задача', en: 'Participants & Task' },
  taskLabel2: { ru: 'Задача', en: 'Task' },
  taskSelectPlaceholder: { ru: 'Выберите задачу...', en: 'Select a task...' },
  taskUntitled: { ru: 'Без названия', en: 'Untitled' },
  taskAttachedFiles: { ru: 'Прикреплённые файлы', en: 'Attached Files' },
  taskNoFilesAttach: { ru: 'Нет файлов. Прикрепите в панели Задач.', en: 'No files. Attach in Tasks panel.' },
  taskSelectToViewFiles: { ru: 'Выберите задачу для просмотра файлов', en: 'Select a task to view files' },
  taskPodiumParticipants: { ru: 'Участники подиума', en: 'Podium Participants' },
  taskAddModel: { ru: 'Добавить модель', en: 'Add model' },
  taskSearchModel: { ru: 'Поиск модели...', en: 'Search model...' },
  taskNoModelsAvailable: { ru: 'Нет доступных моделей', en: 'No available models' },
  taskAddModelsHint: { ru: 'Добавьте модели кнопкой выше или на вкладке «Портфолио»', en: 'Add models with the button above or from the "Portfolio" tab' },
  taskRemove: { ru: 'Убрать', en: 'Remove' },

  // ===== CONTEST PIPELINE SELECTOR =====
  pipelineStep3: { ru: 'Шаг 3', en: 'Step 3' },
  pipelineTitle: { ru: 'Пайплайн (шаблон потока)', en: 'Pipeline (Flow Template)' },
  pipelineFlowTemplate: { ru: 'Шаблон потока выполнения', en: 'Execution Flow Template' },
  pipelineNoTemplate: { ru: 'Без шаблона конкурс будет выполняться вручную.', en: 'Without a template the contest will run manually.' },
  pipelineInfo: { ru: 'Шаблон определяет автоматическую цепочку: ответы кандидатов → оценки пользователя → арбитраж → подведение итогов.', en: 'Template defines the automated chain: candidate responses → user ratings → arbitration → final results.' },

  // ===== CONTEST SAVED PLAN =====
  savedFlow: { ru: 'Сохранённый поток', en: 'Saved Flow' },
  openInEditor: { ru: 'Открыть в редакторе', en: 'Open in Editor' },
  nodesLabel: { ru: 'Узлов', en: 'Nodes' },
  edgesLabel: { ru: 'Связей', en: 'Edges' },

  // ===== SCORING SCHEME COMPARISON =====
  schemesComparison: { ru: 'Сравнение схем оценки', en: 'Scoring Schemes Comparison' },
  schemesDisagreement: { ru: 'расхождений', en: 'disagreements' },
  schemesFooter: { ru: '▲▼ — изменение позиции относительно средневзвешенного балла • Подсветка = расхождение рейтингов между схемами', en: '▲▼ — rank change vs weighted avg baseline • Highlight = ranking disagreement between schemes' },

  // ===== MODEL PORTFOLIO =====
  portfolioSelectModel: { ru: 'Выберите модель для просмотра досье', en: 'Select a model to view its dossier' },
  portfolioMinContestants: { ru: 'Минимум 3 участника конкурса для корректного пьедестала.', en: 'Minimum 3 contest participants for a valid podium.' },
  portfolioMaxContestants: { ru: 'Максимум 8 участников конкурса.', en: 'Maximum 8 contest participants.' },
  portfolioCannotChangeDuel: { ru: 'Нельзя менять дуэлянтов во время дуэли. Дождитесь завершения.', en: 'Cannot change duelists while a duel is running. Wait for it to finish.' },
  portfolioMaxDuelists: { ru: 'Максимум 2 дуэлянта. Сначала уберите одного из выбранных.', en: 'Maximum 2 duelists. Remove one first.' },
  portfolioCannotChangeType: { ru: 'Нельзя менять тип дуэлянта во время дуэли.', en: 'Cannot change duelist type during a running duel.' },

  // ===== CANDIDATE DETAIL =====
  candidateAvailable: { ru: 'Доступна', en: 'Available' },
  candidateUnavailable: { ru: 'Недоступна', en: 'Unavailable' },
  candidateOnPodium: { ru: 'На подиуме', en: 'On podium' },
  candidateDuelist: { ru: 'Дуэлянт', en: 'Duelist' },
  candidateCreator: { ru: 'Создатель', en: 'Creator' },
  candidateReleased: { ru: 'Дата выпуска', en: 'Released' },
  candidateParams: { ru: 'Параметры', en: 'Parameters' },
  candidatePricing: { ru: 'Тарифы', en: 'Pricing' },
  candidateType: { ru: 'Тип', en: 'Type' },
  candidateProvider: { ru: 'Провайдер', en: 'Provider' },
  candidateAddApiKey: { ru: 'Добавьте API-ключ в профиле', en: 'Add API key in profile' },
  candidateRolePlaceholder: { ru: 'Роль...', en: 'Role...' },
  candidateRemoveFromPodium: { ru: 'Убрать с подиума', en: 'Remove from podium' },
  candidateInviteToPodium: { ru: 'Пригласить на подиум', en: 'Invite to podium' },
  candidateCritic: { ru: 'Критик', en: 'Critic' },
  candidateArbiter: { ru: 'Арбитр', en: 'Arbiter' },
  candidateDuelLocked: { ru: 'Дуэль идёт — замена запрещена', en: 'Duel in progress — changes locked' },
  candidateCancelDuel: { ru: 'Отменить дуэль', en: 'Cancel duel' },
  candidateChallengeDuel: { ru: 'Вызвать на дуэль', en: 'Challenge to duel' },
  candidateNoDetailedInfo: { ru: 'Подробная информация о модели пока недоступна', en: 'Detailed model info not yet available' },
} as const;

export type RatingsI18nKey = keyof typeof RATINGS_I18N;

/**
 * Get localized text by key and language
 */
export function getRatingsText(key: RatingsI18nKey, isRu: boolean): string {
  const value = RATINGS_I18N[key];
  return isRu ? value.ru : value.en;
}

/**
 * Map of criteria keys (from arbiter) to i18n keys for localization
 */
const CRITERIA_I18N_MAP: Record<string, { ru: string; en: string }> = {
  factuality: { ru: 'Фактологичность', en: 'Factuality' },
  relevance: { ru: 'Релевантность', en: 'Relevance' },
  completeness: { ru: 'Полнота', en: 'Completeness' },
  clarity: { ru: 'Ясность', en: 'Clarity' },
  consistency: { ru: 'Консистентность', en: 'Consistency' },
  creativity: { ru: 'Креативность', en: 'Creativity' },
  cost_efficiency: { ru: 'Эффективность', en: 'Cost Efficiency' },
  speed: { ru: 'Скорость', en: 'Speed' },
  structure: { ru: 'Структура', en: 'Structure' },
  practicality: { ru: 'Практичность', en: 'Practicality' },
  accuracy: { ru: 'Точность', en: 'Accuracy' },
  // Role-specific criteria (arbiter)
  synthesis_quality: { ru: 'Качество синтеза', en: 'Synthesis Quality' },
  fairness: { ru: 'Объективность', en: 'Fairness' },
  decision_justification: { ru: 'Обоснование решения', en: 'Decision Justification' },
  nuance_preservation: { ru: 'Сохранение нюансов', en: 'Nuance Preservation' },
  consensus_strength: { ru: 'Сила консенсуса', en: 'Consensus Strength' },
  // Role-specific criteria (advisor)
  actionability: { ru: 'Применяемость', en: 'Actionability' },
  risk_awareness: { ru: 'Осознание рисков', en: 'Risk Awareness' },
  timeline_clarity: { ru: 'Ясность сроков', en: 'Timeline Clarity' },
  resource_feasibility: { ru: 'Доступность ресурсов', en: 'Resource Feasibility' },
  // Role-specific criteria (analyst)
  data_accuracy: { ru: 'Точность данных', en: 'Data Accuracy' },
  methodology_rigor: { ru: 'Строгость методологии', en: 'Methodology Rigor' },
  insight_depth: { ru: 'Глубина инсайта', en: 'Insight Depth' },
  correlation_vs_causation: { ru: 'Корреляция vs причинность', en: 'Correlation vs Causation' },
  limitation_acknowledgment: { ru: 'Признание ограничений', en: 'Limitation Acknowledgment' },
  // Role-specific criteria (assistant)
  argument_strength: { ru: 'Сила аргументов', en: 'Argument Strength' },
  logic_coherence: { ru: 'Логическая согласованность', en: 'Logic Coherence' },
  evidence_quality: { ru: 'Качество доказательств', en: 'Evidence Quality' },
  bias_detection: { ru: 'Обнаружение предубеждений', en: 'Bias Detection' },
  counter_example_coverage: { ru: 'Охват контраргументов', en: 'Counter-example Coverage' },

  // ===== LIKERT SCALE (Arbiter Duel Meta-Critic) =====
  likertFullyAgree: { ru: 'Полностью согласен', en: 'Fully agree' },
  likertAgreeNuance: { ru: 'Согласен, но есть нюансы', en: 'Agree, but with nuance' },
  likertNeedsClarification: { ru: 'Требует разъяснения', en: 'Needs clarification' },
  likertMostlyDisagree: { ru: 'Скорее нет, чем да', en: 'Mostly disagree' },
  likertDisagree: { ru: 'Не согласен', en: 'Disagree' },
  likertNonsense: { ru: 'Бред', en: 'Nonsense' },
  arbitrationQuality: { ru: 'Качество судейства', en: 'Arbitration Quality' },
  verdictAnalysis: { ru: 'Анализ вердиктов', en: 'Verdict Analysis' },
};

/**
 * Get localized criterion label. Falls back to raw key if not found.
 */
export function getCriterionLabel(key: string, isRu: boolean): string {
  const entry = CRITERIA_I18N_MAP[key];
  return entry ? (isRu ? entry.ru : entry.en) : key;
}
