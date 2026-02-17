import type { HydrapediaSection } from './types';

export const basicsSections: HydrapediaSection[] = [
  {
    id: 'intro',
    titleKey: 'hydrapedia.sections.intro',
    icon: 'Lightbulb',
    content: {
      ru: `# Добро пожаловать в AI-Hydra

AI-Hydra — это платформа мультиагентного взаимодействия, где несколько ИИ-ролей работают вместе над вашими задачами. В отличие от обычных чат-ботов, здесь каждый запрос может обсуждаться экспертами, критиками и арбитрами, обеспечивая **глубину и качество** ответов.

## Ключевые возможности

- **Мультиагентный чат** — до 12 специализированных ролей в одном диалоге
- **Стриминг ответов** — параллельная генерация от нескольких моделей
- **Библиотека промптов** — управление и переиспользование системных промптов
- **Инструменты** — пользовательские инструменты (Prompt/HTTP) с BYOK API-ключами
- **Flow Editor** — визуальный редактор логики ИИ с поддержкой runtime
- **Паттерны поведения** — стратегические шаблоны и ролевые модели поведения
- **Память** — сессионная и ролевая память для накопления опыта
- **Профильные знания (RAG)** — обучение техролей документацией
- **Веб-поиск** — Tavily, Perplexity и Brave Search с поддержкой BYOK

## Архитектура платформы

\`\`\`mermaid
graph TD
    A[Пользователь] --> B[Панель экспертов]
    B --> C[Оркестратор]
    C --> D[Эксперт]
    C --> E[Критик]
    C --> F[Арбитр]
    C --> G[Консультант]
    C --> H[Модератор]
    C --> I[Советник]
    C --> J[Технический персонал]
    J --> K[Архивариус]
    J --> L[Аналитик]
    J --> M[Промпт-Инженер]
    J --> N[Логистик]
    J --> O[Инструменталист]
    J --> P[Веб-хантер]
\`\`\`

## Кому это нужно?

- **Разработчикам** — для мозгового штурма, ревью кода, архитектурных решений
- **Аналитикам** — для многосторонней оценки данных и гипотез
- **Менеджерам** — для планирования проектов через стратегические паттерны
- **Исследователям** — для глубокого анализа с учётом разных точек зрения

> 💡 Попробуйте отправить запрос в Панель экспертов и выберите несколько ролей для обсуждения — вы увидите, как разные «эксперты» подходят к вашей задаче.`,
      en: `# Welcome to AI-Hydra

AI-Hydra is a multi-agent interaction platform where multiple AI roles collaborate on your tasks. Unlike conventional chatbots, every request can be discussed by experts, critics, and arbiters, ensuring **depth and quality** of responses.

## Key Features

- **Multi-agent chat** — up to 12 specialized roles in a single conversation
- **Streaming responses** — parallel generation from multiple models
- **Prompt library** — management and reuse of system prompts
- **Tools** — custom tools (Prompt/HTTP) with BYOK API keys
- **Flow Editor** — visual AI logic editor with runtime support
- **Behavioral patterns** — strategic templates and role behavior models
- **Memory** — session and role memory for experience accumulation
- **Domain knowledge (RAG)** — training tech roles with documentation
- **Web search** — Tavily, Perplexity, and Brave Search with BYOK support

## Platform Architecture

\`\`\`mermaid
graph TD
    A[User] --> B[Expert Panel]
    B --> C[Orchestrator]
    C --> D[Expert]
    C --> E[Critic]
    C --> F[Arbiter]
    C --> G[Consultant]
    C --> H[Moderator]
    C --> I[Advisor]
    C --> J[Technical Staff]
    J --> K[Archivist]
    J --> L[Analyst]
    J --> M[Prompt Engineer]
    J --> N[Flow Regulator]
    J --> O[Toolsmith]
    J --> P[Web Hunter]
\`\`\`

## Who Is This For?

- **Developers** — for brainstorming, code review, architectural decisions
- **Analysts** — for multi-perspective data evaluation and hypotheses
- **Managers** — for project planning via strategic patterns
- **Researchers** — for deep analysis considering multiple viewpoints

> 💡 Try sending a request to the Expert Panel and select multiple roles for discussion — you'll see how different "experts" approach your task.`,
    },
  },
  {
    id: 'getting-started',
    titleKey: 'hydrapedia.sections.gettingStarted',
    icon: 'Rocket',
    content: {
      ru: `# Начало работы

## 1. Регистрация и вход

Зарегистрируйтесь по e-mail и паролю. После подтверждения адреса вы получите доступ ко всем модулям.

## 2. Настройка профиля и API-ключей

### Аватар пользователя

В разделе **Профиль → Профиль** доступна загрузка фотографии аватара:

1. Нажмите **«Загрузить фото»** (форматы: JPEG, PNG, WebP, до **2 МБ**)
2. В диалоге кадрирования отрегулируйте область отображения:
   - **Перетащите фото** мышью — сдвиньте кадр
   - **Колесо прокрутки** — масштабирование (zoom 1×–5×)
   - Слайдер под канвасом для точного контроля масштаба
   - Кнопка **«Сбросить»** — вернуть исходное расположение
3. Нажмите **«Применить»** — обрезанный круглый аватар сохранится
4. Аватар отображается в нижней части бокового меню рядом с email

> [!TIP] Кадрирование
> Перемещайте изображение **внутри** зафиксированного круга — именно эта область станет аватаром. Результат экспортируется как JPEG 260×260 px.

Удалить аватар можно кнопкой **«Удалить»** под фото.

### Настройка API-ключей (BYOK)

Перейдите в **Профиль → API-ключи** и добавьте ключи провайдеров:

| Провайдер | Для чего |
|-----------|----------|
| OpenAI | GPT-4o, GPT-4o-mini, o1, o3 |
| Anthropic | Claude 3.5 / 4 Sonnet, Opus |
| Google Gemini | Gemini 2.5 Pro/Flash |
| DeepSeek | DeepSeek-R1, V3 |
| Groq | Быстрые модели (Llama, Mixtral) |
| xAI | Grok-3 |
| OpenRouter | Доступ к 100+ моделям |
| Perplexity | Веб-поиск через Sonar API |
| Tavily | Веб-поиск (по умолчанию) |
| Firecrawl | Скрейпинг веб-страниц для RAG |

> 🔑 Персональные ключи имеют **приоритет** над системными. Это значит, что если вы добавите свой ключ — он будет использоваться вместо общего.


## 3. Первый диалог

1. Откройте **Панель экспертов** в боковом меню
2. Выберите модели для консультантов (настройки сессии)
3. Введите запрос в поле ввода
4. Нажмите кнопку отправки (всем экспертам или конкретной роли)

## 4. Навигация

- **Панель экспертов** — основной чат с мультиагентным режимом
- **Библиотека промптов** — шаблоны системных промптов
- **Инструменты** — пользовательские инструменты
- **Паттерны** — стратегии и поведенческие модели
- **Штат** — управление ролями и знаниями
- **Flow Editor** — визуальное проектирование логики
- **Подиум моделей** — статистика и рейтинги ИИ-моделей
- **Задачи** — управление задачами
- **Гидрапедия** — эта документация

## Гостевой доступ

Неавторизованные пользователи могут просматривать главную страницу и Гидрапедию. При попытке открыть инструменты, система перенаправляет в соответствующий раздел документации.

## Профиль пользователя

Страница профиля содержит 4 вкладки (5 в русской локали):

| Вкладка | Содержимое |
|---------|-----------|
| **Профиль** | Аватар, email, отображаемое имя, username |
| **Настройки** | Тема (светлая/тёмная), язык, размер шрифта |
| **API-ключи** | BYOK-ключи всех провайдеров |
| **ProxyAPI** | Дашборд ProxyAPI (только RU) |
| **Статистика** | Аналитика использования |

### Аватар

Загрузите фотографию (JPEG/PNG/WebP, до 2 МБ) и обрежьте нужный участок в диалоге кадрирования. Аватар отображается в нижней части бокового меню рядом с вашим email.`,
      en: `# Getting Started

## 1. Registration and Login

Register with email and password. After email confirmation, you'll have access to all modules.

## 2. Setting Up Your Profile and API Keys

### Avatar

In **Profile → Profile** you can upload a photo avatar:

1. Click **"Upload photo"** (formats: JPEG, PNG, WebP, up to **2 MB**)
2. In the crop dialog, adjust the display area:
   - **Drag** the photo with your mouse to reposition
   - **Scroll wheel** to zoom in/out (1×–5×)
   - Use the slider below the canvas for precise zoom control
   - **"Reset"** button restores the original position
3. Click **"Apply"** — the cropped circular avatar is saved
4. The avatar appears in the sidebar footer next to your email

> [!TIP] Cropping
> Move the image **inside** the fixed circle — that area becomes your avatar. Output is a 260×260 px JPEG.

Delete the avatar with the **"Delete"** button below the photo.

### Setting Up API Keys (BYOK)

Go to **Profile → API Keys** and add provider keys:

| Provider | Used For |
|----------|----------|
| OpenAI | GPT-4o, GPT-4o-mini, o1, o3 |
| Anthropic | Claude 3.5 / 4 Sonnet, Opus |
| Google Gemini | Gemini 2.5 Pro/Flash |
| DeepSeek | DeepSeek-R1, V3 |
| Groq | Fast models (Llama, Mixtral) |
| xAI | Grok-3 |
| OpenRouter | Access to 100+ models |
| Perplexity | Web search via Sonar API |
| Tavily | Web search (default) |
| Firecrawl | Web page scraping for RAG |

> 🔑 Personal keys take **priority** over system keys. If you add your own key, it will be used instead of the shared one.

## 3. First Conversation

1. Open the **Expert Panel** from the sidebar
2. Choose models for consultants (session settings)
3. Type your query in the input field
4. Click the send button (to all experts or a specific role)

## 4. Navigation

- **Expert Panel** — main chat with multi-agent mode
- **Prompt Library** — system prompt templates
- **Tools** — custom tools
- **Patterns** — strategies and behavioral models
- **Staff** — role and knowledge management
- **Flow Editor** — visual logic design
- **Model Podium** — AI model statistics and ratings
- **Tasks** — task management
- **Hydrapedia** — this documentation

## Guest Access

Unauthenticated users can browse the homepage and Hydrapedia. Attempting to open tools redirects to the relevant documentation section.

## User Profile

The profile page has 4 tabs (5 in Russian locale):

| Tab | Contents |
|-----|----------|
| **Profile** | Avatar, email, display name, username |
| **Preferences** | Theme (dark/light), language, font size |
| **API Keys** | BYOK keys for all providers |
| **ProxyAPI** | ProxyAPI dashboard (RU locale only) |
| **Stats** | Usage analytics |

### Avatar

Upload a photo (JPEG/PNG/WebP, up to 2 MB) and crop the desired area in the crop dialog. The avatar is displayed in the sidebar footer next to your email.`,
    },
  },
];

