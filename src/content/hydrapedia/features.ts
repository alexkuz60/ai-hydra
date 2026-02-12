import type { HydrapediaSection } from './types';

export const featuresSections: HydrapediaSection[] = [
  {
    id: 'model-ratings',
    titleKey: 'hydrapedia.sections.modelRatings',
    icon: 'BarChart3',
    content: {
      ru: `# Подиум ИИ-моделей

Подиум моделей — система рейтинга, портфолио и статистики использования ИИ-моделей. Интерфейс построен по принципу мастер-деталь с ResizablePanel и поддерживает режимы навигатора Min/Max.

## Три раздела

### Портфолио ИИ-моделей

Список всех доступных моделей с индикацией провайдеров (OpenAI, Anthropic, Google, DeepSeek и др.).

> [!TIP] Индикатор доступности
> Модели и провайдеры помечаются зелёной галочкой/точкой при наличии настроенного API-ключа (BYOK) или прав администратора. При отсутствии ключа элементы приглушаются (opacity-50).

### Конкурс интеллект-красоты

Модуль для сравнительного тестирования моделей. Позволяет создать конкурс между несколькими моделями и оценить их на соответствие заданным критериям. Результаты рассчитываются по одной из трёх схем оценки (см. раздел ниже).

### Рейтинги ИИ-моделей

Статистика и аналитика использования моделей с визуализациями.

## Метрики

- **Количество ответов** — сколько раз модель была использована
- **Полученные 🧠** — оценки «мозгов» (лайки от пользователя)
- **Отклонения** — сколько раз ответ был отклонён
- **Средний рейтинг** — соотношение лайков к общему числу ответов

## Визуализация

- **Bar/Pie графики** для топ-10 моделей
- Фильтрация по периодам (неделя, месяц, всё время)
- Высококонтрастная палетра, адаптированная к тёмной теме
- Данные объединяют оценки пользователей и автоматические оценки Арбитра

## Как оценивать

После получения ответа от модели вы можете:
- 🧠 **Поставить мозг** — отметить качественный ответ
- 👎 **Отклонить** — отметить неудачный ответ

Эти оценки накапливаются и формируют персональный рейтинг моделей.

## Схемы итоговой оценки конкурса

Конкурс интеллект-красоты поддерживает три независимых метода расчёта итогового балла на основе полученных оценок:

### 1️⃣ Средневзвешенный балл (Weighted Average)

**Назначение**: Простой и быстрый способ получить комплексную оценку, учитывающую мнения пользователя и Арбитра.

**Формула**:
\`\`\`
ФинальныйБалл = (ОценкаПользователя × УдельныйВесПользователя) + (ОценкаАрбитра × УдельныйВесАрбитра)

где:
  УдельныйВесПользователя + УдельныйВесАрбитра = 100%
  По умолчанию: Пользователь 40%, Арбитр 60%
\`\`\`

**Примеры**:
- Пользователь оценил: 8/10, Арбитр оценил: 7/10
  - ФинальныйБалл = (8 × 0,4) + (7 × 0,6) = 3,2 + 4,2 = **7,4 баллов**

- Пользователь оценил: 9/10, Арбитр оценил: 6/10
  - ФинальныйБалл = (9 × 0,4) + (6 × 0,6) = 3,6 + 3,6 = **7,2 баллов**

**Когда использовать**: Когда вас интересует суммарная производительность на основе всех доступных оценок.

---

### 2️⃣ Турнирная таблица (Tournament)

**Назначение**: Определить чемпиона через прямые попарные сравнения по раундам.

**Логика**:
1. Для каждого раунда модели сравниваются попарно
2. В каждом сравнении побеждает модель с **большей комбинированной оценкой**:
   - КомбинированнаяОценка = (ОценкаПользователя × 40%) + (ОценкаАрбитра × 60%)
3. Модель получает **3 очка за победу**, **1 очко за ничью**, **0 очков за поражение** (как в футболе)

**Формула расчёта**:
\`\`\`
ТурнирнаяПозиция = (Побед × 3) + (Ничьих × 1) + (Поражений × 0)

Пример турнира из 3 туров между 2 моделями:
  Модель A в раунде 1: 8 баллов → побеждает модель B (6 баллов) → 3 очка
  Модель A в раунде 2: 7 баллов → проигрывает модели B (8 баллов) → 0 очков
  Модель A в раунде 3: 7 баллов → ничья с моделью B (7 баллов) → 1 очко
  
  Итог: 3 + 0 + 1 = 4 очка
\`\`\`

**Что отображается**:
- **W (Wins)** — количество побед
- **D (Draws)** — количество ничьих
- **L (Losses)** — количество поражений
- **Total Points** — итоговые очки

**Когда использовать**: Когда важно определить явного лидера через прямые сравнения. Идеально для конкурсов с 3+ раундами.

---

### 3️⃣ Рейтинг Эло (Elo Rating)

**Назначение**: Динамический рейтинг, который эволюционирует с каждым раундом, учитывая прогнозируемую вероятность победы.

**Базовые параметры**:
- **Начальный рейтинг**: 1500 баллов для каждой модели
- **K-фактор**: 32 (чувствительность к результатам; стандарт из шахмат)

**Формула Эло**:
\`\`\`
ОжидаемаяВероятностьПобеды(A) = 1 / (1 + 10^((РейтингB - РейтингA) / 400))

НовыйРейтинг(A) = СтарыйРейтинг(A) + K × (АктуальнаяОценка - ОжидаемаяОценка)

где:
  АктуальнаяОценка = 1 если выиграла, 0 если проиграла, 0.5 если ничья
  ОжидаемаяОценка = вероятность, вычисленная выше
\`\`\`

**Пример эволюции**:
\`\`\`
Раунд 1:
  Модель A (1500) vs Модель B (1500)
  Ожидаемая вероятность для A = 0.5
  A выигрывает → НовыйРейтинг(A) = 1500 + 32 × (1 - 0.5) = 1516
  B проигрывает → НовыйРейтинг(B) = 1500 + 32 × (0 - 0.5) = 1484

Раунд 2:
  Модель A (1516) vs Модель B (1484)
  Ожидаемая вероятность для A = 0.53
  A выигрывает → НовыйРейтинг(A) = 1516 + 32 × (1 - 0.53) = 1531
  B проигрывает → НовыйРейтинг(B) = 1484 + 32 × (0 - 0.47) = 1469
\`\`\`

**Что отображается**:
- **Elo Rating** — финальный рейтинг после всех раундов (округлено до целого)

**Особенности**:
- Рейтинг **награждает скромные победы** (если вы слабее противника по прогнозу)
- Рейтинг **штрафует ожидаемые победы** (если вы сильнее противника)
- Подходит для длительных турниров с эволюцией производительности

**Когда использовать**: Когда хотите видеть динамику развития моделей. Лучше всего работает с 4+ раундами.

---

## Сравнение схем оценки

| Аспект | Weighted Average | Tournament | Elo |
|--------|-----------------|-----------|-----|
| **Сложность** | Простая | Средняя | Сложная |
| **Результат** | Балл 0–100 | Очки футбола | Рейтинг 1500+ |
| **Идеальное количество раундов** | 1–3 | 3–5 | 4+ |
| **Учитывает прогноз** | Нет | Нет | Да |
| **Поддерживает ничьи** | Да | Да | Да |
| **Лучше для** | Быстрой оценки | Чемпионата | Долгосрочного рейтинга |

> [!TIP] Визуальное сравнение
> После завершения конкурса на вкладке «Оценки» автоматически появляется визуальное сравнение всех трёх схем. Для каждой модели отображаются горизонтальные бары с нормализованными баллами по каждой схеме и индикаторы ▲▼ изменения позиции относительно средневзвешенного балла. Подсвеченные строки указывают на модели, чья позиция различается между схемами — это помогает понять, когда выбор метода критичен.`,
      en: `# AI Model Podium

The Model Podium — a rating, portfolio, and usage statistics system for AI models. The interface follows the master-detail pattern with ResizablePanel and supports Min/Max navigator modes.

## Three Sections

### AI Model Portfolio

A list of all available models with provider indicators (OpenAI, Anthropic, Google, DeepSeek, etc.).

> [!TIP] Availability Indicator
> Models and providers are marked with a green checkmark/dot when a configured API key (BYOK) or admin rights are present. Without a key, elements are dimmed (opacity-50).

### Intelligence Beauty Contest

A module for comparative model testing. Allows you to create a contest between several models and evaluate them against specified criteria. Results are calculated using one of three scoring schemes (see section below).

### AI Model Ratings

Usage statistics and analytics with visualizations.

## Metrics

- **Response count** — how many times the model was used
- **Received 🧠** — "brain" ratings (user likes)
- **Dismissals** — how many times a response was dismissed
- **Average rating** — ratio of likes to total responses

## Visualization

- **Bar/Pie charts** for top-10 models
- Filtering by period (week, month, all time)
- High-contrast palette adapted for dark theme
- Data combines user ratings and automatic Arbiter evaluations

## How to Rate

After receiving a response from a model you can:
- 🧠 **Give a brain** — mark a quality response
- 👎 **Dismiss** — mark an unsuccessful response

These ratings accumulate and form a personal model ranking.

## Final Scoring Schemes for Contest

The Intelligence Beauty Contest supports three independent methods for calculating the final score based on received evaluations:

### 1️⃣ Weighted Average

**Purpose**: A simple and fast way to get a comprehensive evaluation that takes into account opinions from both the user and the Arbiter.

**Formula**:
\`\`\`
FinalScore = (UserScore × UserWeight) + (ArbiterScore × ArbiterWeight)

where:
  UserWeight + ArbiterWeight = 100%
  Default: User 40%, Arbiter 60%
\`\`\`

**Examples**:
- User rated: 8/10, Arbiter rated: 7/10
  - FinalScore = (8 × 0.4) + (7 × 0.6) = 3.2 + 4.2 = **7.4 points**

- User rated: 9/10, Arbiter rated: 6/10
  - FinalScore = (9 × 0.4) + (6 × 0.6) = 3.6 + 3.6 = **7.2 points**

**When to use**: When you're interested in overall performance based on all available evaluations.

---

### 2️⃣ Tournament Table

**Purpose**: Determine the champion through direct pairwise comparisons across rounds.

**Logic**:
1. For each round, models are compared pairwise
2. In each comparison, the model with the **higher combined score** wins:
   - CombinedScore = (UserScore × 40%) + (ArbiterScore × 60%)
3. A model earns **3 points for a win**, **1 point for a draw**, **0 points for a loss** (like in football)

**Calculation formula**:
\`\`\`
TournamentPosition = (Wins × 3) + (Draws × 1) + (Losses × 0)

Example of a 3-round tournament between 2 models:
  Model A in round 1: 8 points → defeats model B (6 points) → 3 points
  Model A in round 2: 7 points → loses to model B (8 points) → 0 points
  Model A in round 3: 7 points → draws with model B (7 points) → 1 point
  
  Total: 3 + 0 + 1 = 4 points
\`\`\`

**What's displayed**:
- **W (Wins)** — number of victories
- **D (Draws)** — number of draws
- **L (Losses)** — number of defeats
- **Total Points** — final points

**When to use**: When you need to identify a clear leader through direct comparisons. Ideal for contests with 3+ rounds.

---

### 3️⃣ Elo Rating

**Purpose**: A dynamic rating that evolves with each round, accounting for the predicted probability of winning.

**Base parameters**:
- **Initial rating**: 1500 points for each model
- **K-factor**: 32 (sensitivity to results; standard from chess)

**Elo formula**:
\`\`\`
ExpectedWinProbability(A) = 1 / (1 + 10^((RatingB - RatingA) / 400))

NewRating(A) = OldRating(A) + K × (ActualScore - ExpectedScore)

where:
  ActualScore = 1 if won, 0 if lost, 0.5 if draw
  ExpectedScore = probability calculated above
\`\`\`

**Evolution example**:
\`\`\`
Round 1:
  Model A (1500) vs Model B (1500)
  Expected probability for A = 0.5
  A wins → NewRating(A) = 1500 + 32 × (1 - 0.5) = 1516
  B loses → NewRating(B) = 1500 + 32 × (0 - 0.5) = 1484

Round 2:
  Model A (1516) vs Model B (1484)
  Expected probability for A = 0.53
  A wins → NewRating(A) = 1516 + 32 × (1 - 0.53) = 1531
  B loses → NewRating(B) = 1484 + 32 × (0 - 0.47) = 1469
\`\`\`

**What's displayed**:
- **Elo Rating** — final rating after all rounds (rounded to nearest integer)

**Features**:
- Rating **rewards upset victories** (if you're weaker than your opponent by prediction)
- Rating **penalizes expected wins** (if you're stronger than your opponent)
- Best suited for long-term tournaments with evolving performance

**When to use**: When you want to see the dynamics of model development. Works best with 4+ rounds.

---

## Scoring Schemes Comparison

| Aspect | Weighted Average | Tournament | Elo |
|--------|-----------------|-----------|-----|
| **Complexity** | Simple | Medium | Complex |
| **Result** | Score 0–100 | Football points | Rating 1500+ |
| **Ideal round count** | 1–3 | 3–5 | 4+ |
| **Accounts for prediction** | No | No | Yes |
| **Supports draws** | Yes | Yes | Yes |
| **Best for** | Quick evaluation | Championship | Long-term rating |

> [!TIP] Visual Comparison
> After a contest completes, the "Scores" tab automatically shows a visual comparison of all three schemes. For each model, horizontal bars display normalized scores per scheme with ▲▼ indicators showing rank changes relative to the weighted average baseline. Highlighted rows indicate models whose ranking differs between schemes — helping you understand when the choice of method matters.`,
    },
  },
  {
    id: 'tasks',
    titleKey: 'hydrapedia.sections.tasks',
    icon: 'Star',
    content: {
      ru: `# Задачи

Модуль управления задачами для организации работы с ИИ.

## Возможности

- Создание задач с описанием
- Привязка к сессиям чата
- Статусы: новая, в работе, выполнена
- Отображение текущей задачи в хедере (TaskIndicator)

## TaskIndicator

В глобальном хедере отображается индикатор текущей задачи — название и ссылка на страницу задач. Это позволяет всегда видеть, над чем вы работаете, независимо от текущего раздела.`,
      en: `# Tasks

Task management module for organizing work with AI.

## Features

- Create tasks with descriptions
- Link to chat sessions
- Statuses: new, in progress, completed
- Current task display in header (TaskIndicator)

## TaskIndicator

The global header displays a current task indicator — title and link to the tasks page. This lets you always see what you're working on, regardless of the current section.`,
    },
  },
  {
    id: 'roles-catalog',
    titleKey: 'hydrapedia.sections.rolesCatalog',
    icon: 'Users',
    content: {
      ru: `# Каталог ролей

AI-Hydra включает 12 специализированных ИИ-ролей, разделённых на две группы.

## Экспертные роли (6)

| Роль | Иконка | Специализация |
|------|--------|---------------|
| Эксперт | \`Brain\` | Универсальный анализ и генерация решений |
| Критик | \`Shield\` | Поиск слабых мест, контраргументация |
| Арбитр | \`Scale\` | Синтез позиций, взвешенная оценка |
| Консультант | \`Lightbulb\` | Креативные подходы, альтернативы |
| Модератор | \`Gavel\` | Структурирование дискуссии |
| Советник | \`HandHelping\` | Практические рекомендации |

## Технический персонал (6)

| Роль | Иконка | Специализация |
|------|--------|---------------|
| Архивариус | \`Archive\` | Управление памятью, сохранение контекста |
| Аналитик | \`LineChart\` | Анализ данных и метрик |
| Веб-хантер | \`Globe\` | Поиск информации в интернете |
| Промпт-Инженер | \`Wand2\` | Оптимизация системных промптов |
| Логистик | \`Route\` | Проверка и настройка потоков |
| Инструменталист | \`Wrench\` | Создание и тестирование инструментов |

## Ролевая память

Технические роли накапливают **долгосрочный опыт** между сессиями — предпочтения пользователя, успешные стратегии, типичные ошибки. Подробнее в разделе «Ролевая память».

## Модуль «Штат» — управление ролями

Раздел **Штат** — центр администрирования всех ролей. Интерфейс построен по принципу «таблица слева — детали справа».

### Карточка роли

При выборе роли открывается детальная карточка с заголовком (иконка, имя, тип), описанием и четырьмя секциями:

### 1. Системный промпт

Промпт определяет поведение роли. Интерфейс показывает структуру промпта через **секции** (каждый заголовок \`##\` — отдельная секция с иконкой):

- **Просмотр** — промпт разбит на визуальные секции с иконками. Нажмите на заголовок, чтобы развернуть/свернуть
- **Полный просмотр** — кнопка 🔍 открывает промпт в полноэкранном диалоге
- **Редактирование** — кнопка ✏️ «Редактировать» переключает в режим секционного редактора
- **Библиотека** — выпадающий список позволяет загрузить промпт из библиотеки (личные и публичные)
- **Перевод** — кнопки RU↔EN для автоматического перевода между языками
- **Сохранение** — отредактированный промпт сохраняется в библиотеку с именем и флагом «Поделиться»

> [!TIP] Индикатор изменений
> Точка рядом с заголовком «Системный промпт» сигнализирует о несохранённых изменениях.

### 2. Табель о рангах (Иерархия)

Иерархия определяет, как роли взаимодействуют друг с другом. Три вкладки:

| Вкладка | Назначение | Пример |
|---------|-----------|--------|
| **Уступает** | Роли, чьё мнение приоритетнее | Эксперт уступает Арбитру |
| **Оспаривает** | Роли, с которыми допускается дискуссия | Критик оспаривает Эксперта |
| **Сотрудничает** | Роли для совместной работы | Аналитик сотрудничает с Архивариусом |

> [!WARNING] Автоматическая валидация конфликтов
> Система обнаруживает противоречия (роль одновременно уступает и оспаривает другую) и предлагает разрешение конфликта перед сохранением.

### 3. Профильные знания (RAG)

Доступно только для **технических ролей**. Позволяет обучать роль документацией:
- Ручной ввод текстов с метаданными
- Импорт из Гидропедии
- Скрейпинг веб-страниц через Firecrawl
- Статистика: количество чанков и статус обучения

### 4. Настройки

- **Утверждение Супервизором** — переключатель Human-in-the-Loop. Когда включён, ответы роли требуют одобрения перед финализацией
- **Технический персонал** — бейдж 🔧 для технических ролей

\`\`\`
:::playground:::
\`\`\``,
      en: `# Roles Catalog

AI-Hydra includes 12 specialized AI roles divided into two groups.

## Expert Roles (6)

| Role | Icon | Specialization |
|------|------|----------------|
| Expert | \`Brain\` | Universal analysis and solution generation |
| Critic | \`Shield\` | Finding weaknesses, counter-argumentation |
| Arbiter | \`Scale\` | Position synthesis, balanced evaluation |
| Consultant | \`Lightbulb\` | Creative approaches, alternatives |
| Moderator | \`Gavel\` | Discussion structuring |
| Advisor | \`HandHelping\` | Practical recommendations |

## Technical Staff (6)

| Role | Icon | Specialization |
|------|------|----------------|
| Archivist | \`Archive\` | Memory management, context preservation |
| Analyst | \`LineChart\` | Data and metrics analysis |
| Web Hunter | \`Globe\` | Internet information search |
| Prompt Engineer | \`Wand2\` | System prompt optimization |
| Flow Regulator | \`Route\` | Flow checking and configuration |
| Toolsmith | \`Wrench\` | Tool creation and testing |

## Role Memory

Technical roles accumulate **long-term experience** between sessions — user preferences, successful strategies, common mistakes. See "Role Memory" section for details.

## Staff Module — Role Management

The **Staff** section is the administration center for all roles. The interface follows a "table on the left — details on the right" pattern.

### Role Card

Selecting a role opens a detailed card with a header (icon, name, type), description, and four sections:

### 1. System Prompt

The prompt defines role behavior. The interface displays the prompt structure through **sections** (each \`##\` heading becomes a separate section with an icon):

- **View** — the prompt is split into visual sections with icons. Click a heading to expand/collapse
- **Full View** — the 🔍 button opens the prompt in a fullscreen dialog
- **Editing** — the ✏️ "Edit" button switches to the section editor mode
- **Library** — a dropdown lets you load a prompt from the library (personal and shared)
- **Translation** — RU↔EN buttons for automatic translation between languages
- **Save** — the edited prompt is saved to the library with a name and "Share" flag

> [!TIP] Change Indicator
> A dot next to the "System Prompt" heading signals unsaved changes.

### 2. Rank Table (Hierarchy)

The hierarchy defines how roles interact with each other. Three tabs:

| Tab | Purpose | Example |
|-----|---------|---------|
| **Defers to** | Roles whose opinion has higher priority | Expert defers to Arbiter |
| **Challenges** | Roles that can be debated | Critic challenges Expert |
| **Collaborates** | Roles for joint work | Analyst collaborates with Archivist |

> [!WARNING] Automatic Conflict Validation
> The system detects contradictions (a role simultaneously defers to and challenges another) and offers conflict resolution before saving.

### 3. Domain Knowledge (RAG)

Available only for **technical roles**. Allows training a role with documentation:
- Manual text entry with metadata
- Import from Hydrapedia
- Web page scraping via Firecrawl
- Statistics: chunk count and training status

### 4. Settings

- **Supervisor Approval** — Human-in-the-Loop toggle. When enabled, role responses require approval before finalization
- **Technical Staff** — 🔧 badge for technical roles

\`\`\`
:::playground:::
\`\`\``,
    },
  },
  {
    id: 'session-memory',
    titleKey: 'hydrapedia.sections.sessionMemory',
    icon: 'BrainCircuit',
    content: {
      ru: `# Память сессии

Память сессии сохраняет ключевые моменты диалога для контекстного обогащения будущих запросов.

## Как это работает

1. В процессе диалога система извлекает важные фрагменты
2. Фрагменты разбиваются на чанки и сохраняются с эмбеддингами
3. При новом запросе — семантический поиск по сохранённым фрагментам
4. Наиболее релевантные фрагменты внедряются в контекст модели

## Типы чанков

- **Факт** — конкретная информация из диалога
- **Решение** — принятое решение или договорённость
- **Задача** — поставленная задача
- **Инсайт** — важное наблюдение

## Управление

В хедере приложения расположен индикатор **MemoryControls**:
- 🧠 **Badge** — количество фрагментов памяти сессии
- 📖 **Knowledge badge** — общее количество чанков профильных знаний с детальным тултипом по ролям
- 🔄 **Обновить** — ручное обновление памяти
- ⚙️ **Настройки** — быстрый переход к настройкам памяти

## SessionMemoryDialog

Диалог управления памятью позволяет:
- Просматривать все сохранённые фрагменты
- Удалять неактуальные
- Фильтровать по типу чанка + специальный фильтр «Дубликаты»

### Обнаружение дубликатов

Система автоматически выявляет дублирующиеся фрагменты через нормализацию текста. При активации фильтра «Дубликаты» появляется кнопка массового удаления.

> [!TIP] Логика удаления дубликатов
> При массовом удалении сохраняется самый старый фрагмент в группе (по \`created_at\`), а остальные копии удаляются.

> [!CAUTION] Двухэтапное подтверждение
> Кнопки «Очистить всё» и «Удалить дубликаты» требуют повторного нажатия для подтверждения. Кнопка «Отмена» позволяет сбросить состояние подтверждения.

### Семантический поиск

Поиск фрагментов памяти осуществляется через векторные эмбеддинги — введённый запрос сравнивается с сохранёнными фрагментами по косинусному сходству.`,
      en: `# Session Memory

Session memory preserves key moments of dialogue for contextual enrichment of future queries.

## How It Works

1. During conversation, the system extracts important fragments
2. Fragments are split into chunks and saved with embeddings
3. For new queries — semantic search across saved fragments
4. Most relevant fragments are injected into model context

## Chunk Types

- **Fact** — specific information from dialogue
- **Decision** — a decision or agreement made
- **Task** — an assigned task
- **Insight** — an important observation

## Management

The application header contains the **MemoryControls** indicator:
- 🧠 **Badge** — session memory fragment count
- 📖 **Knowledge badge** — total domain knowledge chunk count with detailed per-role tooltip
- 🔄 **Refresh** — manual memory update
- ⚙️ **Settings** — quick link to memory settings

## SessionMemoryDialog

The memory management dialog allows:
- Viewing all saved fragments
- Deleting outdated ones
- Filtering by chunk type + special "Duplicates" filter

### Duplicate Detection

The system automatically identifies duplicate fragments via text normalization. When the "Duplicates" filter is active, a mass deletion button appears.

> [!TIP] Duplicate Deletion Logic
> During mass deletion, the oldest fragment in each group (by \`created_at\`) is preserved, and remaining copies are removed.

> [!CAUTION] Two-Step Confirmation
> "Clear All" and "Delete Duplicates" buttons require a second press to confirm. A "Cancel" button allows resetting the confirmation state.

### Semantic Search

Memory fragment search is performed via vector embeddings — the entered query is compared against saved fragments by cosine similarity.`,
    },
  },
  {
    id: 'web-search',
    titleKey: 'hydrapedia.sections.webSearch',
    icon: 'Star',
    content: {
      ru: `# Веб-поиск

Интегрированный веб-поиск позволяет ИИ-ролям находить актуальную информацию в интернете.

## Провайдеры поиска

| Провайдер | Особенности |
|-----------|-------------|
| **Tavily** | По умолчанию (1000 запросов/мес системный лимит) |
| **Perplexity** | Sonar API — глубокий поиск с суммаризацией |
| **Brave Search** | Только BYOK (региональные ограничения) |

## Режимы

- **Одиночный** — поиск через один провайдер
- **Оба** — параллельный поиск через два провайдера с объединением результатов

## BYOK (Bring Your Own Key)

Персональные API-ключи имеют **приоритет** над системными:
1. Перейдите в **Профиль → API-ключи → Веб-поиск**
2. Добавьте ключ нужного провайдера
3. Система автоматически переключится на ваш ключ

> ⚠️ Если персональный ключ не настроен — используется системный Tavily (с общим лимитом).

## Настройка провайдера

В настройках каждой модели можно выбрать:
- Провайдер поиска (Tavily / Perplexity / Brave / Оба)
- Включить/выключить веб-поиск для конкретной роли

## Роль Веб-хантер

\`@webhunter\` — специализированная роль для поиска информации в интернете. Автоматически использует инструмент \`web_search\` и оптимизирует запросы для получения максимально релевантных результатов.`,
      en: `# Web Search

Integrated web search allows AI roles to find current information on the internet.

## Search Providers

| Provider | Features |
|----------|----------|
| **Tavily** | Default (1000 requests/month system limit) |
| **Perplexity** | Sonar API — deep search with summarization |
| **Brave Search** | BYOK only (regional restrictions) |

## Modes

- **Single** — search via one provider
- **Both** — parallel search via two providers with merged results

## BYOK (Bring Your Own Key)

Personal API keys take **priority** over system keys:
1. Go to **Profile → API Keys → Web Search**
2. Add the desired provider's key
3. The system will automatically switch to your key

> ⚠️ If no personal key is configured, the system Tavily key is used (with shared limits).

## Provider Settings

In each model's settings you can choose:
- Search provider (Tavily / Perplexity / Brave / Both)
- Enable/disable web search for a specific role

## Web Hunter Role

\`@webhunter\` — a specialized role for internet information search. Automatically uses the \`web_search\` tool and optimizes queries for maximum relevance.`,
    },
  },
  {
    id: 'roleMemory',
    titleKey: 'hydrapedia.sections.roleMemory',
    icon: 'BrainCircuit',
    content: {
      ru: `# Ролевая память

Ролевая память — механизм накопления долгосрочного опыта техническими ролями между сессиями. В отличие от сессионной памяти, ролевая память сохраняется навсегда и привязана к конкретной роли.

## Что сохраняется

| Тип | Пример |
|-----|--------|
| Предпочтения | «Пользователь предпочитает TypeScript» |
| Навыки | «Хорошо работает запрос через few-shot prompting» |
| Ошибки | «Модель X плохо справляется с задачами типа Y» |
| Успехи | «Стратегия Z дала наилучший результат» |

## Семантический поиск

Для поиска релевантного опыта используются **векторные эмбеддинги** (модель \`text-embedding-3-small\`):

1. При получении нового запроса система генерирует эмбеддинг
2. Производится поиск похожих воспоминаний по косинусному сходству
3. Наиболее релевантные воспоминания (сходство > 0.3) внедряются в контекст

## Отличия от сессионной памяти

| Параметр | Сессионная память | Ролевая память |
|----------|-------------------|----------------|
| Привязка | К сессии | К роли |
| Время жизни | На время сессии | Навсегда |
| Объём | Десятки фрагментов | Сотни |
| Обновление | Автоматическое | Через техника или вручную |

## Где посмотреть

- **Штат → выберите роль → вкладка «Память»** — просмотр и управление воспоминаниями
- **MemoryControls** в хедере — общая статистика`,
      en: `# Role Memory

Role Memory — a mechanism for accumulating long-term experience by technical roles between sessions. Unlike session memory, role memory is persisted permanently and bound to a specific role.

## What Gets Saved

| Type | Example |
|------|---------|
| Preferences | "User prefers TypeScript" |
| Skills | "Few-shot prompting works well for this query" |
| Mistakes | "Model X performs poorly on tasks of type Y" |
| Successes | "Strategy Z produced the best result" |

## Semantic Search

**Vector embeddings** (model \`text-embedding-3-small\`) are used to find relevant experience:

1. When a new query arrives, the system generates an embedding
2. Similar memories are searched by cosine similarity
3. Most relevant memories (similarity > 0.3) are injected into context

## Differences from Session Memory

| Parameter | Session Memory | Role Memory |
|-----------|---------------|-------------|
| Binding | To session | To role |
| Lifetime | Session duration | Permanent |
| Volume | Tens of fragments | Hundreds |
| Update | Automatic | Via technician or manually |

## Where to View

- **Staff → select role → "Memory" tab** — view and manage memories
- **MemoryControls** in header — overall statistics`,
    },
  },
];
