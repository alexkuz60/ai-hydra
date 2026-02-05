
# План: Исправление SupervisorWishesPicker

## Выявленные проблемы

1. **Дублирование поповера** — PopoverTrigger с `asChild` и вложенным `<div className="relative">` вызывает двойное срабатывание
2. **Сброс выбора при клике** — Checkbox `onCheckedChange` принимает `boolean`, а не event, поэтому `stopPropagation` не срабатывает
3. **Смена специалиста** — выбранные пожелания, которые не применимы к новому специалисту, не удаляются автоматически

---

## Решение

### 1. Фикс структуры триггера

**Проблема:** `PopoverTrigger asChild` + `div` + `Button` создаёт вложенность, где div становится элементом-триггером, а кнопка — его содержимым.

**Решение:** Убрать `asChild` и использовать `PopoverTrigger` напрямую как контейнер с относительным позиционированием:

```tsx
<PopoverTrigger className="relative">
  <Button ... />
  <Badge ... />
</PopoverTrigger>
```

Или альтернативно — вынести Badge за пределы PopoverTrigger и обернуть всё во внешний `div relative`.

### 2. Фикс обработки событий в Checkbox

**Проблема:** `onCheckedChange` получает `boolean | 'indeterminate'`, а не MouseEvent.

**Решение:** Использовать `onClick` на контейнере строки вместо `onCheckedChange`, или добавить `onPointerDownOutside` к PopoverContent:

```tsx
<PopoverContent 
  onPointerDownOutside={(e) => e.preventDefault()}
  onInteractOutside={(e) => e.preventDefault()}
>
```

Это предотвратит закрытие при взаимодействии внутри.

### 3. Автоматическая очистка недоступных пожеланий

**Логика:** При смене `activeRoles` фильтровать `selectedWishes`, оставляя только те, которые применимы к новым ролям.

```tsx
useEffect(() => {
  if (activeRoles.length === 0) return;
  
  const applicableKeys = new Set<string>();
  activeRoles.forEach((role) => {
    getSupervisorWishesForRole(role).forEach((w) => applicableKeys.add(w.key));
  });
  
  const filtered = selectedWishes.filter((key) => applicableKeys.has(key));
  if (filtered.length !== selectedWishes.length) {
    onWishesChange(filtered);
  }
}, [activeRoles]);
```

---

## Изменения в коде

### Файл: `src/components/warroom/SupervisorWishesPicker.tsx`

1. **PopoverContent** — добавить `onPointerDownOutside` и `onInteractOutside` для предотвращения закрытия при кликах внутри
2. **PopoverTrigger** — изменить структуру, чтобы Badge был снаружи триггера
3. **useEffect** — добавить автоматическую фильтрацию при смене `activeRoles`
4. **Checkbox** — перенести `stopPropagation` на `onClick` враппер-строки

---

## Ожидаемый результат

- Один поповер без дублирования
- Выбор/снятие пожеланий не закрывает список
- Повторное открытие сохраняет выбранное состояние
- При смене специалиста недоступные пожелания автоматически убираются
