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
