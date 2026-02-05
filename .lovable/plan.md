

# План: Исправление непоследовательного форматирования TaskDetailsPanel

## Выявленные проблемы

На скриншотах видны различия в отображении одних и тех же элементов для разных задач:
- Слайдер "Точность/Креатив" то есть, то нет
- Прогноз стоимости отображается не всегда
- Кнопка "Сохранить настройки" появляется непредсказуемо

### Корневая причина

Проблема в `useEffect` в `TaskDetailsPanel.tsx` (строки 62-69):

```tsx
React.useEffect(() => {
  if (task) {
    setSelectedModels(filterValidModels(task.session_config?.selectedModels || []));
    setPerModelSettings(task.session_config?.perModelSettings || {});
    setUseHybridStreaming(task.session_config?.useHybridStreaming ?? true);
    setHasChanges(false);
  }
}, [task?.id]);
```

Зависимость `[task?.id]` означает:
1. При переключении между задачами с **разными** ID — эффект срабатывает
2. При обновлении данных **той же** задачи (например, после сохранения) — эффект **НЕ срабатывает**
3. Это создаёт рассинхрон между `task.session_config` и локальным состоянием

Дополнительно: функциональные обновления состояния в `handleModelsChange`, `handleSettingsChange`, `handleHybridChange` могут создавать race conditions при быстрых переключениях.

---

## Решение

### 1. Исправить зависимости useEffect

Добавить полную проверку изменения конфигурации задачи:

```tsx
React.useEffect(() => {
  if (task) {
    // Reset local state to match task config
    const validModels = filterValidModels(task.session_config?.selectedModels || []);
    setSelectedModels(validModels);
    setPerModelSettings(task.session_config?.perModelSettings || {});
    setUseHybridStreaming(task.session_config?.useHybridStreaming ?? true);
    setHasChanges(false);
  }
}, [task?.id, task?.session_config]);
```

### 2. Использовать функциональные обновления

Изменить обработчики для избежания stale state:

```tsx
const handleModelsChange = (models: string[]) => {
  setSelectedModels(models);
  setHasChanges(true);
};

const handleSettingsChange = (newSettings: PerModelSettingsData) => {
  setPerModelSettings(prev => ({ ...prev, ...newSettings }));
  setHasChanges(true);
};
```

### 3. Добавить стабильную сериализацию для сравнения

Использовать `JSON.stringify` для глубокого сравнения конфигурации:

```tsx
const configKey = useMemo(() => 
  task ? JSON.stringify(task.session_config) : '', 
  [task?.session_config]
);

React.useEffect(() => {
  if (task) {
    setSelectedModels(filterValidModels(task.session_config?.selectedModels || []));
    setPerModelSettings(task.session_config?.perModelSettings || {});
    setUseHybridStreaming(task.session_config?.useHybridStreaming ?? true);
    setHasChanges(false);
  }
}, [task?.id, configKey]);
```

---

## Изменения в файлах

### Файл: `src/components/tasks/TaskDetailsPanel.tsx`

1. Добавить `useMemo` для создания стабильного ключа конфигурации
2. Расширить зависимости `useEffect` для синхронизации с актуальной конфигурацией
3. Убедиться, что при смене задачи все элементы UI отображаются консистентно

---

## Ожидаемый результат

- Слайдер "Точность/Креатив" всегда отображается для всех задач с выбранными моделями
- Прогноз стоимости отображается консистентно
- Кнопка "Сохранить настройки" появляется только при реальных изменениях
- Переключение между задачами корректно синхронизирует UI с сохранёнными данными

