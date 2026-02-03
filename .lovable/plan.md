
# План: Синхронизация табеля о рангах с базой данных

## Обзор
Реализуем двустороннюю синхронизацию данных иерархии ролей между страницей **Штат специалистов** и таблицей `role_behaviors` в базе данных. При выборе роли будут загружаться существующие настройки взаимодействий, а при редактировании — сохраняться обратно.

## Текущая ситуация
- Таблица `role_behaviors` уже содержит системные записи для каждой роли с полем `interactions` (JSONB)
- `RoleHierarchyEditor` компонент уже используется в обоих местах (StaffRoles и BehaviorEditorDialog)
- Страница `RoleDetailsPanel` сбрасывает `interactions` в пустой объект при смене роли
- Нет механизма загрузки существующих настроек из БД

## План реализации

### 1. Создание хука `useRoleBehavior`
Создать специализированный хук для работы с поведением конкретной роли:

**Файл:** `src/hooks/useRoleBehavior.ts`

Функциональность:
- Загрузка `role_behaviors` для выбранной роли при её изменении
- Приоритет: пользовательское поведение → системное поведение
- Функция сохранения/обновления записи
- Состояния загрузки и сохранения

### 2. Интеграция в RoleDetailsPanel
Обновить `src/components/staff/RoleDetailsPanel.tsx`:

- Использовать новый хук `useRoleBehavior` для выбранной роли
- При загрузке роли — заполнять `interactions` данными из БД
- При нажатии кнопки "Сохранить" — вызывать функцию сохранения хука
- Добавить индикатор загрузки при получении данных
- Показать toast-уведомление при успешном сохранении

### 3. Логика сохранения
При сохранении иерархии из Штатного расписания:

1. Если у пользователя уже есть кастомное поведение для роли — обновить его
2. Если нет — создать новую запись `role_behaviors` (не системную)
3. Обновить только поле `interactions`, сохраняя остальные настройки (communication, reactions)

### 4. Обновление списка паттернов
После сохранения в Штатном расписании:
- Вызвать `refetch` из `usePatterns` для синхронизации списка на странице Паттерны поведения

---

## Технические детали

### Структура хука useRoleBehavior

```typescript
interface UseRoleBehaviorResult {
  behavior: RoleBehavior | null;
  isLoading: boolean;
  isSaving: boolean;
  saveInteractions: (interactions: RoleInteractions) => Promise<void>;
}

function useRoleBehavior(role: AgentRole | null): UseRoleBehaviorResult
```

### Логика приоритета загрузки
1. Ищем записи где `role = selectedRole`
2. Сортируем: сначала `is_system = false` (пользовательские), потом системные
3. Берём первую запись

### SQL-запрос для загрузки
```sql
SELECT * FROM role_behaviors 
WHERE role = $1 
  AND (user_id = $userId OR is_system = true OR is_shared = true)
ORDER BY 
  CASE WHEN user_id = $userId THEN 0 ELSE 1 END,
  is_system ASC
LIMIT 1
```

### Изменения в RoleDetailsPanel

```typescript
// Добавить импорт хука
import { useRoleBehavior } from '@/hooks/useRoleBehavior';

// Использовать хук
const { behavior, isLoading: isLoadingBehavior, isSaving, saveInteractions } = useRoleBehavior(selectedRole);

// Синхронизировать interactions при загрузке
useEffect(() => {
  if (behavior?.interactions) {
    setInteractions(behavior.interactions);
  }
}, [behavior]);

// Обновить кнопку сохранения
const handleSaveHierarchy = async () => {
  await saveInteractions(interactions);
  setIsEditingHierarchy(false);
  toast.success(t('staffRoles.hierarchy.saved'));
};
```

---

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/hooks/useRoleBehavior.ts` | Создать |
| `src/components/staff/RoleDetailsPanel.tsx` | Обновить |
| `src/contexts/LanguageContext.tsx` | Добавить переводы |

## Переводы для добавления

```typescript
'staffRoles.hierarchy.saved': {
  ru: 'Иерархия сохранена',
  en: 'Hierarchy saved',
},
'staffRoles.hierarchy.loading': {
  ru: 'Загрузка настроек...',
  en: 'Loading settings...',
},
```
