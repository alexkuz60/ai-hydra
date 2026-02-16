import type { HydrapediaSection } from './types';

export const adminSections: HydrapediaSection[] = [
  {
    id: 'hydra-training',
    titleKey: 'hydrapedia.sections.hydraTraining',
    icon: 'Wrench',
    adminOnly: true,
    content: {
      ru: `# Дрессировка Гидры

> ⚠️ Этот раздел доступен только администраторам.

## Профильные знания (RAG)

Система профильных знаний обучает технические роли через Retrieval-Augmented Generation (RAG).

### Архитектура

- Таблица \`role_knowledge\` — хранение документации
- Автоматический чанкинг текста
- Генерация эмбеддингов (\`text-embedding-3-small\`)
- Семантический поиск через pgvector (HNSW-индексы)
- Оркестратор извлекает 3 наиболее релевантных фрагмента (сходство > 0.3)

### Источники знаний

| Источник | Описание |
|----------|----------|
| Ручной ввод | Текст вводится вручную с метаданными |
| Гидрапедия | «Загрузить из Гидрапедии» — обучение системным знаниям |
| Firecrawl | Импорт с веб-страниц (извлечение Markdown из URL) |

### Firecrawl и BYOK

Firecrawl поддерживает персональные API-ключи:
- Персональный ключ имеет **приоритет** над системным
- Настройка в **Профиль → API-ключи → Tools → Firecrawl**
- При сохранении чанков отображается прогресс-бар

### Массовый сидинг

Кнопка **«Обучить всех техников»** в Штате запускает последовательный сидинг всех 6 технических ролей. Роли с существующими знаниями пропускаются (\`force: false\`).

### Индикатор знаний

В хедере (MemoryControls) отображается 📖 с общим количеством чанков знаний и детальным тултипом по каждой роли.

## Системные промпты

Администраторы имеют прямой доступ к редактированию системных промптов всех ролей через модуль **Штат**. Промпты синхронизируются с библиотекой промптов.

## Паттерны поведения

Администраторы могут создавать и редактировать **системные** паттерны (с иконкой ✏️), которые обычные пользователи могут только дублировать.`,
      en: `# Hydra Training

> ⚠️ This section is accessible to administrators only.

## Domain Knowledge (RAG)

The domain knowledge system trains technical roles via Retrieval-Augmented Generation (RAG).

### Architecture

- \`role_knowledge\` table — documentation storage
- Automatic text chunking
- Embedding generation (\`text-embedding-3-small\`)
- Semantic search via pgvector (HNSW indexes)
- Orchestrator retrieves 3 most relevant fragments (similarity > 0.3)

### Knowledge Sources

| Source | Description |
|--------|-------------|
| Manual input | Text entered manually with metadata |
| Hydrapedia | "Load from Hydrapedia" — training with system knowledge |
| Firecrawl | Import from web pages (Markdown extraction from URLs) |

### Firecrawl and BYOK

Firecrawl supports personal API keys:
- Personal key takes **priority** over system key
- Configuration in **Profile → API Keys → Tools → Firecrawl**
- Progress bar is displayed when saving chunks

### Bulk Seeding

The **"Seed All Tech Roles"** button in Staff runs sequential seeding for all 6 technical roles. Roles with existing knowledge are skipped (\`force: false\`).

### Knowledge Indicator

The header (MemoryControls) displays 📖 with total knowledge chunk count and a detailed per-role tooltip.

## System Prompts

Administrators have direct access to editing system prompts for all roles via the **Staff** module. Prompts are synchronized with the prompt library.

## Behavioral Patterns

Administrators can create and edit **system** patterns (with ✏️ icon), which regular users can only duplicate.`,
    },
  },
  {
    id: 'technical-staff',
    titleKey: 'hydrapedia.sections.technicalStaff',
    icon: 'Wrench',
    adminOnly: true,
    content: {
      ru: `# Технический персонал

> ⚠️ Этот раздел доступен только администраторам.

## Архитектура оркестратора

Оркестратор (\`hydra-orchestrator\`) управляет мультиагентным взаимодействием:

1. Получает запрос пользователя
2. Извлекает релевантные знания (RAG) для технических ролей
3. Извлекает ролевую память (для ролей с опытом)
4. Формирует контекст с Supervisor Wishes
5. Распределяет запрос между ролями
6. Возвращает ответы в стриминге

## Технические роли

### Архивариус (\`@archivist\`)
- Управление сессионной памятью
- Компактификация старых записей
- Контроль качества эмбеддингов

### Аналитик (\`@analyst\`)
- Анализ метрик и статистики
- Формирование техзаданий для других ролей
- Оценка качества ответов

### Промпт-Инженер (\`@promptengineer\`)
- Оптимизация системных промптов
- Анализ структуры промптов
- A/B тестирование вариантов

### Логистик (\`@flowregulator\`)
- Проверка диаграмм Flow Editor
- Анализ потоков данных
- Рекомендации по оптимизации

### Инструменталист (\`@toolsmith\`)
- Создание и тестирование инструментов
- Интеграция с внешними API
- Отладка HTTP-инструментов

### Веб-хантер (\`@webhunter\`)
- Поиск информации в интернете
- Скрейпинг документации
- Верификация данных

## Двойная система тулбаров

Интерфейс ввода использует декомпозированные тулбары:

**Левый** (технические функции):
- Сворачивание панели
- Прикрепление файлов
- Настройка таймаута
- Вызов Промпт-Инженера

**Правый** (действия отправки):
- Отправка всем экспертам
- Выбор конкретного консультанта (D-Chat)

## Пожелания супервизора

Supervisor Wishes — текстовые директивы для управления поведением ИИ:
- Глобальные инструкции для всех ролей
- Приоритет выше системного промпта роли
- Доступны только пользователям с ролью \`supervisor\``,
      en: `# Technical Staff

> ⚠️ This section is accessible to administrators only.

## Orchestrator Architecture

The orchestrator (\`hydra-orchestrator\`) manages multi-agent interaction:

1. Receives user query
2. Retrieves relevant knowledge (RAG) for technical roles
3. Retrieves role memory (for roles with experience)
4. Forms context with Supervisor Wishes
5. Distributes query among roles
6. Returns responses via streaming

## Technical Roles

### Archivist (\`@archivist\`)
- Session memory management
- Old entry compactification
- Embedding quality control

### Analyst (\`@analyst\`)
- Metrics and statistics analysis
- Brief formation for other roles
- Response quality assessment

### Prompt Engineer (\`@promptengineer\`)
- System prompt optimization
- Prompt structure analysis
- A/B variant testing

### Flow Regulator (\`@flowregulator\`)
- Flow Editor diagram verification
- Data flow analysis
- Optimization recommendations

### Toolsmith (\`@toolsmith\`)
- Tool creation and testing
- External API integration
- HTTP tool debugging

### Web Hunter (\`@webhunter\`)
- Internet information search
- Documentation scraping
- Data verification

## Dual Toolbar System

The input interface uses decomposed toolbars:

**Left** (technical functions):
- Panel collapse
- File attachments
- Timeout configuration
- Prompt Engineer invocation

**Right** (send actions):
- Send to all experts
- Select specific consultant (D-Chat)

## Supervisor Wishes

Supervisor Wishes — text directives for controlling AI behavior:
- Global instructions for all roles
- Higher priority than role system prompt
- Available only to users with \`supervisor\` role`,
    },
  },
  {
    id: 'interview-panel',
    titleKey: 'hydrapedia.sections.interviewPanel',
    icon: 'Wrench',
    adminOnly: true,
    content: {
      ru: `# Собеседование

> ⚠️ Этот раздел доступен только администраторам.

Панель собеседования — инструмент для оценки ИИ-моделей на соответствие штатным ролям. Интегрирована в раздел **Штат специалистов** как третья панель в группе ресайз-панелей.

## Интерфейс

### Заголовок панели

Компактный заголовок содержит:
- **Название роли** — роль, для которой проводится собеседование
- **Кнопка «+»** — создание нового собеседования
- **Кнопка обновления** — повторная загрузка данных сессии
- **Кнопка закрытия** — визуально отделена вертикальным разделителем; при наведении окрашивается в красный

### Горизонтальный таймлайн

Три фазы собеседования отображаются горизонтальным таймлайном:

| Фаза | Описание |
|------|----------|
| **Брифинг** | Генерация задания для кандидата на основе профиля роли |
| **Тесты** | Выполнение тестовых заданий кандидатом |
| **Вердикт** | Итоговая оценка Арбитром и Модератором |

**Визуальные состояния фаз:**
- ⏳ **Ожидание** — серый пунктир
- 🔵 **Активная** — бегущий пунктир (2px), пульсирующая иконка
- ✅ **Завершена** — сплошная линия, зелёная галочка
- ❌ **Ошибка** — красная линия, иконка ↻ с кнопкой «Заново» для перезапуска

### Создание собеседования

Форма создания включает:
- **Выбор модели-кандидата** — с фильтрацией BYOK-моделей
- **Прогноз бюджета** — стоимость и токены (медиана последних 10 сессий)
- **Множитель** — 1x/2x/3x для Reasoning-моделей
- Запоминание выбранной модели для каждой роли

### Прогресс выполнения

Вертикальный список шагов с real-time метриками (SSE):
- Название шага и статус
- Количество токенов
- Затраченное время

### Режим вердикта

- **Side-by-Side сравнение** — Baseline vs. Candidate в Markdown
- **Локализованные компетенции** — из словаря \`COMPETENCY_I18N\`
- **Рекомендация Арбитра** — числовая оценка и комментарий
- **Резюме Модератора** — финальное заключение
- **Кнопки решения** — принять или отклонить кандидата

## Перезапуск при ошибке

При статусе \`failed\` любой фазы в таймлайне появляется кнопка **«Заново»** (↻), которая создаёт новую сессию собеседования с теми же параметрами (модель + роль).

## Синхронизация

- Панель автоматически синхронизируется с выбранным сотрудником в списке штата
- Ширина панели сохраняется в \`localStorage\`
- Панель остаётся смонтированной, но скрывается через \`maxSize={0}\` для предотвращения потери стейта`,
      en: `# Interview Panel

> ⚠️ This section is accessible to administrators only.

The interview panel is a tool for evaluating AI models for staff role assignments. It is integrated into the **Staff Roles** section as a third panel in the resizable panel group.

## Interface

### Panel Header

The compact header contains:
- **Role name** — the role being interviewed for
- **"+" button** — create a new interview
- **Refresh button** — reload session data
- **Close button** — visually separated by a vertical divider; turns red on hover

### Horizontal Timeline

Three interview phases are displayed as a horizontal timeline:

| Phase | Description |
|-------|-------------|
| **Briefing** | Generate assignment for the candidate based on the role profile |
| **Tests** | Candidate executes test assignments |
| **Verdict** | Final evaluation by Arbiter and Moderator |

**Phase visual states:**
- ⏳ **Pending** — gray dashed line
- 🔵 **Active** — animated dashed line (2px), pulsing icon
- ✅ **Completed** — solid line, green checkmark
- ❌ **Failed** — red line, ↻ icon with "Retry" button for restart

### Creating an Interview

The creation form includes:
- **Candidate model selection** — with BYOK model filtering
- **Budget forecast** — cost and tokens (median of last 10 sessions)
- **Multiplier** — 1x/2x/3x for Reasoning models
- Remembers selected model per role

### Execution Progress

Vertical step list with real-time metrics (SSE):
- Step name and status
- Token count
- Elapsed time

### Verdict Mode

- **Side-by-Side comparison** — Baseline vs. Candidate in Markdown
- **Localized competencies** — from \`COMPETENCY_I18N\` dictionary
- **Arbiter recommendation** — numeric score and comment
- **Moderator summary** — final conclusion
- **Decision buttons** — accept or reject the candidate

## Restart on Failure

When any phase has a \`failed\` status, a **"Retry"** button (↻) appears in the timeline, creating a new interview session with the same parameters (model + role).

## Synchronization

- Panel automatically syncs with the selected staff member in the staff list
- Panel width is persisted in \`localStorage\`
- Panel remains mounted but hidden via \`maxSize={0}\` to prevent state loss`,
    },
  },
];
