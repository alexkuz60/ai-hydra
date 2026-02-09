import type { HydrapediaSection } from './types';

export const chatSections: HydrapediaSection[] = [
  {
    id: 'chat-actions',
    titleKey: 'hydrapedia.sections.chatActions',
    icon: 'MousePointerClick',
    content: {
      ru: `# Действия с сообщениями

При наведении на любое сообщение ИИ в чате появляется панель быстрых действий. Эти инструменты позволяют оценивать, сохранять и управлять ответами — формируя персональный рейтинг моделей и обогащая контекст будущих диалогов.

## Доступные действия

| Иконка | Действие | Зачем это нужно |
|--------|----------|-----------------|
| ⚖️ Весы | **Запросить оценку Арбитра** | Отправляет ответ в D-Chat к Арбитру для независимой экспертной оценки качества |
| ⚠️ Треугольник | **Отметить галлюцинацию** | Фиксирует факт галлюцинации модели — увеличивает счётчик \`hallucination_count\` в статистике |
| 💡 Лампочка | **Обсудить в D-Chat** | Отправляет ответ выбранному консультанту для уточнения или развития мысли |
| 📦 Архив | **Сохранить в память** | Сохраняет ответ в сессионную память для контекстного обогащения будущих запросов |
| 🗑️ Корзина | **Удалить сообщение** | Удаляет сообщение после подтверждения (двухэтапное удаление) |

## Как пользоваться

### Оценка качества
Наведите курсор на ответ модели → нажмите ⚖️ (весы). Арбитр получит этот ответ и предоставит независимую оценку — полезно для сравнения моделей и формирования рейтинга.

### Отметка галлюцинации
Если модель выдала недостоверную информацию → нажмите ⚠️. Статистика галлюцинаций учитывается в Подиуме моделей и помогает выявлять ненадёжные модели.

### Сохранение в память
Нажмите 📦 — ответ сохраняется в сессионную память. Кнопка анимированно меняется на ✓, подтверждая сохранение. Уже сохранённые ответы отмечены зелёной галочкой.

> [!TIP] Когда сохранять в память
> Сохраняйте ключевые выводы, решения и важные факты. Эти фрагменты будут автоматически подтягиваться в контекст при семантически похожих запросах в будущем.

### Обсуждение в D-Chat
Нажмите 💡 — ответ отправляется выбранному консультанту. Используйте, когда хотите углубиться в конкретный аспект ответа или получить альтернативную точку зрения.

### Удаление
Нажмите 🗑️ → подтвердите в диалоге. Удаление необратимо.

> [!WARNING] Только для ответов ИИ
> Панель действий (кроме удаления) отображается только для сообщений ИИ-ролей. Для пользовательских сообщений доступно только удаление.

## Оценки и Подиум

Все оценки (мозги 🧠, отклонения 👎, галлюцинации ⚠️, оценки Арбитра ⚖️) накапливаются и формируют персональный рейтинг в **Подиуме моделей**. Регулярная оценка помогает определить, какие модели лучше подходят для ваших задач.`,
      en: `# Message Actions

When hovering over any AI message in the chat, a quick action panel appears. These tools let you rate, save, and manage responses — building a personal model rating and enriching context for future conversations.

## Available Actions

| Icon | Action | Why You Need It |
|------|--------|-----------------|
| ⚖️ Scales | **Request Arbiter Evaluation** | Sends the response to D-Chat's Arbiter for independent quality assessment |
| ⚠️ Triangle | **Flag Hallucination** | Records a model hallucination — increments \`hallucination_count\` in statistics |
| 💡 Lightbulb | **Discuss in D-Chat** | Sends the response to a selected consultant for clarification or further exploration |
| 📦 Archive | **Save to Memory** | Saves the response to session memory for contextual enrichment of future queries |
| 🗑️ Trash | **Delete Message** | Deletes the message after confirmation (two-step deletion) |

## How to Use

### Quality Assessment
Hover over a model's response → click ⚖️ (scales). The Arbiter will receive this response and provide an independent evaluation — useful for model comparison and rating.

### Flagging Hallucinations
If a model produced unreliable information → click ⚠️. Hallucination statistics are tracked in the Model Podium and help identify unreliable models.

### Saving to Memory
Click 📦 — the response is saved to session memory. The button animates to ✓, confirming the save. Already saved responses show a green checkmark.

> [!TIP] When to Save to Memory
> Save key conclusions, decisions, and important facts. These fragments will be automatically pulled into context for semantically similar queries in the future.

### Discussing in D-Chat
Click 💡 — the response is sent to the selected consultant. Use when you want to dive deeper into a specific aspect or get an alternative perspective.

### Deletion
Click 🗑️ → confirm in the dialog. Deletion is irreversible.

> [!WARNING] AI Messages Only
> The action panel (except deletion) is displayed only for AI role messages. For user messages, only deletion is available.

## Ratings and the Podium

All ratings (brains 🧠, dismissals 👎, hallucinations ⚠️, Arbiter evaluations ⚖️) accumulate and form a personal ranking in the **Model Podium**. Regular rating helps determine which models work best for your tasks.`,
    },
  },
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
- \`Ctrl+K\` — открыть библиотеку промптов

## Интерактивные чеклисты

Кнопка \`ListChecks\` в тулбаре ввода активирует режим интерактивных чеклистов. Ответы ИИ наследуют этот режим — чекбоксы (\`- [ ]\`) становятся кликабельными.

> [!TIP] Сохранение состояния
> Состояние каждого пункта (индекс + статус) сохраняется в \`metadata.checklist_state\` и синхронизируется с базой данных.

## Персонализация

Вместо статичного «Супервизор» в интерфейсе отображается имя пользователя из профиля (\`displayName\`):
- Заголовки сообщений
- Навигационное дерево
- Пожелания супервизора («Пожелания от [Имя]»)
- Тултипы области ввода

## Кэш недоступных моделей

При получении ошибок 404 (нет эндпоинтов) или 402 (лимиты) модель автоматически скрывается из списков выбора на 1 час.

> [!TIP] Сброс кэша
> В селекторе моделей предусмотрена кнопка «Сбросить кэш недоступных» для ручного восстановления полного списка.`,
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
- \`Ctrl+K\` — open prompt library

## Interactive Checklists

The \`ListChecks\` button in the input toolbar activates interactive checklist mode. AI responses inherit this mode — checkboxes (\`- [ ]\`) become clickable.

> [!TIP] State Persistence
> Each item's state (index + status) is saved in \`metadata.checklist_state\` and synchronized with the database.

## Personalization

Instead of the static "Supervisor" label, the user's profile name (\`displayName\`) is displayed across the interface:
- Message headers
- Navigation tree
- Supervisor wishes ("Wishes from [Name]")
- Input area tooltips

## Unavailable Model Cache

When 404 (no endpoints) or 402 (limits) errors are received, the model is automatically hidden from selection lists for 1 hour.

> [!TIP] Cache Reset
> The model selector includes a "Reset unavailable cache" button for manually restoring the full list.`,
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

Технические роли имеют доступ к специализированным инструментам и ролевой памяти.

## Автоматический чейнинг

D-Chat поддерживает цепочки анализа через Модератора — последовательная обработка запроса несколькими ролями в рамках одного потока.

## Перенос ответов

Ответы из D-Chat переносятся в основной чат с сохранением оригинальной роли и атрибуции модели.`,
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

Technical roles have access to specialized tools and role memory.

## Automatic Chaining

D-Chat supports analysis chains through the Moderator — sequential processing of a query by multiple roles within a single conversation thread.

## Response Porting

Responses from D-Chat can be ported to the main chat while preserving the original role and model attribution.`,
    },
  },
];
