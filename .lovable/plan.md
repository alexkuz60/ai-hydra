
## План: Подменю вставки Mermaid-диаграмм

### Описание
Расширение пункта меню "Диаграмма Mermaid" в выпадающем списке скрепки, преобразование его в подменю с двумя опциями:
1. **Из файла** — загрузка `.mmd` / `.mermaid` файлов
2. **Из библиотеки потоков** — выбор диаграммы, созданной в Редакторе потоков Гидры

### Структура меню

```text
📎 Скрепка
├── Все файлы (JPG, PNG, ...)
├── ───────────
├── Изображения (JPG, PNG, ...)
├── Документы (PDF, DOCX, ...)
├── ───────────
└── 🔀 Диаграмма Mermaid  →
    ├── 📝 Пустой шаблон (текущее поведение)
    ├── 📄 Из файла (.mmd, .mermaid)
    └── 📊 Из библиотеки потоков...
```

---

### Технические изменения

#### 1. Обновление `FileUpload.tsx`

**Новые импорты:**
- `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent` из UI-компонентов
- `ChevronRight`, `FileCode`, `Workflow`, `FileEdit` иконки из Lucide

**Изменение структуры меню:**
- Заменить `DropdownMenuItem` для Mermaid на `DropdownMenuSub`
- Добавить три подпункта:
  - **Пустой шаблон** — вставляет текущий `MERMAID_TEMPLATE`
  - **Из файла** — открывает file picker с `accept=".mmd,.mermaid"`
  - **Из библиотеки потоков** — вызывает callback `onSelectFlowDiagram`

**Новые пропсы:**
```typescript
interface FileUploadProps {
  // ...existing props
  onSelectFlowDiagram?: () => void;  // Открытие диалога выбора диаграммы
}
```

**Новый ref для mermaid-файлов:**
```typescript
const mermaidInputRef = useRef<HTMLInputElement>(null);
```

**Обработчик загрузки mermaid-файла:**
```typescript
const handleMermaidFileLoad = useCallback((files: FileList | null) => {
  if (!files?.[0]) return;
  const file = files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    if (content && onInsertMermaid) {
      // Вставка содержимого файла как mermaid-блока
      const mermaidCode = content.includes('```mermaid') 
        ? content 
        : `\`\`\`mermaid\n${content}\n\`\`\``;
      onInsertMermaidContent?.(mermaidCode);
    }
  };
  reader.readAsText(file);
}, [onInsertMermaidContent]);
```

#### 2. Новый компонент: `FlowDiagramPickerDialog.tsx`

Диалог для выбора диаграммы из библиотеки потоков:

```typescript
interface FlowDiagramPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mermaidCode: string) => void;
}
```

**Функциональность:**
- Использует `useFlowDiagrams()` для получения списка диаграмм
- Отображает список с названием и датой обновления
- При выборе вызывает `exportToMermaid(diagram.nodes, diagram.edges)`
- Оборачивает результат в markdown-блок и передаёт в callback

**UI:**
- Dialog с заголовком "Выбор диаграммы"
- Список карточек диаграмм с превью (название, описание, дата)
- Кнопка закрытия
- Состояние загрузки / пустой список

#### 3. Обновление `ChatInputArea.tsx`

**Новый state:**
```typescript
const [flowPickerOpen, setFlowPickerOpen] = useState(false);
```

**Новые callbacks:**
```typescript
const handleInsertMermaidContent = useCallback((content: string) => {
  const prefix = input.trim() ? input + '\n\n' : '';
  onInputChange(prefix + content);
}, [input, onInputChange]);

const handleFlowDiagramSelect = useCallback((mermaidCode: string) => {
  handleInsertMermaidContent(mermaidCode);
  setFlowPickerOpen(false);
}, [handleInsertMermaidContent]);
```

**Добавление в JSX:**
```jsx
<FileUpload
  // ...existing props
  onInsertMermaidContent={handleInsertMermaidContent}
  onSelectFlowDiagram={() => setFlowPickerOpen(true)}
/>
<FlowDiagramPickerDialog
  open={flowPickerOpen}
  onOpenChange={setFlowPickerOpen}
  onSelect={handleFlowDiagramSelect}
/>
```

#### 4. Обновление `LanguageContext.tsx`

Новые ключи перевода:
```typescript
'files.mermaidTemplate': { ru: 'Пустой шаблон', en: 'Empty Template' },
'files.mermaidFromFile': { ru: 'Из файла', en: 'From File' },
'files.mermaidFromFlow': { ru: 'Из библиотеки потоков', en: 'From Flow Library' },
'files.mermaidFileHint': { ru: '.mmd, .mermaid', en: '.mmd, .mermaid' },
'flow.pickDiagram': { ru: 'Выбор диаграммы', en: 'Select Diagram' },
'flow.noDiagrams': { ru: 'Нет сохранённых диаграмм', en: 'No saved diagrams' },
'flow.createFirst': { ru: 'Создайте первую в Редакторе потоков', en: 'Create one in Flow Editor' },
```

---

### Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/components/warroom/FileUpload.tsx` | Добавить подменю Mermaid, обработчик файлов |
| `src/components/warroom/ChatInputArea.tsx` | Добавить state и callbacks для диалога |
| `src/components/warroom/FlowDiagramPickerDialog.tsx` | **Создать** — диалог выбора диаграммы |
| `src/contexts/LanguageContext.tsx` | Добавить ключи переводов |

---

### Результат

После реализации пользователь сможет:
- Кликнуть на скрепку → Диаграмма Mermaid → выбрать один из трёх вариантов
- Загрузить готовый `.mmd` файл и вставить его содержимое в поле ввода
- Выбрать диаграмму из библиотеки потоков и автоматически сконвертировать её в Mermaid-синтаксис
