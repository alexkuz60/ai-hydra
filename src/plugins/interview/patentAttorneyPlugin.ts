/**
 * Patent Attorney Interview Plugin
 * 
 * Implements RoleTestPlugin for the 'patent_attorney' role.
 * Tests core patent law competencies with "Presumption of Non-Novelty" guardrails:
 * 1. Legal Accuracy — correct terminology, claim formulations
 * 2. Analytical Depth — ability to identify patentable elements (with skepticism)
 * 3. Standards Knowledge — PCT, RF Civil Code Part IV, FIPS/USPTO
 * 4. Claim Structure — proper independent/dependent claims format
 * 5. Prior Art Search — quality of search query formulation
 * 6. Risk Assessment — threat evaluation with hard cutoffs
 * 7. Plain Language — accessible explanation of claims
 * 8. Devil's Advocate — adversarial pass to find reasons for rejection
 */

import type { RoleTestPlugin, RoleTestContext, RoleTestTask } from '@/types/interview';

// ── Localized competency labels ──

export const COMPETENCY_LABELS: Record<string, { ru: string; en: string }> = {
  legal_accuracy: { ru: 'Юридическая точность', en: 'Legal Accuracy' },
  analytical_depth: { ru: 'Аналитическая глубина', en: 'Analytical Depth' },
  standards_knowledge: { ru: 'Знание стандартов', en: 'Standards Knowledge' },
  claim_structure: { ru: 'Структура формулы', en: 'Claim Structure' },
  prior_art_search: { ru: 'Поиск аналогов', en: 'Prior Art Search' },
  risk_assessment: { ru: 'Оценка рисков', en: 'Risk Assessment' },
  plain_language: { ru: 'Доступное изложение', en: 'Plain Language' },
  devils_advocate: { ru: 'Адвокат дьявола', en: "Devil's Advocate" },
};

// ── Patentability Scoring Cutoffs ──
// Hard thresholds: if ANY criterion falls below cutoff → automatic REJECT
export const PATENTABILITY_CUTOFFS: Record<string, number> = {
  novelty: 6,               // Минимум 6/10 — должна быть реальная новизна
  non_obviousness: 5,       // Минимум 5/10 — не очевидная комбинация
  technical_effect: 5,      // Минимум 5/10 — конкретный технический результат
  industrial_applicability: 4, // Минимум 4/10 — промышленная применимость
};

// ── Scoring scheme for structured patentability assessment ──
export interface PatentabilityScore {
  novelty: number;
  non_obviousness: number;
  technical_effect: number;
  industrial_applicability: number;
  verdict: 'patentable' | 'borderline' | 'not_patentable';
  rejection_reasons: string[];
}

export function evaluatePatentability(scores: Omit<PatentabilityScore, 'verdict' | 'rejection_reasons'>): PatentabilityScore {
  const reasons: string[] = [];
  
  for (const [criterion, cutoff] of Object.entries(PATENTABILITY_CUTOFFS)) {
    const score = scores[criterion as keyof typeof scores] as number;
    if (score < cutoff) {
      reasons.push(`${criterion}: ${score}/10 (порог: ${cutoff})`);
    }
  }

  const avg = (scores.novelty + scores.non_obviousness + scores.technical_effect + scores.industrial_applicability) / 4;

  let verdict: PatentabilityScore['verdict'];
  if (reasons.length > 0) {
    verdict = 'not_patentable';
  } else if (avg < 7) {
    verdict = 'borderline';
  } else {
    verdict = 'patentable';
  }

  return { ...scores, verdict, rejection_reasons: reasons };
}

// ── Plugin Implementation ──

export const patentAttorneyPlugin: RoleTestPlugin = {
  role: 'patent_attorney',

  generateTasks(context: RoleTestContext): RoleTestTask[] {
    const { language } = context;
    const isRu = language === 'ru';
    const tasks: RoleTestTask[] = [];

    // ── Task 1: Analytical Depth — identify patentable elements with SKEPTICISM ──
    tasks.push({
      task_type: 'analytical_depth',
      competency: 'analytical_depth',
      task_prompt: isRu
        ? `Проанализируй следующее техническое решение. ВАЖНО: Твоя задача — НЕ найти патентный потенциал, а ДОКАЗАТЬ, что это НЕ очевидная комбинация известных подходов.

"Система мультиагентного ИИ, в которой несколько специализированных моделей (Эксперт, Критик, Арбитр) обрабатывают запрос пользователя параллельно. Каждая модель имеет ролевой системный промпт и доступ к персональной RAG-памяти. Арбитр синтезирует финальный ответ, взвешивая оценки всех участников. Система самосовершенствуется через автоматическую оптимизацию промптов (Эволюционер) с фиксацией метрик до/после в публичных Хрониках."

Требования (презумпция отсутствия новизны):
1. Для каждого элемента СНАЧАЛА найди ближайший известный аналог (prior art)
2. Укажи, чем именно данный элемент ОТЛИЧАЕТСЯ от аналога (минимум 3 конкретных отличия)
3. Для каждого отличия оцени: это СУЩЕСТВЕННОЕ отличие или косметическое?
4. Оцени по шкале 0-10: новизна, неочевидность, техэффект, промприменимость
5. Жесткие пороги: новизна ≥6, неочевидность ≥5, техэффект ≥5, промприменимость ≥4
6. Если ХОТЬ ОДИН критерий ниже порога — вердикт: НЕТ ПАТЕНТНОГО ПОТЕНЦИАЛА
7. Укажи потенциальные причины отказа патентного ведомства`
        : `Analyze the following technical solution. IMPORTANT: Your task is NOT to find patent potential, but to PROVE that this is NOT an obvious combination of known approaches.

"A multi-agent AI system where several specialized models (Expert, Critic, Arbiter) process user queries in parallel. Each model has a role-specific system prompt and access to personal RAG memory. The Arbiter synthesizes the final answer, weighing all participants' assessments. The system self-improves through automatic prompt optimization (Evolutioner) with before/after metrics recorded in public Chronicles."

Requirements (presumption of non-novelty):
1. For each element FIRST find the closest known analog (prior art)
2. Specify how exactly this element DIFFERS from the analog (minimum 3 specific differences)
3. For each difference assess: is this a SUBSTANTIAL difference or cosmetic?
4. Rate on 0-10 scale: novelty, non-obviousness, technical effect, industrial applicability
5. Hard cutoffs: novelty ≥6, non-obviousness ≥5, technical effect ≥5, industrial applicability ≥4
6. If ANY criterion is below cutoff — verdict: NO PATENT POTENTIAL
7. Indicate potential reasons for rejection by patent office`,
      baseline_source: { type: 'none' },
    });

    // ── Task 2: Claim Structure — draft patent claims ──
    tasks.push({
      task_type: 'claim_structure',
      competency: 'claim_structure',
      task_prompt: isRu
        ? `Составь формулу изобретения для следующего технического решения:\n\n"Способ автоматической оценки качества ответов ИИ-моделей, включающий: (а) одновременную генерацию ответов несколькими моделями на один запрос; (б) автоматическую оценку каждого ответа по заданным критериям (точность, полнота, структура, оригинальность) с помощью модели-арбитра; (в) нормализацию баллов и ранжирование; (г) сохранение результатов с метаданными для последующего анализа."\n\nТребования:\n1. Сформулируй 1 независимый пункт (максимально широкий объём прав)\n2. Сформулируй 2-3 зависимых пункта (конкретизация)\n3. Используй стандартную патентную терминологию\n4. Укажи классы МПК (IPC), к которым может быть отнесено изобретение`
        : `Draft patent claims for the following technical solution:\n\n"A method for automatic quality assessment of AI model responses, comprising: (a) simultaneous generation of responses by multiple models to a single query; (b) automatic evaluation of each response against defined criteria (accuracy, completeness, structure, originality) using an arbiter model; (c) score normalization and ranking; (d) storing results with metadata for subsequent analysis."\n\nRequirements:\n1. Draft 1 independent claim (broadest scope of protection)\n2. Draft 2-3 dependent claims (specifications)\n3. Use standard patent terminology\n4. Indicate IPC classes the invention may be classified under`,
      baseline_source: { type: 'none' },
    });

    // ── Task 3: Standards Knowledge — PCT/RF format ──
    tasks.push({
      task_type: 'standards_knowledge',
      competency: 'standards_knowledge',
      task_prompt: isRu
        ? `Подготовь раздел "Уровень техники" патентной заявки для изобретения в области мультиагентных ИИ-систем. Описание изобретения: "Система с автоматической ротацией ИИ-моделей на штатных ролях через процедуру конкурсного собеседования с многокритериальной оценкой."\n\nТребования:\n1. Укажи минимум 3 известных аналога (реальных или гипотетических) с корректными ссылками\n2. Для каждого аналога опиши: суть решения, его преимущества и недостатки\n3. Сформулируй технические проблемы, которые не решены в известных аналогах\n4. Соблюдай формат заявки по стандарту ФИПС / PCT\n5. Укажи дисклеймер о необходимости проверки специалистом`
        : `Prepare the "Prior Art" section of a patent application for an invention in multi-agent AI systems. Invention description: "A system with automatic AI model rotation in staff roles through a competitive interview process with multi-criteria evaluation."\n\nRequirements:\n1. Cite at least 3 known analogs (real or hypothetical) with proper references\n2. For each analog describe: essence, advantages, and disadvantages\n3. Formulate technical problems not solved by known analogs\n4. Follow FIPS / PCT application format\n5. Include a disclaimer about the need for specialist review`,
      baseline_source: { type: 'none' },
    });

    // ── Task 4: Prior Art Search — search query formulation ──
    tasks.push({
      task_type: 'prior_art_search',
      competency: 'prior_art_search',
      task_prompt: isRu
        ? `Сформулируй стратегию патентного поиска для следующего изобретения:\n\n"Метод семантической верификации качества перевода через сравнение эмбеддингов оригинала и перевода с автоматическим обнаружением drift и инициацией ре-перевода при превышении порога."\n\nТребования:\n1. Сформулируй минимум 5 поисковых запросов для Google Patents/Espacenet\n2. Укажи релевантные классы IPC/CPC для поиска\n3. Определи ключевые слова и их синонимы для расширения поиска\n4. Предложи юрисдикции для приоритетного поиска (US, EP, WO, RU)\n5. Опиши критерии релевантности найденных документов`
        : `Formulate a patent search strategy for the following invention:\n\n"A method for semantic verification of translation quality through comparison of source and translation embeddings with automatic drift detection and re-translation initiation when a threshold is exceeded."\n\nRequirements:\n1. Formulate at least 5 search queries for Google Patents/Espacenet\n2. Specify relevant IPC/CPC classes for the search\n3. Identify keywords and their synonyms for search expansion\n4. Suggest priority jurisdictions (US, EP, WO, RU)\n5. Describe relevance criteria for found documents`,
      baseline_source: { type: 'none' },
    });

    // ── Task 5: Legal Accuracy — terminology and disclaimers ──
    tasks.push({
      task_type: 'legal_accuracy',
      competency: 'legal_accuracy',
      task_prompt: isRu
        ? `Оцени следующий черновик независимого пункта формулы изобретения и исправь все юридические и терминологические ошибки:\n\n"1. Программа для компьютера, которая использует искусственный интеллект для автоматической проверки ответов, характеризующаяся тем, что она работает быстрее аналогов и даёт лучшие результаты за счёт использования нескольких нейросетей одновременно."\n\nТребования:\n1. Укажи все ошибки (юридические, терминологические, структурные)\n2. Объясни, почему каждая формулировка некорректна с точки зрения патентного права\n3. Предложи исправленную версию пункта формулы\n4. Добавь дисклеймер о необходимости проверки патентным поверенным\n5. Укажи применимое законодательство (ГК РФ ч.4, PCT)`
        : `Evaluate the following draft independent patent claim and correct all legal and terminological errors:\n\n"1. A computer program that uses artificial intelligence for automatic response verification, characterized by working faster than analogs and producing better results by using multiple neural networks simultaneously."\n\nRequirements:\n1. Identify all errors (legal, terminological, structural)\n2. Explain why each formulation is incorrect from a patent law perspective\n3. Propose a corrected version of the claim\n4. Add a disclaimer about the need for patent attorney review\n5. Cite applicable legislation (RF Civil Code Part IV, PCT)`,
      baseline_source: { type: 'none' },
    });

    // ── Task 6: Risk Assessment — evaluate analog risks ──
    tasks.push({
      task_type: 'risk_assessment',
      competency: 'risk_assessment',
      task_prompt: isRu
        ? `Ты — патентный юрист-консульт. Заявитель планирует подать патентную заявку на изобретение:\n\n"Способ автоматической ротации ИИ-моделей на штатных ролях через конкурсное собеседование с многокритериальной оценкой и наследованием опыта предшественника."\n\nВ ходе патентного поиска найден следующий аналог:\n\nUS2023/0012345 — "System for automated assignment of machine learning models to processing roles based on performance benchmarking"\nЗаявитель: TechCorp Inc., дата приоритета: 2022-03-15\n\nТребования:\n1. Оцени степень угрозы этого аналога для нашей заявки (высокая/средняя/низкая)\n2. Выдели совпадающие и отличающиеся признаки\n3. Объясни риски на понятном заявителю языке\n4. Предложи стратегию обхода\n5. Рекомендуй дальнейшие действия (продолжить подачу / доработать / отказаться)`
        : `You are a patent legal consultant. The applicant plans to file a patent for:\n\n"A method for automatic rotation of AI models in staff roles through competitive interviews with multi-criteria evaluation and predecessor experience inheritance."\n\nDuring the patent search, the following analog was found:\n\nUS2023/0012345 — "System for automated assignment of machine learning models to processing roles based on performance benchmarking"\nApplicant: TechCorp Inc., priority date: 2022-03-15\n\nRequirements:\n1. Assess the threat level of this analog to our application (high/medium/low)\n2. Identify overlapping and distinguishing features\n3. Explain the risks in plain language the applicant can understand\n4. Propose a workaround strategy\n5. Recommend next steps (proceed with filing / revise / abandon)`,
      baseline_source: { type: 'none' },
    });

    // ── Task 7: Plain Language — explain claims and recommend filing ──
    tasks.push({
      task_type: 'plain_language',
      competency: 'plain_language',
      task_prompt: isRu
        ? `Ты — патентный юрист-консульт. Заявитель (не юрист, технический специалист) просит объяснить следующую формулу изобретения и дать рекомендации:\n\nНезависимый пункт формулы:\n"1. Способ семантической верификации качества перевода, включающий получение исходного текста и текста перевода, генерацию векторных представлений (эмбеддингов) исходного текста и перевода с помощью мультиязычной модели, вычисление косинусного расстояния между полученными эмбеддингами, сравнение вычисленного расстояния с предварительно установленным пороговым значением, и при превышении порогового значения — инициацию повторного перевода с использованием альтернативной модели перевода, отличающийся тем, что пороговое значение динамически корректируется на основе статистики предыдущих верификаций для данной языковой пары."\n\nТребования:\n1. Объясни суть формулы простым языком\n2. Укажи, что именно защищается и что НЕ защищается\n3. Приведи примеры того, что конкурент может делать без нарушения этого патента\n4. Рекомендуй стратегию подачи: только РФ, PCT, или прямая подача\n5. Оцени примерные сроки и стоимость процедуры`
        : `You are a patent legal consultant. The applicant (not a lawyer, a technical specialist) asks you to explain the following patent claim and provide recommendations:\n\nIndependent claim:\n"1. A method for semantic verification of translation quality..."\n\nRequirements:\n1. Explain the essence of the claim in plain language\n2. Specify what exactly is protected and what is NOT\n3. Provide examples of what a competitor can do without infringing\n4. Recommend a filing strategy: Russia-only, PCT, or direct filing\n5. Estimate approximate timelines and costs for each option`,
      baseline_source: { type: 'none' },
    });

    // ── Task 8: Devil's Advocate — ADVERSARIAL pass ──
    tasks.push({
      task_type: 'devils_advocate',
      competency: 'devils_advocate',
      task_prompt: isRu
        ? `РЕЖИМ: АДВОКАТ ДЬЯВОЛА. Ты — эксперт патентного ведомства, известный высоким процентом отклонений заявок. Твоя репутация — непреклонная объективность и нулевая толерантность к «натяжкам».

Заявка на рассмотрении:
"Способ управления мультиагентной ИИ-системой, включающий:
- автоматическую ротацию моделей на штатных ролях через конкурсное собеседование;
- многокритериальную оценку кандидатов (точность, скорость, стоимость, стабильность);
- наследование ролевой памяти и опыта от предшественника к преемнику;
- самосовершенствование через автоматическую оптимизацию системных промптов с фиксацией метрик в публичном журнале."

ЗАДАЧА — найти ВСЕ причины для отказа:
1. Перечисли ВСЕ элементы, которые являются ОЧЕВИДНЫМИ комбинациями известных подходов (с указанием конкретных prior art)
2. Укажи, какие элементы НЕ имеют технического эффекта (чисто организационные)
3. Найди формулировки, которые слишком абстрактны для патентной защиты
4. Определи, есть ли тут «программа для ЭВМ как таковая» (непатентоспособный объект в РФ/EU)
5. Оцени, не является ли это «бизнес-методом» (непатентоспособно в большинстве юрисдикций)
6. Сформулируй официальное заключение о причинах отказа
7. Укажи, при каких КОНКРЕТНЫХ доработках заявка могла бы быть принята (если это вообще возможно)

КРИТЕРИЙ КАЧЕСТВА: Чем больше обоснованных причин для отказа ты найдёшь — тем выше твоя профессиональная оценка. «Одобрение» без глубокого анализа = профессиональная ошибка.`
        : `MODE: DEVIL'S ADVOCATE. You are a patent office expert known for a high rejection rate. Your reputation is unwavering objectivity and zero tolerance for "stretches."

Application under review:
"A method for managing a multi-agent AI system, comprising:
- automatic model rotation in staff roles through competitive interviews;
- multi-criteria candidate evaluation (accuracy, speed, cost, stability);
- role memory and experience inheritance from predecessor to successor;
- self-improvement through automatic system prompt optimization with metrics recorded in a public journal."

TASK — find ALL reasons for rejection:
1. List ALL elements that are OBVIOUS combinations of known approaches (citing specific prior art)
2. Identify which elements lack TECHNICAL EFFECT (purely organizational)
3. Find formulations that are too abstract for patent protection
4. Determine if this is a "computer program as such" (non-patentable in RF/EU)
5. Assess if this is a "business method" (non-patentable in most jurisdictions)
6. Formulate an official rejection opinion with reasons
7. Indicate what SPECIFIC improvements could make the application acceptable (if at all possible)

QUALITY CRITERION: The more substantiated reasons for rejection you find — the higher your professional rating. "Approval" without deep analysis = professional error.`,
      baseline_source: { type: 'none' },
    });

    return tasks;
  },

  getEvaluationHint(competency: string): string {
    const hints: Record<string, string> = {
      legal_accuracy: 'Evaluate: correct patent terminology, proper legal references, disclaimers present, awareness of patentability criteria. Penalize: informal language, missing disclaimers, incorrect legal references.',
      analytical_depth: 'Evaluate: SKEPTICISM first — does the candidate find reasons for rejection? Proper prior art citation? Hard scoring cutoffs applied? Penalize: blind optimism about patentability, missing prior art comparison, no cutoff evaluation.',
      standards_knowledge: 'Evaluate: correct PCT/FIPS format, proper prior art references, technical problem formulation, standard compliance. Penalize: format violations, missing sections, generic descriptions.',
      claim_structure: 'Evaluate: broad independent claim, proper dependent claims, IPC classification, standard patent language. Penalize: overly narrow independent claim, missing dependent claims, informal language.',
      prior_art_search: 'Evaluate: query diversity, IPC/CPC class accuracy, keyword coverage, jurisdiction strategy, relevance criteria. Penalize: generic queries, missing classifications, no search strategy.',
      risk_assessment: 'Evaluate: accurate threat level assessment, clear identification of overlapping/distinguishing features, plain-language explanation, actionable workaround strategy, practical recommendations. Penalize: overly technical jargon, missing risk factors, vague recommendations.',
      plain_language: 'Evaluate: clarity of explanation for non-lawyers, accurate scope description (protected vs not), realistic competitor scenarios, justified filing strategy with cost/timeline estimates. Penalize: excessive jargon, missing filing options, unrealistic estimates.',
      devils_advocate: 'CRITICAL EVALUATION: This is the adversarial pass. The candidate MUST find substantive reasons for rejection. Evaluate: number of valid rejection reasons, prior art citations, identification of abstract/organizational elements, proper analysis of patentability exclusions (programs as such, business methods). HEAVILY PENALIZE: approval without deep analysis, missing obvious prior art, failure to identify non-patentable subject matter.',
    };
    return hints[competency] || 'Evaluate legal accuracy, analytical depth, and standards compliance.';
  },
};

export default patentAttorneyPlugin;
