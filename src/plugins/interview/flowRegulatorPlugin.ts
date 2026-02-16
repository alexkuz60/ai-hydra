/**
 * Flow Regulator (Логистик) Interview Plugin
 * 
 * Implements RoleTestPlugin for the 'flowregulator' role.
 * Generates 5 situational tasks that test core competencies:
 * 1. Pipeline Design — build a flow diagram from requirements
 * 2. Bottleneck Analysis — identify and fix performance issues
 * 3. Connection Validation — detect broken/invalid node connections
 * 4. Parallelism Optimization — convert sequential flow to parallel
 * 5. Cold Start — design a complete pipeline from duties alone
 */

import type { RoleTestPlugin, RoleTestContext, RoleTestTask } from '@/types/interview';

// ── Localized competency labels ──

export const COMPETENCY_LABELS: Record<string, { ru: string; en: string }> = {
  pipeline_design: { ru: 'Проектирование пайплайнов', en: 'Pipeline Design' },
  bottleneck_analysis: { ru: 'Анализ узких мест', en: 'Bottleneck Analysis' },
  connection_validation: { ru: 'Валидация связей', en: 'Connection Validation' },
  parallelism: { ru: 'Оптимизация параллелизма', en: 'Parallelism Optimization' },
  cold_start: { ru: 'Проектирование с нуля', en: 'Cold Start Design' },
};

// ── Helpers ──

/** Build a realistic flow description from knowledge entries */
function pickFlowContext(
  knowledgeEntries: RoleTestContext['knowledgeEntries'],
): string | null {
  const flowRelated = knowledgeEntries.filter(
    e => /flow|node|edge|pipeline|diagram/i.test(e.content) || e.category === 'flow'
  );
  if (flowRelated.length === 0) return null;
  const entry = flowRelated[Math.floor(Math.random() * flowRelated.length)];
  return entry.content.slice(0, 500);
}

// ── Plugin Implementation ──

export const flowRegulatorPlugin: RoleTestPlugin = {
  role: 'flowregulator',

  generateTasks(context: RoleTestContext): RoleTestTask[] {
    const { duties, knowledgeEntries, language } = context;
    const isRu = language === 'ru';
    const flowContext = pickFlowContext(knowledgeEntries);
    const tasks: RoleTestTask[] = [];

    // ── Task 1: Pipeline Design ──
    tasks.push({
      task_type: 'pipeline_design',
      competency: 'pipeline_design',
      task_prompt: isRu
        ? `Спроектируй data-flow пайплайн для задачи "Автоматический анализ пользовательского фидбека".

Требования:
1. На вход поступает текст отзыва (Input-узел)
2. Определи тональность (Model-узел с промптом классификации)
3. Извлеки ключевые темы (Model-узел с Entity extraction)
4. По результату тональности маршрутизируй: положительный → база "Похвалы", отрицательный → база "Проблемы", нейтральный → база "Предложения" (Switch-узел → 3 Database-узла)
5. Итог: сводный отчёт (Output-узел)

Ответ дай в формате:
- **Список узлов** с типами, названиями и описанием
- **Список связей** (source → target) с описанием данных на каждой связи
- **Обоснование архитектуры** — почему именно такая структура`
        : `Design a data-flow pipeline for "Automated User Feedback Analysis".

Requirements:
1. Input: review text (Input node)
2. Determine sentiment (Model node with classification prompt)
3. Extract key topics (Model node with Entity extraction)
4. Route by sentiment result: positive → "Praise" DB, negative → "Issues" DB, neutral → "Suggestions" DB (Switch node → 3 Database nodes)
5. Final output: summary report (Output node)

Provide your answer as:
- **Node list** with types, names, and descriptions
- **Connection list** (source → target) with data description on each edge
- **Architecture rationale** — why this particular structure`,
      baseline_source: { type: 'none' },
    });

    // ── Task 2: Bottleneck Analysis ──
    const bottleneckFlow = isRu
      ? `Input → Prompt("Суммаризируй") → Model(gpt-5, max_tokens=4096) → Transform("Извлеки JSON") → Model(gpt-5, max_tokens=4096, "Оцени качество") → Filter("score > 7") → Database("Сохрани результат") → Model(gpt-5, max_tokens=4096, "Сгенерируй отчёт") → Output`
      : `Input → Prompt("Summarize") → Model(gpt-5, max_tokens=4096) → Transform("Extract JSON") → Model(gpt-5, max_tokens=4096, "Evaluate quality") → Filter("score > 7") → Database("Save result") → Model(gpt-5, max_tokens=4096, "Generate report") → Output`;

    tasks.push({
      task_type: 'bottleneck_analysis',
      competency: 'bottleneck_analysis',
      task_prompt: isRu
        ? `Проанализируй следующий поток на предмет узких мест и неэффективностей:

${bottleneckFlow}

Задача:
1. Идентифицируй все узкие места (bottlenecks): латентность, стоимость, избыточные вызовы
2. Предложи конкретные оптимизации:
   - Можно ли заменить дорогую модель на дешёвую для некоторых шагов?
   - Где можно распараллелить обработку?
   - Есть ли шаги, которые можно объединить или убрать?
3. Оцени примерное сокращение стоимости и латентности (в %)
4. Предложи оптимизированную версию потока`
        : `Analyze the following flow for bottlenecks and inefficiencies:

${bottleneckFlow}

Task:
1. Identify all bottlenecks: latency, cost, redundant calls
2. Propose specific optimizations:
   - Can expensive models be replaced with cheaper ones for some steps?
   - Where can processing be parallelized?
   - Are there steps that can be merged or removed?
3. Estimate approximate cost and latency reduction (in %)
4. Propose an optimized version of the flow`,
      baseline_source: { type: 'none' },
    });

    // ── Task 3: Connection Validation ──
    tasks.push({
      task_type: 'connection_validation',
      competency: 'connection_validation',
      task_prompt: isRu
        ? `Проверь корректность следующей Flow-диаграммы и найди все ошибки:

Узлы:
- N1: Input (text)
- N2: Condition (if text.length > 1000)
- N3: Split (parallel)
- N4: Model (summarizer)
- N5: Model (translator)
- N6: Merge
- N7: Loop (repeat 3 times)
- N8: Database (save)
- N9: Output

Связи:
- N1 → N2
- N2 (true) → N3
- N2 (false) → N7
- N3 → N4
- N3 → N5
- N4 → N6
- N6 → N7
- N7 → N8
- N8 → N9
- N7 → N4

Задача:
1. Найди все ошибки валидации (отсутствующие связи, бесконечные циклы, несоединённые выходы)
2. Объясни, почему каждая ошибка проблематична
3. Предложи исправленную версию связей
4. Проверь: все ли ветки Condition ведут к Output?`
        : `Validate the following Flow diagram and find all errors:

Nodes:
- N1: Input (text)
- N2: Condition (if text.length > 1000)
- N3: Split (parallel)
- N4: Model (summarizer)
- N5: Model (translator)
- N6: Merge
- N7: Loop (repeat 3 times)
- N8: Database (save)
- N9: Output

Connections:
- N1 → N2
- N2 (true) → N3
- N2 (false) → N7
- N3 → N4
- N3 → N5
- N4 → N6
- N6 → N7
- N7 → N8
- N8 → N9
- N7 → N4

Task:
1. Find all validation errors (missing connections, infinite loops, unconnected outputs)
2. Explain why each error is problematic
3. Propose a corrected version of connections
4. Verify: do all Condition branches lead to Output?`,
      baseline_source: { type: 'none' },
    });

    // ── Task 4: Parallelism Optimization ──
    tasks.push({
      task_type: 'parallelism_optimization',
      competency: 'parallelism',
      task_prompt: isRu
        ? `Следующий поток выполняется строго последовательно, но содержит независимые шаги:

1. Input → Model A ("Извлеки сущности")
2. Model A → Model B ("Классифицируй сущности")
3. Model B → Model C ("Сгенерируй краткое содержание")
4. Model C → Model D ("Переведи на EN")
5. Model D → Model E ("Оцени качество перевода")
6. Model E → Transform ("Объедини всё в JSON")
7. Transform → Output

Анализ:
- Шаги 3 и 4 не зависят друг от друга (оба нуждаются только в выходе шага 2)
- Шаг 5 зависит только от шага 4

Задача:
1. Перепроектируй поток с использованием Split/Merge узлов для параллелизма
2. Визуализируй новую архитектуру (текстовая схема)
3. Оцени выигрыш по латентности при параллельном выполнении
4. Укажи, где Split/Merge безопасен, а где может привести к race conditions
5. Предусмотри обработку ошибок — что если одна из параллельных веток упадёт?`
        : `The following flow executes strictly sequentially but contains independent steps:

1. Input → Model A ("Extract entities")
2. Model A → Model B ("Classify entities")
3. Model B → Model C ("Generate summary")
4. Model C → Model D ("Translate to RU")
5. Model D → Model E ("Evaluate translation quality")
6. Model E → Transform ("Combine everything into JSON")
7. Transform → Output

Analysis:
- Steps 3 and 4 are independent (both only need output from step 2)
- Step 5 depends only on step 4

Task:
1. Redesign the flow using Split/Merge nodes for parallelism
2. Visualize the new architecture (text diagram)
3. Estimate latency improvement with parallel execution
4. Indicate where Split/Merge is safe and where it could lead to race conditions
5. Handle errors — what if one parallel branch fails?`,
      baseline_source: { type: 'none' },
    });

    // ── Task 5: Cold Start — Full Pipeline from Duties ──
    const dutiesList = duties.length > 0
      ? duties.join(', ')
      : isRu
        ? 'проектирование data-flow диаграмм, оптимизация маршрутов, валидация связей, документирование потоков'
        : 'data-flow diagram design, route optimization, connection validation, flow documentation';

    tasks.push({
      task_type: 'cold_start_flow',
      competency: 'cold_start',
      task_prompt: isRu
        ? `Спроектируй полноценный Flow-пайплайн для задачи "Мультиязычный Content Pipeline" с нуля.

Контекст: Система должна принимать черновик статьи, проводить его через цепочку обработки и выдавать готовые версии на 3 языках с SEO-оптимизацией.

Известные обязанности Логистика: ${dutiesList}
${flowContext ? `\nКонтекст из базы знаний:\n${flowContext}` : ''}

Требования:
1. Используй все категории узлов Flow Editor: Input/Output, AI (Model, Prompt), Logic (Condition, Split, Merge), Data (Transform, Filter), Integration (API, Database)
2. Минимум 10 узлов в пайплайне
3. Включи хотя бы одну ветку с условием (Condition)
4. Включи параллельную обработку (Split → Merge)
5. Документируй данные на каждой связи (что передаётся)
6. Предусмотри обработку ошибок (Condition на проверку статуса)
7. Укажи рекомендуемые модели для каждого Model-узла с обоснованием выбора`
        : `Design a complete Flow pipeline for "Multilingual Content Pipeline" from scratch.

Context: The system should accept a draft article, process it through a chain, and produce ready versions in 3 languages with SEO optimization.

Known Flow Regulator duties: ${dutiesList}
${flowContext ? `\nKnowledge base context:\n${flowContext}` : ''}

Requirements:
1. Use all Flow Editor node categories: Input/Output, AI (Model, Prompt), Logic (Condition, Split, Merge), Data (Transform, Filter), Integration (API, Database)
2. Minimum 10 nodes in the pipeline
3. Include at least one conditional branch (Condition)
4. Include parallel processing (Split → Merge)
5. Document data on each connection (what is passed)
6. Include error handling (Condition checking status)
7. Specify recommended models for each Model node with justification`,
      baseline_source: flowContext ? { type: 'knowledge', query: 'flow pipeline design' } : { type: 'none' },
    });

    return tasks;
  },

  getEvaluationHint(competency: string): string {
    const hints: Record<string, string> = {
      pipeline_design: 'Evaluate: correct node types for each step, logical data flow, proper use of Switch for routing, architecture rationale quality. Penalize: wrong node types, missing connections, illogical data flow.',
      bottleneck_analysis: 'Evaluate: identified all 3 consecutive Model calls as bottleneck, proposed model substitution, parallelism suggestions, cost/latency estimates with reasoning. Penalize: missed obvious bottlenecks, unrealistic estimates.',
      connection_validation: 'Evaluate: found missing N5→N6 connection, identified N7→N4 loop risk, checked all Condition branches reach Output, clear error explanations. Penalize: missed errors, false positives, no corrected version.',
      parallelism: 'Evaluate: correct Split/Merge placement, accurate dependency analysis, latency calculation, race condition awareness, error handling strategy. Penalize: incorrect dependencies, unsafe parallelism, no error handling.',
      cold_start: 'Evaluate: 10+ nodes used, all node categories present, Condition branch exists, Split/Merge for parallelism, documented edges, error handling, model recommendations with rationale. Penalize: too few nodes, missing categories, no parallelism.',
    };
    return hints[competency] || 'Evaluate overall flow architecture quality, node usage correctness, and optimization awareness.';
  },
};

export default flowRegulatorPlugin;
