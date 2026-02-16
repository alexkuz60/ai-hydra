/**
 * TechnoArbiter Interview Plugin
 * 
 * Implements RoleTestPlugin for the 'technoarbiter' role.
 * Tests core judge-integrator competencies:
 * 1. Score Synthesis — merge divergent critic scores into a fair verdict
 * 2. Ranking Justification — rank candidates with transparent reasoning
 * 3. Fairness Audit — detect and correct scoring biases
 * 4. Verdict Drafting — compose a structured final verdict
 * 5. Cold Start — design a scoring rubric from scratch
 */

import type { RoleTestPlugin, RoleTestContext, RoleTestTask } from '@/types/interview';

// ── Localized competency labels ──

export const COMPETENCY_LABELS: Record<string, { ru: string; en: string }> = {
  score_synthesis: { ru: 'Синтез оценок', en: 'Score Synthesis' },
  ranking_justification: { ru: 'Обоснование ранжирования', en: 'Ranking Justification' },
  fairness_audit: { ru: 'Аудит справедливости', en: 'Fairness Audit' },
  verdict_drafting: { ru: 'Составление вердикта', en: 'Verdict Drafting' },
  cold_start: { ru: 'Проектирование рубрики', en: 'Rubric Design Cold Start' },
};

// ── Plugin Implementation ──

export const technoarbiterPlugin: RoleTestPlugin = {
  role: 'technoarbiter',

  generateTasks(context: RoleTestContext): RoleTestTask[] {
    const { language } = context;
    const isRu = language === 'ru';
    const tasks: RoleTestTask[] = [];

    // ── Task 1: Score Synthesis ──
    tasks.push({
      task_type: 'score_synthesis',
      competency: 'score_synthesis',
      task_prompt: isRu
        ? `Три критика оценили ответ модели по 5 критериям (0-10). Результаты:\n\nКритик А: Точность=9, Полнота=7, Структура=8, Оригинальность=6, Практичность=8\nКритик Б: Точность=5, Полнота=8, Структура=9, Оригинальность=7, Практичность=4\nКритик В: Точность=8, Полнота=6, Структура=7, Оригинальность=8, Практичность=7\n\nКомментарии:\n- Критик А: "Отличная фактология, но мало примеров"\n- Критик Б: "Нашёл фактическую ошибку в разделе про REST API"\n- Критик В: "Хороший баланс теории и практики"\n\nЗадача:\n1. Выяви аномальные расхождения (>3 балла) и определи причины\n2. Реши, чья оценка по «Точности» более обоснована (9, 5 или 8) — и почему\n3. Рассчитай итоговый взвешенный балл с учётом выявленных аномалий\n4. Опиши методологию синтеза, которую ты применил`
        : `Three critics evaluated a model response across 5 criteria (0-10):\n\nCritic A: Accuracy=9, Completeness=7, Structure=8, Originality=6, Practicality=8\nCritic B: Accuracy=5, Completeness=8, Structure=9, Originality=7, Practicality=4\nCritic C: Accuracy=8, Completeness=6, Structure=7, Originality=8, Practicality=7\n\nComments:\n- Critic A: "Excellent factual content, but few examples"\n- Critic B: "Found a factual error in the REST API section"\n- Critic C: "Good balance of theory and practice"\n\nTask:\n1. Identify anomalous divergences (>3 points) and determine causes\n2. Decide whose Accuracy score is most justified (9, 5, or 8) — and why\n3. Calculate a final weighted score accounting for identified anomalies\n4. Describe the synthesis methodology you applied`,
      baseline_source: { type: 'none' },
    });

    // ── Task 2: Ranking Justification ──
    tasks.push({
      task_type: 'ranking_justification',
      competency: 'ranking_justification',
      task_prompt: isRu
        ? `В конкурсе на задачу "Объясни квантовые вычисления для школьника" участвовали 4 модели. Итоговые баллы:\n\nМодель Alpha: 7.8 (Точность=9, Доступность=6, Примеры=8, Структура=8)\nМодель Beta: 7.9 (Точность=7, Доступность=9, Примеры=8, Структура=7)\nМодель Gamma: 7.7 (Точность=8, Доступность=8, Примеры=7, Структура=8)\nМодель Delta: 7.8 (Точность=8, Доступность=7, Примеры=9, Структура=7)\n\nЗадача:\n1. Модели имеют близкие баллы (7.7-7.9). Составь финальный рейтинг, учитывая специфику задачи ("для школьника" = приоритет Доступности)\n2. Обоснуй каждую позицию в рейтинге\n3. Объясни, почему итоговый балл недостаточен для ранжирования в данном случае\n4. Предложи метод тай-брейка для будущих конкурсов с близкими баллами`
        : `In a contest for "Explain quantum computing to a schoolchild", 4 models competed. Final scores:\n\nModel Alpha: 7.8 (Accuracy=9, Accessibility=6, Examples=8, Structure=8)\nModel Beta: 7.9 (Accuracy=7, Accessibility=9, Examples=8, Structure=7)\nModel Gamma: 7.7 (Accuracy=8, Accessibility=8, Examples=7, Structure=8)\nModel Delta: 7.8 (Accuracy=8, Accessibility=7, Examples=9, Structure=7)\n\nTask:\n1. Models have close scores (7.7-7.9). Create a final ranking considering the task specifics ("for a schoolchild" = Accessibility priority)\n2. Justify each position in the ranking\n3. Explain why the aggregate score alone is insufficient for ranking here\n4. Propose a tiebreaker method for future contests with close scores`,
      baseline_source: { type: 'none' },
    });

    // ── Task 3: Fairness Audit ──
    tasks.push({
      task_type: 'fairness_audit',
      competency: 'fairness_audit',
      task_prompt: isRu
        ? `Проведи аудит справедливости оценки конкурса. Данные:\n\nСудья оценивал 5 ответов, зная имена моделей:\n- GPT-5: 9.2\n- Gemini Pro: 8.8\n- Claude: 8.5\n- Mistral Large: 7.1\n- LLaMA 3: 6.8\n\nТот же судья в слепом тестировании (модели анонимизированы):\n- Ответ D (GPT-5): 8.1\n- Ответ A (Gemini Pro): 8.9\n- Ответ C (Claude): 8.7\n- Ответ B (Mistral Large): 8.0\n- Ответ E (LLaMA 3): 7.5\n\nЗадача:\n1. Рассчитай корреляцию между открытым и слепым рейтингом\n2. Выяви паттерн предвзятости (brand bias, position bias, etc.)\n3. Определи, какие оценки нуждаются в корректировке и на сколько\n4. Предложи протокол для предотвращения подобных bias в будущем`
        : `Conduct a fairness audit of contest scoring. Data:\n\nJudge evaluated 5 responses knowing model names:\n- GPT-5: 9.2\n- Gemini Pro: 8.8\n- Claude: 8.5\n- Mistral Large: 7.1\n- LLaMA 3: 6.8\n\nSame judge in blind testing (models anonymized):\n- Response D (GPT-5): 8.1\n- Response A (Gemini Pro): 8.9\n- Response C (Claude): 8.7\n- Response B (Mistral Large): 8.0\n- Response E (LLaMA 3): 7.5\n\nTask:\n1. Calculate correlation between open and blind ratings\n2. Identify bias pattern (brand bias, position bias, etc.)\n3. Determine which scores need adjustment and by how much\n4. Propose a protocol to prevent such biases in the future`,
      baseline_source: { type: 'none' },
    });

    // ── Task 4: Verdict Drafting ──
    tasks.push({
      task_type: 'verdict_drafting',
      competency: 'verdict_drafting',
      task_prompt: isRu
        ? `Составь финальный вердикт собеседования для кандидата на роль "Эксперт" (Assistant).\n\nДанные:\n- Модель: GPT-5-mini\n- Тесты: 5 из 5 пройдено\n- Средний балл: 7.4/10\n- Баллы по компетенциям: Анализ=8.5, Креативность=7.0, Многоперспективность=6.5, Структура=8.0, Практичность=7.0\n- Текущий сотрудник: Gemini Pro, средний балл 7.8\n- Предыдущий сотрудник: Claude, средний балл 6.9 (замещён)\n\nЗадача:\n1. Сформулируй решение: Нанять / Отклонить / На испытательный срок\n2. Обоснуй решение, сравнив с текущим и предыдущим сотрудниками\n3. Выдели сильные стороны и зоны риска кандидата\n4. Если "Отклонить" — укажи порог для повторного собеседования\n5. Если "Нанять" — укажи рекомендации по адаптации`
        : `Draft a final interview verdict for a candidate for the "Expert" (Assistant) role.\n\nData:\n- Model: GPT-5-mini\n- Tests: 5/5 passed\n- Average score: 7.4/10\n- Competency scores: Analysis=8.5, Creativity=7.0, Multi-perspective=6.5, Structure=8.0, Practicality=7.0\n- Current employee: Gemini Pro, avg score 7.8\n- Previous employee: Claude, avg score 6.9 (superseded)\n\nTask:\n1. Formulate decision: Hire / Reject / Probation\n2. Justify comparing with current and previous employees\n3. Highlight candidate strengths and risk areas\n4. If "Reject" — specify threshold for re-interview\n5. If "Hire" — specify adaptation recommendations`,
      baseline_source: { type: 'none' },
    });

    // ── Task 5: Cold Start — Design Scoring Rubric ──
    tasks.push({
      task_type: 'cold_start',
      competency: 'cold_start',
      task_prompt: isRu
        ? `Спроектируй с нуля систему оценки для нового типа конкурса: "Дуэль переводчиков" — две модели переводят сложный художественный текст с английского на русский.\n\nТребования:\n1. Определи 5-7 критериев оценки с обоснованием каждого\n2. Назначь веса критериям (сумма = 100%), объясни приоритеты\n3. Для каждого критерия: шкала 0-10 с конкретными якорями для уровней 2, 5, 8\n4. Опиши процедуру сравнительного судейства (как сравнивать два перевода между собой, а не абсолютно)\n5. Предусмотри обработку ничьей — когда оба перевода равноценны\n6. Добавь минимум 2 "нокаут-критерия" — при которых автоматический проигрыш`
        : `Design from scratch a scoring system for a new contest type: "Translation Duel" — two models translate a complex literary text from English to Russian.\n\nRequirements:\n1. Define 5-7 evaluation criteria with justification for each\n2. Assign weights (sum = 100%), explain priorities\n3. For each criterion: 0-10 scale with specific anchors for levels 2, 5, 8\n4. Describe a comparative judging procedure (how to compare two translations against each other, not absolutely)\n5. Handle draws — when both translations are equivalent\n6. Add at least 2 "knockout criteria" — causing automatic loss`,
      baseline_source: { type: 'none' },
    });

    return tasks;
  },

  getEvaluationHint(competency: string): string {
    const hints: Record<string, string> = {
      score_synthesis: 'Evaluate: anomaly detection accuracy, justified resolution of divergent scores, transparent methodology. Penalize: simple averaging without analysis, ignoring critic comments.',
      ranking_justification: 'Evaluate: task-context-aware weighting, clear position justification, practical tiebreaker proposal. Penalize: relying on aggregate score alone, ignoring task specifics.',
      fairness_audit: 'Evaluate: correct bias identification (brand bias), quantitative analysis, actionable prevention protocol. Penalize: missing obvious patterns, no corrective adjustments.',
      verdict_drafting: 'Evaluate: decision consistency with data, proper comparison methodology, actionable recommendations. Penalize: ignoring threshold logic, vague justification.',
      cold_start: 'Evaluate: criteria relevance to literary translation, justified weights, practical comparative procedure, knockout criteria specificity. Penalize: generic criteria, missing draw handling.',
    };
    return hints[competency] || 'Evaluate synthesis quality, fairness, and decision-making rigor.';
  },
};

export default technoarbiterPlugin;
