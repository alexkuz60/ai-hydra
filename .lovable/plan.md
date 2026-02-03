

# План: Автоматическая проверка и синхронизация табеля о рангах

## Проблема

При редактировании иерархии ролей могут возникать логические противоречия:

| Роль A устанавливает | Роль B имеет | Противоречие |
|---------------------|--------------|--------------|
| A → defers_to: [B] (B начальник) | B → collaborates: [A] (A коллега) | B считает A коллегой, а A считает B начальником |
| A → challenges: [B] (B подчинённый) | B → defers_to: [A] (A начальник) | ✅ Симметрично — не противоречие |
| A → collaborates: [B] (B коллега) | B → challenges: [A] (A подчинённый) | A считает B коллегой, но B считает A подчинённым |

### Правила симметрии

Корректные симметричные отношения:
- `A.defers_to[B]` ↔ `B.challenges[A]` — Иерархия "начальник-подчинённый"
- `A.collaborates[B]` ↔ `B.collaborates[A]` — Равные коллеги

## Решение

Добавить проверку и автосинхронизацию в момент сохранения иерархии. При обнаружении противоречий:
1. Показать пользователю список конфликтов
2. Предложить варианты: **Синхронизировать** (исправить обе стороны) или **Отмена**

---

## Архитектура

### Новый компонент: ConflictResolutionDialog

Диалог для отображения обнаруженных конфликтов с предложением их разрешения.

### Новая утилита: hierarchyConflictDetector

Функции для обнаружения и разрешения конфликтов:

```text
┌──────────────────────────────────────────────────────────────┐
│                    hierarchyConflictDetector.ts              │
├──────────────────────────────────────────────────────────────┤
│ detectConflicts(currentRole, newInteractions, allBehaviors)  │
│   → HierarchyConflict[]                                      │
│                                                              │
│ generateSyncOperations(conflicts, strategy)                  │
│   → SyncOperation[]                                          │
│                                                              │
│ applySyncOperations(operations)                              │
│   → Promise<void>                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## Технические детали

### Типы данных

```typescript
interface HierarchyConflict {
  sourceRole: AgentRole;      // Редактируемая роль
  targetRole: AgentRole;      // Роль с конфликтом
  sourceRelation: 'defers_to' | 'challenges' | 'collaborates';
  targetRelation: 'defers_to' | 'challenges' | 'collaborates' | 'none';
  expectedTargetRelation: 'defers_to' | 'challenges' | 'collaborates';
  description: string;
}

interface SyncOperation {
  role: AgentRole;
  action: 'add' | 'remove';
  list: 'defers_to' | 'challenges' | 'collaborates';
  targetRole: AgentRole;
}
```

### Алгоритм обнаружения конфликтов

```typescript
function detectConflicts(
  currentRole: AgentRole,
  newInteractions: RoleInteractions,
  allBehaviors: Map<AgentRole, RoleInteractions>
): HierarchyConflict[] {
  const conflicts: HierarchyConflict[] = [];
  
  // Для каждой роли в defers_to (начальники)
  for (const superior of newInteractions.defers_to) {
    const superiorInteractions = allBehaviors.get(superior);
    // Начальник должен иметь нас в challenges (подчинённые)
    if (!superiorInteractions?.challenges?.includes(currentRole)) {
      conflicts.push({
        sourceRole: currentRole,
        targetRole: superior,
        sourceRelation: 'defers_to',
        targetRelation: getRelationType(superiorInteractions, currentRole),
        expectedTargetRelation: 'challenges',
        description: `${superior} не считает ${currentRole} подчинённым`
      });
    }
  }
  
  // Для каждой роли в challenges (подчинённые)
  for (const subordinate of newInteractions.challenges) {
    const subordinateInteractions = allBehaviors.get(subordinate);
    // Подчинённый должен иметь нас в defers_to (начальники)
    if (!subordinateInteractions?.defers_to?.includes(currentRole)) {
      conflicts.push({...});
    }
  }
  
  // Для каждой роли в collaborates (коллеги)
  for (const peer of newInteractions.collaborates) {
    const peerInteractions = allBehaviors.get(peer);
    // Коллега должен иметь нас тоже в collaborates
    if (!peerInteractions?.collaborates?.includes(currentRole)) {
      conflicts.push({...});
    }
  }
  
  return conflicts;
}
```

### Интеграция в процесс сохранения

В `useRoleBehavior.ts` и диалоге сохранения:

1. При нажатии "Сохранить" — вызвать `detectConflicts()`
2. Если конфликтов нет — сохранить как обычно
3. Если есть конфликты — показать `ConflictResolutionDialog`
4. При выборе "Синхронизировать":
   - Сгенерировать список операций
   - Обновить все затронутые записи в БД в одной транзакции

### UI диалога ConflictResolutionDialog

```text
┌─────────────────────────────────────────────────┐
│ ⚠️ Обнаружены противоречия в иерархии          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Эксперт → defers_to: Консультант               │
│   ⚡ Консультант считает Эксперта коллегой     │
│   Предлагаемое исправление:                    │
│   Консультант.challenges += Эксперт            │
│                                                 │
│ Эксперт → collaborates: Критик                 │
│   ⚡ Критик считает Эксперта подчинённым       │
│   Предлагаемое исправление:                    │
│   Критик.collaborates += Эксперт               │
│                                                 │
├─────────────────────────────────────────────────┤
│        [Отмена]  [Синхронизировать всё]         │
└─────────────────────────────────────────────────┘
```

---

## Файлы для создания

| Файл | Описание |
|------|----------|
| `src/lib/hierarchyConflictDetector.ts` | Логика обнаружения и разрешения конфликтов |
| `src/components/staff/ConflictResolutionDialog.tsx` | UI для отображения конфликтов |

## Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/hooks/useRoleBehavior.ts` | Добавить функцию `fetchAllBehaviors()` для загрузки всех иерархий |
| `src/components/staff/RoleDetailsPanel.tsx` | Интеграция проверки конфликтов при сохранении |
| `src/components/patterns/BehaviorEditorDialog.tsx` | Интеграция проверки конфликтов при сохранении |
| `src/contexts/LanguageContext.tsx` | Переводы для диалога конфликтов |

---

## Переводы для добавления

```typescript
'staffRoles.hierarchy.conflicts': {
  ru: 'Обнаружены противоречия в иерархии',
  en: 'Hierarchy conflicts detected',
},
'staffRoles.hierarchy.conflictsDescription': {
  ru: 'Установленные связи противоречат настройкам других ролей',
  en: 'The set relationships conflict with other role settings',
},
'staffRoles.hierarchy.syncAll': {
  ru: 'Синхронизировать',
  en: 'Synchronize',
},
'staffRoles.hierarchy.conflictExpects': {
  ru: 'ожидается',
  en: 'expected',
},
'staffRoles.hierarchy.conflictHas': {
  ru: 'сейчас',
  en: 'currently',
},
'staffRoles.hierarchy.syncing': {
  ru: 'Синхронизация...',
  en: 'Synchronizing...',
},
'staffRoles.hierarchy.syncSuccess': {
  ru: 'Иерархия синхронизирована',
  en: 'Hierarchy synchronized',
},
```

---

## Порядок реализации

1. Создать `src/lib/hierarchyConflictDetector.ts` с типами и логикой
2. Создать `src/components/staff/ConflictResolutionDialog.tsx`
3. Обновить `src/hooks/useRoleBehavior.ts` — добавить `fetchAllBehaviors`
4. Интегрировать проверку в `RoleDetailsPanel.tsx`
5. Интегрировать проверку в `BehaviorEditorDialog.tsx`
6. Добавить переводы в `LanguageContext.tsx`

