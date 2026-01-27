
## План: Исправление обработки изображений для AI и отображения в чате

### Обнаруженные проблемы

**Проблема 1: ИИ-модели не получают изображения**

Сейчас в hydra-orchestrator передается только текст сообщения:
```typescript
body: JSON.stringify({
  session_id: currentTask.id,
  message: messageContent,  // ← только текст!
  models: modelsToCall,
}),
```

AI API (OpenAI, Gemini и др.) требуют multimodal формат для изображений.

**Проблема 2: Изображения не отображаются в ленте чата**

Вложения сохраняются в `metadata.attachments`, но нужно убедиться, что:
1. Файлы успешно загружаются в storage
2. URL правильно формируется
3. ChatMessage корректно читает metadata

### Архитектура решения

```text
Клиент (ExpertPanel)                 Edge Function (hydra-orchestrator)
       │                                      │
       ▼                                      ▼
┌─────────────────┐                   ┌─────────────────┐
│ 1. Загрузка     │                   │ 3. Multimodal   │
│    файлов в     │─────────────────▶│    запрос к     │
│    storage      │  attachments[]    │    AI API       │
└─────────────────┘                   └─────────────────┘
       │                                      │
       ▼                                      ▼
┌─────────────────┐                   ┌─────────────────┐
│ 2. Сохранение   │                   │ 4. Ответ с      │
│    metadata в   │                   │    анализом     │
│    messages     │                   │    изображения  │
└─────────────────┘                   └─────────────────┘
```

### Технические изменения

#### 1. Изменения в `src/pages/ExpertPanel.tsx`

Добавить передачу вложений в hydra-orchestrator:

```typescript
// Call the Hydra orchestrator with multiple models
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hydra-orchestrator`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${...}`,
    },
    body: JSON.stringify({
      session_id: currentTask.id,
      message: messageContent,
      attachments: attachmentUrls, // ← ДОБАВИТЬ передачу вложений
      models: modelsToCall,
    }),
  }
);
```

#### 2. Изменения в `supabase/functions/hydra-orchestrator/index.ts`

**2.1 Обновить интерфейс RequestBody:**
```typescript
interface Attachment {
  name: string;
  url: string;
  type: string;
}

interface RequestBody {
  session_id: string;
  message: string;
  attachments?: Attachment[];  // ← добавить
  models: ModelRequest[];
}
```

**2.2 Обновить функцию callLovableAI для multimodal:**
```typescript
async function callLovableAI(
  apiKey: string,
  model: string,
  message: string,
  attachments: Attachment[],  // ← добавить
  systemPrompt: string,
  temperature: number,
  maxTokens: number
) {
  // Формирование multimodal content для изображений
  const userContent: Array<{type: string; text?: string; image_url?: {url: string}}> = [];
  
  // Добавить текст сообщения
  if (message) {
    userContent.push({ type: "text", text: message });
  }
  
  // Добавить изображения
  for (const att of attachments) {
    if (att.type.startsWith('image/')) {
      userContent.push({
        type: "image_url",
        image_url: { url: att.url }
      });
    }
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { ... },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent.length === 1 ? message : userContent },
      ],
      ...
    }),
  });
  // ...
}
```

**2.3 Обновить callPersonalModel аналогично для OpenAI и Gemini:**

Для **OpenAI**:
```typescript
messages: [
  { role: "system", content: systemPrompt },
  { 
    role: "user", 
    content: attachments.length > 0 
      ? buildMultimodalContent(message, attachments)
      : message 
  },
],
```

Для **Gemini**:
```typescript
contents: [{
  parts: [
    { text: `${systemPrompt}\n\nUser: ${message}` },
    ...attachments
      .filter(a => a.type.startsWith('image/'))
      .map(a => ({ 
        inline_data: { 
          mime_type: a.type, 
          data: a.url // или base64 
        }
      }))
  ]
}],
```

Для **Anthropic**:
```typescript
messages: [{ 
  role: "user", 
  content: attachments.length > 0
    ? [
        { type: "text", text: message },
        ...attachments
          .filter(a => a.type.startsWith('image/'))
          .map(a => ({ 
            type: "image", 
            source: { type: "url", url: a.url }
          }))
      ]
    : message 
}],
```

#### 3. Добавить логирование загрузки файлов

В `ExpertPanel.tsx` добавить отладочные логи для проверки успешности загрузки:

```typescript
console.log('Uploading file:', attached.file.name, 'to path:', filePath);
const { error: uploadError, data: uploadData } = await supabase.storage
  .from('message-files')
  .upload(filePath, fileToUpload);

if (uploadError) {
  console.error('Upload error:', uploadError);
  // ...
} else {
  console.log('Upload success:', uploadData);
  const { data: urlData } = supabase.storage
    .from('message-files')
    .getPublicUrl(filePath);
  console.log('Public URL:', urlData.publicUrl);
  // ...
}
```

### Файлы для изменения

| Файл | Действие | Описание |
|------|----------|----------|
| `src/pages/ExpertPanel.tsx` | Изменить | Передавать attachments в hydra-orchestrator, добавить логирование |
| `supabase/functions/hydra-orchestrator/index.ts` | Изменить | Принимать attachments и формировать multimodal запросы к AI |

### Поддержка multimodal для разных провайдеров

| Провайдер | Формат изображений | Примечания |
|-----------|-------------------|------------|
| OpenAI (gpt-4o, gpt-4-turbo) | `image_url.url` | Поддерживает URL напрямую |
| Gemini | `inline_data.data` (base64) или URL | Зависит от версии API |
| Anthropic | `source.url` или `source.base64` | Поддерживает оба формата |
| Lovable AI | `image_url.url` | Прокси к OpenAI формату |

### Ограничения

- Некоторые модели (например, text-only) не поддерживают изображения — для них изображения будут игнорироваться
- Gemini может требовать base64 вместо URL для некоторых типов изображений
- Размер изображения ограничен политиками провайдеров (обычно до 20MB)

### Результат

После изменений:
1. Пользователь прикрепляет изображение к сообщению
2. Изображение загружается в storage и URL сохраняется в metadata
3. Сообщение с изображением отображается в ленте чата
4. При вызове AI модели получают изображение в multimodal формате и могут его анализировать
5. AI отвечает с учетом содержимого изображения
