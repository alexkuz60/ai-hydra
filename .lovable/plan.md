

## План: Обновление Гидропедии с новой функциональностью Mermaid-диаграмм

### Что добавляем

Документация о новой системе вложения Mermaid-диаграмм, которая была реализована:

1. **Прикрепление диаграмм** — не вставка в текст, а специальный тип вложения
2. **Визуальное превью** — карточки с миниатюрой диаграммы
3. **Увеличение по клику** — полноэкранный просмотр
4. **Кэширование** — оптимизация рендеринга уже просмотренных диаграмм
5. **Три способа добавления**: пустой шаблон, из файла (.mmd), из библиотеки потоков

---

### Технические изменения

#### Файл: `src/content/hydrapedia.ts`

##### 1. Обновление секции "expert-panel" (строки ~282-290)

Расширить таблицу нижней панели ввода, добавив детали о Mermaid:

**Русская версия:**
```markdown
### Система вложений

AI-Hydra поддерживает три типа вложений:

| Тип | Иконка | Описание |
|-----|--------|----------|
| **Изображения** | `Image` | PNG, JPG, GIF, WebP (до 5 шт × 10 МБ) |
| **Документы** | `FileText` | PDF, TXT, MD и другие (до 10 МБ) |
| **Mermaid-диаграммы** | `GitBranch` | Визуальные диаграммы потоков |

### Прикрепление Mermaid-диаграмм

Mermaid-диаграммы прикрепляются как специальные вложения с визуальным превью (не вставляются в текст!). Это позволяет AI-модели анализировать диаграмму, а не объяснять синтаксис Mermaid.

| Элемент | Иконка | Описание |
|---------|--------|----------|
| **Скрепка → Диаграмма Mermaid** | `Paperclip` | Открывает подменю |
| **Пустой шаблон** | `Plus` | Добавляет базовый flowchart |
| **Из файла** | `Upload` | Загрузка .mmd / .mermaid файла |
| **Из библиотеки потоков** | `Folder` | Выбор из сохранённых диаграмм |
| **Карточка-превью** | `GitBranch` | Миниатюра диаграммы |
| **Увеличить** | Клик | Полноэкранный просмотр |
| **Удалить** | `X` | Открепить диаграмму |

> **Важно**: Диаграммы передаются как metadata вложения, поэтому AI видит их структуру, а не сырой код.
```

**Английская версия:**
```markdown
### Attachment System

AI-Hydra supports three types of attachments:

| Type | Icon | Description |
|------|------|-------------|
| **Images** | `Image` | PNG, JPG, GIF, WebP (up to 5 × 10 MB) |
| **Documents** | `FileText` | PDF, TXT, MD and others (up to 10 MB) |
| **Mermaid Diagrams** | `GitBranch` | Visual flow diagrams |

### Attaching Mermaid Diagrams

Mermaid diagrams attach as special attachments with visual preview (not pasted into text!). This allows the AI model to analyze the diagram rather than explain Mermaid syntax.

| Element | Icon | Description |
|---------|------|-------------|
| **Paperclip → Mermaid Diagram** | `Paperclip` | Opens submenu |
| **Empty Template** | `Plus` | Adds basic flowchart |
| **From File** | `Upload` | Upload .mmd / .mermaid file |
| **From Flow Library** | `Folder` | Select from saved diagrams |
| **Preview Card** | `GitBranch` | Diagram thumbnail |
| **Enlarge** | Click | Full-screen view |
| **Remove** | `X` | Detach diagram |

> **Important**: Diagrams are passed as attachment metadata, so AI sees their structure, not raw code.
```

##### 2. Обновление секции "flow-editor" (строки ~1107-1114)

Добавить информацию об интеграции с чатом после раздела "Экспорт":

**Русская версия:**
```markdown
## Интеграция с чатом

Диаграммы из редактора потоков можно прикреплять к запросам в Панели экспертов:

1. Нажмите \`Paperclip\` в поле ввода
2. Выберите **Диаграмма Mermaid** → **Из библиотеки потоков**
3. Наведите на диаграмму для просмотра превью
4. Кликните для прикрепления к сообщению

Диаграмма появится как карточка-превью рядом с полем ввода. AI-модели получат её структуру для анализа.

> **Совет**: Используйте эту функцию для обсуждения архитектуры потоков с AI.
```

**Английская версия:**
```markdown
## Chat Integration

Diagrams from the flow editor can be attached to requests in the Expert Panel:

1. Click \`Paperclip\` in the input field
2. Select **Mermaid Diagram** → **From Flow Library**
3. Hover over a diagram to see preview
4. Click to attach to message

The diagram will appear as a preview card next to the input field. AI models will receive its structure for analysis.

> **Tip**: Use this feature to discuss flow architecture with AI.
```

##### 3. Добавить в секцию "best-practices" (строки ~1455-1463)

Обновить таблицу горячих клавиш:

**Русская версия — добавить строку:**
```markdown
| **Клик на превью Mermaid** | Увеличить до полноэкранного просмотра |
```

**Английская версия — добавить строку:**
```markdown
| **Click on Mermaid preview** | Enlarge to full-screen view |
```

---

### Файлы для изменения

| Файл | Секция | Действие |
|------|--------|----------|
| `src/content/hydrapedia.ts` | `expert-panel` (строки ~282-290) | Добавить систему вложений и Mermaid |
| `src/content/hydrapedia.ts` | `flow-editor` (строки ~1107-1114) | Добавить интеграцию с чатом |
| `src/content/hydrapedia.ts` | `best-practices` (строки ~1455-1463) | Обновить горячие клавиши |

---

### Результат

После обновления пользователи смогут:
- Узнать о системе вложений в Гидропедии
- Понять, как прикреплять Mermaid-диаграммы тремя способами
- Увидеть, что диаграммы из редактора потоков интегрированы с чатом
- Найти информацию о полноэкранном просмотре превью

