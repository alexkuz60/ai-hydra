

## План: Фильтрация сообщений по участнику + Кнопка сворачивания чата

### Цель
1. **Двойной клик по участнику** в навигации фильтрует чат — показывает только сообщения этого участника
2. **Кнопка "Свернуть всё"** рядом с заголовком "Участники" сворачивает все сообщения в чате

---

### Часть 1: Фильтрация по участнику (двойной клик)

#### Логика
- Одинарный клик → скролл к сообщению (текущее поведение)
- Двойной клик → включение/выключение фильтра

#### Новое состояние в ExpertPanel

```typescript
const [filteredParticipant, setFilteredParticipant] = useState<string | null>(null);
```

#### Фильтрация сообщений

```typescript
const displayedMessages = useMemo(() => {
  if (!filteredParticipant) return messages;
  
  return messages.filter(m => {
    if (filteredParticipant === 'user') {
      return m.role === 'user';
    }
    // Фильтр по конкретному message ID (для хронологической структуры)
    // или по model_name для AI
    return m.id === filteredParticipant || m.model_name === filteredParticipant;
  });
}, [messages, filteredParticipant]);
```

#### Обновление ChatTreeNav

Добавить новый callback:

```typescript
interface ChatTreeNavProps {
  // ... existing props
  onMessageDoubleClick?: (messageId: string) => void;
  filteredParticipant?: string | null;
}
```

Использование в узлах:

```typescript
<div
  onClick={() => onMessageClick(block.id)}
  onDoubleClick={() => onMessageDoubleClick?.(block.id)}
  className={cn(
    // ... existing classes
    filteredParticipant === block.id && "ring-2 ring-primary"
  )}
>
```

---

### Часть 2: Кнопка "Свернуть все сообщения"

#### Новые props для ChatMessage

```typescript
interface ChatMessageProps {
  // ... existing props
  forceCollapsed?: boolean;
}
```

#### Состояние в ExpertPanel

```typescript
const [allCollapsed, setAllCollapsed] = useState(false);
```

#### Кнопка в заголовке ChatTreeNav

```typescript
<div className="p-3 border-b border-border flex items-center justify-between">
  <h3 className="text-sm font-medium flex items-center gap-2">
    <Users className="h-4 w-4" />
    {t('chat.participants')}
  </h3>
  
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onCollapseAll}
      >
        {allCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      {allCollapsed ? t('chat.expandAll') : t('chat.collapseAll')}
    </TooltipContent>
  </Tooltip>
</div>
```

#### Применение к ChatMessage

```tsx
// В ExpertPanel рендер сообщений
<ChatMessage 
  message={message}
  forceCollapsed={allCollapsed}
  // ... other props
/>
```

#### Обновление ChatMessage

```typescript
function ChatMessage({ message, forceCollapsed, ... }: ChatMessageProps) {
  const [isExpanded, setIsExpanded] = useState(!forceCollapsed);
  
  // Синхронизация с forceCollapsed
  useEffect(() => {
    if (forceCollapsed !== undefined) {
      setIsExpanded(!forceCollapsed);
    }
  }, [forceCollapsed]);
  
  // ... rest of component
}
```

---

### Часть 3: UI индикации фильтра

При активном фильтре показать badge с возможностью сброса:

```tsx
{filteredParticipant && (
  <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md">
    <Filter className="h-4 w-4 text-primary" />
    <span className="text-xs">{t('chat.filtered')}</span>
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-5 w-5"
      onClick={() => setFilteredParticipant(null)}
    >
      <X className="h-3 w-3" />
    </Button>
  </div>
)}
```

---

### Часть 4: Локализация

Добавить ключи:

```typescript
'chat.collapseAll': { ru: 'Свернуть всё', en: 'Collapse All' },
'chat.expandAll': { ru: 'Развернуть всё', en: 'Expand All' },
'chat.filtered': { ru: 'Фильтр активен', en: 'Filter active' },
'chat.clearFilter': { ru: 'Сбросить фильтр', en: 'Clear filter' },
```

---

### Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/components/warroom/ChatTreeNav.tsx` | Добавить onDoubleClick, кнопку сворачивания, индикатор фильтра |
| `src/pages/ExpertPanel.tsx` | Добавить состояния filteredParticipant, allCollapsed, передать в компоненты |
| `src/components/warroom/ChatMessage.tsx` | Добавить prop forceCollapsed, синхронизировать состояние |
| `src/contexts/LanguageContext.tsx` | Добавить переводы |

---

### Ожидаемый результат

1. **Фильтрация по двойному клику**:
   - Двойной клик по узлу → показывает только сообщения этого участника
   - Повторный двойной клик → сбрасывает фильтр
   - Визуальный индикатор активного фильтра

2. **Кнопка сворачивания**:
   - Иконка `ChevronsUpDown` рядом с "Участники"
   - Клик сворачивает все сообщения чата
   - Повторный клик разворачивает

3. **UX**:
   - Tooltip с подсказками
   - Плавные переходы
   - Возможность сбросить фильтр кликом на badge

