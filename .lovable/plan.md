

## Цель
Добавить правую ресайз-панель на страницу «Штат специалистов» (`/staff-roles`) для отображения деталей выбранной роли: описание, системный промпт и чекбокс «Технический персонал».

---

## Обзор решения

При клике на строку таблицы справа раскрывается панель с подробной информацией о роли. Три роли (`promptengineer`, `flowregulator`, `archivist`) помечены как «технический персонал» — они не участвуют в коллегиальном обсуждении, а служат агентами-помощниками пользователя.

---

## Изменения

### 1. Расширение конфигурации ролей
**Файл:** `src/config/roles.ts`

- Добавить поле `description` в интерфейс `RoleConfigItem`
- Добавить поле `isTechnicalStaff: boolean` для обозначения технического персонала
- Обновить `ROLE_CONFIG` для всех 11 ролей с описаниями и флагом технического персонала
- Роли `promptengineer`, `flowregulator`, `archivist` получат `isTechnicalStaff: true`

### 2. Локализация
**Файл:** `src/contexts/LanguageContext.tsx`

Добавить переводы:
- `staffRoles.description.<role>` — описание каждой роли (RU/EN)
- `staffRoles.systemPrompt` — «Системный промпт по умолчанию»
- `staffRoles.technicalStaff` — «Технический персонал»
- `staffRoles.technicalStaffHint` — подсказка о том, что роль не участвует в коллегиальных обсуждениях
- `staffRoles.selectRole` — «Выберите роль для просмотра деталей»

### 3. Переделка страницы StaffRoles
**Файл:** `src/pages/StaffRoles.tsx`

- Обернуть содержимое в `ResizablePanelGroup` (как в ExpertPanel)
- Левая панель (20-40%): таблица ролей с возможностью выбора строки
- Правая панель (60-80%): детали выбранной роли
- Добавить состояние `selectedRole` для отслеживания выбранной роли
- При клике на строку — обновлять `selectedRole`

### 4. Создание компонента детальной панели
**Файл:** `src/components/staff/RoleDetailsPanel.tsx`

Содержимое панели:
- Иконка и название роли
- Бейдж «Технический персонал» (если применимо) с подсказкой
- Описание роли (локализованное)
- Системный промпт по умолчанию (из `DEFAULT_SYSTEM_PROMPTS`)
- Чекбокс «Технический персонал» (только для чтения, показывает статус)

---

## Структура компонентов

```text
StaffRoles.tsx
├── Layout
│   └── ResizablePanelGroup (horizontal)
│       ├── ResizablePanel (left, 20-40%)
│       │   └── Table (список ролей, кликабельные строки)
│       ├── ResizableHandle
│       └── ResizablePanel (right, 60-80%)
│           └── RoleDetailsPanel (детали выбранной роли)
```

---

## Техническая информация

### Изменения в `RoleConfigItem`
```typescript
export interface RoleConfigItem {
  icon: LucideIcon;
  color: string;
  label: string;
  description: string;      // ключ локализации для описания
  isTechnicalStaff: boolean; // флаг технического персонала
  bgClass?: string;
}
```

### Технический персонал (не участвует в экспертных обсуждениях)
| Роль | Назначение |
|------|------------|
| `promptengineer` | Создание и оптимизация промптов |
| `flowregulator` | Проектирование data-flow потоков |
| `archivist` | Управление библиотеками и эмбеддинг-памятью |

### Паттерн ресайз-панели
Используется проверенный паттерн из `ExpertPanel.tsx`:
- `ResizablePanelGroup` с `direction="horizontal"`
- `ResizableHandle withHandle` между панелями
- `minSize` / `maxSize` для ограничения размеров

