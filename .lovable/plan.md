
## План: Улучшение навигации и UI карточки задачи

### Что делаем

1. **Автозагрузка последней задачи при переходе в Панель экспертов**
   - При клике на "Панель экспертов" → загружать чат последней задачи (по `updated_at`)
   - Если задач нет → перенаправлять на страницу "Задачи"

2. **Перенос иконки редактирования вправо**
   - Переместить иконку ✏️ к кнопке 🗑️
   - Логика: теперь редактируем не только название, но и конфигурацию моделей

### Визуальный результат

**Карточка задачи — текущая структура:**
```text
┌─────────────────────────────────────────────────────────────┐
│  Название задачи ✏️                                 🗑️    │
│  📅 24.01.2025 15:30                                        │
│  [GPT-5] [Gemini]                                           │
└─────────────────────────────────────────────────────────────┘
```

**Карточка задачи — новая структура:**
```text
┌─────────────────────────────────────────────────────────────┐
│  Название задачи                              ✏️    🗑️    │
│  📅 24.01.2025 15:30                                        │
│  [GPT-5] [Gemini]                                           │
└─────────────────────────────────────────────────────────────┘
```

**Режим редактирования:**
```text
┌─────────────────────────────────────────────────────────────┐
│  [Редактируемое название...      ] ✓  ✕             🗑️    │
│  📅 24.01.2025 15:30                                        │
│  [GPT-5] [Gemini]                                           │
└─────────────────────────────────────────────────────────────┘
```

### Технические изменения

#### 1. Изменения в `src/pages/ExpertPanel.tsx`

**Текущая логика (строки 76-84):**
```tsx
if (user) {
  const taskId = searchParams.get('task');
  if (taskId) {
    fetchTask(taskId);
  } else {
    // No task specified, redirect to tasks page
    navigate('/tasks');
  }
}
```

**Новая логика:**
- Если есть `?task=` параметр → загрузить эту задачу
- Если параметра нет → запросить последнюю задачу из БД (ORDER BY `updated_at` DESC LIMIT 1)
- Если задач нет → перенаправить на `/tasks`

#### 2. Изменения в `src/pages/Tasks.tsx`

**Изменить структуру карточки (строки 400-412):**

Текущая структура:
```tsx
<div className="flex items-center gap-2">
  <h3 className="font-semibold truncate">{task.title}</h3>
  <Button ... onClick={handleStartEditTitle}>  // ✏️ рядом с названием
    <Pencil />
  </Button>
</div>
```

Новая структура:
```tsx
<div className="flex-1 min-w-0">
  <h3 className="font-semibold truncate">{task.title}</h3>
  ...
</div>
<div className="flex items-center gap-1 shrink-0">
  <Button ... onClick={handleStartEditTitle}>  // ✏️
    <Pencil />
  </Button>
  <Button ... onClick={setTaskToDelete}>  // 🗑️
    <Trash2 />
  </Button>
</div>
```

### Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/pages/ExpertPanel.tsx` | Добавить логику автозагрузки последней задачи при отсутствии параметра `?task=` |
| `src/pages/Tasks.tsx` | Переместить кнопку редактирования вправо к кнопке удаления |

### Детали реализации

**ExpertPanel.tsx — новая функция fetchLastTask:**
```tsx
const fetchLastTask = async () => {
  if (!user) return;
  
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, title, session_config')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      // Нет задач — перенаправляем на страницу Задачи
      navigate('/tasks');
      return;
    }
    
    // Загружаем последнюю задачу
    setCurrentTask(data);
    
    // Применяем сохраненную конфигурацию моделей
    if (data.session_config) {
      const config = data.session_config as Task['session_config'];
      if (config?.selectedModels) {
        setSelectedModels(config.selectedModels);
      }
      if (config?.perModelSettings) {
        setPerModelSettings(config.perModelSettings);
      }
    }
    
    fetchMessages(data.id);
  } catch (error) {
    navigate('/tasks');
  } finally {
    setLoading(false);
  }
};
```

**Tasks.tsx — новая структура блока кнопок:**
```tsx
// Группа кнопок справа
<div className="flex items-center gap-1 shrink-0">
  {editingTaskId !== task.id && (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={(e) => handleStartEditTitle(task, e)}
      title={t('tasks.editTitle')}
    >
      <Pencil className="h-4 w-4" />
    </Button>
  )}
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 text-muted-foreground hover:text-hydra-critical"
    onClick={(e) => {
      e.stopPropagation();
      setTaskToDelete(task);
    }}
  >
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

### Результат

- При клике на "Панель экспертов" автоматически открывается последняя активная задача
- Новые пользователи без задач сразу попадают на страницу создания задач
- Кнопки редактирования и удаления сгруппированы справа для лучшего UX
- Семантика: "редактировать задачу" (не только название) отражена в расположении кнопки
