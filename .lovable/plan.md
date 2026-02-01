
# План: Кнопка "Уточнить у Специалиста" при выделении текста

## Задача
При завершении выделения текста в ответах чата над выделенным фрагментом появляется кнопка-иконка "Уточнить у Специалиста", которая отправляет выделенный текст в D-Chat панель.

## Архитектура решения

**Новый компонент:** `TextSelectionPopup` — всплывающая кнопка, появляющаяся над выделенным текстом.

**Поток данных:**
1. Пользователь выделяет текст в AI-сообщении
2. Появляется кнопка "Уточнить у Специалиста"
3. Клик по кнопке → текст передается в D-Chat панель

## Файлы для изменения

### 1. Новый файл: `src/components/warroom/TextSelectionPopup.tsx`

```typescript
// Компонент всплывающей кнопки при выделении текста
// - Слушает событие mouseup для определения выделенного текста
// - Позиционируется над выделением через getBoundingClientRect()
// - Кнопка с иконкой Lightbulb и tooltip "Уточнить у Специалиста"
// - При клике вызывает callback с выделенным текстом
```

**Логика работы:**
- Отслеживает `mouseup` событие внутри контейнера
- Проверяет `window.getSelection()` на наличие выделенного текста
- Вычисляет позицию через `Range.getBoundingClientRect()`
- Показывает кнопку над выделением
- Скрывает при клике вне или изменении выделения

### 2. Изменить: `src/components/warroom/ChatMessage.tsx`

**Добавить:**
- Новый prop `onClarifyWithSpecialist?: (selectedText: string, messageId: string) => void`
- Обернуть контент AI-сообщения в контейнер с `TextSelectionPopup`
- Передавать callback при выделении текста

### 3. Изменить: `src/components/warroom/ChatMessagesList.tsx`

**Добавить:**
- Новый prop `onClarifyWithSpecialist?: (selectedText: string, messageId: string) => void`
- Передавать prop в каждый `ChatMessage`

### 4. Изменить: `src/pages/ExpertPanel.tsx`

**Добавить:**
- Новый handler `handleClarifyWithSpecialist` — формирует контекст и отправляет в D-Chat
- Передавать handler в `ChatMessagesList`

### 5. Изменить: `src/contexts/LanguageContext.tsx`

**Добавить переводы:**
```typescript
'dchat.clarifyWithSpecialist': { 
  ru: 'Уточнить у Специалиста', 
  en: 'Clarify with Specialist' 
}
```

## Техническая реализация

### TextSelectionPopup — ключевая логика:

```typescript
interface TextSelectionPopupProps {
  containerRef: React.RefObject<HTMLElement>;
  onClarify: (text: string) => void;
}

// Состояние:
// - selectedText: string
// - popupPosition: { x: number, y: number } | null

// Эффект для отслеживания выделения:
useEffect(() => {
  const handleMouseUp = (e: MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      setSelectedText(text);
      setPopupPosition({ 
        x: rect.left + rect.width / 2, 
        y: rect.top - 8 
      });
    } else {
      setPopupPosition(null);
    }
  };
  
  container?.addEventListener('mouseup', handleMouseUp);
  return () => container?.removeEventListener('mouseup', handleMouseUp);
}, [containerRef]);
```

### Стилизация popup:
- Абсолютное позиционирование относительно viewport (fixed)
- Анимация появления (fade-in + slide-up)
- Иконка Lightbulb с amber цветом (text-hydra-consultant)
- Tooltip с текстом "Уточнить у Специалиста"

## Результат
- При выделении текста в любом AI-ответе появляется кнопка
- Клик отправляет выделенный фрагмент в D-Chat с контекстом исходного сообщения
- D-Chat разворачивается и готов к уточняющему вопросу
