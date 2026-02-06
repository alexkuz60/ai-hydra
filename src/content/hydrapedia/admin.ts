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
| Гидропедия | «Загрузить из Гидропедии» — обучение системным знаниям |
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
];
