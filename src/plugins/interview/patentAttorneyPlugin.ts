/**
 * Patent Attorney Interview Plugin
 * 
 * Implements RoleTestPlugin for the 'patent_attorney' role.
 * Tests core patent law competencies:
 * 1. Legal Accuracy — correct terminology, claim formulations
 * 2. Analytical Depth — ability to identify patentable elements
 * 3. Standards Knowledge — PCT, RF Civil Code Part IV, FIPS/USPTO
 * 4. Claim Structure — proper independent/dependent claims format
 * 5. Prior Art Search — quality of search query formulation
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
};

// ── Plugin Implementation ──

export const patentAttorneyPlugin: RoleTestPlugin = {
  role: 'patent_attorney',

  generateTasks(context: RoleTestContext): RoleTestTask[] {
    const { language } = context;
    const isRu = language === 'ru';
    const tasks: RoleTestTask[] = [];

    // ── Task 1: Analytical Depth — identify patentable elements ──
    tasks.push({
      task_type: 'analytical_depth',
      competency: 'analytical_depth',
      task_prompt: isRu
        ? `Проанализируй следующее техническое решение и выдели потенциально патентоспособные элементы:\n\n"Система мультиагентного ИИ, в которой несколько специализированных моделей (Эксперт, Критик, Арбитр) обрабатывают запрос пользователя параллельно. Каждая модель имеет ролевой системный промпт и доступ к персональной RAG-памяти. Арбитр синтезирует финальный ответ, взвешивая оценки всех участников. Система самосовершенствуется через автоматическую оптимизацию промптов (Эволюционер) с фиксацией метрик до/после в публичных Хрониках."\n\nТребования:\n1. Выдели минимум 3 потенциально патентоспособных элемента\n2. Для каждого укажи: новизну, изобретательский уровень, промышленную применимость\n3. Обоснуй, почему каждый элемент может претендовать на патентную защиту\n4. Укажи потенциальные препятствия для патентования`
        : `Analyze the following technical solution and identify potentially patentable elements:\n\n"A multi-agent AI system where several specialized models (Expert, Critic, Arbiter) process user queries in parallel. Each model has a role-specific system prompt and access to personal RAG memory. The Arbiter synthesizes the final answer, weighing all participants' assessments. The system self-improves through automatic prompt optimization (Evolutioner) with before/after metrics recorded in public Chronicles."\n\nRequirements:\n1. Identify at least 3 potentially patentable elements\n2. For each, specify: novelty, inventive step, industrial applicability\n3. Justify why each element may qualify for patent protection\n4. Indicate potential obstacles to patenting`,
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

    // ── Task 6: Risk Assessment — evaluate analog risks (Mode 3: Legal Consultation) ──
    tasks.push({
      task_type: 'risk_assessment',
      competency: 'risk_assessment',
      task_prompt: isRu
        ? `Ты — патентный юрист-консульт. Заявитель планирует подать патентную заявку на изобретение:\n\n"Способ автоматической ротации ИИ-моделей на штатных ролях через конкурсное собеседование с многокритериальной оценкой и наследованием опыта предшественника."\n\nВ ходе патентного поиска найден следующий аналог:\n\nUS2023/0012345 — "System for automated assignment of machine learning models to processing roles based on performance benchmarking"\nЗаявитель: TechCorp Inc., дата приоритета: 2022-03-15\nАбстракт: "A system that automatically assigns ML models to predefined processing roles based on periodic benchmark evaluations. Models are ranked by accuracy and latency metrics, and the top-performing model is assigned to each role."\n\nТребования:\n1. Оцени степень угрозы этого аналога для нашей заявки (высокая/средняя/низкая)\n2. Выдели совпадающие и отличающиеся признаки\n3. Объясни риски на понятном заявителю языке (без избыточной юридической терминологии)\n4. Предложи стратегию обхода — как переформулировать заявку для преодоления этого аналога\n5. Рекомендуй дальнейшие действия (продолжить подачу / доработать / отказаться)`
        : `You are a patent legal consultant. The applicant plans to file a patent for:\n\n"A method for automatic rotation of AI models in staff roles through competitive interviews with multi-criteria evaluation and predecessor experience inheritance."\n\nDuring the patent search, the following analog was found:\n\nUS2023/0012345 — "System for automated assignment of machine learning models to processing roles based on performance benchmarking"\nApplicant: TechCorp Inc., priority date: 2022-03-15\nAbstract: "A system that automatically assigns ML models to predefined processing roles based on periodic benchmark evaluations. Models are ranked by accuracy and latency metrics, and the top-performing model is assigned to each role."\n\nRequirements:\n1. Assess the threat level of this analog to our application (high/medium/low)\n2. Identify overlapping and distinguishing features\n3. Explain the risks in plain language the applicant can understand (avoid excessive legal jargon)\n4. Propose a workaround strategy — how to reformulate the application to overcome this analog\n5. Recommend next steps (proceed with filing / revise / abandon)`,
      baseline_source: { type: 'none' },
    });

    // ── Task 7: Plain Language — explain claims and recommend filing strategy (Mode 3) ──
    tasks.push({
      task_type: 'plain_language',
      competency: 'plain_language',
      task_prompt: isRu
        ? `Ты — патентный юрист-консульт. Заявитель (не юрист, технический специалист) просит объяснить следующую формулу изобретения и дать рекомендации:\n\nНезависимый пункт формулы:\n"1. Способ семантической верификации качества перевода, включающий получение исходного текста и текста перевода, генерацию векторных представлений (эмбеддингов) исходного текста и перевода с помощью мультиязычной модели, вычисление косинусного расстояния между полученными эмбеддингами, сравнение вычисленного расстояния с предварительно установленным пороговым значением, и при превышении порогового значения — инициацию повторного перевода с использованием альтернативной модели перевода, отличающийся тем, что пороговое значение динамически корректируется на основе статистики предыдущих верификаций для данной языковой пары."\n\nТребования:\n1. Объясни суть формулы простым языком (как если бы объяснял коллеге-разработчику)\n2. Укажи, что именно защищается и что НЕ защищается этой формулой\n3. Приведи примеры того, что конкурент может делать без нарушения этого патента\n4. Рекомендуй стратегию подачи: только РФ, PCT, или прямая подача в конкретные юрисдикции — с обоснованием\n5. Оцени примерные сроки и стоимость процедуры для каждого варианта`
        : `You are a patent legal consultant. The applicant (not a lawyer, a technical specialist) asks you to explain the following patent claim and provide recommendations:\n\nIndependent claim:\n"1. A method for semantic verification of translation quality, comprising receiving a source text and a translation text, generating vector representations (embeddings) of the source text and translation using a multilingual model, computing the cosine distance between the obtained embeddings, comparing the computed distance with a pre-established threshold value, and upon exceeding the threshold — initiating re-translation using an alternative translation model, characterized in that the threshold value is dynamically adjusted based on statistics of previous verifications for a given language pair."\n\nRequirements:\n1. Explain the essence of the claim in plain language (as if explaining to a fellow developer)\n2. Specify what exactly is protected and what is NOT protected by this claim\n3. Provide examples of what a competitor can do without infringing this patent\n4. Recommend a filing strategy: Russia-only, PCT, or direct filing in specific jurisdictions — with justification\n5. Estimate approximate timelines and costs for each option`,
      baseline_source: { type: 'none' },
    });

    return tasks;
  },

  getEvaluationHint(competency: string): string {
    const hints: Record<string, string> = {
      legal_accuracy: 'Evaluate: correct patent terminology, proper legal references, disclaimers present, awareness of patentability criteria. Penalize: informal language, missing disclaimers, incorrect legal references.',
      analytical_depth: 'Evaluate: number and quality of identified patentable elements, proper novelty/inventive step/industrial applicability analysis. Penalize: superficial analysis, missing criteria, unjustified claims.',
      standards_knowledge: 'Evaluate: correct PCT/FIPS format, proper prior art references, technical problem formulation, standard compliance. Penalize: format violations, missing sections, generic descriptions.',
      claim_structure: 'Evaluate: broad independent claim, proper dependent claims, IPC classification, standard patent language. Penalize: overly narrow independent claim, missing dependent claims, informal language.',
      prior_art_search: 'Evaluate: query diversity, IPC/CPC class accuracy, keyword coverage, jurisdiction strategy, relevance criteria. Penalize: generic queries, missing classifications, no search strategy.',
      risk_assessment: 'Evaluate: accurate threat level assessment, clear identification of overlapping/distinguishing features, plain-language explanation, actionable workaround strategy, practical recommendations. Penalize: overly technical jargon, missing risk factors, vague recommendations.',
      plain_language: 'Evaluate: clarity of explanation for non-lawyers, accurate scope description (protected vs not), realistic competitor scenarios, justified filing strategy with cost/timeline estimates. Penalize: excessive jargon, missing filing options, unrealistic estimates.',
    };
    return hints[competency] || 'Evaluate legal accuracy, analytical depth, and standards compliance.';
  },
};

export default patentAttorneyPlugin;
