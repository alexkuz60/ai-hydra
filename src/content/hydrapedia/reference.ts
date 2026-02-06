import type { HydrapediaSection } from './types';

export const referenceSections: HydrapediaSection[] = [
  {
    id: 'best-practices',
    titleKey: 'hydrapedia.sections.bestPractices',
    icon: 'Star',
    content: {
      ru: `# Лучшие практики

## Эффективная работа с мультиагентным чатом

1. **Формулируйте чётко** — конкретный запрос → лучший ответ
2. **Используйте роли** — Критик для ревью, Советник для рекомендаций
3. **Сравнивайте модели** — мультимодельный режим помогает найти лучшую модель для задачи
4. **Оценивайте ответы** — 🧠 / 👎 формируют персональный рейтинг

## Промпт-инжиниринг

- Разбивайте сложные промпты на секции с ##
- Используйте примеры (few-shot) для сложных задач
- Указывайте формат ответа явно
- Вызывайте \`@promptengineer\` для оптимизации

## Работа с памятью

- Периодически обновляйте сессионную память
- Проверяйте ролевую память на актуальность
- Удаляйте устаревшие фрагменты

## Flow Editor

- Начинайте с простых пайплайнов, усложняйте постепенно
- Используйте Group для визуальной организации
- Тестируйте каждый этап отдельно
- Сохраняйте промежуточные версии диаграмм`,
      en: `# Best Practices

## Effective Multi-Agent Chat Usage

1. **Be specific** — concrete query → better response
2. **Use roles** — Critic for review, Advisor for recommendations
3. **Compare models** — multi-model mode helps find the best model for the task
4. **Rate responses** — 🧠 / 👎 form a personal rating

## Prompt Engineering

- Break complex prompts into sections with ##
- Use examples (few-shot) for complex tasks
- Specify response format explicitly
- Call \`@promptengineer\` for optimization

## Working with Memory

- Periodically update session memory
- Check role memory for relevance
- Delete outdated fragments

## Flow Editor

- Start with simple pipelines, increase complexity gradually
- Use Group for visual organization
- Test each stage separately
- Save intermediate diagram versions`,
    },
  },
  {
    id: 'localization',
    titleKey: 'hydrapedia.sections.localization',
    icon: 'Star',
    content: {
      ru: `# Локализация

AI-Hydra полностью локализована на русский и английский языки.

## Переключение языка

Язык интерфейса переключается в настройках профиля или через боковое меню. Переключение мгновенное — перезагрузка не требуется.

## Что локализовано

- Весь интерфейс (навигация, формы, кнопки)
- Системные промпты ролей
- Гидропедия (документация)
- Уведомления и сообщения об ошибках
- Метки ролей и описания

## Автоперевод промптов

Система поддерживает автоматический перевод пользовательских промптов между RU и EN. Кэш переводов хранится локально для быстрого доступа.`,
      en: `# Localization

AI-Hydra is fully localized in Russian and English.

## Language Switching

Interface language is switched in profile settings or via the sidebar. Switching is instant — no reload required.

## What's Localized

- Entire interface (navigation, forms, buttons)
- Role system prompts
- Hydrapedia (documentation)
- Notifications and error messages
- Role labels and descriptions

## Auto-translation of Prompts

The system supports automatic translation of user prompts between RU and EN. Translation cache is stored locally for quick access.`,
    },
  },
  {
    id: 'security',
    titleKey: 'hydrapedia.sections.security',
    icon: 'Shield',
    content: {
      ru: `# Безопасность

## Аутентификация

- Email + пароль с подтверждением адреса
- Сессии с автообновлением токенов
- Защита маршрутов для авторизованных пользователей

## Хранение API-ключей

Все API-ключи хранятся в зашифрованном хранилище (Vault):
- Ключи шифруются перед записью
- Доступ только через серверные функции
- Ключи никогда не передаются на клиент в открытом виде

## Row Level Security (RLS)

Каждая таблица защищена политиками RLS:
- Пользователи видят только свои данные
- Публичные сущности (\`is_shared\`) доступны для чтения всем
- Системные сущности (\`is_system\`) защищены от удаления

## Защита инструментов

HTTP-инструменты имеют защиту от SSRF — запрещены запросы к внутренним сетям и локальным адресам.

## Роли и права

| Роль | Уровень доступа |
|------|----------------|
| user | Стандартный пользователь |
| moderator | Расширенные права |
| admin | Управление системными сущностями |
| supervisor | Полный доступ, «пожелания» для ИИ |`,
      en: `# Security

## Authentication

- Email + password with address confirmation
- Sessions with auto-refreshing tokens
- Route protection for authenticated users

## API Key Storage

All API keys are stored in encrypted storage (Vault):
- Keys are encrypted before writing
- Access only through server functions
- Keys are never transmitted to the client in plain text

## Row Level Security (RLS)

Every table is protected by RLS policies:
- Users can only see their own data
- Public entities (\`is_shared\`) are readable by everyone
- System entities (\`is_system\`) are protected from deletion

## Tool Protection

HTTP tools have SSRF protection — requests to internal networks and local addresses are forbidden.

## Roles and Permissions

| Role | Access Level |
|------|-------------|
| user | Standard user |
| moderator | Extended permissions |
| admin | System entity management |
| supervisor | Full access, AI "wishes" |`,
    },
  },
  {
    id: 'api-integrations',
    titleKey: 'hydrapedia.sections.apiIntegrations',
    icon: 'Wrench',
    content: {
      ru: `# Интеграции и API

## Поддерживаемые провайдеры ИИ

| Провайдер | Модели | Особенности |
|-----------|--------|-------------|
| OpenAI | GPT-4o, o1, o3 | Мультимодальность, reasoning |
| Anthropic | Claude 3.5/4 Sonnet, Opus | Extended thinking |
| Google | Gemini 2.5 Pro/Flash | Большой контекст |
| DeepSeek | R1, V3 | Бюджетные модели с reasoning |
| Groq | Llama, Mixtral | Высокая скорость |
| xAI | Grok-3 | Альтернативный reasoning |
| OpenRouter | 100+ моделей | Единый интерфейс |

## BYOK (Bring Your Own Key)

Все провайдеры поддерживают персональные API-ключи:
- Ключи шифруются и хранятся в Vault
- Персональный ключ имеет **приоритет** над системным
- Настройка в **Профиль → API-ключи**

## Веб-поиск

- **Tavily** — системный ключ (1000 запросов/мес) + BYOK
- **Perplexity** — Sonar API, только BYOK
- **Brave Search** — только BYOK (региональные ограничения)

## Скрейпинг

- **Firecrawl** — извлечение Markdown из веб-страниц для RAG
- Поддержка персонального ключа (BYOK)
- Приоритет персонального ключа над системным`,
      en: `# Integrations & API

## Supported AI Providers

| Provider | Models | Features |
|----------|--------|----------|
| OpenAI | GPT-4o, o1, o3 | Multimodality, reasoning |
| Anthropic | Claude 3.5/4 Sonnet, Opus | Extended thinking |
| Google | Gemini 2.5 Pro/Flash | Large context |
| DeepSeek | R1, V3 | Budget models with reasoning |
| Groq | Llama, Mixtral | High speed |
| xAI | Grok-3 | Alternative reasoning |
| OpenRouter | 100+ models | Unified interface |

## BYOK (Bring Your Own Key)

All providers support personal API keys:
- Keys are encrypted and stored in Vault
- Personal key takes **priority** over system key
- Configuration in **Profile → API Keys**

## Web Search

- **Tavily** — system key (1000 requests/month) + BYOK
- **Perplexity** — Sonar API, BYOK only
- **Brave Search** — BYOK only (regional restrictions)

## Scraping

- **Firecrawl** — Markdown extraction from web pages for RAG
- Personal key support (BYOK)
- Personal key priority over system key`,
    },
  },
  {
    id: 'advanced-patterns',
    titleKey: 'hydrapedia.sections.advancedPatterns',
    icon: 'Star',
    content: {
      ru: `# Продвинутые паттерны

## Цепочка экспертов

Используйте D-Chat для последовательного обсуждения:
1. Отправьте запрос \`@assistant\` для первичного анализа
2. Ответ отправьте \`@critic\` для критического ревью
3. Оба ответа отправьте \`@arbiter\` для финального синтеза

## Prompt Optimization Pipeline

1. \`@analyst\` изучает контекст и формирует техзадание
2. \`@promptengineer\` оптимизирует промпт по техзаданию
3. Результат тестируется в песочнице

## Автономная работа с памятью

1. \`@archivist\` собирает контекст сессии
2. Обновляет векторную базу данных
3. Компактифицирует устаревшие записи

## Мультимодельное сравнение

1. Выберите 3-4 модели в настройках
2. Отправьте одинаковый запрос
3. Сравните ответы и поставьте оценки
4. Через время — проверьте Подиум моделей

## Обучение через RAG

1. Импортируйте документацию в профильные знания роли
2. Используйте «Загрузить из Гидропедии» для системных знаний
3. Скрейпьте веб-страницы через Firecrawl
4. Система автоматически чанкирует и генерирует эмбеддинги`,
      en: `# Advanced Patterns

## Expert Chain

Use D-Chat for sequential discussion:
1. Send query to \`@assistant\` for primary analysis
2. Send the response to \`@critic\` for critical review
3. Send both responses to \`@arbiter\` for final synthesis

## Prompt Optimization Pipeline

1. \`@analyst\` studies context and forms a brief
2. \`@promptengineer\` optimizes the prompt based on the brief
3. Result is tested in the playground

## Autonomous Memory Management

1. \`@archivist\` collects session context
2. Updates vector database
3. Compactifies outdated entries

## Multi-model Comparison

1. Select 3-4 models in settings
2. Send an identical query
3. Compare responses and rate them
4. Check the Model Podium over time

## Training via RAG

1. Import documentation into role domain knowledge
2. Use "Load from Hydrapedia" for system knowledge
3. Scrape web pages via Firecrawl
4. System automatically chunks and generates embeddings`,
    },
  },
  {
    id: 'faq',
    titleKey: 'hydrapedia.sections.faq',
    icon: 'HelpCircle',
    content: {
      ru: `# FAQ и решение проблем

## API и доступ

**Q: Ошибка 401 (Unauthorized)**
Ваш API-ключ недействителен или истёк. Проверьте ключ в **Профиль → API-ключи**.

**Q: Ошибка 402 (Payment Required)**
На аккаунте провайдера закончились средства. Пополните баланс у провайдера (OpenAI, Anthropic и т.д.).

**Q: Ошибка 404 (Model Not Found)**
Модель не найдена у провайдера. Возможно, она была удалена или переименована. Выберите другую модель.

**Q: Нет доступных моделей**
Добавьте API-ключи в **Профиль → API-ключи**. Без ключей доступны только модели администратора.

## Чат

**Q: Ответы приходят пустыми**
Проверьте настройки модели (temperature, max_tokens). Попробуйте другую модель.

**Q: Слишком долгий ответ**
Увеличьте таймаут запроса (левый тулбар → иконка таймера). По умолчанию 90 секунд.

## Роли и поведение

**Q: Роль не следует промпту**
Проверьте, что системный промпт не конфликтует с «Пожеланиями супервизора». Попробуйте упростить промпт.

**Q: D-Chat не отвечает**
Убедитесь, что для выбранной роли настроена модель в настройках сессии.

## Память

**Q: Память не работает**
Проверьте, что у вас есть API-ключ OpenAI (используется для генерации эмбеддингов через \`text-embedding-3-small\`).

**Q: Ролевая память пуста**
Ролевая память накапливается в процессе работы. Вызовите техника для её заполнения.

## Инструменты

**Q: HTTP-инструмент возвращает ошибку**
Проверьте URL, заголовки и тело запроса. SSRF-защита блокирует запросы к внутренним адресам.

## Flow Editor

**Q: Диаграмма не сохраняется**
Убедитесь, что вы авторизованы. Проверьте подключение к интернету.

**Q: Runtime не запускается**
Проверьте, что все обязательные входы узлов подключены. Запустите логистику для диагностики.`,
      en: `# FAQ & Troubleshooting

## API and Access

**Q: Error 401 (Unauthorized)**
Your API key is invalid or expired. Check the key in **Profile → API Keys**.

**Q: Error 402 (Payment Required)**
The provider account has run out of funds. Top up your balance with the provider (OpenAI, Anthropic, etc.).

**Q: Error 404 (Model Not Found)**
Model not found at the provider. It may have been removed or renamed. Select a different model.

**Q: No models available**
Add API keys in **Profile → API Keys**. Without keys, only administrator models are available.

## Chat

**Q: Responses come back empty**
Check model settings (temperature, max_tokens). Try a different model.

**Q: Response takes too long**
Increase request timeout (left toolbar → timer icon). Default is 90 seconds.

## Roles and Behavior

**Q: Role doesn't follow the prompt**
Check that the system prompt doesn't conflict with "Supervisor Wishes." Try simplifying the prompt.

**Q: D-Chat doesn't respond**
Make sure a model is configured for the selected role in session settings.

## Memory

**Q: Memory doesn't work**
Check that you have an OpenAI API key (used for embedding generation via \`text-embedding-3-small\`).

**Q: Role memory is empty**
Role memory accumulates during work. Call a technician to populate it.

## Tools

**Q: HTTP tool returns an error**
Check the URL, headers, and request body. SSRF protection blocks requests to internal addresses.

## Flow Editor

**Q: Diagram doesn't save**
Make sure you're authenticated. Check your internet connection.

**Q: Runtime doesn't start**
Check that all required node inputs are connected. Run logistics for diagnostics.`,
    },
  },
];
