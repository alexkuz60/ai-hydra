

## Минимальный рефакторинг: План

### Цель
Улучшить структуру кода без изменения функциональности. Вынести переиспользуемые функции и типы в отдельные файлы.

### Изменения

#### 1. Создать `src/lib/fileUtils.ts`
Новый файл для утилит работы с файлами:

```typescript
// Функции:
- sanitizeFileName()  // из ExpertPanel.tsx (строки 28-42)
- isImageType()       // из FileUpload.tsx (строки 25-27)

// Константы:
- ALLOWED_IMAGE_TYPES  // из FileUpload.tsx
- ALLOWED_DOC_TYPES    // из FileUpload.tsx
- MAX_FILES (5)
- MAX_SIZE_MB (10)
```

#### 2. Создать `src/types/messages.ts`
Общие типы для сообщений:

```typescript
export type MessageRole = 'user' | 'assistant' | 'critic' | 'arbiter';

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  model_name: string | null;
  content: string;
  reasoning_path: string | null;
  confidence_score: number | null;
  created_at: string;
  metadata?: {
    attachments?: Attachment[];
    rating?: number;
  };
}
```

#### 3. Создать `src/hooks/usePasteHandler.ts`
Хук для обработки вставки изображений из буфера обмена:

```typescript
export function usePasteHandler(
  attachedFiles: AttachedFile[],
  setAttachedFiles: (files: AttachedFile[]) => void
) {
  // Логика из ExpertPanel.tsx строки 562-608
  // Возвращает: onPaste handler
}
```

#### 4. Обновить существующие файлы

| Файл | Изменения |
|------|-----------|
| `src/pages/ExpertPanel.tsx` | Удалить sanitizeFileName, Message, MessageRole. Импортировать из новых файлов. Использовать usePasteHandler |
| `src/components/warroom/FileUpload.tsx` | Удалить ALLOWED_*, isImageType. Импортировать из fileUtils |
| `src/components/warroom/ChatMessage.tsx` | Импортировать Message из types/messages |

### Структура после рефакторинга

```text
src/
├── lib/
│   ├── fileUtils.ts       ← НОВЫЙ (утилиты файлов)
│   ├── imageCompression.ts
│   └── utils.ts
├── types/
│   └── messages.ts        ← НОВЫЙ (типы сообщений)
├── hooks/
│   ├── usePasteHandler.ts ← НОВЫЙ (paste handler)
│   └── ...существующие
├── pages/
│   └── ExpertPanel.tsx    ← ~30 строк меньше
└── components/warroom/
    ├── FileUpload.tsx     ← чище, без дублирования
    └── ChatMessage.tsx    ← использует общие типы
```

### Результат

- **ExpertPanel.tsx**: 630 → ~600 строк (–30)
- **Переиспользуемость**: sanitizeFileName можно использовать в других местах
- **Типобезопасность**: единый источник правды для типов сообщений
- **Чистота**: логика paste вынесена в хук

### Время выполнения
~3-5 минут реального времени

