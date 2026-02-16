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

Кнопка **«Обучить всех техников»** в Штате запускает последовательный сидинг всех 10 технических ролей (включая ОТК и Экскурсовода). Роли с существующими знаниями пропускаются (\`force: false\`).

### Индикатор знаний

В хедере (MemoryControls) отображается 📖 с общим количеством чанков знаний и детальным тултипом по каждой роли.

## Системные промпты

Администраторы имеют прямой доступ к редактированию системных промптов всех ролей через модуль **Штат**. Промпты синхронизируются с библиотекой промптов.

> [!WARNING] Промпты ОТК
> Системные промпты ролей ОТК (\`@technocritic\`, \`@technoarbiter\`, \`@technomoderator\`) заблокированы для редактирования — они управляются платформой автоматически.

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

The **"Seed All Tech Roles"** button in Staff runs sequential seeding for all 10 technical roles (including QC Dept. and Guide). Roles with existing knowledge are skipped (\`force: false\`).

### Knowledge Indicator

The header (MemoryControls) displays 📖 with total knowledge chunk count and a detailed per-role tooltip.

## System Prompts

Administrators have direct access to editing system prompts for all roles via the **Staff** module. Prompts are synchronized with the prompt library.

> [!WARNING] QC Dept. Prompts
> System prompts for QC Dept. roles (\`@technocritic\`, \`@technoarbiter\`, \`@technomoderator\`) are locked from editing — they are managed automatically by the platform.

## Behavioral Patterns

Administrators can create and edit **system** patterns (with ✏️ icon), which regular users can only duplicate.`,
    },
  },
  {
    id: 'technical-staff',
    titleKey: 'hydrapedia.sections.technicalStaff',
    icon: 'Wrench',
    content: {
      ru: `# Технический персонал

Штатное расписание AI-Hydra включает **16 ИИ-ролей**, из которых 10 относятся к техническому персоналу. Технические роли разделяются на две группы: **специалисты** (доступны в D-Chat и техподдержке) и **ОТК** (системные роли, работающие автоматически).

## Архитектура оркестратора

Оркестратор (\`hydra-orchestrator\`) управляет мультиагентным взаимодействием:

1. Получает запрос пользователя
2. Извлекает релевантные знания (RAG) для технических ролей
3. Извлекает ролевую память (для ролей с опытом)
4. Формирует контекст с Supervisor Wishes
5. Распределяет запрос между ролями
6. Возвращает ответы в стриминге

## Технические специалисты

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

### Экскурсовод (\`@guide\`)
- Проведение обучающих туров по платформе
- RAG-ответы на вопросы о функционале
- База знаний синхронизирована с Гидрапедией

## Отдел ТехКонтроля (ОТК)

Три системных роли, работающих автоматически в фоновых процессах платформы. Они **не доступны** в D-Chat и техподдержке, а их системные промпты **заблокированы** от редактирования.

### ТехноКритик (\`@technocritic\`)
- Автоматический анализ слабых мест ответов
- Используется в конкурсах и собеседованиях
- Критерии: сила аргументов, логическая связность, качество доказательств, выявление предвзятости

### ТехноАрбитр (\`@technoarbiter\`)
- Автоматическая оценка и судейство
- Используется в конкурсах, дуэлях и собеседованиях
- Критерии: качество синтеза, справедливость, обоснованность решений, консистентность оценок
- При найме модели на роль — она используется как арбитр конкурсов

### ТехноМодератор (\`@technomoderator\`)
- Формирование итоговых заключений
- Используется в собеседованиях для финального вердикта
- Критерии: точность резюме, баланс, качество структуры, выявление консенсуса

> [!TIP] Назначение моделей ОТК
> Каждой роли ОТК можно назначить конкретную модель через **Собеседование** или вручную. Нанятая модель автоматически используется в системных функциях (конкурсы, дуэли, собеседования) вместо дефолтной.

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

The AI-Hydra staff roster includes **16 AI roles**, of which 10 are technical staff. Technical roles are divided into two groups: **specialists** (available in D-Chat and tech support) and **QC Dept.** (system roles that operate automatically).

## Orchestrator Architecture

The orchestrator (\`hydra-orchestrator\`) manages multi-agent interaction:

1. Receives user query
2. Retrieves relevant knowledge (RAG) for technical roles
3. Retrieves role memory (for roles with experience)
4. Forms context with Supervisor Wishes
5. Distributes query among roles
6. Returns responses via streaming

## Technical Specialists

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

### Guide (\`@guide\`)
- Platform educational tours
- RAG-powered answers about platform features
- Knowledge base synced with Hydrapedia

## Quality Control Department (QC Dept.)

Three system roles that operate automatically in platform background processes. They are **not available** in D-Chat and tech support, and their system prompts are **locked** from editing.

### TechnoCritic (\`@technocritic\`)
- Automatic response weakness analysis
- Used in contests and interviews
- Criteria: argument strength, logic coherence, evidence quality, bias detection

### TechnoArbiter (\`@technoarbiter\`)
- Automatic evaluation and judging
- Used in contests, duels, and interviews
- Criteria: synthesis quality, fairness, decision justification, scoring consistency
- When a model is hired for this role — it serves as the contest arbiter

### TechnoModerator (\`@technomoderator\`)
- Final conclusion formation
- Used in interviews for the final verdict
- Criteria: summary accuracy, balance, structure quality, consensus identification

> [!TIP] QC Dept. Model Assignment
> Each QC Dept. role can be assigned a specific model via **Interview** or manually. The hired model is automatically used in system functions (contests, duels, interviews) instead of the default.

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
    content: {
      ru: `# Собеседование

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
| **Вердикт** | Итоговая оценка ТехноАрбитром и ТехноМодератором |

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
- **Рекомендация ТехноАрбитра** — числовая оценка и комментарий
- **Резюме ТехноМодератора** — финальное заключение
- **Кнопки решения** — принять или отклонить кандидата

> [!TIP] Интеграция с ОТК
> Если на роль ТехноАрбитра или ТехноМодератора нанята конкретная модель, именно она будет использоваться для оценки кандидатов на собеседованиях.

## Перезапуск при ошибке

При статусе \`failed\` любой фазы в таймлайне появляется кнопка **«Заново»** (↻), которая создаёт новую сессию собеседования с теми же параметрами (модель + роль).

## Синхронизация

- Панель автоматически синхронизируется с выбранным сотрудником в списке штата
- Ширина панели сохраняется в \`localStorage\`
- Панель остаётся смонтированной, но скрывается через \`maxSize={0}\` для предотвращения потери стейта

## История назначений

Каждое успешное назначение фиксируется в таблице \`role_assignment_history\`:
- Модель, роль, дата назначения и снятия
- Средний балл собеседования
- Причина ротации (\`replaced\`, \`manual\`, \`retest_failed\`)
- Синтетические записи для «холодного старта» (флаг \`is_synthetic\`)`,
      en: `# Interview Panel

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
| **Verdict** | Final evaluation by TechnoArbiter and TechnoModerator |

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
- **TechnoArbiter recommendation** — numeric score and comment
- **TechnoModerator summary** — final conclusion
- **Decision buttons** — accept or reject the candidate

> [!TIP] QC Dept. Integration
> If a specific model is hired for the TechnoArbiter or TechnoModerator role, that model will be used for evaluating candidates in interviews.

## Restart on Failure

When any phase has a \`failed\` status, a **"Retry"** button (↻) appears in the timeline, creating a new interview session with the same parameters (model + role).

## Synchronization

- Panel automatically syncs with the selected staff member in the staff list
- Panel width is persisted in \`localStorage\`
- Panel remains mounted but hidden via \`maxSize={0}\` to prevent state loss

## Assignment History

Each successful assignment is recorded in the \`role_assignment_history\` table:
- Model, role, assignment and removal dates
- Average interview score
- Rotation reason (\`replaced\`, \`manual\`, \`retest_failed\`)
- Synthetic records for "cold start" (\`is_synthetic\` flag)`,
    },
  },
];
