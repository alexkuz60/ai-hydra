

# План: Синхронизация состава экспертов + "Трудовая книжка" моделей

## Часть 1: Исправление рассинхронизации

### Проблема
Функция `handleRemoveModel` в ExpertPanel удаляет модель только из локального состояния. База данных не обновляется, поэтому:
- В панели Задач "уволенная" модель по-прежнему отображается
- При перезагрузке страницы модель возвращается
- Логи об ошибках продолжают появляться при оркестрации

### Решение
Добавить автоматическое сохранение `session_config` в БД при изменении `selectedModels`.

### Технические изменения

**Файл: `src/hooks/useSession.ts`**

Добавить функцию для сохранения конфигурации в БД:

```typescript
// Функция сохранения config в БД
const saveSessionConfig = useCallback(async (
  taskId: string,
  models: string[],
  settings: PerModelSettingsData
) => {
  try {
    await supabase
      .from('sessions')
      .update({
        session_config: { selectedModels: models, perModelSettings: settings },
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);
  } catch (error) {
    console.error('Failed to save session config:', error);
  }
}, []);
```

Добавить `useEffect` для авто-сохранения при изменении `selectedModels`:

```typescript
// Сохранять в БД при изменении selectedModels (с debounce)
useEffect(() => {
  if (!currentTask?.id || loading) return;
  
  const timeout = setTimeout(() => {
    saveSessionConfig(currentTask.id, selectedModels, perModelSettings);
  }, 500); // debounce 500ms
  
  return () => clearTimeout(timeout);
}, [selectedModels, perModelSettings, currentTask?.id, loading, saveSessionConfig]);
```

---

## Часть 2: "Трудовая книжка" модели

### Концепция
Создать таблицу `model_statistics` для отслеживания истории работы каждой модели.

### Структура данных

```text
┌─────────────────────────────────────────────────────────────────┐
│                       model_statistics                          │
├───────────────┬─────────────────────────────────────────────────┤
│ id            │ UUID (PK)                                       │
│ user_id       │ UUID (FK → auth.users, owner)                   │
│ model_id      │ TEXT (e.g., "openai/gpt-4o")                    │
│ session_id    │ UUID (FK → sessions)                            │
│ response_count│ INTEGER (количество ответов)                    │
│ total_brains  │ INTEGER (набранные "мозги")                     │
│ dismissal_count│ INTEGER (количество увольнений)                │
│ first_used_at │ TIMESTAMP                                       │
│ last_used_at  │ TIMESTAMP                                       │
│ created_at    │ TIMESTAMP                                       │
│ updated_at    │ TIMESTAMP                                       │
└───────────────┴─────────────────────────────────────────────────┘
```

### Логика обновления статистики

1. **При ответе модели** (`hydra-orchestrator`):
   - Инкремент `response_count`
   - Обновление `last_used_at`

2. **При увольнении** (`handleRemoveModel`):
   - Инкремент `dismissal_count`

3. **При добавлении "мозга"** (будущая фича):
   - Инкремент `total_brains`

### Миграция базы данных

```sql
-- Создание таблицы статистики моделей
CREATE TABLE public.model_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  response_count INTEGER NOT NULL DEFAULT 0,
  total_brains INTEGER NOT NULL DEFAULT 0,
  dismissal_count INTEGER NOT NULL DEFAULT 0,
  first_used_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, model_id, session_id)
);

-- Индексы для быстрого доступа
CREATE INDEX idx_model_stats_user ON model_statistics(user_id);
CREATE INDEX idx_model_stats_model ON model_statistics(model_id);

-- RLS политики
ALTER TABLE model_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own statistics"
  ON model_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics"
  ON model_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics"
  ON model_statistics FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger для updated_at
CREATE TRIGGER update_model_statistics_updated_at
  BEFORE UPDATE ON model_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### API для обновления статистики

**Файл: `src/hooks/useModelStatistics.ts`**

```typescript
export function useModelStatistics(userId: string | undefined) {
  const incrementResponse = async (modelId: string, sessionId: string) => {
    // upsert: создать запись или увеличить счётчик
  };
  
  const incrementDismissal = async (modelId: string, sessionId: string) => {
    // увеличить dismissal_count
  };
  
  const addBrains = async (modelId: string, sessionId: string, count: number) => {
    // увеличить total_brains
  };
  
  const getModelStats = async (modelId: string) => {
    // получить агрегированную статистику по модели
  };
  
  const getLeaderboard = async () => {
    // топ моделей по brains/responses
  };
}
```

---

## Порядок реализации

1. **Сначала исправить синхронизацию** (Часть 1)
   - Добавить auto-save в `useSession`
   - Проверить, что увольнение сохраняется в БД

2. **Затем создать таблицу статистики** (Часть 2)
   - Выполнить миграцию
   - Создать хук `useModelStatistics`
   - Интегрировать с `handleRemoveModel` для учёта увольнений
   - Интегрировать с оркестратором для учёта ответов

---

## Результат

После реализации:
1. Увольнение модели сразу синхронизируется с БД
2. В панели Задач отображается актуальный состав экспертов
3. Ведётся "трудовая книжка" каждой модели с историей участия

