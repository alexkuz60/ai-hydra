import type { HydrapediaSection } from './types';

export const contentSections: HydrapediaSection[] = [
  {
    id: 'prompt-library',
    titleKey: 'hydrapedia.sections.promptLibrary',
    icon: 'Library',
    content: {
      ru: `# Библиотека промптов

Библиотека промптов — централизованное хранилище системных промптов для всех ролей. Промпты можно создавать, редактировать, тегировать и переиспользовать в сессиях.

## Возможности

- **Создание** промптов с привязкой к роли
- **Теги** для категоризации и быстрого поиска
- **Шаринг** — публичные промпты доступны всем пользователям
- **Системные промпты** — предустановленные (защищённые от удаления)
- **Счётчик использования** — отслеживание популярности
- **Локализация** — поддержка RU/EN

## Расширенный редактор

Продвинутый редактор промптов поддерживает:
- Разбиение на секции (заголовки ##)
- Превью в реальном времени
- Переменные для динамической подстановки
- Импорт/экспорт

## Использование в чате

1. Нажмите \`Ctrl+K\` или кнопку промпт-библиотеки
2. Выберите промпт из списка
3. Промпт будет установлен как системный для текущей сессии

## Автоматическая привязка

Каждая роль имеет промпт по умолчанию, синхронизированный с записью в библиотеке (\`is_default=true\`). При изменении системного промпта роли — обновляется и библиотечная запись.`,
      en: `# Prompt Library

The Prompt Library is a centralized storage for system prompts across all roles. Prompts can be created, edited, tagged, and reused in sessions.

## Features

- **Create** prompts linked to specific roles
- **Tags** for categorization and quick search
- **Sharing** — public prompts are available to all users
- **System prompts** — pre-installed (protected from deletion)
- **Usage counter** — popularity tracking
- **Localization** — RU/EN support

## Advanced Editor

The advanced prompt editor supports:
- Section splitting (## headers)
- Real-time preview
- Variables for dynamic substitution
- Import/export

## Usage in Chat

1. Press \`Ctrl+K\` or the prompt library button
2. Select a prompt from the list
3. The prompt will be set as the system prompt for the current session

## Automatic Binding

Each role has a default prompt synchronized with a library entry (\`is_default=true\`). When a role's system prompt changes, the library entry is updated accordingly.`,
    },
  },
  {
    id: 'tools',
    titleKey: 'hydrapedia.sections.tools',
    icon: 'Wrench',
    content: {
      ru: `# Инструменты

Библиотека инструментов расширяет возможности ИИ-ролей через пользовательские интеграции.

## Типы инструментов

### Системные (встроенные)
- **web_search** — поиск в интернете (Tavily/Perplexity/Brave)
- **calculator** — математические вычисления
- **HTML → Markdown** — очистка и преобразование веб-контента

### Пользовательские

**Prompt Tool** — инструмент на основе шаблона промпта. Принимает параметры и генерирует ответ через ИИ.

**HTTP Tool** — инструмент для вызова внешних API:
- Поддержка GET/POST/PUT/DELETE
- Настройка заголовков и тела запроса
- Защита от SSRF (Server-Side Request Forgery)

## Режимы использования

| Режим | Описание |
|-------|----------|
| Всегда | Инструмент вызывается автоматически при каждом запросе |
| Авто | ИИ решает, когда использовать инструмент |
| По запросу | Инструмент вызывается только по явному указанию |

## Встроенные тестеры

Каждый инструмент можно протестировать прямо в интерфейсе:
- **HttpToolTester** — отправка тестовых HTTP-запросов
- **PromptToolTester** — тестирование промпт-инструментов

## Создание инструмента

1. Перейдите в **Инструменты** → «Создать»
2. Выберите тип (Prompt или HTTP)
3. Настройте параметры и шаблон
4. Протестируйте через встроенный тестер
5. Сохраните и привяжите к ролям`,
      en: `# Tools

The Tools Library extends AI role capabilities through custom integrations.

## Tool Types

### System (built-in)
- **web_search** — internet search (Tavily/Perplexity/Brave)
- **calculator** — mathematical calculations
- **HTML → Markdown** — web content cleanup and conversion

### Custom

**Prompt Tool** — a tool based on a prompt template. Accepts parameters and generates a response via AI.

**HTTP Tool** — a tool for calling external APIs:
- GET/POST/PUT/DELETE support
- Header and request body configuration
- SSRF (Server-Side Request Forgery) protection

## Usage Modes

| Mode | Description |
|------|-------------|
| Always | Tool is called automatically with every request |
| Auto | AI decides when to use the tool |
| On Request | Tool is called only on explicit instruction |

## Built-in Testers

Each tool can be tested directly in the interface:
- **HttpToolTester** — sending test HTTP requests
- **PromptToolTester** — testing prompt tools

## Creating a Tool

1. Go to **Tools** → "Create"
2. Choose the type (Prompt or HTTP)
3. Configure parameters and template
4. Test using the built-in tester
5. Save and bind to roles`,
    },
  },
  {
    id: 'behavioral-patterns',
    titleKey: 'hydrapedia.sections.behavioralPatterns',
    icon: 'Star',
    content: {
      ru: `# Паттерны поведения

Паттерны поведения — система настройки стратегий работы и ролевого поведения ИИ.

## Два типа паттернов

### Стратегические шаблоны (Task Blueprints)

Многоэтапные рабочие процессы для типовых задач:
- **Prompt Optimization Pipeline** — Аналитик изучает контекст → Промпт-Инженер оптимизирует
- **Session Memory Update** — Архивариус собирает контекст → обновляет векторную базу → компактифицирует память
- **Lovable Project Manager** — планирование проектов
- **General Co-author** — литературное творчество

Каждый блюпринт содержит:
- Этапы (stages) с описанием действий
- Контрольные точки (checkpoints) для проверки результатов
- Привязку к категории (planning, creative, analysis, technical)

### Ролевые паттерны (Role Behaviors)

Настройка поведения конкретной роли:
- **Коммуникация** — тон (формальный/дружелюбный/нейтральный), детализация
- **Взаимодействия** — как роль реагирует на других участников
- **Реакции** — поведение в конфликтных ситуациях

## Права доступа

| Тип | Обычный пользователь | Администратор |
|-----|---------------------|---------------|
| Системные | 🔒 Только дублирование | ✏️ Прямое редактирование |
| Публичные (\`is_shared\`) | 👁 Просмотр + Copy | ✏️ Полный доступ |
| Личные | ✏️ Полный доступ | ✏️ Полный доступ |`,
      en: `# Behavioral Patterns

Behavioral Patterns — a system for configuring work strategies and AI role behavior.

## Two Types of Patterns

### Strategic Templates (Task Blueprints)

Multi-stage workflows for standard tasks:
- **Prompt Optimization Pipeline** — Analyst studies context → Prompt Engineer optimizes
- **Session Memory Update** — Archivist collects context → updates vector database → compactifies memory
- **Lovable Project Manager** — project planning
- **General Co-author** — creative writing

Each blueprint contains:
- Stages with action descriptions
- Checkpoints for result verification
- Category binding (planning, creative, analysis, technical)

### Role Patterns (Role Behaviors)

Configuring specific role behavior:
- **Communication** — tone (formal/friendly/neutral), verbosity
- **Interactions** — how the role reacts to other participants
- **Reactions** — behavior in conflict situations

## Access Rights

| Type | Regular User | Administrator |
|------|-------------|---------------|
| System | 🔒 Duplicate only | ✏️ Direct editing |
| Public (\`is_shared\`) | 👁 View + Copy | ✏️ Full access |
| Personal | ✏️ Full access | ✏️ Full access |`,
    },
  },
];
