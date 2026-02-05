

# План: Унификация UX для Библиотеки промптов и Задач

## Текущее состояние

Проанализированы 5 страниц проекта:

| Страница | Архитектура | UI-паттерн |
|----------|-------------|------------|
| **Штат** (`StaffRoles`) | ResizablePanel + Table + DetailsPanel | Master-detail с коллапсом групп |
| **Паттерны** (`BehavioralPatterns`) | ResizablePanel + Table + DetailsPanel/Editor | Master-detail с inline-редактированием |
| **Инструментарий** (`ToolsLibrary`) | ResizablePanel + Table + DetailsPanel/Editor | Master-detail с категориями и фильтрами |
| **Библиотека промптов** (`RoleLibrary`) | HydraCard-список + Sheet для редактирования | Карточки без деталь-панели |
| **Задачи** (`Tasks`) | HydraCard-список + Sheet для конфигурации | Карточки без деталь-панели |

## Цель

Привести **Библиотеку промптов** и **Задачи** к единому UX-паттерну:
- `ResizablePanelGroup` (левая панель 35-40%, правая 60-65%)
- Левая панель: таблица/список с группировкой и коллапсом
- Правая панель: детали выбранного элемента или редактор
- Защита несохранённых изменений (`useUnsavedChanges`)
- Inline-редактирование вместо Sheet-диалогов

---

## Часть 1: Библиотека промптов (RoleLibrary)

### Изменения в структуре

1. **Создать компоненты** (аналогично `ToolRow`, `ToolDetailsPanel`, `ToolEditor`):
   - `src/components/prompts/PromptRow.tsx` — строка таблицы для промпта
   - `src/components/prompts/PromptDetailsPanel.tsx` — панель просмотра деталей
   - `src/components/prompts/PromptEditor.tsx` — форма редактирования

2. **Создать хук** `src/hooks/usePromptsCRUD.ts`:
   - CRUD-операции для промптов
   - Вызов RPC `get_prompt_library_safe`
   - Состояние `loading`, `saving`, `prompts`

3. **Переработать страницу** `RoleLibrary.tsx`:
   - Заменить HydraCard-список на `ResizablePanelGroup`
   - Левая панель: Table с группировкой по языку (RU/EN) или роли
   - Правая панель: `PromptDetailsPanel` (просмотр) или `PromptEditor` (редактирование)
   - Удалить Sheet-диалоги
   - Добавить `UnsavedChangesDialog`

### Группировка промптов

Промпты будут сгруппированы в коллапсируемые секции:
- **По языку**: RU, EN, Auto
- **Подгруппа**: Системные (is_default) vs Пользовательские

---

## Часть 2: Задачи (Tasks)

### Изменения в структуре

1. **Создать компоненты**:
   - `src/components/tasks/TaskRow.tsx` — строка таблицы для задачи
   - `src/components/tasks/TaskDetailsPanel.tsx` — панель конфигурации задачи

2. **Переработать страницу** `Tasks.tsx`:
   - Заменить карточки на `ResizablePanelGroup`
   - Левая панель: список задач в виде таблицы
   - Правая панель: конфигурация задачи (модели, настройки) — текущий контент Sheet
   - Кнопка "Открыть" для навигации в ExpertPanel

### Структура левой панели

Задачи будут отображаться в простой таблице:
- Иконка статуса (активная/архивная)
- Название задачи
- Количество моделей
- Дата обновления

Форма создания новой задачи останется в header или в правой панели при отсутствии выбранной задачи.

---

## Технические детали

### Общие компоненты для переиспользования

```text
┌─────────────────────────────────────────────────────────────┐
│  Header: заголовок + описание + кнопки                     │
├─────────────────────────────────────────────────────────────┤
│  ResizablePanelGroup                                        │
│  ┌─────────────────────┬───────────────────────────────────┐│
│  │ Left Panel (35%)    │ Right Panel (65%)                 ││
│  │ ┌─────────────────┐ │ ┌───────────────────────────────┐ ││
│  │ │ Filters         │ │ │ DetailsPanel / Editor         │ ││
│  │ ├─────────────────┤ │ │                               │ ││
│  │ │ Grouped Table   │ │ │                               │ ││
│  │ │ - Section 1 ▼   │ │ │                               │ ││
│  │ │   Row           │ │ │                               │ ││
│  │ │   Row           │ │ │                               │ ││
│  │ │ - Section 2 ▼   │ │ │                               │ ││
│  │ │   Row           │ │ │                               │ ││
│  │ └─────────────────┘ │ └───────────────────────────────┘ ││
│  └─────────────────────┴───────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Создаваемые файлы

**Библиотека промптов:**
- `src/hooks/usePromptsCRUD.ts`
- `src/components/prompts/PromptRow.tsx`
- `src/components/prompts/PromptDetailsPanel.tsx`
- `src/components/prompts/PromptEditor.tsx`
- Переработка `src/pages/RoleLibrary.tsx`

**Задачи:**
- `src/components/tasks/TaskRow.tsx`
- `src/components/tasks/TaskDetailsPanel.tsx`
- Переработка `src/pages/Tasks.tsx`

### Примерный план работ

1. Создать `usePromptsCRUD.ts` — извлечь логику из RoleLibrary
2. Создать `PromptRow.tsx` — отображение строки промпта
3. Создать `PromptDetailsPanel.tsx` — просмотр выбранного промпта
4. Создать `PromptEditor.tsx` — редактирование/создание
5. Переработать `RoleLibrary.tsx` под ResizablePanel-архитектуру
6. Создать `TaskRow.tsx` — строка задачи
7. Создать `TaskDetailsPanel.tsx` — конфигурация модели
8. Переработать `Tasks.tsx` под ResizablePanel-архитектуру

