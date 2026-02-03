
# План: Добавление раздела "Паттерны поведения"

## Обзор

Добавляем новый пункт меню **"Паттерны поведения"** (`/behavioral-patterns`) с двухпанельным интерфейсом по аналогии со **"Штат специалистов"** (`/staff-roles`). Это первый шаг к реализации модуля паттернов из стратегического плана.

## Структура интерфейса

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Паттерны поведения                                                     │
│  Шаблоны логики решения задач и поведенческие модели AI-ролей           │
├────────────────────────────┬────────────────────────────────────────────┤
│  Левая панель (35%)        │  Правая панель (65%)                       │
│  ┌──────────────────────┐  │  ┌──────────────────────────────────────┐  │
│  │ ▼ Стратегические     │  │  │ [Иконка]  Lovable Project Manager   │  │
│  │   паттерны       (3) │  │  │                                      │  │
│  │   ┌────────────────┐ │  │  │ Категория: Planning                  │  │
│  │   │ Lovable PM     │ │  │  │                                      │  │
│  │   │ Генеральный    │ │  │  │ Описание:                            │  │
│  │   │ Соавтор        │ │  │  │ Пошаговое планирование проектов...   │  │
│  │   │ Тех. аудит     │ │  │  │                                      │  │
│  │   └────────────────┘ │  │  │ ─────────────────────────────────    │  │
│  │                      │  │  │                                      │  │
│  │ ▼ Ролевые паттерны   │  │  │ Этапы:                               │  │
│  │              (11)    │  │  │ 1. Анализ требований (Advisor)       │  │
│  │   ┌────────────────┐ │  │  │ 2. Декомпозиция (Analyst)            │  │
│  │   │ Critic         │ │  │  │ 3. Формирование запросов (PE)        │  │
│  │   │ Arbiter        │ │  │  │                                      │  │
│  │   │ Consultant     │ │  │  │ [Открыть в Flow Editor]              │  │
│  │   │ ...            │ │  │  └──────────────────────────────────────┘  │
│  │   └────────────────┘ │  │                                            │
│  └──────────────────────┘  │                                            │
└────────────────────────────┴────────────────────────────────────────────┘
```

## Создаваемые файлы

### 1. Страница `/src/pages/BehavioralPatterns.tsx`
Основная страница с двухпанельным `ResizablePanelGroup`:
- Левая панель: таблица паттернов, сгруппированных по типу (стратегические/ролевые) со сворачиваемыми секциями
- Правая панель: детальный просмотр выбранного паттерна

### 2. Панель деталей `/src/components/patterns/PatternDetailsPanel.tsx`
Отображает информацию о выбранном паттерне:
- **Для стратегических (Task Blueprints)**: название, категория, описание, этапы с ролями, контрольные точки, кнопка "Открыть в Flow Editor"
- **Для ролевых (Role Behaviors)**: роль, стиль коммуникации, реакции на триггеры, взаимодействия с другими ролями

### 3. Типы `/src/types/patterns.ts`
```typescript
// Стратегический паттерн (из plan.md)
interface TaskBlueprint {
  id: string;
  name: string;
  category: 'planning' | 'creative' | 'analysis' | 'technical';
  description: string;
  stages: Array<{
    name: string;
    roles: MessageRole[];
    objective: string;
    deliverables: string[];
  }>;
  checkpoints: Array<{
    after_stage: number;
    condition: string;
  }>;
}

// Ролевой паттерн
interface RoleBehavior {
  role: MessageRole;
  communication: {
    tone: 'formal' | 'friendly' | 'neutral' | 'provocative';
    verbosity: 'concise' | 'detailed' | 'adaptive';
    format_preference: string[];
  };
  reactions: Array<{
    trigger: string;
    behavior: string;
  }>;
  interactions: {
    defers_to: MessageRole[];
    challenges: MessageRole[];
    collaborates: MessageRole[];
  };
}
```

### 4. Начальные данные `/src/config/patterns.ts`
Предустановленные паттерны на основе стратегического плана:
- **Стратегические**: "Lovable Project Manager", "Генеральный Соавтор", "Технический аудит"
- **Ролевые**: паттерны для каждой из 11 ролей (Critic, Arbiter, Consultant и т.д.)

## Изменения в существующих файлах

### 1. `src/App.tsx`
- Добавить lazy-импорт: `const BehavioralPatterns = lazy(() => import("./pages/BehavioralPatterns"));`
- Добавить маршрут: `<Route path="/behavioral-patterns" element={<BehavioralPatterns />} />`

### 2. `src/components/layout/AppSidebar.tsx`
- Добавить иконку `Sparkles` из lucide-react (символизирует паттерны/шаблоны)
- Добавить пункт меню между "Штат специалистов" и "Панель экспертов":
  ```typescript
  { path: '/behavioral-patterns', icon: Sparkles, label: t('nav.behavioralPatterns') }
  ```

### 3. `src/contexts/LanguageContext.tsx`
Добавить локализацию:
```typescript
// Navigation
'nav.behavioralPatterns': { ru: 'Паттерны поведения', en: 'Behavioral Patterns' },

// Behavioral Patterns page
'patterns.description': { ru: 'Шаблоны логики решения задач и поведенческие модели AI-ролей', en: 'Task-solving logic templates and AI role behavioral models' },
'patterns.strategicGroup': { ru: 'Стратегические паттерны', en: 'Strategic Patterns' },
'patterns.roleGroup': { ru: 'Ролевые паттерны', en: 'Role Patterns' },
'patterns.selectPattern': { ru: 'Выберите паттерн для просмотра деталей', en: 'Select a pattern to view details' },
'patterns.category': { ru: 'Категория', en: 'Category' },
'patterns.stages': { ru: 'Этапы', en: 'Stages' },
'patterns.checkpoints': { ru: 'Контрольные точки', en: 'Checkpoints' },
'patterns.openInFlowEditor': { ru: 'Открыть в редакторе потоков', en: 'Open in Flow Editor' },
'patterns.communication': { ru: 'Стиль коммуникации', en: 'Communication Style' },
'patterns.reactions': { ru: 'Реакции', en: 'Reactions' },
'patterns.interactions': { ru: 'Взаимодействия', en: 'Interactions' },
// ... и другие ключи
```

## Техническая реализация

### Архитектура компонентов
```text
BehavioralPatterns (page)
├── ResizablePanelGroup
│   ├── ResizablePanel (left, 35%)
│   │   └── Table с группировкой
│   │       ├── Collapsible: Стратегические паттерны
│   │       │   └── PatternRow (TaskBlueprint)
│   │       └── Collapsible: Ролевые паттерны
│   │           └── PatternRow (RoleBehavior)
│   │
│   └── ResizablePanel (right, 65%)
│       └── PatternDetailsPanel
│           ├── if TaskBlueprint → TaskBlueprintDetails
│           └── if RoleBehavior → RoleBehaviorDetails
```

### UI-паттерны (из StaffRoles)
- `ResizablePanelGroup` с `ResizableHandle withHandle`
- Сворачиваемые группы с `ChevronDown`/`ChevronRight`
- Выделение выбранной строки через `bg-primary/10`
- Детальная панель с `ScrollArea` и секциями через `Separator`

### Иконки и цвета
- Стратегические паттерны: `Target` (цель) — `text-hydra-arbiter`
- Ролевые паттерны: используют иконку и цвет соответствующей роли из `ROLE_CONFIG`

## Структура файлов после реализации

```text
src/
├── pages/
│   └── BehavioralPatterns.tsx      # Новая страница
├── components/
│   └── patterns/
│       ├── PatternDetailsPanel.tsx  # Правая панель деталей
│       └── TaskBlueprintDetails.tsx # Детали стратегического паттерна (опционально)
├── config/
│   └── patterns.ts                  # Предустановленные паттерны
└── types/
    └── patterns.ts                  # Типы TaskBlueprint, RoleBehavior
```

## Следующие шаги (после утверждения)

1. **Интеграция с БД**: создание таблиц `task_blueprints` и `role_behaviors` для пользовательских паттернов
2. **Редактирование**: UI для создания/редактирования паттернов (аналог редактора промптов)
3. **Flow Editor интеграция**: кнопка "Открыть в Flow Editor" генерирует диаграмму из TaskBlueprint
4. **Применение в сессиях**: выбор стратегического паттерна при создании сессии в Expert Panel
