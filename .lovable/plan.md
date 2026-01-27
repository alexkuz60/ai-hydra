

## План: Исправление ошибки загрузки изображений из буфера обмена

### Обнаруженная проблема

При вставке изображения из буфера обмена (Ctrl+V), браузер создаёт файл с именем на языке системы пользователя (например, `изображение.png` в русской Windows). Supabase Storage возвращает ошибку:

```
"Invalid key: .../1769507561070_изображение.png"
```

Supabase Storage не принимает кириллические и другие специальные символы в ключах (путях) файлов.

### Решение

Санитизировать имя файла перед загрузкой — заменять все небезопасные символы или генерировать безопасное имя.

### Технические изменения

#### Изменения в `src/pages/ExpertPanel.tsx`

**1. Добавить функцию санитизации имени файла:**

```typescript
function sanitizeFileName(fileName: string): string {
  // Извлечь расширение
  const lastDotIndex = fileName.lastIndexOf('.');
  const ext = lastDotIndex > 0 ? fileName.slice(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
  
  // Транслитерация и замена небезопасных символов
  const safeBaseName = nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Удалить диакритические знаки
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Заменить всё кроме латиницы и цифр
    .replace(/_+/g, '_') // Убрать повторяющиеся подчёркивания
    .replace(/^_|_$/g, '') // Убрать подчёркивания по краям
    || 'file'; // Запасное имя если всё было удалено
  
  return safeBaseName + ext.toLowerCase();
}
```

**2. Применить санитизацию при формировании пути:**

Текущий код:
```typescript
const filePath = `${user.id}/${currentTask.id}/${Date.now()}_${attached.file.name}`;
```

Исправленный:
```typescript
const safeName = sanitizeFileName(attached.file.name);
const filePath = `${user.id}/${currentTask.id}/${Date.now()}_${safeName}`;
```

**3. Для изображений из буфера обмена генерировать уникальное имя:**

В `onPaste` обработчике файлы из буфера обмена часто имеют имя `image.png` или локализованное имя. Можно генерировать имя на основе timestamp:

```typescript
// В onPaste:
for (const file of imageFiles) {
  // Генерируем безопасное имя для clipboard изображений
  const safeName = `clipboard_${Date.now()}.${file.type.split('/')[1] || 'png'}`;
  const renamedFile = new File([file], safeName, { type: file.type });
  
  newFiles.push({
    id: crypto.randomUUID(),
    file: renamedFile,
    preview: URL.createObjectURL(file),
  });
}
```

### Файлы для изменения

| Файл | Действие | Описание |
|------|----------|----------|
| `src/pages/ExpertPanel.tsx` | Изменить | Добавить функцию sanitizeFileName, применить при загрузке и в onPaste |

### Результат

После изменений:
- Изображения из буфера обмена будут иметь безопасные имена (`clipboard_1769507561070.png`)
- Файлы с кириллическими или специальными символами будут корректно загружаться
- Оригинальное имя сохраняется в `metadata.attachments[].name` для отображения пользователю

