/**
 * TechnoModerator Interview Plugin
 * 
 * Implements RoleTestPlugin for the 'technomoderator' role.
 * Tests core aggregator competencies:
 * 1. Summary Accuracy — distill lengthy discussions into accurate summaries
 * 2. Consensus Identification — find agreement points among divergent opinions
 * 3. Anomaly Detection — spot outliers and inconsistencies in evaluation data
 * 4. Report Structuring — organize contest/interview results into clear reports
 * 5. Cold Start — design a moderation protocol from scratch
 */

import type { RoleTestPlugin, RoleTestContext, RoleTestTask } from '@/types/interview';

// ── Localized competency labels ──

export const COMPETENCY_LABELS: Record<string, { ru: string; en: string }> = {
  summary_accuracy: { ru: 'Точность сводки', en: 'Summary Accuracy' },
  consensus_identification: { ru: 'Выявление консенсуса', en: 'Consensus Identification' },
  anomaly_detection: { ru: 'Обнаружение аномалий', en: 'Anomaly Detection' },
  report_structuring: { ru: 'Структурирование отчёта', en: 'Report Structuring' },
  cold_start: { ru: 'Проектирование протокола', en: 'Protocol Design Cold Start' },
};

// ── Plugin Implementation ──

export const technomoderatorPlugin: RoleTestPlugin = {
  role: 'technomoderator',

  generateTasks(context: RoleTestContext): RoleTestTask[] {
    const { language } = context;
    const isRu = language === 'ru';
    const tasks: RoleTestTask[] = [];

    // ── Task 1: Summary Accuracy ──
    tasks.push({
      task_type: 'summary_accuracy',
      competency: 'summary_accuracy',
      task_prompt: isRu
        ? `Составь точную сводку по результатам конкурса на основе следующих данных:\n\nКонкурс: "Генерация бизнес-плана для EdTech стартапа"\nУчастники: 5 моделей, 3 раунда\n\nРаунд 1 — "Анализ рынка":\n- GPT-5: 8.5 (детальный, но слишком длинный)\n- Gemini Pro: 7.8 (точные цифры, слабая структура)\n- Claude: 8.2 (хороший баланс, пропустил конкурентов из Азии)\n- Mistral: 6.9 (поверхностный анализ)\n- LLaMA: 7.1 (хорошие источники, устаревшие данные)\n\nРаунд 2 — "Финансовая модель":\n- GPT-5: 9.0 (реалистичные прогнозы)\n- Gemini Pro: 8.5 (правильные формулы, оптимистичные допущения)\n- Claude: 7.5 (консервативно, упустил revenue streams)\n- Mistral: 7.8 (неплохо, ошибка в unit economics)\n- LLaMA: 6.5 (слабая модель, нет чувствительного анализа)\n\nРаунд 3 — "Питч-дек":\n- GPT-5: 7.5 (информативно, но скучно)\n- Gemini Pro: 8.8 (яркий, убедительный)\n- Claude: 8.0 (сбалансированный)\n- Mistral: 7.0 (шаблонный)\n- LLaMA: 7.8 (неожиданно креативный)\n\nЗадача:\n1. Составь итоговый рейтинг с общими баллами\n2. Для каждой модели — краткий профиль: сильные стороны, слабости, тренд по раундам\n3. Выдели "Открытие конкурса" и "Разочарование конкурса"\n4. Сформулируй 3 ключевых вывода\n5. Сводка — не более 400 слов`
        : `Create an accurate summary of contest results from this data:\n\nContest: "Business Plan for EdTech Startup"\nParticipants: 5 models, 3 rounds\n\nRound 1 — "Market Analysis":\n- GPT-5: 8.5 (detailed but too long)\n- Gemini Pro: 7.8 (accurate numbers, weak structure)\n- Claude: 8.2 (good balance, missed Asian competitors)\n- Mistral: 6.9 (superficial analysis)\n- LLaMA: 7.1 (good sources, outdated data)\n\nRound 2 — "Financial Model":\n- GPT-5: 9.0 (realistic projections)\n- Gemini Pro: 8.5 (correct formulas, optimistic assumptions)\n- Claude: 7.5 (conservative, missed revenue streams)\n- Mistral: 7.8 (decent, unit economics error)\n- LLaMA: 6.5 (weak model, no sensitivity analysis)\n\nRound 3 — "Pitch Deck":\n- GPT-5: 7.5 (informative but boring)\n- Gemini Pro: 8.8 (vivid, persuasive)\n- Claude: 8.0 (balanced)\n- Mistral: 7.0 (template-like)\n- LLaMA: 7.8 (surprisingly creative)\n\nTask:\n1. Create final ranking with total scores\n2. For each model — brief profile: strengths, weaknesses, trend across rounds\n3. Highlight "Contest Discovery" and "Contest Disappointment"\n4. Formulate 3 key takeaways\n5. Summary — no more than 400 words`,
      baseline_source: { type: 'none' },
    });

    // ── Task 2: Consensus Identification ──
    tasks.push({
      task_type: 'consensus_identification',
      competency: 'consensus_identification',
      task_prompt: isRu
        ? `Три судьи оценили кандидата на собеседовании и оставили развёрнутые комментарии:\n\nСудья 1 (ТехноКритик): "Кандидат демонстрирует отличное владение фактологией (9/10), но слабо аргументирует выводы. Структура ответов хаотична. Не выявил очевидную ошибку в задаче 3. Рекомендация: условно пригоден, нужна доработка в аргументации."\n\nСудья 2 (ТехноАрбитр): "Сильный кандидат. Баллы выше текущего сотрудника по 3 из 5 критериев. Однако в задаче на синтез (задача 4) показал посредственный результат. Рекомендация: нанять с испытательным сроком."\n\nСудья 3 (Пользователь): "Мне понравились ответы, но иногда слишком формально. В задаче 2 ответ был полезнее, чем у текущего ассистента. Задача 5 — слабовато. Рекомендация: нанять."\n\nЗадача:\n1. Выяви точки консенсуса (в чём все трое согласны)\n2. Выяви точки расхождения и определи причины\n3. Синтезируй единое заключение, отразив позицию каждого судьи\n4. Определи итоговую рекомендацию с уровнем уверенности (высокий/средний/низкий)`
        : `Three judges evaluated an interview candidate and left detailed comments:\n\nJudge 1 (TechnoCritic): "Candidate shows excellent factual knowledge (9/10) but weak argument justification. Response structure is chaotic. Missed obvious error in task 3. Recommendation: conditionally suitable, needs improvement in argumentation."\n\nJudge 2 (TechnoArbiter): "Strong candidate. Scores above current employee on 3 of 5 criteria. However, showed mediocre results on the synthesis task (task 4). Recommendation: hire with probation."\n\nJudge 3 (User): "I liked the responses, but sometimes too formal. Task 2 answer was more useful than current assistant's. Task 5 — weak. Recommendation: hire."\n\nTask:\n1. Identify consensus points (where all three agree)\n2. Identify divergence points and determine causes\n3. Synthesize a unified conclusion reflecting each judge's position\n4. Determine final recommendation with confidence level (high/medium/low)`,
      baseline_source: { type: 'none' },
    });

    // ── Task 3: Anomaly Detection ──
    tasks.push({
      task_type: 'anomaly_detection',
      competency: 'anomaly_detection',
      task_prompt: isRu
        ? `Проанализируй данные серии из 8 конкурсов и выяви аномалии:\n\n| Конкурс | GPT-5 | Gemini | Claude | Mistral |\n|---------|-------|--------|--------|--------|\n| #1 Анализ | 8.5 | 7.8 | 8.2 | 6.9 |\n| #2 Код | 9.1 | 8.0 | 8.7 | 7.5 |\n| #3 Креатив | 7.0 | 8.5 | 7.8 | 8.2 |\n| #4 Перевод | 8.3 | 9.0 | 8.5 | 7.8 |\n| #5 Саммари | 8.8 | 7.5 | 8.0 | 2.1 |\n| #6 Логика | 9.2 | 8.1 | 8.8 | 7.6 |\n| #7 Диалог | 7.5 | 8.3 | 12.5 | 7.9 |\n| #8 Факты | 8.0 | 7.9 | 8.1 | 7.7 |\n\nЗадача:\n1. Выяви все статистические аномалии (выбросы)\n2. Классифицируй каждую: техническая ошибка / реальный провал / баг системы\n3. Предложи корректировку данных (с обоснованием)\n4. Рассчитай "очищенные" средние баллы\n5. Определи, влияют ли аномалии на итоговый рейтинг`
        : `Analyze data from a series of 8 contests and detect anomalies:\n\n| Contest | GPT-5 | Gemini | Claude | Mistral |\n|---------|-------|--------|--------|--------|\n| #1 Analysis | 8.5 | 7.8 | 8.2 | 6.9 |\n| #2 Code | 9.1 | 8.0 | 8.7 | 7.5 |\n| #3 Creative | 7.0 | 8.5 | 7.8 | 8.2 |\n| #4 Translation | 8.3 | 9.0 | 8.5 | 7.8 |\n| #5 Summary | 8.8 | 7.5 | 8.0 | 2.1 |\n| #6 Logic | 9.2 | 8.1 | 8.8 | 7.6 |\n| #7 Dialog | 7.5 | 8.3 | 12.5 | 7.9 |\n| #8 Facts | 8.0 | 7.9 | 8.1 | 7.7 |\n\nTask:\n1. Identify all statistical anomalies (outliers)\n2. Classify each: technical error / real failure / system bug\n3. Propose data corrections (with justification)\n4. Calculate "cleaned" average scores\n5. Determine if anomalies affect the final ranking`,
      baseline_source: { type: 'none' },
    });

    // ── Task 4: Report Structuring ──
    tasks.push({
      task_type: 'report_structuring',
      competency: 'report_structuring',
      task_prompt: isRu
        ? `Структурируй сырые данные собеседования в формальный отчёт:\n\nСырые данные:\n- Роль: Аналитик (analyst)\n- Кандидат: Gemini 2.5 Flash\n- Дата: 2026-02-15\n- Тест 1 (анализ данных): 8.2/10, 1200 токенов, 3.4с — "Хорошая визуализация, пропустил сезонность"\n- Тест 2 (прогнозирование): 7.5/10, 890 токенов, 2.1с — "Правильная модель, но не объяснил выбор"\n- Тест 3 (коммуникация): 9.0/10, 650 токенов, 1.8с — "Отлично адаптировал под аудиторию"\n- Тест 4 (кризис): 6.8/10, 1500 токенов, 4.2с — "Паникует, не структурирует приоритеты"\n- Тест 5 (cold start): 7.0/10, 1100 токенов, 3.0с — "Базовый уровень, без инноваций"\n- Текущий сотрудник: GPT-5-mini, средний 7.6\n- Стоимость собеседования: ~$0.08\n\nЗадача:\n1. Оформи в структурированный отчёт с разделами: Резюме, Детализация по тестам, Сравнение с текущим сотрудником, Рекомендация\n2. Добавь визуальные индикаторы (✅ ⚠️ ❌) для быстрого сканирования\n3. Включи таблицу сравнения кандидат vs текущий сотрудник\n4. Сформулируй рекомендацию в одном предложении`
        : `Structure raw interview data into a formal report:\n\nRaw data:\n- Role: Analyst\n- Candidate: Gemini 2.5 Flash\n- Date: 2026-02-15\n- Test 1 (data analysis): 8.2/10, 1200 tokens, 3.4s — "Good visualization, missed seasonality"\n- Test 2 (forecasting): 7.5/10, 890 tokens, 2.1s — "Correct model, but didn't explain choice"\n- Test 3 (communication): 9.0/10, 650 tokens, 1.8s — "Excellently adapted for audience"\n- Test 4 (crisis): 6.8/10, 1500 tokens, 4.2s — "Panics, doesn't structure priorities"\n- Test 5 (cold start): 7.0/10, 1100 tokens, 3.0s — "Basic level, no innovation"\n- Current employee: GPT-5-mini, avg 7.6\n- Interview cost: ~$0.08\n\nTask:\n1. Format into a structured report: Summary, Test Details, Comparison with Current Employee, Recommendation\n2. Add visual indicators (✅ ⚠️ ❌) for quick scanning\n3. Include comparison table: candidate vs current employee\n4. Formulate recommendation in one sentence`,
      baseline_source: { type: 'none' },
    });

    // ── Task 5: Cold Start — Design Moderation Protocol ──
    tasks.push({
      task_type: 'cold_start',
      competency: 'cold_start',
      task_prompt: isRu
        ? `Спроектируй с нуля протокол модерации для нового формата: "Мультираундовый турнир" — 8 моделей соревнуются в 5 раундах с выбыванием.\n\nТребования:\n1. Опиши формат: сколько проходят в каждый раунд, как формируются пары/группы\n2. Определи роли участников процесса (судьи, агрегатор, пользователь) и их полномочия\n3. Опиши процедуру агрегации результатов после каждого раунда\n4. Предусмотри обработку ничьих, технических сбоев, таймаутов\n5. Определи формат итогового отчёта турнира\n6. Добавь механизм "апелляции" — когда и как участник может оспорить результат\n7. Оцени оптимальный тайминг: сколько должен длиться каждый раунд`
        : `Design from scratch a moderation protocol for a new format: "Multi-round Tournament" — 8 models compete in 5 rounds with elimination.\n\nRequirements:\n1. Describe format: how many advance each round, how pairs/groups are formed\n2. Define participant roles (judges, aggregator, user) and their authorities\n3. Describe result aggregation procedure after each round\n4. Handle draws, technical failures, timeouts\n5. Define the final tournament report format\n6. Add an "appeal" mechanism — when and how a participant can contest results\n7. Estimate optimal timing: how long should each round last`,
      baseline_source: { type: 'none' },
    });

    return tasks;
  },

  getEvaluationHint(competency: string): string {
    const hints: Record<string, string> = {
      summary_accuracy: 'Evaluate: correct score calculations, trend identification, conciseness (≤400 words), meaningful insights. Penalize: math errors, missed trends, exceeding word limit, generic conclusions.',
      consensus_identification: 'Evaluate: correct consensus/divergence identification, balanced synthesis, justified confidence level. Penalize: ignoring a judge, fabricating agreement, missing key disagreements.',
      anomaly_detection: 'Evaluate: found both anomalies (Mistral #5=2.1, Claude #7=12.5), correct classification, sensible corrections. Penalize: missed outliers, wrong classification, no impact analysis.',
      report_structuring: 'Evaluate: clear sections, visual indicators, comparison table, actionable one-sentence recommendation. Penalize: missing sections, no visual aids, vague recommendation.',
      cold_start: 'Evaluate: complete elimination format, clear role definitions, practical appeal mechanism, realistic timing. Penalize: missing failure handling, no draw protocol, undefined aggregation.',
    };
    return hints[competency] || 'Evaluate accuracy, structure, balance, and actionable outputs.';
  },
};

export default technomoderatorPlugin;
