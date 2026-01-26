
## План: Рейтинг сообщений и упрощение Панели экспертов

### Что делаем

1. **Удаляем панель настроек моделей из ExpertPanel**
   - Убираем правый сайдбар с настройками (`PerModelSettings`)
   - Убираем мобильную версию настроек
   - Настройки моделей остаются только на странице "Задачи"

2. **Добавляем рейтинговую систему для сообщений ИИ**
   - Рейтинг 0-10 баллов для каждого сообщения AI (не для пользовательских)
   - Иконки мозга вместо звезд (11 состояний: 0-10)
   - Сохранение рейтинга в поле `metadata` таблицы `messages`

### Визуальный результат

**Упрощенная Панель экспертов:**
```text
┌──────────────────────────────────────────────────────────────┐
│  📋 Название задачи                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🧠 Эксперт (GPT-5)                                     │ │
│  │ Ответ модели...                                        │ │
│  │                                                        │ │
│  │ Рейтинг: 🧠🧠🧠🧠🧠🧠🧠🧠○○  8/10      ▾ ▴  🗑️       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🛡️ Критик (Gemini)                                     │ │
│  │ Критический анализ...                                  │ │
│  │                                                        │ │
│  │ Рейтинг: 🧠🧠🧠🧠🧠○○○○○  5/10      ▾ ▴  🗑️          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [Введите сообщение...                              ] [➤]   │
└──────────────────────────────────────────────────────────────┘
```

**Компонент рейтинга (кликабельные иконки мозга):**
```text
Рейтинг: 🧠🧠🧠🧠🧠🧠🧠○○○  7/10
         ↑ клик на любую иконку устанавливает рейтинг
```

### Технические изменения

#### 1. Изменения в `src/pages/ExpertPanel.tsx`

**Удалить:**
- Импорт `PerModelSettings`
- Импорты `ChevronLeft`, `ChevronRight`
- State `settingsCollapsed`
- Весь блок `<aside>` (правый сайдбар, строки 419-451)
- Мобильную версию настроек (строки 354-363)

**Результат:** Панель содержит только хедер с названием задачи, чат и поле ввода

#### 2. Изменения в `src/components/warroom/ChatMessage.tsx`

**Добавить:**
- Props: `onRatingChange: (messageId: string, rating: number) => void`
- State: локальный `rating` из `message.metadata?.rating`
- Компонент `BrainRating` с 11 кликабельными иконками мозга
- Отображение рейтинга только для AI-сообщений (role !== 'user')

**Компонент BrainRating:**
```tsx
interface BrainRatingProps {
  value: number;  // 0-10
  onChange: (value: number) => void;
}

function BrainRating({ value, onChange }: BrainRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={cn(
            "h-5 w-5 transition-colors hover:scale-110",
            i <= value 
              ? "text-primary" 
              : "text-muted-foreground/30"
          )}
        >
          <Brain className="h-4 w-4" />
        </button>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">
        {value}/10
      </span>
    </div>
  );
}
```

#### 3. Изменения в `src/pages/ExpertPanel.tsx` (обработчик рейтинга)

**Добавить функцию:**
```tsx
const handleRatingChange = async (messageId: string, rating: number) => {
  try {
    // Get current metadata
    const message = messages.find(m => m.id === messageId);
    const currentMetadata = (message?.metadata as Record<string, unknown>) || {};
    
    const { error } = await supabase
      .from('messages')
      .update({ 
        metadata: { ...currentMetadata, rating } 
      })
      .eq('id', messageId);

    if (error) throw error;

    // Update local state
    setMessages(msgs => msgs.map(m => 
      m.id === messageId 
        ? { ...m, metadata: { ...currentMetadata, rating } }
        : m
    ));
  } catch (error: any) {
    toast.error(error.message);
  }
};
```

#### 4. Добавить переводы в `src/contexts/LanguageContext.tsx`

```tsx
'messages.rating': { ru: 'Рейтинг', en: 'Rating' },
```

### Структура данных

**Сохранение рейтинга в metadata:**
```json
{
  "provider": "lovable",
  "rating": 8
}
```

### Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/pages/ExpertPanel.tsx` | Удалить правый сайдбар и настройки, добавить обработчик рейтинга |
| `src/components/warroom/ChatMessage.tsx` | Добавить компонент рейтинга с иконками мозга |
| `src/contexts/LanguageContext.tsx` | Добавить переводы для рейтинга |

### Результат

- **ExpertPanel** максимально упрощен — только чат
- Вся конфигурация моделей централизована на странице **Tasks**
- Каждое сообщение AI можно оценить по шкале 0-10 с помощью кликабельных иконок мозга
- Рейтинги сохраняются в БД и отображаются при повторном открытии чата
