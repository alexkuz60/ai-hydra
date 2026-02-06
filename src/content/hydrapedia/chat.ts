import type { HydrapediaSection } from './types';

export const chatSections: HydrapediaSection[] = [
  {
    id: 'expert-panel',
    titleKey: 'hydrapedia.sections.expertPanel',
    icon: 'Users',
    content: {
      ru: `# Панель экспертов

Панель экспертов — центральный модуль AI-Hydra для мультиагентных дискуссий. Несколько ИИ-ролей обсуждают ваш запрос параллельно, предоставляя разносторонний анализ.

## Структура интерфейса

### Древовидная навигация (TreeView)
Левая панель содержит дерево всех сообщений сессии. Узлы содержат превью запросов и обеспечивают мгновенный переход к любому сообщению.

- **Двойной клик** по узлу фильтрует сообщения по конкретному участнику
- Повторный двойной клик сбрасывает фильтр

### Область сообщений
Центральная область отображает диалог с цветовой кодировкой ролей. Каждое сообщение помечено иконкой роли и названием модели.

### Панель ввода
Поле ввода обрамлено двумя вертикальными тулбарами:

**Левый тулбар** (технические функции):
- Сворачивание/разворачивание панели
- Прикрепление файлов (изображения, документы)
- Таймаут запроса
- Вызов Промпт-Инженера

**Правый тулбар** (отправка):
- Отправить всем экспертам
- Отправить конкретному консультанту (D-Chat)

## Консультанты

При отправке всем — запрос обрабатывается оркестратором, который распределяет ответы между ролями:

| Роль | Функция |
|------|---------|
| \`@assistant\` Эксперт | Первичный анализ и генерация решений |
| \`@critic\` Критик | Поиск слабых мест и контраргументов |
| \`@arbiter\` Арбитр | Взвешенный синтез позиций |
| \`@consultant\` Консультант | Креативные и альтернативные подходы |
| \`@moderator\` Модератор | Структурирование дискуссии |
| \`@advisor\` Советник | Практические рекомендации |

## Настройки сессии

- Выбор модели для каждой роли
- Температура и max_tokens
- Системный промпт (из библиотеки или кастомный)
- Пожелания супервизора (Supervisor Wishes)

## Горячие клавиши

- \`Enter\` — отправить
- \`Shift+Enter\` — новая строка
- \`Ctrl+K\` — открыть библиотеку промптов`,
      en: `# Expert Panel

The Expert Panel is AI-Hydra's central module for multi-agent discussions. Multiple AI roles discuss your query in parallel, providing multifaceted analysis.

## Interface Structure

### Tree Navigation (TreeView)
The left panel contains a tree of all session messages. Nodes contain query previews and provide instant navigation to any message.

- **Double-click** on a node to filter messages by a specific participant
- Double-click again to reset the filter

### Message Area
The central area displays the conversation with color-coded roles. Each message is tagged with a role icon and model name.

### Input Area
The input field is flanked by two vertical toolbars:

**Left toolbar** (technical functions):
- Collapse/expand panel
- File attachments (images, documents)
- Request timeout
- Prompt Engineer invocation

**Right toolbar** (sending):
- Send to all experts
- Send to a specific consultant (D-Chat)

## Consultants

When sending to all — the request is processed by the orchestrator, which distributes responses among roles:

| Role | Function |
|------|----------|
| \`@assistant\` Expert | Primary analysis and solution generation |
| \`@critic\` Critic | Finding weaknesses and counterarguments |
| \`@arbiter\` Arbiter | Balanced synthesis of positions |
| \`@consultant\` Consultant | Creative and alternative approaches |
| \`@moderator\` Moderator | Discussion structuring |
| \`@advisor\` Advisor | Practical recommendations |

## Session Settings

- Model selection for each role
- Temperature and max_tokens
- System prompt (from library or custom)
- Supervisor Wishes

## Keyboard Shortcuts

- \`Enter\` — send
- \`Shift+Enter\` — new line
- \`Ctrl+K\` — open prompt library`,
    },
  },
  {
    id: 'streaming-mode',
    titleKey: 'hydrapedia.sections.streamingMode',
    icon: 'Star',
    content: {
      ru: `# Режим стриминга

Стриминг позволяет получать ответы от нескольких ИИ-моделей одновременно. Текст генерируется в реальном времени — вы видите ответ по мере его создания.

## Как это работает

1. Вы отправляете запрос
2. Оркестратор распределяет запрос между выбранными ролями
3. Каждая роль начинает генерацию параллельно
4. Ответы отображаются в режиме реального времени

## Карточки стриминга

Каждый ответ отображается в отдельной карточке с:
- Иконкой и цветом роли
- Названием используемой модели
- Блоком «размышлений» (thinking) для моделей с reasoning
- Индикатором прогресса генерации

## Thinking Block

Модели с поддержкой reasoning (o1, o3, DeepSeek-R1, Claude 4 с extended thinking) показывают блок размышлений — внутренний ход мыслей модели до финального ответа. Этот блок сворачивается по клику.

## Мультимодельный режим

В настройках сессии можно выбрать несколько моделей одновременно. Каждая модель генерирует свой ответ, что позволяет сравнивать качество разных провайдеров.`,
      en: `# Streaming Mode

Streaming allows receiving responses from multiple AI models simultaneously. Text is generated in real-time — you see the response as it's being created.

## How It Works

1. You send a query
2. The orchestrator distributes the query among selected roles
3. Each role begins generating in parallel
4. Responses are displayed in real-time

## Streaming Cards

Each response is displayed in a separate card with:
- Role icon and color
- Model name being used
- "Thinking" block for reasoning models
- Generation progress indicator

## Thinking Block

Models with reasoning support (o1, o3, DeepSeek-R1, Claude 4 with extended thinking) display a thinking block — the model's internal reasoning before the final answer. This block collapses on click.

## Multi-model Mode

In session settings, you can select multiple models simultaneously. Each model generates its own response, allowing you to compare quality across different providers.`,
    },
  },
  {
    id: 'd-chat-moderator',
    titleKey: 'hydrapedia.sections.dChatModerator',
    icon: 'Shield',
    content: {
      ru: `# D-Chat Модератор

D-Chat (Directed Chat) — режим прямого общения с конкретным консультантом. В отличие от общего запроса, D-Chat отправляет сообщение только выбранной роли.

## 7 режимов консультанта

| Режим | Описание |
|-------|----------|
| Обычный | Стандартный диалог с одной ролью |
| Дуэль | Две модели отвечают параллельно на один запрос |
| Промпт-Инженер | Оптимизация ваших промптов |
| Анализ | Глубокий разбор проблемы |
| Код-ревью | Проверка и улучшение кода |
| Перевод | Мультиязычный перевод |
| Креатив | Генерация идей и творческий подход |

## Уточнение текста

Выделите фрагмент текста в любом ответе — появится всплывающее меню:
- **Уточнить** — отправить выделенный текст в D-Chat для детализации
- **Копировать** — скопировать в буфер

## Вызов техника (Call Tech)

Специальная функция для технического персонала:
- \`@archivist\` — работа с памятью сессии
- \`@analyst\` — анализ данных и метрик
- \`@promptengineer\` — оптимизация промптов
- \`@flowregulator\` — проверка и настройка потоков
- \`@toolsmith\` — создание и тестирование инструментов
- \`@webhunter\` — поиск информации в интернете

Технические роли имеют доступ к специализированным инструментам и ролевой памяти.`,
      en: `# D-Chat Moderator

D-Chat (Directed Chat) — a mode for direct communication with a specific consultant. Unlike general queries, D-Chat sends a message only to the selected role.

## 7 Consultant Modes

| Mode | Description |
|------|-------------|
| Normal | Standard dialogue with one role |
| Duel | Two models answer the same query in parallel |
| Prompt Engineer | Optimization of your prompts |
| Analysis | Deep problem breakdown |
| Code Review | Code checking and improvement |
| Translation | Multilingual translation |
| Creative | Idea generation and creative approaches |

## Text Refinement

Select a text fragment in any response — a popup menu appears:
- **Refine** — send selected text to D-Chat for elaboration
- **Copy** — copy to clipboard

## Call Tech

Special function for technical staff:
- \`@archivist\` — session memory management
- \`@analyst\` — data and metrics analysis
- \`@promptengineer\` — prompt optimization
- \`@flowregulator\` — flow checking and configuration
- \`@toolsmith\` — tool creation and testing
- \`@webhunter\` — internet information search

Technical roles have access to specialized tools and role memory.`,
    },
  },
];
