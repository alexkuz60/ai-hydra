

## План: Mermaid-диаграммы как вложения с превью

### Описание проблемы
Сейчас Mermaid-диаграммы вставляются прямо в текстовое поле запроса. Это приводит к тому, что AI-модели начинают объяснять что такое Mermaid-код, вместо того чтобы работать с диаграммой по существу.

### Решение
Прикреплять Mermaid-диаграммы как специальный тип вложения с визуальным превью (аналогично изображениям), а не вставлять код в текст.

### Новый пользовательский сценарий

```text
1. Пользователь нажимает скрепку → Диаграмма Mermaid → выбирает способ
2. Диаграмма появляется как карточка-вложение с превью (не в текстовом поле)
3. Пользователь пишет свой запрос в текстовом поле, ссылаясь на диаграмму
4. При отправке Mermaid-код передаётся как attachment в metadata
5. В истории сообщений диаграмма отображается с интерактивным превью
```

---

### Технические изменения

#### 1. Расширение типов вложений

**Файл: `src/types/messages.ts`**

Добавить новый тип вложения для Mermaid:
```typescript
export interface Attachment {
  name: string;
  url: string;
  type: string;
  // Новое поле для inline-контента (Mermaid не загружается в storage)
  content?: string;
}
```

#### 2. Новый тип прикреплённого файла с поддержкой Mermaid

**Файл: `src/components/warroom/ChatInputArea.tsx`**

Расширить интерфейс `AttachedFile`:
```typescript
export interface AttachedFile {
  id: string;
  file?: File;           // Обычные файлы
  preview?: string;
  // Для Mermaid-диаграмм (без реального файла)
  mermaidContent?: string;
  mermaidName?: string;
}
```

Изменить зону превью файлов:
- Для обычных файлов — текущее поведение (миниатюра/имя файла)
- Для Mermaid — компонент `MermaidPreview` с названием диаграммы

#### 3. Обновление FileUpload

**Файл: `src/components/warroom/FileUpload.tsx`**

Изменить callbacks:
- `onInsertMermaid` → `onAttachMermaid(content: string, name?: string)`
- Вместо вставки в текст, добавлять в `attachedFiles`

Обработчики:
- **Пустой шаблон**: добавляет шаблон как Mermaid-вложение
- **Из файла**: читает файл и добавляет как Mermaid-вложение
- **Из библиотеки потоков**: конвертирует и добавляет как Mermaid-вложение

#### 4. Обновление ChatInputArea

**Файл: `src/components/warroom/ChatInputArea.tsx`**

Новый callback:
```typescript
const handleAttachMermaid = useCallback((content: string, name?: string) => {
  const newAttachment: AttachedFile = {
    id: `mermaid-${Date.now()}`,
    mermaidContent: content,
    mermaidName: name || 'Diagram',
  };
  onFilesChange(files => [...files, newAttachment]);
}, [onFilesChange]);
```

Обновить рендеринг зоны превью:
```typescript
{attachedFiles.map((attached) => {
  // Mermaid attachment
  if (attached.mermaidContent) {
    return (
      <div key={attached.id} className="relative group">
        <MermaidPreview 
          content={attached.mermaidContent} 
          maxHeight={80} 
          className="w-24"
        />
        <span className="text-[10px] truncate">{attached.mermaidName}</span>
        <button onClick={() => remove(attached.id)}>×</button>
      </div>
    );
  }
  // Regular file attachment
  return <ExistingPreview ... />;
})}
```

#### 5. Обновление useSendMessage

**Файл: `src/hooks/useSendMessage.ts`**

В функции `uploadFiles` добавить обработку Mermaid-вложений:
```typescript
// Mermaid attachments don't need upload - just include content
if (attached.mermaidContent) {
  attachmentUrls.push({
    name: attached.mermaidName || 'Mermaid Diagram',
    url: '', // No URL for inline content
    type: 'text/x-mermaid',
    content: attached.mermaidContent,
  });
  continue;
}
```

#### 6. Обновление AttachmentPreview

**Файл: `src/components/warroom/AttachmentPreview.tsx`**

Добавить рендеринг Mermaid-вложений в истории сообщений:
```typescript
function isMermaidType(type: string): boolean {
  return type === 'text/x-mermaid' || type === 'application/x-mermaid';
}

export function AttachmentPreview({ attachment }: AttachmentPreviewProps) {
  if (isMermaidType(attachment.type) && attachment.content) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button className="w-24 cursor-pointer group">
            <MermaidPreview content={attachment.content} maxHeight={80} />
            <span className="text-xs">{attachment.name}</span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <MermaidBlock content={attachment.content} />
        </DialogContent>
      </Dialog>
    );
  }
  // ... existing image and document handling
}
```

#### 7. Обновление FlowDiagramPickerDialog

**Файл: `src/components/warroom/FlowDiagramPickerDialog.tsx`**

Изменить callback для передачи имени диаграммы:
```typescript
interface FlowDiagramPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mermaidCode: string, diagramName: string) => void;
}

const handleSelect = (diagram) => {
  const mermaidCode = exportToMermaid(diagram.nodes, diagram.edges);
  onSelect(mermaidCode, diagram.name);
  onOpenChange(false);
};
```

---

### Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/types/messages.ts` | Добавить поле `content` в `Attachment` |
| `src/components/warroom/ChatInputArea.tsx` | Расширить `AttachedFile`, добавить превью Mermaid |
| `src/components/warroom/FileUpload.tsx` | Изменить callbacks на attach вместо insert |
| `src/hooks/useSendMessage.ts` | Обработка Mermaid-вложений без upload |
| `src/components/warroom/AttachmentPreview.tsx` | Рендеринг Mermaid в истории с превью |
| `src/components/warroom/FlowDiagramPickerDialog.tsx` | Передавать имя диаграммы в callback |

---

### Результат

После реализации:
- Mermaid-диаграммы прикрепляются как визуальные карточки с превью
- Код диаграммы не засоряет текстовое поле запроса
- Пользователь может написать свой контекстный запрос, ссылаясь на прикреплённую диаграмму
- В истории сообщений диаграммы отображаются с интерактивным превью и возможностью увеличить

