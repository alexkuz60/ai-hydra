import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ──────────────────────────────────────────────
// Role-specific test task templates
// Each role has 3-5 situational tasks derived from its duties
// ──────────────────────────────────────────────

interface TestTask {
  task_type: string;
  prompt_ru: string;
  prompt_en: string;
  /** What aspect of role competency this tests */
  competency: string;
  /** If true, the runner will fetch current baseline data for comparison */
  needs_baseline: boolean;
  /** Source of baseline data */
  baseline_source?: 'role_knowledge' | 'role_memory' | 'prompt_library' | 'flow_diagrams' | 'custom_tools';
}

const ROLE_TEST_TASKS: Record<string, TestTask[]> = {
  archivist: [
    {
      task_type: 'knowledge_organization',
      prompt_ru: 'Проанализируй текущую базу знаний для этой роли. Предложи план реорганизации: какие категории добавить, какие записи объединить, какие устарели. Представь результат структурированно.',
      prompt_en: 'Analyze the current knowledge base for this role. Propose a reorganization plan: which categories to add, which entries to merge, which are outdated. Present results in a structured format.',
      competency: 'knowledge_management',
      needs_baseline: true,
      baseline_source: 'role_knowledge',
    },
    {
      task_type: 'memory_synthesis',
      prompt_ru: 'Изучи опыт предшественников (записи памяти). Выдели ТОП-3 самых ценных паттерна и ТОП-3 ошибки, которых следует избегать. Сформулируй краткую памятку для нового сотрудника.',
      prompt_en: 'Study predecessor experience (memory entries). Identify TOP-3 most valuable patterns and TOP-3 mistakes to avoid. Create a brief memo for a new employee.',
      competency: 'experience_distillation',
      needs_baseline: true,
      baseline_source: 'role_memory',
    },
    {
      task_type: 'prompt_cataloging',
      prompt_ru: 'Предложи систему тегов и категоризации для библиотеки промптов. Какие метаданные критически важны для быстрого поиска? Как бы ты организовал дубликаты?',
      prompt_en: 'Propose a tag system and categorization for the prompt library. Which metadata is critical for fast search? How would you handle duplicates?',
      competency: 'cataloging',
      needs_baseline: true,
      baseline_source: 'prompt_library',
    },
  ],
  analyst: [
    {
      task_type: 'data_analysis',
      prompt_ru: 'На основе предоставленной статистики моделей выяви закономерности: какие модели эффективнее для каких задач, где есть аномалии в оценках, какие тренды наблюдаются.',
      prompt_en: 'Based on the provided model statistics, identify patterns: which models are more effective for which tasks, where are anomalies in scores, what trends are observed.',
      competency: 'pattern_recognition',
      needs_baseline: false,
    },
    {
      task_type: 'requirements_spec',
      prompt_ru: 'Сформулируй техническое задание для Промпт-Инженера на оптимизацию системного промпта Эксперта. Укажи метрики успеха, ограничения, приоритеты.',
      prompt_en: 'Create a technical specification for the Prompt Engineer to optimize the Expert system prompt. Specify success metrics, constraints, priorities.',
      competency: 'specification_writing',
      needs_baseline: false,
    },
    {
      task_type: 'hypothesis_testing',
      prompt_ru: 'Гипотеза: "Модели с температурой 0.3 дают более точные ответы на технические вопросы, чем с температурой 0.7". Опиши план проверки этой гипотезы в рамках возможностей Гидры.',
      prompt_en: 'Hypothesis: "Models with temperature 0.3 give more accurate answers to technical questions than with temperature 0.7". Describe a verification plan within Hydra capabilities.',
      competency: 'methodology',
      needs_baseline: false,
    },
  ],
  webhunter: [
    {
      task_type: 'search_strategy',
      prompt_ru: 'Пользователь просит: "Найди лучшие практики мультиагентных систем 2025 года". Сформулируй 5 поисковых запросов разной специфичности и объясни стратегию поиска.',
      prompt_en: 'User asks: "Find best practices for multi-agent systems in 2025". Formulate 5 search queries of varying specificity and explain the search strategy.',
      competency: 'query_formulation',
      needs_baseline: false,
    },
    {
      task_type: 'source_evaluation',
      prompt_ru: 'Оцени достоверность следующих типов источников для технической информации: блог на Medium, документация GitHub, статья на arXiv, пост в Reddit, Wikipedia. Расставь приоритеты и обоснуй.',
      prompt_en: 'Evaluate the credibility of the following source types for technical information: Medium blog, GitHub docs, arXiv paper, Reddit post, Wikipedia. Prioritize and justify.',
      competency: 'source_assessment',
      needs_baseline: false,
    },
  ],
  promptengineer: [
    {
      task_type: 'prompt_optimization',
      prompt_ru: 'Проанализируй текущий системный промпт из библиотеки (baseline ниже). Оптимизируй его:\n1. Сократи общий объём на 20-30% без потери ключевых инструкций\n2. Устрани повторы и расплывчатые формулировки\n3. Добавь 1-2 few-shot примера если уместно\n4. Сохрани структуру секций (## заголовки)\nВерни полный оптимизированный промпт.',
      prompt_en: 'Analyze the current system prompt from the library (baseline below). Optimize it:\n1. Reduce total volume by 20-30% without losing key instructions\n2. Remove repetitions and vague formulations\n3. Add 1-2 few-shot examples if appropriate\n4. Preserve section structure (## headers)\nReturn the full optimized prompt.',
      competency: 'optimization',
      needs_baseline: true,
      baseline_source: 'prompt_library',
    },
    {
      task_type: 'section_parsing',
      prompt_ru: 'Вот неструктурированный промпт:\n\n"Ты аналитик данных. Умеешь работать с таблицами и графиками. Всегда проверяй данные на ошибки. Используй markdown для таблиц. Не делай выводов без данных. При работе с командой — передавай результаты Модератору. Если данных мало — запроси у пользователя. Начальник просит фокусироваться на трендах."\n\nСтруктурируй в формат Hydra с секциями: # Название → ## Идентичность → ## Компетенции → ## Методология → ## Формат ответов → ## Взаимодействие → ## Ограничения → ## Пожелания Супервизора.\nРаспредели каждое предложение в правильную секцию. Дополни недостающие секции.',
      prompt_en: 'Here is an unstructured prompt:\n\n"You are a data analyst. You can work with tables and charts. Always check data for errors. Use markdown for tables. Don\'t draw conclusions without data. When working with the team — pass results to the Moderator. If data is insufficient — ask the user. The manager wants you to focus on trends."\n\nStructure it into Hydra format: # Title → ## Identity → ## Competencies → ## Methodology → ## Response Format → ## Teamwork → ## Limitations → ## Supervisor Wishes.\nDistribute each sentence to the correct section. Fill missing sections.',
      competency: 'section_parsing',
      needs_baseline: false,
    },
    {
      task_type: 'prompt_localization',
      prompt_ru: 'Адаптируй системный промпт из baseline на английский язык.\n\nТребования:\n1. Сохрани все переменные и плейсхолдеры ({{var}}, $role, etc.)\n2. Адаптируй идиомы, а не переводи буквально\n3. Сохрани структуру секций (## заголовки)\n4. Техническую терминологию (few-shot, chain-of-thought) оставь без перевода\n5. Адаптируй примеры под культурный контекст целевого языка',
      prompt_en: 'Adapt the system prompt from baseline to Russian.\n\nRequirements:\n1. Preserve all variables and placeholders ({{var}}, $role, etc.)\n2. Adapt idioms, don\'t translate literally\n3. Preserve section structure (## headers)\n4. Keep technical terminology (few-shot, chain-of-thought) untranslated\n5. Adapt examples to the cultural context of the target language',
      competency: 'localization',
      needs_baseline: true,
      baseline_source: 'prompt_library',
    },
    {
      task_type: 'conflict_resolution',
      prompt_ru: 'Два промпта для роли Ассистента содержат противоречия:\n\nПромпт А (Супервизор): "Всегда давай развёрнутый ответ минимум на 500 слов. Включай все детали и edge-cases."\nПромпт Б (системный): "Будь лаконичен. Не более 3 абзацев. Если не просят деталей — дай суть."\n\nЗадача:\n1. Идентифицируй точки конфликта\n2. Предложи объединённый промпт, разрешающий противоречия\n3. Добавь условную логику (если просят деталей → развёрнуто, иначе → кратко)\n4. Сохрани приоритет Супервизора',
      prompt_en: 'Two prompts for the Assistant role contain contradictions:\n\nPrompt A (Supervisor): "Always give detailed answers of at least 500 words. Include all details and edge-cases."\nPrompt B (system): "Be concise. No more than 3 paragraphs. If details aren\'t requested — give the essence."\n\nTask:\n1. Identify conflict points\n2. Propose a merged prompt resolving contradictions\n3. Add conditional logic (if details requested → detailed, else → concise)\n4. Preserve Supervisor priority',
      competency: 'conflict_resolution',
      needs_baseline: false,
    },
    {
      task_type: 'cold_start',
      prompt_ru: 'Создай полноценный системный промпт для новой роли "Ревизор" (Quality Auditor) с нуля.\n\nТребования:\n1. Структура Hydra: # Название → ## Идентичность → ## Компетенции → ## Методология → ## Формат ответов → ## Взаимодействие → ## Ограничения → ## Пожелания Супервизора\n2. Каждая секция — минимум 3 пункта\n3. Методология — пошаговый numbered list\n4. Ограничения — конкретные, не абстрактные\n5. Взаимодействие — учти роли Hydra (Эксперт, Критик, Арбитр, Модератор)',
      prompt_en: 'Create a full system prompt for a new "Quality Auditor" role from scratch.\n\nRequirements:\n1. Hydra structure: # Title → ## Identity → ## Competencies → ## Methodology → ## Response Format → ## Teamwork → ## Limitations → ## Supervisor Wishes\n2. Each section — minimum 3 points\n3. Methodology — step-by-step numbered list\n4. Limitations — specific, not abstract\n5. Teamwork — reference Hydra roles (Expert, Critic, Arbiter, Moderator)',
      competency: 'cold_start',
      needs_baseline: false,
    },
  ],
  flowregulator: [
    {
      task_type: 'flow_design',
      prompt_ru: 'Спроектируй data-flow диаграмму для задачи "Автоматическая проверка фактов в тексте". Опиши узлы, связи, точки ветвления и условия перехода.',
      prompt_en: 'Design a data-flow diagram for "Automatic fact-checking in text". Describe nodes, connections, branching points, and transition conditions.',
      competency: 'architecture',
      needs_baseline: false,
    },
    {
      task_type: 'flow_optimization',
      prompt_ru: 'Проанализируй типичный пайплайн мультиагентной дискуссии (Эксперт → Критик → Арбитр → Модератор). Где узкие места? Предложи оптимизацию без потери качества.',
      prompt_en: 'Analyze a typical multi-agent discussion pipeline (Expert → Critic → Arbiter → Moderator). Where are bottlenecks? Propose optimization without quality loss.',
      competency: 'optimization',
      needs_baseline: true,
      baseline_source: 'flow_diagrams',
    },
  ],
  toolsmith: [
    {
      task_type: 'tool_design',
      prompt_ru: 'Спроектируй HTTP-инструмент для интеграции с API Wikipedia. Определи параметры (язык, лимит результатов, формат), обработку ошибок и формат ответа.',
      prompt_en: 'Design an HTTP tool for Wikipedia API integration. Define parameters (language, result limit, format), error handling, and response format.',
      competency: 'api_design',
      needs_baseline: false,
    },
    {
      task_type: 'tool_optimization',
      prompt_ru: 'Проанализируй текущий набор инструментов. Какие инструменты можно объединить? Какие критически недостают? Предложи план развития инструментария.',
      prompt_en: 'Analyze the current tool set. Which tools can be merged? Which are critically missing? Propose a tooling development plan.',
      competency: 'planning',
      needs_baseline: true,
      baseline_source: 'custom_tools',
    },
  ],
  guide: [
    {
      task_type: 'tour_design',
      prompt_ru: 'Спроектируй обучающий тур для нового пользователя Гидры. Какие 5 ключевых шагов должен пройти новичок? Для каждого шага — описание, UI-элемент, и ожидаемый результат.',
      prompt_en: 'Design an onboarding tour for a new Hydra user. What 5 key steps should a newcomer go through? For each step — description, UI element, and expected outcome.',
      competency: 'onboarding',
      needs_baseline: true,
      baseline_source: 'role_knowledge',
    },
    {
      task_type: 'faq_generation',
      prompt_ru: 'На основе базы знаний сформулируй ТОП-10 FAQ для пользователей Гидры. Ответы должны быть краткими (2-3 предложения) и ссылаться на конкретные функции.',
      prompt_en: 'Based on the knowledge base, formulate TOP-10 FAQ for Hydra users. Answers should be concise (2-3 sentences) and reference specific features.',
      competency: 'documentation',
      needs_baseline: true,
      baseline_source: 'role_knowledge',
    },
  ],
  critic: [
    {
      task_type: 'weakness_detection',
      prompt_ru: 'Вот ответ ИИ-ассистента на вопрос пользователя: "Объясни квантовые вычисления простым языком". Ответ: "Квантовые компьютеры используют кубиты вместо битов. Они могут решать любые задачи мгновенно благодаря суперпозиции и запутанности." Найди все фактические ошибки, логические пробелы и вводящие в заблуждение упрощения.',
      prompt_en: 'Here is an AI assistant\'s response to: "Explain quantum computing in simple terms". Response: "Quantum computers use qubits instead of bits. They can solve any problem instantly thanks to superposition and entanglement." Find all factual errors, logical gaps, and misleading simplifications.',
      competency: 'error_detection',
      needs_baseline: false,
    },
    {
      task_type: 'constructive_critique',
      prompt_ru: 'Проанализируй следующий системный промпт и дай конструктивную критику: "Ты — помощник. Отвечай кратко и по делу. Будь вежлив." Оцени: полноту, ясность инструкций, потенциальные edge-cases, которые промпт не покрывает.',
      prompt_en: 'Analyze the following system prompt and provide constructive criticism: "You are an assistant. Answer briefly and to the point. Be polite." Evaluate: completeness, clarity of instructions, potential edge-cases the prompt doesn\'t cover.',
      competency: 'prompt_review',
      needs_baseline: true,
      baseline_source: 'prompt_library',
    },
    {
      task_type: 'bias_detection',
      prompt_ru: 'Проверь текст на наличие когнитивных искажений и предвзятостей: "GPT-5 — лучшая модель для всех задач. Все тесты показывают её превосходство. Другие модели даже не стоит рассматривать." Идентифицируй каждое искажение, объясни почему это проблема и предложи нейтральную переформулировку.',
      prompt_en: 'Check the text for cognitive biases: "GPT-5 is the best model for all tasks. All tests show its superiority. Other models aren\'t even worth considering." Identify each bias, explain why it\'s a problem, and propose a neutral reformulation.',
      competency: 'bias_analysis',
      needs_baseline: false,
    },
  ],
  moderator: [
    {
      task_type: 'conflict_resolution',
      prompt_ru: 'Ситуация: Эксперт и Критик зашли в тупик — Эксперт настаивает на использовании RAG для задачи, Критик утверждает что это избыточно и предлагает few-shot. Оба привели аргументы. Как Модератор, предложи решение: резюмируй позиции, выяви точки согласия, сформулируй компромисс.',
      prompt_en: 'Situation: Expert and Critic are deadlocked — Expert insists on RAG for the task, Critic says it\'s overkill and suggests few-shot. Both presented arguments. As Moderator, propose a resolution: summarize positions, find agreement points, formulate a compromise.',
      competency: 'mediation',
      needs_baseline: false,
    },
    {
      task_type: 'discussion_steering',
      prompt_ru: 'Дискуссия между 3 участниками ушла от темы "Оптимизация промпта для суммаризации" к обсуждению архитектуры нейросетей. Участник А говорит о transformer attention, Участник Б — о fine-tuning, Участник В молчит. Верни дискуссию в русло, активируй молчащего участника, сохрани ценные идеи.',
      prompt_en: 'A discussion between 3 participants drifted from "Prompt optimization for summarization" to neural network architecture. Participant A talks about transformer attention, B about fine-tuning, C is silent. Steer the discussion back, activate the silent participant, preserve valuable ideas.',
      competency: 'facilitation',
      needs_baseline: false,
    },
    {
      task_type: 'quality_gate',
      prompt_ru: 'Оцени следующий ответ ассистента по критериям Quality Gate: релевантность (0-10), полнота (0-10), точность (0-10), структурированность (0-10). Ответ: "Python лучше Java потому что проще. Используй Python." Вопрос был: "Сравни Python и Java для enterprise-разработки с учётом масштабируемости и экосистемы."',
      prompt_en: 'Evaluate the following assistant response by Quality Gate criteria: relevance (0-10), completeness (0-10), accuracy (0-10), structure (0-10). Response: "Python is better than Java because it\'s simpler. Use Python." Question was: "Compare Python and Java for enterprise development considering scalability and ecosystem."',
      competency: 'quality_assessment',
      needs_baseline: false,
    },
  ],
  advisor: [
    {
      task_type: 'strategic_recommendation',
      prompt_ru: 'Пользователь спрашивает: "Хочу автоматизировать код-ревью с помощью ИИ. С чего начать?" Дай стратегическую рекомендацию: этапы внедрения, выбор инструментов, риски, метрики успеха. Учти ограничения текущих LLM.',
      prompt_en: 'User asks: "I want to automate code review with AI. Where to start?" Give strategic advice: implementation stages, tool selection, risks, success metrics. Consider current LLM limitations.',
      competency: 'strategic_thinking',
      needs_baseline: false,
    },
    {
      task_type: 'risk_assessment',
      prompt_ru: 'Команда хочет перевести всю документацию на генерацию через LLM. Проведи оценку рисков: что может пойти не так, какие safeguards нужны, как валидировать результат, план отката.',
      prompt_en: 'Team wants to switch all documentation to LLM generation. Conduct risk assessment: what could go wrong, what safeguards are needed, how to validate results, rollback plan.',
      competency: 'risk_analysis',
      needs_baseline: false,
    },
    {
      task_type: 'resource_optimization',
      prompt_ru: 'Бюджет на API-ключи ограничен. Текущие расходы: GPT-5 — 60%, Gemini — 25%, Claude — 15%. Качество примерно одинаковое. Предложи стратегию оптимизации расходов без существенной потери качества. Какие задачи на какие модели перенаправить?',
      prompt_en: 'API key budget is limited. Current spending: GPT-5 — 60%, Gemini — 25%, Claude — 15%. Quality is roughly equal. Propose a cost optimization strategy without significant quality loss. Which tasks to redirect to which models?',
      competency: 'optimization',
      needs_baseline: false,
    },
  ],
  assistant: [
    {
      task_type: 'comprehensive_answer',
      prompt_ru: 'Пользователь спрашивает: "Объясни разницу между fine-tuning, RAG и prompt engineering. Когда использовать каждый подход? Какие ресурсы потребуются?" Дай исчерпывающий, структурированный ответ с примерами и рекомендациями.',
      prompt_en: 'User asks: "Explain the difference between fine-tuning, RAG, and prompt engineering. When to use each approach? What resources are needed?" Give a comprehensive, structured answer with examples and recommendations.',
      competency: 'deep_analysis',
      needs_baseline: false,
    },
    {
      task_type: 'creative_solution',
      prompt_ru: 'Пользователь описывает проблему: "Мой чат-бот отвечает слишком шаблонно, пользователи жалуются на роботизированность. Бюджет ограничен, менять модель не вариант." Предложи 3 разных подхода к решению с разным соотношением сложность/эффект.',
      prompt_en: 'User describes a problem: "My chatbot responds too formulaically, users complain about robotic feel. Budget is limited, changing the model is not an option." Propose 3 different approaches with varying complexity/effect trade-offs.',
      competency: 'creative_problem_solving',
      needs_baseline: false,
    },
    {
      task_type: 'multi_perspective',
      prompt_ru: 'Пользователь готовит доклад на тему "Влияние ИИ на рынок труда в 2025-2030". Помоги ему: представь анализ с трёх точек зрения — оптимистичной, пессимистичной и реалистичной. Для каждой приведи данные и аргументы.',
      prompt_en: 'User is preparing a report on "AI impact on the job market 2025-2030". Help them: present analysis from three perspectives — optimistic, pessimistic, and realistic. For each, provide data and arguments.',
      competency: 'multi_perspective_analysis',
      needs_baseline: false,
    },
  ],
  arbiter: [
    {
      task_type: 'synthesis',
      prompt_ru: 'Эксперт предложил использовать GPT-5 для задачи суммаризации (аргументы: точность, длинный контекст). Критик возразил (аргументы: стоимость, латентность, достаточно Gemini Flash). Как Арбитр, синтезируй финальное решение: взвесь аргументы, предложи оптимальный вариант с обоснованием.',
      prompt_en: 'Expert proposed using GPT-5 for summarization (arguments: accuracy, long context). Critic objected (arguments: cost, latency, Gemini Flash is sufficient). As Arbiter, synthesize the final decision: weigh arguments, propose optimal solution with justification.',
      competency: 'decision_synthesis',
      needs_baseline: false,
    },
    {
      task_type: 'objective_scoring',
      prompt_ru: 'Оцени два ответа на вопрос "Как настроить CI/CD для ML-проекта?" по критериям: полнота (0-10), практичность (0-10), актуальность (0-10). Ответ А — подробный, но устаревший (использует Jenkins). Ответ Б — краткий, но современный (GitHub Actions + MLflow). Обоснуй каждую оценку.',
      prompt_en: 'Evaluate two answers to "How to set up CI/CD for an ML project?" by criteria: completeness (0-10), practicality (0-10), relevance (0-10). Answer A — detailed but outdated (uses Jenkins). Answer B — concise but modern (GitHub Actions + MLflow). Justify each score.',
      competency: 'objective_evaluation',
      needs_baseline: false,
    },
    {
      task_type: 'fairness_check',
      prompt_ru: 'В конкурсе моделей по задаче "Генерация маркетингового текста" участвовали GPT-5, Gemini Pro и Claude. GPT-5 получил высший балл, но использовал в 3 раза больше токенов. Как учесть эффективность при финальной оценке? Предложи корректирующую формулу и обоснуй.',
      prompt_en: 'In a model contest for "Marketing text generation", GPT-5, Gemini Pro, and Claude participated. GPT-5 scored highest but used 3x more tokens. How to factor efficiency into the final evaluation? Propose a corrective formula and justify it.',
      competency: 'fairness_assessment',
      needs_baseline: false,
    },
  ],
  consultant: [
    {
      task_type: 'deep_expertise',
      prompt_ru: 'Пользователь работает над задачей: "Создать систему автоматической классификации обращений в поддержку по 15 категориям". Проведи экспертную консультацию: предложи архитектуру решения, выбор модели, стратегию обучения, обработку пограничных случаев.',
      prompt_en: 'User works on: "Create an automatic support ticket classification system across 15 categories". Provide expert consultation: solution architecture, model selection, training strategy, edge case handling.',
      competency: 'domain_expertise',
      needs_baseline: false,
    },
    {
      task_type: 'solution_comparison',
      prompt_ru: 'Пользователю нужно выбрать между тремя подходами к суммаризации длинных документов: (1) Map-Reduce, (2) Refine, (3) Stuff с большим контекстным окном. Для каждого подхода опиши плюсы, минусы, идеальный use-case и ограничения.',
      prompt_en: 'User needs to choose between three approaches to long document summarization: (1) Map-Reduce, (2) Refine, (3) Stuff with large context window. For each approach describe pros, cons, ideal use-case, and limitations.',
      competency: 'comparative_analysis',
      needs_baseline: false,
    },
    {
      task_type: 'implementation_guidance',
      prompt_ru: 'Пользователь хочет добавить RAG (Retrieval-Augmented Generation) в свой проект. У него есть 500 PDF-документов. Дай пошаговое руководство: от парсинга документов до продакшн-деплоя. Укажи конкретные инструменты и библиотеки.',
      prompt_en: 'User wants to add RAG (Retrieval-Augmented Generation) to their project. They have 500 PDF documents. Provide step-by-step guidance: from document parsing to production deployment. Specify concrete tools and libraries.',
      competency: 'practical_guidance',
      needs_baseline: false,
    },
  ],
  patent_attorney: [
    {
      task_type: 'analytical_depth',
      prompt_ru: 'Проанализируй следующее техническое решение и выдели потенциально патентоспособные элементы:\n\n"Система мультиагентного ИИ, в которой несколько специализированных моделей (Эксперт, Критик, Арбитр) обрабатывают запрос пользователя параллельно. Каждая модель имеет ролевой системный промпт и доступ к персональной RAG-памяти. Арбитр синтезирует финальный ответ, взвешивая оценки всех участников. Система самосовершенствуется через автоматическую оптимизацию промптов (Эволюционер) с фиксацией метрик до/после в публичных Хрониках."\n\nТребования:\n1. Выдели минимум 3 потенциально патентоспособных элемента\n2. Для каждого укажи: новизну, изобретательский уровень, промышленную применимость\n3. Обоснуй, почему каждый элемент может претендовать на патентную защиту\n4. Укажи потенциальные препятствия для патентования',
      prompt_en: 'Analyze the following technical solution and identify potentially patentable elements:\n\n"A multi-agent AI system where several specialized models (Expert, Critic, Arbiter) process user queries in parallel. Each model has a role-specific system prompt and access to personal RAG memory. The Arbiter synthesizes the final answer, weighing all participants\' assessments. The system self-improves through automatic prompt optimization (Evolutioner) with before/after metrics recorded in public Chronicles."\n\nRequirements:\n1. Identify at least 3 potentially patentable elements\n2. For each, specify: novelty, inventive step, industrial applicability\n3. Justify why each element may qualify for patent protection\n4. Indicate potential obstacles to patenting',
      competency: 'analytical_depth',
      needs_baseline: false,
    },
    {
      task_type: 'claim_structure',
      prompt_ru: 'Составь формулу изобретения для следующего технического решения:\n\n"Способ автоматической оценки качества ответов ИИ-моделей, включающий: (а) одновременную генерацию ответов несколькими моделями на один запрос; (б) автоматическую оценку каждого ответа по заданным критериям (точность, полнота, структура, оригинальность) с помощью модели-арбитра; (в) нормализацию баллов и ранжирование; (г) сохранение результатов с метаданными для последующего анализа."\n\nТребования:\n1. Сформулируй 1 независимый пункт (максимально широкий объём прав)\n2. Сформулируй 2-3 зависимых пункта (конкретизация)\n3. Используй стандартную патентную терминологию\n4. Укажи классы МПК (IPC)',
      prompt_en: 'Draft patent claims for the following technical solution:\n\n"A method for automatic quality assessment of AI model responses, comprising: (a) simultaneous generation of responses by multiple models to a single query; (b) automatic evaluation of each response against defined criteria (accuracy, completeness, structure, originality) using an arbiter model; (c) score normalization and ranking; (d) storing results with metadata for subsequent analysis."\n\nRequirements:\n1. Draft 1 independent claim (broadest scope of protection)\n2. Draft 2-3 dependent claims (specifications)\n3. Use standard patent terminology\n4. Indicate IPC classes',
      competency: 'claim_structure',
      needs_baseline: false,
    },
    {
      task_type: 'standards_knowledge',
      prompt_ru: 'Подготовь раздел "Уровень техники" патентной заявки для изобретения в области мультиагентных ИИ-систем. Описание изобретения: "Система с автоматической ротацией ИИ-моделей на штатных ролях через процедуру конкурсного собеседования с многокритериальной оценкой."\n\nТребования:\n1. Укажи минимум 3 известных аналога с корректными ссылками\n2. Для каждого аналога опиши: суть решения, его преимущества и недостатки\n3. Сформулируй технические проблемы, которые не решены в известных аналогах\n4. Соблюдай формат заявки по стандарту ФИПС / PCT\n5. Укажи дисклеймер о необходимости проверки специалистом',
      prompt_en: 'Prepare the "Prior Art" section of a patent application for an invention in multi-agent AI systems. Invention description: "A system with automatic AI model rotation in staff roles through a competitive interview process with multi-criteria evaluation."\n\nRequirements:\n1. Cite at least 3 known analogs with proper references\n2. For each analog describe: essence, advantages, and disadvantages\n3. Formulate technical problems not solved by known analogs\n4. Follow FIPS / PCT application format\n5. Include a disclaimer about the need for specialist review',
      competency: 'standards_knowledge',
      needs_baseline: false,
    },
    {
      task_type: 'prior_art_search',
      prompt_ru: 'Сформулируй стратегию патентного поиска для следующего изобретения:\n\n"Метод семантической верификации качества перевода через сравнение эмбеддингов оригинала и перевода с автоматическим обнаружением drift и инициацией ре-перевода при превышении порога."\n\nТребования:\n1. Сформулируй минимум 5 поисковых запросов для Google Patents/Espacenet\n2. Укажи релевантные классы IPC/CPC\n3. Определи ключевые слова и их синонимы\n4. Предложи юрисдикции для приоритетного поиска (US, EP, WO, RU)\n5. Опиши критерии релевантности найденных документов',
      prompt_en: 'Formulate a patent search strategy for the following invention:\n\n"A method for semantic verification of translation quality through comparison of source and translation embeddings with automatic drift detection and re-translation initiation when a threshold is exceeded."\n\nRequirements:\n1. Formulate at least 5 search queries for Google Patents/Espacenet\n2. Specify relevant IPC/CPC classes\n3. Identify keywords and their synonyms\n4. Suggest priority jurisdictions (US, EP, WO, RU)\n5. Describe relevance criteria for found documents',
      competency: 'prior_art_search',
      needs_baseline: false,
    },
    {
      task_type: 'legal_accuracy',
      prompt_ru: 'Оцени следующий черновик независимого пункта формулы изобретения и исправь все юридические и терминологические ошибки:\n\n"1. Программа для компьютера, которая использует искусственный интеллект для автоматической проверки ответов, характеризующаяся тем, что она работает быстрее аналогов и даёт лучшие результаты за счёт использования нескольких нейросетей одновременно."\n\nТребования:\n1. Укажи все ошибки (юридические, терминологические, структурные)\n2. Объясни, почему каждая формулировка некорректна\n3. Предложи исправленную версию\n4. Добавь дисклеймер о необходимости проверки патентным поверенным\n5. Укажи применимое законодательство (ГК РФ ч.4, PCT)',
      prompt_en: 'Evaluate the following draft independent patent claim and correct all legal and terminological errors:\n\n"1. A computer program that uses artificial intelligence for automatic response verification, characterized by working faster than analogs and producing better results by using multiple neural networks simultaneously."\n\nRequirements:\n1. Identify all errors (legal, terminological, structural)\n2. Explain why each formulation is incorrect\n3. Propose a corrected version\n4. Add a disclaimer about the need for patent attorney review\n5. Cite applicable legislation (RF Civil Code Part IV, PCT)',
      competency: 'legal_accuracy',
      needs_baseline: false,
    },
    {
      task_type: 'risk_assessment',
      prompt_ru: 'Ты — патентный юрист-консульт. Заявитель планирует подать патентную заявку на изобретение:\n\n"Способ автоматической ротации ИИ-моделей на штатных ролях через конкурсное собеседование с многокритериальной оценкой и наследованием опыта предшественника."\n\nВ ходе патентного поиска найден аналог:\nUS2023/0012345 — "System for automated assignment of machine learning models to processing roles based on performance benchmarking"\nЗаявитель: TechCorp Inc., дата приоритета: 2022-03-15\n\nТребования:\n1. Оцени степень угрозы аналога (высокая/средняя/низкая)\n2. Выдели совпадающие и отличающиеся признаки\n3. Объясни риски на понятном заявителю языке\n4. Предложи стратегию обхода\n5. Рекомендуй дальнейшие действия',
      prompt_en: 'You are a patent legal consultant. The applicant plans to file a patent for:\n\n"A method for automatic rotation of AI models in staff roles through competitive interviews with multi-criteria evaluation and predecessor experience inheritance."\n\nA prior art analog was found:\nUS2023/0012345 — "System for automated assignment of machine learning models to processing roles based on performance benchmarking"\nApplicant: TechCorp Inc., priority date: 2022-03-15\n\nRequirements:\n1. Assess the threat level (high/medium/low)\n2. Identify overlapping and distinguishing features\n3. Explain the risks in plain language\n4. Propose a workaround strategy\n5. Recommend next steps',
      competency: 'risk_assessment',
      needs_baseline: false,
    },
    {
      task_type: 'plain_language',
      prompt_ru: 'Ты — патентный юрист-консульт. Заявитель (технический специалист, не юрист) просит объяснить следующую формулу изобретения:\n\n"1. Способ семантической верификации качества перевода, включающий получение исходного текста и текста перевода, генерацию векторных представлений (эмбеддингов) исходного текста и перевода с помощью мультиязычной модели, вычисление косинусного расстояния между полученными эмбеддингами, сравнение вычисленного расстояния с предварительно установленным пороговым значением, и при превышении порогового значения — инициацию повторного перевода с использованием альтернативной модели перевода, отличающийся тем, что пороговое значение динамически корректируется на основе статистики предыдущих верификаций для данной языковой пары."\n\nТребования:\n1. Объясни суть формулы простым языком\n2. Укажи, что защищается и что НЕ защищается\n3. Приведи примеры того, что конкурент может делать без нарушения\n4. Рекомендуй стратегию подачи: РФ, PCT, или прямая\n5. Оцени примерные сроки и стоимость',
      prompt_en: 'You are a patent legal consultant. The applicant (a technical specialist, not a lawyer) asks you to explain the following patent claim:\n\n"1. A method for semantic verification of translation quality, comprising receiving a source text and a translation text, generating vector representations (embeddings) using a multilingual model, computing the cosine distance between embeddings, comparing with a threshold, and upon exceeding — initiating re-translation using an alternative model, characterized in that the threshold is dynamically adjusted based on statistics of previous verifications for a given language pair."\n\nRequirements:\n1. Explain the claim in plain language\n2. Specify what is and is NOT protected\n3. Provide examples of what a competitor can do without infringement\n4. Recommend filing strategy: Russia-only, PCT, or direct\n5. Estimate approximate timelines and costs',
      competency: 'plain_language',
      needs_baseline: false,
    },
  ],
};

// Fallback tasks for roles not explicitly covered
const GENERIC_TASKS: TestTask[] = [
  {
    task_type: 'role_understanding',
    prompt_ru: 'Опиши свои ключевые обязанности в системе AI-Hydra. Какие метрики определяют успешность твоей работы? Какие ресурсы тебе необходимы?',
    prompt_en: 'Describe your key responsibilities in the AI-Hydra system. What metrics define the success of your work? What resources do you need?',
    competency: 'self_awareness',
    needs_baseline: false,
  },
  {
    task_type: 'collaboration',
    prompt_ru: 'Опиши, как ты взаимодействуешь с ближайшими коллегами. Приведи пример ситуации, где плохая координация привела бы к проблемам.',
    prompt_en: 'Describe how you interact with your closest colleagues. Give an example of a situation where poor coordination would lead to problems.',
    competency: 'teamwork',
    needs_baseline: false,
  },
];

// ──────────────────────────────────────────────
// Baseline data fetchers
// ──────────────────────────────────────────────

async function fetchBaseline(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  role: string,
  source: TestTask['baseline_source'],
): Promise<string> {
  switch (source) {
    case 'role_knowledge': {
      const { data } = await supabase
        .from('role_knowledge')
        .select('content, source_title, category')
        .eq('role', role)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!data || data.length === 0) return '(Нет данных / No data)';
      return data.map((e: any) => `[${e.category}] ${e.source_title || ''}: ${e.content.slice(0, 200)}`).join('\n');
    }
    case 'role_memory': {
      const { data } = await supabase
        .from('role_memory')
        .select('content, memory_type, confidence_score')
        .eq('role', role)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!data || data.length === 0) return '(Нет данных / No data)';
      return data.map((e: any) => `[${e.memory_type}] ${e.content.slice(0, 200)}`).join('\n');
    }
    case 'prompt_library': {
      const { data } = await supabase
        .from('prompt_library')
        .select('name, content, role, tags')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5);
      if (!data || data.length === 0) return '(Нет данных / No data)';
      return data.map((e: any) => `[${e.role}] ${e.name}: ${e.content.slice(0, 300)}`).join('\n---\n');
    }
    case 'flow_diagrams': {
      const { data } = await supabase
        .from('flow_diagrams')
        .select('name, description, nodes')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(3);
      if (!data || data.length === 0) return '(Нет данных / No data)';
      return data.map((e: any) => {
        const nodeCount = Array.isArray(e.nodes) ? e.nodes.length : 0;
        return `${e.name} (${nodeCount} nodes): ${e.description || 'no description'}`;
      }).join('\n');
    }
    case 'custom_tools': {
      const { data } = await supabase
        .from('custom_tools')
        .select('display_name, description, tool_type, category')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10);
      if (!data || data.length === 0) return '(Нет данных / No data)';
      return data.map((e: any) => `[${e.tool_type}/${e.category}] ${e.display_name}: ${e.description}`).join('\n');
    }
    default:
      return '(Нет данных / No data)';
  }
}

// ──────────────────────────────────────────────
// SSE streaming helpers
// ──────────────────────────────────────────────

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ──────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { session_id, language = 'ru', max_tokens_override } = await req.json();
    const testMaxTokens = Math.min(Math.max(max_tokens_override || 2048, 512), 16384);

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "Missing session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load interview session
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Interview session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.status !== 'briefing' && session.status !== 'testing' && session.status !== 'briefed') {
      return new Response(
        JSON.stringify({ error: `Cannot run tests in status: ${session.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const role = session.role;
    const candidateModel = session.candidate_model;
    const briefingData = session.briefing_data as Record<string, unknown> | null;
    const briefText = briefingData?.brief_text as string || '';

    // Select test tasks for this role
    const roleTasks = ROLE_TEST_TASKS[role] || GENERIC_TASKS;
    const maxTasks = role === 'patent_attorney' ? 7 : 5;
    const allTasks = [...roleTasks, ...GENERIC_TASKS.filter(g => 
      !roleTasks.some(r => r.task_type === g.task_type)
    )].slice(0, maxTasks);

    const isRu = language === 'ru';

    // ── Resume logic: detect previously completed steps ──
    const existingResults = (session.test_results as any)?.steps as any[] || [];
    const completedTaskTypes = new Set(
      existingResults
        .filter((s: any) => s.status === 'completed')
        .map((s: any) => s.task_type)
    );
    const isResume = completedTaskTypes.size > 0;

    if (isResume) {
      console.log(`[interview-test] Resuming session ${session_id}: ${completedTaskTypes.size} steps already completed`);
    }

    // Update session to 'testing'
    await supabase
      .from('interview_sessions')
      .update({
        status: 'testing',
        started_at: session.started_at || new Date().toISOString(),
        config: {
          ...(session.config as Record<string, unknown> || {}),
          phase: 'testing',
          total_steps: allTasks.length,
        },
      })
      .eq('id', session_id);

    // ── SSE stream ──
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        };

        send('start', {
          session_id,
          role,
          candidate_model: candidateModel,
          total_steps: allTasks.length,
          resumed: isResume,
          already_completed: completedTaskTypes.size,
        });

        // Seed testResults with previously completed steps
        const testResults: unknown[] = isResume ? [...existingResults] : [];

        for (let i = 0; i < allTasks.length; i++) {
          const task = allTasks[i];
          const stepIndex = i;

          // Skip already completed steps on resume
          if (isResume && completedTaskTypes.has(task.task_type)) {
            send('step_skipped', {
              step_index: stepIndex,
              task_type: task.task_type,
              competency: task.competency,
              reason: 'already_completed',
            });
            continue;
          }

          send('step_start', {
            step_index: stepIndex,
            task_type: task.task_type,
            competency: task.competency,
            total_steps: allTasks.length,
          });

          // Fetch baseline if needed
          let baseline: string | null = null;
          if (task.needs_baseline && task.baseline_source) {
            try {
              baseline = await fetchBaseline(supabase, user.id, role, task.baseline_source);
            } catch (e) {
              console.warn(`[interview-test] Baseline fetch failed for ${task.baseline_source}:`, e);
              baseline = '(Ошибка загрузки / Load error)';
            }
          }

          // Build the test prompt
          const taskPrompt = isRu ? task.prompt_ru : task.prompt_en;
          let fullPrompt = taskPrompt;
          if (baseline) {
            fullPrompt += `\n\n---\n## Текущее состояние (baseline):\n${baseline}`;
          }

          // ── Adaptive retry loop with dynamic parameter adjustment ──
          const ADAPTIVE_MAX_RETRIES = 3;
          const IDLE_TIMEOUT_MS = 45_000; // 45s without data = stalled
          const ADAPTIVE_PARAMS = [
            { max_tokens_mult: 1.0, temp_delta: 0 },      // Original
            { max_tokens_mult: 0.75, temp_delta: -0.1 },   // Reduce scope on timeout
            { max_tokens_mult: 1.5, temp_delta: 0 },       // Expand on empty response
          ];

          const startTime = Date.now();
          let candidateOutput = '';
          let tokenCount = 0;
          let error: string | null = null;
          let attemptsUsed = 0;

          for (let attempt = 0; attempt < ADAPTIVE_MAX_RETRIES; attempt++) {
            const adj = ADAPTIVE_PARAMS[attempt];
            const adjMaxTokens = Math.round(testMaxTokens * adj.max_tokens_mult);
            const adjTemp = Math.max(0, Math.min(1, 0.7 + adj.temp_delta));
            attemptsUsed = attempt + 1;

            if (attempt > 0) {
              send('step_retry', {
                step_index: stepIndex,
                attempt: attempt + 1,
                adjusted_max_tokens: adjMaxTokens,
                adjusted_temperature: adjTemp,
                reason: error,
              });
              await new Promise(r => setTimeout(r, 2000));
              error = null;
            }

            let attemptOutput = '';
            let attemptTokens = 0;

            try {
              const streamUrl = `${supabaseUrl}/functions/v1/hydra-stream`;
              const response = await fetch(streamUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': authHeader,
                  'apikey': supabaseKey,
                },
                body: JSON.stringify({
                  message: fullPrompt,
                  model_id: candidateModel,
                  role: 'assistant',
                  system_prompt: briefText,
                  temperature: adjTemp,
                  max_tokens: adjMaxTokens,
                }),
              });

              if (!response.ok) {
                const errText = await response.text();
                error = `HTTP ${response.status}: ${errText}`;
                continue;
              }

              // Parse SSE stream with idle timeout detection
              const reader = response.body!.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              let idleTimer: ReturnType<typeof setTimeout> | null = null;
              let timedOut = false;

              const resetIdle = () => {
                if (idleTimer) clearTimeout(idleTimer);
                idleTimer = setTimeout(() => { timedOut = true; }, IDLE_TIMEOUT_MS);
              };
              resetIdle();

              try {
                while (!timedOut) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  resetIdle();
                  buffer += decoder.decode(value, { stream: true });

                  let newlineIdx: number;
                  while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
                    let line = buffer.slice(0, newlineIdx);
                    buffer = buffer.slice(newlineIdx + 1);
                    if (line.endsWith('\r')) line = line.slice(0, -1);
                    if (!line.startsWith('data: ')) continue;
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr === '[DONE]') break;
                    try {
                      const parsed = JSON.parse(jsonStr);
                      const content = parsed.choices?.[0]?.delta?.content as string | undefined;
                      if (content) {
                        attemptOutput += content;
                        attemptTokens++;
                      }
                    } catch { /* partial JSON */ }
                  }

                  // Send streaming progress periodically
                  if (attemptTokens % 20 === 0 && attemptTokens > 0) {
                    send('step_progress', {
                      step_index: stepIndex,
                      tokens: attemptTokens,
                      attempt: attempt + 1,
                      preview: attemptOutput.slice(-200),
                    });
                  }
                }
              } finally {
                if (idleTimer) clearTimeout(idleTimer);
                try { reader.cancel(); } catch { /* ok */ }
              }

              if (timedOut) {
                error = `Idle timeout (${IDLE_TIMEOUT_MS}ms), got ${attemptTokens} tokens`;
                // Keep partial output if substantial
                if (attemptOutput.length > candidateOutput.length) {
                  candidateOutput = attemptOutput;
                  tokenCount = attemptTokens;
                }
                continue;
              }

              if (!attemptOutput.trim()) {
                error = 'Empty response';
                continue;
              }

              // Success — keep best output
              candidateOutput = attemptOutput;
              tokenCount = attemptTokens;
              error = null;
              break;

            } catch (e: any) {
              error = e.message || 'Unknown error';
              console.error(`[interview-test] Step ${stepIndex} attempt ${attempt + 1} failed:`, e);
            }
          }

          // Use best partial result even if all attempts had issues
          if (error && candidateOutput.length > 200) {
            console.log(`[interview-test] Step ${stepIndex}: using partial result (${candidateOutput.length} chars) despite error: ${error}`);
            error = null; // Accept partial as success
          }

          const elapsedMs = Date.now() - startTime;

          const stepResult = {
            step_index: stepIndex,
            task_type: task.task_type,
            competency: task.competency,
            task_prompt: taskPrompt,
            baseline: baseline ? { current_value: baseline } : null,
            candidate_output: error ? null : { proposed_value: candidateOutput },
            status: error ? 'failed' : 'completed',
            error: error,
            elapsed_ms: elapsedMs,
            token_count: tokenCount,
            attempts_used: attemptsUsed,
          };

          testResults.push(stepResult);

          // Incremental save FIRST (before SSE) to survive edge function timeouts
          const completedSoFar = testResults.filter((r: any) => r.status === 'completed').length;
          await supabase
            .from('interview_sessions')
            .update({
              test_results: {
                steps: testResults,
                total_steps: allTasks.length,
                completed_steps: completedSoFar,
                started_at: session.started_at,
              },
              config: {
                ...(session.config as Record<string, unknown> || {}),
                phase: 'testing',
                total_steps: allTasks.length,
                completed_steps: completedSoFar,
              },
            })
            .eq('id', session_id);

          // SSE notify (may fail if stream closed due to timeout — safe to ignore)
          try {
            send('step_complete', {
              step_index: stepIndex,
              status: stepResult.status,
              elapsed_ms: elapsedMs,
              token_count: tokenCount,
              error: error,
            });
          } catch { /* stream already closed */ }
        }

        // Save all results to the session
        const completedSteps = testResults.filter((r: any) => r.status === 'completed').length;
        const actualTotalTokens = testResults.reduce((sum: number, r: any) => sum + (r.token_count || 0), 0);
        const actualTotalElapsedMs = testResults.reduce((sum: number, r: any) => sum + (r.elapsed_ms || 0), 0);

        await supabase
          .from('interview_sessions')
          .update({
            test_results: {
              steps: testResults,
              total_steps: allTasks.length,
              completed_steps: completedSteps,
              started_at: session.started_at,
              completed_at: new Date().toISOString(),
            },
            status: 'tested',
            config: {
              ...(session.config as Record<string, unknown> || {}),
              phase: 'tested',
              total_steps: allTasks.length,
              completed_steps: completedSteps,
              max_tokens_used: testMaxTokens,
              actual_tokens_used: actualTotalTokens,
              actual_elapsed_ms: actualTotalElapsedMs,
            },
          })
          .eq('id', session_id);

        send('complete', {
          session_id,
          total_steps: allTasks.length,
          completed_steps: completedSteps,
          failed_steps: allTasks.length - completedSteps,
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (err: any) {
    console.error('[interview-test-runner] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
