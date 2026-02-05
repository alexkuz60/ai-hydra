

## Коллапсируемые секции запроса с изменяемым размером

### Обзор
Добавление сворачиваемых секций ввода с шевронами и возможностью изменения высоты для обоих чатов: основной панели экспертов и D-чата (консультант). Настройки размера будут сохраняться в localStorage.

---

### Поведение UI

**Состояния секции:**
- **Развёрнута** — отображает textarea + тулбар, шеврон смотрит вниз
- **Свёрнута** — скрывает textarea, шеврон смотрит вверх, показывает компактную строку с подсказкой

**Изменение размера:**
- Резиновый ресайз высоты textarea через `ResizablePanelGroup` с вертикальным направлением
- Минимальная высота: 60px (текущая)
- Максимальная высота: ~300px
- Сохранение последнего размера в localStorage отдельно для каждого чата

---

### Технический план

#### 1. Создание хука `useInputAreaSize`

Новый файл: `src/hooks/useInputAreaSize.ts`

```text
┌─────────────────────────────────────────────────────┐
│ useInputAreaSize(storageKey: string)                │
├─────────────────────────────────────────────────────┤
│ • height: number (в пикселях или %)                 │
│ • isCollapsed: boolean                              │
│ • setHeight: (h: number) => void                    │
│ • toggleCollapsed: () => void                       │
│ • Персистенция в localStorage                       │
└─────────────────────────────────────────────────────┘
```

Ключи localStorage:
- `hydra-main-input-height` — основной чат
- `hydra-dchat-input-height` — D-чат

#### 2. Модификация `ChatInputArea.tsx`

**Изменения:**
- Обернуть секцию в `Collapsible` из Radix
- Добавить кнопку-шеврон в заголовок секции
- Интегрировать вертикальный `ResizablePanelGroup` для textarea
- Принимать новые пропсы: `isCollapsed`, `onToggleCollapse`, `height`, `onHeightChange`

**Визуальная структура развёрнутого состояния:**
```text
┌────────────────────────────────────────────────────────────────┐
│ [▼ Chevron]  [FileUpload] [Timeout] [PromptEng]  ─── Header    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Textarea (resizable height)                                  │
│                                                                │
├────═══════════════════════════════════════════════════════════─┤ ← resize handle
│                                                         [Send] │
└────────────────────────────────────────────────────────────────┘
```

**Свёрнутое состояние:**
```text
┌────────────────────────────────────────────────────────────────┐
│ [▲]  "Нажмите для ввода сообщения..."              [Send]      │
└────────────────────────────────────────────────────────────────┘
```

#### 3. Модификация `ConsultantPanel.tsx`

**Изменения:**
- Аналогичная обёртка секции ввода в `Collapsible`
- Добавить кнопку-шеврон между заголовком и textarea
- Интегрировать вертикальный ресайз
- Использовать `useInputAreaSize` с ключом `'hydra-dchat-input-height'`

#### 4. Обновление `ExpertPanel.tsx`

**Изменения:**
- Добавить состояние и хук для основного чата
- Передать пропсы в `ChatInputArea`

---

### Компоненты и зависимости

| Компонент | Новые пропсы | Зависимости |
|-----------|-------------|-------------|
| `ChatInputArea` | `isCollapsed`, `onToggleCollapse`, `height`, `onHeightChange` | `Collapsible`, `ResizablePanelGroup` |
| `ConsultantPanel` | — (внутреннее состояние) | `useInputAreaSize` |
| `ExpertPanel` | — | `useInputAreaSize` |

---

### Детали реализации

**Анимация Collapsible:**
- Использовать `CollapsibleContent` с встроенной анимацией Radix
- Шеврон анимируется через `rotate-180` при смене состояния

**Ресайз высоты:**
- Вертикальный `ResizablePanelGroup` с `direction="vertical"`
- Верхняя панель — сообщения/контент, нижняя — инпут
- `onResize` сохраняет в localStorage через `useInputAreaSize`

**Локализация:**
- `expertPanel.collapseInput` / `expertPanel.expandInput`
- `dchat.collapseInput` / `dchat.expandInput`

---

### Файлы для изменения

1. **Создать:** `src/hooks/useInputAreaSize.ts`
2. **Изменить:** `src/components/warroom/ChatInputArea.tsx`
3. **Изменить:** `src/components/warroom/ConsultantPanel.tsx`  
4. **Изменить:** `src/pages/ExpertPanel.tsx`

