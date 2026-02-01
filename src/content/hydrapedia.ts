export interface HydrapediaSection {
  id: string;
  titleKey: string;
  icon: string;
  content: {
    ru: string;
    en: string;
  };
}

export const hydrapediaSections: HydrapediaSection[] = [
  {
    id: 'intro',
    titleKey: 'hydrapedia.sections.intro',
    icon: 'Lightbulb',
    content: {
      ru: `# Что такое AI-Hydra?

**AI-Hydra** — это мультиагентная платформа для работы с несколькими языковыми моделями одновременно. Название отсылает к мифической Гидре: каждая «голова» — это отдельная AI-модель, а вместе они образуют мощный ансамбль для решения сложных задач.

## Ключевые концепции

### Мультиагентность
Вместо работы с одной моделью вы можете задействовать несколько «голов» параллельно. Каждая модель даёт свой ответ, что позволяет получить разные точки зрения на одну задачу.

### Синергия моделей
Разные модели имеют разные сильные стороны:
- **GPT-4** отлично справляется с рассуждениями и творческими задачами
- **Claude** хорош в анализе документов и следовании инструкциям
- **Gemini** силён в мультимодальных задачах и работе с большим контекстом

### Ролевая специализация
Каждому ответу модели может быть назначена роль:
- 🟢 **Эксперт** (Assistant) — основной ответ
- 🔴 **Критик** (Critic) — критический анализ
- 🟡 **Арбитр** (Arbiter) — финальный синтез
- 🟠 **Консультант** (Consultant) — дополнительная экспертиза

## Архитектура платформы

\`\`\`mermaid
graph TD
    U[Пользователь] --> P[Панель экспертов]
    P --> M1[Модель 1]
    P --> M2[Модель 2]
    P --> M3[Модель N]
    M1 --> A[Арбитр]
    M2 --> A
    M3 --> A
    A --> R[Финальный ответ]
\`\`\`

Платформа отправляет ваш запрос выбранным моделям, собирает их ответы и может синтезировать финальный результат через «Арбитра».`,

      en: `# What is AI-Hydra?

**AI-Hydra** is a multi-agent platform for working with multiple language models simultaneously. The name references the mythical Hydra: each "head" is a separate AI model, and together they form a powerful ensemble for solving complex tasks.

## Key Concepts

### Multi-Agency
Instead of working with a single model, you can engage multiple "heads" in parallel. Each model provides its own response, allowing you to get different perspectives on the same task.

### Model Synergy
Different models have different strengths:
- **GPT-4** excels at reasoning and creative tasks
- **Claude** is great at document analysis and following instructions
- **Gemini** is strong in multimodal tasks and working with large context

### Role Specialization
Each model response can be assigned a role:
- 🟢 **Expert** (Assistant) — primary response
- 🔴 **Critic** — critical analysis
- 🟡 **Arbiter** — final synthesis
- 🟠 **Consultant** — additional expertise

## Platform Architecture

\`\`\`mermaid
graph TD
    U[User] --> P[Expert Panel]
    P --> M1[Model 1]
    P --> M2[Model 2]
    P --> M3[Model N]
    M1 --> A[Arbiter]
    M2 --> A
    M3 --> A
    A --> R[Final Response]
\`\`\`

The platform sends your request to selected models, collects their responses, and can synthesize the final result through the "Arbiter".`
    }
  },
  {
    id: 'getting-started',
    titleKey: 'hydrapedia.sections.gettingStarted',
    icon: 'Rocket',
    content: {
      ru: `# Начало работы

## Регистрация и вход

1. Нажмите **«Регистрация»** в боковом меню
2. Введите email и пароль
3. Подтвердите email (проверьте папку «Спам»)
4. Войдите в систему

## Настройка профиля

После входа перейдите в **Профиль** для настройки:

### Персональные данные
- Отображаемое имя
- Аватар (по желанию)

### Предпочтения
- **Тема**: тёмная или светлая
- **Язык**: русский или английский

## API-ключи

Для работы с AI-моделями вам понадобятся API-ключи провайдеров. Поддерживаемые провайдеры:

| Провайдер | Модели | Где получить |
|-----------|--------|--------------|
| OpenAI | GPT-4, GPT-4o | [platform.openai.com](https://platform.openai.com) |
| Anthropic | Claude 3 | [console.anthropic.com](https://console.anthropic.com) |
| Google | Gemini | [ai.google.dev](https://ai.google.dev) |
| xAI | Grok | [x.ai](https://x.ai) |
| Groq | LLaMA, Mixtral | [console.groq.com](https://console.groq.com) |
| OpenRouter | 100+ моделей | [openrouter.ai](https://openrouter.ai) |

### Как добавить ключ

1. Перейдите в **Профиль** → **API Ключи**
2. Введите ключ в соответствующее поле
3. Нажмите **Сохранить**

> 💡 **Совет**: Начните с OpenRouter — один ключ даёт доступ к сотням моделей разных провайдеров.`,

      en: `# Getting Started

## Registration and Login

1. Click **"Sign Up"** in the sidebar
2. Enter your email and password
3. Confirm your email (check the Spam folder)
4. Log in to the system

## Profile Setup

After logging in, go to **Profile** for settings:

### Personal Information
- Display name
- Avatar (optional)

### Preferences
- **Theme**: dark or light
- **Language**: Russian or English

## API Keys

To work with AI models, you'll need API keys from providers. Supported providers:

| Provider | Models | Where to get |
|----------|--------|--------------|
| OpenAI | GPT-4, GPT-4o | [platform.openai.com](https://platform.openai.com) |
| Anthropic | Claude 3 | [console.anthropic.com](https://console.anthropic.com) |
| Google | Gemini | [ai.google.dev](https://ai.google.dev) |
| xAI | Grok | [x.ai](https://x.ai) |
| Groq | LLaMA, Mixtral | [console.groq.com](https://console.groq.com) |
| OpenRouter | 100+ models | [openrouter.ai](https://openrouter.ai) |

### How to Add a Key

1. Go to **Profile** → **API Keys**
2. Enter the key in the corresponding field
3. Click **Save**

> 💡 **Tip**: Start with OpenRouter — one key gives you access to hundreds of models from different providers.`
    }
  },
  {
    id: 'expert-panel',
    titleKey: 'hydrapedia.sections.expertPanel',
    icon: 'Users',
    content: {
      ru: `# Панель экспертов

Панель экспертов — это главный инструмент для работы с несколькими моделями одновременно.

## Выбор моделей

В верхней части чата находится селектор моделей:

1. Нажмите на селектор **«Выберите модели»**
2. Отметьте нужные модели галочками
3. Выбранные модели отобразятся как чипы

> ⚡ **Важно**: Модели, для которых нет ключа, будут недоступны (серые).

## Одновременный запрос

Когда выбрано несколько моделей:
- Запрос отправляется **всем моделям параллельно**
- Ответы появляются по мере готовности
- Каждый ответ помечен названием модели

### Пример сценария

\`\`\`
Вопрос: "Объясни квантовые вычисления"

→ GPT-4o: [ответ с аналогиями]
→ Claude: [ответ с примерами кода]
→ Gemini: [ответ со схемами]
\`\`\`

## Таймауты

Настройте время ожидания ответа:
- **30 секунд** — для быстрых моделей
- **2-4 минуты** — для моделей с «reasoning» (o1, Claude thinking)

Если модель не ответила вовремя, её ответ будет пропущен.

## D-Chat консультант

Справа от основного чата можно открыть **панель консультанта** — отдельный чат с выбранной моделью для уточняющих вопросов.

### Как использовать

1. Нажмите на иконку консультанта (💬) в панели ответа
2. Откроется боковой чат
3. Задавайте уточняющие вопросы
4. Контекст основного разговора учитывается

> 💡 **Совет**: Используйте консультанта для углублённого анализа конкретного ответа.`,

      en: `# Expert Panel

The Expert Panel is the main tool for working with multiple models simultaneously.

## Model Selection

At the top of the chat, there's a model selector:

1. Click on the **"Select models"** selector
2. Check the desired models
3. Selected models will appear as chips

> ⚡ **Important**: Models without a key will be unavailable (grayed out).

## Simultaneous Requests

When multiple models are selected:
- The request is sent to **all models in parallel**
- Responses appear as they're ready
- Each response is labeled with the model name

### Example Scenario

\`\`\`
Question: "Explain quantum computing"

→ GPT-4o: [response with analogies]
→ Claude: [response with code examples]
→ Gemini: [response with diagrams]
\`\`\`

## Timeouts

Configure response wait time:
- **30 seconds** — for fast models
- **2-4 minutes** — for models with "reasoning" (o1, Claude thinking)

If a model doesn't respond in time, its response will be skipped.

## D-Chat Consultant

To the right of the main chat, you can open the **consultant panel** — a separate chat with a selected model for follow-up questions.

### How to Use

1. Click on the consultant icon (💬) in the response panel
2. A side chat will open
3. Ask follow-up questions
4. The main conversation context is considered

> 💡 **Tip**: Use the consultant for in-depth analysis of a specific response.`
    }
  },
  {
    id: 'roles',
    titleKey: 'hydrapedia.sections.roles',
    icon: 'Shield',
    content: {
      ru: `# Роли агентов

В AI-Hydra каждый ответ модели может иметь определённую роль. Это помогает структурировать диалог и понимать функцию каждого ответа.

## Основные роли

### 🟢 Assistant (Эксперт)
**Цвет**: зелёный

Основная роль для ответов. Эксперт даёт прямой, информативный ответ на запрос пользователя.

### 🔴 Critic (Критик)
**Цвет**: красный

Критик анализирует ответы других моделей, находит слабые места, логические ошибки и предлагает улучшения.

### 🟡 Arbiter (Арбитр)
**Цвет**: золотой

Арбитр синтезирует ответы всех экспертов и критиков, формируя финальный, сбалансированный ответ.

### 🟠 Consultant (Консультант)
**Цвет**: янтарный

Консультант работает в боковой панели D-Chat, помогая углубиться в конкретную тему или ответ.

## Дополнительные роли

| Роль | Цвет | Назначение |
|------|------|------------|
| **Moderator** | Синий | Модерация контента |
| **Advisor** | Изумрудный | Стратегические советы |
| **Archivist** | Бронзовый | Работа с историей и документами |
| **Analyst** | Индиго | Глубокий анализ данных |
| **Webhunter** | Оранжевый | Поиск информации в сети |

## Назначение ролей

Роли назначаются автоматически на основе:
- Системного промпта модели
- Контекста запроса
- Настроек в библиотеке промптов

> 💡 **Совет**: В библиотеке промптов вы можете создать промпты с определённой ролью и использовать их для специализации моделей.`,

      en: `# Agent Roles

In AI-Hydra, each model response can have a specific role. This helps structure the dialogue and understand the function of each response.

## Main Roles

### 🟢 Assistant (Expert)
**Color**: green

The main role for responses. The expert provides a direct, informative answer to the user's request.

### 🔴 Critic
**Color**: red

The critic analyzes responses from other models, finds weaknesses, logical errors, and suggests improvements.

### 🟡 Arbiter
**Color**: gold

The arbiter synthesizes responses from all experts and critics, forming a final, balanced response.

### 🟠 Consultant
**Color**: amber

The consultant works in the D-Chat side panel, helping to dive deeper into a specific topic or response.

## Additional Roles

| Role | Color | Purpose |
|------|-------|---------|
| **Moderator** | Blue | Content moderation |
| **Advisor** | Emerald | Strategic advice |
| **Archivist** | Bronze | Working with history and documents |
| **Analyst** | Indigo | Deep data analysis |
| **Webhunter** | Orange | Web information search |

## Role Assignment

Roles are assigned automatically based on:
- Model's system prompt
- Request context
- Settings in the prompt library

> 💡 **Tip**: In the prompt library, you can create prompts with a specific role and use them to specialize models.`
    }
  },
  {
    id: 'prompt-library',
    titleKey: 'hydrapedia.sections.promptLibrary',
    icon: 'Library',
    content: {
      ru: `# Библиотека промптов

Библиотека промптов позволяет сохранять, организовывать и переиспользовать системные промпты для разных задач.

## Создание промпта

1. Перейдите в **Библиотека промптов**
2. Нажмите **«Новый промпт»**
3. Заполните поля:
   - **Название**: краткое описание
   - **Роль**: выберите роль (Эксперт, Критик и т.д.)
   - **Содержание**: текст системного промпта
   - **Теги**: ключевые слова для поиска

## Структура эффективного промпта

\`\`\`markdown
# Роль
Ты — [описание роли и экспертизы]

# Контекст
[Описание ситуации и задачи]

# Инструкции
1. [Первый шаг]
2. [Второй шаг]
3. [Третий шаг]

# Формат ответа
[Ожидаемая структура ответа]

# Ограничения
- [Что нельзя делать]
- [Что нужно избегать]
\`\`\`

## Назначение ролей

Каждому промпту можно назначить роль:

| Роль | Когда использовать |
|------|-------------------|
| Assistant | Общие задачи, генерация контента |
| Critic | Ревью кода, проверка логики |
| Arbiter | Синтез и принятие решений |
| Consultant | Узкоспециализированные вопросы |

## Шаринг промптов

Вы можете поделиться промптами с командой:

1. Откройте промпт
2. Включите переключатель **«Публичный»**
3. Промпт станет доступен другим пользователям

> 💡 **Совет**: Используйте теги для быстрого поиска промптов по тематике.`,

      en: `# Prompt Library

The prompt library allows you to save, organize, and reuse system prompts for different tasks.

## Creating a Prompt

1. Go to **Prompt Library**
2. Click **"New Prompt"**
3. Fill in the fields:
   - **Name**: brief description
   - **Role**: select role (Expert, Critic, etc.)
   - **Content**: system prompt text
   - **Tags**: keywords for search

## Effective Prompt Structure

\`\`\`markdown
# Role
You are — [role and expertise description]

# Context
[Situation and task description]

# Instructions
1. [First step]
2. [Second step]
3. [Third step]

# Response Format
[Expected response structure]

# Constraints
- [What not to do]
- [What to avoid]
\`\`\`

## Role Assignment

Each prompt can be assigned a role:

| Role | When to Use |
|------|-------------|
| Assistant | General tasks, content generation |
| Critic | Code review, logic verification |
| Arbiter | Synthesis and decision making |
| Consultant | Specialized questions |

## Sharing Prompts

You can share prompts with your team:

1. Open the prompt
2. Enable the **"Public"** toggle
3. The prompt will become available to other users

> 💡 **Tip**: Use tags for quick prompt search by topic.`
    }
  },
  {
    id: 'tools',
    titleKey: 'hydrapedia.sections.tools',
    icon: 'Wrench',
    content: {
      ru: `# Инструменты

Инструменты расширяют возможности AI-моделей, позволяя им выполнять действия: поиск в интернете, работа с API, вычисления и многое другое.

## Типы инструментов

### Промпт-инструменты
Текстовые инструкции, которые модель интерпретирует и выполняет. Подходят для:
- Форматирования вывода
- Пошаговых инструкций
- Специализированных задач

### HTTP API инструменты
Реальные вызовы к внешним API. Позволяют:
- Получать данные из интернета
- Взаимодействовать с сервисами
- Выполнять вычисления

## Создание инструмента

### Промпт-инструмент

1. Перейдите в **Инструменты**
2. Нажмите **«Новый инструмент»**
3. Выберите тип **«Промпт»**
4. Заполните:
   - **Название**: уникальное имя
   - **Описание**: что делает инструмент
   - **Шаблон**: текст промпта с параметрами

### HTTP-инструмент

\`\`\`json
{
  "method": "GET",
  "url": "https://api.example.com/data",
  "headers": {
    "Authorization": "Bearer {{apiKey}}"
  }
}
\`\`\`

## Параметры инструментов

Используйте двойные фигурные скобки для параметров:

\`\`\`
Поищи информацию о {{query}} и верни результаты в формате {{format}}
\`\`\`

При вызове модель заполнит параметры автоматически.

## Тестирование

Перед использованием протестируйте инструмент:

1. Откройте инструмент
2. Нажмите **«Тест»**
3. Введите тестовые параметры
4. Проверьте результат

> ⚠️ **Важно**: HTTP-инструменты требуют корректной настройки CORS на стороне API.`,

      en: `# Tools

Tools extend AI model capabilities, allowing them to perform actions: web search, API calls, calculations, and more.

## Tool Types

### Prompt Tools
Text instructions that the model interprets and executes. Suitable for:
- Output formatting
- Step-by-step instructions
- Specialized tasks

### HTTP API Tools
Real calls to external APIs. Allow you to:
- Fetch data from the internet
- Interact with services
- Perform calculations

## Creating a Tool

### Prompt Tool

1. Go to **Tools**
2. Click **"New Tool"**
3. Select type **"Prompt"**
4. Fill in:
   - **Name**: unique identifier
   - **Description**: what the tool does
   - **Template**: prompt text with parameters

### HTTP Tool

\`\`\`json
{
  "method": "GET",
  "url": "https://api.example.com/data",
  "headers": {
    "Authorization": "Bearer {{apiKey}}"
  }
}
\`\`\`

## Tool Parameters

Use double curly braces for parameters:

\`\`\`
Search for information about {{query}} and return results in {{format}} format
\`\`\`

When called, the model will fill in parameters automatically.

## Testing

Test the tool before using:

1. Open the tool
2. Click **"Test"**
3. Enter test parameters
4. Check the result

> ⚠️ **Important**: HTTP tools require proper CORS configuration on the API side.`
    }
  },
  {
    id: 'flow-editor',
    titleKey: 'hydrapedia.sections.flowEditor',
    icon: 'GitBranch',
    content: {
      ru: `# Редактор потоков мысли

Визуальный инструмент для проектирования сложных цепочек обработки данных и AI-промптов.

## Создание диаграммы

1. Перейдите в **Редактор потоков мысли**
2. Нажмите **«Новая диаграмма»**
3. Перетащите узлы из левой панели на холст
4. Соедините узлы, потянув от выхода к входу

## Типы узлов

### Базовые
| Узел | Назначение |
|------|------------|
| **Вход** | Точка входа данных |
| **Выход** | Точка вывода результата |
| **Промпт** | Системный промпт |
| **AI Модель** | Вызов языковой модели |

### Логика
| Узел | Назначение |
|------|------------|
| **Условие** | Ветвление по условию |
| **Переключатель** | Множественное ветвление |
| **Цикл** | Итерация по данным |

### Данные
| Узел | Назначение |
|------|------------|
| **Трансформация** | Преобразование данных |
| **Фильтр** | Фильтрация по условию |
| **Слияние** | Объединение потоков |
| **Разделение** | Разделение на подпотоки |

### Интеграции
| Узел | Назначение |
|------|------------|
| **API** | HTTP-запросы |
| **База данных** | CRUD-операции |
| **Хранилище** | Файловые операции |

## Пример: Цепочка с критиком

\`\`\`mermaid
graph LR
    I[Вход] --> P[Промпт]
    P --> M1[GPT-4]
    P --> M2[Claude]
    M1 --> C[Критик]
    M2 --> C
    C --> A[Арбитр]
    A --> O[Выход]
\`\`\`

## Экспорт

Диаграммы можно экспортировать в:
- **PNG** — для документации
- **SVG** — для редактирования
- **JSON** — для программного использования
- **Mermaid** — текстовый формат диаграмм`,

      en: `# Thought Flow Editor

A visual tool for designing complex data processing chains and AI prompts.

## Creating a Diagram

1. Go to **Thought Flow Editor**
2. Click **"New Diagram"**
3. Drag nodes from the left panel to the canvas
4. Connect nodes by dragging from output to input

## Node Types

### Basic
| Node | Purpose |
|------|---------|
| **Input** | Data entry point |
| **Output** | Result output point |
| **Prompt** | System prompt |
| **AI Model** | Language model call |

### Logic
| Node | Purpose |
|------|---------|
| **Condition** | Conditional branching |
| **Switch** | Multiple branching |
| **Loop** | Data iteration |

### Data
| Node | Purpose |
|------|---------|
| **Transform** | Data transformation |
| **Filter** | Conditional filtering |
| **Merge** | Stream merging |
| **Split** | Splitting into substreams |

### Integrations
| Node | Purpose |
|------|---------|
| **API** | HTTP requests |
| **Database** | CRUD operations |
| **Storage** | File operations |

## Example: Chain with Critic

\`\`\`mermaid
graph LR
    I[Input] --> P[Prompt]
    P --> M1[GPT-4]
    P --> M2[Claude]
    M1 --> C[Critic]
    M2 --> C
    C --> A[Arbiter]
    A --> O[Output]
\`\`\`

## Export

Diagrams can be exported to:
- **PNG** — for documentation
- **SVG** — for editing
- **JSON** — for programmatic use
- **Mermaid** — text diagram format`
    }
  },
  {
    id: 'model-ratings',
    titleKey: 'hydrapedia.sections.modelRatings',
    icon: 'BarChart3',
    content: {
      ru: `# Рейтинг моделей

Система отслеживания и оценки эффективности различных AI-моделей на основе вашего использования.

## Метрики

### Использование
- **Количество запросов** — сколько раз модель была вызвана
- **Общие токены** — суммарное количество токенов (вход + выход)
- **Средний размер ответа** — средняя длина ответов модели

### Оценки
- **Брейны** 🧠 — награда за полезный ответ
- **Отклонения** — когда ответ был отклонён или проигнорирован

## Как оценивать

После получения ответа модели:

1. Если ответ полезен — нажмите 🧠 (добавить брейн)
2. Если ответ не подошёл — нажмите ❌ (отклонить)

Эти оценки формируют персональный рейтинг моделей.

## Интерпретация данных

| Показатель | Что означает |
|------------|--------------|
| Высокий % брейнов | Модель хорошо подходит для ваших задач |
| Много отклонений | Возможно, нужен другой промпт |
| Большие ответы | Модель детальна (или многословна) |

## Статистика по сессиям

Каждая задача (сессия) сохраняет статистику:
- Какие модели использовались
- Сколько сообщений отправлено
- Общая эффективность

> 💡 **Совет**: Используйте рейтинг для выбора оптимальной модели под конкретную задачу.`,

      en: `# Model Ratings

A system for tracking and evaluating the effectiveness of various AI models based on your usage.

## Metrics

### Usage
- **Request count** — how many times the model was called
- **Total tokens** — total token count (input + output)
- **Average response size** — average length of model responses

### Ratings
- **Brains** 🧠 — reward for a useful response
- **Dismissals** — when a response was rejected or ignored

## How to Rate

After receiving a model response:

1. If the response is useful — click 🧠 (add brain)
2. If the response didn't fit — click ❌ (dismiss)

These ratings form a personal model ranking.

## Data Interpretation

| Indicator | What it means |
|-----------|---------------|
| High brain % | Model works well for your tasks |
| Many dismissals | May need a different prompt |
| Large responses | Model is detailed (or verbose) |

## Session Statistics

Each task (session) saves statistics:
- Which models were used
- How many messages were sent
- Overall effectiveness

> 💡 **Tip**: Use the rating to choose the optimal model for a specific task.`
    }
  },
  {
    id: 'best-practices',
    titleKey: 'hydrapedia.sections.bestPractices',
    icon: 'Star',
    content: {
      ru: `# Советы и лучшие практики

## Эффективные промпты

### Структура
\`\`\`
1. Роль: Кто ты (эксперт в X)
2. Контекст: Ситуация и цель
3. Задача: Что нужно сделать
4. Формат: Как оформить ответ
5. Ограничения: Чего избегать
\`\`\`

### Примеры хороших промптов

**Плохо:**
> Напиши код

**Хорошо:**
> Ты — senior Python разработчик. Напиши функцию для парсинга JSON-файла с обработкой ошибок. Используй type hints. Добавь docstring.

## Работа с несколькими моделями

### Когда использовать ансамбль

✅ **Используйте несколько моделей для:**
- Сложных аналитических задач
- Генерации креативного контента
- Код-ревью и отладки
- Принятия важных решений

❌ **Одной модели достаточно для:**
- Простых вопросов
- Форматирования текста
- Быстрых переводов

### Оптимальные комбинации

| Задача | Рекомендуемый состав |
|--------|---------------------|
| Код | GPT-4 + Claude |
| Анализ | Claude + Gemini |
| Креатив | GPT-4 + Claude + Gemini |
| Исследование | Любые с поиском |

## Когда использовать какую роль

### Эксперт (Assistant)
- Основной ответ на запрос
- Генерация контента
- Первичный анализ

### Критик (Critic)
- Проверка кода на ошибки
- Анализ аргументации
- Поиск слабых мест

### Арбитр (Arbiter)
- Финальное решение
- Синтез разных мнений
- Разрешение противоречий

### Консультант (Consultant)
- Углублённые вопросы
- Специализированная экспертиза
- Пошаговое объяснение

## Экономия токенов

1. **Краткие промпты** — избегайте повторов
2. **Конкретные вопросы** — меньше контекста = меньше токенов
3. **Правильные модели** — не используйте GPT-4 для простых задач
4. **Кэширование** — используйте сохранённые промпты

> 💡 **Главный совет**: Экспериментируйте! Попробуйте разные модели и промпты, чтобы найти оптимальный подход для ваших задач.`,

      en: `# Tips and Best Practices

## Effective Prompts

### Structure
\`\`\`
1. Role: Who you are (expert in X)
2. Context: Situation and goal
3. Task: What needs to be done
4. Format: How to structure the response
5. Constraints: What to avoid
\`\`\`

### Good Prompt Examples

**Bad:**
> Write code

**Good:**
> You are a senior Python developer. Write a function for parsing a JSON file with error handling. Use type hints. Add docstring.

## Working with Multiple Models

### When to Use an Ensemble

✅ **Use multiple models for:**
- Complex analytical tasks
- Creative content generation
- Code review and debugging
- Important decision making

❌ **One model is enough for:**
- Simple questions
- Text formatting
- Quick translations

### Optimal Combinations

| Task | Recommended Setup |
|------|------------------|
| Code | GPT-4 + Claude |
| Analysis | Claude + Gemini |
| Creative | GPT-4 + Claude + Gemini |
| Research | Any with search |

## When to Use Which Role

### Expert (Assistant)
- Main response to request
- Content generation
- Initial analysis

### Critic
- Code error checking
- Argumentation analysis
- Finding weaknesses

### Arbiter
- Final decision
- Synthesis of different opinions
- Resolving contradictions

### Consultant
- In-depth questions
- Specialized expertise
- Step-by-step explanation

## Token Economy

1. **Brief prompts** — avoid repetition
2. **Specific questions** — less context = fewer tokens
3. **Right models** — don't use GPT-4 for simple tasks
4. **Caching** — use saved prompts

> 💡 **Main tip**: Experiment! Try different models and prompts to find the optimal approach for your tasks.`
    }
  }
];
