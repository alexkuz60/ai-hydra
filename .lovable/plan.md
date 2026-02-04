
# План: Мини-словари для редактора ролевых паттернов

## Цель
Упростить создание пользовательских паттернов поведения AI-ролей через систему предзаполненных комбо-списков с возможностью поиска и опцией «Другое».

## Архитектура решения

### Фаза 1: Создание словарей конфигурации

**Новый файл: `src/config/behaviorDictionaries.ts`**

Структура записи словаря:
```text
interface DictionaryEntry {
  key: string;           // Технический ключ (например: "deadlock")
  label: {               // Человекочитаемая метка
    ru: string;          // "Тупик в дискуссии"
    en: string;          // "Deadlock"
  };
  description?: {        // Опциональное описание
    ru: string;
    en: string;
  };
  category?: string;     // Группировка (dialogue, data, quality, process)
}
```

**Словарь триггеров (TRIGGER_DICTIONARY)**
Извлечено из существующих паттернов в `config/patterns.ts`:

| Категория | Ключ | RU | EN |
|-----------|------|----|----|
| Диалог | `unclear_question` | Неясный вопрос | Unclear question |
| Диалог | `complex_topic` | Сложная тема | Complex topic |
| Диалог | `vague_request` | Размытый запрос | Vague request |
| Диалог | `off_topic` | Отклонение от темы | Off topic |
| Диалог | `long_discussion` | Затянувшееся обсуждение | Long discussion |
| Диалог | `tension` | Напряжённость | Tension |
| Качество | `weak_argument` | Слабый аргумент | Weak argument |
| Качество | `missing_evidence` | Отсутствие доказательств | Missing evidence |
| Качество | `overconfidence` | Чрезмерная уверенность | Overconfidence |
| Качество | `bad_prompt` | Плохой промпт | Bad prompt |
| Решения | `conflict` | Конфликт мнений | Conflict |
| Решения | `consensus` | Достигнут консенсус | Consensus reached |
| Решения | `deadlock` | Тупик | Deadlock |
| Решения | `decision_needed` | Требуется решение | Decision needed |
| Данные | `data_available` | Данные доступны | Data available |
| Данные | `pattern_detected` | Обнаружен паттерн | Pattern detected |
| Данные | `anomaly` | Аномалия | Anomaly |
| Данные | `search_request` | Поисковый запрос | Search request |
| Процесс | `code_request` | Запрос кода | Code request |
| Процесс | `new_task` | Новая задача | New task |
| Процесс | `optimization_request` | Запрос оптимизации | Optimization request |
| Процесс | `bottleneck` | Узкое место | Bottleneck |
| Процесс | `complex_process` | Сложный процесс | Complex process |

**Словарь поведений (BEHAVIOR_DICTIONARY)**

| Ключ | RU | EN |
|------|----|----|
| `ask_clarification` | Запросить уточнение | Ask for clarification |
| `structure_response` | Структурировать ответ | Structure the response |
| `provide_code` | Предоставить код с комментариями | Provide code with comments |
| `point_logical_errors` | Указать на логические ошибки | Point out logical errors |
| `demand_justification` | Потребовать обоснование | Demand justification |
| `give_counterexamples` | Привести контрпримеры | Give counterexamples |
| `synthesize_views` | Синтезировать точки зрения | Synthesize viewpoints |
| `reinforce_consensus` | Зафиксировать консенсус | Reinforce consensus |
| `suggest_compromise` | Предложить компромисс | Suggest compromise |
| `deep_expert_answer` | Глубокий экспертный ответ | Deep expert answer |
| `conduct_interview` | Провести интервью | Conduct interview |
| `offer_options` | Предложить варианты с оценкой | Offer evaluated options |
| `redirect_to_topic` | Вернуть к теме | Redirect to topic |
| `summarize_interim` | Подвести промежуточные итоги | Summarize interim results |
| `de_escalate` | Деэскалировать | De-escalate |
| `long_term_perspective` | Долгосрочная перспектива | Long-term perspective |
| `warn_consequences` | Предупредить о последствиях | Warn about consequences |
| `highlight_potential` | Подсветить потенциал | Highlight potential |
| `find_relevant_info` | Найти релевантную информацию | Find relevant information |
| `systematize_materials` | Систематизировать материалы | Systematize materials |
| `provide_archive_context` | Контекст из архива | Provide archive context |
| `statistical_analysis` | Статистический анализ | Statistical analysis |
| `describe_pattern` | Описать закономерность | Describe pattern |
| `investigate_anomaly` | Исследовать отклонение | Investigate anomaly |
| `formulate_queries` | Сформулировать запросы | Formulate queries |
| `evaluate_sources` | Оценить достоверность источников | Evaluate source credibility |
| `suggest_alternatives` | Предложить альтернативы | Suggest alternatives |
| `explain_improve_prompt` | Объяснить и улучшить промпт | Explain and improve prompt |
| `create_optimized_prompt` | Создать оптимизированный промпт | Create optimized prompt |
| `ab_analysis` | A/B анализ вариантов | A/B variant analysis |
| `design_flow_diagram` | Спроектировать flow-диаграмму | Design flow diagram |
| `optimize_route` | Оптимизировать маршрут | Optimize route |
| `create_pipeline` | Создать архитектуру потока | Create pipeline architecture |

**Словарь форматов (FORMAT_DICTIONARY)**

| Ключ | RU | EN |
|------|----|----|
| `markdown` | Markdown | Markdown |
| `lists` | Списки | Lists |
| `numbered_lists` | Нумерованные списки | Numbered lists |
| `code_blocks` | Блоки кода | Code blocks |
| `tables` | Таблицы | Tables |
| `quotes` | Цитаты | Quotes |
| `counterarguments` | Контраргументы | Counterarguments |
| `structured_summary` | Структурированная сводка | Structured summary |
| `pros_cons` | За и Против | Pros & Cons |
| `verdict` | Вердикт | Verdict |
| `analysis` | Анализ | Analysis |
| `recommendations` | Рекомендации | Recommendations |
| `alternatives` | Альтернативы | Alternatives |
| `status_updates` | Статусы | Status updates |
| `action_items` | Пункты действий | Action items |
| `summaries` | Сводки | Summaries |
| `strategic_view` | Стратегический взгляд | Strategic view |
| `consequences` | Последствия | Consequences |
| `references` | Ссылки | References |
| `structured_data` | Структурированные данные | Structured data |
| `indexes` | Индексы | Indexes |
| `data_tables` | Таблицы данных | Data tables |
| `charts_desc` | Описания графиков | Charts description |
| `insights` | Инсайты | Insights |
| `links` | Ссылки URL | URL links |
| `source_evaluation` | Оценка источников | Source evaluation |
| `prompt_templates` | Шаблоны промптов | Prompt templates |
| `before_after` | До/После | Before/After |
| `explanations` | Объяснения | Explanations |
| `diagrams` | Диаграммы | Diagrams |
| `flow_descriptions` | Описания потоков | Flow descriptions |
| `optimization_tips` | Советы по оптимизации | Optimization tips |

---

### Фаза 2: UI-компонент Combobox с поиском

**Новый компонент: `src/components/ui/DictionaryCombobox.tsx`**

Функциональность:
- Поле ввода с поиском по словарю
- Выпадающий список с группировкой по категориям (для триггеров)
- Опция «Другое...» в конце списка для свободного ввода
- Поддержка локализации (RU/EN)
- Показ описания при наведении (tooltip)

Используемые компоненты: `Popover`, `Command`, `CommandInput`, `CommandList`, `CommandItem`, `CommandGroup`

---

### Фаза 3: Интеграция в BehaviorEditorDialog

**Изменения в `src/components/patterns/BehaviorEditorDialog.tsx`:**

1. **Секция «Реакции»** (строки 362-389):
   - Заменить `<Input>` для триггера на `<DictionaryCombobox dictionary={TRIGGER_DICTIONARY} />`
   - Заменить `<Input>` для поведения на `<DictionaryCombobox dictionary={BEHAVIOR_DICTIONARY} />`

2. **Секция «Предпочтения формата»** (строки 342-349):
   - Заменить `<Input>` на `<DictionaryMultiSelect dictionary={FORMAT_DICTIONARY} />`
   - Множественный выбор тегов с возможностью удаления

---

### Фаза 4: Обновление локализации

**Изменения в `src/contexts/LanguageContext.tsx`:**

Добавить новые ключи:
- `patterns.dictionary.triggers` — заголовок группы триггеров
- `patterns.dictionary.behaviors` — заголовок группы поведений
- `patterns.dictionary.formats` — заголовок группы форматов
- `patterns.dictionary.other` — «Другое...»
- `patterns.dictionary.customValue` — «Свой вариант»
- `patterns.dictionary.searchPlaceholder` — «Поиск...»
- Категории триггеров: `dialogue`, `quality`, `decisions`, `data`, `process`

---

## Структура файлов

```text
src/config/
  +-- behaviorDictionaries.ts    <-- НОВЫЙ: словари триггеров, поведений, форматов

src/components/ui/
  +-- DictionaryCombobox.tsx     <-- НОВЫЙ: комбо-бокс со словарём
  +-- DictionaryMultiSelect.tsx  <-- НОВЫЙ: мультиселект для форматов (опционально)

src/components/patterns/
    BehaviorEditorDialog.tsx     <-- ИЗМЕНЕНИЯ: интеграция комбо-боксов

src/contexts/
    LanguageContext.tsx          <-- ИЗМЕНЕНИЯ: новые ключи локализации
```

---

## Технические детали

### Типы данных

```typescript
// src/config/behaviorDictionaries.ts

export interface DictionaryEntry {
  key: string;
  label: { ru: string; en: string };
  description?: { ru: string; en: string };
  category?: string;
}

export interface Dictionary {
  entries: DictionaryEntry[];
  categories?: { key: string; label: { ru: string; en: string } }[];
}
```

### Компонент DictionaryCombobox

```text
Props:
  - dictionary: Dictionary
  - value: string
  - onChange: (value: string) => void
  - placeholder?: string
  - allowCustom?: boolean (default: true)

Поведение:
  1. При фокусе показывает выпадающий список
  2. Поиск фильтрует по label (RU/EN) и key
  3. При выборе записи — сохраняется key
  4. «Другое...» переключает на режим свободного ввода
  5. Показывает текущее значение по label, если найдено в словаре
```

---

## Преимущества

- **UX**: Пользователь видит понятные описания вместо технических ключей
- **Консистентность**: Единообразие триггеров и поведений между ролями
- **Локализация**: Полная поддержка RU/EN
- **Расширяемость**: Опция «Другое» для нестандартных случаев
- **Аналитика**: Стандартные ключи позволят анализировать паттерны использования

---

## Последовательность реализации

1. Создать `src/config/behaviorDictionaries.ts` со всеми словарями
2. Создать `src/components/ui/DictionaryCombobox.tsx`
3. Добавить локализацию в `LanguageContext.tsx`
4. Интегрировать комбо-боксы в `BehaviorEditorDialog.tsx`
5. Протестировать создание и редактирование паттернов
