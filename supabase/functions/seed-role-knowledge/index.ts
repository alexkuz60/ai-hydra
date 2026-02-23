import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// Seed Role Knowledge Edge Function
// Pre-populates role_knowledge with system prompts
// and curated documentation for technical roles
// ============================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Chunk text into overlapping segments
function chunkText(text: string, maxChars = 1500, overlap = 200): string[] {
  if (text.length <= maxChars) return [text];
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    
    // Try to break at paragraph or sentence boundary
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastParagraph = slice.lastIndexOf('\n\n');
      const lastNewline = slice.lastIndexOf('\n');
      const lastPeriod = slice.lastIndexOf('. ');
      
      if (lastParagraph > maxChars * 0.5) {
        end = start + lastParagraph;
      } else if (lastNewline > maxChars * 0.5) {
        end = start + lastNewline;
      } else if (lastPeriod > maxChars * 0.5) {
        end = start + lastPeriod + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    if (start < 0) start = 0;
    if (end >= text.length) break;
  }
  
  return chunks.filter(c => c.length > 50);
}

// Role-specific knowledge content (curated documentation)
const ROLE_KNOWLEDGE: Record<string, Array<{
  source_title: string;
  source_title_en?: string;
  category: string;
  content: string;
  tags: string[];
}>> = {
  archivist: [
    {
      source_title: "Архитектура памяти Hydra",
      source_title_en: "Hydra Memory Architecture",
      category: "documentation",
      tags: ["память", "архитектура", "векторный поиск"],
      content: `# Система памяти AI-Hydra

## Типы памяти
1. **Сессионная память** (session_memory) — контекст текущей сессии, хранит решения, инструкции, резюме. Автоматически привязывается к session_id.
2. **Ролевая память** (role_memory) — долгосрочный опыт роли между сессиями. Типы: experience, preference, skill, mistake, success.
3. **Профильные знания** (role_knowledge) — статическая документация, мануалы, стандарты для конкретных ролей.

## Векторный поиск
Все типы памяти поддерживают семантический поиск через pgvector (text-embedding-3-small, 1536 размерностей). 
RPC-функции: search_session_memory, search_role_memory, search_role_knowledge.

## Инструменты Архивариуса
- **update_session_memory** — сохранение записей (decision, context, instruction, summary)
- **search_session_memory** — семантический поиск по памяти сессии
- **save_role_experience** — сохранение долгосрочного опыта
- **search_role_knowledge** — поиск по профильным знаниям

## Важность записей
Каждая запись имеет importance (1-10) и confidence_score (0.0-1.0). Высокая важность = выше приоритет при RAG-контексте.`,
    },
    {
      source_title: "Библиотека промптов",
      source_title_en: "Prompt Library",
      category: "procedure",
      tags: ["промпты", "библиотека", "управление"],
      content: `# Управление Библиотекой промптов

## Структура промпта в библиотеке
- **name** — уникальное название
- **role** — целевая роль (assistant, critic, arbiter и др.)
- **content** — текст промпта
- **tags** — теги для категоризации
- **is_shared** — публичный доступ
- **is_default** — используется по умолчанию для роли

## Операции
- Промпты доступны через RPC get_prompt_library_safe (безопасный доступ, скрывает user_id)
- Поддерживается embedding-поиск для семантического подбора
- Счётчик usage_count отслеживает частоту использования

## Рекомендации
- Структурируй промпты по секциям: роль, компетенции, методология, ограничения
- Используй теги для быстрого поиска
- Версионируй через разные записи, не перезаписывай`,
    },
  ],
  
  analyst: [
    {
      source_title: "Статистика моделей",
      source_title_en: "Model Statistics",
      category: "documentation",
      tags: ["статистика", "модели", "метрики"],
      content: `# Система статистики моделей

## Таблица model_statistics
Отслеживает использование каждой модели пользователем:
- **response_count** — количество ответов
- **total_brains** — суммарные "мозги" (оценки качества)
- **dismissal_count** — количество отклонений
- **first_used_at / last_used_at** — временные рамки использования

## Метрики для анализа
- **Коэффициент одобрения**: total_brains / response_count
- **Коэффициент отклонения**: dismissal_count / response_count
- **Частота использования**: response_count / period

## Группировка
Статистика привязана к session_id, что позволяет анализировать эффективность моделей в контексте конкретных задач.`,
    },
    {
      source_title: "Поведенческие паттерны",
      source_title_en: "Behavioral Patterns",
      category: "documentation",
      tags: ["паттерны", "поведение", "анализ"],
      content: `# Система поведенческих паттернов

## Компоненты
- **role_behaviors** — настройки коммуникации, взаимодействий, реакций для каждой роли
- **task_blueprints** — стратегические шаблоны для многоэтапных рабочих процессов

## Категории блюпринтов
- planning — планирование проектов
- creative — творческие задачи
- analysis — аналитические процессы
- technical — технические пайплайны

## Аналитические задачи
- Сравнение эффективности паттернов через usage_count
- Анализ корреляции между паттерном и качеством ответов
- Выявление оптимальных комбинаций роль+паттерн`,
    },
  ],
  
  promptengineer: [
    {
      source_title: "Техники промпт-инженерии",
      source_title_en: "Prompt Engineering Techniques",
      category: "standard",
      tags: ["промпт-инженерия", "техники", "оптимизация"],
      content: `# Техники промпт-инженерии в Hydra

## Структура системного промпта
1. **Идентичность** — кто роль, в какой системе работает
2. **Компетенции** — что умеет
3. **Методология** — как выполняет задачи (пошагово)
4. **Взаимодействие** — как работает с другими ролями
5. **Ограничения** — что нельзя делать
6. **Пожелания Супервизора** — секция для динамических указаний

## Техники оптимизации
- **Chain-of-Thought** — разбиение на шаги для сложных задач
- **Few-shot примеры** — образцы ожидаемого результата
- **Role-playing** — погружение в роль для лучшего контекста
- **Constraints** — явные ограничения формата и содержания
- **Self-reflection** — инструкция проверить свой ответ

## Особенности моделей
- OpenAI GPT-5: хорошо работает с длинными структурированными промптами
- Gemini 2.5 Pro: отлично понимает многоязычные промпты
- Claude: чувствителен к формулировкам ограничений
- DeepSeek-R1: reasoning модель, не поддерживает temperature`,
    },
    {
      source_title: "Секции промптов",
      source_title_en: "Prompt Sections",
      category: "procedure",
      tags: ["секции", "парсинг", "структура"],
      content: `# Система секций промптов

## Парсер секций (promptSectionParser)
Промпты в Hydra разбиваются на секции для индивидуального редактирования:
- Парсинг по заголовкам ## 
- Каждая секция имеет название и содержимое
- Поддержка конфликт-резолюции при параллельном редактировании

## Продвинутый редактор
AdvancedPromptEditor позволяет:
- Редактировать секции индивидуально
- Перетаскивать секции для изменения порядка
- Добавлять/удалять секции
- Предпросмотр финального промпта

## Стандарт именования секций
- "Идентичность" — описание роли
- "Компетенции" — навыки
- "Методология работы" — алгоритм
- "Взаимодействие с командой" — интеграция
- "Ограничения" — запреты
- "Пожелания Супервизора" — динамические указания`,
    },
  ],
  
  flowregulator: [
    {
      source_title: "Архитектура Flow Editor",
      source_title_en: "Flow Editor Architecture",
      category: "documentation",
      tags: ["flow", "редактор", "узлы", "архитектура"],
      content: `# Flow Editor — Архитектура

## Типы узлов
| Категория | Узел | Описание |
|-----------|------|----------|
| Input/Output | InputNode | Точка входа данных |
| Input/Output | OutputNode | Точка выхода данных |
| AI | ModelNode | Вызов ИИ-модели |
| AI | PromptNode | Шаблон промпта |
| AI | EmbeddingNode | Генерация эмбеддингов |
| AI | ClassifierNode | Классификация текста |
| Logic | ConditionNode | Условное ветвление |
| Logic | SwitchNode | Множественное ветвление |
| Logic | LoopNode | Цикл обработки |
| Logic | SplitNode | Параллельное разделение |
| Logic | MergeNode | Слияние потоков |
| Data | TransformNode | Трансформация данных |
| Data | FilterNode | Фильтрация данных |
| Data | MemoryNode | Работа с памятью |
| Data | DelayNode | Задержка выполнения |
| Integration | ApiNode | Вызов внешнего API |
| Integration | DatabaseNode | Запросы к БД |
| Integration | StorageNode | Работа с файлами |
| Layout | GroupNode | Группировка узлов |

## Правила соединений (connectionRules)
- Каждый тип узла имеет допустимые входы и выходы
- Валидация типов данных между узлами
- Защита от циклических зависимостей`,
    },
    {
      source_title: "Flow Runtime",
      source_title_en: "Flow Runtime",
      category: "documentation",
      tags: ["runtime", "выполнение", "пайплайн"],
      content: `# Flow Runtime — Движок выполнения

## Архитектура
- **scheduler** — планировщик топологической сортировки узлов
- **executor** — исполнитель с контекстом данных
- **runners** — специализированные обработчики по типам узлов

## Процесс выполнения
1. Загрузка диаграммы из БД (flow_diagrams)
2. Топологическая сортировка узлов
3. Последовательное выполнение с передачей данных
4. Обработка ветвлений (condition, switch)
5. Агрегация результатов (merge)

## Валидация диаграмм (validate_flow_diagram tool)
Три уровня:
- **syntax** — наличие входа/выхода, осиротевшие связи
- **logic** — циклы, недостижимые узлы
- **optimization** — узкие места, длинные цепочки, дублирование

## Edge Function: flow-logistics
Обеспечивает вычисление метрик потока:
- Общая сложность
- Критический путь
- Оценка времени выполнения`,
    },
  ],
  
  toolsmith: [
    {
      source_title: "Система инструментов Hydra",
      source_title_en: "Hydra Tools System",
      category: "documentation",
      tags: ["инструменты", "tools", "интеграции"],
      content: `# Система пользовательских инструментов

## Типы инструментов
1. **Prompt-инструменты** — шаблоны с параметрами {{placeholder}}
   - Используются для обработки текста ИИ-моделью
   - Параметры подставляются перед выполнением
   
2. **HTTP-инструменты** — REST API интеграции
   - Поддержка методов: GET, POST, PUT, DELETE
   - Настраиваемые заголовки и тело запроса
   - JSONPath для извлечения данных из ответа (response_path)

## Безопасность
- SSRF-защита: блокировка localhost, внутренних IP, метаданных облака
- Максимальный размер ответа: 100KB
- Таймаут: 30 секунд
- Безопасный доступ через RPC get_custom_tools_safe (скрывает user_id)

## Режимы использования
- **always** — инструмент вызывается при каждом запросе
- **auto** — ИИ-роль решает, нужен ли инструмент
- **on_request** — только по явной просьбе пользователя

## Встроенные инструменты
- calculator — математические вычисления
- current_datetime — текущая дата/время
- web_search — поиск в интернете (Tavily/Perplexity)
- brief_prompt_engineer — подготовка ТЗ для Промпт-Инженера
- update_session_memory — сохранение в память сессии
- search_session_memory — поиск по памяти сессии
- validate_flow_diagram — валидация flow-диаграмм
- save_role_experience — сохранение опыта роли
- search_role_knowledge — поиск по профильным знаниям`,
    },
  ],
  
  webhunter: [
    {
      source_title: "Провайдеры поиска",
      source_title_en: "Search Providers",
      category: "documentation",
      tags: ["поиск", "tavily", "perplexity", "web"],
      content: `# Провайдеры веб-поиска в Hydra

## Tavily
- Основной провайдер поиска
- Поддерживает basic и advanced глубину
- Фильтрация по доменам (include_domains, exclude_domains)
- Возвращает structured ответ с ранжированными результатами

## Perplexity
- Альтернативный провайдер (требует личный API-ключ)
- Использует модель "sonar" для поиска
- Возвращает синтезированный ответ с citations
- Хорошо подходит для обзорных запросов

## Режим "both"
- Параллельный поиск через оба провайдера
- Объединение результатов для максимального покрытия
- Полезен для верификации информации из разных источников

## Настройки
- Выбор провайдера в PerModelSettings
- Системный ключ Tavily как fallback
- Персональные ключи приоритетнее системных`,
    },
  ],

  // =============================================
  // EXPERT ROLES (6)
  // =============================================

  assistant: [
    {
      source_title: "Мультиагентная дискуссия",
      source_title_en: "Multi-Agent Discussion",
      category: "documentation",
      tags: ["мультиагент", "дискуссия", "пайплайн"],
      content: `# Мультиагентная дискуссия в AI-Hydra

## Роль Эксперта в пайплайне
Эксперт генерирует первичный ответ, который затем проходит через цепочку оценки:
1. Эксперт → генерация ответа
2. Критик → анализ слабых мест
3. Арбитр → синтез финального решения
4. Модератор → обобщение для пользователя

## Режимы работы
- **Основной чат** — прямое общение с пользователем
- **D-Chat (Expert)** — режим консультанта с расширенным контекстом
- **Конкурс** — соревнование моделей, где Эксперт представляет кандидата

## Контекстное обогащение
Перед генерацией ответа Эксперт получает:
- Системный промпт роли
- Пожелания Супервизора (supervisor_wishes)
- Результаты RAG-поиска по сессионной и ролевой памяти
- Активные инструменты (tools) для вызова

## Качество ответов
- Каждый ответ оценивается пользователем (brain/dismiss)
- Статистика сохраняется в model_statistics
- Конкурсные оценки фиксируются через arbiter_score и criteria_scores`,
    },
  ],

  critic: [
    {
      source_title: "Методология критического анализа",
      source_title_en: "Critical Analysis Methodology",
      category: "documentation",
      tags: ["критика", "логика", "когнитивные искажения"],
      content: `# Методология критического анализа

## Фреймворк оценки ответов
Критик анализирует ответ Эксперта по пяти осям:
1. **Фактологическая точность** — проверяемость утверждений
2. **Логическая связность** — отсутствие противоречий
3. **Полнота охвата** — учёт всех аспектов вопроса
4. **Практическая применимость** — реализуемость рекомендаций
5. **Учёт рисков** — обозначены ли потенциальные проблемы

## Типичные когнитивные искажения
- Ошибка выживших — анализ только успешных случаев
- Confirmation bias — подбор аргументов под заранее выбранный вывод
- Эффект якоря — чрезмерная привязка к первому факту
- Ложная дихотомия — представление сложной проблемы как бинарного выбора

## Формат критики
- Начинай с сильных сторон ответа
- Формулируй замечания как вопросы или гипотезы
- Предлагай направления доработки
- Оценивай серьёзность каждого замечания (critical / major / minor)`,
    },
  ],

  arbiter: [
    {
      source_title: "Синтез и оценка в конкурсах",
      source_title_en: "Synthesis and Evaluation in Contests",
      category: "documentation",
      tags: ["синтез", "конкурс", "оценка", "критерии"],
      content: `# Арбитр — Синтез и судейство

## Роль в мультиагентном пайплайне
Арбитр получает ответы Эксперта и замечания Критика, затем:
1. Выделяет точки согласия (фундамент решения)
2. Анализирует расхождения и определяет сильнейшую позицию
3. Интегрирует лучшие идеи в финальный ответ
4. Обосновывает принятые и отклонённые предложения

## Судейство в Конкурсах Красоты
Арбитр оценивает ответы моделей по заданным критериям:
- Каждый критерий оценивается по шкале 1-10
- Финальная оценка — взвешенная сумма
- Комментарий арбитра содержит обоснование оценки
- Результаты сохраняются в contest_results (arbiter_score, criteria_scores)

## Стандартные критерии оценки
- factuality, relevance, completeness, clarity, creativity
- synthesis_quality, fairness, decision_justification
- scoring_consistency, criteria_coverage

## Edge-функция contest-arbiter
- Получает ответы участников и критерии
- Генерирует оценки через AI-модель (ТехноАрбитр)
- Поддерживает auto-discrepancy для выявления расхождений`,
    },
  ],

  consultant: [
    {
      source_title: "D-Chat и режимы консультирования",
      source_title_en: "D-Chat and Consultation Modes",
      category: "documentation",
      tags: ["d-chat", "консультант", "режимы"],
      content: `# Консультант — D-Chat и веб-поиск

## D-Chat (Двойной чат)
Консультант работает в правой панели (ConsultantPanel):
- Изолированная боковая панель с собственным контекстом
- Режим web_search — поиск информации в интернете
- Поддержка streaming-ответов через SSE

## Режимы консультирования
| Режим | Роль | Описание |
|-------|------|----------|
| web_search | webhunter | Поиск информации в интернете |
| expert | assistant | Дополнительное экспертное мнение |
| critic | critic | Критический анализ |
| arbiter | arbiter | Синтез решения |
| moderator | moderator | Модерация и обобщение |
| promptengineer | promptengineer | Оптимизация промптов |
| duel | arbiter | Сравнение двух моделей |

## Интеграция с основным чатом
- Ответы консультанта можно скопировать в основной чат
- Поддерживается follow-up диалог
- Каждый режим использует свой системный промпт и RAG-контекст`,
    },
  ],

  moderator: [
    {
      source_title: "Модерация и обобщение",
      source_title_en: "Moderation and Summarization",
      category: "documentation",
      tags: ["модерация", "обобщение", "сессия"],
      content: `# Модератор — Управление дискуссией

## Роль в мультиагентном пайплайне
Модератор — финальный этап обработки: получает ответ Арбитра и формирует краткое, структурированное резюме для пользователя.

## Ключевые задачи
1. **Обобщение** — выделение ключевых тезисов из дискуссии
2. **Структурирование** — организация информации в удобном формате
3. **Фильтрация** — удаление шума и повторов
4. **Адаптация** — формулировка ответа под уровень пользователя

## Критерии качества обобщения
- summary_accuracy — точность передачи сути
- balance — равномерное представление всех точек зрения
- structure_quality — логичная структура
- consensus_identification — чёткое выделение согласия/расхождений
- noise_reduction — минимизация избыточной информации

## Взаимодействие с пользователем
- Модератор фокусируется на практическом результате
- Предпочитает списки, таблицы, пошаговые инструкции
- Указывает степень консенсуса команды`,
    },
  ],

  advisor: [
    {
      source_title: "Стратегическое консультирование",
      source_title_en: "Strategic Consulting",
      category: "documentation",
      tags: ["стратегия", "планирование", "риски"],
      content: `# Советник — Стратегический консультант

## Экспертные компетенции
Советник специализируется на:
- Анализ практической реализуемости решений
- Оценка рисков и разработка планов митигации
- Планирование временных рамок и ресурсов
- Выбор между альтернативными стратегиями

## Критерии оценки советов
- practicality — реализуемость рекомендации
- actionability — конкретность шагов
- risk_awareness — учёт рисков
- timeline_clarity — ясность временных рамок
- resource_feasibility — реалистичность ресурсных требований

## Методология работы
1. Определи контекст и ограничения задачи
2. Выдели 2-3 альтернативных стратегии
3. Для каждой: оцени плюсы, минусы, риски
4. Рекомендуй оптимальный вариант с обоснованием
5. Предложи план реализации (этапы, сроки, ресурсы)

## Инструменты Советника
- SWOT-анализ для стратегических решений
- Матрица рисков (вероятность × ущерб)
- Roadmap для проектного планирования`,
    },
  ],

  // =============================================
  // OTK ROLES (3)
  // =============================================

  technocritic: [
    {
      source_title: "Техно-Критик: методология аудита",
      source_title_en: "Techno-Critic: Audit Methodology",
      category: "documentation",
      tags: ["ОТК", "аудит", "тестирование", "качество"],
      content: `# Техно-Критик — Автоматический аудитор качества

## Роль в системе ОТК
Техно-Критик — системная роль отдела Техноконтроля. Автоматически активируется для:
- Тестирования кандидатов на собеседованиях
- Аудита качества ответов в конкурсах
- Проверки факт-чекинга при аттестации

## Методология тестирования
Используемые критерии: argument_strength, logic_coherence, evidence_quality, bias_detection, counter_example_coverage.

## Отличие от экспертного Критика
- Техно-Критик работает автоматически (isSystemOnly)
- Не выбирается пользователем напрямую
- Фокус на объективном, алгоритмическом анализе
- Результаты используются для принятия решений о найме

## Интеграция с пайплайном собеседований
Edge-функция interview-test-runner использует Техно-Критика для:
1. Генерации тестовых вопросов по роли
2. Оценки ответов кандидата
3. Формирования объективной оценки по критериям`,
    },
  ],

  technoarbiter: [
    {
      source_title: "Техно-Арбитр: судейство и оценка",
      source_title_en: "Techno-Arbiter: Judging and Evaluation",
      category: "documentation",
      tags: ["ОТК", "судейство", "конкурс", "оценка"],
      content: `# Техно-Арбитр — Главный судья платформы

## Роль в системе ОТК
Техно-Арбитр — системная роль, автоматически назначаемая судьёй:
- В Конкурсах Красоты (contest-arbiter)
- В Дуэлях моделей
- При аттестации и переаттестации персонала

## Цепочка приоритетов судьи
1. Нанятая через собеседование модель ОТК
2. Модель по умолчанию для роли
3. Системный fallback (Gemini 2.5 Flash)

## Критерии судейства
- synthesis_quality — качество синтеза
- fairness — беспристрастность
- decision_justification — обоснованность решений
- scoring_consistency — последовательность оценок
- criteria_coverage — полнота охвата критериев

## Механизм расхождений (Discrepancy)
Edge-функция contest-discrepancy-trigger проверяет:
- Расхождение между оценкой арбитра и пользователя > 3 баллов
- Автоматический перезапуск оценки с альтернативной моделью
- Финальная оценка — медиана из всех попыток`,
    },
  ],

  technomoderator: [
    {
      source_title: "Техно-Модератор: управление качеством",
      source_title_en: "Techno-Moderator: Quality Management",
      category: "documentation",
      tags: ["ОТК", "модерация", "отчётность"],
      content: `# Техно-Модератор — Контроль качества дискуссий

## Роль в системе ОТК
Техно-Модератор — системная роль для автоматической модерации:
- Обобщение длинных дискуссий
- Выявление консенсуса и точек расхождения
- Подготовка резюме для принятия решений

## Критерии качества
- summary_accuracy — точность обобщения
- balance — сбалансированность представления
- structure_quality — качество структуры
- consensus_identification — выявление консенсуса
- noise_reduction — фильтрация шума

## Интеграция с аттестацией
При переаттестации (RecertificationPanel) Техно-Модератор:
1. Обобщает результаты тестирования
2. Формирует дельта-брифинг (только изменения в знаниях)
3. Готовит отчёт для принятия решения о продлении назначения

## Автоматический режим
- Работает без участия пользователя (isSystemOnly)
- Активируется при завершении циклов оценки
- Результаты доступны в панели собеседований`,
    },
  ],

  // =============================================
  // SYSTEM ROLES (3)
  // =============================================

  evolutioner: [
    {
      source_title: "Эволюционер: само-совершенствование",
      source_title_en: "Evolutioner: Self-Improvement",
      category: "documentation",
      tags: ["эволюция", "оптимизация", "метрики"],
      content: `# Эволюционер — Движок само-совершенствования

## Назначение
Эволюционер автоматически оптимизирует промпты и процессы системы:
- Анализ метрик качества ответов
- Генерация гипотез улучшения
- Автоматическое внедрение одобренных изменений
- Документирование каждого цикла в Хрониках

## Edge-функция evolution-trigger
Режимы работы:
- **single** — обработка одного отклонённого цикла (ревизия)
- **autorun** — пакетная обработка отклонённых записей

## Метрики оптимизации
- token_reduction — сокращение расхода токенов
- semantic_coverage — сохранение семантического покрытия
- response_time_improvement — ускорение ответов
- cost_reduction — снижение стоимости
- quality_preservation — сохранение качества

## Жизненный цикл эволюционного цикла
1. Гипотеза (hypothesis) → 2. Тестирование → 3. Оценка метрик (before/after)
4. Решение Супервизора (approve/reject) → 5. Фиксация в Хрониках
При отклонении: Эволюционер может предложить ревизию (ai_revision)`,
    },
  ],

  chronicler: [
    {
      source_title: "Хроникёр: документирование эволюции",
      source_title_en: "Chronicler: Evolution Documentation",
      category: "documentation",
      tags: ["хроники", "документирование", "история"],
      content: `# Хроникёр — Летописец системы

## Назначение
Хроникёр автоматически документирует все значимые изменения системы:
- Создание записей в таблице chronicles
- Привязка метрик «до/после» (metrics_before, metrics_after)
- Уведомление Супервизора через supervisor_notifications

## Структура записи Хроники
| Поле | Описание |
|------|----------|
| entry_code | Уникальный код изменения |
| title / title_en | Заголовок (RU/EN) |
| hypothesis / hypothesis_en | Гипотеза улучшения |
| role_object | Роль-объект изменения |
| initiator | Инициатор (обычно Evolutioner) |
| status | Статус цикла |
| supervisor_resolution | Решение Супервизора (pending/approved/rejected) |
| ai_revision | Пересмотр ИИ при отклонении |

## Отчёт CHRONICLES.md
Генерация Markdown-отчёта с человекочитаемыми заголовками из глоссария. Включает фильтры по статусу и датам.

## Интеграция
- Записи видны всем аутентифицированным пользователям
- CRUD доступен только Супервизорам/Админам
- Уведомления создаются автоматически при новых записях`,
    },
  ],

  translator: [
    {
      source_title: "Переводчик: локализация контента",
      source_title_en: "Translator: Content Localization",
      category: "documentation",
      tags: ["перевод", "локализация", "мультиязычность"],
      content: `# Переводчик — Мультиязычная поддержка

## Назначение
Переводчик обеспечивает перевод контента между русским и английским языками:
- Перевод сообщений чата (translate-messages)
- Пакетный перевод (translate-batch)
- Перевод текста по запросу (translate-text)

## Edge-функции перевода
- **translate-text** — перевод одного текста
- **translate-messages** — перевод массива сообщений
- **translate-batch** — пакетный перевод с кэшированием

## Критерии качества перевода
- translation_accuracy — точность передачи смысла
- terminology_consistency — единообразие терминологии
- semantic_preservation — сохранение семантики
- tone_fidelity — сохранение тона
- cosine_drift — минимальный дрейфт эмбеддингов

## Кэширование
Система использует translationCache для:
- Предотвращения повторных переводов
- Снижения расхода API-вызовов
- Ускорения отображения UI
- Ключ кэша: хеш исходного текста + направление перевода`,
    },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Auth user
    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const { role, include_system_prompt = true, force = false } = await req.json();
    
    if (!role) {
      return new Response(
        JSON.stringify({ error: "role is required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check existing knowledge count (skip if already seeded, unless force)
    if (!force) {
      const { count } = await supabase
        .from('role_knowledge')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', role)
        .eq('category', 'documentation');
      
      if (count && count > 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            skipped: true, 
            message: `Role "${role}" already has ${count} documentation entries. Use force=true to re-seed.`,
            existing_count: count,
          }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
    }

    // If force, delete existing seeded entries
    if (force) {
      const { error: deleteError } = await supabase
        .from('role_knowledge')
        .delete()
        .eq('user_id', user.id)
        .eq('role', role)
        .in('category', ['documentation', 'standard', 'procedure', 'system_prompt']);
      
      if (deleteError) {
        console.error('[seed] Delete error:', deleteError);
      }
    }

    const entries: Array<{
      user_id: string;
      role: string;
      content: string;
      source_title: string;
      source_title_en: string | null;
      category: string;
      chunk_index: number;
      chunk_total: number;
      tags: string[];
      metadata: Record<string, unknown>;
    }> = [];

    // 1. Seed system prompt as knowledge
    if (include_system_prompt) {
      const systemPromptContent = `Системный промпт роли "${role}" — это основная инструкция, определяющая поведение, компетенции и ограничения данной роли в системе AI-Hydra.`;
      
      entries.push({
        user_id: user.id,
        role,
        content: systemPromptContent,
        source_title: "Системный промпт роли",
        source_title_en: "Role System Prompt",
        category: "system_prompt",
        chunk_index: 0,
        chunk_total: 1,
        tags: ["системный промпт", "идентичность", role],
        metadata: { seeded: true, source: "system" },
      });
    }

    // 2. Seed role-specific knowledge
    const roleKnowledge = ROLE_KNOWLEDGE[role];
    if (roleKnowledge) {
      for (const item of roleKnowledge) {
        const chunks = chunkText(item.content);
        for (let i = 0; i < chunks.length; i++) {
          entries.push({
            user_id: user.id,
            role,
            content: chunks[i],
            source_title: item.source_title,
            source_title_en: item.source_title_en || null,
            category: item.category,
            chunk_index: i,
            chunk_total: chunks.length,
            tags: item.tags,
            metadata: { seeded: true, source: "hydrapedia" },
          });
        }
      }
    }

    if (entries.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          seeded: 0, 
          message: `No knowledge sources found for role "${role}"` 
        }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Generate embeddings for all entries
    let embeddingsGenerated = 0;
    const texts = entries.map(e => e.content);
    
    try {
      // Batch embedding generation (max 20 per call)
      for (let i = 0; i < texts.length; i += 20) {
        const batch = texts.slice(i, i + 20);
        const embResp = await fetch(`${supabaseUrl}/functions/v1/generate-embeddings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ texts: batch }),
        });
        
        if (embResp.ok) {
          const embData = await embResp.json();
          if (!embData.skipped && embData.embeddings) {
            for (let j = 0; j < embData.embeddings.length; j++) {
              if (embData.embeddings[j]) {
                (entries[i + j] as Record<string, unknown>).embedding = 
                  `[${embData.embeddings[j].join(',')}]`;
                embeddingsGenerated++;
              }
            }
          }
        }
      }
    } catch (embError) {
      console.warn('[seed] Embedding generation failed:', embError);
    }

    // Insert all entries
    const { error: insertError } = await supabase
      .from('role_knowledge')
      .insert(entries);
    
    if (insertError) {
      console.error('[seed] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: `Insert failed: ${insertError.message}` }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    console.log(`[seed] Seeded ${entries.length} entries for role "${role}", embeddings: ${embeddingsGenerated}`);

    return new Response(
      JSON.stringify({
        success: true,
        role,
        seeded: entries.length,
        embeddings_generated: embeddingsGenerated,
        sources: [...new Set(entries.map(e => e.source_title))],
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[seed] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
