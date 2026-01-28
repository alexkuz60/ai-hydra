

## План: Интеграция Perplexity для веб-поиска консультантами

### Цель
Подключить Perplexity API как специализированный инструмент веб-поиска для роли "Консультант" в Панели экспертов. Пользователь сможет задавать вопросы с включённым веб-поиском и получать ответы с актуальной информацией из интернета и источниками.

---

### Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ConsultantSelector.tsx                        │
│                                                                  │
│  Расширить UI:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [🔍 Веб-поиск] ← переключатель для активации Perplexity    ││
│  │ [💡 Выбор модели] ← dropdown с моделями Perplexity          ││
│  │ [📤 Спросить] ← кнопка отправки                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ExpertPanel.tsx                               │
│                                                                  │
│  Новый handler: handleSendToPerplexity()                        │
│  - Вызов edge function perplexity-search                        │
│  - Сохранение ответа с citations в messages                     │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│           supabase/functions/perplexity-search/                  │
│                                                                  │
│  - PERPLEXITY_API_KEY из коннектора                             │
│  - POST к api.perplexity.ai/chat/completions                    │
│  - Модели: sonar, sonar-pro, sonar-reasoning                    │
│  - Возврат ответа + citations                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Часть 1: Подключение коннектора Perplexity

Сначала необходимо подключить коннектор Perplexity к проекту через Settings → Connectors. Это сделает `PERPLEXITY_API_KEY` доступным для edge functions.

---

### Часть 2: Edge Function perplexity-search

#### Файл: `supabase/functions/perplexity-search/index.ts`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, ...',
};

// Поддерживаемые модели Perplexity
const PERPLEXITY_MODELS = {
  'sonar': 'Fast, lightweight search',
  'sonar-pro': 'Multi-step reasoning with 2x more citations',
  'sonar-reasoning': 'Chain-of-thought reasoning with real-time search',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Проверка авторизации
  // ...

  const { message, model, session_id, user_id } = await req.json();
  
  const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Perplexity connector not configured' }),
      { status: 500, headers: corsHeaders }
    );
  }

  // Вызов Perplexity API
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'sonar',
      messages: [
        { role: 'system', content: 'Be precise and provide sources.' },
        { role: 'user', content: message }
      ],
    }),
  });

  const data = await response.json();
  
  // Сохранение в базу с role: 'consultant'
  await supabase.from('messages').insert({
    session_id,
    user_id,
    role: 'consultant',
    model_name: `perplexity/${model}`,
    content: data.choices[0].message.content,
    metadata: { 
      provider: 'perplexity',
      citations: data.citations || []
    },
  });

  return new Response(JSON.stringify({ 
    success: true,
    content: data.choices[0].message.content,
    citations: data.citations || []
  }), { headers: corsHeaders });
});
```

---

### Часть 3: Расширение UI для веб-поиска

#### 3.1 Обновить ConsultantSelector.tsx

| Элемент | Описание |
|---------|----------|
| Toggle "Веб-поиск" | Switch для активации режима Perplexity |
| Selector модели Perplexity | sonar / sonar-pro / sonar-reasoning |
| Иконка поиска | Globe/Search вместо Lightbulb когда веб-поиск активен |

```typescript
interface ConsultantSelectorProps {
  // существующие props...
  webSearchEnabled: boolean;
  onWebSearchToggle: (enabled: boolean) => void;
  perplexityModel: string;
  onPerplexityModelChange: (model: string) => void;
}

// Модели Perplexity для выбора
const PERPLEXITY_MODELS = [
  { id: 'sonar', name: 'Sonar (быстрый)' },
  { id: 'sonar-pro', name: 'Sonar Pro (детальный)' },
  { id: 'sonar-reasoning', name: 'Sonar Reasoning (аналитический)' },
];
```

#### 3.2 Обновить ExpertPanel.tsx

Добавить состояние и handler для веб-поиска:

```typescript
const [webSearchEnabled, setWebSearchEnabled] = useState(false);
const [perplexityModel, setPerplexityModel] = useState('sonar');

const handleSendWithWebSearch = async () => {
  // Вызов perplexity-search edge function
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/perplexity-search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        session_id: currentTask.id,
        user_id: user.id,
        message: messageContent,
        model: perplexityModel,
      }),
    }
  );
  // ...
};
```

---

### Часть 4: Отображение источников в чате

#### 4.1 Обновить ChatMessage.tsx

Добавить отображение citations из metadata для сообщений от Perplexity:

```tsx
// Внутри ChatMessage
const citations = (message.metadata as any)?.citations as string[] | undefined;

{citations && citations.length > 0 && (
  <div className="mt-3 pt-3 border-t border-white/10">
    <p className="text-xs text-muted-foreground mb-2">Источники:</p>
    <div className="flex flex-wrap gap-2">
      {citations.map((url, index) => (
        <a 
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          [{index + 1}]
        </a>
      ))}
    </div>
  </div>
)}
```

---

### Часть 5: Локализация

Добавить в LanguageContext.tsx:

```typescript
'consultant.webSearch': { ru: 'Веб-поиск', en: 'Web Search' },
'consultant.webSearchEnabled': { ru: 'Поиск в интернете включён', en: 'Web search enabled' },
'consultant.perplexityModel': { ru: 'Модель поиска', en: 'Search Model' },
'consultant.sonar': { ru: 'Sonar (быстрый)', en: 'Sonar (fast)' },
'consultant.sonarPro': { ru: 'Sonar Pro (детальный)', en: 'Sonar Pro (detailed)' },
'consultant.sonarReasoning': { ru: 'Sonar Reasoning (аналитический)', en: 'Sonar Reasoning (analytical)' },
'consultant.sources': { ru: 'Источники', en: 'Sources' },
'consultant.perplexityNotConfigured': { ru: 'Perplexity не настроен', en: 'Perplexity not configured' },
```

---

### Часть 6: Конфигурация

Добавить в supabase/config.toml:

```toml
[functions.perplexity-search]
verify_jwt = false
```

---

### Шаги реализации

1. **Коннектор**: Подключить Perplexity через Settings → Connectors
2. **Edge Function**: Создать `supabase/functions/perplexity-search/index.ts`
3. **Config**: Добавить функцию в config.toml
4. **UI Components**: Расширить ConsultantSelector с переключателем веб-поиска
5. **ExpertPanel**: Добавить handler для Perplexity запросов
6. **ChatMessage**: Добавить отображение citations
7. **Локализация**: Добавить переводы
8. **Deploy**: Развернуть edge function

---

### Ожидаемый результат

- Переключатель "Веб-поиск" в интерфейсе консультанта
- Выбор модели Perplexity: sonar / sonar-pro / sonar-reasoning
- Ответы с актуальной информацией из интернета
- Кликабельные ссылки на источники в сообщениях
- Визуальная индикация (иконка Globe) для сообщений с веб-поиском

