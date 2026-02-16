/**
 * Toolsmith (Инструменталист) Interview Plugin
 *
 * Implements RoleTestPlugin for the 'toolsmith' role.
 * Generates 5 situational tasks that test core competencies:
 * 1. Tool Design — design a Prompt-based tool from requirements
 * 2. HTTP Integration — build an HTTP API tool with proper config
 * 3. Parameter Schema — define robust parameter schemas with validation
 * 4. Error Handling — diagnose and fix a broken tool integration
 * 5. Cold Start — design a complete tool suite from role duties alone
 */

import type { RoleTestPlugin, RoleTestContext, RoleTestTask } from '@/types/interview';

// ── Localized competency labels ──

export const COMPETENCY_LABELS: Record<string, { ru: string; en: string }> = {
  tool_design: { ru: 'Проектирование инструментов', en: 'Tool Design' },
  http_integration: { ru: 'HTTP-интеграция', en: 'HTTP Integration' },
  parameter_schema: { ru: 'Схема параметров', en: 'Parameter Schema' },
  error_handling: { ru: 'Обработка ошибок', en: 'Error Handling' },
  cold_start: { ru: 'Проектирование с нуля', en: 'Cold Start Design' },
};

// ── Helpers ──

function pickToolContext(
  knowledgeEntries: RoleTestContext['knowledgeEntries'],
): string | null {
  const toolRelated = knowledgeEntries.filter(
    e => /tool|instrument|api|http|webhook/i.test(e.content) || e.category === 'tools'
  );
  if (toolRelated.length === 0) return null;
  const entry = toolRelated[Math.floor(Math.random() * toolRelated.length)];
  return entry.content.slice(0, 500);
}

// ── Plugin Implementation ──

export const toolsmithPlugin: RoleTestPlugin = {
  role: 'toolsmith',

  generateTasks(context: RoleTestContext): RoleTestTask[] {
    const { duties, knowledgeEntries, prompts, language } = context;
    const isRu = language === 'ru';
    const toolContext = pickToolContext(knowledgeEntries);
    const tasks: RoleTestTask[] = [];

    // ── Task 1: Tool Design (Prompt-based) ──
    tasks.push({
      task_type: 'tool_design',
      competency: 'tool_design',
      task_prompt: isRu
        ? `Спроектируй Prompt-based инструмент "Генератор технических требований" (TechSpec Generator).

Назначение: На основе краткого описания фичи от пользователя генерирует структурированное ТЗ с разделами.

Требования к проекту инструмента:
1. **Название и описание**: display_name, name (snake_case), description (до 200 символов)
2. **Prompt-шаблон**: Напиши полный prompt_template с переменными \`{{feature_description}}\`, \`{{target_audience}}\`, \`{{priority}}\`
3. **Параметры**: Определи JSON-схему параметров с типами, описаниями и значениями по умолчанию
4. **Категория**: Выбери подходящую (planning / analysis / creative / technical)
5. **Режим использования**: Рекомендуй режим (always / auto / on_request) с обоснованием
6. **Пример вызова**: Покажи пример входных данных и ожидаемого результата

Формат ответа — структурированный JSON-like описание всех полей инструмента.`
        : `Design a Prompt-based tool "TechSpec Generator".

Purpose: Generate structured technical requirements from a brief feature description.

Requirements:
1. **Name & description**: display_name, name (snake_case), description (under 200 chars)
2. **Prompt template**: Write complete prompt_template with variables \`{{feature_description}}\`, \`{{target_audience}}\`, \`{{priority}}\`
3. **Parameters**: Define JSON schema with types, descriptions, and defaults
4. **Category**: Choose appropriate (planning / analysis / creative / technical)
5. **Usage mode**: Recommend mode (always / auto / on_request) with justification
6. **Example call**: Show sample input and expected output

Format: structured JSON-like description of all tool fields.`,
      baseline_source: { type: 'none' },
    });

    // ── Task 2: HTTP Integration ──
    tasks.push({
      task_type: 'http_integration',
      competency: 'http_integration',
      task_prompt: isRu
        ? `Спроектируй HTTP API инструмент для интеграции с внешним сервисом анализа тональности текста.

API endpoint: POST https://api.sentiment-service.example/v2/analyze
Заголовки: Authorization: Bearer {{api_key}}, Content-Type: application/json
Тело запроса: { "text": "...", "language": "auto", "aspects": ["emotion", "tone", "intent"] }
Ответ: { "sentiment": "positive|negative|neutral", "confidence": 0.95, "aspects": {...} }

Задача:
1. **http_config**: Опиши полную конфигурацию HTTP-инструмента:
   - method, url, headers (с шаблонными переменными)
   - body_template с JSONPath-маппингом параметров
   - response_mapping: как извлечь нужные поля из ответа
2. **Обработка ошибок**: Что делать при 401 (невалидный ключ), 429 (rate limit), 500 (сервер упал)?
3. **Валидация**: Какие проверки входных параметров нужны до отправки запроса?
4. **SSRF-защита**: Какие меры безопасности необходимы для HTTP-инструментов?
5. **Таймауты**: Рекомендуемые значения timeout и retry-стратегия`
        : `Design an HTTP API tool for integration with an external text sentiment analysis service.

API endpoint: POST https://api.sentiment-service.example/v2/analyze
Headers: Authorization: Bearer {{api_key}}, Content-Type: application/json
Request body: { "text": "...", "language": "auto", "aspects": ["emotion", "tone", "intent"] }
Response: { "sentiment": "positive|negative|neutral", "confidence": 0.95, "aspects": {...} }

Task:
1. **http_config**: Describe full HTTP tool configuration:
   - method, url, headers (with template variables)
   - body_template with JSONPath parameter mapping
   - response_mapping: how to extract needed fields from response
2. **Error handling**: What to do on 401 (invalid key), 429 (rate limit), 500 (server down)?
3. **Validation**: What input parameter checks are needed before sending?
4. **SSRF protection**: What security measures are needed for HTTP tools?
5. **Timeouts**: Recommended timeout values and retry strategy`,
      baseline_source: { type: 'none' },
    });

    // ── Task 3: Parameter Schema Design ──
    tasks.push({
      task_type: 'parameter_schema',
      competency: 'parameter_schema',
      task_prompt: isRu
        ? `Спроектируй схему параметров для универсального инструмента "Мультиформатный конвертер данных".

Инструмент принимает данные в одном формате и конвертирует в другой.
Поддерживаемые форматы: JSON, CSV, YAML, XML, Markdown-таблица.

Задача:
1. Определи **все параметры** с полной JSON Schema:
   - input_data (string, обязательный) — исходные данные
   - source_format (enum, обязательный) — формат входа
   - target_format (enum, обязательный) — формат выхода
   - options (object, опциональный) — настройки конвертации:
     - csv_delimiter (string, default: ",")
     - xml_root_element (string, default: "root")
     - pretty_print (boolean, default: true)
     - null_handling (enum: "empty"|"null"|"skip", default: "empty")

2. Добавь **валидацию**:
   - Какие комбинации source/target невалидны? (например, одинаковые)
   - Максимальный размер input_data
   - Валидация формата входных данных (например, JSON должен быть валидным)

3. Опиши **значения по умолчанию** и **примеры** для каждого параметра

4. Предложи **prompt_template**, который использует все эти параметры`
        : `Design a parameter schema for a universal "Multi-Format Data Converter" tool.

The tool accepts data in one format and converts to another.
Supported formats: JSON, CSV, YAML, XML, Markdown table.

Task:
1. Define **all parameters** with full JSON Schema:
   - input_data (string, required) — source data
   - source_format (enum, required) — input format
   - target_format (enum, required) — output format
   - options (object, optional) — conversion settings:
     - csv_delimiter (string, default: ",")
     - xml_root_element (string, default: "root")
     - pretty_print (boolean, default: true)
     - null_handling (enum: "empty"|"null"|"skip", default: "empty")

2. Add **validation**:
   - Which source/target combinations are invalid? (e.g., identical formats)
   - Maximum input_data size
   - Input format validation (e.g., JSON must be valid)

3. Describe **defaults** and **examples** for each parameter

4. Propose a **prompt_template** that uses all these parameters`,
      baseline_source: { type: 'none' },
    });

    // ── Task 4: Error Handling & Diagnostics ──
    tasks.push({
      task_type: 'error_diagnostics',
      competency: 'error_handling',
      task_prompt: isRu
        ? `Продиагностируй и исправь следующий сломанный HTTP-инструмент:

\`\`\`json
{
  "name": "weather_lookup",
  "display_name": "Прогноз погоды",
  "tool_type": "http",
  "http_config": {
    "method": "GET",
    "url": "http://api.weather.local/forecast",
    "headers": { "X-API-Key": "hardcoded-key-12345" },
    "body_template": "{ \"city\": \"{{city}}\" }",
    "response_path": "$.data.forecast"
  },
  "parameters": [
    { "name": "city", "type": "string" }
  ]
}
\`\`\`

Ошибки при вызове:
- Иногда возвращает "SSRF blocked: internal address"
- При городах с пробелами (например, "Нью-Йорк") возвращает 400
- Ключ API виден в логах
- GET-запрос с body не работает в некоторых прокси

Задача:
1. **Найди все ошибки** в конфигурации (минимум 5)
2. **Объясни** почему каждая ошибка проблематична
3. **Предложи исправленную версию** полной конфигурации
4. **Добавь** обработку ошибок и fallback-логику
5. **Укажи** best practices для HTTP-инструментов`
        : `Diagnose and fix the following broken HTTP tool:

\`\`\`json
{
  "name": "weather_lookup",
  "display_name": "Weather Forecast",
  "tool_type": "http",
  "http_config": {
    "method": "GET",
    "url": "http://api.weather.local/forecast",
    "headers": { "X-API-Key": "hardcoded-key-12345" },
    "body_template": "{ \\"city\\": \\"{{city}}\\" }",
    "response_path": "$.data.forecast"
  },
  "parameters": [
    { "name": "city", "type": "string" }
  ]
}
\`\`\`

Errors during invocation:
- Sometimes returns "SSRF blocked: internal address"
- Cities with spaces (e.g., "New York") return 400
- API key visible in logs
- GET request with body doesn't work in some proxies

Task:
1. **Find all errors** in the configuration (at least 5)
2. **Explain** why each error is problematic
3. **Propose a corrected version** of the full configuration
4. **Add** error handling and fallback logic
5. **Specify** best practices for HTTP tools`,
      baseline_source: { type: 'none' },
    });

    // ── Task 5: Cold Start — Full Tool Suite ──
    const dutiesList = duties.length > 0
      ? duties.join(', ')
      : isRu
        ? 'создание инструментов, HTTP-интеграция, параметризация, тестирование, документирование'
        : 'tool creation, HTTP integration, parameterization, testing, documentation';

    tasks.push({
      task_type: 'cold_start_tools',
      competency: 'cold_start',
      task_prompt: isRu
        ? `Спроектируй комплект из 4 взаимосвязанных инструментов для задачи "Автоматический мониторинг конкурентов".

Контекст: Система должна периодически собирать данные о конкурентах, анализировать изменения и генерировать отчёты.

Известные обязанности Инструменталиста: ${dutiesList}
${toolContext ? `\nКонтекст из базы знаний:\n${toolContext}` : ''}

Требования:
1. **Инструмент 1 — Prompt-based "Competitor Analyzer"**: Принимает URL и текст страницы, извлекает ключевую информацию (продукты, цены, фичи)
2. **Инструмент 2 — HTTP "Web Scraper"**: Вызывает Firecrawl API для получения контента страницы по URL
3. **Инструмент 3 — Prompt-based "Change Detector"**: Сравнивает два снимка данных и выделяет значимые изменения
4. **Инструмент 4 — Prompt-based "Report Generator"**: Генерирует еженедельный отчёт из собранных данных

Для каждого инструмента предоставь:
- Полную конфигурацию (name, display_name, description, tool_type, category)
- Параметры с JSON Schema
- Prompt-шаблон или http_config
- Рекомендуемый режим использования (always/auto/on_request)
- Описание взаимосвязей между инструментами (как выход одного становится входом другого)

Дополнительно:
- Предложи порядок вызова инструментов в пайплайне
- Укажи, какие инструменты можно вызывать параллельно
- Опиши стратегию обработки ошибок для всей цепочки`
        : `Design a suite of 4 interconnected tools for "Automated Competitor Monitoring".

Context: The system should periodically collect competitor data, analyze changes, and generate reports.

Known Toolsmith duties: ${dutiesList}
${toolContext ? `\nKnowledge base context:\n${toolContext}` : ''}

Requirements:
1. **Tool 1 — Prompt-based "Competitor Analyzer"**: Takes URL and page text, extracts key info (products, prices, features)
2. **Tool 2 — HTTP "Web Scraper"**: Calls Firecrawl API to get page content by URL
3. **Tool 3 — Prompt-based "Change Detector"**: Compares two data snapshots and highlights significant changes
4. **Tool 4 — Prompt-based "Report Generator"**: Generates weekly report from collected data

For each tool provide:
- Full configuration (name, display_name, description, tool_type, category)
- Parameters with JSON Schema
- Prompt template or http_config
- Recommended usage mode (always/auto/on_request)
- Description of inter-tool relationships (how output of one becomes input of another)

Additionally:
- Propose the invocation order in a pipeline
- Indicate which tools can be called in parallel
- Describe error handling strategy for the entire chain`,
      baseline_source: toolContext ? { type: 'knowledge', query: 'tool design http integration' } : { type: 'none' },
    });

    return tasks;
  },

  getEvaluationHint(competency: string): string {
    const hints: Record<string, string> = {
      tool_design: 'Evaluate: proper naming conventions, complete prompt template with variables, valid parameter schema, appropriate category and mode selection, realistic example. Penalize: missing fields, vague descriptions, no examples.',
      http_integration: 'Evaluate: correct http_config structure, proper header templating, JSONPath mappings, comprehensive error handling (401/429/500), SSRF awareness, timeout strategy. Penalize: missing security measures, no error handling, hardcoded secrets.',
      parameter_schema: 'Evaluate: complete JSON Schema with types/defaults/descriptions, validation rules for invalid combinations, size limits, format validation, working prompt_template using all params. Penalize: missing validations, incomplete schema, no defaults.',
      error_handling: 'Evaluate: found all 5+ errors (SSRF via internal URL, hardcoded key, GET with body, URL encoding, missing description/validation), clear explanations, corrected version addresses all issues, best practices listed. Penalize: missed errors, incomplete fix.',
      cold_start: 'Evaluate: 4 tools with complete configs, valid parameter schemas, proper inter-tool data flow, pipeline ordering, parallelism opportunities identified, error handling strategy for chain. Penalize: missing tools, no relationships, incomplete configs.',
    };
    return hints[competency] || 'Evaluate overall tool design quality, parameter schema correctness, and integration awareness.';
  },
};

export default toolsmithPlugin;
