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
      prompt_ru: 'Проанализируй текущий системный промпт для роли Эксперта. Предложи оптимизированную версию: сократи токены на 20% без потери качества, добавь few-shot примеры если уместно.',
      prompt_en: 'Analyze the current system prompt for the Expert role. Propose an optimized version: reduce tokens by 20% without quality loss, add few-shot examples if appropriate.',
      competency: 'optimization',
      needs_baseline: true,
      baseline_source: 'prompt_library',
    },
    {
      task_type: 'prompt_creation',
      prompt_ru: 'Создай промпт-шаблон для задачи "Генерация сводки дискуссии". Шаблон должен быть параметризован (роли участников, фокус анализа, формат вывода) и содержать chain-of-thought инструкции.',
      prompt_en: 'Create a prompt template for "Discussion summary generation". The template should be parameterized (participant roles, analysis focus, output format) and include chain-of-thought instructions.',
      competency: 'template_creation',
      needs_baseline: false,
    },
    {
      task_type: 'prompt_diagnosis',
      prompt_ru: 'Пользователь жалуется: "Критик слишком мягкий, не находит реальных проблем". Проведи диагностику текущего промпта Критика и предложи конкретные исправления.',
      prompt_en: 'User complains: "Critic is too soft, doesn\'t find real problems". Diagnose the current Critic prompt and propose specific fixes.',
      competency: 'diagnosis',
      needs_baseline: true,
      baseline_source: 'prompt_library',
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
    const allTasks = [...roleTasks, ...GENERIC_TASKS.filter(g => 
      !roleTasks.some(r => r.task_type === g.task_type)
    )].slice(0, 5); // Max 5 tasks

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

          // Call hydra-stream for the candidate model
          const startTime = Date.now();
          let candidateOutput = '';
          let tokenCount = 0;
          let error: string | null = null;

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
                temperature: 0.7,
                max_tokens: testMaxTokens,
              }),
            });

            if (!response.ok) {
              const errText = await response.text();
              throw new Error(`${response.status}: ${errText}`);
            }

            // Parse SSE stream from hydra-stream
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
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
                    candidateOutput += content;
                    tokenCount++;
                  }
                } catch { /* partial JSON */ }
              }

              // Send streaming progress periodically
              if (tokenCount % 20 === 0 && tokenCount > 0) {
                send('step_progress', {
                  step_index: stepIndex,
                  tokens: tokenCount,
                  preview: candidateOutput.slice(-200),
                });
              }
            }
          } catch (e: any) {
            error = e.message || 'Unknown error';
            console.error(`[interview-test] Step ${stepIndex} failed:`, e);
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
          };

          testResults.push(stepResult);

          send('step_complete', {
            step_index: stepIndex,
            status: stepResult.status,
            elapsed_ms: elapsedMs,
            token_count: tokenCount,
            error: error,
          });

          // Incremental save after each step to survive timeouts
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
