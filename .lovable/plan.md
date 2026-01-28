

## План: Исправление навигации на последний активный чат

### Проблема
При обновлении страницы Expert Panel всегда загружается сессия "Выбор ИИ для уеб-поиска", хотя последние сообщения были в другой сессии ("БПФ - код и математика").

### Причина
Текущая логика сортирует сессии по полю `updated_at`, которое обновляется при любом изменении записи в таблице `sessions` (например, при изменении конфигурации моделей). Это не отражает реальную активность чата.

**Данные из базы:**
| Сессия | updated_at | Последнее сообщение |
|--------|------------|---------------------|
| Выбор ИИ для уеб-поиска | 27 янв 15:32 | 26 янв 18:59 |
| БПФ - код и математика | 26 янв 19:09 | **28 янв 10:57** ✓ |

### Решение
Изменить запрос `fetchLastTask()` так, чтобы определять "последний чат" по времени последнего сообщения, а не по `updated_at` сессии.

---

### Изменения

**Файл: `src/pages/ExpertPanel.tsx`**

Функция `fetchLastTask()` (строки 193-230):

**Текущий код:**
```typescript
const { data, error } = await supabase
  .from('sessions')
  .select('id, title, session_config')
  .eq('user_id', user.id)
  .order('updated_at', { ascending: false })
  .limit(1)
  .single();
```

**Новый код с подзапросом к сообщениям:**
```typescript
// Получаем сессию с самым последним сообщением
const { data, error } = await supabase
  .from('messages')
  .select('session_id, sessions!inner(id, title, session_config, user_id)')
  .eq('sessions.user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

if (error || !data) {
  // Нет сообщений — ищем сессию без сообщений (fallback)
  const { data: emptySession } = await supabase
    .from('sessions')
    .select('id, title, session_config')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (!emptySession) {
    navigate('/tasks');
    return;
  }
  
  setCurrentTask(emptySession);
  // ... apply config
  fetchMessages(emptySession.id);
  return;
}

const session = data.sessions;
setCurrentTask({ id: session.id, title: session.title });
// ... apply config from session.session_config
fetchMessages(session.id);
```

---

### Логика работы

```text
┌─────────────────────────────────────────────────────────────┐
│               Новая логика fetchLastTask()                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SELECT session_id FROM messages                         │
│     JOIN sessions                                           │
│     WHERE sessions.user_id = current_user                   │
│     ORDER BY messages.created_at DESC                       │
│     LIMIT 1                                                 │
│                       │                                     │
│                       ▼                                     │
│  ┌─────────────────────────────────────────────────┐        │
│  │ Найдена сессия с сообщениями?                   │        │
│  │                                                 │        │
│  │  ДА  ─────► Загрузить эту сессию               │        │
│  │                                                 │        │
│  │  НЕТ ─────► Fallback: сессия по created_at     │        │
│  │             (пустые сессии или новый юзер)      │        │
│  └─────────────────────────────────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Альтернативный подход (без JOIN)

Если join через сообщения не работает корректно с типами, можно использовать двухэтапный запрос:

```typescript
// 1. Найти сессию с последним сообщением
const { data: lastMessage } = await supabase
  .from('messages')
  .select('session_id')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

if (lastMessage) {
  // 2. Загрузить эту сессию
  return fetchTask(lastMessage.session_id);
}

// 3. Fallback на сессию без сообщений
const { data: fallbackSession } = await supabase
  .from('sessions')
  .select('id, title, session_config')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

Этот подход проще и надёжнее для типизации.

---

### Шаги реализации

1. Изменить `fetchLastTask()` в `ExpertPanel.tsx` для сортировки по последнему сообщению
2. Добавить fallback для сессий без сообщений
3. Протестировать навигацию при обновлении страницы

