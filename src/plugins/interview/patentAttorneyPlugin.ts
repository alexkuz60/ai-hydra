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

    return tasks;
  },

  getEvaluationHint(competency: string): string {
    const hints: Record<string, string> = {
      legal_accuracy: 'Evaluate: correct patent terminology, proper legal references, disclaimers present, awareness of patentability criteria. Penalize: informal language, missing disclaimers, incorrect legal references.',
      analytical_depth: 'Evaluate: number and quality of identified patentable elements, proper novelty/inventive step/industrial applicability analysis. Penalize: superficial analysis, missing criteria, unjustified claims.',
      standards_knowledge: 'Evaluate: correct PCT/FIPS format, proper prior art references, technical problem formulation, standard compliance. Penalize: format violations, missing sections, generic descriptions.',
      claim_structure: 'Evaluate: broad independent claim, proper dependent claims, IPC classification, standard patent language. Penalize: overly narrow independent claim, missing dependent claims, informal language.',
      prior_art_search: 'Evaluate: query diversity, IPC/CPC class accuracy, keyword coverage, jurisdiction strategy, relevance criteria. Penalize: generic queries, missing classifications, no search strategy.',
    };
    return hints[competency] || 'Evaluate legal accuracy, analytical depth, and standards compliance.';
  },
};

export default patentAttorneyPlugin;
