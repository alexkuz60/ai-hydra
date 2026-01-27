

## План: Прикрепление файлов к сообщениям

### Что делаем

Добавляем возможность прикреплять файлы (изображения, документы) к сообщениям пользователя в чате. Файлы будут загружаться в хранилище и отображаться в сообщениях.

### Визуальный результат

**Поле ввода с кнопкой прикрепления:**
```text
┌─────────────────────────────────────────────────────────────────┐
│ [📎] [Введите ваш запрос...                            ] [➤]   │
│                                                                 │
│ ┌──────────┐ ┌──────────┐                                       │
│ │ 📄 doc.pdf│ │ 🖼️ img.png│  × × (превью прикрепленных файлов)  │
│ └──────────┘ └──────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

**Сообщение с вложениями:**
```text
┌─────────────────────────────────────────────────────────────────┐
│ 👤 Пользователь                                                 │
│                                                                 │
│ Текст сообщения...                                             │
│                                                                 │
│ ┌──────────────┐ ┌──────────────┐                               │
│ │    🖼️         │ │   📄         │                               │
│ │  image.png   │ │  doc.pdf     │                               │
│ └──────────────┘ └──────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### Архитектура решения

```text
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   ExpertPanel   │ ───▶ │  Storage Bucket  │      │    messages     │
│ (file upload)   │      │ "message-files"  │      │   (metadata)    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
   1. Выбор файлов      2. Загрузка в         3. Сохранение URL
      через input          storage               в metadata
```

### Технические изменения

#### 1. Создание Storage Bucket (SQL миграция)

```sql
-- Создать bucket для файлов сообщений
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-files', 'message-files', true);

-- RLS политики для bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 2. Новый компонент FileUpload (`src/components/warroom/FileUpload.tsx`)

```tsx
interface AttachedFile {
  file: File;
  preview?: string;  // для изображений
  id: string;        // уникальный ID для удаления
}

interface FileUploadProps {
  files: AttachedFile[];
  onFilesChange: (files: AttachedFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
}
```

**Функционал:**
- Кнопка 📎 для выбора файлов
- Поддержка drag & drop
- Превью изображений
- Иконки для документов (PDF, DOCX и др.)
- Кнопка удаления для каждого файла
- Ограничение: макс. 5 файлов, макс. 10MB каждый

#### 3. Изменения в `src/pages/ExpertPanel.tsx`

**Добавить:**
- State `attachedFiles: AttachedFile[]`
- Функция `uploadFiles()` - загрузка в storage
- Интеграция компонента FileUpload в область ввода
- Сохранение URL файлов в `metadata.attachments` при отправке

**Логика отправки сообщения:**
```tsx
const handleSendMessage = async () => {
  // ... existing validation ...
  
  // 1. Upload files to storage
  const attachmentUrls: { name: string; url: string; type: string }[] = [];
  
  for (const attached of attachedFiles) {
    const filePath = `${user.id}/${currentTask.id}/${Date.now()}_${attached.file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('message-files')
      .upload(filePath, attached.file);
      
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('message-files')
        .getPublicUrl(filePath);
      attachmentUrls.push({
        name: attached.file.name,
        url: urlData.publicUrl,
        type: attached.file.type,
      });
    }
  }
  
  // 2. Insert message with attachments in metadata
  await supabase.from('messages').insert({
    session_id: currentTask.id,
    user_id: user.id,
    role: 'user',
    content: messageContent,
    metadata: attachmentUrls.length > 0 ? { attachments: attachmentUrls } : null,
  });
  
  // 3. Clear attached files
  setAttachedFiles([]);
  
  // ... rest of the function ...
};
```

#### 4. Изменения в `src/components/warroom/ChatMessage.tsx`

**Добавить отображение вложений:**
```tsx
interface Attachment {
  name: string;
  url: string;
  type: string;
}

// В компоненте ChatMessage:
const attachments = (metadataObj.attachments as Attachment[] | undefined) || [];

// Рендер вложений после контента:
{attachments.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-3">
    {attachments.map((att, idx) => (
      <AttachmentPreview key={idx} attachment={att} />
    ))}
  </div>
)}
```

**Компонент AttachmentPreview:**
- Для изображений: превью с возможностью открыть в полном размере
- Для документов: иконка + имя файла + ссылка для скачивания

#### 5. Переводы в `src/contexts/LanguageContext.tsx`

```tsx
'files.attach': { ru: 'Прикрепить файл', en: 'Attach file' },
'files.remove': { ru: 'Удалить', en: 'Remove' },
'files.maxSize': { ru: 'Максимальный размер: {size}MB', en: 'Max size: {size}MB' },
'files.maxFiles': { ru: 'Максимум файлов: {count}', en: 'Max files: {count}' },
'files.tooLarge': { ru: 'Файл слишком большой', en: 'File too large' },
'files.tooMany': { ru: 'Слишком много файлов', en: 'Too many files' },
'files.uploading': { ru: 'Загрузка...', en: 'Uploading...' },
'files.download': { ru: 'Скачать', en: 'Download' },
```

### Структура данных

**Metadata сообщения с вложениями:**
```json
{
  "attachments": [
    {
      "name": "document.pdf",
      "url": "https://...storage.../message-files/user_id/session_id/123_document.pdf",
      "type": "application/pdf"
    },
    {
      "name": "screenshot.png",
      "url": "https://...storage.../message-files/user_id/session_id/124_screenshot.png",
      "type": "image/png"
    }
  ]
}
```

**Путь файла в storage:**
```text
message-files/
  └── {user_id}/
       └── {session_id}/
            └── {timestamp}_{original_filename}
```

### Файлы для изменения/создания

| Файл | Действие | Описание |
|------|----------|----------|
| SQL миграция | Создать | Storage bucket + RLS политики |
| `src/components/warroom/FileUpload.tsx` | Создать | Компонент выбора и превью файлов |
| `src/pages/ExpertPanel.tsx` | Изменить | Добавить загрузку файлов, state, UI |
| `src/components/warroom/ChatMessage.tsx` | Изменить | Отображение вложений в сообщениях |
| `src/contexts/LanguageContext.tsx` | Изменить | Добавить переводы |

### Ограничения и валидация

- **Максимум файлов:** 5 на сообщение
- **Максимальный размер:** 10 MB на файл
- **Поддерживаемые форматы:** изображения (jpg, png, gif, webp), документы (pdf, docx, txt, md)
- **Структура хранения:** файлы группируются по user_id и session_id для RLS

### Результат

- Пользователь может прикреплять файлы к сообщениям через кнопку 📎 или drag & drop
- Файлы отображаются как превью перед отправкой
- В отправленном сообщении видны прикрепленные файлы
- Изображения показываются как превью с возможностью увеличения
- Документы отображаются как ссылки для скачивания
- Файлы безопасно хранятся в storage с RLS политиками

