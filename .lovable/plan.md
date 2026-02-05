
# План: Унификация размеров кнопок по стандарту Flow Editor

## Проблема

На скриншоте показан референс — компактная панель инструментов Flow Editor с кнопками:
- `h-7` для header-кнопок (Open, Save, New, Export)
- `h-8` для toolbar-кнопок (Undo/Redo, Play/Stop)
- `size="sm"` для dropdown-триггеров (Auto Layout, Edge Style)

В других частях интерфейса используются **несогласованные размеры**:

| Компонент | Текущий размер | Проблема |
|-----------|---------------|----------|
| `UnifiedSendButton` | `size="lg"` (h-11) | Слишком большие кнопки отправки |
| `PromptEngineerButton` | `h-10 w-10` | Иконка 10×10 вместо 9×9 |
| `ConsultantSelector` | `h-9` | Близко к стандарту |
| `TimeoutSlider` | `h-9` | Близко к стандарту |
| `FileUpload` | `h-9 w-9` | Близко к стандарту |
| `Index.tsx` (CTA) | `size="lg"` | Допустимо для landing page |

## Целевой стандарт

Основываясь на FlowToolbar и принципе высокой плотности UI:

```
┌─────────────────────────────────────────────────────┐
│ Header Actions (Layout header slot)                │
│ → size="sm" + h-7 text-xs                         │
│ → icon-only buttons: h-7 w-7                      │
├─────────────────────────────────────────────────────┤
│ Toolbar / Input Area                               │
│ → size="sm" + h-8 (стандартные кнопки)             │
│ → icon-only buttons: h-8 w-8 или h-9 w-9          │
├─────────────────────────────────────────────────────┤
│ Landing Page CTA                                   │
│ → size="lg" — допустимо для привлечения внимания  │
└─────────────────────────────────────────────────────┘
```

## Изменения

### 1. UnifiedSendButton.tsx
- Заменить `size="lg"` → `size="sm"` с `h-9`
- Уменьшить иконки с `h-5 w-5` до `h-4 w-4`
- Сделать dropdown-триггер компактным (`px-2 h-9`)

### 2. PromptEngineerButton.tsx
- Заменить `h-10 w-10` → `h-9 w-9`
- Уменьшить иконку с `h-5 w-5` до `h-4 w-4`

### 3. ConsultantSelector.tsx
- Уже близок к стандарту (`h-9`)
- Унифицировать стиль с другими селекторами

### 4. FileUpload.tsx
- Уже использует `h-9 w-9` ✓

### 5. TimeoutSlider.tsx
- Уже использует `h-9` ✓

### 6. Index.tsx (Landing)
- Оставить `size="lg"` для CTA кнопок — это маркетинговая страница
- Большие кнопки уместны для привлечения внимания

## Технические детали

### Файлы для изменения

1. **`src/components/warroom/UnifiedSendButton.tsx`**
   - Строки 70, 86, 140, 156: `size="lg"` → `size="sm"` + `className="h-9"`
   - Иконки: `h-5 w-5` → `h-4 w-4`

2. **`src/components/warroom/PromptEngineerButton.tsx`**
   - Строка 192-194: `h-10 w-10` → `h-9 w-9`
   - Строка 197: `h-5 w-5` → `h-4 w-4`

### Примеры кода

**UnifiedSendButton (до):**
```tsx
<Button
  onClick={onSendToAll}
  disabled={disabled}
  className="hydra-glow-sm rounded-r-none"
  size="lg"
>
  <Loader2 className="h-5 w-5 animate-spin" />
```

**UnifiedSendButton (после):**
```tsx
<Button
  onClick={onSendToAll}
  disabled={disabled}
  className="hydra-glow-sm rounded-r-none h-9"
  size="sm"
>
  <Loader2 className="h-4 w-4 animate-spin" />
```

## Результат

После изменений все интерактивные элементы в области ввода чата будут иметь единообразную высоту `h-9` (36px), что соответствует стилю `size="sm"` в button.tsx и создаёт визуально сбалансированный, компактный интерфейс.
