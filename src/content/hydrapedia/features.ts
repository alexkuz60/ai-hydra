import type { HydrapediaSection } from './types';

export const featuresSections: HydrapediaSection[] = [
  {
    id: 'model-ratings',
    titleKey: 'hydrapedia.sections.modelRatings',
    icon: 'BarChart3',
    content: {
      ru: `# Подиум ИИ-моделей

Подиум моделей — система рейтинга, портфолио и статистики использования ИИ-моделей. Интерфейс построен по принципу мастер-деталь с ResizablePanel и поддерживает режимы навигатора Min/Max.

## Три раздела

### Портфолио ИИ-моделей

Список всех доступных моделей с индикацией провайдеров (OpenAI, Anthropic, Google, DeepSeek и др.).

> [!TIP] Индикатор доступности
> Модели и провайдеры помечаются зелёной галочкой/точкой при наличии настроенного API-ключа (BYOK) или прав администратора. При отсутствии ключа элементы приглушаются (opacity-50).

### Конкурс интеллект-красоты

Модуль для сравнительного тестирования моделей (в разработке).

### Рейтинги ИИ-моделей

Статистика и аналитика использования моделей с визуализациями.

## Метрики

- **Количество ответов** — сколько раз модель была использована
- **Полученные 🧠** — оценки «мозгов» (лайки от пользователя)
- **Отклонения** — сколько раз ответ был отклонён
- **Средний рейтинг** — соотношение лайков к общему числу ответов

## Визуализация

- **Bar/Pie графики** для топ-10 моделей
- Фильтрация по периодам (неделя, месяц, всё время)
- Высококонтрастная палетра, адаптированная к тёмной теме
- Данные объединяют оценки пользователей и автоматические оценки Арбитра

## Как оценивать

После получения ответа от модели вы можете:
- 🧠 **Поставить мозг** — отметить качественный ответ
- 👎 **Отклонить** — отметить неудачный ответ

Эти оценки накапливаются и формируют персональный рейтинг моделей.`,
      en: `# AI Model Podium

The Model Podium — a rating, portfolio, and usage statistics system for AI models. The interface follows the master-detail pattern with ResizablePanel and supports Min/Max navigator modes.

## Three Sections

### AI Model Portfolio

A list of all available models with provider indicators (OpenAI, Anthropic, Google, DeepSeek, etc.).

> [!TIP] Availability Indicator
> Models and providers are marked with a green checkmark/dot when a configured API key (BYOK) or admin rights are present. Without a key, elements are dimmed (opacity-50).

### Intelligence Beauty Contest

A module for comparative model testing (in development).

### AI Model Ratings

Usage statistics and analytics with visualizations.

## Metrics

- **Response count** — how many times the model was used
- **Received 🧠** — "brain" ratings (user likes)
- **Dismissals** — how many times a response was dismissed
- **Average rating** — ratio of likes to total responses

## Visualization

- **Bar/Pie charts** for top-10 models
- Filtering by period (week, month, all time)
- High-contrast palette adapted for dark theme
- Data combines user ratings and automatic Arbiter evaluations

## How to Rate

After receiving a response from a model you can:
- 🧠 **Give a brain** — mark a quality response
- 👎 **Dismiss** — mark an unsuccessful response

These ratings accumulate and form a personal model ranking.`,
    },
  },
  {
    id: 'tasks',
    titleKey: 'hydrapedia.sections.tasks',
    icon: 'Star',
    content: {
      ru: `# Задачи

Модуль управления задачами для организации работы с ИИ.

## Возможности

- Создание задач с описанием
- Привязка к сессиям чата
- Статусы: новая, в работе, выполнена
- Отображение текущей задачи в хедере (TaskIndicator)

## TaskIndicator

В глобальном хедере отображается индикатор текущей задачи — название и ссылка на страницу задач. Это позволяет всегда видеть, над чем вы работаете, независимо от текущего раздела.`,
      en: `# Tasks

Task management module for organizing work with AI.

## Features

- Create tasks with descriptions
- Link to chat sessions
- Statuses: new, in progress, completed
- Current task display in header (TaskIndicator)

## TaskIndicator

The global header displays a current task indicator — title and link to the tasks page. This lets you always see what you're working on, regardless of the current section.`,
    },
  },
  {
    id: 'roles-catalog',
    titleKey: 'hydrapedia.sections.rolesCatalog',
    icon: 'Users',
    content: {
      ru: `# Каталог ролей

AI-Hydra включает 12 специализированных ИИ-ролей, разделённых на две группы.

## Экспертные роли (6)

| Роль | Иконка | Специализация |
|------|--------|---------------|
| Эксперт | \`Brain\` | Универсальный анализ и генерация решений |
| Критик | \`Shield\` | Поиск слабых мест, контраргументация |
| Арбитр | \`Scale\` | Синтез позиций, взвешенная оценка |
| Консультант | \`Lightbulb\` | Креативные подходы, альтернативы |
| Модератор | \`Gavel\` | Структурирование дискуссии |
| Советник | \`HandHelping\` | Практические рекомендации |

## Технический персонал (6)

| Роль | Иконка | Специализация |
|------|--------|---------------|
| Архивариус | \`Archive\` | Управление памятью, сохранение контекста |
| Аналитик | \`LineChart\` | Анализ данных и метрик |
| Веб-хантер | \`Globe\` | Поиск информации в интернете |
| Промпт-Инженер | \`Wand2\` | Оптимизация системных промптов |
| Логистик | \`Route\` | Проверка и настройка потоков |
| Инструменталист | \`Wrench\` | Создание и тестирование инструментов |

## Ролевая память

Технические роли накапливают **долгосрочный опыт** между сессиями — предпочтения пользователя, успешные стратегии, типичные ошибки. Подробнее в разделе «Ролевая память».

## Управление в Штате

Модуль «Штат» позволяет:
- Просматривать все роли в таблице с группировкой
- Настраивать системные промпты
- Управлять профильными знаниями (RAG)
- Просматривать ролевую память
- Настраивать иерархию ролей

## Табель о рангах

Иерархия ролей определяет приоритет и порядок взаимодействия между экспертами. Настраивается через табы взаимодействий в модуле «Штат».

> [!WARNING] Автоматическая валидация конфликтов
> Система автоматически обнаруживает противоречия в иерархии (циклические зависимости, конфликтующие приоритеты) и предупреждает администратора перед сохранением.

\`\`\`
:::playground:::
\`\`\``,
      en: `# Roles Catalog

AI-Hydra includes 12 specialized AI roles divided into two groups.

## Expert Roles (6)

| Role | Icon | Specialization |
|------|------|----------------|
| Expert | \`Brain\` | Universal analysis and solution generation |
| Critic | \`Shield\` | Finding weaknesses, counter-argumentation |
| Arbiter | \`Scale\` | Position synthesis, balanced evaluation |
| Consultant | \`Lightbulb\` | Creative approaches, alternatives |
| Moderator | \`Gavel\` | Discussion structuring |
| Advisor | \`HandHelping\` | Practical recommendations |

## Technical Staff (6)

| Role | Icon | Specialization |
|------|------|----------------|
| Archivist | \`Archive\` | Memory management, context preservation |
| Analyst | \`LineChart\` | Data and metrics analysis |
| Web Hunter | \`Globe\` | Internet information search |
| Prompt Engineer | \`Wand2\` | System prompt optimization |
| Flow Regulator | \`Route\` | Flow checking and configuration |
| Toolsmith | \`Wrench\` | Tool creation and testing |

## Role Memory

Technical roles accumulate **long-term experience** between sessions — user preferences, successful strategies, common mistakes. See "Role Memory" section for details.

## Management in Staff

The "Staff" module allows:
- Viewing all roles in a grouped table
- Configuring system prompts
- Managing domain knowledge (RAG)
- Viewing role memory
- Configuring role hierarchy

## Rank Table

Role hierarchy determines priority and interaction order between experts. Configured via interaction tabs in the "Staff" module.

> [!WARNING] Automatic Conflict Validation
> The system automatically detects hierarchy contradictions (circular dependencies, conflicting priorities) and warns the administrator before saving.

\`\`\`
:::playground:::
\`\`\``,
    },
  },
  {
    id: 'session-memory',
    titleKey: 'hydrapedia.sections.sessionMemory',
    icon: 'BrainCircuit',
    content: {
      ru: `# Память сессии

Память сессии сохраняет ключевые моменты диалога для контекстного обогащения будущих запросов.

## Как это работает

1. В процессе диалога система извлекает важные фрагменты
2. Фрагменты разбиваются на чанки и сохраняются с эмбеддингами
3. При новом запросе — семантический поиск по сохранённым фрагментам
4. Наиболее релевантные фрагменты внедряются в контекст модели

## Типы чанков

- **Факт** — конкретная информация из диалога
- **Решение** — принятое решение или договорённость
- **Задача** — поставленная задача
- **Инсайт** — важное наблюдение

## Управление

В хедере приложения расположен индикатор **MemoryControls**:
- 🧠 **Badge** — количество фрагментов памяти сессии
- 📖 **Knowledge badge** — общее количество чанков профильных знаний с детальным тултипом по ролям
- 🔄 **Обновить** — ручное обновление памяти
- ⚙️ **Настройки** — быстрый переход к настройкам памяти

## SessionMemoryDialog

Диалог управления памятью позволяет:
- Просматривать все сохранённые фрагменты
- Удалять неактуальные
- Фильтровать по типу чанка + специальный фильтр «Дубликаты»

### Обнаружение дубликатов

Система автоматически выявляет дублирующиеся фрагменты через нормализацию текста. При активации фильтра «Дубликаты» появляется кнопка массового удаления.

> [!TIP] Логика удаления дубликатов
> При массовом удалении сохраняется самый старый фрагмент в группе (по \`created_at\`), а остальные копии удаляются.

> [!CAUTION] Двухэтапное подтверждение
> Кнопки «Очистить всё» и «Удалить дубликаты» требуют повторного нажатия для подтверждения. Кнопка «Отмена» позволяет сбросить состояние подтверждения.

### Семантический поиск

Поиск фрагментов памяти осуществляется через векторные эмбеддинги — введённый запрос сравнивается с сохранёнными фрагментами по косинусному сходству.`,
      en: `# Session Memory

Session memory preserves key moments of dialogue for contextual enrichment of future queries.

## How It Works

1. During conversation, the system extracts important fragments
2. Fragments are split into chunks and saved with embeddings
3. For new queries — semantic search across saved fragments
4. Most relevant fragments are injected into model context

## Chunk Types

- **Fact** — specific information from dialogue
- **Decision** — a decision or agreement made
- **Task** — an assigned task
- **Insight** — an important observation

## Management

The application header contains the **MemoryControls** indicator:
- 🧠 **Badge** — session memory fragment count
- 📖 **Knowledge badge** — total domain knowledge chunk count with detailed per-role tooltip
- 🔄 **Refresh** — manual memory update
- ⚙️ **Settings** — quick link to memory settings

## SessionMemoryDialog

The memory management dialog allows:
- Viewing all saved fragments
- Deleting outdated ones
- Filtering by chunk type + special "Duplicates" filter

### Duplicate Detection

The system automatically identifies duplicate fragments via text normalization. When the "Duplicates" filter is active, a mass deletion button appears.

> [!TIP] Duplicate Deletion Logic
> During mass deletion, the oldest fragment in each group (by \`created_at\`) is preserved, and remaining copies are removed.

> [!CAUTION] Two-Step Confirmation
> "Clear All" and "Delete Duplicates" buttons require a second press to confirm. A "Cancel" button allows resetting the confirmation state.

### Semantic Search

Memory fragment search is performed via vector embeddings — the entered query is compared against saved fragments by cosine similarity.`,
    },
  },
  {
    id: 'web-search',
    titleKey: 'hydrapedia.sections.webSearch',
    icon: 'Star',
    content: {
      ru: `# Веб-поиск

Интегрированный веб-поиск позволяет ИИ-ролям находить актуальную информацию в интернете.

## Провайдеры поиска

| Провайдер | Особенности |
|-----------|-------------|
| **Tavily** | По умолчанию (1000 запросов/мес системный лимит) |
| **Perplexity** | Sonar API — глубокий поиск с суммаризацией |
| **Brave Search** | Только BYOK (региональные ограничения) |

## Режимы

- **Одиночный** — поиск через один провайдер
- **Оба** — параллельный поиск через два провайдера с объединением результатов

## BYOK (Bring Your Own Key)

Персональные API-ключи имеют **приоритет** над системными:
1. Перейдите в **Профиль → API-ключи → Веб-поиск**
2. Добавьте ключ нужного провайдера
3. Система автоматически переключится на ваш ключ

> ⚠️ Если персональный ключ не настроен — используется системный Tavily (с общим лимитом).

## Настройка провайдера

В настройках каждой модели можно выбрать:
- Провайдер поиска (Tavily / Perplexity / Brave / Оба)
- Включить/выключить веб-поиск для конкретной роли

## Роль Веб-хантер

\`@webhunter\` — специализированная роль для поиска информации в интернете. Автоматически использует инструмент \`web_search\` и оптимизирует запросы для получения максимально релевантных результатов.`,
      en: `# Web Search

Integrated web search allows AI roles to find current information on the internet.

## Search Providers

| Provider | Features |
|----------|----------|
| **Tavily** | Default (1000 requests/month system limit) |
| **Perplexity** | Sonar API — deep search with summarization |
| **Brave Search** | BYOK only (regional restrictions) |

## Modes

- **Single** — search via one provider
- **Both** — parallel search via two providers with merged results

## BYOK (Bring Your Own Key)

Personal API keys take **priority** over system keys:
1. Go to **Profile → API Keys → Web Search**
2. Add the desired provider's key
3. The system will automatically switch to your key

> ⚠️ If no personal key is configured, the system Tavily key is used (with shared limits).

## Provider Settings

In each model's settings you can choose:
- Search provider (Tavily / Perplexity / Brave / Both)
- Enable/disable web search for a specific role

## Web Hunter Role

\`@webhunter\` — a specialized role for internet information search. Automatically uses the \`web_search\` tool and optimizes queries for maximum relevance.`,
    },
  },
  {
    id: 'roleMemory',
    titleKey: 'hydrapedia.sections.roleMemory',
    icon: 'BrainCircuit',
    content: {
      ru: `# Ролевая память

Ролевая память — механизм накопления долгосрочного опыта техническими ролями между сессиями. В отличие от сессионной памяти, ролевая память сохраняется навсегда и привязана к конкретной роли.

## Что сохраняется

| Тип | Пример |
|-----|--------|
| Предпочтения | «Пользователь предпочитает TypeScript» |
| Навыки | «Хорошо работает запрос через few-shot prompting» |
| Ошибки | «Модель X плохо справляется с задачами типа Y» |
| Успехи | «Стратегия Z дала наилучший результат» |

## Семантический поиск

Для поиска релевантного опыта используются **векторные эмбеддинги** (модель \`text-embedding-3-small\`):

1. При получении нового запроса система генерирует эмбеддинг
2. Производится поиск похожих воспоминаний по косинусному сходству
3. Наиболее релевантные воспоминания (сходство > 0.3) внедряются в контекст

## Отличия от сессионной памяти

| Параметр | Сессионная память | Ролевая память |
|----------|-------------------|----------------|
| Привязка | К сессии | К роли |
| Время жизни | На время сессии | Навсегда |
| Объём | Десятки фрагментов | Сотни |
| Обновление | Автоматическое | Через техника или вручную |

## Где посмотреть

- **Штат → выберите роль → вкладка «Память»** — просмотр и управление воспоминаниями
- **MemoryControls** в хедере — общая статистика`,
      en: `# Role Memory

Role Memory — a mechanism for accumulating long-term experience by technical roles between sessions. Unlike session memory, role memory is persisted permanently and bound to a specific role.

## What Gets Saved

| Type | Example |
|------|---------|
| Preferences | "User prefers TypeScript" |
| Skills | "Few-shot prompting works well for this query" |
| Mistakes | "Model X performs poorly on tasks of type Y" |
| Successes | "Strategy Z produced the best result" |

## Semantic Search

**Vector embeddings** (model \`text-embedding-3-small\`) are used to find relevant experience:

1. When a new query arrives, the system generates an embedding
2. Similar memories are searched by cosine similarity
3. Most relevant memories (similarity > 0.3) are injected into context

## Differences from Session Memory

| Parameter | Session Memory | Role Memory |
|-----------|---------------|-------------|
| Binding | To session | To role |
| Lifetime | Session duration | Permanent |
| Volume | Tens of fragments | Hundreds |
| Update | Automatic | Via technician or manually |

## Where to View

- **Staff → select role → "Memory" tab** — view and manage memories
- **MemoryControls** in header — overall statistics`,
    },
  },
];
