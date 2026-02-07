

# Апгрейд ресайза навигаторов всех UI-панелей Гидры

## Обзор

Проект содержит 7 страниц с навигационными панелями (левые сайдбары), которые нужно привести к единому стандарту min/max ресайза с расширенными тултипами и фоновым градиентом.

## Инвентарь навигаторов

| Страница | Тип навигатора | Текущий min/max | Ресайз |
|----------|---------------|-----------------|--------|
| Expert Panel | ChatTreeNav (ResizablePanel) | 15% / 35% | Есть |
| Staff Roles | Table-список (ResizablePanel) | 20% / 50% | Есть |
| Behavioral Patterns | Table-список (ResizablePanel) | 20% / 50% | Есть |
| Tasks | Table-список (ResizablePanel) | 30% / 60% | Есть |
| Tools Library | Table-список (ResizablePanel) | 30% / 60% | Есть |
| Role Library (Prompts) | Table-список (ResizablePanel) | 30% / 60% | Есть |

## Техническое решение

### 1. Общий хук `useNavigatorResize`

Создать `src/hooks/useNavigatorResize.ts` -- единый хук для управления состоянием min/max навигатора:

- Хранит текущий режим (`min` / `max`) в localStorage с уникальным ключом на страницу
- `min` = фиксированная узкая ширина (~56-64px), достаточная только для иконок
- `max` = авто-ширина, рассчитываемая по самому длинному элементу (через `ref` + `scrollWidth`) с разумным потолком
- Экспортирует `isMinimized`, `toggle()`, `panelSize` (в % для ResizablePanel)

### 2. Режим MIN (свернутый навигатор)

Во всех навигаторах при `isMinimized = true`:
- Отображаются только иконки элементов
- Тултипы заменяются на мини-карточки (используя `TooltipContent` с кастомным содержимым):

```text
+---------------------------+
| [Icon] Название элемента  |
|---------------------------|
| * Краткое описание 1      |
| * Краткое описание 2      |
| * Краткое описание 3      |
+---------------------------+
```

- Для ChatTreeNav: иконка роли + превью запроса в тултипе
- Для Staff Roles: иконка роли + имя + тип (эксперт/техник)
- Для Tools/Patterns: иконка категории + название + тип

### 3. Режим MAX (развернутый навигатор)

- Размер панели авто-подстраивается, чтобы полностью отобразить самый длинный элемент
- Тултипы только для иконок инструментов (кнопки действий) -- показывают название инструмента
- Пульсирующий индикатор несохраненных изменений:
  - Маленький кружок с анимацией `pulse-glow` рядом с названием элемента в навигаторе
  - Условие: правая панель содержит несохраненные изменения для данного элемента
  - Используется существующий `useUnsavedChanges` для определения состояния

### 4. Кнопка Min/Max в хедере навигатора

- Добавить `IconButtonWithTooltip` с иконками `PanelLeftClose` / `PanelLeftOpen` (lucide) в заголовок каждого навигатора
- При клике переключает режим min/max через хук
- Для страниц без хедера навигатора (Flow Editor) -- добавить компактный хедер

### 5. Градиентный фон навигаторов

Добавить CSS-класс `hydra-nav-surface` в `index.css`:

- Темная тема: градиент от `--sidebar-background` (HSL 220 20% 10%) к `--card` (HSL 225 30% 12%) -- плавный переход от главного меню к рабочей области
- Светлая тема: градиент от `--sidebar-background` к `--hydra-surface` (HSL 45 15% 90%)
- Направление: слева направо (`bg-gradient-to-r`)
- Применяется ко всем левым навигаторам вместо текущего `bg-card`, `bg-sidebar` и т.д.

### 6. Конвертация фиксированных навигаторов в ResizablePanel

**FlowSidebar**: Обернуть в `ResizablePanel` внутри `FlowEditor.tsx` вместо фиксированной ширины `w-56`. В min-режиме показывать только иконки узлов с тултипами-карточками (иконка + название + категория).

## Порядок реализации

1. Создать хук `useNavigatorResize` и CSS-класс `hydra-nav-surface`
2. Создать общий компонент `NavigatorHeader` с кнопкой min/max
3. Интегрировать в Expert Panel (ChatTreeNav) -- самый сложный кейс
4. Интегрировать в Staff Roles, Behavioral Patterns, Tasks
5. Интегрировать в Tools Library, Role Library
6. Конвертировать FlowSidebar и Hydrapedia sidebar
7. Добавить пульсирующий индикатор несохраненных изменений

## Новые файлы

- `src/hooks/useNavigatorResize.ts`
- `src/components/layout/NavigatorHeader.tsx`

## Изменяемые файлы

- `src/index.css` (градиентный класс)
- `src/pages/ExpertPanel.tsx`
- `src/pages/StaffRoles.tsx`
- `src/pages/BehavioralPatterns.tsx`
- `src/pages/Tasks.tsx`
- `src/pages/ToolsLibrary.tsx`
- `src/pages/RoleLibrary.tsx`
- `src/pages/FlowEditor.tsx`
- `src/components/flow/FlowSidebar.tsx`
- `src/components/warroom/ChatTreeNav.tsx`

