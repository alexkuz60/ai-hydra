
# План: Добавить управление памятью в основной чат

## Обзор

Добавить функционал управления памятью (диалог просмотра, кнопка обновления) в основной чат Панели экспертов аналогично существующей реализации в D-чате (ConsultantPanel).

## Текущее состояние

- **ExpertPanel** уже использует `useSessionMemory` для удаления памяти при удалении сообщения
- **ExpertPanel** отображает бейдж с количеством сохранённых фрагментов в заголовке
- **ConsultantPanel** имеет полный функционал: кнопка обновления, кнопка управления, диалог SessionMemoryDialog

## Что будет добавлено

1. **Кнопка "Освежить память"** — анимированная кнопка для принудительного обновления данных памяти
2. **Кнопка "Управление памятью"** — открывает диалог SessionMemoryDialog
3. **Диалог SessionMemoryDialog** — просмотр, фильтрация, поиск дубликатов и удаление фрагментов

## Визуальное расположение

Кнопки будут добавлены в заголовок основного чата рядом с индикатором памяти:

```text
┌─────────────────────────────────────────────────────┐
│ 🎯 Название задачи   🧠 5  ↻  ⚙️    ⚡ Streaming  ⬛ │
│                           ↑   ↑                     │
│                   Refresh  Manage                   │
└─────────────────────────────────────────────────────┘
```

---

## Техническая реализация

### Шаг 1: Расширить использование useSessionMemory

Добавить недостающие методы и состояния в ExpertPanel:

```typescript
// До (строка 97)
const { deleteByMessageId } = useSessionMemory(currentTask?.id || null);

// После
const { 
  deleteByMessageId,
  chunks,
  refetch: refetchMemory,
  isLoading: memoryLoading,
  deleteChunk,
  clearSessionMemory,
  isDeleting: memoryDeleting,
  isClearing: memoryClearing,
  getStats: getMemoryStats,
} = useSessionMemory(currentTask?.id || null);
```

### Шаг 2: Добавить локальные состояния

```typescript
const [memoryRefreshed, setMemoryRefreshed] = useState(false);
const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);
```

### Шаг 3: Добавить обработчик обновления памяти

```typescript
const handleRefreshMemory = useCallback(async () => {
  await refetchMemory();
  setMemoryRefreshed(true);
  setTimeout(() => setMemoryRefreshed(false), 2000);
}, [refetchMemory]);
```

### Шаг 4: Добавить импорт SessionMemoryDialog и иконок

```typescript
import { SessionMemoryDialog } from '@/components/warroom/SessionMemoryDialog';
import { RefreshCw, Check, Settings2 } from 'lucide-react';
```

### Шаг 5: Обновить заголовок (Task Header)

Добавить кнопки управления памятью в область между индикатором памяти и Streaming Controls:

```tsx
{/* Memory Controls */}
{memoryStats && memoryStats.total > 0 && (
  <>
    {/* Refresh Memory Button */}
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button onClick={handleRefreshMemory} ...>
          {/* Animated refresh/check icon */}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {memoryRefreshed ? t('memory.refreshed') : t('memory.refresh')}
      </TooltipContent>
    </Tooltip>
    
    {/* Manage Memory Button */}
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={() => setMemoryDialogOpen(true)} ...>
          <Settings2 />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{t('memory.manageMemory')}</TooltipContent>
    </Tooltip>
  </>
)}
```

### Шаг 6: Добавить SessionMemoryDialog в JSX

В конец компонента (перед закрывающим `</Layout>`):

```tsx
<SessionMemoryDialog
  open={memoryDialogOpen}
  onOpenChange={setMemoryDialogOpen}
  chunks={chunks}
  isLoading={memoryLoading}
  isDeleting={memoryDeleting}
  onDeleteChunk={deleteChunk}
  onClearAll={clearSessionMemory}
  isClearing={memoryClearing}
/>
```

---

## Изменяемые файлы

| Файл | Изменение |
|------|-----------|
| `src/pages/ExpertPanel.tsx` | Расширить хук useSessionMemory, добавить состояния, кнопки и диалог |

---

## Результат

После реализации пользователь сможет:
1. Видеть индикатор сохранённых фрагментов памяти в заголовке основного чата
2. Обновлять данные памяти кнопкой с анимацией
3. Открывать диалог управления памятью для просмотра, поиска дубликатов и удаления фрагментов
4. Управлять всей памятью сессии из одного места, не переключаясь в D-чат
