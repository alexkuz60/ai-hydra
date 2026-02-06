export interface HydrapediaSection {
  id: string;
  titleKey: string;
  icon: string;
  adminOnly?: boolean;
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
| OpenAI | GPT-5, GPT-5-mini, GPT-5.2 | [platform.openai.com](https://platform.openai.com) |
| Anthropic | Claude 3.5, Claude 4 | [console.anthropic.com](https://console.anthropic.com) |
| Google | Gemini 2.5, Gemini 3 | [ai.google.dev](https://ai.google.dev) |
| xAI | Grok 2, Grok 3 | [x.ai](https://x.ai) |
| Groq | LLaMA 3, Mixtral | [console.groq.com](https://console.groq.com) |
| DeepSeek | DeepSeek V3, DeepSeek R1 | [platform.deepseek.com](https://platform.deepseek.com) |
| Perplexity | Sonar Pro | [perplexity.ai](https://www.perplexity.ai) |
| OpenRouter | 200+ моделей | [openrouter.ai](https://openrouter.ai) |

### Как добавить ключ

1. Перейдите в **Профиль** → **API Ключи**
2. Введите ключ в соответствующее поле
3. Нажмите **Сохранить**

> **Совет**: Начните с OpenRouter — один ключ даёт доступ к сотням моделей всех провайдеров.

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
| OpenAI | GPT-5, GPT-5-mini, GPT-5.2 | [platform.openai.com](https://platform.openai.com) |
| Anthropic | Claude 3.5, Claude 4 | [console.anthropic.com](https://console.anthropic.com) |
| Google | Gemini 2.5, Gemini 3 | [ai.google.dev](https://ai.google.dev) |
| xAI | Grok 2, Grok 3 | [x.ai](https://x.ai) |
| Groq | LLaMA 3, Mixtral | [console.groq.com](https://console.groq.com) |
| DeepSeek | DeepSeek V3, DeepSeek R1 | [platform.deepseek.com](https://platform.deepseek.com) |
| Perplexity | Sonar Pro | [perplexity.ai](https://www.perplexity.ai) |
| OpenRouter | 200+ models | [openrouter.ai](https://openrouter.ai) |

### How to Add a Key

1. Go to **Profile** → **API Keys**
2. Enter the key in the corresponding field
3. Click **Save**

> **Tip**: Start with OpenRouter — one key gives you access to hundreds of models from all providers.

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

Панель ввода содержит вертикальные тулбары слева и справа от текстового поля для комплексного управления запросом.

### Левый тулбар

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Сворачивание** | \`ChevronDown\` | Свернуть панель ввода в компактную строку |
| **Прикрепить файл** | \`Paperclip\` | Загрузка файлов, изображений и диаграмм Mermaid |
| **Таймаут** | \`Clock\` | Установка времени ожидания ответа (30с – 4м) |
| **Пожелания Супервизора** | \`Sparkles\` | Динамические инструкции для модификации поведения ролей |
| **Оптимизация промпта** | \`Wand2\` | Запуск «Промпт-Инженера» для улучшения запроса |

### Правый тулбар

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Отправить всем** | \`Send\` | Отправить запрос выбранным моделям |
| **Консультант** | \`Lightbulb\` | Выбор одной модели для глубокого анализа в D-Chat |
| **Отправить консультанту** | \`Send\` (янтарный) | Отправить вопрос выбранному консультанту (видна только если выбран) |

### Управление высотой

- **Ресайз-хендл** (горизонтальная линия над полем): перетащите вверх/вниз для изменения высоты
- **Высота сохраняется** автоматически в localStorage для текущей сессии
- **Диапазон высоты**: 200–400 пикселей

### Состояния панели

| Состояние | Описание |
|-----------|----------|
| **Развёрнутое** | Полный размер с обеими вертикальными тулбарами и полем ввода |
| **Свёрнутое** | Компактная строка h-14 с быстрой кнопкой отправки |

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

## Пожелания Супервизора

**Пожелания Супервизора** — это система динамических инструкций для гибкой модификации поведения AI-ролей без изменения основных системных промптов.

### Назначение

Вместо редактирования промптов вы можете быстро применять инструкции, такие как:
- Измените тон (формальный → дружеский → нейтральный)
- Настройте глубину анализа (кратко → детально → эксперт)
- Добавьте конкретные требования (примеры → аналогии → контрпримеры)
- Активируйте специальные режимы (Socratic → Devil's Advocate → Mentor)

### Как использовать

1. Нажмите кнопку **Пожелания** (иконка \`Sparkles\`) в левом тулбаре
2. Откроется панель с 50+ локализованными инструкциями
3. Выберите нужные пожелания (галочкой)
4. **Активные пожелания** отображаются как бейджи в селекторе
5. Выбранные инструкции автоматически внедряются в системные промпты ролей

### Фильтрация по ролям

Пожелания автоматически фильтруются по активным ролям:

| Роль | Применимые пожелания |
|------|--------|
| **Эксперт** | Общие инструкции, анализ, креативность |
| **Критик** | Выявление ошибок, контраргументы, риски |
| **Арбитр** | Синтез, объективность, финальные выводы |
| **Консультант** | Уточнение, примеры, практика |
| **Модератор** | Структурированность, ясность, резюме |
| **Промпт-Инженер** | Оптимизация, метаанализ, рефакторинг |

### Персистентность

Выбранные пожелания сохраняются автоматически для текущей сессии в браузерном хранилище и восстанавливаются при повторном открытии той же сессии.

> **Совет**: Комбинируйте пожелания для более точного управления поведением. Например, активируйте одновременно «Кратко» + «Критик» для получения краткого критического анализа.

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

Боковая панель для глубокого анализа с выбранной моделью в различных режимах работы.

### Режимы консультанта

| Режим | Иконка | Описание |
|-------|--------|----------|
| **Web Search** | \`Search\` | Веб-поиск и анализ информации из интернета |
| **Expert** | \`User\` | Стандартный эксперт для обобщённого анализа |
| **Critic** | \`Shield\` | Критический анализ и выявление слабых мест |
| **Arbiter** | \`Scale\` | Синтез противоречивых позиций, финальная оценка |
| **Moderator** | \`Users\` | Структурированное резюме контекста сессии |
| **Prompt Engineer** | \`Wand2\` | Специализованная оптимизация и анализ промптов |

### Элементы управления D-Chat

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Заголовок панели** | — | Выбранный режим консультанта |
| **Режимы селектора** | Иконки | Переключение между 6 режимами анализа |
| **Селектор модели** | \`Bot\` | Выбор конкретной модели для консультации |
| **Закрыть панель** | \`X\` | Закрытие панели консультанта |
| **Изменить ширину** | \`GripVertical\` | Перетаскивание левого края панели |
| **Пожелания Супервизора** | \`Sparkles\` | Динамические инструкции для режима |
| **Поле ввода** | — | Текстовое поле для вопроса |
| **Отправить** | \`Send\` | Отправка вопроса консультанту |

### Режим Prompt Engineer — специализированные инструменты

Когда активен режим **Prompt Engineer**, появляется панель с инструментами для анализа и оптимизации промптов:

| Инструмент | Описание |
|------------|----------|
| **Analyze** | Детальный анализ структуры и эффективности текущего промпта |
| **Generate Variations** | Создание 3–5 альтернативных вариантов промпта |
| **Improve** | Комплексное улучшение ясности, специфичности и результативности |
| **Refine** | Уточнение для конкретного ответа или сценария использования |

При использовании инструмента текущий ввод автоматически оборачивается в техническую инструкцию перед отправкой модели.

### Как использовать D-Chat

1. Нажмите на иконку консультанта \`MessageSquare\` в ответе модели
2. Откроется боковой чат справа с выбранной моделью
3. Выберите нужный **режим** (режим Expert активен по умолчанию)
4. Выберите или уточните **модель** в селекторе
5. Задавайте уточняющие вопросы или используйте инструменты Prompt Engineer
6. Выделите текст в основном ответе → нажмите \`Lightbulb\` для уточнения через консультанта

> **Совет**: Используйте режим **Critic** для поиска ошибок, **Arbiter** для синтеза позиций, **Moderator** для структурированного резюме, и **Prompt Engineer** для оптимизации ваших запросов.`,

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

Инструменты расширяют возможности AI-моделей, позволяя им выполнять действия: искать в интернете, делать вычисления, обращаться к внешним API.

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

Текстовые инструкции с подстановкой параметров. Модель интерпретирует шаблон и выполняет задачу.

**Подходят для:**
- Форматирования вывода по шаблону
- Пошаговых инструкций
- Специализированных задач (перевод, суммаризация)

**Пример шаблона:**
\`\`\`
Переведи текст "{{text}}" на {{language}}.
Формат: только перевод, без пояснений.
\`\`\`

### HTTP API инструменты

**Иконка**: \`Globe\`

Реальные вызовы к внешним API с полной конфигурацией запроса.

**Позволяют:**
- Получать данные из интернета (погода, курсы, новости)
- Взаимодействовать с сервисами (CRM, базы данных)
- Интегрировать внешние AI-сервисы

---

## HTTP-инструменты: Подробное руководство

### Создание HTTP-инструмента

1. Нажмите **«Новый инструмент»** \`Plus\`
2. Выберите тип **«HTTP API»**
3. Заполните основные поля:

| Поле | Описание | Пример |
|------|----------|--------|
| **Имя** | Уникальный ID (snake_case) | \`get_weather\` |
| **Отображаемое имя** | Читаемое название | \`Погода по городу\` |
| **Описание** | Что делает инструмент | \`Получает текущую погоду\` |

### Конфигурация HTTP-запроса

#### Метод и URL

| Поле | Описание |
|------|----------|
| **Method** | HTTP-метод: \`GET\`, \`POST\`, \`PUT\`, \`DELETE\` |
| **URL** | Адрес API с подстановками \`{{param}}\` |

**Пример URL с параметрами:**
\`\`\`
https://api.openweathermap.org/data/2.5/weather?q={{city}}&appid={{api_key}}&units=metric
\`\`\`

#### Заголовки (Headers)

Заголовки задаются как JSON-объект. Поддерживаются подстановки параметров:

\`\`\`json
{
  "Authorization": "Bearer {{token}}",
  "Content-Type": "application/json",
  "X-Custom-Header": "value"
}
\`\`\`

| Кнопка | Описание |
|--------|----------|
| **Добавить стандартные** | Вставляет \`Content-Type: application/json\` |
| **Добавить Bearer** | Вставляет \`Authorization: Bearer {{token}}\` |

#### Тело запроса (Body)

Для методов \`POST\` и \`PUT\` можно указать тело запроса:

\`\`\`json
{
  "message": "{{user_message}}",
  "settings": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
\`\`\`

#### Извлечение данных (Response Path)

JSONPath для извлечения нужной части ответа:

| Путь | Описание | Пример |
|------|----------|--------|
| \`data\` | Поле верхнего уровня | \`{"data": {...}}\` → \`{...}\` |
| \`results[0]\` | Первый элемент массива | \`{"results": [...]}\` → первый элемент |
| \`data.items[0].name\` | Вложенный путь | Глубокое извлечение |

### Параметры инструмента

Параметры определяют, какие данные модель должна передать при вызове:

| Поле | Тип | Описание |
|------|-----|----------|
| **name** | string | Имя параметра (используется в \`{{name}}\`) |
| **type** | string/number/boolean | Тип данных |
| **description** | string | Описание для модели |
| **required** | boolean | Обязательный ли параметр |

**Пример схемы параметров:**
\`\`\`json
[
  {
    "name": "city",
    "type": "string",
    "description": "Название города",
    "required": true
  },
  {
    "name": "units",
    "type": "string",
    "description": "Единицы измерения: metric или imperial",
    "required": false
  }
]
\`\`\`

### Тестирование HTTP-инструментов

Перед сохранением инструмента протестируйте его работу:

#### Панель тестирования

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Поля параметров** | \`FileText\` | Ввод тестовых значений |
| **Выполнить тест** | \`Play\` | Отправка реального HTTP-запроса |
| **Индикатор загрузки** | \`Loader\` | Показывает выполнение запроса |
| **Статус** | \`CheckCircle\` / \`XCircle\` | Успех (зелёный) или ошибка (красный) |
| **Время выполнения** | \`Clock\` | Время ответа в миллисекундах |
| **Результат** | — | JSON-ответ API |

#### Процесс тестирования

1. Заполните все обязательные параметры
2. Нажмите **«Тестировать»** \`Play\`
3. Дождитесь ответа (до 30 сек)
4. Проверьте результат:
   - ✅ **Успех**: зелёная галочка, JSON-результат
   - ⚠️ **Предупреждение**: путь не найден, показан полный ответ
   - ❌ **Ошибка**: красный крестик, описание проблемы

#### Типичные ошибки

| Ошибка | Причина | Решение |
|--------|---------|---------|
| \`HTTP 401\` | Неверная авторизация | Проверьте токен/ключ API |
| \`HTTP 404\` | Неверный URL | Проверьте адрес и параметры |
| \`Таймаут\` | Сервер не отвечает | Увеличьте таймаут или проверьте URL |
| \`Путь не найден\` | Неверный Response Path | Проверьте структуру ответа |
| \`SSRF блокировка\` | Внутренний адрес | Используйте публичные API |

### Примеры HTTP-инструментов

#### 1. Погодный API

\`\`\`
Имя: get_weather
URL: https://api.openweathermap.org/data/2.5/weather?q={{city}}&appid={{api_key}}&units=metric
Метод: GET
Response Path: main
Параметры: city (string, required), api_key (string, required)
\`\`\`

#### 2. Отправка в Slack

\`\`\`
Имя: send_slack_message
URL: https://hooks.slack.com/services/{{webhook_id}}
Метод: POST
Headers: {"Content-Type": "application/json"}
Body: {"text": "{{message}}", "channel": "{{channel}}"}
Параметры: webhook_id, message, channel
\`\`\`

#### 3. Поиск в базе знаний

\`\`\`
Имя: search_knowledge_base
URL: https://api.example.com/search
Метод: POST
Headers: {"Authorization": "Bearer {{token}}"}
Body: {"query": "{{query}}", "limit": 5}
Response Path: results
\`\`\`

## Безопасность

### SSRF-защита

Система валидирует URL для предотвращения SSRF-атак:

| Блокируется | Примеры |
|-------------|---------|
| Localhost | \`localhost\`, \`127.0.0.1\`, \`0.0.0.0\` |
| Приватные сети | \`10.x.x.x\`, \`192.168.x.x\`, \`172.16-31.x.x\` |
| Внутренние домены | \`*.local\`, \`*.internal\` |

### Лимиты и ограничения

| Параметр | Значение |
|----------|----------|
| **Таймаут запроса** | 30 секунд |
| **Макс. размер ответа** | 1 МБ (1 048 576 байт) |
| **Разрешённые схемы** | \`http://\`, \`https://\` |

> **Важно**: HTTP-инструменты выполняются на сервере. Убедитесь, что целевой API доступен и не требует особой сетевой конфигурации.

## Активация инструментов

Инструменты активируются per-model в настройках задачи:

1. Откройте **Настройки модели** \`Settings\`
2. Перейдите на вкладку **«Инструменты»**
3. Включите нужные инструменты для каждой модели

> **Совет**: Не все модели поддерживают Tool Calling. Проверьте документацию провайдера.`,

      en: `# Tools

Tools extend AI model capabilities, allowing them to perform actions: search the web, make calculations, call external APIs.

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

Text instructions with parameter substitution. The model interprets the template and executes the task.

**Suitable for:**
- Output formatting with templates
- Step-by-step instructions
- Specialized tasks (translation, summarization)

**Template example:**
\`\`\`
Translate the text "{{text}}" to {{language}}.
Format: translation only, no explanations.
\`\`\`

### HTTP API Tools

**Icon**: \`Globe\`

Real calls to external APIs with full request configuration.

**Allow you to:**
- Fetch data from the internet (weather, rates, news)
- Interact with services (CRM, databases)
- Integrate external AI services

---

## HTTP Tools: Detailed Guide

### Creating an HTTP Tool

1. Click **"New Tool"** \`Plus\`
2. Select type **"HTTP API"**
3. Fill in the basic fields:

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | Unique ID (snake_case) | \`get_weather\` |
| **Display Name** | Readable name | \`Weather by City\` |
| **Description** | What the tool does | \`Gets current weather\` |

### HTTP Request Configuration

#### Method and URL

| Field | Description |
|-------|-------------|
| **Method** | HTTP method: \`GET\`, \`POST\`, \`PUT\`, \`DELETE\` |
| **URL** | API address with substitutions \`{{param}}\` |

**URL example with parameters:**
\`\`\`
https://api.openweathermap.org/data/2.5/weather?q={{city}}&appid={{api_key}}&units=metric
\`\`\`

#### Headers

Headers are set as a JSON object. Parameter substitutions are supported:

\`\`\`json
{
  "Authorization": "Bearer {{token}}",
  "Content-Type": "application/json",
  "X-Custom-Header": "value"
}
\`\`\`

| Button | Description |
|--------|-------------|
| **Add Standard** | Inserts \`Content-Type: application/json\` |
| **Add Bearer** | Inserts \`Authorization: Bearer {{token}}\` |

#### Request Body

For \`POST\` and \`PUT\` methods, you can specify a request body:

\`\`\`json
{
  "message": "{{user_message}}",
  "settings": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
\`\`\`

#### Data Extraction (Response Path)

JSONPath to extract the needed part of the response:

| Path | Description | Example |
|------|-------------|---------|
| \`data\` | Top-level field | \`{"data": {...}}\` → \`{...}\` |
| \`results[0]\` | First array element | \`{"results": [...]}\` → first element |
| \`data.items[0].name\` | Nested path | Deep extraction |

### Tool Parameters

Parameters define what data the model should pass when calling:

| Field | Type | Description |
|-------|------|-------------|
| **name** | string | Parameter name (used in \`{{name}}\`) |
| **type** | string/number/boolean | Data type |
| **description** | string | Description for the model |
| **required** | boolean | Whether parameter is required |

**Parameter schema example:**
\`\`\`json
[
  {
    "name": "city",
    "type": "string",
    "description": "City name",
    "required": true
  },
  {
    "name": "units",
    "type": "string",
    "description": "Units: metric or imperial",
    "required": false
  }
]
\`\`\`

### Testing HTTP Tools

Test your tool before saving:

#### Testing Panel

| Element | Icon | Description |
|---------|------|-------------|
| **Parameter Fields** | \`FileText\` | Enter test values |
| **Run Test** | \`Play\` | Send actual HTTP request |
| **Loading Indicator** | \`Loader\` | Shows request in progress |
| **Status** | \`CheckCircle\` / \`XCircle\` | Success (green) or error (red) |
| **Execution Time** | \`Clock\` | Response time in milliseconds |
| **Result** | — | API JSON response |

#### Testing Process

1. Fill in all required parameters
2. Click **"Test"** \`Play\`
3. Wait for response (up to 30 sec)
4. Check the result:
   - ✅ **Success**: green checkmark, JSON result
   - ⚠️ **Warning**: path not found, full response shown
   - ❌ **Error**: red cross, problem description

#### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| \`HTTP 401\` | Invalid authorization | Check API token/key |
| \`HTTP 404\` | Invalid URL | Check address and parameters |
| \`Timeout\` | Server not responding | Increase timeout or check URL |
| \`Path not found\` | Invalid Response Path | Check response structure |
| \`SSRF block\` | Internal address | Use public APIs |

### HTTP Tool Examples

#### 1. Weather API

\`\`\`
Name: get_weather
URL: https://api.openweathermap.org/data/2.5/weather?q={{city}}&appid={{api_key}}&units=metric
Method: GET
Response Path: main
Parameters: city (string, required), api_key (string, required)
\`\`\`

#### 2. Send to Slack

\`\`\`
Name: send_slack_message
URL: https://hooks.slack.com/services/{{webhook_id}}
Method: POST
Headers: {"Content-Type": "application/json"}
Body: {"text": "{{message}}", "channel": "{{channel}}"}
Parameters: webhook_id, message, channel
\`\`\`

#### 3. Knowledge Base Search

\`\`\`
Name: search_knowledge_base
URL: https://api.example.com/search
Method: POST
Headers: {"Authorization": "Bearer {{token}}"}
Body: {"query": "{{query}}", "limit": 5}
Response Path: results
\`\`\`

## Security

### SSRF Protection

The system validates URLs to prevent SSRF attacks:

| Blocked | Examples |
|---------|----------|
| Localhost | \`localhost\`, \`127.0.0.1\`, \`0.0.0.0\` |
| Private Networks | \`10.x.x.x\`, \`192.168.x.x\`, \`172.16-31.x.x\` |
| Internal Domains | \`*.local\`, \`*.internal\` |

### Limits and Restrictions

| Parameter | Value |
|-----------|-------|
| **Request Timeout** | 30 seconds |
| **Max Response Size** | 1 MB (1,048,576 bytes) |
| **Allowed Schemes** | \`http://\`, \`https://\` |

> **Important**: HTTP tools are executed on the server. Make sure the target API is accessible and doesn't require special network configuration.

## Tool Activation

Tools are activated per-model in task settings:

1. Open **Model Settings** \`Settings\`
2. Go to the **"Tools"** tab
3. Enable desired tools for each model

> **Tip**: Not all models support Tool Calling. Check the provider documentation.`
    }
  },
  {
    id: 'flow-editor',
    titleKey: 'hydrapedia.sections.flowEditor',
    icon: 'GitBranch',
    content: {
      ru: `# Редактор потоков мысли

Визуальный инструмент для проектирования и **выполнения** сложных цепочек обработки данных.

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
| **Запуск** | \`Play\` | Запуск выполнения потока |
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
| **Input** | \`ArrowRight\` | Точка входа данных (обязательно для запуска) |
| **Output** | \`ArrowLeft\` | Точка вывода результата |
| **Prompt** | \`FileText\` | Системный промпт |
| **Model** | \`Bot\` | Вызов языковой модели (Gemini, GPT-5 и др.) |

### Логика

| Узел | Иконка | Назначение |
|------|--------|------------|
| **Condition** | \`HelpCircle\` | Ветвление (if/else) |
| **Checkpoint** | \`UserCheck\` | Ожидание подтверждения пользователя |
| **Switch** | \`GitBranch\` | Множественное ветвление |
| **Loop** | \`RefreshCw\` | Итерация по массиву |
| **Delay** | \`Timer\` | Задержка выполнения (мс/сек/мин) |

### Данные

| Узел | Иконка | Назначение |
|------|--------|------------|
| **Transform** | \`Wrench\` | Преобразование данных (JSONPath, regex) |
| **Filter** | \`Filter\` | Фильтрация по условию |
| **Merge** | \`Merge\` | Объединение нескольких потоков |
| **Split** | \`Scissors\` | Разделение на подпотоки |

### Интеграции

| Узел | Иконка | Назначение |
|------|--------|------------|
| **API** | \`Globe\` | HTTP-запросы (GET/POST/PUT/DELETE) |
| **Database** | \`Database\` | CRUD-операции с таблицами |
| **Storage** | \`HardDrive\` | Файловые операции (upload/download/signed URL) |

### AI-специфичные

| Узел | Иконка | Назначение |
|------|--------|------------|
| **Embedding** | \`Hash\` | Генерация векторных эмбеддингов |
| **Classifier** | \`Tag\` | Классификация текста по категориям |
| **Memory** | \`Brain\` | Чтение/запись в долговременную память |
| **Tool** | \`Wrench\` | Вызов кастомного инструмента |

---

## Tool Node — Вызов кастомных инструментов

Узел **Tool** позволяет интегрировать инструменты из Библиотеки инструментов непосредственно в потоки обработки данных.

### Назначение

Tool Node выполняет кастомные инструменты (Prompt или HTTP API) как часть потока, передавая данные между узлами автоматически.

### Свойства узла

| Поле | Описание |
|------|----------|
| **Label** | Отображаемое имя узла на холсте |
| **Tool** | Выбор инструмента из библиотеки |
| **Parameter Mapping** | Маппинг входных данных на параметры |

### Выбор инструмента

1. Добавьте узел **Tool** из категории **AI** на холст
2. Выберите узел — откроется панель свойств справа
3. В выпадающем списке **Tool** выберите нужный инструмент
4. Система автоматически отобразит параметры инструмента

### Маппинг параметров

Для каждого параметра инструмента можно указать источник данных:

| Источник | Описание | Пример |
|----------|----------|--------|
| **Статическое значение** | Фиксированное значение | \`"Москва"\` |
| **JSONPath из входа** | Извлечение из входных данных | \`$.city\` |
| **Весь вход** | Передать все входные данные | \`$\` |

**Пример маппинга:**
\`\`\`json
{
  "city": "$.location.city",
  "api_key": "sk-xxx-static-key",
  "units": "metric"
}
\`\`\`

### Поддерживаемые типы инструментов

| Тип | Иконка | Поведение в потоке |
|-----|--------|-------------------|
| **Prompt** | \`FileText\` | Подстановка параметров в шаблон, возврат текста |
| **HTTP API** | \`Globe\` | Выполнение HTTP-запроса, возврат JSON |

### Входы и выходы

| Точка | Описание |
|-------|----------|
| **Вход (сверху)** | Данные для передачи в параметры инструмента |
| **Выход (снизу)** | Результат выполнения инструмента |

### Пример: Обогащение данных через API

\`\`\`mermaid
graph TD
    I[Input: город] --> T[Tool: get_weather]
    T --> M[Model: сгенерировать отчёт]
    M --> O[Output]
\`\`\`

В этом примере:
1. **Input** получает название города
2. **Tool** вызывает HTTP-инструмент для получения погоды
3. **Model** генерирует текстовый отчёт на основе данных о погоде
4. **Output** возвращает финальный результат

### Обработка ошибок

При ошибке выполнения инструмента:

| Ситуация | Поведение |
|----------|-----------|
| **HTTP ошибка** | Узел помечается красным, поток останавливается |
| **Таймаут** | Ошибка после 30 секунд ожидания |
| **Невалидные параметры** | Ошибка валидации перед запуском |

### Советы по использованию

> **Совет 1**: Создавайте инструменты для часто используемых API-вызовов и переиспользуйте их в разных потоках.

> **Совет 2**: Используйте JSONPath-маппинг для динамического извлечения параметров из сложных структур данных.

> **Совет 3**: Комбинируйте Tool Node с Condition Node для ветвления логики на основе результатов инструмента.

## Flow Runtime — Выполнение потоков

Редактор включает полноценный движок выполнения потоков с визуализацией в реальном времени.

### Панель выполнения

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Запуск** | \`Play\` | Начать выполнение потока |
| **Стоп** | \`Square\` | Остановить выполнение |
| **Очистить** | \`Eraser\` | Сбросить результаты |
| **Закрыть** | \`X\` | Закрыть панель (автоматически останавливает) |

### Валидация перед запуском

> **Важно**: Для запуска потока необходимо:
> 1. Наличие хотя бы одного узла **Input**
> 2. Заполнение поля **inputValue** в свойствах Input-узла

При отсутствии данных отображается: *«Пустой запрос — пустой ответ»*

### Визуализация выполнения

| Индикатор | Цвет | Описание |
|-----------|------|----------|
| **Кольцо (running)** | Голубой | Узел выполняется |
| **Галочка (completed)** | Зелёный | Узел завершён успешно |
| **Крестик (failed)** | Красный | Ошибка выполнения |
| **Пауза (waiting)** | Жёлтый | Ожидание пользователя |
| **Стрелка (skipped)** | Серый | Узел пропущен (bypass) |

### Визуализация данных на связях

При наведении на связь во время/после выполнения отображается:

| Элемент | Описание |
|---------|----------|
| **Тип данных** | text / json / file / signal |
| **Превью данных** | Форматированный JSON или текст |
| **Пульсирующая точка** | Индикатор прохождения данных |

### Контрольные точки (Checkpoints)

Узел **Checkpoint** приостанавливает выполнение до ручного подтверждения:

1. Поток останавливается на узле Checkpoint
2. В панели появляется сообщение и кнопки
3. Нажмите **Подтвердить** или **Отклонить**
4. Поток продолжится или завершится

## Пример: Цепочка с критиком

\`\`\`mermaid
graph LR
    I[Вход] --> P[Промпт]
    P --> M1[GPT-5]
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

A visual tool for designing and **executing** complex data processing chains.

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
| **Run** | \`Play\` | Start flow execution |
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
| **Input** | \`ArrowRight\` | Data entry point (required for execution) |
| **Output** | \`ArrowLeft\` | Result output point |
| **Prompt** | \`FileText\` | System prompt |
| **Model** | \`Bot\` | Language model call (Gemini, GPT-5, etc.) |

### Logic

| Node | Icon | Purpose |
|------|------|---------|
| **Condition** | \`HelpCircle\` | Branching (if/else) |
| **Checkpoint** | \`UserCheck\` | Wait for user confirmation |
| **Switch** | \`GitBranch\` | Multiple branching |
| **Loop** | \`RefreshCw\` | Array iteration |
| **Delay** | \`Timer\` | Execution delay (ms/sec/min) |

### Data

| Node | Icon | Purpose |
|------|------|---------|
| **Transform** | \`Wrench\` | Data transformation (JSONPath, regex) |
| **Filter** | \`Filter\` | Conditional filtering |
| **Merge** | \`Merge\` | Merge multiple streams |
| **Split** | \`Scissors\` | Split into substreams |

### Integrations

| Node | Icon | Purpose |
|------|------|---------|
| **API** | \`Globe\` | HTTP requests (GET/POST/PUT/DELETE) |
| **Database** | \`Database\` | CRUD operations with tables |
| **Storage** | \`HardDrive\` | File operations (upload/download/signed URL) |

### AI-Specific

| Node | Icon | Purpose |
|------|------|---------|
| **Embedding** | \`Hash\` | Generate vector embeddings |
| **Classifier** | \`Tag\` | Classify text into categories |
| **Memory** | \`Brain\` | Read/write to long-term memory |
| **Tool** | \`Wrench\` | Invoke custom tool |

---

## Tool Node — Calling Custom Tools

The **Tool** node allows you to integrate tools from the Tools Library directly into data processing flows.

### Purpose

Tool Node executes custom tools (Prompt or HTTP API) as part of a flow, automatically passing data between nodes.

### Node Properties

| Field | Description |
|-------|-------------|
| **Label** | Display name on canvas |
| **Tool** | Select tool from library |
| **Parameter Mapping** | Map input data to parameters |

### Selecting a Tool

1. Add a **Tool** node from the **AI** category to the canvas
2. Select the node — properties panel opens on the right
3. Choose the desired tool from the **Tool** dropdown
4. The system automatically displays tool parameters

### Parameter Mapping

For each tool parameter, you can specify a data source:

| Source | Description | Example |
|--------|-------------|---------|
| **Static value** | Fixed value | \`"Moscow"\` |
| **JSONPath from input** | Extract from input data | \`$.city\` |
| **Entire input** | Pass all input data | \`$\` |

**Mapping example:**
\`\`\`json
{
  "city": "$.location.city",
  "api_key": "sk-xxx-static-key",
  "units": "metric"
}
\`\`\`

### Supported Tool Types

| Type | Icon | Behavior in Flow |
|------|------|------------------|
| **Prompt** | \`FileText\` | Parameter substitution in template, returns text |
| **HTTP API** | \`Globe\` | Execute HTTP request, returns JSON |

### Inputs and Outputs

| Point | Description |
|-------|-------------|
| **Input (top)** | Data to pass to tool parameters |
| **Output (bottom)** | Tool execution result |

### Example: Data Enrichment via API

\`\`\`mermaid
graph TD
    I[Input: city] --> T[Tool: get_weather]
    T --> M[Model: generate report]
    M --> O[Output]
\`\`\`

In this example:
1. **Input** receives the city name
2. **Tool** calls HTTP tool to get weather
3. **Model** generates a text report based on weather data
4. **Output** returns the final result

### Error Handling

When tool execution fails:

| Situation | Behavior |
|-----------|----------|
| **HTTP error** | Node marked red, flow stops |
| **Timeout** | Error after 30 seconds |
| **Invalid parameters** | Validation error before execution |

### Usage Tips

> **Tip 1**: Create tools for frequently used API calls and reuse them across different flows.

> **Tip 2**: Use JSONPath mapping to dynamically extract parameters from complex data structures.

> **Tip 3**: Combine Tool Node with Condition Node to branch logic based on tool results.

## Flow Runtime — Executing Flows

The editor includes a full-featured flow execution engine with real-time visualization.

### Execution Panel

| Element | Icon | Description |
|---------|------|-------------|
| **Run** | \`Play\` | Start flow execution |
| **Stop** | \`Square\` | Stop execution |
| **Clear** | \`Eraser\` | Reset results |
| **Close** | \`X\` | Close panel (auto-stops execution) |

### Pre-run Validation

> **Important**: To run a flow, you need:
> 1. At least one **Input** node
> 2. Fill in the **inputValue** field in Input node properties

If no data provided: *"Empty request — empty response"*

### Execution Visualization

| Indicator | Color | Description |
|-----------|-------|-------------|
| **Ring (running)** | Blue | Node is executing |
| **Checkmark (completed)** | Green | Node completed successfully |
| **Cross (failed)** | Red | Execution error |
| **Pause (waiting)** | Yellow | Waiting for user |
| **Arrow (skipped)** | Gray | Node bypassed |

### Data Visualization on Edges

Hover over an edge during/after execution to see:

| Element | Description |
|---------|-------------|
| **Data type** | text / json / file / signal |
| **Data preview** | Formatted JSON or text |
| **Pulsing dot** | Data flow indicator |

### Checkpoints

**Checkpoint** node pauses execution until manual confirmation:

1. Flow stops at Checkpoint node
2. Panel shows message and buttons
3. Click **Confirm** or **Reject**
4. Flow continues or terminates

## Example: Chain with Critic

\`\`\`mermaid
graph LR
    I[Input] --> P[Prompt]
    P --> M1[GPT-5]
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

### Арбитр (Arbiter) — LLM-as-Judge

Арбитр — это специализированный оценщик для сравнения и анализа ответов. Использует критерии оценки:

**Стандартные критерии (0-10 для каждого):**
- **Фактологичность** — Проверка точности фактов, отсутствие ложных утверждений
- **Релевантность** — Насколько прямо ответ относится к вопросу/задаче
- **Полнота** — Охватены ли все важные аспекты? Исчерпывающий ответ?
- **Cost-Efficiency** — Оптимальное соотношение качества к длине (экономия токенов)
- **Ясность** — Хорошо ли структурирован и понятен ответ?
- **Консистентность** — Отсутствие внутренних противоречий и логических ошибок

**Функции арбитра:**
- Синтез разных точек зрения
- Структурированная оценка по критериям
- Выявление сильных сторон и слабостей
- Финальные рекомендации
- Разрешение противоречий между экспертами

**Использование в D-Chat:**
Вызовите арбитра (лампочка) из основного чата — получите структурированную оценку выбранного сообщения.

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
| **decision** | \`CheckCircle\` | Принятое решение (авто-сохранение при рейтинге ≥7) |
| **context** | \`Bookmark\` | Контекстная информация |
| **instruction** | \`Lightbulb\` | Инструкция или правило |

## Сохранение в память

### Автоматическое сохранение

Ответы моделей с высоким рейтингом (7+ «мозгов») автоматически сохраняются как **decision**.

### Ручное сохранение

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Кнопка сохранения** | \`Package\` | Появляется при наведении на сообщение |
| **Защита от дубликатов** | ✓ | Повторное сохранение заблокировано |

> **Совет**: При удалении сообщения из чата связанные фрагменты памяти удаляются автоматически.

## Управление памятью

Память сессии доступна как в D-Chat (консультант), так и в основном чате (Панель экспертов).

### Элементы управления в заголовке

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Индикатор** | \`Brain\` N | Количество сохранённых фрагментов |
| **Тултип** | (наведение) | Разбивка по типам фрагментов |
| **Обновить** | \`RefreshCw\` | Принудительное обновление из БД (с анимацией ✓) |
| **Управление** | \`Settings2\` | Открыть диалог управления |

### Диалог управления памятью (SessionMemoryDialog)

| Элемент | Описание |
|---------|----------|
| **Табы фильтрации** | Все / Сообщения / Резюме / Решения / Контекст / Инструкции |
| **Вкладка «Дубликаты»** | Группировка повторяющихся фрагментов |
| **Поле поиска** | Текстовый или семантический поиск |
| **Переключатель режима** | \`Text\` ↔ \`Sparkles\` (AI-поиск) |
| **Similarity Score** | Процент сходства при семантическом поиске |
| **Карточки фрагментов** | Содержимое с датой и кнопкой удаления |
| **Массовое удаление** | Удаление всех дубликатов одной группы |
| **Очистить все** | Удаление всех фрагментов (с подтверждением) |
| **ScrollArea** | Вертикальная прокрутка для больших объёмов |

## Семантический поиск

### Как работает

1. Нажмите кнопку \`Sparkles\` для активации AI-режима
2. Введите поисковый запрос **на естественном языке**
3. Система генерирует векторный эмбеддинг через Edge Function
4. pgvector находит ближайшие по косинусному расстоянию фрагменты
5. Результаты сортируются по **Similarity Score** (%)

### Преимущества

| Текстовый поиск | Семантический поиск |
|-----------------|---------------------|
| Ищет точные совпадения слов | Ищет по смыслу и контексту |
| «API ключ» найдёт только «API ключ» | «настройки доступа» найдёт «API ключ» |
| Быстрый, но ограниченный | Медленнее, но умнее |

### Индикаторы результатов

| Элемент | Описание |
|---------|----------|
| **Similarity Score** | \`85%\` — близость к запросу |
| **Бейдж типа** | Цветовая маркировка категории |
| **Дата создания** | Когда фрагмент был сохранён |

## Обнаружение дубликатов

Система автоматически определяет повторяющиеся фрагменты:

1. Переключитесь на вкладку **«Дубликаты»**
2. Дубликаты сгруппированы по содержимому
3. Выделены **янтарной** рамкой
4. Отображается счётчик повторов (×N)
5. Кнопка **«Удалить группу»** для массовой очистки

> **Совет**: Регулярно очищайте дубликаты для оптимизации контекста.

## Интеграция с ответами (RAG)

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
| **RLS** | Доступ только к своим сессиям |
| **API-ключ** | Требуется OpenAI ключ в профиле |`,

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
| **decision** | \`CheckCircle\` | Made decision (auto-saved at rating ≥7) |
| **context** | \`Bookmark\` | Contextual information |
| **instruction** | \`Lightbulb\` | Instruction or rule |

## Saving to Memory

### Automatic Saving

Model responses with high ratings (7+ brains) are automatically saved as **decision**.

### Manual Saving

| Element | Icon | Description |
|---------|------|-------------|
| **Save button** | \`Package\` | Appears on message hover |
| **Duplicate protection** | ✓ | Re-saving is blocked |

> **Tip**: When deleting a message from chat, related memory fragments are automatically deleted.

## Memory Management

Session memory is accessible both in D-Chat (consultant) and in the main chat (Expert Panel).

### Header Controls

| Element | Icon | Description |
|---------|------|-------------|
| **Indicator** | \`Brain\` N | Number of saved fragments |
| **Tooltip** | (hover) | Breakdown by fragment types |
| **Refresh** | \`RefreshCw\` | Force refresh from DB (with ✓ animation) |
| **Manage** | \`Settings2\` | Open management dialog |

### Memory Management Dialog (SessionMemoryDialog)

| Element | Description |
|---------|-------------|
| **Filter tabs** | All / Messages / Summaries / Decisions / Context / Instructions |
| **Duplicates tab** | Grouping of repeating fragments |
| **Search field** | Text or semantic search |
| **Mode toggle** | \`Text\` ↔ \`Sparkles\` (AI search) |
| **Similarity Score** | Similarity percentage for semantic search |
| **Fragment cards** | Content with date and delete button |
| **Bulk delete** | Delete all duplicates in a group |
| **Clear all** | Delete all fragments (with confirmation) |
| **ScrollArea** | Vertical scroll for large volumes |

## Semantic Search

### How It Works

1. Click the \`Sparkles\` button to activate AI mode
2. Enter a search query in **natural language**
3. System generates vector embedding via Edge Function
4. pgvector finds nearest fragments by cosine distance
5. Results are sorted by **Similarity Score** (%)

### Advantages

| Text Search | Semantic Search |
|-------------|-----------------|
| Finds exact word matches | Finds by meaning and context |
| "API key" finds only "API key" | "access settings" finds "API key" |
| Fast but limited | Slower but smarter |

### Result Indicators

| Element | Description |
|---------|-------------|
| **Similarity Score** | \`85%\` — closeness to query |
| **Type badge** | Color-coded category |
| **Creation date** | When fragment was saved |

## Duplicate Detection

The system automatically identifies repeating fragments:

1. Switch to the **"Duplicates"** tab
2. Duplicates are grouped by content
3. Highlighted with an **amber** border
4. Repeat count is shown (×N)
5. **"Delete group"** button for bulk cleanup

> **Tip**: Regularly clean duplicates to optimize context.

## Integration with Responses (RAG)

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
| **RLS** | Access only to own sessions |
| **API key** | OpenAI key required in profile |`
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
| **Группа «Эксперты»** | \`Sparkles\` | Ролевые паттерны экспертов (не isTechnicalStaff) |
| **Группа «Технический персонал»** | \`Wrench\` | Ролевые паттерны тех. персонала |
| **Создать новый** | \`Plus\` | Кнопка создания паттерна |
| **Редактировать** | \`Pencil\` | Редактирование своего паттерна |
| **Дублировать** | \`Copy\` | Копирование системного паттерна |
| **Удалить** | \`Trash2\` | Удаление своего паттерна |
| **Системный** | \`Lock\` | Метка системного паттерна (только чтение) |
| **Публичный** | \`Users\` | Метка публичного паттерна |

> **Для админов**: Системные паттерны (с меткой \`Lock\`) видны только администраторам. Обычные пользователи видят только свои и публичные паттерны.

### Правая панель — Детали

Отображает полную информацию о выбранном паттерне:

- Все этапы с инструкциями (отображаются вертикальным **таймлайном** с анимацией потока)
- Контрольные точки
- Параметры коммуникации
- Правила реакций

### Визуальный таймлайн этапов

При выборе стратегического паттерна этапы отображаются как вертикальный пайплайн:

| Элемент | Описание |
|---------|----------|
| **Номер этапа** | Кружок с номером (подсвечивается при наведении) |
| **Линия-коннектор** | Градиентная линия между этапами с анимацией потока |
| **Карточка этапа** | Название, цель и назначенные роли |
| **Анимация** | Визуальный эффект «движения данных» по пайплайну |

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
| **"Experts" Group** | \`Sparkles\` | Expert role patterns (not isTechnicalStaff) |
| **"Technical Staff" Group** | \`Wrench\` | Technical staff role patterns |
| **Create new** | \`Plus\` | Pattern creation button |
| **Edit** | \`Pencil\` | Edit your pattern |
| **Duplicate** | \`Copy\` | Copy system pattern |
| **Delete** | \`Trash2\` | Delete your pattern |
| **System** | \`Lock\` | System pattern badge (read-only) |
| **Public** | \`Users\` | Public pattern badge |

> **For Admins**: System patterns (with \`Lock\` badge) are visible only to administrators. Regular users see only their own and public patterns.

### Right Panel — Details

Displays full information about selected pattern:

- All stages with instructions (displayed as a vertical **timeline** with flow animation)
- Checkpoints
- Communication parameters
- Reaction rules

### Visual Stage Timeline

When selecting a strategic pattern, stages are displayed as a vertical pipeline:

| Element | Description |
|---------|-------------|
| **Stage number** | Circle with number (highlights on hover) |
| **Connector line** | Gradient line between stages with flow animation |
| **Stage card** | Name, objective and assigned roles |
| **Animation** | Visual "data flow" effect through the pipeline |

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
  },
  // Admin-only section: Hydra Training
  {
    id: 'hydra-training',
    titleKey: 'hydrapedia.sections.hydraTraining',
    icon: 'Shield',
    adminOnly: true,
    content: {
      ru: `# Дрессировка Гидры

> **Внимание**: Эта секция доступна только администраторам. Здесь описаны внутренние механизмы системы, которые определяют поведение ИИ на системном уровне.

## Философия системных паттернов

Системные паттерны — это **инстинкты Гидры**, заложенные на глубинном уровне. Они определяют:

- **Как** Гидра подходит к решению задач
- **Какие** роли участвуют на каждом этапе
- **Когда** требуется валидация или переход к следующему шагу

### Отличие от пользовательских паттернов

| Аспект | Системные паттерны | Пользовательские паттерны |
|--------|-------------------|--------------------------|
| Видимость | Только для админов | Для всех пользователей |
| Редактирование | Только дублирование | Полное редактирование |
| Назначение | Базовые инстинкты | Кастомные воркфлоу |
| Метка | 🔒 Замок | — |

## Архитектура стратегических паттернов

Стратегические паттерны (Task Blueprints) определяют **последовательность этапов** решения задачи:

\`\`\`mermaid
graph LR
    subgraph "Стратегический паттерн"
        S1[Этап 1] --> C1{Контрольная точка}
        C1 --> S2[Этап 2]
        S2 --> C2{Контрольная точка}
        C2 --> S3[Этап 3]
    end
    
    S1 -.-> R1[Роли этапа 1]
    S2 -.-> R2[Роли этапа 2]
    S3 -.-> R3[Роли этапа 3]
\`\`\`

### Компоненты паттерна

1. **Этапы (Stages)**: Последовательные шаги выполнения
   - Название и цель этапа
   - Назначенные роли (какие агенты работают)
   - Ожидаемые результаты (deliverables)

2. **Контрольные точки (Checkpoints)**: Условия для продвижения
   - После какого этапа срабатывает
   - Условие для перехода

3. **Категория**: Классификация паттерна
   - \`planning\` — планирование
   - \`creative\` — творческие задачи
   - \`analysis\` — аналитика
   - \`technical\` — технические задачи

## Flow Runtime — Движок выполнения

Flow Runtime — это серверный движок для **автономного выполнения** Flow-диаграмм как пайплайнов обработки данных.

### Архитектура

\`\`\`mermaid
graph TD
    FE[Flow Editor UI] --> API[Edge Function: flow-runtime]
    API --> SCH[Scheduler: топологическая сортировка]
    SCH --> EX[Executor: послойное выполнение]
    EX --> NR[Node Runners]
    NR --> SSE[SSE-стрим событий]
    SSE --> FE
\`\`\`

### Компоненты движка

| Компонент | Файл | Назначение |
|-----------|------|------------|
| **Scheduler** | \`scheduler.ts\` | DAG-планировщик, топологическая сортировка |
| **Executor** | \`executor.ts\` | Оркестрация узлов, управление состоянием |
| **Runners** | \`runners.ts\` | Реализации узлов (Model, API, DB и др.) |
| **Types** | \`types.ts\` | Типы событий и состояний |

### Поддерживаемые узлы (Node Runners)

| Узел | Функция | Описание |
|------|---------|----------|
| **Input** | \`runInputNode\` | Точка входа данных |
| **Prompt** | \`runPromptNode\` | Формирование системного промпта |
| **Model** | \`runModelNode\` | Вызов AI-модели через Lovable AI Gateway |
| **Condition** | \`runConditionNode\` | Логическое ветвление |
| **Checkpoint** | \`runCheckpointNode\` | Ожидание подтверждения пользователя |
| **Transform** | \`runTransformNode\` | Преобразование данных (JSONPath, regex) |
| **Filter** | \`runFilterNode\` | Фильтрация по условию |
| **Merge** | \`runMergeNode\` | Объединение потоков |
| **Split** | \`runSplitNode\` | Разделение на подпотоки |
| **Delay** | \`runDelayNode\` | Задержка выполнения |
| **Output** | \`runOutputNode\` | Финальный результат |
| **API** | \`runApiNode\` | HTTP-запросы |
| **Database** | \`runDatabaseNode\` | CRUD через Supabase |
| **Storage** | \`runStorageNode\` | Файловые операции |
| **Loop** | \`runLoopNode\` | Итерация по массиву |
| **Switch** | \`runSwitchNode\` | Множественное ветвление |
| **Embedding** | \`runEmbeddingNode\` | Генерация векторов |
| **Memory** | \`runMemoryNode\` | Работа с session_memory |
| **Classifier** | \`runClassifierNode\` | AI-классификация текста |
| **Tool** | \`runToolNode\` | Вызов кастомного инструмента |

### SSE-события

Движок стримит события в реальном времени:

| Событие | Описание |
|---------|----------|
| \`flow_start\` | Поток начал выполнение |
| \`node_start\` | Узел начал выполнение |
| \`node_progress\` | Прогресс узла (опционально) |
| \`node_complete\` | Узел завершён успешно |
| \`node_error\` | Ошибка выполнения узла |
| \`checkpoint\` | Ожидание подтверждения |
| \`flow_complete\` | Поток завершён |
| \`flow_error\` | Критическая ошибка |

### Модель по умолчанию

Движок использует \`google/gemini-3-flash-preview\` для узлов Model и Classifier, так как эта модель поддерживается Lovable AI Gateway.

> **Важно**: Старые диаграммы с \`openai/gpt-4o-mini\` требуют ручной корректировки в БД.

## Ролевые шаблоны (Role Behaviors)

Ролевые шаблоны определяют **характер и стиль** каждого агента:

### Стиль коммуникации

| Параметр | Описание |
|----------|----------|
| **Тон** | formal / friendly / neutral / provocative |
| **Детальность** | concise / detailed / adaptive |
| **Предпочтения формата** | markdown, списки, код, таблицы |

### Реакции на триггеры

Каждый агент может иметь предустановленные реакции:

\`\`\`json
{
  "trigger": "unclear_question",
  "behavior": "Попросить уточнить задачу перед ответом"
}
\`\`\`

### Взаимодействия между ролями

| Тип связи | Описание |
|-----------|----------|
| **defers_to** | Уступает этим ролям (признаёт авторитет) |
| **challenges** | Может оспаривать решения этих ролей |
| **collaborates** | Сотрудничает на равных |

## Технический персонал vs Эксперты

В системе есть разделение ролей на две категории:

### Эксперты (Experts)
Участвуют в коллегиальных обсуждениях (К-чат, Д-чат):
- \`@assistant\` — универсальный эксперт
- \`@critic\` — критик
- \`@arbiter\` — арбитр
- \`@consultant\` — консультант
- \`@moderator\` — модератор
- \`@advisor\` — советник
- \`@webhunter\` — web-охотник

### Технический персонал (Technical Staff)
Персональные агенты-помощники, НЕ участвуют в советах:
- \`@analyst\` — аналитик (формирование ТЗ)
- \`@promptengineer\` — промпт-инженер
- \`@flowregulator\` — логистик потоков
- \`@archivist\` — архивариус (управление памятью)

> **Важно**: Технические роли автоматически исключаются из селекторов моделей в экспертных панелях.

## Интеграция с Flow Editor

Системные паттерны можно визуализировать через Flow Editor:

1. Кнопка **«Открыть в редакторе потоков»** генерирует диаграмму
2. Диаграмма сохраняется с \`source: 'pattern'\`
3. Такие диаграммы скрыты от обычных пользователей в списке «Открыть»

### Маппинг элементов

| Элемент паттерна | Элемент Flow |
|------------------|--------------|
| Этап (Stage) | Group Node (контейнер) |
| Роль на этапе | Model Node внутри группы |
| Контрольная точка | Checkpoint Node |
| Результат (Deliverable) | Output Node |

## Рекомендации по созданию паттернов

### Стратегические паттерны

1. **Декомпозиция**: Разбивайте сложные задачи на 3-5 этапов
2. **Роли**: Назначайте 1-3 роли на этап для фокуса
3. **Контрольные точки**: Добавляйте после критических этапов
4. **Результаты**: Чётко определяйте ожидаемые артефакты

### Ролевые шаблоны

1. **Уникальность**: Каждая роль должна иметь уникальный характер
2. **Консистентность**: Стиль коммуникации должен соответствовать задачам роли
3. **Взаимодействия**: Настройте иерархию для предсказуемого поведения

## Синхронизация табеля о рангах

При сохранении иерархии ролей система автоматически проверяет симметричность связей:

### Правила симметрии

| Связь | Требуется | Описание |
|-------|-----------|----------|
| \`A.defers_to[B]\` | \`B.challenges[A]\` | Начальник-подчинённый |
| \`A.collaborates[B]\` | \`B.collaborates[A]\` | Коллеги на равных |

### Диалог разрешения конфликтов

При обнаружении противоречий открывается \`ConflictResolutionDialog\`:

| Элемент | Описание |
|---------|----------|
| **Список конфликтов** | Какие роли требуют синхронизации |
| **Предлагаемые изменения** | Автоматически рассчитанные правки |
| **Синхронизировать всё** | Применить все изменения в одной транзакции |
| **Отмена** | Сохранить без синхронизации |

> **Важно**: Рекомендуется всегда синхронизировать иерархию для предсказуемого поведения агентов.

## Примеры системных паттернов

### Prompt Optimization Pipeline

Этапы:
1. **Анализ контекста** (@analyst) — формирование ТЗ
2. **Оптимизация промпта** (@promptengineer) — применение техник
3. **Валидация** (@critic) — проверка результата

### Session Memory Update

Этапы:
1. **Сбор контекста** (@archivist) — анализ сессии
2. **Генерация эмбеддингов** — векторизация
3. **Компактификация** (@archivist) — сжатие памяти`,

      en: `# Hydra Training

> **Note**: This section is only available to administrators. It describes the internal mechanisms of the system that define AI behavior at the system level.

## System Patterns Philosophy

System patterns are **Hydra's instincts**, embedded at a deep level. They define:

- **How** Hydra approaches task solving
- **Which** roles participate at each stage
- **When** validation or transition to the next step is required

### Difference from User Patterns

| Aspect | System Patterns | User Patterns |
|--------|-----------------|---------------|
| Visibility | Admins only | All users |
| Editing | Duplication only | Full editing |
| Purpose | Basic instincts | Custom workflows |
| Label | 🔒 Lock | — |

## Strategic Patterns Architecture

Strategic patterns (Task Blueprints) define the **sequence of stages** for solving a task:

\`\`\`mermaid
graph LR
    subgraph "Strategic Pattern"
        S1[Stage 1] --> C1{Checkpoint}
        C1 --> S2[Stage 2]
        S2 --> C2{Checkpoint}
        C2 --> S3[Stage 3]
    end
    
    S1 -.-> R1[Stage 1 Roles]
    S2 -.-> R2[Stage 2 Roles]
    S3 -.-> R3[Stage 3 Roles]
\`\`\`

### Pattern Components

1. **Stages**: Sequential execution steps
   - Stage name and objective
   - Assigned roles (which agents work)
   - Expected deliverables

2. **Checkpoints**: Conditions for progression
   - After which stage it triggers
   - Condition for transition

3. **Category**: Pattern classification
   - \`planning\` — planning
   - \`creative\` — creative tasks
   - \`analysis\` — analytics
   - \`technical\` — technical tasks

## Flow Runtime — Execution Engine

Flow Runtime is a server-side engine for **autonomous execution** of Flow diagrams as data processing pipelines.

### Architecture

\`\`\`mermaid
graph TD
    FE[Flow Editor UI] --> API[Edge Function: flow-runtime]
    API --> SCH[Scheduler: topological sort]
    SCH --> EX[Executor: layer-by-layer execution]
    EX --> NR[Node Runners]
    NR --> SSE[SSE event stream]
    SSE --> FE
\`\`\`

### Engine Components

| Component | File | Purpose |
|-----------|------|---------|
| **Scheduler** | \`scheduler.ts\` | DAG planner, topological sorting |
| **Executor** | \`executor.ts\` | Node orchestration, state management |
| **Runners** | \`runners.ts\` | Node implementations (Model, API, DB, etc.) |
| **Types** | \`types.ts\` | Event and state types |

### Supported Nodes (Node Runners)

| Node | Function | Description |
|------|----------|-------------|
| **Input** | \`runInputNode\` | Data entry point |
| **Prompt** | \`runPromptNode\` | System prompt formation |
| **Model** | \`runModelNode\` | AI model call via Lovable AI Gateway |
| **Condition** | \`runConditionNode\` | Logical branching |
| **Checkpoint** | \`runCheckpointNode\` | Wait for user confirmation |
| **Transform** | \`runTransformNode\` | Data transformation (JSONPath, regex) |
| **Filter** | \`runFilterNode\` | Conditional filtering |
| **Merge** | \`runMergeNode\` | Stream merging |
| **Split** | \`runSplitNode\` | Split into substreams |
| **Delay** | \`runDelayNode\` | Execution delay |
| **Output** | \`runOutputNode\` | Final result |
| **API** | \`runApiNode\` | HTTP requests |
| **Database** | \`runDatabaseNode\` | CRUD via Supabase |
| **Storage** | \`runStorageNode\` | File operations |
| **Loop** | \`runLoopNode\` | Array iteration |
| **Switch** | \`runSwitchNode\` | Multiple branching |
| **Embedding** | \`runEmbeddingNode\` | Vector generation |
| **Memory** | \`runMemoryNode\` | Work with session_memory |
| **Classifier** | \`runClassifierNode\` | AI text classification |
| **Tool** | \`runToolNode\` | Custom tool invocation |

### SSE Events

The engine streams events in real-time:

| Event | Description |
|-------|-------------|
| \`flow_start\` | Flow started execution |
| \`node_start\` | Node started execution |
| \`node_progress\` | Node progress (optional) |
| \`node_complete\` | Node completed successfully |
| \`node_error\` | Node execution error |
| \`checkpoint\` | Waiting for confirmation |
| \`flow_complete\` | Flow completed |
| \`flow_error\` | Critical error |

### Default Model

The engine uses \`google/gemini-3-flash-preview\` for Model and Classifier nodes, as this model is supported by Lovable AI Gateway.

> **Important**: Old diagrams with \`openai/gpt-4o-mini\` require manual database correction.

## Role Behaviors

Role behaviors define the **character and style** of each agent:

### Communication Style

| Parameter | Description |
|-----------|-------------|
| **Tone** | formal / friendly / neutral / provocative |
| **Verbosity** | concise / detailed / adaptive |
| **Format preferences** | markdown, lists, code, tables |

### Trigger Reactions

Each agent can have preset reactions:

\`\`\`json
{
  "trigger": "unclear_question",
  "behavior": "Ask to clarify the task before responding"
}
\`\`\`

### Role Interactions

| Relation Type | Description |
|---------------|-------------|
| **defers_to** | Defers to these roles (recognizes authority) |
| **challenges** | Can challenge decisions of these roles |
| **collaborates** | Collaborates as equals |

## Technical Staff vs Experts

The system has a division of roles into two categories:

### Experts
Participate in collegiate discussions (K-chat, D-chat):
- \`@assistant\` — universal expert
- \`@critic\` — critic
- \`@arbiter\` — arbiter
- \`@consultant\` — consultant
- \`@moderator\` — moderator
- \`@advisor\` — advisor
- \`@webhunter\` — web hunter

### Technical Staff
Personal assistant agents, DO NOT participate in councils:
- \`@analyst\` — analyst (requirements formation)
- \`@promptengineer\` — prompt engineer
- \`@flowregulator\` — flow logistician
- \`@archivist\` — archivist (memory management)

> **Important**: Technical roles are automatically excluded from model selectors in expert panels.

## Flow Editor Integration

System patterns can be visualized through Flow Editor:

1. The **"Open in Flow Editor"** button generates a diagram
2. The diagram is saved with \`source: 'pattern'\`
3. Such diagrams are hidden from regular users in the "Open" list

### Element Mapping

| Pattern Element | Flow Element |
|-----------------|--------------|
| Stage | Group Node (container) |
| Role in stage | Model Node inside group |
| Checkpoint | Checkpoint Node |
| Deliverable | Output Node |

## Pattern Creation Recommendations

### Strategic Patterns

1. **Decomposition**: Break complex tasks into 3-5 stages
2. **Roles**: Assign 1-3 roles per stage for focus
3. **Checkpoints**: Add after critical stages
4. **Deliverables**: Clearly define expected artifacts

### Role Behaviors

1. **Uniqueness**: Each role should have a unique character
2. **Consistency**: Communication style should match role tasks
3. **Interactions**: Configure hierarchy for predictable behavior

## Hierarchy Synchronization

When saving role hierarchy, the system automatically checks relationship symmetry:

### Symmetry Rules

| Relation | Required | Description |
|----------|----------|-------------|
| \`A.defers_to[B]\` | \`B.challenges[A]\` | Superior-subordinate |
| \`A.collaborates[B]\` | \`B.collaborates[A]\` | Equal colleagues |

### Conflict Resolution Dialog

When contradictions are detected, \`ConflictResolutionDialog\` opens:

| Element | Description |
|---------|-------------|
| **Conflict list** | Which roles need synchronization |
| **Proposed changes** | Automatically calculated edits |
| **Synchronize all** | Apply all changes in one transaction |
| **Cancel** | Save without synchronization |

> **Important**: It's recommended to always synchronize hierarchy for predictable agent behavior.

## System Pattern Examples

### Prompt Optimization Pipeline

Stages:
1. **Context Analysis** (@analyst) — requirements formation
2. **Prompt Optimization** (@promptengineer) — applying techniques
3. **Validation** (@critic) — result verification

### Session Memory Update

Stages:
1. **Context Collection** (@archivist) — session analysis
2. **Embedding Generation** — vectorization
3. **Compactification** (@archivist) — memory compression`
    }
  },
  // NEW SECTIONS: Technical Staff Roles
  {
    id: 'technical-staff',
    titleKey: 'hydrapedia.sections.technicalStaff',
    icon: 'Wrench',
    content: {
      ru: `# Технический персонал

Технический персонал — это специализированные AI-агенты для решения узкопрофильных задач. В отличие от экспертов, они **не участвуют в коллегиальных обсуждениях**, а работают как персональные помощники.

## Штатное расписание

| Роль | Иконка | Специализация |
|------|--------|---------------|
| @analyst | \`LineChart\` | Аналитика, формирование ТЗ |
| @promptengineer | \`Wand2\` | Оптимизация промптов |
| @flowregulator | \`Route\` | Проектирование потоков |
| @archivist | \`Archive\` | Управление памятью |
| @toolsmith | \`Wrench\` | Разработка инструментов |

## Промпт-Инженер (@promptengineer)

Специалист по созданию и оптимизации инструкций для AI-систем.

### Ключевые компетенции

- **Анализ промптов**: Выявление слабых мест в существующих инструкциях
- **Структурирование**: Организация промптов по секциям и блокам
- **Оптимизация**: Улучшение ясности, уменьшение токенов без потери смысла
- **Техники**: Chain-of-thought, few-shot examples, role-playing

### Типичные задачи

| Запрос | Что делает |
|--------|------------|
| «Улучши этот системный промпт» | Анализирует и оптимизирует структуру |
| «Добавь примеры в промпт» | Внедряет few-shot learning |
| «Сделай промпт короче» | Компрессия без потери качества |
| «Создай шаблон для резюмирования» | Проектирует параметризованный промпт |

### Как вызвать

1. Откройте диалог **«Вызов техника»** (\`Wrench\`) в шапке чата
2. Выберите **Промпт-Инженер** из списка
3. Опишите задачу или вставьте промпт для анализа

## Логистик (@flowregulator)

Эксперт по проектированию data-flow диаграмм и оптимизации пайплайнов.

### Ключевые компетенции

- **Архитектура потоков**: Проектирование эффективных цепочек обработки
- **Оптимизация**: Устранение узких мест и избыточных шагов
- **Валидация**: Проверка корректности диаграмм перед запуском
- **Параллелизм**: Настройка Split/Merge для параллельной обработки

### Типичные задачи

| Запрос | Что делает |
|--------|------------|
| «Проверь мою диаграмму» | Анализирует структуру и находит проблемы |
| «Оптимизируй поток» | Предлагает улучшения архитектуры |
| «Добавь обработку ошибок» | Внедряет Condition-узлы для fallback |
| «Настрой параллельное выполнение» | Проектирует Split/Merge ветки |

## Инструменталист (@toolsmith)

Специалист по разработке пользовательских инструментов для AI-агентов.

### Ключевые компетенции

- **Prompt-инструменты**: Создание шаблонов с параметрами
- **HTTP-интеграции**: Настройка API-запросов и заголовков
- **JSONPath**: Извлечение данных из ответов API
- **Документирование**: Оптимизация описаний для AI

### Типичные задачи

| Запрос | Что делает |
|--------|------------|
| «Создай инструмент для Telegram» | Настраивает HTTP POST с токеном бота |
| «Помоги извлечь данные из JSON» | Составляет JSONPath-выражение |
| «Оптимизируй описание инструмента» | Улучшает name/description |
| «Настрой авторизацию для API» | Добавляет заголовки Authorization |

### Пример диалога

\`\`\`
👤 Пользователь:
Создай инструмент для отправки сообщений в Slack

🔧 Инструменталист:
Для Slack webhook нужен HTTP POST инструмент:

**Конфигурация:**
- URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
- Method: POST
- Headers: Content-Type: application/json
- Body: {"text": "{{message}}"}

**Параметры:**
- message (string, required): Текст сообщения

**JSONPath для проверки:** $.ok
\`\`\`

## Архивариус (@archivist)

Хранитель памяти системы, отвечает за организацию и поиск контекста.

### Ключевые компетенции

- **Сессионная память**: Управление session_memory
- **Ролевая память**: Накопление опыта агентов в role_memory
- **Векторный поиск**: Semantic search по эмбеддингам
- **Компактификация**: Сжатие и дедупликация данных

### Типичные задачи

| Запрос | Что делает |
|--------|------------|
| «Найди релевантный контекст» | Семантический поиск по памяти |
| «Сохрани ключевые факты» | Добавление в долгосрочную память |
| «Очисти устаревшие записи» | Компактификация и дедупликация |

## Аналитик (@analyst)

Готовит структурированные технические задания и спецификации.

### Ключевые компетенции

- **Декомпозиция**: Разбиение сложных задач на шаги
- **Формализация**: Преобразование требований в спецификации
- **Документация**: Создание ТЗ и user stories

### Типичные задачи

| Запрос | Что делает |
|--------|------------|
| «Подготовь ТЗ для оптимизации» | Формирует brief для Промпт-Инженера |
| «Проанализируй требования» | Структурирует input |

## Вызов технического персонала

Все технические роли доступны через единый интерфейс:

1. Нажмите \`Wrench\` в шапке чата (кнопка «Вызов техника»)
2. Выберите нужного специалиста из списка
3. Опишите задачу — откроется D-Chat с выбранным агентом

> **Совет**: Технический персонал работает изолированно от основного чата. Используйте их для специализированных задач, не засоряя основную историю.`,

      en: `# Technical Staff

Technical staff are specialized AI agents for narrow-focused tasks. Unlike experts, they **do not participate in collegial discussions** but work as personal assistants.

## Staff Roster

| Role | Icon | Specialization |
|------|------|----------------|
| @analyst | \`LineChart\` | Analytics, requirements formation |
| @promptengineer | \`Wand2\` | Prompt optimization |
| @flowregulator | \`Route\` | Flow design |
| @archivist | \`Archive\` | Memory management |
| @toolsmith | \`Wrench\` | Tool development |

## Prompt Engineer (@promptengineer)

Specialist in creating and optimizing instructions for AI systems.

### Key Competencies

- **Prompt analysis**: Identifying weaknesses in existing instructions
- **Structuring**: Organizing prompts into sections and blocks
- **Optimization**: Improving clarity, reducing tokens without losing meaning
- **Techniques**: Chain-of-thought, few-shot examples, role-playing

### Typical Tasks

| Request | Action |
|---------|--------|
| "Improve this system prompt" | Analyzes and optimizes structure |
| "Add examples to the prompt" | Implements few-shot learning |
| "Make the prompt shorter" | Compression without quality loss |
| "Create a summarization template" | Designs parameterized prompt |

### How to Call

1. Open the **"Call Tech"** dialog (\`Wrench\`) in the chat header
2. Select **Prompt Engineer** from the list
3. Describe the task or paste the prompt for analysis

## Flow Regulator (@flowregulator)

Expert in designing data-flow diagrams and optimizing pipelines.

### Key Competencies

- **Flow architecture**: Designing efficient processing chains
- **Optimization**: Eliminating bottlenecks and redundant steps
- **Validation**: Checking diagram correctness before execution
- **Parallelism**: Configuring Split/Merge for parallel processing

### Typical Tasks

| Request | Action |
|---------|--------|
| "Check my diagram" | Analyzes structure and finds issues |
| "Optimize the flow" | Suggests architecture improvements |
| "Add error handling" | Implements Condition nodes for fallback |
| "Set up parallel execution" | Designs Split/Merge branches |

## Toolsmith (@toolsmith)

Specialist in developing custom tools for AI agents.

### Key Competencies

- **Prompt tools**: Creating templates with parameters
- **HTTP integrations**: Configuring API requests and headers
- **JSONPath**: Extracting data from API responses
- **Documentation**: Optimizing descriptions for AI

### Typical Tasks

| Request | Action |
|---------|--------|
| "Create a Telegram tool" | Configures HTTP POST with bot token |
| "Help extract data from JSON" | Composes JSONPath expression |
| "Optimize tool description" | Improves name/description |
| "Set up API authorization" | Adds Authorization headers |

### Example Dialog

\`\`\`
👤 User:
Create a tool for sending Slack messages

🔧 Toolsmith:
For Slack webhook, you need an HTTP POST tool:

**Configuration:**
- URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
- Method: POST
- Headers: Content-Type: application/json
- Body: {"text": "{{message}}"}

**Parameters:**
- message (string, required): Message text

**JSONPath for verification:** $.ok
\`\`\`

## Archivist (@archivist)

System memory keeper, responsible for organizing and searching context.

### Key Competencies

- **Session memory**: Managing session_memory
- **Role memory**: Accumulating agent experience in role_memory
- **Vector search**: Semantic search via embeddings
- **Compactification**: Compression and deduplication

### Typical Tasks

| Request | Action |
|---------|--------|
| "Find relevant context" | Semantic search through memory |
| "Save key facts" | Adding to long-term memory |
| "Clean outdated entries" | Compactification and deduplication |

## Analyst (@analyst)

Prepares structured technical specifications and requirements.

### Key Competencies

- **Decomposition**: Breaking complex tasks into steps
- **Formalization**: Converting requirements into specifications
- **Documentation**: Creating specs and user stories

### Typical Tasks

| Request | Action |
|---------|--------|
| "Prepare specs for optimization" | Forms brief for Prompt Engineer |
| "Analyze requirements" | Structures input |

## Calling Technical Staff

All technical roles are available through a unified interface:

1. Click \`Wrench\` in the chat header ("Call Tech" button)
2. Select the needed specialist from the list
3. Describe the task — D-Chat opens with the selected agent

> **Tip**: Technical staff work in isolation from the main chat. Use them for specialized tasks without cluttering the main history.`
    }
  },
  // NEW SECTION: Flow Editor Comprehensive Guide
  {
    id: 'flow-editor-guide',
    titleKey: 'hydrapedia.sections.flowEditorGuide',
    icon: 'GitBranch',
    content: {
      ru: `# Редактор потоков

Редактор потоков (Flow Editor) — визуальная среда для проектирования логики обработки данных и автоматизации AI-пайплайнов.

## Концепция

Flow-диаграмма — это **направленный ациклический граф (DAG)**, где:
- **Узлы** — операции обработки (модели, условия, трансформации)
- **Связи** — потоки данных между операциями
- **Группы** — контейнеры для логической организации

\`\`\`mermaid
graph TD
    subgraph "Flow-диаграмма"
        I[Input] --> P[Prompt]
        P --> M[Model]
        M --> C{Condition}
        C -->|Да| T[Transform]
        C -->|Нет| O1[Output 1]
        T --> O2[Output 2]
    end
\`\`\`

## Интерфейс редактора

### Верхняя панель инструментов

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Новая диаграмма** | \`FilePlus\` | Создать пустую диаграмму |
| **Открыть** | \`Folder\` | Загрузить сохранённую диаграмму |
| **Сохранить** | \`Save\` | Сохранить текущую диаграмму |
| **История** | \`History\` | Просмотр версий диаграммы |
| **Авто-раскладка** | \`LayoutGrid\` | Автоматическое выравнивание (Dagre) |
| **Отменить** | \`Undo\` | Отмена последнего действия |
| **Повторить** | \`Redo\` | Повтор отменённого действия |
| **Экспорт** | \`Download\` | Экспорт в JSON/PDF/PNG |

### Левая панель — Палитра узлов

Перетаскивайте узлы из палитры на холст:

#### Базовые узлы

| Узел | Иконка | Назначение |
|------|--------|------------|
| **Input** | \`ArrowDownToLine\` | Точка входа данных |
| **Output** | \`ArrowUpFromLine\` | Финальный результат |
| **Prompt** | \`FileText\` | Системный промпт |
| **Model** | \`Brain\` | Вызов AI-модели |

#### Логические узлы

| Узел | Иконка | Назначение |
|------|--------|------------|
| **Condition** | \`GitBranch\` | Ветвление по условию |
| **Switch** | \`GitMerge\` | Множественное ветвление |
| **Loop** | \`Repeat\` | Итерация по массиву |

#### Узлы данных

| Узел | Иконка | Назначение |
|------|--------|------------|
| **Transform** | \`Shuffle\` | JSONPath, regex, маппинг |
| **Filter** | \`Filter\` | Фильтрация по условию |
| **Merge** | \`Combine\` | Объединение потоков |
| **Split** | \`Split\` | Разделение на ветки |

#### Интеграции

| Узел | Иконка | Назначение |
|------|--------|------------|
| **API** | \`Globe\` | HTTP-запросы |
| **Database** | \`Database\` | CRUD-операции |
| **Storage** | \`HardDrive\` | Файловые операции |
| **Tool** | \`Wrench\` | Кастомный инструмент |

#### Специальные

| Узел | Иконка | Назначение |
|------|--------|------------|
| **Delay** | \`Clock\` | Задержка выполнения |
| **Checkpoint** | \`UserCheck\` | Ожидание подтверждения |
| **Memory** | \`Brain\` | Работа с памятью |
| **Embedding** | \`Sparkles\` | Генерация векторов |
| **Classifier** | \`Tag\` | AI-классификация |
| **Group** | \`Square\` | Контейнер-группа |

### Правая панель — Свойства

При выборе узла отображаются его настройки:

#### Общие свойства

| Поле | Описание |
|------|----------|
| **Label** | Отображаемое имя узла |
| **Description** | Подробное описание |
| **Bypass** | Пропустить при выполнении |

## Типы связей (Edges)

Связи соединяют выходы узлов с входами других узлов.

### Типы данных

| Тип | Цвет | Описание |
|-----|------|----------|
| **Text** | Голубой | Текстовые данные |
| **JSON** | Зелёный | Структурированные объекты |
| **File** | Оранжевый | Файловые ссылки |
| **Signal** | Серый | Управляющие сигналы |

### Стили связей

| Стиль | Описание |
|-------|----------|
| **Bezier** | Плавные кривые (по умолчанию) |
| **Step** | Прямоугольные повороты |
| **Smoothstep** | Скруглённые прямоугольники |
| **Straight** | Прямые линии |

### Обратные связи (Loops)

Связи, направленные «вверх» по графу, отображаются:
- Оранжевым цветом
- Пунктирной линией
- С увеличенной толщиной

## Выполнение потоков

### Режимы выполнения

| Режим | Описание |
|-------|----------|
| **Run** | Полное выполнение от Input до Output |
| **Step** | Пошаговое выполнение с паузами |
| **Debug** | Выполнение с детальным логированием |

### Визуальная обратная связь

| Индикатор | Описание |
|-----------|----------|
| **Пульсация узла** | Узел выполняется |
| **Зелёная галочка** | Успешное завершение |
| **Красный крест** | Ошибка выполнения |
| **Жёлтая пауза** | Ожидание (Checkpoint) |
| **Данные на связи** | Превью передаваемых данных |

### Панель выполнения

| Элемент | Описание |
|---------|----------|
| **Start** | Запуск выполнения |
| **Stop** | Остановка выполнения |
| **Reset** | Сброс результатов |
| **Continue** | Продолжить после Checkpoint |
| **Лог событий** | Список SSE-событий в реальном времени |

## Узел Tool

Узел Tool позволяет вызывать пользовательские инструменты в пайплайне.

### Конфигурация

| Поле | Описание |
|------|----------|
| **Tool** | Выбор инструмента из библиотеки |
| **Parameter Mapping** | Маппинг параметров |

### Маппинг параметров

Каждый параметр инструмента можно связать с:

| Источник | Синтаксис | Пример |
|----------|-----------|--------|
| **Статическое значение** | Текст | \`"Привет"\` |
| **JSONPath из входа** | \`$.path\` | \`$.user.name\` |
| **Весь входной объект** | \`$\` | Передать всё |

### Пример использования

\`\`\`mermaid
graph LR
    M[Model] --> T[Transform: извлечь email]
    T --> TL[Tool: Send Email]
    TL --> O[Output]
\`\`\`

1. Model генерирует ответ с email
2. Transform извлекает email через JSONPath
3. Tool отправляет письмо через HTTP API
4. Output возвращает результат

## История версий

Каждое сохранение создаёт новую версию диаграммы.

### Просмотр истории

1. Нажмите \`History\` в тулбаре
2. Выберите версию из списка
3. Просмотрите или восстановите

### Восстановление версии

| Действие | Описание |
|----------|----------|
| **Просмотр** | Открыть версию для просмотра |
| **Восстановить** | Заменить текущую версию выбранной |

## Экспорт диаграмм

| Формат | Описание |
|--------|----------|
| **JSON** | Полная структура (nodes + edges) |
| **PNG** | Растровое изображение |
| **PDF** | Документ для печати |

## Горячие клавиши

| Комбинация | Действие |
|------------|----------|
| \`Ctrl+Z\` | Отмена |
| \`Ctrl+Y\` | Повтор |
| \`Ctrl+S\` | Сохранить |
| \`Delete\` | Удалить выбранное |
| \`Ctrl+A\` | Выделить всё |

> **Совет**: Используйте Group-узлы для организации сложных диаграмм по логическим блокам.`,

      en: `# Flow Editor

The Flow Editor is a visual environment for designing data processing logic and automating AI pipelines.

## Concept

A flow diagram is a **Directed Acyclic Graph (DAG)** where:
- **Nodes** — processing operations (models, conditions, transformations)
- **Edges** — data flows between operations
- **Groups** — containers for logical organization

\`\`\`mermaid
graph TD
    subgraph "Flow Diagram"
        I[Input] --> P[Prompt]
        P --> M[Model]
        M --> C{Condition}
        C -->|Yes| T[Transform]
        C -->|No| O1[Output 1]
        T --> O2[Output 2]
    end
\`\`\`

## Editor Interface

### Top Toolbar

| Element | Icon | Description |
|---------|------|-------------|
| **New Diagram** | \`FilePlus\` | Create empty diagram |
| **Open** | \`Folder\` | Load saved diagram |
| **Save** | \`Save\` | Save current diagram |
| **History** | \`History\` | View diagram versions |
| **Auto-layout** | \`LayoutGrid\` | Automatic alignment (Dagre) |
| **Undo** | \`Undo\` | Undo last action |
| **Redo** | \`Redo\` | Redo undone action |
| **Export** | \`Download\` | Export to JSON/PDF/PNG |

### Left Panel — Node Palette

Drag nodes from the palette to the canvas:

#### Basic Nodes

| Node | Icon | Purpose |
|------|------|---------|
| **Input** | \`ArrowDownToLine\` | Data entry point |
| **Output** | \`ArrowUpFromLine\` | Final result |
| **Prompt** | \`FileText\` | System prompt |
| **Model** | \`Brain\` | AI model call |

#### Logic Nodes

| Node | Icon | Purpose |
|------|------|---------|
| **Condition** | \`GitBranch\` | Conditional branching |
| **Switch** | \`GitMerge\` | Multiple branching |
| **Loop** | \`Repeat\` | Array iteration |

#### Data Nodes

| Node | Icon | Purpose |
|------|------|---------|
| **Transform** | \`Shuffle\` | JSONPath, regex, mapping |
| **Filter** | \`Filter\` | Condition-based filtering |
| **Merge** | \`Combine\` | Stream merging |
| **Split** | \`Split\` | Branch splitting |

#### Integrations

| Node | Icon | Purpose |
|------|------|---------|
| **API** | \`Globe\` | HTTP requests |
| **Database** | \`Database\` | CRUD operations |
| **Storage** | \`HardDrive\` | File operations |
| **Tool** | \`Wrench\` | Custom tool |

#### Special

| Node | Icon | Purpose |
|------|------|---------|
| **Delay** | \`Clock\` | Execution delay |
| **Checkpoint** | \`UserCheck\` | Awaiting confirmation |
| **Memory** | \`Brain\` | Memory operations |
| **Embedding** | \`Sparkles\` | Vector generation |
| **Classifier** | \`Tag\` | AI classification |
| **Group** | \`Square\` | Container group |

### Right Panel — Properties

When a node is selected, its settings are displayed:

#### Common Properties

| Field | Description |
|-------|-------------|
| **Label** | Displayed node name |
| **Description** | Detailed description |
| **Bypass** | Skip during execution |

## Edge Types

Edges connect node outputs to other node inputs.

### Data Types

| Type | Color | Description |
|------|-------|-------------|
| **Text** | Blue | Text data |
| **JSON** | Green | Structured objects |
| **File** | Orange | File references |
| **Signal** | Gray | Control signals |

### Edge Styles

| Style | Description |
|-------|-------------|
| **Bezier** | Smooth curves (default) |
| **Step** | Rectangular turns |
| **Smoothstep** | Rounded rectangles |
| **Straight** | Straight lines |

### Feedback Loops

Edges directed "up" the graph are displayed with:
- Orange color
- Dashed line
- Increased thickness

## Flow Execution

### Execution Modes

| Mode | Description |
|------|-------------|
| **Run** | Full execution from Input to Output |
| **Step** | Step-by-step execution with pauses |
| **Debug** | Execution with detailed logging |

### Visual Feedback

| Indicator | Description |
|-----------|-------------|
| **Node pulsing** | Node is executing |
| **Green check** | Successful completion |
| **Red cross** | Execution error |
| **Yellow pause** | Waiting (Checkpoint) |
| **Data on edge** | Preview of transmitted data |

### Execution Panel

| Element | Description |
|---------|-------------|
| **Start** | Start execution |
| **Stop** | Stop execution |
| **Reset** | Reset results |
| **Continue** | Continue after Checkpoint |
| **Event log** | Real-time SSE events list |

## Tool Node

The Tool node allows calling custom tools in the pipeline.

### Configuration

| Field | Description |
|-------|-------------|
| **Tool** | Select tool from library |
| **Parameter Mapping** | Parameter mapping |

### Parameter Mapping

Each tool parameter can be linked to:

| Source | Syntax | Example |
|--------|--------|---------|
| **Static value** | Text | \`"Hello"\` |
| **JSONPath from input** | \`$.path\` | \`$.user.name\` |
| **Entire input object** | \`$\` | Pass everything |

### Usage Example

\`\`\`mermaid
graph LR
    M[Model] --> T[Transform: extract email]
    T --> TL[Tool: Send Email]
    TL --> O[Output]
\`\`\`

1. Model generates response with email
2. Transform extracts email via JSONPath
3. Tool sends email via HTTP API
4. Output returns result

## Version History

Each save creates a new diagram version.

### Viewing History

1. Click \`History\` in the toolbar
2. Select version from the list
3. View or restore

### Restoring Version

| Action | Description |
|--------|-------------|
| **View** | Open version for viewing |
| **Restore** | Replace current version with selected |

## Export Diagrams

| Format | Description |
|--------|-------------|
| **JSON** | Full structure (nodes + edges) |
| **PNG** | Raster image |
| **PDF** | Document for printing |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| \`Ctrl+Z\` | Undo |
| \`Ctrl+Y\` | Redo |
| \`Ctrl+S\` | Save |
| \`Delete\` | Delete selected |
| \`Ctrl+A\` | Select all |

> **Tip**: Use Group nodes to organize complex diagrams into logical blocks.`
    }
  },
  // NEW SECTION: API Integrations & Tools
  {
    id: 'api-integrations',
    titleKey: 'hydrapedia.sections.apiIntegrations',
    icon: 'Globe',
    content: {
      ru: `# Интеграции и API

AI-Hydra поддерживает интеграцию с внешними сервисами через систему пользовательских инструментов и узлы API в редакторе потоков.

## Библиотека инструментов

Инструменты (Tools) — это переиспользуемые блоки для расширения возможностей AI-агентов.

### Типы инструментов

| Тип | Иконка | Описание |
|-----|--------|----------|
| **Prompt** | \`FileText\` | Шаблонные промпты с параметрами |
| **HTTP API** | \`Globe\` | Интеграция с внешними API |

## Prompt-инструменты

Параметризованные шаблоны промптов для типовых задач.

### Структура

| Поле | Описание |
|------|----------|
| **Имя** | Уникальный идентификатор (snake_case) |
| **Отображаемое имя** | Человекочитаемое название |
| **Описание** | Что делает инструмент |
| **Шаблон** | Промпт с плейсхолдерами \`{{param}}\` |
| **Параметры** | Входные переменные |

### Пример: Резюмирование

\`\`\`
Название: summarize_text
Шаблон:
Кратко изложи основные тезисы следующего текста:

{{text}}

Формат: маркированный список, не более {{max_points}} пунктов.
\`\`\`

### Параметры

| Имя | Тип | Обязательный | Описание |
|-----|-----|--------------|----------|
| text | string | ✓ | Текст для резюмирования |
| max_points | number | — | Макс. пунктов (по умолчанию 5) |

## HTTP-инструменты

Интеграция с внешними REST API.

### Конфигурация

| Поле | Описание |
|------|----------|
| **URL** | Endpoint API |
| **Method** | GET, POST, PUT, DELETE, PATCH |
| **Headers** | Заголовки (включая авторизацию) |
| **Body Template** | Тело запроса с плейсхолдерами |
| **Response JSONPath** | Путь для извлечения данных |

### Безопасность

| Ограничение | Значение |
|-------------|----------|
| **Приватные IP** | Заблокированы (SSRF-защита) |
| **Таймаут** | 30 секунд |
| **Размер ответа** | Максимум 1 МБ |

### Пример: OpenWeatherMap

\`\`\`json
{
  "url": "https://api.openweathermap.org/data/2.5/weather",
  "method": "GET",
  "headers": {},
  "queryParams": {
    "q": "{{city}}",
    "appid": "{{API_KEY}}",
    "units": "metric",
    "lang": "ru"
  },
  "responseMapping": "$.main.temp"
}
\`\`\`

### JSONPath-выражения

Извлечение данных из ответов API:

| Выражение | Описание | Пример |
|-----------|----------|--------|
| \`$.data\` | Поле data | \`{"data": "value"}\` → \`"value"\` |
| \`$.items[0]\` | Первый элемент | \`{"items": [1,2,3]}\` → \`1\` |
| \`$.user.name\` | Вложенное поле | \`{"user": {"name": "John"}}\` → \`"John"\` |
| \`$..price\` | Все поля price | Рекурсивный поиск |

## Тестирование инструментов

### Prompt Tool Tester

1. Откройте инструмент в библиотеке
2. Нажмите **«Тестировать»** (\`Play\`)
3. Заполните параметры
4. Нажмите **«Выполнить»**
5. Просмотрите результат

### HTTP Tool Tester

1. Откройте HTTP-инструмент
2. Нажмите **«Тестировать»**
3. Заполните параметры
4. Нажмите **«Отправить запрос»**
5. Просмотрите:
   - HTTP-статус
   - Заголовки ответа
   - Тело ответа
   - Извлечённые данные (если настроен JSONPath)

## Узел API в Flow Editor

Для более сложных интеграций используйте узел API в редакторе потоков.

### Возможности

| Функция | Описание |
|---------|----------|
| **Динамические заголовки** | Подстановка из входных данных |
| **Цепочки запросов** | Последовательные вызовы API |
| **Обработка ошибок** | Condition-узлы для fallback |
| **Параллельные запросы** | Split/Merge для batch-операций |

### Пример: Цепочка API-запросов

\`\`\`mermaid
graph LR
    I[Input: user_id] --> A1[API: Get User]
    A1 --> T[Transform: extract orders]
    T --> A2[API: Get Order Details]
    A2 --> O[Output]
\`\`\`

## Узел Database

Прямое взаимодействие с базой данных.

### Операции

| Операция | Описание |
|----------|----------|
| **Select** | Чтение данных с фильтрацией |
| **Insert** | Добавление записей |
| **Update** | Обновление записей |
| **Delete** | Удаление записей |
| **Upsert** | Вставка или обновление |

### Фильтрация (PostgREST)

| Оператор | Описание | Пример |
|----------|----------|--------|
| \`eq\` | Равно | \`status=eq.active\` |
| \`neq\` | Не равно | \`type=neq.draft\` |
| \`gt\` | Больше | \`price=gt.100\` |
| \`lt\` | Меньше | \`count=lt.10\` |
| \`ilike\` | Нечёткий поиск | \`name=ilike.*john*\` |

## Узел Storage

Работа с файловым хранилищем.

### Операции

| Операция | Описание |
|----------|----------|
| **Upload** | Загрузка файла в bucket |
| **Download** | Получение файла |
| **List** | Список файлов в папке |
| **Delete** | Удаление файла |
| **Signed URL** | Генерация временной ссылки |

### Пример использования

\`\`\`mermaid
graph LR
    I[Input: file] --> U[Storage: Upload]
    U --> S[Storage: Signed URL]
    S --> O[Output: public link]
\`\`\`

## Практические примеры

### Telegram-бот уведомлений

\`\`\`json
{
  "url": "https://api.telegram.org/bot{{BOT_TOKEN}}/sendMessage",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "chat_id": "{{chat_id}}",
    "text": "{{message}}",
    "parse_mode": "Markdown"
  }
}
\`\`\`

### Slack Webhook

\`\`\`json
{
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "text": "{{message}}",
    "channel": "{{channel}}"
  }
}
\`\`\`

### GitHub API (создание issue)

\`\`\`json
{
  "url": "https://api.github.com/repos/{{owner}}/{{repo}}/issues",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {{GITHUB_TOKEN}}",
    "Accept": "application/vnd.github.v3+json"
  },
  "body": {
    "title": "{{title}}",
    "body": "{{body}}",
    "labels": ["bug"]
  },
  "responseMapping": "$.html_url"
}
\`\`\`

> **Важно**: Храните API-ключи и токены в секретах, а не в открытом виде в конфигурации инструментов.`,

      en: `# Integrations & API

AI-Hydra supports integration with external services through the custom tools system and API nodes in the flow editor.

## Tools Library

Tools are reusable blocks for extending AI agent capabilities.

### Tool Types

| Type | Icon | Description |
|------|------|-------------|
| **Prompt** | \`FileText\` | Template prompts with parameters |
| **HTTP API** | \`Globe\` | Integration with external APIs |

## Prompt Tools

Parameterized prompt templates for typical tasks.

### Structure

| Field | Description |
|-------|-------------|
| **Name** | Unique identifier (snake_case) |
| **Display Name** | Human-readable name |
| **Description** | What the tool does |
| **Template** | Prompt with \`{{param}}\` placeholders |
| **Parameters** | Input variables |

### Example: Summarization

\`\`\`
Name: summarize_text
Template:
Briefly summarize the main points of the following text:

{{text}}

Format: bulleted list, no more than {{max_points}} points.
\`\`\`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| text | string | ✓ | Text to summarize |
| max_points | number | — | Max points (default 5) |

## HTTP Tools

Integration with external REST APIs.

### Configuration

| Field | Description |
|-------|-------------|
| **URL** | API endpoint |
| **Method** | GET, POST, PUT, DELETE, PATCH |
| **Headers** | Headers (including authorization) |
| **Body Template** | Request body with placeholders |
| **Response JSONPath** | Path for data extraction |

### Security

| Restriction | Value |
|-------------|-------|
| **Private IPs** | Blocked (SSRF protection) |
| **Timeout** | 30 seconds |
| **Response Size** | Maximum 1 MB |

### Example: OpenWeatherMap

\`\`\`json
{
  "url": "https://api.openweathermap.org/data/2.5/weather",
  "method": "GET",
  "headers": {},
  "queryParams": {
    "q": "{{city}}",
    "appid": "{{API_KEY}}",
    "units": "metric",
    "lang": "en"
  },
  "responseMapping": "$.main.temp"
}
\`\`\`

### JSONPath Expressions

Extracting data from API responses:

| Expression | Description | Example |
|------------|-------------|---------|
| \`$.data\` | data field | \`{"data": "value"}\` → \`"value"\` |
| \`$.items[0]\` | First element | \`{"items": [1,2,3]}\` → \`1\` |
| \`$.user.name\` | Nested field | \`{"user": {"name": "John"}}\` → \`"John"\` |
| \`$..price\` | All price fields | Recursive search |

## Testing Tools

### Prompt Tool Tester

1. Open the tool in the library
2. Click **"Test"** (\`Play\`)
3. Fill in parameters
4. Click **"Execute"**
5. View the result

### HTTP Tool Tester

1. Open the HTTP tool
2. Click **"Test"**
3. Fill in parameters
4. Click **"Send Request"**
5. View:
   - HTTP status
   - Response headers
   - Response body
   - Extracted data (if JSONPath configured)

## API Node in Flow Editor

For more complex integrations, use the API node in the flow editor.

### Features

| Feature | Description |
|---------|-------------|
| **Dynamic headers** | Substitution from input data |
| **Request chains** | Sequential API calls |
| **Error handling** | Condition nodes for fallback |
| **Parallel requests** | Split/Merge for batch operations |

### Example: API Request Chain

\`\`\`mermaid
graph LR
    I[Input: user_id] --> A1[API: Get User]
    A1 --> T[Transform: extract orders]
    T --> A2[API: Get Order Details]
    A2 --> O[Output]
\`\`\`

## Database Node

Direct database interaction.

### Operations

| Operation | Description |
|-----------|-------------|
| **Select** | Read data with filtering |
| **Insert** | Add records |
| **Update** | Update records |
| **Delete** | Delete records |
| **Upsert** | Insert or update |

### Filtering (PostgREST)

| Operator | Description | Example |
|----------|-------------|---------|
| \`eq\` | Equals | \`status=eq.active\` |
| \`neq\` | Not equals | \`type=neq.draft\` |
| \`gt\` | Greater than | \`price=gt.100\` |
| \`lt\` | Less than | \`count=lt.10\` |
| \`ilike\` | Fuzzy search | \`name=ilike.*john*\` |

## Storage Node

File storage operations.

### Operations

| Operation | Description |
|-----------|-------------|
| **Upload** | Upload file to bucket |
| **Download** | Get file |
| **List** | List files in folder |
| **Delete** | Delete file |
| **Signed URL** | Generate temporary link |

### Usage Example

\`\`\`mermaid
graph LR
    I[Input: file] --> U[Storage: Upload]
    U --> S[Storage: Signed URL]
    S --> O[Output: public link]
\`\`\`

## Practical Examples

### Telegram Notification Bot

\`\`\`json
{
  "url": "https://api.telegram.org/bot{{BOT_TOKEN}}/sendMessage",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "chat_id": "{{chat_id}}",
    "text": "{{message}}",
    "parse_mode": "Markdown"
  }
}
\`\`\`

### Slack Webhook

\`\`\`json
{
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "text": "{{message}}",
    "channel": "{{channel}}"
  }
}
\`\`\`

### GitHub API (create issue)

\`\`\`json
{
  "url": "https://api.github.com/repos/{{owner}}/{{repo}}/issues",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {{GITHUB_TOKEN}}",
    "Accept": "application/vnd.github.v3+json"
  },
  "body": {
    "title": "{{title}}",
    "body": "{{body}}",
    "labels": ["bug"]
  },
  "responseMapping": "$.html_url"
}
\`\`\`

> **Important**: Store API keys and tokens in secrets, not in plain text in tool configurations.`
    }
  },
  // NEW SECTION: Advanced Patterns & Workflows
  {
    id: 'advanced-patterns',
    titleKey: 'hydrapedia.sections.advancedPatterns',
    icon: 'Layers',
    content: {
      ru: `# Продвинутые паттерны

Продвинутые сценарии использования AI-Hydra для сложных задач автоматизации и многоагентного взаимодействия.

## Мультиагентные дебаты

Паттерн для глубокого анализа через столкновение позиций.

\`\`\`mermaid
graph TD
    U[Пользователь: тезис] --> E1[Эксперт 1: аргументы ЗА]
    U --> E2[Эксперт 2: аргументы ПРОТИВ]
    E1 --> C[Критик: анализ слабых мест]
    E2 --> C
    C --> A[Арбитр: синтез]
    A --> R[Финальное заключение]
\`\`\`

### Этапы

| # | Роль | Задача |
|---|------|--------|
| 1 | @assistant | Развёрнутые аргументы в защиту тезиса |
| 2 | @critic | Контраргументы и опровержения |
| 3 | @moderator | Выделение ключевых расхождений |
| 4 | @arbiter | Взвешенное финальное решение |

### Когда использовать

- Принятие стратегических решений
- Анализ рисков и возможностей
- Проверка гипотез
- Юридическая экспертиза

## Каскадная верификация

Паттерн для критически важных задач с многоуровневой проверкой.

\`\`\`mermaid
graph LR
    I[Запрос] --> G1[Генерация: Эксперт]
    G1 --> V1[Верификация 1: Критик]
    V1 --> V2[Верификация 2: Советник]
    V2 --> F[Финализация: Арбитр]
    F --> O[Результат]
\`\`\`

### Структура

| Этап | Роль | Проверяет |
|------|------|-----------|
| Генерация | @assistant | Создание первичного решения |
| Верификация 1 | @critic | Логическая корректность |
| Верификация 2 | @advisor | Практическая применимость |
| Финализация | @arbiter | Итоговое качество |

### Применение

- Генерация кода для продакшена
- Создание юридических документов
- Медицинские рекомендации
- Финансовые расчёты

## Параллельные эксперты

Паттерн для получения разнообразных точек зрения.

\`\`\`mermaid
graph TD
    Q[Вопрос] --> E1[Эксперт: GPT-5]
    Q --> E2[Эксперт: Claude]
    Q --> E3[Эксперт: Gemini]
    E1 --> M[Merge: объединение]
    E2 --> M
    E3 --> M
    M --> A[Арбитр: синтез]
    A --> R[Консенсус]
\`\`\`

### Преимущества

| Аспект | Описание |
|--------|----------|
| **Разнообразие** | Разные модели = разные перспективы |
| **Надёжность** | Консенсус снижает вероятность ошибок |
| **Скорость** | Параллельная обработка экономит время |

### Реализация в Flow Editor

1. **Input** → данные запроса
2. **Split** → разветвление на N потоков
3. **Model** (×N) → параллельные вызовы моделей
4. **Merge** → объединение ответов
5. **Model** (Арбитр) → синтез консенсуса
6. **Output** → финальный результат

## Итеративная оптимизация

Паттерн для пошагового улучшения результата.

\`\`\`mermaid
graph TD
    I[Начальный вариант] --> E[Оценка: Критик]
    E --> C{Качество OK?}
    C -->|Нет| O[Оптимизация: Эксперт]
    O --> E
    C -->|Да| F[Финальный результат]
\`\`\`

### Компоненты

| Этап | Узел | Описание |
|------|------|----------|
| Оценка | Model + Condition | Критик оценивает качество |
| Оптимизация | Model | Эксперт улучшает по фидбеку |
| Выход | Condition | Проверка критериев качества |

### Применение

- Оптимизация промптов
- Рефакторинг кода
- Редактирование текстов
- Улучшение дизайна

## Контекстная маршрутизация

Паттерн для интеллектуального направления запросов.

\`\`\`mermaid
graph TD
    I[Запрос] --> CL[Classifier: тип задачи]
    CL --> S{Switch}
    S -->|Код| E1[Эксперт: разработка]
    S -->|Текст| E2[Эксперт: редактура]
    S -->|Данные| E3[Эксперт: аналитика]
    S -->|Другое| E4[Эксперт: общий]
    E1 --> O[Output]
    E2 --> O
    E3 --> O
    E4 --> O
\`\`\`

### Реализация

1. **Classifier** — определяет категорию запроса
2. **Switch** — направляет в соответствующую ветку
3. **Специализированные эксперты** — обрабатывают по профилю
4. **Output** — единая точка выхода

## Пайплайн обработки документов

Комплексная обработка документов с извлечением данных.

\`\`\`mermaid
graph LR
    U[Upload] --> S[Storage: сохранение]
    S --> E[Embedding: векторизация]
    E --> M[Memory: индексация]
    M --> Q[Готов к поиску]
\`\`\`

### Этапы

| # | Узел | Действие |
|---|------|----------|
| 1 | Storage | Загрузка файла в bucket |
| 2 | Transform | Извлечение текста |
| 3 | Embedding | Генерация векторов |
| 4 | Memory | Сохранение в session_memory |

### Поиск по документам

\`\`\`mermaid
graph LR
    Q[Вопрос] --> E[Embedding: вектор запроса]
    E --> M[Memory: семантический поиск]
    M --> C[Контекст: топ-K чанков]
    C --> MODEL[Model: ответ с контекстом]
    MODEL --> O[Ответ]
\`\`\`

## Автономный агент с инструментами

Паттерн для самостоятельного решения задач с использованием инструментов.

\`\`\`mermaid
graph TD
    I[Задача] --> P[Planner: декомпозиция]
    P --> L{Loop: шаги}
    L --> A[Selector: выбор инструмента]
    A --> T[Tool: выполнение]
    T --> E[Evaluator: проверка]
    E --> C{Готово?}
    C -->|Нет| L
    C -->|Да| O[Результат]
\`\`\`

### Компоненты

| Роль | Описание |
|------|----------|
| **Planner** | Разбивает задачу на подзадачи |
| **Selector** | Выбирает подходящий инструмент |
| **Executor** | Вызывает Tool-узел |
| **Evaluator** | Проверяет результат шага |

### Пример: Исследование темы

1. Planner формирует план: поиск → анализ → синтез
2. Selector выбирает инструмент веб-поиска
3. Tool выполняет поиск
4. Evaluator проверяет релевантность
5. Цикл повторяется до выполнения плана

## Чейны с памятью

Паттерн для задач, требующих накопления контекста.

\`\`\`mermaid
graph TD
    I[Сессия] --> M1[Model: шаг 1]
    M1 --> MEM1[Memory: сохранить]
    MEM1 --> M2[Model: шаг 2 + контекст]
    M2 --> MEM2[Memory: обновить]
    MEM2 --> M3[Model: шаг 3 + полный контекст]
    M3 --> O[Финал]
\`\`\`

### Применение

- Длинные творческие проекты
- Сложные исследования
- Многошаговые вычисления
- Диалоги с накоплением фактов

## Рекомендации

### Проектирование потоков

| Принцип | Описание |
|---------|----------|
| **Модульность** | Разбивайте на переиспользуемые блоки |
| **Обработка ошибок** | Добавляйте Condition для fallback |
| **Логирование** | Используйте Transform для дебага |
| **Тестирование** | Проверяйте ветки изолированно |

### Оптимизация производительности

| Техника | Эффект |
|---------|--------|
| **Параллелизм** | Split/Merge для независимых операций |
| **Кэширование** | Memory для повторяющихся запросов |
| **Ранний выход** | Condition для быстрого завершения |
| **Batch-обработка** | Loop для массовых операций |

> **Совет**: Начинайте с простых линейных потоков, постепенно добавляя ветвления и циклы по мере необходимости.`,

      en: `# Advanced Patterns

Advanced AI-Hydra usage scenarios for complex automation tasks and multi-agent interaction.

## Multi-Agent Debates

Pattern for deep analysis through position confrontation.

\`\`\`mermaid
graph TD
    U[User: thesis] --> E1[Expert 1: arguments FOR]
    U --> E2[Expert 2: arguments AGAINST]
    E1 --> C[Critic: weakness analysis]
    E2 --> C
    C --> A[Arbiter: synthesis]
    A --> R[Final conclusion]
\`\`\`

### Stages

| # | Role | Task |
|---|------|------|
| 1 | @assistant | Detailed arguments in defense of thesis |
| 2 | @critic | Counterarguments and refutations |
| 3 | @moderator | Highlight key disagreements |
| 4 | @arbiter | Balanced final decision |

### When to Use

- Strategic decision making
- Risk and opportunity analysis
- Hypothesis testing
- Legal expertise

## Cascade Verification

Pattern for critical tasks with multi-level verification.

\`\`\`mermaid
graph LR
    I[Request] --> G1[Generation: Expert]
    G1 --> V1[Verification 1: Critic]
    V1 --> V2[Verification 2: Advisor]
    V2 --> F[Finalization: Arbiter]
    F --> O[Result]
\`\`\`

### Structure

| Stage | Role | Verifies |
|-------|------|----------|
| Generation | @assistant | Primary solution creation |
| Verification 1 | @critic | Logical correctness |
| Verification 2 | @advisor | Practical applicability |
| Finalization | @arbiter | Final quality |

### Application

- Production code generation
- Legal document creation
- Medical recommendations
- Financial calculations

## Parallel Experts

Pattern for obtaining diverse viewpoints.

\`\`\`mermaid
graph TD
    Q[Question] --> E1[Expert: GPT-5]
    Q --> E2[Expert: Claude]
    Q --> E3[Expert: Gemini]
    E1 --> M[Merge: combine]
    E2 --> M
    E3 --> M
    M --> A[Arbiter: synthesis]
    A --> R[Consensus]
\`\`\`

### Advantages

| Aspect | Description |
|--------|-------------|
| **Diversity** | Different models = different perspectives |
| **Reliability** | Consensus reduces error probability |
| **Speed** | Parallel processing saves time |

### Implementation in Flow Editor

1. **Input** → request data
2. **Split** → branch into N streams
3. **Model** (×N) → parallel model calls
4. **Merge** → combine responses
5. **Model** (Arbiter) → consensus synthesis
6. **Output** → final result

## Iterative Optimization

Pattern for step-by-step result improvement.

\`\`\`mermaid
graph TD
    I[Initial version] --> E[Evaluation: Critic]
    E --> C{Quality OK?}
    C -->|No| O[Optimization: Expert]
    O --> E
    C -->|Yes| F[Final result]
\`\`\`

### Components

| Stage | Node | Description |
|-------|------|-------------|
| Evaluation | Model + Condition | Critic evaluates quality |
| Optimization | Model | Expert improves based on feedback |
| Exit | Condition | Quality criteria check |

### Application

- Prompt optimization
- Code refactoring
- Text editing
- Design improvement

## Contextual Routing

Pattern for intelligent request routing.

\`\`\`mermaid
graph TD
    I[Request] --> CL[Classifier: task type]
    CL --> S{Switch}
    S -->|Code| E1[Expert: development]
    S -->|Text| E2[Expert: editing]
    S -->|Data| E3[Expert: analytics]
    S -->|Other| E4[Expert: general]
    E1 --> O[Output]
    E2 --> O
    E3 --> O
    E4 --> O
\`\`\`

### Implementation

1. **Classifier** — determines request category
2. **Switch** — routes to appropriate branch
3. **Specialized experts** — process by profile
4. **Output** — single exit point

## Document Processing Pipeline

Comprehensive document processing with data extraction.

\`\`\`mermaid
graph LR
    U[Upload] --> S[Storage: save]
    S --> E[Embedding: vectorize]
    E --> M[Memory: index]
    M --> Q[Ready for search]
\`\`\`

### Stages

| # | Node | Action |
|---|------|--------|
| 1 | Storage | Upload file to bucket |
| 2 | Transform | Extract text |
| 3 | Embedding | Generate vectors |
| 4 | Memory | Save to session_memory |

### Document Search

\`\`\`mermaid
graph LR
    Q[Question] --> E[Embedding: query vector]
    E --> M[Memory: semantic search]
    M --> C[Context: top-K chunks]
    C --> MODEL[Model: answer with context]
    MODEL --> O[Answer]
\`\`\`

## Autonomous Agent with Tools

Pattern for independent task solving using tools.

\`\`\`mermaid
graph TD
    I[Task] --> P[Planner: decomposition]
    P --> L{Loop: steps}
    L --> A[Selector: choose tool]
    A --> T[Tool: execute]
    T --> E[Evaluator: verify]
    E --> C{Done?}
    C -->|No| L
    C -->|Yes| O[Result]
\`\`\`

### Components

| Role | Description |
|------|-------------|
| **Planner** | Breaks task into subtasks |
| **Selector** | Chooses appropriate tool |
| **Executor** | Calls Tool node |
| **Evaluator** | Verifies step result |

### Example: Topic Research

1. Planner forms plan: search → analyze → synthesize
2. Selector chooses web search tool
3. Tool executes search
4. Evaluator checks relevance
5. Loop repeats until plan is complete

## Chains with Memory

Pattern for tasks requiring context accumulation.

\`\`\`mermaid
graph TD
    I[Session] --> M1[Model: step 1]
    M1 --> MEM1[Memory: save]
    MEM1 --> M2[Model: step 2 + context]
    M2 --> MEM2[Memory: update]
    MEM2 --> M3[Model: step 3 + full context]
    M3 --> O[Final]
\`\`\`

### Application

- Long creative projects
- Complex research
- Multi-step calculations
- Dialogues with fact accumulation

## Recommendations

### Flow Design

| Principle | Description |
|-----------|-------------|
| **Modularity** | Break into reusable blocks |
| **Error handling** | Add Condition for fallback |
| **Logging** | Use Transform for debug |
| **Testing** | Test branches in isolation |

### Performance Optimization

| Technique | Effect |
|-----------|--------|
| **Parallelism** | Split/Merge for independent operations |
| **Caching** | Memory for recurring requests |
| **Early exit** | Condition for fast completion |
| **Batch processing** | Loop for bulk operations |

> **Tip**: Start with simple linear flows, gradually adding branches and loops as needed.`
    }
  },
  // Role Memory
  {
    id: 'roleMemory',
    titleKey: 'hydrapedia.sections.roleMemory',
    icon: 'BrainCircuit',
    content: {
      ru: `# Ролевая память

**Ролевая память** — это система долгосрочного накопления опыта для технических ролей AI-Hydra. В отличие от **памяти сессии**, которая живёт в рамках одного диалога, ролевая память сохраняется **между сессиями**, позволяя агентам становиться умнее с каждым взаимодействием.

---

## Концепция

Каждая техническая роль (Архивариус, Аналитик, Промпт-инженер и др.) имеет собственное «хранилище опыта». Когда роль выполняет задачу — успешно или нет — этот опыт можно сохранить, и в следующий раз агент учтёт его при формировании ответа.

\`\`\`mermaid
graph LR
    S1[Сессия 1] -->|опыт| RM[(Ролевая память)]
    S2[Сессия 2] -->|опыт| RM
    RM -->|контекст| S3[Сессия 3]
    RM -->|контекст| S4[Сессия N]
\`\`\`

---

## Типы воспоминаний

| Тип | Иконка | Описание | Пример |
|-----|--------|----------|--------|
| **experience** | 🧠 | Общий накопленный опыт | «Для задач перевода лучше работает цепочка analyst → assistant» |
| **preference** | ⚙️ | Предпочтения и настройки | «Пользователь предпочитает лаконичные ответы без вступлений» |
| **skill** | 🎯 | Освоенный навык или паттерн | «Умею оптимизировать промпты с техникой chain-of-thought» |
| **mistake** | ⚠️ | Ошибка, которую не стоит повторять | «Не отправлять запросы к Perplexity без Tavily API ключа» |
| **success** | ✅ | Успешно решённая задача | «Стратегия декомпозиции задач повысила точность на 30%» |

---

## Как это работает

### 1. Сохранение опыта

Опыт сохраняется автоматически или вручную:

- **Автоматически**: Технические роли могут записывать результаты своей работы
- **Вручную**: Через интерфейс управления ролевой памятью

При сохранении для каждой записи генерируется **векторный эмбеддинг** (text-embedding-3-small), что позволяет искать релевантный опыт семантически, а не по ключевым словам.

### 2. Поиск релевантного опыта

Перед выполнением задачи система ищет в памяти роли опыт, похожий на текущий контекст:

\`\`\`
Запрос: "Оптимизируй промпт для анализа кода"
↓
Семантический поиск по role_memory
↓
Найдено: "При оптимизации промптов для кода добавляй примеры input/output"
(similarity: 0.89)
\`\`\`

### 3. Использование в контексте

Найденные воспоминания встраиваются в системный промпт роли, обогащая её инструкции реальным опытом.

---

## Атрибуты записи

Каждое воспоминание содержит:

| Атрибут | Описание |
|---------|----------|
| **content** | Текст опыта |
| **memory_type** | Тип: experience / preference / skill / mistake / success |
| **confidence_score** | Уровень уверенности (0.0 — 1.0), по умолчанию 0.7 |
| **tags** | Теги для категоризации |
| **usage_count** | Сколько раз опыт был использован |
| **last_used_at** | Когда опыт использовался последний раз |

---

## Управление памятью

### Просмотр

Ролевая память доступна через индикатор \`Brain\` в интерфейсе технических ролей. Бейдж показывает общее количество сохранённых воспоминаний.

### Обновление

Можно обновить текст, теги, уровень уверенности. При изменении текста эмбеддинг пересчитывается автоматически.

### Удаление

Неактуальные или ошибочные записи можно удалить — они исчезнут из поиска мгновенно.

### Статистика

Доступна сводка по каждой роли:
- Общее количество воспоминаний
- Распределение по типам
- Средний уровень уверенности
- Самое часто используемое воспоминание

---

## Отличие от памяти сессии

| Параметр | Память сессии | Ролевая память |
|----------|--------------|----------------|
| **Область** | Один диалог | Все сессии |
| **Привязка** | К сессии | К роли |
| **Цель** | Контекст диалога | Накопление экспертизы |
| **Кто пишет** | Авто (рейтинг ≥7) + вручную | Технические роли |
| **Поиск** | По сессии | По роли + семантический |
| **Жизненный цикл** | Удаляется с сессией | Живёт пока не удалят |

---

## Советы по использованию

> **Фиксируйте ошибки**: Записывайте неудачные подходы как \`mistake\` — это самый ценный тип опыта, предотвращающий повторение ошибок.

> **Ведите теги**: Используйте теги для группировки опыта по проектам или доменам. Это улучшает релевантность поиска.

> **Следите за уверенностью**: Понижайте confidence_score для спорных выводов и повышайте для проверенных практик.

> **Проверяйте актуальность**: Периодически просматривайте записи — устаревший опыт может навредить.`,

      en: `# Role Memory

**Role Memory** is a long-term experience accumulation system for AI-Hydra's technical roles. Unlike **session memory**, which lives within a single conversation, role memory persists **across sessions**, allowing agents to become smarter with every interaction.

---

## Concept

Each technical role (Archivist, Analyst, Prompt Engineer, etc.) has its own "experience store." When a role completes a task — successfully or not — that experience can be saved, and next time the agent will consider it when forming a response.

\`\`\`mermaid
graph LR
    S1[Session 1] -->|experience| RM[(Role Memory)]
    S2[Session 2] -->|experience| RM
    RM -->|context| S3[Session 3]
    RM -->|context| S4[Session N]
\`\`\`

---

## Memory Types

| Type | Icon | Description | Example |
|------|------|-------------|---------|
| **experience** | 🧠 | General accumulated experience | "For translation tasks, analyst → assistant chain works best" |
| **preference** | ⚙️ | Preferences and settings | "User prefers concise answers without introductions" |
| **skill** | 🎯 | Mastered skill or pattern | "Can optimize prompts with chain-of-thought technique" |
| **mistake** | ⚠️ | Error not to repeat | "Don't send requests to Perplexity without Tavily API key" |
| **success** | ✅ | Successfully solved task | "Task decomposition strategy improved accuracy by 30%" |

---

## How It Works

### 1. Saving Experience

Experience is saved automatically or manually:

- **Automatically**: Technical roles can record results of their work
- **Manually**: Through the role memory management interface

When saving, a **vector embedding** (text-embedding-3-small) is generated for each entry, enabling semantic search rather than keyword-based lookup.

### 2. Finding Relevant Experience

Before executing a task, the system searches the role's memory for experience similar to the current context:

\`\`\`
Query: "Optimize prompt for code analysis"
↓
Semantic search in role_memory
↓
Found: "When optimizing code prompts, add input/output examples"
(similarity: 0.89)
\`\`\`

### 3. Using in Context

Found memories are embedded into the role's system prompt, enriching its instructions with real experience.

---

## Entry Attributes

Each memory entry contains:

| Attribute | Description |
|-----------|-------------|
| **content** | Experience text |
| **memory_type** | Type: experience / preference / skill / mistake / success |
| **confidence_score** | Confidence level (0.0 — 1.0), default 0.7 |
| **tags** | Tags for categorization |
| **usage_count** | How many times the experience was used |
| **last_used_at** | When the experience was last used |

---

## Memory Management

### Viewing

Role memory is accessible via the \`Brain\` indicator in the technical roles interface. The badge shows the total number of saved memories.

### Updating

You can update text, tags, and confidence level. When text changes, the embedding is recalculated automatically.

### Deleting

Outdated or incorrect entries can be deleted — they disappear from search immediately.

### Statistics

A summary is available for each role:
- Total memory count
- Distribution by type
- Average confidence level
- Most frequently used memory

---

## Difference from Session Memory

| Parameter | Session Memory | Role Memory |
|-----------|---------------|-------------|
| **Scope** | Single conversation | All sessions |
| **Binding** | To session | To role |
| **Purpose** | Conversation context | Expertise accumulation |
| **Who writes** | Auto (rating ≥7) + manual | Technical roles |
| **Search** | By session | By role + semantic |
| **Lifecycle** | Deleted with session | Lives until removed |

---

## Usage Tips

> **Record mistakes**: Save failed approaches as \`mistake\` — this is the most valuable experience type, preventing repeated errors.

> **Use tags**: Tag experience by project or domain. This improves search relevance.

> **Monitor confidence**: Lower confidence_score for debatable conclusions and raise it for proven practices.

> **Check relevance**: Periodically review entries — outdated experience can be harmful.`
    }
  },
  // FAQ & Troubleshooting
  {
    id: 'faq',
    titleKey: 'hydrapedia.sections.faq',
    icon: 'HelpCircle',
    content: {
      ru: `# FAQ и решение проблем

Часто задаваемые вопросы и типичные проблемы при работе с AI-Hydra.

---

## 🔑 API-ключи и доступ к моделям

### Модели отображаются серыми и недоступны для выбора

**Причина**: Не настроен API-ключ соответствующего провайдера.

**Решение**:
1. Перейдите в **Профиль** → **API Ключи**
2. Введите ключ для нужного провайдера (OpenAI, Anthropic, Google и т.д.)
3. Нажмите **Сохранить**
4. Вернитесь в Панель экспертов — модели станут доступны

> **Совет**: Начните с OpenRouter — один ключ даёт доступ к сотням моделей.

### Модель была доступна, но исчезла из списка

**Причина**: Модель временно недоступна или кэш доступности пометил её как неактивную (ошибки 402/404).

**Решение**:
1. Откройте **Профиль** → **API Ключи**
2. Нажмите кнопку **Сбросить кэш моделей** (иконка \`RefreshCw\`)
3. Кэш хранится в браузере (localStorage) с TTL = 1 час — модель появится автоматически через час

### Ошибка 402 — недостаточно средств

**Причина**: На аккаунте провайдера закончился баланс.

**Решение**: Пополните баланс на сайте провайдера (OpenAI, Anthropic и т.д.). После пополнения модель автоматически станет доступна (или сбросьте кэш вручную).

### Ошибка 401 — неверный API-ключ

**Причина**: Ключ введён неправильно, отозван или истёк.

**Решение**:
1. Проверьте ключ на сайте провайдера
2. Перейдите в **Профиль** → **API Ключи**
3. Обновите ключ и сохраните

---

## 💬 Чат и сообщения

### Ответ модели не приходит (бесконечная загрузка)

**Возможные причины**:
- Превышен таймаут ожидания
- Проблемы на стороне провайдера
- Слишком длинный контекст

**Решение**:
1. Увеличьте **таймаут** (иконка \`Clock\`) — по умолчанию 60 секунд, максимум 4 минуты
2. Попробуйте другую модель
3. Сократите контекст: создайте новую сессию (\`Plus\`) или сократите сообщение

### Ответ обрывается на середине

**Причина**: Достигнут лимит **Max Tokens**.

**Решение**:
1. Откройте **Настройки модели** (иконка \`Settings\`)
2. Увеличьте **Max Tokens** (до 16384)
3. Или добавьте в промпт инструкцию: «Дай полный ответ, не сокращай»

### Модель даёт слишком короткие/длинные ответы

**Решение через параметры**:

| Проблема | Параметр | Действие |
|----------|----------|----------|
| Слишком кратко | Max Tokens | Увеличить (8192+) |
| Слишком длинно | Max Tokens | Уменьшить (1024–2048) |
| Нет деталей | Temperature | Повысить (0.7–1.0) |
| Слишком «творчески» | Temperature | Понизить (0.1–0.3) |

### Как удалить отдельное сообщение?

В текущей версии удаление отдельных сообщений не поддерживается. Вы можете:
- Создать **новую сессию** для чистого старта
- Использовать **D-Chat** для уточнения без засорения основного чата

---

## 🎭 Роли и промпты

### Роль не влияет на ответ модели

**Возможные причины**:
- Не назначен системный промпт для роли
- Промпт слишком общий

**Решение**:
1. Откройте **Библиотеку промптов**
2. Найдите промпт для нужной роли
3. Выберите его через **Селектор промптов** (\`BookOpen\`) в верхней панели
4. Или создайте специализированный промпт с чёткими инструкциями

### Пожелания Супервизора не применяются

**Проверьте**:
1. Пожелания активированы (отмечены галочкой)
2. Пожелания совместимы с текущей ролью (фильтруются автоматически)
3. Выбранные пожелания отображаются как бейджи в селекторе

---

## 📊 D-Chat и Консультант

### D-Chat не открывается

**Решение**:
1. Нажмите иконку \`MessageSquare\` в ответе модели — откроется D-Chat с этой моделью
2. Или используйте иконку \`Lightbulb\` в правом тулбаре панели ввода

### Режим Модератор не показывает резюме

**Причина**: Для работы модератора нужны сообщения в текущей сессии.

**Решение**: Убедитесь, что в сессии есть хотя бы несколько ответов моделей. Модератор агрегирует контекст из существующей переписки.

---

## 🔄 Стриминг и производительность

### Стриминг-ответ «подвисает»

**Решение**:
1. Дождитесь завершения (некоторые модели обрабатывают запрос перед стримингом)
2. Увеличьте таймаут
3. Если зависание повторяется — попробуйте другую модель

### Интерфейс работает медленно

**Возможные причины**:
- Слишком длинная история чата (100+ сообщений)
- Много открытых развёрнутых ответов

**Решение**:
1. Сверните длинные ответы (кнопка \`BookOpen\`)
2. Создайте новую сессию для нового контекста
3. Используйте **Память сессии** для сохранения важных фактов между сессиями

---

## 🧠 Память и контекст

### Память сессии не работает

**Проверьте**:
1. Активна ли опция памяти для сессии
2. Есть ли сообщения, обработанные системой памяти
3. Память индексируется автоматически — дайте время на обработку

### Как передать контекст между сессиями?

Используйте **Ролевую память** — она сохраняет опыт ролей между разными сессиями. Технические специалисты (\`@analyst\`, \`@archivist\`) могут сохранять и извлекать накопленные знания.

---

## 🛠 Инструменты (Tools)

### HTTP-инструмент возвращает ошибку

**Частые причины**:

| Ошибка | Причина | Решение |
|--------|---------|---------|
| **Timeout** | API не отвечает за 30 секунд | Проверьте URL и доступность API |
| **SSRF blocked** | Попытка обращения к локальному адресу | Используйте только публичные API |
| **Response too large** | Ответ превышает 1 МБ | Используйте JSONPath для извлечения нужных данных |
| **Invalid JSON** | API возвращает не-JSON | Проверьте Content-Type и формат ответа |

### Как протестировать инструмент?

Каждый инструмент имеет встроенный тестер:
1. Откройте инструмент в **Библиотеке инструментов**
2. Нажмите **Тестировать** (\`Play\`)
3. Заполните параметры (для Prompt-Template плейсхолдеры определяются автоматически)
4. Результат отобразится в панели тестирования

---

## 📐 Редактор потоков (Flow Editor)

### Узлы не соединяются

**Причина**: Нарушены правила соединения.

**Правила**:
- Output-порт → Input-порт (не наоборот)
- Нельзя создать цикл без явного Loop-узла
- Некоторые узлы ограничены в количестве входов/выходов

### Как экспортировать диаграмму?

Используйте панель экспорта (иконка \`Download\`):

| Формат | Назначение |
|--------|------------|
| **PNG** | Изображение для документации |
| **SVG** | Векторная графика для масштабирования |
| **JSON** | Полная сериализация для импорта |
| **PDF** | Документ для печати |

---

## 🌐 Общие вопросы

### Как переключить язык интерфейса?

Нажмите иконку \`Globe\` в шапке приложения для переключения между RU и EN. Настройка сохраняется в профиле.

### Как сменить тему (тёмная/светлая)?

Нажмите иконку \`Sun\` / \`Moon\` в шапке. Предпочтение сохраняется автоматически.

### Данные сохраняются автоматически?

Да. Все сообщения, настройки сессий и конфигурации сохраняются в облачной базе данных. API-ключи хранятся в зашифрованном хранилище (Vault).

### Есть ли лимиты на использование?

Лимиты зависят от вашего тарифного плана у AI-провайдеров. AI-Hydra не вводит собственных ограничений на количество запросов — лимитирует только провайдер модели.`,

      en: `# FAQ & Troubleshooting

Frequently asked questions and common issues when working with AI-Hydra.

---

## 🔑 API Keys & Model Access

### Models appear grayed out and cannot be selected

**Cause**: API key for the corresponding provider is not configured.

**Solution**:
1. Go to **Profile** → **API Keys**
2. Enter the key for the needed provider (OpenAI, Anthropic, Google, etc.)
3. Click **Save**
4. Return to the Expert Panel — models will become available

> **Tip**: Start with OpenRouter — one key gives access to hundreds of models.

### A model was available but disappeared from the list

**Cause**: The model is temporarily unavailable or the availability cache marked it as inactive (402/404 errors).

**Solution**:
1. Open **Profile** → **API Keys**
2. Click the **Reset model cache** button (icon \`RefreshCw\`)
3. Cache is stored in browser (localStorage) with TTL = 1 hour — the model will reappear automatically after an hour

### Error 402 — insufficient funds

**Cause**: The provider account balance is depleted.

**Solution**: Top up your balance on the provider's website (OpenAI, Anthropic, etc.). After topping up, the model will automatically become available (or reset the cache manually).

### Error 401 — invalid API key

**Cause**: The key was entered incorrectly, revoked, or expired.

**Solution**:
1. Verify the key on the provider's website
2. Go to **Profile** → **API Keys**
3. Update the key and save

---

## 💬 Chat & Messages

### Model response doesn't arrive (infinite loading)

**Possible causes**:
- Response timeout exceeded
- Provider-side issues
- Context too long

**Solution**:
1. Increase **timeout** (icon \`Clock\`) — default is 60 seconds, maximum 4 minutes
2. Try a different model
3. Reduce context: create a new session (\`Plus\`) or shorten your message

### Response cuts off mid-sentence

**Cause**: **Max Tokens** limit reached.

**Solution**:
1. Open **Model Settings** (icon \`Settings\`)
2. Increase **Max Tokens** (up to 16384)
3. Or add to your prompt: "Give a complete answer, don't truncate"

### Model gives too short/long responses

**Solution via parameters**:

| Problem | Parameter | Action |
|---------|-----------|--------|
| Too brief | Max Tokens | Increase (8192+) |
| Too long | Max Tokens | Decrease (1024–2048) |
| Lacks detail | Temperature | Increase (0.7–1.0) |
| Too "creative" | Temperature | Decrease (0.1–0.3) |

### How to delete an individual message?

In the current version, deleting individual messages is not supported. You can:
- Create a **new session** for a clean start
- Use **D-Chat** for clarifications without cluttering the main chat

---

## 🎭 Roles & Prompts

### Role doesn't affect model response

**Possible causes**:
- No system prompt assigned for the role
- Prompt is too generic

**Solution**:
1. Open the **Prompt Library**
2. Find a prompt for the desired role
3. Select it via **Prompt Selector** (\`BookOpen\`) in the top toolbar
4. Or create a specialized prompt with clear instructions

### Supervisor Wishes are not being applied

**Check**:
1. Wishes are activated (checked)
2. Wishes are compatible with the current role (filtered automatically)
3. Selected wishes appear as badges in the selector

---

## 📊 D-Chat & Consultant

### D-Chat doesn't open

**Solution**:
1. Click the \`MessageSquare\` icon in a model's response — D-Chat opens with that model
2. Or use the \`Lightbulb\` icon in the right toolbar of the input area

### Moderator mode doesn't show summary

**Cause**: The moderator needs messages in the current session to work.

**Solution**: Make sure there are at least several model responses in the session. The moderator aggregates context from existing conversation.

---

## 🔄 Streaming & Performance

### Streaming response "freezes"

**Solution**:
1. Wait for completion (some models process the request before streaming)
2. Increase timeout
3. If freezing persists — try a different model

### Interface is slow

**Possible causes**:
- Very long chat history (100+ messages)
- Many expanded responses open

**Solution**:
1. Collapse long responses (button \`BookOpen\`)
2. Create a new session for fresh context
3. Use **Session Memory** to preserve important facts between sessions

---

## 🧠 Memory & Context

### Session memory doesn't work

**Check**:
1. Is memory option active for the session
2. Are there messages processed by the memory system
3. Memory is indexed automatically — allow time for processing

### How to transfer context between sessions?

Use **Role Memory** — it preserves role experience across different sessions. Technical specialists (\`@analyst\`, \`@archivist\`) can save and retrieve accumulated knowledge.

---

## 🛠 Tools

### HTTP tool returns an error

**Common causes**:

| Error | Cause | Solution |
|-------|-------|----------|
| **Timeout** | API doesn't respond within 30 seconds | Check URL and API availability |
| **SSRF blocked** | Attempt to access local address | Use only public APIs |
| **Response too large** | Response exceeds 1 MB | Use JSONPath to extract needed data |
| **Invalid JSON** | API returns non-JSON | Check Content-Type and response format |

### How to test a tool?

Each tool has a built-in tester:
1. Open the tool in the **Tools Library**
2. Click **Test** (\`Play\`)
3. Fill in parameters (for Prompt-Template, placeholders are detected automatically)
4. Results will appear in the testing panel

---

## 📐 Flow Editor

### Nodes won't connect

**Cause**: Connection rules violated.

**Rules**:
- Output port → Input port (not the other way)
- Cannot create cycles without an explicit Loop node
- Some nodes have limited input/output counts

### How to export a diagram?

Use the export panel (icon \`Download\`):

| Format | Purpose |
|--------|---------|
| **PNG** | Image for documentation |
| **SVG** | Vector graphics for scaling |
| **JSON** | Full serialization for import |
| **PDF** | Document for printing |

---

## 🌐 General Questions

### How to switch interface language?

Click the \`Globe\` icon in the app header to switch between RU and EN. The setting is saved to your profile.

### How to change theme (dark/light)?

Click the \`Sun\` / \`Moon\` icon in the header. Preference is saved automatically.

### Is data saved automatically?

Yes. All messages, session settings, and configurations are saved in the cloud database. API keys are stored in encrypted storage (Vault).

### Are there usage limits?

Limits depend on your plan with AI providers. AI-Hydra does not impose its own request limits — only the model provider sets limits.`
    }
  }
];
