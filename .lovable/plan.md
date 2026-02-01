

# План: Фильтрация списка повторных запросов по моделям задачи

## Суть изменения

Список pending-ответов (скелетонов) и диалог таймаута должны отображать **только те модели**, которые настроены в `selectedModels` текущей Задачи. Если модель была удалена из задачи или никогда не была в ней — её скелетон не должен появляться.

## Текущее поведение

- Скелетоны создаются для всех моделей, на которые был отправлен запрос
- При таймауте показываются все ожидающие модели, даже если они не входят в конфигурацию задачи
- Нет связи между `pendingResponses` и `selectedModels`

## Целевое поведение

- Скелетоны отображаются **только для моделей из `selectedModels`**
- Если модель удалена из задачи, её pending-состояние автоматически очищается
- Консультант (D-Chat) показывает свой скелетон отдельно, он не связан с задачей

---

## Технические изменения

### Файл: `src/pages/ExpertPanel.tsx`

**Изменение 1: Добавить фильтрацию при передаче pendingResponses**

```typescript
// Перед передачей в ChatMessagesList
const filteredPendingResponses = new Map(
  [...pendingResponses].filter(([modelId]) => 
    selectedModels.includes(modelId) || modelId.includes('consultant')
  )
);
```

**Изменение 2: Автоматическая очистка при удалении модели из selectedModels**

Добавить `useEffect`, который следит за изменениями `selectedModels` и удаляет pending-состояния для моделей, которые больше не выбраны:

```typescript
useEffect(() => {
  setPendingResponses(prev => {
    const updated = new Map(prev);
    let changed = false;
    
    for (const modelId of updated.keys()) {
      // Сохраняем консультантов
      if (modelId.includes('consultant')) continue;
      
      if (!selectedModels.includes(modelId)) {
        updated.delete(modelId);
        changed = true;
      }
    }
    
    return changed ? updated : prev;
  });
}, [selectedModels]);
```

**Изменение 3: Передать отфильтрованный список в ChatMessagesList**

```typescript
<ChatMessagesList
  // ...
  pendingResponses={filteredPendingResponses}
  // ...
/>
```

---

## Логика фильтрации

```text
┌─────────────────────────────────────────────────────┐
│           pendingResponses (все ожидающие)          │
├─────────────────────────────────────────────────────┤
│ gpt-4o            ← в selectedModels? ДА → показать │
│ claude-3-opus     ← в selectedModels? НЕТ → скрыть  │
│ gemini-2.5-pro    ← в selectedModels? ДА → показать │
│ consultant-xyz    ← консультант? ДА → показать      │
└─────────────────────────────────────────────────────┘
```

---

## Результат

1. В списке ожидания отображаются только модели текущей Задачи
2. При удалении модели из задачи — её скелетон исчезает
3. Консультанты (D-Chat) продолжают показываться независимо от настроек задачи

