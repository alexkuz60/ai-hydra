/**
 * TechnoCritic Interview Plugin
 * 
 * Implements RoleTestPlugin for the 'technocritic' role.
 * Tests core quality-judge competencies:
 * 1. Error Detection — find hallucinations and factual errors in AI output
 * 2. Argument Analysis — evaluate logical coherence and evidence quality
 * 3. Bias Detection — identify hidden biases in model responses
 * 4. Comparative Critique — rank multiple responses with justification
 * 5. Cold Start — generate evaluation criteria from scratch
 */

import type { RoleTestPlugin, RoleTestContext, RoleTestTask } from '@/types/interview';

// ── Localized competency labels ──

export const COMPETENCY_LABELS: Record<string, { ru: string; en: string }> = {
  error_detection: { ru: 'Выявление ошибок', en: 'Error Detection' },
  argument_analysis: { ru: 'Анализ аргументации', en: 'Argument Analysis' },
  bias_detection: { ru: 'Обнаружение предвзятости', en: 'Bias Detection' },
  comparative_critique: { ru: 'Сравнительная критика', en: 'Comparative Critique' },
  cold_start: { ru: 'Создание критериев с нуля', en: 'Criteria Cold Start' },
};

// ── Plugin Implementation ──

export const technocriticPlugin: RoleTestPlugin = {
  role: 'technocritic',

  generateTasks(context: RoleTestContext): RoleTestTask[] {
    const { language } = context;
    const isRu = language === 'ru';
    const tasks: RoleTestTask[] = [];

    // ── Task 1: Error Detection ──
    tasks.push({
      task_type: 'error_detection',
      competency: 'error_detection',
      task_prompt: isRu
        ? `Проанализируй следующий ответ ИИ-модели на вопрос "Какие алгоритмы сортировки имеют сложность O(n log n) в худшем случае?":\n\n"К алгоритмам со сложностью O(n log n) в худшем случае относятся: Quick Sort, Merge Sort, Heap Sort и Tim Sort. Quick Sort использует стратегию 'разделяй и властвуй' и гарантирует O(n log n) благодаря выбору медианного пивота. Merge Sort стабилен и работает за O(n log n) всегда. Heap Sort использует бинарную кучу. Tim Sort — гибрид Merge Sort и Insertion Sort, используется в Python и Java."\n\nЗадача:\n1. Выяви все фактические ошибки и неточности\n2. Для каждой ошибки укажи: что именно неверно, почему это ошибка, правильный вариант\n3. Оцени степень критичности каждой ошибки (критическая / незначительная)\n4. Дай итоговую оценку надёжности ответа (0-10)`
        : `Analyze the following AI response to "Which sorting algorithms have O(n log n) worst-case complexity?":\n\n"Algorithms with O(n log n) worst-case complexity include: Quick Sort, Merge Sort, Heap Sort, and Tim Sort. Quick Sort uses a 'divide and conquer' strategy and guarantees O(n log n) thanks to median pivot selection. Merge Sort is stable and always runs in O(n log n). Heap Sort uses a binary heap. Tim Sort is a hybrid of Merge Sort and Insertion Sort, used in Python and Java."\n\nTask:\n1. Identify all factual errors and inaccuracies\n2. For each error: what's wrong, why it's an error, the correct answer\n3. Rate severity of each error (critical / minor)\n4. Give an overall reliability score (0-10)`,
      baseline_source: { type: 'none' },
    });

    // ── Task 2: Argument Analysis ──
    tasks.push({
      task_type: 'argument_analysis',
      competency: 'argument_analysis',
      task_prompt: isRu
        ? `Оцени качество аргументации в следующем ответе модели на вопрос "Стоит ли компании перейти с монолита на микросервисы?":\n\n"Однозначно стоит перейти на микросервисы. Все крупные компании (Netflix, Amazon, Google) используют микросервисы, что доказывает их превосходство. Монолиты не масштабируются и являются устаревшей архитектурой. Микросервисы позволяют каждой команде работать независимо. Единственный минус — нужен Kubernetes, но это стандарт индустрии. Стоимость перехода окупится за 6 месяцев за счёт повышения скорости разработки."\n\nЗадача:\n1. Разбери каждый аргумент: тезис, обоснование, валидность\n2. Выяви логические ошибки (appeal to authority, hasty generalization, etc.)\n3. Определи пропущенные контраргументы\n4. Оцени общую силу аргументации (0-10) с обоснованием`
        : `Evaluate the argumentation quality in this model's response to "Should a company migrate from monolith to microservices?":\n\n"Definitely should migrate to microservices. All major companies (Netflix, Amazon, Google) use microservices, which proves their superiority. Monoliths don't scale and are an outdated architecture. Microservices allow each team to work independently. The only downside is you need Kubernetes, but that's industry standard. Migration cost will pay off in 6 months due to increased development speed."\n\nTask:\n1. Break down each argument: thesis, justification, validity\n2. Identify logical fallacies (appeal to authority, hasty generalization, etc.)\n3. Identify missing counter-arguments\n4. Rate overall argument strength (0-10) with justification`,
      baseline_source: { type: 'none' },
    });

    // ── Task 3: Bias Detection ──
    tasks.push({
      task_type: 'bias_detection',
      competency: 'bias_detection',
      task_prompt: isRu
        ? `Проанализируй два ответа моделей на один и тот же вопрос "Какой язык программирования лучше для стартапа?" и выяви скрытые предвзятости:\n\nОтвет A: "Python — лучший выбор для стартапа. Его экосистема для ML/AI непревзойдена, Django позволяет быстро создать MVP, а огромное сообщество обеспечит поддержку. JavaScript подходит только для фронтенда."\n\nОтвет B: "TypeScript с Next.js — идеальный стек. Full-stack на одном языке снижает когнитивную нагрузку. Python подходит только для data science задач и имеет проблемы с производительностью."\n\nЗадача:\n1. Выяви предвзятости в каждом ответе (confirmation bias, anchoring, framing, etc.)\n2. Определи, какие факты были избирательно опущены\n3. Предложи объективную оценку обоих вариантов\n4. Сформулируй критерии для непредвзятого сравнения технологий`
        : `Analyze two model responses to "What programming language is best for a startup?" and detect hidden biases:\n\nResponse A: "Python is the best choice for a startup. Its ML/AI ecosystem is unmatched, Django allows quick MVP creation, and the huge community ensures support. JavaScript is only suitable for frontend."\n\nResponse B: "TypeScript with Next.js is the ideal stack. Full-stack in one language reduces cognitive load. Python is only suitable for data science tasks and has performance issues."\n\nTask:\n1. Detect biases in each response (confirmation bias, anchoring, framing, etc.)\n2. Identify selectively omitted facts\n3. Propose an objective evaluation of both options\n4. Formulate criteria for unbiased technology comparison`,
      baseline_source: { type: 'none' },
    });

    // ── Task 4: Comparative Critique ──
    tasks.push({
      task_type: 'comparative_critique',
      competency: 'comparative_critique',
      task_prompt: isRu
        ? `Тебе предоставлены 3 ответа моделей на задачу "Напиши функцию debounce на TypeScript":\n\nОтвет 1:\n\`\`\`typescript\nfunction debounce(fn: Function, ms: number) {\n  let timer: any;\n  return (...args: any[]) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n}\n\`\`\`\n\nОтвет 2:\n\`\`\`typescript\nfunction debounce<T extends (...args: any[]) => any>(\n  func: T, wait: number\n): (...args: Parameters<T>) => void {\n  let timeoutId: ReturnType<typeof setTimeout> | null = null;\n  return (...args: Parameters<T>) => {\n    if (timeoutId) clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => { func(...args); timeoutId = null; }, wait);\n  };\n}\n\`\`\`\n\nОтвет 3:\n\`\`\`typescript\nconst debounce = (fn: any, delay: number) => {\n  let t: any;\n  return function(this: any) {\n    clearTimeout(t);\n    t = setTimeout(() => fn.apply(this, arguments), delay);\n  };\n}\n\`\`\`\n\nЗадача:\n1. Оцени каждый ответ по критериям: типизация, корректность, читаемость, edge-cases\n2. Составь ранжирование от лучшего к худшему с обоснованием\n3. Для каждого укажи сильные стороны и конкретные недостатки\n4. Выстави баллы 0-10 каждому ответу`
        : `You are given 3 model responses to "Write a debounce function in TypeScript":\n\nResponse 1:\n\`\`\`typescript\nfunction debounce(fn: Function, ms: number) {\n  let timer: any;\n  return (...args: any[]) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n}\n\`\`\`\n\nResponse 2:\n\`\`\`typescript\nfunction debounce<T extends (...args: any[]) => any>(\n  func: T, wait: number\n): (...args: Parameters<T>) => void {\n  let timeoutId: ReturnType<typeof setTimeout> | null = null;\n  return (...args: Parameters<T>) => {\n    if (timeoutId) clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => { func(...args); timeoutId = null; }, wait);\n  };\n}\n\`\`\`\n\nResponse 3:\n\`\`\`typescript\nconst debounce = (fn: any, delay: number) => {\n  let t: any;\n  return function(this: any) {\n    clearTimeout(t);\n    t = setTimeout(() => fn.apply(this, arguments), delay);\n  };\n}\n\`\`\`\n\nTask:\n1. Evaluate each by: typing, correctness, readability, edge-cases\n2. Rank from best to worst with justification\n3. For each: strengths and specific weaknesses\n4. Score each response 0-10`,
      baseline_source: { type: 'none' },
    });

    // ── Task 5: Cold Start — Create Evaluation Criteria ──
    tasks.push({
      task_type: 'cold_start',
      competency: 'cold_start',
      task_prompt: isRu
        ? `Разработай с нуля систему критериев оценки для конкурса ИИ-моделей на тему "Генерация технической документации по API".\n\nТребования:\n1. Определи 5-7 критериев оценки с весами (сумма = 100%)\n2. Для каждого критерия: название, описание, шкала 0-10 с якорными описаниями для 0, 3, 5, 7, 10\n3. Добавь "красные флаги" — автоматические штрафы (например, за галлюцинации в примерах кода)\n4. Предложи формулу итогового балла\n5. Опиши процедуру разрешения спорных случаев (когда оценки разных судей расходятся более чем на 3 балла)`
        : `Design from scratch an evaluation criteria system for an AI model contest on "API Technical Documentation Generation".\n\nRequirements:\n1. Define 5-7 evaluation criteria with weights (sum = 100%)\n2. For each criterion: name, description, 0-10 scale with anchor descriptions for 0, 3, 5, 7, 10\n3. Add "red flags" — automatic penalties (e.g., for hallucinations in code examples)\n4. Propose a final score formula\n5. Describe a dispute resolution procedure (when judge scores differ by more than 3 points)`,
      baseline_source: { type: 'none' },
    });

    return tasks;
  },

  getEvaluationHint(competency: string): string {
    const hints: Record<string, string> = {
      error_detection: 'Evaluate: all errors found (Quick Sort worst-case is O(n²)), severity ratings, clear explanations. Penalize: missed errors, false positives, vague justifications.',
      argument_analysis: 'Evaluate: correct fallacy identification, completeness of counter-arguments, nuanced scoring. Penalize: missing obvious fallacies, binary thinking, no actionable feedback.',
      bias_detection: 'Evaluate: identified biases by name, found omitted facts, objective reframing quality. Penalize: surface-level analysis, own bias introduced, missing systematic approach.',
      comparative_critique: 'Evaluate: consistent criteria across all responses, justified ranking, specific code-level feedback. Penalize: inconsistent standards, vague comments, wrong technical claims.',
      cold_start: 'Evaluate: criteria completeness, anchor descriptions specificity, red flags relevance, dispute resolution practicality. Penalize: missing weights, generic anchors, no penalty system.',
    };
    return hints[competency] || 'Evaluate rigor, objectivity, and actionable feedback quality.';
  },
};

export default technocriticPlugin;
