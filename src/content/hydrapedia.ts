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
- \`@assistant\` — основной ответ
- \`@critic\` — критический анализ
- \`@arbiter\` — финальный синтез
- \`@consultant\` — дополнительная экспертиза

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

Платформа отправляет ваш запрос выбранным моделям, собирает их ответы и может синтезировать финальный результат через «Арбитра».

## Элементы управления в шапке

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Логотип ai hydra** | \`logo.svg\` | Клик возвращает на главную страницу |
| **Переключатель темы** | \`Sun\` / \`Moon\` | Переключение между светлой и тёмной темой |
| **Выбор языка** | \`Globe\` | Переключение интерфейса RU / EN |`,

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
- \`@assistant\` — primary response
- \`@critic\` — critical analysis
- \`@arbiter\` — final synthesis
- \`@consultant\` — additional expertise

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

The platform sends your request to selected models, collects their responses, and can synthesize the final result through the "Arbiter".

## Header Controls

| Element | Icon | Description |
|---------|------|-------------|
| **ai hydra Logo** | \`logo.svg\` | Click to return to home page |
| **Theme Toggle** | \`Sun\` / \`Moon\` | Switch between light and dark theme |
| **Language Selector** | \`Globe\` | Switch interface RU / EN |`
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

Для работы с AI-моделями вам понадобятся API-ключи провайдеров:

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

> **Совет**: Начните с OpenRouter — один ключ даёт доступ к сотням моделей.

## Элементы страницы Профиль

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Вкладка «Профиль»** | \`User\` | Редактирование имени и аватара |
| **Вкладка «API Ключи»** | \`Key\` | Управление ключами провайдеров |
| **Вкладка «Использование»** | \`BarChart3\` | Статистика использования моделей |
| **Сохранить** | \`Save\` | Сохранение изменений |
| **Показать/Скрыть ключ** | \`Eye\` / \`EyeOff\` | Переключение видимости API-ключа |`,

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

To work with AI models, you'll need API keys from providers:

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

> **Tip**: Start with OpenRouter — one key gives you access to hundreds of models.

## Profile Page Controls

| Element | Icon | Description |
|---------|------|-------------|
| **Profile Tab** | \`User\` | Edit name and avatar |
| **API Keys Tab** | \`Key\` | Manage provider keys |
| **Usage Tab** | \`BarChart3\` | Model usage statistics |
| **Save** | \`Save\` | Save changes |
| **Show/Hide Key** | \`Eye\` / \`EyeOff\` | Toggle API key visibility |`
    }
  },
  {
    id: 'expert-panel',
    titleKey: 'hydrapedia.sections.expertPanel',
    icon: 'Users',
    content: {
      ru: `# Панель экспертов

Панель экспертов — это главный инструмент для работы с несколькими моделями одновременно.

## Интерфейс чата

### Верхняя панель инструментов

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Селектор моделей** | \`Bot\` | Выбор нескольких моделей для запроса |
| **Селектор промптов** | \`BookOpen\` | Быстрый выбор системного промпта |
| **Настройки модели** | \`Settings\` | Температура, max tokens и другие параметры |
| **Таймаут** | \`Clock\` | Время ожидания ответа (30с – 4м) |
| **Новый чат** | \`Plus\` | Создание новой сессии |

### Селектор моделей

1. Нажмите на селектор **«Выберите модели»**
2. Отметьте нужные модели галочками
3. Выбранные модели отобразятся как чипы

> **Важно**: Модели без настроенного API-ключа будут недоступны (серые).

### Параметры модели (шестерёнка)

| Параметр | Описание | Диапазон |
|----------|----------|----------|
| **Temperature** | Креативность ответов | 0.0 – 2.0 |
| **Max Tokens** | Максимальная длина ответа | 256 – 16384 |
| **Top P** | Вероятностная выборка | 0.0 – 1.0 |
| **Presence Penalty** | Штраф за повторения тем | -2.0 – 2.0 |
| **Frequency Penalty** | Штраф за повторения слов | -2.0 – 2.0 |

## Область сообщений

### Сообщение пользователя

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Аватар** | \`Crown\` | Золотая иконка супервизора |
| **Время** | — | Время отправки сообщения |
| **Вложения** | \`Paperclip\` | Прикреплённые файлы/изображения |

### Сообщение модели

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Аватар роли** | \`CheckCircle\` / \`AlertTriangle\` / \`Scale\` | Цветная иконка роли |
| **Имя модели** | — | Название модели (GPT-4, Claude и т.д.) |
| **Брейн** | \`Brain\` | Награда за полезный ответ (+1 рейтинг) |
| **Отклонить** | \`X\` | Отклонение неудачного ответа |
| **Копировать** | \`Copy\` | Копирование текста в буфер |
| **Консультант** | \`MessageSquare\` | Открыть D-Chat с этой моделью |
| **Развернуть** | \`BookOpen\` | Развернуть/свернуть длинный ответ |
| **Thinking** | \`Sparkles\` | Раскрыть цепочку рассуждений |

## Нижняя панель ввода

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Поле ввода** | — | Текстовое поле для запроса |
| **Прикрепить файл** | \`Paperclip\` | Загрузка файлов и диаграмм |
| **Отправить** | \`SendHorizontal\` | Отправка сообщения |
| **Стоп** | \`Square\` | Остановка генерации (во время ответа) |

### Система вложений

AI-Hydra поддерживает три типа вложений:

| Тип | Иконка | Описание |
|-----|--------|----------|
| **Изображения** | \`Image\` | PNG, JPG, GIF, WebP (до 5 шт × 10 МБ) |
| **Документы** | \`FileText\` | PDF, TXT, MD и другие (до 10 МБ) |
| **Mermaid-диаграммы** | \`GitBranch\` | Визуальные диаграммы потоков |

### Прикрепление Mermaid-диаграмм

Mermaid-диаграммы прикрепляются как специальные вложения с визуальным превью (не вставляются в текст!). Это позволяет AI-модели анализировать диаграмму, а не объяснять синтаксис Mermaid.

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Скрепка → Диаграмма Mermaid** | \`Paperclip\` | Открывает подменю |
| **Пустой шаблон** | \`Plus\` | Добавляет базовый flowchart |
| **Из файла** | \`Upload\` | Загрузка .mmd / .mermaid файла |
| **Из библиотеки потоков** | \`Folder\` | Выбор из сохранённых диаграмм |
| **Карточка-превью** | \`GitBranch\` | Миниатюра диаграммы |
| **Увеличить** | Клик | Полноэкранный просмотр |
| **Удалить** | \`X\` | Открепить диаграмму |

> **Важно**: Диаграммы передаются как metadata вложения, поэтому AI видит их структуру, а не сырой код.

## Левый сайдбар — Навигатор чата

Древовидная визуализация диалога, показывающая все сообщения и их связи.

### Элементы навигатора

| Элемент | Описание |
|---------|----------|
| **Кнопка показа** \`PanelLeft\` | Показать/скрыть панель навигатора |
| **Узел пользователя** \`Crown\` | Сообщение пользователя (золотой фон) |
| **Узел** \`@assistant\` | Ответ эксперта |
| **Узел** \`@critic\` | Ответ критика |
| **Узел** \`@arbiter\` | Ответ арбитра |
| **Узел** \`@consultant\` | Ответ консультанта |
| **Связь между узлами** | Линия показывает порядок сообщений |

### Как использовать навигатор

1. Нажмите \`PanelLeft\` в левой части экрана
2. Кликните на любой узел для прокрутки к сообщению
3. Наведите на узел для просмотра информации о модели
4. Цвета узлов соответствуют ролям агентов

## Правый сайдбар — D-Chat консультант

Боковая панель для глубокого анализа с выбранной моделью.

### Элементы управления D-Chat

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Заголовок панели** | \`MessageSquare\` | Название модели-консультанта |
| **Закрыть панель** | \`X\` | Закрытие панели консультанта |
| **Изменить ширину** | \`GripVertical\` | Перетаскивание левого края панели |
| **Поле ввода** | — | Текстовое поле для вопросов |
| **Отправить** | \`SendHorizontal\` | Отправка вопроса консультанту |
| **Выделение текста** | \`Lightbulb\` | При выделении — кнопка «Уточнить» |

### Как использовать

1. Нажмите на иконку консультанта \`MessageSquare\` в ответе модели
2. Откроется боковой чат справа
3. Задавайте уточняющие вопросы
4. Выделите текст в ответе → нажмите \`Lightbulb\` для уточнения

> **Совет**: Используйте консультанта для углублённого анализа конкретного ответа.`,

      en: `# Expert Panel

The Expert Panel is the main tool for working with multiple models simultaneously.

## Chat Interface

### Top Toolbar

| Element | Icon | Description |
|---------|------|-------------|
| **Model Selector** | \`Bot\` | Select multiple models for query |
| **Prompt Selector** | \`BookOpen\` | Quick system prompt selection |
| **Model Settings** | \`Settings\` | Temperature, max tokens and other params |
| **Timeout** | \`Clock\` | Response wait time (30s – 4m) |
| **New Chat** | \`Plus\` | Create new session |

### Model Selector

1. Click on the **"Select models"** selector
2. Check the desired models
3. Selected models will appear as chips

> **Important**: Models without configured API key will be unavailable (grayed out).

### Model Parameters (gear icon)

| Parameter | Description | Range |
|-----------|-------------|-------|
| **Temperature** | Response creativity | 0.0 – 2.0 |
| **Max Tokens** | Maximum response length | 256 – 16384 |
| **Top P** | Probability sampling | 0.0 – 1.0 |
| **Presence Penalty** | Topic repetition penalty | -2.0 – 2.0 |
| **Frequency Penalty** | Word repetition penalty | -2.0 – 2.0 |

## Message Area

### User Message

| Element | Icon | Description |
|---------|------|-------------|
| **Avatar** | \`Crown\` | Gold supervisor icon |
| **Time** | — | Message send time |
| **Attachments** | \`Paperclip\` | Attached files/images |

### Model Message

| Element | Icon | Description |
|---------|------|-------------|
| **Role Avatar** | \`CheckCircle\` / \`AlertTriangle\` / \`Scale\` | Colored role icon |
| **Model Name** | — | Model name (GPT-4, Claude, etc.) |
| **Brain** | \`Brain\` | Reward for useful response (+1 rating) |
| **Dismiss** | \`X\` | Reject unsuccessful response |
| **Copy** | \`Copy\` | Copy text to clipboard |
| **Consultant** | \`MessageSquare\` | Open D-Chat with this model |
| **Expand** | \`BookOpen\` | Expand/collapse long response |
| **Thinking** | \`Sparkles\` | Reveal reasoning chain |

## Bottom Input Panel

| Element | Icon | Description |
|---------|------|-------------|
| **Input Field** | — | Text field for query |
| **Attach File** | \`Paperclip\` | Upload files and diagrams |
| **Send** | \`SendHorizontal\` | Send message |
| **Stop** | \`Square\` | Stop generation (while responding) |

### Attachment System

AI-Hydra supports three types of attachments:

| Type | Icon | Description |
|------|------|-------------|
| **Images** | \`Image\` | PNG, JPG, GIF, WebP (up to 5 × 10 MB) |
| **Documents** | \`FileText\` | PDF, TXT, MD and others (up to 10 MB) |
| **Mermaid Diagrams** | \`GitBranch\` | Visual flow diagrams |

### Attaching Mermaid Diagrams

Mermaid diagrams attach as special attachments with visual preview (not pasted into text!). This allows the AI model to analyze the diagram rather than explain Mermaid syntax.

| Element | Icon | Description |
|---------|------|-------------|
| **Paperclip → Mermaid Diagram** | \`Paperclip\` | Opens submenu |
| **Empty Template** | \`Plus\` | Adds basic flowchart |
| **From File** | \`Upload\` | Upload .mmd / .mermaid file |
| **From Flow Library** | \`Folder\` | Select from saved diagrams |
| **Preview Card** | \`GitBranch\` | Diagram thumbnail |
| **Enlarge** | Click | Full-screen view |
| **Remove** | \`X\` | Detach diagram |

> **Important**: Diagrams are passed as attachment metadata, so AI sees their structure, not raw code.

## Left Sidebar — Chat Navigator

Tree visualization of the dialogue, showing all messages and their connections.

### Navigator Elements

| Element | Description |
|---------|-------------|
| **Toggle Button** \`PanelLeft\` | Show/hide navigator panel |
| **User Node** \`Crown\` | User message (gold background) |
| **Node** \`@assistant\` | Expert response |
| **Node** \`@critic\` | Critic response |
| **Node** \`@arbiter\` | Arbiter response |
| **Node** \`@consultant\` | Consultant response |
| **Connection Line** | Line shows message order |

### How to Use Navigator

1. Click \`PanelLeft\` on the left side of the screen
2. Click on any node to scroll to that message
3. Hover over a node to view model info
4. Node colors correspond to agent roles

## Right Sidebar — D-Chat Consultant

Side panel for deep analysis with selected model.

### D-Chat Controls

| Element | Icon | Description |
|---------|------|-------------|
| **Panel Header** | \`MessageSquare\` | Consultant model name |
| **Close Panel** | \`X\` | Close consultant panel |
| **Resize** | \`GripVertical\` | Drag left edge of panel |
| **Input Field** | — | Text field for questions |
| **Send** | \`SendHorizontal\` | Send question to consultant |
| **Text Selection** | \`Lightbulb\` | When selecting — "Clarify" button |

### How to Use

1. Click on the consultant icon \`MessageSquare\` in model response
2. A side chat will open on the right
3. Ask follow-up questions
4. Select text in response → click \`Lightbulb\` to clarify

> **Tip**: Use the consultant for in-depth analysis of a specific response.`
    }
  },
  {
    id: 'streaming-mode',
    titleKey: 'hydrapedia.sections.streamingMode',
    icon: 'Zap',
    content: {
      ru: `# Режим стриминга

Режим стриминга (Hybrid Streaming) — продвинутый способ получения ответов от AI-моделей в реальном времени. Вместо ожидания полного ответа вы видите текст по мере его генерации.

## Зачем нужен стриминг?

### Скорость восприятия
Вы начинаете читать ответ сразу, не дожидаясь завершения генерации. Это особенно ценно для длинных ответов — пока модель дописывает конец, вы уже изучаете начало.

### Раннее обнаружение ошибок
Если модель пошла не в том направлении, вы увидите это в первых же предложениях и сможете остановить генерацию, не тратя время и токены.

### Параллельная работа
В мультимодельном режиме стриминг позволяет видеть ответы всех моделей одновременно. Вы можете сравнивать подходы в реальном времени.

## Эффективность

| Аспект | Без стриминга | Со стримингом |
|--------|---------------|---------------|
| **Время до первого токена** | 5–30 сек | < 1 сек |
| **Восприятие скорости** | Долгое ожидание | Мгновенный отклик |
| **Контроль процесса** | Только после завершения | В любой момент |
| **Расход токенов при ошибке** | Полный | Минимальный |

### Экономия ресурсов

При стриминге вы можете остановить генерацию в любой момент:
- Если ответ уже достаточен — экономите токены
- Если направление неверное — не тратите лимит зря
- Если нужна только часть — получаете её быстрее

## Самоконтроль моделей

Стриминг открывает уникальную возможность — **наблюдать за процессом рассуждения** модели.

### Блок "Thinking"

Многие современные модели (GPT-4, Claude, Gemini 2.5 Pro) поддерживают «расширенное мышление» — они показывают внутренний ход рассуждений перед финальным ответом.

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Блок Thinking** | \`Sparkles\` | Раскрываемая секция с цепочкой рассуждений |
| **Статус** | \`Loader\` | Анимация во время активного размышления |
| **Развернуть** | \`ChevronDown\` | Показать полный текст рассуждений |

### Что даёт просмотр Thinking?

1. **Прозрачность** — понимаете, как модель пришла к выводу
2. **Диагностика** — видите, где рассуждения пошли не так
3. **Обучение** — учитесь формулировать лучшие промпты
4. **Доверие** — проверяете логику, а не только результат

## Элементы управления стримингом

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Индикатор режима** | \`Zap\` | Пульсирующий значок в заголовке панели |
| **Остановить все** | \`Square\` | Останавливает все активные генерации |
| **Счётчик** | — | Число активных стримов рядом с кнопкой |
| **Стоп на карточке** | \`Square\` | Остановка конкретной модели |
| **Fallback-индикатор** | Янтарный | Модель работает в стандартном режиме |

## Советы по работе со стримингом

### Оптимальное использование

1. **Читайте по мере генерации** — не ждите завершения
2. **Останавливайте рано** — если ответ не тот, жмите стоп
3. **Сравнивайте параллельно** — запускайте несколько моделей
4. **Используйте Thinking** — раскрывайте блок рассуждений для сложных задач

### Когда стриминг особенно полезен

| Сценарий | Почему стриминг помогает |
|----------|-------------------------|
| **Длинные ответы** | Читаете сразу, не ждёте минуты |
| **Итеративная работа** | Быстро корректируете направление |
| **Сравнение моделей** | Видите разницу в реальном времени |
| **Отладка промптов** | Понимаете, что модель «думает» |
| **Ограниченный бюджет** | Экономите токены при остановке |

### Чего избегать

- **Не закрывайте вкладку** во время активного стриминга
- **Не отправляйте новые запросы**, пока идёт генерация
- **Не игнорируйте Thinking** — там часто ключ к улучшению промпта

## Fallback-режим

Некоторые модели или ситуации не поддерживают стриминг. В этих случаях система автоматически переключается на стандартный режим.

### Причины fallback

| Причина | Индикатор | Описание |
|---------|-----------|----------|
| **Модель не поддерживает** | Янтарный бейдж | Некоторые модели работают только синхронно |
| **Rate Limit (429)** | Янтарное сообщение | Превышен лимит запросов |
| **Ошибка сервера (500)** | Красный индикатор | Временная проблема провайдера |

> **Совет**: При fallback модель всё равно даст ответ, просто вы увидите его целиком после завершения генерации.`,

      en: `# Streaming Mode

Streaming Mode (Hybrid Streaming) is an advanced way to receive AI model responses in real-time. Instead of waiting for the complete response, you see text as it's being generated.

## Why Use Streaming?

### Perception Speed
You start reading the response immediately, without waiting for generation to complete. This is especially valuable for long responses — while the model finishes the end, you're already studying the beginning.

### Early Error Detection
If the model goes in the wrong direction, you'll see it in the first sentences and can stop generation without wasting time and tokens.

### Parallel Work
In multi-model mode, streaming allows you to see responses from all models simultaneously. You can compare approaches in real-time.

## Efficiency

| Aspect | Without Streaming | With Streaming |
|--------|-------------------|----------------|
| **Time to first token** | 5–30 sec | < 1 sec |
| **Perceived speed** | Long wait | Instant response |
| **Process control** | Only after completion | At any moment |
| **Token cost on error** | Full | Minimal |

### Resource Savings

With streaming, you can stop generation at any moment:
- If the response is sufficient — save tokens
- If the direction is wrong — don't waste your limit
- If you only need part — get it faster

## Model Self-Control

Streaming opens a unique opportunity — **observing the model's reasoning process**.

### Thinking Block

Many modern models (GPT-4, Claude, Gemini 2.5 Pro) support "extended thinking" — they show internal reasoning before the final response.

| Element | Icon | Description |
|---------|------|-------------|
| **Thinking Block** | \`Sparkles\` | Expandable section with reasoning chain |
| **Status** | \`Loader\` | Animation during active thinking |
| **Expand** | \`ChevronDown\` | Show full reasoning text |

### What Does Viewing Thinking Provide?

1. **Transparency** — understand how the model reached its conclusion
2. **Diagnostics** — see where reasoning went wrong
3. **Learning** — learn to formulate better prompts
4. **Trust** — verify the logic, not just the result

## Streaming Controls

| Element | Icon | Description |
|---------|------|-------------|
| **Mode Indicator** | \`Zap\` | Pulsing icon in panel header |
| **Stop All** | \`Square\` | Stops all active generations |
| **Counter** | — | Number of active streams next to button |
| **Card Stop** | \`Square\` | Stop specific model |
| **Fallback Indicator** | Amber | Model working in standard mode |

## Streaming Tips

### Optimal Usage

1. **Read as it generates** — don't wait for completion
2. **Stop early** — if the response isn't right, hit stop
3. **Compare in parallel** — run multiple models
4. **Use Thinking** — expand the reasoning block for complex tasks

### When Streaming is Especially Useful

| Scenario | Why Streaming Helps |
|----------|---------------------|
| **Long responses** | Read immediately, don't wait minutes |
| **Iterative work** | Quickly adjust direction |
| **Model comparison** | See differences in real-time |
| **Prompt debugging** | Understand what the model "thinks" |
| **Limited budget** | Save tokens by stopping |

### What to Avoid

- **Don't close the tab** during active streaming
- **Don't send new requests** while generation is in progress
- **Don't ignore Thinking** — it often holds the key to improving your prompt

## Fallback Mode

Some models or situations don't support streaming. In these cases, the system automatically switches to standard mode.

### Fallback Reasons

| Reason | Indicator | Description |
|--------|-----------|-------------|
| **Model doesn't support** | Amber badge | Some models work only synchronously |
| **Rate Limit (429)** | Amber message | Request limit exceeded |
| **Server Error (500)** | Red indicator | Temporary provider issue |

> **Tip**: With fallback, the model will still respond, you'll just see it all at once after generation completes.`
    }
  },
  // NOTE: Section "roles" was merged into "roles-catalog" for unified role documentation
  {
    id: 'prompt-library',
    titleKey: 'hydrapedia.sections.promptLibrary',
    icon: 'Library',
    content: {
      ru: `# Библиотека промптов

Библиотека промптов позволяет сохранять, организовывать и переиспользовать системные промпты.

## Интерфейс библиотеки

### Панель инструментов

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Новый промпт** | \`Plus\` | Создание нового промпта |
| **Поиск** | \`Search\` | Поиск по названию и тегам |
| **Фильтр по роли** | \`Filter\` | Фильтрация по типу роли |
| **Сортировка** | \`ArrowUpDown\` | По имени / дате / популярности |

### Карточка промпта

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Название** | — | Краткое описание промпта |
| **Роль** | Цветной бейдж | Тип роли |
| **Теги** | \`Tag\` | Ключевые слова для поиска |
| **Счётчик** | \`BarChart\` | Количество использований |
| **Редактировать** | \`Pencil\` | Открыть редактор |
| **Удалить** | \`Trash\` | Удаление промпта |
| **Публичный** | \`Eye\` | Переключатель видимости |

## Создание промпта

### Форма редактирования

| Поле | Описание |
|------|----------|
| **Название** | Краткое описание (до 50 символов) |
| **Описание** | Подробное описание назначения |
| **Роль** | Выбор: \`@assistant\`, \`@critic\`, \`@arbiter\`... |
| **Содержание** | Текст системного промпта |
| **Теги** | Ключевые слова через запятую |
| **Публичный** | Делает промпт доступным другим |

### Структура эффективного промпта

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

## Быстрый выбор в чате

В панели экспертов нажмите на иконку \`BookOpen\` рядом с селектором моделей:

1. Откроется выпадающий список промптов
2. Нажмите на нужный промпт
3. Он автоматически применится к следующему запросу

## Шаринг промптов

1. Откройте промпт на редактирование \`Pencil\`
2. Включите переключатель **«Публичный»** \`Eye\`
3. Промпт станет доступен другим пользователям

> **Совет**: Используйте теги для быстрого поиска промптов по тематике.`,

      en: `# Prompt Library

The prompt library allows you to save, organize, and reuse system prompts.

## Library Interface

### Toolbar

| Element | Icon | Description |
|---------|------|-------------|
| **New Prompt** | \`Plus\` | Create new prompt |
| **Search** | \`Search\` | Search by name and tags |
| **Filter by Role** | \`Filter\` | Filter by role type |
| **Sort** | \`ArrowUpDown\` | By name / date / popularity |

### Prompt Card

| Element | Icon | Description |
|---------|------|-------------|
| **Name** | — | Brief prompt description |
| **Role** | Colored badge | Role type |
| **Tags** | \`Tag\` | Keywords for search |
| **Counter** | \`BarChart\` | Usage count |
| **Edit** | \`Pencil\` | Open editor |
| **Delete** | \`Trash\` | Delete prompt |
| **Public** | \`Eye\` | Visibility toggle |

## Creating a Prompt

### Edit Form

| Field | Description |
|-------|-------------|
| **Name** | Brief description (up to 50 chars) |
| **Description** | Detailed purpose description |
| **Role** | Select: \`@assistant\`, \`@critic\`, \`@arbiter\`... |
| **Content** | System prompt text |
| **Tags** | Keywords separated by comma |
| **Public** | Makes prompt available to others |

### Effective Prompt Structure

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

## Quick Selection in Chat

In the Expert Panel, click the \`BookOpen\` icon next to the model selector:

1. A dropdown list of prompts will open
2. Click on the desired prompt
3. It will automatically apply to the next request

## Sharing Prompts

1. Open the prompt for editing \`Pencil\`
2. Enable the **"Public"** toggle \`Eye\`
3. The prompt will become available to other users

> **Tip**: Use tags for quick prompt search by topic.`
    }
  },
  {
    id: 'tools',
    titleKey: 'hydrapedia.sections.tools',
    icon: 'Wrench',
    content: {
      ru: `# Инструменты

Инструменты расширяют возможности AI-моделей, позволяя им выполнять действия.

## Интерфейс библиотеки инструментов

### Панель инструментов

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Новый инструмент** | \`Plus\` | Создание нового инструмента |
| **Поиск** | \`Search\` | Поиск по названию |
| **Фильтр по типу** | \`Filter\` | Промпт / HTTP |

### Карточка инструмента

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Название** | — | Имя инструмента |
| **Тип** | \`FileText\` / \`Globe\` | Промпт или HTTP API |
| **Описание** | — | Что делает инструмент |
| **Счётчик** | \`BarChart\` | Количество вызовов |
| **Тест** | \`Play\` | Запустить тестирование |
| **Редактировать** | \`Pencil\` | Открыть редактор |
| **Удалить** | \`Trash\` | Удаление инструмента |

## Типы инструментов

### Промпт-инструменты

**Иконка**: \`FileText\`

Текстовые инструкции, которые модель интерпретирует и выполняет.

**Подходят для:**
- Форматирования вывода
- Пошаговых инструкций
- Специализированных задач

### HTTP API инструменты

**Иконка**: \`Globe\`

Реальные вызовы к внешним API.

**Позволяют:**
- Получать данные из интернета
- Взаимодействовать с сервисами
- Выполнять вычисления

## Создание инструмента

### Форма редактирования

| Поле | Описание |
|------|----------|
| **Имя** | Уникальный идентификатор (snake_case) |
| **Отображаемое имя** | Читаемое название |
| **Описание** | Что делает инструмент |
| **Тип** | Промпт или HTTP |
| **Шаблон/Конфиг** | Текст промпта или HTTP-настройки |
| **Параметры** | JSON-схема входных параметров |

### HTTP-инструмент — настройки

| Поле | Описание |
|------|----------|
| **Method** | GET, POST, PUT, DELETE |
| **URL** | Адрес API с переменными \`{{param}}\` |
| **Headers** | Заголовки запроса (JSON) |
| **Body** | Тело запроса для POST/PUT |

\`\`\`json
{
  "method": "GET",
  "url": "https://api.example.com/data?q={{query}}",
  "headers": {
    "Authorization": "Bearer {{apiKey}}"
  }
}
\`\`\`

## Тестирование

### Панель тестирования

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Параметры** | \`FileText\` | Поля для ввода тестовых значений |
| **Выполнить** | \`Play\` | Запуск теста |
| **Результат** | — | Вывод ответа API |
| **Статус** | \`CheckCircle\` / \`XCircle\` | Успех или ошибка |
| **Время** | \`Clock\` | Время выполнения |

## Безопасность

### SSRF-защита

При создании HTTP-инструментов система валидирует URL для предотвращения SSRF-атак:

| Блокируется | Пример |
|-------------|--------|
| Localhost | \`localhost\`, \`127.0.0.1\` |
| Внутренние сети | \`10.x.x.x\`, \`192.168.x.x\`, \`172.16.x.x\` |
| Невалидные схемы | \`file://\`, \`ftp://\` |

### Таймауты и лимиты

| Параметр | Значение |
|----------|----------|
| **Таймаут запроса** | 30 секунд |
| **Макс. размер ответа** | 1 МБ |

> **Важно**: HTTP-инструменты требуют корректной настройки CORS.`,

      en: `# Tools

Tools extend AI model capabilities, allowing them to perform actions.

## Tools Library Interface

### Toolbar

| Element | Icon | Description |
|---------|------|-------------|
| **New Tool** | \`Plus\` | Create new tool |
| **Search** | \`Search\` | Search by name |
| **Filter by Type** | \`Filter\` | Prompt / HTTP |

### Tool Card

| Element | Icon | Description |
|---------|------|-------------|
| **Name** | — | Tool name |
| **Type** | \`FileText\` / \`Globe\` | Prompt or HTTP API |
| **Description** | — | What the tool does |
| **Counter** | \`BarChart\` | Call count |
| **Test** | \`Play\` | Run test |
| **Edit** | \`Pencil\` | Open editor |
| **Delete** | \`Trash\` | Delete tool |

## Tool Types

### Prompt Tools

**Icon**: \`FileText\`

Text instructions that the model interprets and executes.

**Suitable for:**
- Output formatting
- Step-by-step instructions
- Specialized tasks

### HTTP API Tools

**Icon**: \`Globe\`

Real calls to external APIs.

**Allow you to:**
- Fetch data from the internet
- Interact with services
- Perform calculations

## Creating a Tool

### Edit Form

| Field | Description |
|-------|-------------|
| **Name** | Unique identifier (snake_case) |
| **Display Name** | Readable name |
| **Description** | What the tool does |
| **Type** | Prompt or HTTP |
| **Template/Config** | Prompt text or HTTP settings |
| **Parameters** | JSON schema of input params |

### HTTP Tool — Settings

| Field | Description |
|-------|-------------|
| **Method** | GET, POST, PUT, DELETE |
| **URL** | API address with variables \`{{param}}\` |
| **Headers** | Request headers (JSON) |
| **Body** | Request body for POST/PUT |

\`\`\`json
{
  "method": "GET",
  "url": "https://api.example.com/data?q={{query}}",
  "headers": {
    "Authorization": "Bearer {{apiKey}}"
  }
}
\`\`\`

## Testing

### Testing Panel

| Element | Icon | Description |
|---------|------|-------------|
| **Parameters** | \`FileText\` | Fields for test values |
| **Execute** | \`Play\` | Run test |
| **Result** | — | API response output |
| **Status** | \`CheckCircle\` / \`XCircle\` | Success or error |
| **Time** | \`Clock\` | Execution time |

## Security

### SSRF Protection

When creating HTTP tools, the system validates URLs to prevent SSRF attacks:

| Blocked | Example |
|---------|---------|
| Localhost | \`localhost\`, \`127.0.0.1\` |
| Internal Networks | \`10.x.x.x\`, \`192.168.x.x\`, \`172.16.x.x\` |
| Invalid Schemes | \`file://\`, \`ftp://\` |

### Timeouts and Limits

| Parameter | Value |
|-----------|-------|
| **Request Timeout** | 30 seconds |
| **Max Response Size** | 1 MB |

> **Important**: HTTP tools require proper CORS configuration.`
    }
  },
  {
    id: 'flow-editor',
    titleKey: 'hydrapedia.sections.flowEditor',
    icon: 'GitBranch',
    content: {
      ru: `# Редактор потоков мысли

Визуальный инструмент для проектирования сложных цепочек обработки данных.

## Интерфейс редактора

### Верхняя панель

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Название** | \`FileText\` | Имя диаграммы (редактируемое) |
| **Отменить** | \`Undo\` | Отмена последнего действия (Ctrl+Z) |
| **Повторить** | \`Redo\` | Повтор отменённого (Ctrl+Y / Ctrl+Shift+Z) |
| **Авто-раскладка** | \`LayoutGrid\` | Автоматическое выравнивание (Dagre) |
| **Сохранить** | \`Save\` | Сохранение изменений |
| **Экспорт** | \`Download\` | Экспорт в PNG/SVG/JSON/PDF/Mermaid |
| **Назад** | \`ArrowLeft\` | Возврат к списку диаграмм |

### История изменений (Undo/Redo)

Редактор поддерживает до **50 шагов** истории:

| Действие | Клавиша | Описание |
|----------|---------|----------|
| **Отменить** | \`Ctrl+Z\` | Вернуть предыдущее состояние |
| **Повторить** | \`Ctrl+Y\` или \`Ctrl+Shift+Z\` | Восстановить отменённое |

### Авто-раскладка (Dagre)

Кнопка \`LayoutGrid\` автоматически выравнивает узлы:

| Режим | Описание |
|-------|----------|
| **Горизонтальная** | Слева направо (LR) |
| **Вертикальная** | Сверху вниз (TB) |

> **Совет**: Используйте авто-раскладку после добавления нескольких узлов для упорядочивания диаграммы.

### Левая панель — Библиотека узлов

Панель содержит все доступные типы узлов, сгруппированные по категориям.

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Категория «Базовые»** | \`Zap\` | Input, Output, Prompt, Model |
| **Категория «Логика»** | \`GitBranch\` | Condition, Switch, Loop, Delay |
| **Категория «Данные»** | \`RefreshCw\` | Transform, Filter, Merge, Split |
| **Категория «Интеграции»** | \`Plug\` | API, Database, Storage |
| **Категория «AI»** | \`Brain\` | Embedding, Classifier, Memory, Tool |
| **Узел (перетаскивание)** | — | Перетащите узел на холст для добавления |

### Холст (Canvas)

Центральная рабочая область для создания потоков.

| Действие | Клавиша/Жест | Описание |
|----------|--------------|----------|
| **Добавить узел** | Перетаскивание | Перетащите из левой панели |
| **Выбрать узел** | Клик | Открывает панель свойств справа |
| **Соединить узлы** | Перетаскивание точки | Тяните от выхода к входу |
| **Масштаб** | Scroll / Pinch | Увеличение и уменьшение |
| **Панорама** | Перетаскивание холста | Перемещение области просмотра |
| **Удалить** | \`Delete\` / \`Backspace\` | Удаление выбранного элемента |
| **Множественный выбор** | \`Shift\` + клик | Выбор нескольких узлов |

### Правая панель — Свойства узла

Панель редактирования параметров выбранного узла.

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Заголовок** | \`Settings\` | Тип выбранного узла |
| **Поле «Имя»** | \`Type\` | Уникальное имя узла |
| **Параметры** | — | Настройки в зависимости от типа узла |
| **Входы** | \`ArrowRight\` | Точки подключения для входных данных |
| **Выходы** | \`ArrowLeft\` | Точки подключения для выходных данных |
| **Удалить узел** | \`Trash\` | Удаление текущего узла |

## Типы узлов

### Базовые

| Узел | Иконка | Назначение |
|------|--------|------------|
| **Input** | \`ArrowRight\` | Точка входа данных |
| **Output** | \`ArrowLeft\` | Точка вывода результата |
| **Prompt** | \`FileText\` | Системный промпт |
| **Model** | \`Bot\` | Вызов языковой модели |

### Логика

| Узел | Иконка | Назначение |
|------|--------|------------|
| **Condition** | \`HelpCircle\` | Ветвление (if/else) |
| **Switch** | \`GitBranch\` | Множественное ветвление |
| **Loop** | \`RefreshCw\` | Итерация по массиву |
| **Delay** | \`Timer\` | Задержка выполнения |

### Данные

| Узел | Иконка | Назначение |
|------|--------|------------|
| **Transform** | \`Wrench\` | Преобразование данных |
| **Filter** | \`Filter\` | Фильтрация по условию |
| **Merge** | \`Merge\` | Объединение потоков |
| **Split** | \`Scissors\` | Разделение на подпотоки |

### Интеграции

| Узел | Иконка | Назначение |
|------|--------|------------|
| **API** | \`Globe\` | HTTP-запросы |
| **Database** | \`Database\` | CRUD-операции |
| **Storage** | \`HardDrive\` | Файловые операции |

### AI-специфичные

| Узел | Иконка | Назначение |
|------|--------|------------|
| **Embedding** | \`Hash\` | Векторные представления |
| **Classifier** | \`Tag\` | Классификация текста |
| **Memory** | \`Brain\` | Долговременная память |
| **Tool** | \`Wrench\` | Вызов инструмента |

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

| Формат | Иконка | Назначение |
|--------|--------|------------|
| **PNG** | \`Image\` | Для документации |
| **SVG** | \`FileCode\` | Для редактирования |
| **JSON** | \`FileJson\` | Для программного использования |
| **PDF** | \`FileText\` | Для печати и отчётов |
| **Mermaid** | \`GitBranch\` | Текстовый формат диаграмм |

## Правила соединений

Редактор валидирует соединения между узлами:

| Источник | Допустимые цели |
|----------|-----------------|
| **Input** | Prompt, Model, Filter, Transform |
| **Prompt** | Model |
| **Model** | Output, Condition, Transform, Memory |
| **Classifier** | Condition, Switch |
| **Output** | — (только входящие) |
| **Group** | — (несоединяемый контейнер) |

### Цветовая кодировка связей

| Тип данных | Цвет |
|------------|------|
| Текст | Синий |
| JSON | Зелёный |
| Файлы | Фиолетовый |
| Сигналы | Оранжевый |
| Обратная связь | Пунктир, оранжевый |

## Интеграция с чатом

Диаграммы из редактора потоков можно прикреплять к запросам в Панели экспертов:

1. Нажмите \`Paperclip\` в поле ввода
2. Выберите **Диаграмма Mermaid** → **Из библиотеки потоков**
3. Наведите на диаграмму для просмотра превью
4. Кликните для прикрепления к сообщению

Диаграмма появится как карточка-превью рядом с полем ввода. AI-модели получат её структуру для анализа.

> **Совет**: Используйте эту функцию для обсуждения архитектуры потоков с AI.`,

      en: `# Thought Flow Editor

A visual tool for designing complex data processing chains.

## Editor Interface

### Top Panel

| Element | Icon | Description |
|---------|------|-------------|
| **Name** | \`FileText\` | Diagram name (editable) |
| **Undo** | \`Undo\` | Undo last action (Ctrl+Z) |
| **Redo** | \`Redo\` | Redo undone action (Ctrl+Y / Ctrl+Shift+Z) |
| **Auto Layout** | \`LayoutGrid\` | Automatic alignment (Dagre) |
| **Save** | \`Save\` | Save changes |
| **Export** | \`Download\` | Export to PNG/SVG/JSON/PDF/Mermaid |
| **Back** | \`ArrowLeft\` | Return to diagram list |

### History (Undo/Redo)

The editor supports up to **50 history steps**:

| Action | Key | Description |
|--------|-----|-------------|
| **Undo** | \`Ctrl+Z\` | Return to previous state |
| **Redo** | \`Ctrl+Y\` or \`Ctrl+Shift+Z\` | Restore undone action |

### Auto Layout (Dagre)

The \`LayoutGrid\` button automatically aligns nodes:

| Mode | Description |
|------|-------------|
| **Horizontal** | Left to right (LR) |
| **Vertical** | Top to bottom (TB) |

> **Tip**: Use auto layout after adding multiple nodes to organize the diagram.

### Left Panel — Node Library

The panel contains all available node types, grouped by category.

| Element | Icon | Description |
|---------|------|-------------|
| **"Basic" Category** | \`Zap\` | Input, Output, Prompt, Model |
| **"Logic" Category** | \`GitBranch\` | Condition, Switch, Loop, Delay |
| **"Data" Category** | \`RefreshCw\` | Transform, Filter, Merge, Split |
| **"Integrations" Category** | \`Plug\` | API, Database, Storage |
| **"AI" Category** | \`Brain\` | Embedding, Classifier, Memory, Tool |
| **Node (drag)** | — | Drag node to canvas to add |

### Canvas

Central workspace for creating flows.

| Action | Key/Gesture | Description |
|--------|-------------|-------------|
| **Add node** | Drag | Drag from left panel |
| **Select node** | Click | Opens properties panel on right |
| **Connect nodes** | Drag handle | Drag from output to input |
| **Zoom** | Scroll / Pinch | Zoom in and out |
| **Pan** | Drag canvas | Move viewport |
| **Delete** | \`Delete\` / \`Backspace\` | Delete selected element |
| **Multi-select** | \`Shift\` + click | Select multiple nodes |

### Right Panel — Node Properties

Panel for editing parameters of the selected node.

| Element | Icon | Description |
|---------|------|-------------|
| **Header** | \`Settings\` | Type of selected node |
| **Name Field** | \`Type\` | Unique node name |
| **Parameters** | — | Settings depending on node type |
| **Inputs** | \`ArrowRight\` | Connection points for input data |
| **Outputs** | \`ArrowLeft\` | Connection points for output data |
| **Delete Node** | \`Trash\` | Delete current node |

## Node Types

### Basic

| Node | Icon | Purpose |
|------|------|---------|
| **Input** | \`ArrowRight\` | Data entry point |
| **Output** | \`ArrowLeft\` | Result output point |
| **Prompt** | \`FileText\` | System prompt |
| **Model** | \`Bot\` | Language model call |

### Logic

| Node | Icon | Purpose |
|------|------|---------|
| **Condition** | \`HelpCircle\` | Branching (if/else) |
| **Switch** | \`GitBranch\` | Multiple branching |
| **Loop** | \`RefreshCw\` | Array iteration |
| **Delay** | \`Timer\` | Execution delay |

### Data

| Node | Icon | Purpose |
|------|------|---------|
| **Transform** | \`Wrench\` | Data transformation |
| **Filter** | \`Filter\` | Conditional filtering |
| **Merge** | \`Merge\` | Stream merging |
| **Split** | \`Scissors\` | Splitting into substreams |

### Integrations

| Node | Icon | Purpose |
|------|------|---------|
| **API** | \`Globe\` | HTTP requests |
| **Database** | \`Database\` | CRUD operations |
| **Storage** | \`HardDrive\` | File operations |

### AI-Specific

| Node | Icon | Purpose |
|------|------|---------|
| **Embedding** | \`Hash\` | Vector representations |
| **Classifier** | \`Tag\` | Text classification |
| **Memory** | \`Brain\` | Long-term memory |
| **Tool** | \`Wrench\` | Tool invocation |

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

| Format | Icon | Purpose |
|--------|------|---------|
| **PNG** | \`Image\` | For documentation |
| **SVG** | \`FileCode\` | For editing |
| **JSON** | \`FileJson\` | For programmatic use |
| **PDF** | \`FileText\` | For printing and reports |
| **Mermaid** | \`GitBranch\` | Text diagram format |

## Connection Rules

The editor validates connections between nodes:

| Source | Allowed Targets |
|--------|-----------------|
| **Input** | Prompt, Model, Filter, Transform |
| **Prompt** | Model |
| **Model** | Output, Condition, Transform, Memory |
| **Classifier** | Condition, Switch |
| **Output** | — (incoming only) |
| **Group** | — (non-connectable container) |

### Edge Color Coding

| Data Type | Color |
|-----------|-------|
| Text | Blue |
| JSON | Green |
| Files | Purple |
| Signals | Orange |
| Feedback | Dashed, orange |

## Chat Integration

Diagrams from the flow editor can be attached to requests in the Expert Panel:

1. Click \`Paperclip\` in the input field
2. Select **Mermaid Diagram** → **From Flow Library**
3. Hover over a diagram to see preview
4. Click to attach to message

The diagram will appear as a preview card next to the input field. AI models will receive its structure for analysis.

> **Tip**: Use this feature to discuss flow architecture with AI.`
    }
  },
  {
    id: 'model-ratings',
    titleKey: 'hydrapedia.sections.modelRatings',
    icon: 'BarChart3',
    content: {
      ru: `# Рейтинг моделей

Система отслеживания эффективности AI-моделей на основе вашего использования.

## Интерфейс страницы рейтинга

### Панель фильтров

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Период** | \`Calendar\` | Выбор временного диапазона |
| **Провайдер** | \`Building\` | Фильтр по провайдеру |
| **Сортировка** | \`ArrowUpDown\` | По брейнам / использованию |

### Таблица моделей

| Колонка | Описание |
|---------|----------|
| **Модель** | Название модели с иконкой провайдера |
| **Запросов** | Общее количество вызовов |
| **Брейны** | Количество наград за полезные ответы |
| **Отклонения** | Количество отклонённых ответов |
| **Эффективность** | Процент брейнов от общего числа |
| **Тренд** | \`TrendingUp\` / \`TrendingDown\` |

### Детальная карточка модели

| Элемент | Описание |
|---------|----------|
| **График использования** | Линейный график по дням |
| **Средний размер ответа** | Количество токенов |
| **Типичные задачи** | Категории запросов |
| **Рекомендации** | Советы по использованию |

## Метрики

### Использование
- **Количество запросов** — сколько раз модель была вызвана
- **Общие токены** — суммарное количество токенов
- **Средний размер ответа** — средняя длина ответов

### Оценки

| Действие | Иконка | Эффект |
|----------|--------|--------|
| **Добавить брейн** | \`Brain\` | +1 к рейтингу модели |
| **Отклонить** | \`X\` | +1 к счётчику отклонений |

## Как оценивать

После получения ответа модели:

1. Если ответ полезен — нажмите \`Brain\`
2. Если ответ не подошёл — нажмите \`X\`

Эти оценки формируют персональный рейтинг моделей.

## Интерпретация данных

| Показатель | Что означает |
|------------|--------------|
| Высокий % брейнов | Модель хорошо подходит для ваших задач |
| Много отклонений | Возможно, нужен другой промпт |
| Большие ответы | Модель детальна (или многословна) |
| Стабильный тренд | Надёжная модель для данного типа задач |

> **Совет**: Используйте рейтинг для выбора оптимальной модели.`,

      en: `# Model Ratings

A system for tracking AI model effectiveness based on your usage.

## Ratings Page Interface

### Filter Panel

| Element | Icon | Description |
|---------|------|-------------|
| **Period** | \`Calendar\` | Select time range |
| **Provider** | \`Building\` | Filter by provider |
| **Sort** | \`ArrowUpDown\` | By brains / usage |

### Models Table

| Column | Description |
|--------|-------------|
| **Model** | Model name with provider icon |
| **Requests** | Total call count |
| **Brains** | Reward count for useful responses |
| **Dismissals** | Rejected response count |
| **Efficiency** | Brain percentage of total |
| **Trend** | \`TrendingUp\` / \`TrendingDown\` |

### Detailed Model Card

| Element | Description |
|---------|-------------|
| **Usage Chart** | Line chart by day |
| **Average Response Size** | Token count |
| **Typical Tasks** | Request categories |
| **Recommendations** | Usage tips |

## Metrics

### Usage
- **Request count** — how many times the model was called
- **Total tokens** — total token count
- **Average response size** — average length of responses

### Ratings

| Action | Icon | Effect |
|--------|------|--------|
| **Add brain** | \`Brain\` | +1 to model rating |
| **Dismiss** | \`X\` | +1 to dismissal counter |

## How to Rate

After receiving a model response:

1. If the response is useful — click \`Brain\`
2. If the response didn't fit — click \`X\`

These ratings form a personal model ranking.

## Data Interpretation

| Indicator | What it means |
|-----------|---------------|
| High brain % | Model works well for your tasks |
| Many dismissals | May need a different prompt |
| Large responses | Model is detailed (or verbose) |
| Stable trend | Reliable model for this task type |

> **Tip**: Use the rating to choose the optimal model.`
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

### Примеры промптов

**Плохо:**
> Напиши код

**Хорошо:**
> Ты — senior Python разработчик. Напиши функцию для парсинга JSON-файла с обработкой ошибок. Используй type hints. Добавь docstring.

## Работа с несколькими моделями

### Когда использовать ансамбль

**Используйте несколько моделей для:**
- Сложных аналитических задач
- Генерации креативного контента
- Код-ревью и отладки
- Принятия важных решений

**Одной модели достаточно для:**
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

## Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| **Enter** | Отправить сообщение |
| **Shift + Enter** | Новая строка |
| **Ctrl/Cmd + V** | Вставить изображение из буфера |
| **Escape** | Закрыть панель консультанта |
| **Ctrl/Cmd + K** | Открыть поиск в Гидропедии |
| **Клик на превью Mermaid** | Увеличить до полноэкранного просмотра |

## Экономия токенов

1. **Краткие промпты** — избегайте повторов
2. **Конкретные вопросы** — меньше контекста = меньше токенов
3. **Правильные модели** — не используйте GPT-4 для простых задач
4. **Кэширование** — используйте сохранённые промпты

## Типичные ошибки

| Ошибка | Решение |
|--------|---------|
| Модель не отвечает | Увеличьте таймаут \`Clock\` |
| Ответ слишком короткий | Увеличьте max_tokens |
| Ответ не по теме | Уточните системный промпт |
| Нет доступа к модели | Проверьте API-ключ в профиле |

> **Главный совет**: Экспериментируйте! Попробуйте разные модели и промпты.`,

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

### Prompt Examples

**Bad:**
> Write code

**Good:**
> You are a senior Python developer. Write a function for parsing a JSON file with error handling. Use type hints. Add docstring.

## Working with Multiple Models

### When to Use an Ensemble

**Use multiple models for:**
- Complex analytical tasks
- Creative content generation
- Code review and debugging
- Important decision making

**One model is enough for:**
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

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Enter** | Send message |
| **Shift + Enter** | New line |
| **Ctrl/Cmd + V** | Paste image from clipboard |
| **Escape** | Close consultant panel |
| **Ctrl/Cmd + K** | Open search in Hydrapedia |
| **Click on Mermaid preview** | Enlarge to full-screen view |

## Token Economy

1. **Brief prompts** — avoid repetition
2. **Specific questions** — less context = fewer tokens
3. **Right models** — don't use GPT-4 for simple tasks
4. **Caching** — use saved prompts

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| Model not responding | Increase timeout \`Clock\` |
| Response too short | Increase max_tokens |
| Response off-topic | Refine system prompt |
| No model access | Check API key in profile |

> **Main tip**: Experiment! Try different models and prompts.`
    }
  },
  {
    id: 'tasks',
    titleKey: 'hydrapedia.sections.tasks',
    icon: 'ListTodo',
    content: {
      ru: `# Задачи (Сессии)

Страница «Задачи» — центральный хаб управления сессиями диалогов с AI.

## Концепция

**Задача** (Task) — это контейнер для:
- Истории сообщений
- Настроек выбранных моделей
- Конфигурации ролей и промптов

Каждая задача изолирована: переключаясь между задачами, вы получаете разный контекст.

## Интерфейс страницы

### Панель инструментов

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Новая задача** | \`Plus\` | Создание новой сессии |
| **Поиск** | \`Search\` | Поиск по названию |
| **Фильтр** | \`Filter\` | Фильтрация по статусу |

### Карточка задачи

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Название** | — | Заголовок задачи (редактируемый) |
| **Дата** | \`Calendar\` | Время последнего обновления |
| **Количество сообщений** | \`MessageSquare\` | Счётчик диалога |
| **Настройки моделей** | \`Settings\` | Открывает Sheet-панель |
| **Открыть** | Клик | Переход в Панель экспертов |
| **Удалить** | \`Trash\` | Удаление задачи |

## Настройка моделей

При клике на \`Settings\` открывается выезжающая панель (Sheet):

### Мульти-селектор моделей

| Категория | Описание |
|-----------|----------|
| **Lovable AI** | Бесплатные модели через Lovable Gateway |
| **Free Models** | Бесплатные модели с ограничениями |
| **Groq (Fast)** | Быстрые модели Groq |
| **Personal Keys** | Модели по вашим API-ключам |

**Функции:**
- Чекбоксы для индивидуального выбора
- «Выбрать все» для каждой группы
- Высота до 60vh для длинных списков

### Per-Model Settings

Для каждой выбранной модели можно настроить:

| Параметр | Описание |
|----------|----------|
| **Роль** | \`@assistant\`, \`@critic\`, \`@arbiter\`... |
| **Температура** | 0.0–2.0 |
| **Max Tokens** | 256–16384 |
| **Системный промпт** | Кастомные инструкции |

## Сохранение конфигурации

Все настройки автоматически сохраняются в поле \`session_config\` базы данных.

При следующем открытии задачи конфигурация восстанавливается.

> **Совет**: Создавайте отдельные задачи для разных проектов с преднастроенными моделями.`,

      en: `# Tasks (Sessions)

The Tasks page is the central hub for managing AI dialogue sessions.

## Concept

A **Task** is a container for:
- Message history
- Selected model settings
- Role and prompt configuration

Each task is isolated: switching between tasks gives you different context.

## Page Interface

### Toolbar

| Element | Icon | Description |
|---------|------|-------------|
| **New Task** | \`Plus\` | Create new session |
| **Search** | \`Search\` | Search by name |
| **Filter** | \`Filter\` | Filter by status |

### Task Card

| Element | Icon | Description |
|---------|------|-------------|
| **Name** | — | Task title (editable) |
| **Date** | \`Calendar\` | Last update time |
| **Message Count** | \`MessageSquare\` | Dialogue counter |
| **Model Settings** | \`Settings\` | Opens Sheet panel |
| **Open** | Click | Go to Expert Panel |
| **Delete** | \`Trash\` | Delete task |

## Model Configuration

Clicking \`Settings\` opens a slide-out Sheet panel:

### Multi-Selector

| Category | Description |
|----------|-------------|
| **Lovable AI** | Free models via Lovable Gateway |
| **Free Models** | Free models with limitations |
| **Groq (Fast)** | Fast Groq models |
| **Personal Keys** | Models using your API keys |

**Features:**
- Checkboxes for individual selection
- "Select all" for each group
- Height up to 60vh for long lists

### Per-Model Settings

For each selected model you can configure:

| Parameter | Description |
|-----------|-------------|
| **Role** | \`@assistant\`, \`@critic\`, \`@arbiter\`... |
| **Temperature** | 0.0–2.0 |
| **Max Tokens** | 256–16384 |
| **System Prompt** | Custom instructions |

## Saving Configuration

All settings are automatically saved to the \`session_config\` database field.

When reopening a task, the configuration is restored.

> **Tip**: Create separate tasks for different projects with preconfigured models.`
    }
  },
  {
    id: 'roles-catalog',
    titleKey: 'hydrapedia.sections.rolesCatalog',
    icon: 'Users',
    content: {
      ru: `# Каталог AI-ролей

AI-Hydra включает 11 специализированных ролей, разделённых на две категории: **Эксперты** и **Технический персонал**.

## Эксперты (8 ролей)

Участвуют в коллегиальных обсуждениях и экспертных оценках.

### \`@assistant\` Ассистент

Универсальный эксперт широкого профиля.

**Когда использовать:**
- Генерация контента
- Ответы на вопросы
- Объяснение концепций
- Написание кода

---

### \`@critic\` Критик

Поиск слабых мест и противоречий.

**Когда использовать:**
- Code review
- Анализ аргументации
- Проверка на ошибки
- Выявление рисков

---

### \`@arbiter\` Арбитр

Синтез и финальное решение.

**Когда использовать:**
- Принятие решений
- Разрешение конфликтов
- Итоговые выводы
- Балансировка точек зрения

---

### \`@consultant\` Консультант

Глубокая разовая экспертиза.

**Когда использовать:**
- D-Chat консультации
- Детальный анализ
- Альтернативные решения
- Пошаговые разъяснения

---

### \`@moderator\` Модератор

Управление дискуссией.

**Когда использовать:**
- Агрегация контекста в D-Chat
- Подведение итогов
- Структурирование обсуждения
- Выделение ключевых моментов

---

### \`@advisor\` Советник

Стратегические рекомендации.

**Когда использовать:**
- Долгосрочное планирование
- Оценка последствий
- Выбор стратегии
- Рекомендации по развитию

---

### \`@analyst\` Аналитик

Глубокий анализ данных.

**Когда использовать:**
- Выявление трендов
- Статистический анализ
- Структурированные отчёты
- Обоснование выводов

---

### \`@webhunter\` Веб-охотник

Поиск информации в интернете.

**Когда использовать:**
- Поиск актуальной информации
- Проверка фактов
- Сбор источников
- Мониторинг новостей

---

## Технический персонал (3 роли)

Не участвуют в коллегиальных обсуждениях. Служат персональными помощниками пользователя.

### \`@archivist\` Архивариус

Систематизация и архивирование.

**Специализация:**
- Управление библиотеками промптов
- Работа с эмбеддинг-памятью
- Создание структурированных сводок
- Каталогизация информации

---

### \`@promptengineer\` Промпт-инженер

Оптимизация промптов.

**Специализация:**
- Создание эффективных инструкций
- Анализ структуры промптов
- Оптимизация для конкретных задач
- Тестирование вариантов

---

### \`@flowregulator\` Логистик потоков

Проектирование data-flow.

**Специализация:**
- Архитектура потоков данных
- Оптимизация пайплайнов
- Выявление узких мест
- Проектирование логических цепочек

---

## Индикаторы ролей в интерфейсе

### В списке сообщений
- Цветной кружок слева от имени модели
- Иконка роли внутри кружка
- Название роли мелким текстом

### В навигаторе чата
- Цветной фон узла соответствует роли
- Иконка роли в центре узла
- При наведении — подсказка с названием

### Назначение ролей

Роли назначаются на основе:
- Системного промпта модели (в библиотеке промптов)
- Контекста запроса
- Настроек по умолчанию

---

## Страница «Штат специалистов»

Доступна по адресу \`/staff-roles\`. Интерфейс:

| Элемент | Описание |
|---------|----------|
| **Левая панель** | Таблица ролей с группировкой |
| **Правая панель** | Детали выбранной роли |
| **Редактор** | Изменение системного промпта |
| **Интеграция** | Сохранение в Библиотеку промптов |

> **Совет**: Используйте страницу «Штат» для изучения ролей и создания кастомных промптов.

---

## Попробуйте роли в действии

\`\`\`
:::playground:::
\`\`\`
`,

      en: `# AI Roles Catalog

AI-Hydra includes 11 specialized roles divided into two categories: **Experts** and **Technical Staff**.

## Experts (8 roles)

Participate in collegial discussions and expert evaluations.

### \`@assistant\` Assistant

Versatile general-purpose expert.

**When to use:**
- Content generation
- Answering questions
- Explaining concepts
- Code writing

---

### \`@critic\` Critic

Finding weaknesses and contradictions.

**When to use:**
- Code review
- Argumentation analysis
- Error checking
- Risk identification

---

### \`@arbiter\` Arbiter

Synthesis and final decision.

**When to use:**
- Decision making
- Conflict resolution
- Final conclusions
- Balancing viewpoints

---

### \`@consultant\` Consultant

Deep one-time expertise.

**When to use:**
- D-Chat consultations
- Detailed analysis
- Alternative solutions
- Step-by-step explanations

---

### \`@moderator\` Moderator

Discussion management.

**When to use:**
- Context aggregation in D-Chat
- Summarizing discussions
- Structuring conversations
- Highlighting key points

---

### \`@advisor\` Advisor

Strategic recommendations.

**When to use:**
- Long-term planning
- Impact assessment
- Strategy selection
- Development recommendations

---

### \`@analyst\` Analyst

Deep data analysis.

**When to use:**
- Trend identification
- Statistical analysis
- Structured reports
- Evidence-based conclusions

---

### \`@webhunter\` Webhunter

Internet information search.

**When to use:**
- Finding current information
- Fact checking
- Source collection
- News monitoring

---

## Technical Staff (3 roles)

Do not participate in collegial discussions. Serve as personal user assistants.

### \`@archivist\` Archivist

Systematization and archiving.

**Specialization:**
- Prompt library management
- Embedding memory work
- Creating structured summaries
- Information cataloging

---

### \`@promptengineer\` Prompt Engineer

Prompt optimization.

**Specialization:**
- Creating effective instructions
- Prompt structure analysis
- Task-specific optimization
- Variant testing

---

### \`@flowregulator\` Flow Logistician

Data-flow design.

**Specialization:**
- Data flow architecture
- Pipeline optimization
- Bottleneck identification
- Logic chain design

---

## Role Indicators in Interface

### In Message List
- Colored circle to the left of model name
- Role icon inside the circle
- Role name in small text

### In Chat Navigator
- Colored node background matches role
- Role icon in center of node
- Tooltip with name on hover

### Role Assignment

Roles are assigned based on:
- Model's system prompt (in prompt library)
- Request context
- Default settings

---

## AI Staff Page

Available at \`/staff-roles\`. Interface:

| Element | Description |
|---------|-------------|
| **Left Panel** | Grouped roles table |
| **Right Panel** | Selected role details |
| **Editor** | System prompt modification |
| **Integration** | Save to Prompt Library |

> **Tip**: Use the Staff page to study roles and create custom prompts.

---

## Try Roles in Action

\`\`\`
:::playground:::
\`\`\`
`
    }
  },
  {
    id: 'd-chat-moderator',
    titleKey: 'hydrapedia.sections.dChatModerator',
    icon: 'MessageSquareMore',
    content: {
      ru: `# D-Chat: Режим Модератор

Режим **Модератор** в D-Chat позволяет агрегировать контекст всей сессии и получить структурированную сводку.

## Концепция

В отличие от режимов \`@assistant\`/\`@critic\`/\`@arbiter\`, которые отвечают на отдельный вопрос, **Модератор**:

1. Собирает все ответы экспертов из текущего блока
2. Анализирует их целостность
3. Формирует структурированную сводку
4. Выделяет консенсус и расхождения

## Когда использовать

| Ситуация | Рекомендация |
|----------|--------------|
| Много ответов от разных моделей | ✓ Модератор |
| Нужна итоговая сводка | ✓ Модератор |
| Уточняющий вопрос по одному ответу | ✗ Специалист |
| Критический анализ одного ответа | ✗ Критик |

## Как использовать

### Активация режима

1. Откройте D-Chat панель справа
2. В селекторе режима выберите \`Moderator\` (\`Gavel\`)
3. Нажмите на иконку \`Lightbulb\` в блоке сообщений

### Что происходит

| Шаг | Описание |
|-----|----------|
| 1 | Система собирает запрос пользователя |
| 2 | Добавляет все ответы экспертов из блока |
| 3 | Формирует контекст для модератора |
| 4 | Модель анализирует и создаёт сводку |

### Формат сводки

Модератор обычно выдаёт:

\`\`\`markdown
## Обзор ответов

### Консенсус
- [Общие выводы всех экспертов]

### Расхождения
- [Точки, где мнения разошлись]

### Рекомендация
[Взвешенное финальное заключение]
\`\`\`

## Интеграция с основным чатом

### Копирование сводки

1. После получения сводки нажмите \`Copy to Chat\`
2. Сводка вставится **сразу после блока ответов**
3. Сохранится привязка к исходным сообщениям

### Позиционирование

Сводка модератора вставляется с точным timestamp (последний ответ + 1ms), что гарантирует:
- Правильный хронологический порядок
- Визуальную связь с обсуждаемым блоком
- Сохранение контекста в истории

## Индикаторы

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Режим Модератор** | \`Gavel\` | Синий бейдж в селекторе |
| **Агрегация** | \`RefreshCw\` | Индикатор сбора контекста |
| **Счётчик** | — | «Анализ N ответов» |
| **Статус** | \`Loader\` | «Модератор анализирует...» |

> **Совет**: Используйте режим Модератор после получения ответов от 3+ моделей для быстрого синтеза.`,

      en: `# D-Chat: Moderator Mode

**Moderator** mode in D-Chat allows you to aggregate the entire session context and get a structured summary.

## Concept

Unlike \`@assistant\`/\`@critic\`/\`@arbiter\` modes that answer individual questions, **Moderator**:

1. Collects all expert responses from the current block
2. Analyzes their coherence
3. Forms a structured summary
4. Highlights consensus and disagreements

## When to Use

| Situation | Recommendation |
|-----------|----------------|
| Many responses from different models | ✓ Moderator |
| Need a final summary | ✓ Moderator |
| Follow-up question on one response | ✗ Expert |
| Critical analysis of one response | ✗ Critic |

## How to Use

### Activation

1. Open the D-Chat panel on the right
2. In the mode selector, choose \`Moderator\` (\`Gavel\`)
3. Click the \`Lightbulb\` icon in the message block

### What Happens

| Step | Description |
|------|-------------|
| 1 | System collects user query |
| 2 | Adds all expert responses from the block |
| 3 | Forms context for moderator |
| 4 | Model analyzes and creates summary |

### Summary Format

The moderator typically outputs:

\`\`\`markdown
## Response Overview

### Consensus
- [Common conclusions from all experts]

### Disagreements
- [Points where opinions differed]

### Recommendation
[Balanced final conclusion]
\`\`\`

## Integration with Main Chat

### Copying Summary

1. After receiving the summary, click \`Copy to Chat\`
2. The summary inserts **right after the response block**
3. Maintains link to source messages

### Positioning

The moderator summary is inserted with a precise timestamp (last response + 1ms), ensuring:
- Correct chronological order
- Visual connection to discussed block
- Context preservation in history

## Indicators

| Element | Icon | Description |
|---------|------|-------------|
| **Moderator Mode** | \`Gavel\` | Blue badge in selector |
| **Aggregation** | \`RefreshCw\` | Context collection indicator |
| **Counter** | — | "Analyzing N responses" |
| **Status** | \`Loader\` | "Moderator analyzing..." |

> **Tip**: Use Moderator mode after receiving responses from 3+ models for quick synthesis.`
    }
  },
  {
    id: 'session-memory',
    titleKey: 'hydrapedia.sections.sessionMemory',
    icon: 'Brain',
    content: {
      ru: `# Память сессии

Система **Память сессии** позволяет сохранять и быстро находить важные фрагменты контекста с помощью семантического поиска на основе AI-эмбеддингов.

## Концепция

Вместо ручного поиска по тексту сообщений вы можете:

1. **Сохранять** ключевые решения, инструкции и выводы
2. **Искать** по смыслу, а не по точным словам
3. **Интегрировать** найденный контекст в новые ответы

## Архитектура

\`\`\`mermaid
graph LR
    U[Пользователь] --> S[Сохранить в память]
    S --> E[Edge Function]
    E --> V[Векторный эмбеддинг]
    V --> DB[(session_memory)]
    Q[Поисковый запрос] --> E2[generate-embeddings]
    E2 --> RPC[search_session_memory]
    RPC --> DB
    DB --> R[Результаты по релевантности]
\`\`\`

## Типы фрагментов

| Тип | Иконка | Описание |
|-----|--------|----------|
| **message** | \`MessageSquare\` | Сохранённое сообщение |
| **summary** | \`FileText\` | Резюме или сводка |
| **decision** | \`CheckCircle\` | Принятое решение |
| **context** | \`Bookmark\` | Контекстная информация |
| **instruction** | \`Lightbulb\` | Инструкция или правило |

## Управление памятью

### Элементы управления в заголовке

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Индикатор** | \`Brain\` N | Количество сохранённых фрагментов |
| **Обновить** | \`RefreshCw\` | Принудительное обновление из БД |
| **Управление** | \`Settings2\` | Открыть диалог управления |

### Диалог управления памятью

| Элемент | Описание |
|---------|----------|
| **Табы фильтрации** | Все / Сообщения / Резюме / Решения / и др. |
| **Поле поиска** | Текстовый или семантический поиск |
| **Переключатель режима** | \`Text\` ↔ \`Sparkles\` (AI-поиск) |
| **Карточки фрагментов** | Содержимое с датой и кнопкой удаления |
| **Очистить все** | Удаление всех фрагментов (с подтверждением) |

## Семантический поиск

### Как работает

1. Нажмите кнопку \`Sparkles\` для активации AI-режима
2. Введите поисковый запрос **на естественном языке**
3. Система генерирует векторный эмбеддинг через Edge Function
4. pgvector находит ближайшие по косинусному расстоянию фрагменты
5. Результаты сортируются по **релевантности** (%)

### Преимущества

| Текстовый поиск | Семантический поиск |
|-----------------|---------------------|
| Ищет точные совпадения слов | Ищет по смыслу и контексту |
| «API ключ» найдёт только «API ключ» | «настройки доступа» найдёт «API ключ» |
| Быстрый, но ограниченный | Медленнее, но умнее |

### Индикаторы результатов

| Элемент | Описание |
|---------|----------|
| **Процент релевантности** | \`85%\` — близость к запросу |
| **Бейдж типа** | Цветовая маркировка категории |
| **Дата создания** | Когда фрагмент был сохранён |

## Поиск дубликатов

Система автоматически определяет повторяющиеся фрагменты:

1. Переключитесь на вкладку **«Дубликаты»**
2. Дубликаты выделены **янтарной** рамкой
3. Отображается счётчик повторов (×N)

> **Совет**: Регулярно очищайте дубликаты для оптимизации контекста.

## Интеграция с ответами

Сохранённые фрагменты автоматически используются при генерации ответов консультанта:

\`\`\`
[Контекст сессии]
━━ Решения ━━
- [Текст сохранённого решения]

━━ Инструкции ━━
- [Текст инструкции]
\`\`\`

Это помогает модели учитывать историю обсуждений без повторной передачи всего диалога.

## Технические детали

| Параметр | Значение |
|----------|----------|
| **Размерность вектора** | 1536 (OpenAI text-embedding-3-small) |
| **Индекс** | HNSW (pgvector) |
| **Метрика** | Косинусное расстояние |
| **RLS** | Доступ только к своим сессиям |`,

      en: `# Session Memory

The **Session Memory** system allows you to save and quickly find important context fragments using semantic search based on AI embeddings.

## Concept

Instead of manually searching message text, you can:

1. **Save** key decisions, instructions, and conclusions
2. **Search** by meaning, not exact words
3. **Integrate** found context into new responses

## Architecture

\`\`\`mermaid
graph LR
    U[User] --> S[Save to memory]
    S --> E[Edge Function]
    E --> V[Vector embedding]
    V --> DB[(session_memory)]
    Q[Search query] --> E2[generate-embeddings]
    E2 --> RPC[search_session_memory]
    RPC --> DB
    DB --> R[Results by relevance]
\`\`\`

## Fragment Types

| Type | Icon | Description |
|------|------|-------------|
| **message** | \`MessageSquare\` | Saved message |
| **summary** | \`FileText\` | Summary or recap |
| **decision** | \`CheckCircle\` | Made decision |
| **context** | \`Bookmark\` | Contextual information |
| **instruction** | \`Lightbulb\` | Instruction or rule |

## Memory Management

### Header Controls

| Element | Icon | Description |
|---------|------|-------------|
| **Indicator** | \`Brain\` N | Number of saved fragments |
| **Refresh** | \`RefreshCw\` | Force refresh from DB |
| **Manage** | \`Settings2\` | Open management dialog |

### Memory Management Dialog

| Element | Description |
|---------|-------------|
| **Filter tabs** | All / Messages / Summaries / Decisions / etc. |
| **Search field** | Text or semantic search |
| **Mode toggle** | \`Text\` ↔ \`Sparkles\` (AI search) |
| **Fragment cards** | Content with date and delete button |
| **Clear all** | Delete all fragments (with confirmation) |

## Semantic Search

### How It Works

1. Click the \`Sparkles\` button to activate AI mode
2. Enter a search query in **natural language**
3. System generates vector embedding via Edge Function
4. pgvector finds nearest fragments by cosine distance
5. Results are sorted by **relevance** (%)

### Advantages

| Text Search | Semantic Search |
|-------------|-----------------|
| Finds exact word matches | Finds by meaning and context |
| "API key" finds only "API key" | "access settings" finds "API key" |
| Fast but limited | Slower but smarter |

### Result Indicators

| Element | Description |
|---------|-------------|
| **Relevance percentage** | \`85%\` — closeness to query |
| **Type badge** | Color-coded category |
| **Creation date** | When fragment was saved |

## Duplicate Detection

The system automatically identifies repeating fragments:

1. Switch to the **"Duplicates"** tab
2. Duplicates are highlighted with an **amber** border
3. Repeat count is shown (×N)

> **Tip**: Regularly clean duplicates to optimize context.

## Integration with Responses

Saved fragments are automatically used when generating consultant responses:

\`\`\`
[Session Context]
━━ Decisions ━━
- [Saved decision text]

━━ Instructions ━━
- [Instruction text]
\`\`\`

This helps the model consider discussion history without re-sending the entire dialog.

## Technical Details

| Parameter | Value |
|-----------|-------|
| **Vector dimension** | 1536 (OpenAI text-embedding-3-small) |
| **Index** | HNSW (pgvector) |
| **Metric** | Cosine distance |
| **RLS** | Access only to own sessions |`
    }
  },
  {
    id: 'web-search',
    titleKey: 'hydrapedia.sections.webSearch',
    icon: 'Search',
    content: {
      ru: `# Веб-поиск

AI-Hydra интегрирована с **Tavily API** для поиска актуальной информации в интернете.

## Как работает

### Архитектура

\`\`\`mermaid
graph LR
    U[Запрос пользователя] --> O[Оркестратор]
    O --> T[Tavily API]
    T --> R[Результаты поиска]
    R --> M[AI-модель]
    M --> A[Ответ с источниками]
\`\`\`

### Что возвращает Tavily

| Компонент | Описание |
|-----------|----------|
| **AI-ответ** | Синтезированный ответ на основе найденного |
| **Источники** | Список URL с заголовками |
| **Сниппеты** | Релевантные фрагменты текста |

## Использование

### Через D-Chat

1. Откройте D-Chat панель
2. Выберите режим \`Web Search\` (\`Globe\`)
3. Введите поисковый запрос
4. Получите ответ с источниками

### Через Webhunter

1. Назначьте модели роль \`@webhunter\`
2. Задайте вопрос, требующий актуальной информации
3. Модель автоматически использует веб-поиск

## Отображение результатов

### Карточка ответа

| Элемент | Описание |
|---------|----------|
| **Текст ответа** | Синтезированная информация |
| **Блок источников** | Кликабельные ссылки |
| **Заголовок источника** | Название страницы |
| **URL** | Полный адрес (при наведении) |

### Пример отображения

\`\`\`
[Ответ модели на основе найденной информации]

📎 Источники:
• Example Article Title — example.com
• Another Source — source.org
• Third Reference — reference.net
\`\`\`

## Ограничения

| Параметр | Значение |
|----------|----------|
| **Количество источников** | До 5 на запрос |
| **Глубина поиска** | Только публичные страницы |
| **Актуальность** | Индексация Tavily |

## Советы

1. **Формулируйте конкретно** — «Курс биткоина сегодня» лучше, чем «биткоин»
2. **Указывайте контекст** — «Новости Apple 2024» уточняет период
3. **Проверяйте источники** — кликайте на ссылки для верификации

> **Важно**: Веб-поиск требует настроенного Tavily API ключа в переменных окружения.`,

      en: `# Web Search

AI-Hydra integrates with **Tavily API** for searching current information on the internet.

## How It Works

### Architecture

\`\`\`mermaid
graph LR
    U[User Query] --> O[Orchestrator]
    O --> T[Tavily API]
    T --> R[Search Results]
    R --> M[AI Model]
    M --> A[Response with Sources]
\`\`\`

### What Tavily Returns

| Component | Description |
|-----------|-------------|
| **AI Answer** | Synthesized response based on findings |
| **Sources** | List of URLs with titles |
| **Snippets** | Relevant text fragments |

## Usage

### Via D-Chat

1. Open the D-Chat panel
2. Select \`Web Search\` mode (\`Globe\`)
3. Enter your search query
4. Get a response with sources

### Via Webhunter

1. Assign the \`@webhunter\` role to a model
2. Ask a question requiring current information
3. The model automatically uses web search

## Result Display

### Response Card

| Element | Description |
|---------|-------------|
| **Response Text** | Synthesized information |
| **Sources Block** | Clickable links |
| **Source Title** | Page name |
| **URL** | Full address (on hover) |

### Display Example

\`\`\`
[Model response based on found information]

📎 Sources:
• Example Article Title — example.com
• Another Source — source.org
• Third Reference — reference.net
\`\`\`

## Limitations

| Parameter | Value |
|-----------|-------|
| **Number of Sources** | Up to 5 per query |
| **Search Depth** | Public pages only |
| **Freshness** | Tavily indexing |

## Tips

1. **Be specific** — "Bitcoin price today" is better than "bitcoin"
2. **Provide context** — "Apple news 2024" specifies the period
3. **Verify sources** — click links to verify

> **Important**: Web search requires a configured Tavily API key in environment variables.`
    }
  },
  {
    id: 'localization',
    titleKey: 'hydrapedia.sections.localization',
    icon: 'Languages',
    content: {
      ru: `# Локализация

AI-Hydra поддерживает мультиязычный интерфейс с переключением между русским и английским языками.

## Поддерживаемые языки

| Язык | Код | Статус |
|------|-----|--------|
| **Русский** | \`ru\` | Полная поддержка |
| **English** | \`en\` | Полная поддержка |

## Переключение языка

### Через интерфейс

1. Нажмите на иконку \`Globe\` в шапке
2. Выберите нужный язык из списка
3. Интерфейс мгновенно переключится

### Через профиль

1. Перейдите в **Профиль** → **Настройки**
2. В разделе **Язык интерфейса** выберите язык
3. Сохраните изменения

## Автоопределение

При первом входе система определяет язык браузера:
- Если браузер русскоязычный → \`ru\`
- Иначе → \`en\`

## Что переводится

| Компонент | Переводится |
|-----------|-------------|
| Навигация и меню | ✓ |
| Кнопки и подписи | ✓ |
| Сообщения об ошибках | ✓ |
| Подсказки (tooltips) | ✓ |
| Гидропедия | ✓ |
| Названия ролей | ✓ |
| Ответы AI-моделей | ✗ (зависит от промпта) |

## Сохранение настройки

Выбранный язык сохраняется в \`localStorage\` браузера и восстанавливается при следующем входе.

> **Совет**: Для получения ответов на нужном языке укажите это в системном промпте модели.`,

      en: `# Localization

AI-Hydra supports a multilingual interface with switching between Russian and English.

## Supported Languages

| Language | Code | Status |
|----------|------|--------|
| **Русский** | \`ru\` | Full support |
| **English** | \`en\` | Full support |

## Switching Language

### Via Interface

1. Click the \`Globe\` icon in the header
2. Select the desired language from the list
3. Interface switches instantly

### Via Profile

1. Go to **Profile** → **Settings**
2. In **Interface Language** section, select language
3. Save changes

## Auto-Detection

On first visit, the system detects browser language:
- If browser is Russian → \`ru\`
- Otherwise → \`en\`

## What Gets Translated

| Component | Translated |
|-----------|------------|
| Navigation and menus | ✓ |
| Buttons and labels | ✓ |
| Error messages | ✓ |
| Tooltips | ✓ |
| Hydrapedia | ✓ |
| Role names | ✓ |
| AI model responses | ✗ (depends on prompt) |

## Setting Persistence

Selected language is saved in browser \`localStorage\` and restored on next visit.

> **Tip**: To get responses in a specific language, specify it in the model's system prompt.`
    }
  },
  {
    id: 'security',
    titleKey: 'hydrapedia.sections.security',
    icon: 'Lock',
    content: {
      ru: `# Безопасность

AI-Hydra использует многоуровневую систему защиты данных.

## Хранение API-ключей

### Supabase Vault

Все API-ключи пользователей шифруются на уровне базы данных:

| Компонент | Описание |
|-----------|----------|
| **Vault** | Зашифрованное хранилище Supabase |
| **vault_id** | Ссылка на секрет в таблице |
| **RPC-функции** | \`save_api_key\`, \`get_my_api_keys\` |

### Поддерживаемые провайдеры

| Провайдер | Поле в Vault |
|-----------|--------------|
| OpenAI | \`openai_vault_id\` |
| Anthropic | \`anthropic_vault_id\` |
| Google Gemini | \`gemini_vault_id\` |
| xAI | \`xai_vault_id\` |
| Groq | \`groq_vault_id\` |
| OpenRouter | \`openrouter_vault_id\` |

## Row Level Security (RLS)

Все таблицы защищены политиками RLS:

| Таблица | Политика |
|---------|----------|
| **messages** | Пользователь видит только свои сообщения |
| **sessions** | Доступ только к своим сессиям |
| **user_api_keys** | Строгая изоляция ключей |
| **profiles** | Чтение публичных данных, запись своих |

### Пример политики

\`\`\`sql
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (auth.uid() = user_id);
\`\`\`

## Изоляция данных

| Уровень | Защита |
|---------|--------|
| **Пользователь** | RLS на уровне \`user_id\` |
| **Сессия** | Связь через \`session_id\` |
| **Сообщение** | Принадлежность сессии |

## HTTP-инструменты

### SSRF-защита

При создании HTTP-инструментов система валидирует URL:

- Блокировка \`localhost\`, \`127.0.0.1\`
- Блокировка внутренних сетей (\`10.x.x.x\`, \`192.168.x.x\`)
- Проверка схемы (только \`http\`, \`https\`)

### Таймауты

| Параметр | Значение |
|----------|----------|
| **Таймаут запроса** | 30 секунд |
| **Макс. размер ответа** | 1 МБ |

## Рекомендации

1. **Не делитесь API-ключами** — они хранятся только для вашего аккаунта
2. **Проверяйте публичные промпты** — убедитесь, что они не содержат секретов
3. **Используйте сильные пароли** — минимум 8 символов, буквы и цифры

> **Важно**: AI-Hydra не передаёт ваши API-ключи третьим сторонам. Они используются только для прямых запросов к провайдерам.`,

      en: `# Security

AI-Hydra uses a multi-layered data protection system.

## API Key Storage

### Supabase Vault

All user API keys are encrypted at the database level:

| Component | Description |
|-----------|-------------|
| **Vault** | Supabase encrypted storage |
| **vault_id** | Reference to secret in table |
| **RPC Functions** | \`save_api_key\`, \`get_my_api_keys\` |

### Supported Providers

| Provider | Vault Field |
|----------|-------------|
| OpenAI | \`openai_vault_id\` |
| Anthropic | \`anthropic_vault_id\` |
| Google Gemini | \`gemini_vault_id\` |
| xAI | \`xai_vault_id\` |
| Groq | \`groq_vault_id\` |
| OpenRouter | \`openrouter_vault_id\` |

## Row Level Security (RLS)

All tables are protected by RLS policies:

| Table | Policy |
|-------|--------|
| **messages** | User sees only their messages |
| **sessions** | Access only to own sessions |
| **user_api_keys** | Strict key isolation |
| **profiles** | Read public data, write own |

### Policy Example

\`\`\`sql
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (auth.uid() = user_id);
\`\`\`

## Data Isolation

| Level | Protection |
|-------|------------|
| **User** | RLS at \`user_id\` level |
| **Session** | Link via \`session_id\` |
| **Message** | Session ownership |

## HTTP Tools

### SSRF Protection

When creating HTTP tools, the system validates URLs:

- Blocking \`localhost\`, \`127.0.0.1\`
- Blocking internal networks (\`10.x.x.x\`, \`192.168.x.x\`)
- Schema validation (only \`http\`, \`https\`)

### Timeouts

| Parameter | Value |
|-----------|-------|
| **Request Timeout** | 30 seconds |
| **Max Response Size** | 1 MB |

## Recommendations

1. **Don't share API keys** — they're stored only for your account
2. **Review public prompts** — ensure they don't contain secrets
3. **Use strong passwords** — minimum 8 characters, letters and numbers

> **Important**: AI-Hydra doesn't share your API keys with third parties. They're used only for direct requests to providers.`
    }
  },
  {
    id: 'behavioral-patterns',
    titleKey: 'hydrapedia.sections.behavioralPatterns',
    icon: 'Sparkles',
    content: {
      ru: `# Паттерны поведения

Модуль «Паттерны поведения» позволяет управлять логикой выполнения задач и стилем общения ИИ-агентов. Система построена на двухуровневой архитектуре.

## Концепция

\`\`\`mermaid
graph TD
    subgraph SP["Стратегические паттерны"]
        BP[Task Blueprint]
        BP --> S1[Этап 1]
        BP --> S2[Этап 2]
        BP --> S3[Этап N]
        S1 --> R1[Ассистент]
        S2 --> R2[Критик]
        S3 --> R3[Арбитр]
    end
    
    subgraph RP["Ролевые паттерны"]
        RB[Role Behavior]
        RB --> COM[Коммуникация]
        RB --> REA[Реакции]
        RB --> INT[Взаимодействия]
    end
    
    BP -.-> RB
\`\`\`

## Два типа паттернов

### 1. Стратегические паттерны (Task Blueprints)

Определяют **что делать** — последовательность этапов для решения задачи.

| Поле | Описание |
|------|----------|
| **Название** | Уникальное имя паттерна |
| **Категория** | Планирование / Креатив / Анализ / Техническая |
| **Этапы** | Упорядоченный список шагов выполнения |
| **Контрольные точки** | Критерии успешного завершения |

#### Структура этапа

| Элемент | Описание |
|---------|----------|
| **Название** | Краткое описание этапа |
| **Роль** | Какой агент выполняет (@assistant, @critic, и т.д.) |
| **Инструкция** | Подробное описание задачи для агента |
| **Условие перехода** | Когда переходить к следующему этапу |

#### Категории паттернов

| Категория | Иконка | Цвет | Пример |
|-----------|--------|------|--------|
| **Планирование** | \`Target\` | Синий | Декомпозиция проекта |
| **Креатив** | \`Sparkles\` | Фиолетовый | Генерация идей |
| **Анализ** | \`Search\` | Зелёный | Исследование рынка |
| **Техническая** | \`Code\` | Оранжевый | Code review |

### 2. Ролевые паттерны (Role Behaviors)

Определяют **как общаться** — стиль коммуникации конкретной роли.

| Поле | Описание |
|------|----------|
| **Роль** | К какой роли применяется (@critic, @arbiter, etc.) |
| **Коммуникация** | Тон, детализация, формат ответов |
| **Реакции** | Триггеры и автоматические действия |
| **Взаимодействия** | Правила работы с другими агентами |

#### Параметры коммуникации

| Параметр | Варианты | Описание |
|----------|----------|----------|
| **Тон** | Формальный / Дружелюбный / Нейтральный / Провокационный | Стиль общения |
| **Детализация** | Краткий / Детальный / Адаптивный | Объём ответов |
| **Использование эмодзи** | Да / Нет | Допустимость эмодзи |
| **Использование примеров** | Да / Нет | Включение примеров кода |

## Интерфейс страницы

### Левая панель — Список паттернов

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Группа «Стратегические»** | \`Target\` | Сворачиваемый список Task Blueprints |
| **Группа «Ролевые»** | \`Sparkles\` | Сворачиваемый список Role Behaviors |
| **Создать новый** | \`Plus\` | Кнопка создания паттерна |
| **Редактировать** | \`Pencil\` | Редактирование своего паттерна |
| **Дублировать** | \`Copy\` | Копирование системного паттерна |
| **Удалить** | \`Trash2\` | Удаление своего паттерна |
| **Системный** | \`Lock\` | Метка системного паттерна (только чтение) |
| **Публичный** | \`Users\` | Метка публичного паттерна |

### Правая панель — Детали

Отображает полную информацию о выбранном паттерне:

- Все этапы с инструкциями
- Контрольные точки
- Параметры коммуникации
- Правила реакций

## Типы паттернов

### Системные паттерны

Предустановленные паттерны, доступные всем пользователям.

| Характеристика | Значение |
|----------------|----------|
| **Метка** | \`Lock\` (замок) |
| **Редактирование** | Нельзя изменить |
| **Удаление** | Невозможно |
| **Дублирование** | Можно скопировать как свой |

### Пользовательские паттерны

| Характеристика | Значение |
|----------------|----------|
| **Создание** | Через кнопку «+» |
| **Редактирование** | Полное |
| **Удаление** | Да |
| **Публикация** | Можно сделать публичным |

### Публичные паттерны

| Характеристика | Значение |
|----------------|----------|
| **Метка** | \`Users\` (группа) |
| **Видимость** | Все пользователи |
| **Редактирование** | Только автор |

## Пример: Паттерн «Критический анализ»

\`\`\`mermaid
graph LR
    A[Запрос] --> B[Ассистент]
    B --> C[Критик]
    C --> D[Арбитр]
    D --> E[Финальный ответ]
\`\`\`

### Этапы паттерна

| # | Роль | Задача |
|---|------|--------|
| 1 | @assistant | Генерация первичного решения |
| 2 | @critic | Выявление слабых мест и ошибок |
| 3 | @arbiter | Объединение с учётом критики |

## Использование паттернов

1. **Выберите паттерн** из списка или создайте новый
2. **Изучите этапы** на правой панели
3. **Применяйте логику** при работе с моделями на Панели экспертов
4. **Настройте поведение** ролей через Role Behaviors

> **Совет**: Начните с дублирования системного паттерна и адаптируйте его под свои задачи.`,

      en: `# Behavioral Patterns

The "Behavioral Patterns" module allows you to manage task execution logic and AI agent communication styles. The system is built on a two-level architecture.

## Concept

\`\`\`mermaid
graph TD
    subgraph SP["Strategic Patterns"]
        BP[Task Blueprint]
        BP --> S1[Stage 1]
        BP --> S2[Stage 2]
        BP --> S3[Stage N]
        S1 --> R1[Assistant]
        S2 --> R2[Critic]
        S3 --> R3[Arbiter]
    end
    
    subgraph RP["Role Patterns"]
        RB[Role Behavior]
        RB --> COM[Communication]
        RB --> REA[Reactions]
        RB --> INT[Interactions]
    end
    
    BP -.-> RB
\`\`\`

## Two Types of Patterns

### 1. Strategic Patterns (Task Blueprints)

Define **what to do** — the sequence of stages for solving a task.

| Field | Description |
|-------|-------------|
| **Name** | Unique pattern name |
| **Category** | Planning / Creative / Analysis / Technical |
| **Stages** | Ordered list of execution steps |
| **Checkpoints** | Success criteria |

#### Stage Structure

| Element | Description |
|---------|-------------|
| **Name** | Brief stage description |
| **Role** | Which agent executes (@assistant, @critic, etc.) |
| **Instruction** | Detailed task description for agent |
| **Transition condition** | When to move to next stage |

#### Pattern Categories

| Category | Icon | Color | Example |
|----------|------|-------|---------|
| **Planning** | \`Target\` | Blue | Project decomposition |
| **Creative** | \`Sparkles\` | Purple | Idea generation |
| **Analysis** | \`Search\` | Green | Market research |
| **Technical** | \`Code\` | Orange | Code review |

### 2. Role Patterns (Role Behaviors)

Define **how to communicate** — the communication style of a specific role.

| Field | Description |
|-------|-------------|
| **Role** | Which role applies (@critic, @arbiter, etc.) |
| **Communication** | Tone, verbosity, response format |
| **Reactions** | Triggers and automatic actions |
| **Interactions** | Rules for working with other agents |

#### Communication Parameters

| Parameter | Options | Description |
|-----------|---------|-------------|
| **Tone** | Formal / Friendly / Neutral / Provocative | Communication style |
| **Verbosity** | Concise / Detailed / Adaptive | Response length |
| **Use emoji** | Yes / No | Emoji allowed |
| **Use examples** | Yes / No | Include code examples |

## Page Interface

### Left Panel — Pattern List

| Element | Icon | Description |
|---------|------|-------------|
| **"Strategic" Group** | \`Target\` | Collapsible Task Blueprints list |
| **"Role" Group** | \`Sparkles\` | Collapsible Role Behaviors list |
| **Create new** | \`Plus\` | Pattern creation button |
| **Edit** | \`Pencil\` | Edit your pattern |
| **Duplicate** | \`Copy\` | Copy system pattern |
| **Delete** | \`Trash2\` | Delete your pattern |
| **System** | \`Lock\` | System pattern badge (read-only) |
| **Public** | \`Users\` | Public pattern badge |

### Right Panel — Details

Displays full information about selected pattern:

- All stages with instructions
- Checkpoints
- Communication parameters
- Reaction rules

## Pattern Types

### System Patterns

Pre-installed patterns available to all users.

| Characteristic | Value |
|----------------|-------|
| **Badge** | \`Lock\` (padlock) |
| **Editing** | Cannot modify |
| **Deletion** | Impossible |
| **Duplication** | Can copy as your own |

### User Patterns

| Characteristic | Value |
|----------------|-------|
| **Creation** | Via "+" button |
| **Editing** | Full |
| **Deletion** | Yes |
| **Publishing** | Can make public |

### Public Patterns

| Characteristic | Value |
|----------------|-------|
| **Badge** | \`Users\` (group) |
| **Visibility** | All users |
| **Editing** | Author only |

## Example: "Critical Analysis" Pattern

\`\`\`mermaid
graph LR
    A[Request] --> B[Assistant]
    B --> C[Critic]
    C --> D[Arbiter]
    D --> E[Final response]
\`\`\`

### Pattern Stages

| # | Role | Task |
|---|------|------|
| 1 | @assistant | Generate initial solution |
| 2 | @critic | Identify weaknesses and errors |
| 3 | @arbiter | Merge with critique in mind |

## Using Patterns

1. **Select a pattern** from the list or create a new one
2. **Study the stages** in the right panel
3. **Apply the logic** when working with models in Expert Panel
4. **Configure role behavior** through Role Behaviors

> **Tip**: Start by duplicating a system pattern and adapt it to your tasks.`
    }
  }
];
