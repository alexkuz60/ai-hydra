
## План: Валидация входных данных при запуске потока

### Что делаем
При нажатии кнопки "Запуск" проверяем:
1. Есть ли в диаграмме хотя бы один узел типа `input`
2. Заполнены ли входные данные в этом узле

Если проверка не пройдена - показываем toast с сообщением:
> "Пустой запрос — пустой ответ.
> Заполните входные данные в настройках блока"

### Изменения

**1. NodePropertiesPanel.tsx - добавить поле для ввода данных**

В форме свойств узла `input` добавить текстовое поле `inputValue` для ввода начальных данных, которые будут переданы в пайплайн:
- Поле `Textarea` с плейсхолдером "Введите данные для передачи в поток..."
- Сохранение в `node.data.inputValue`

**2. FlowEditor.tsx - валидация перед запуском**

В функции `handleStartExecution` добавить проверку:
- Найти все узлы типа `input` 
- Проверить, есть ли хотя бы один такой узел
- Проверить, что хотя бы один `input`-узел имеет непустое значение `inputValue` в `data`
- При провале валидации - показать toast и прервать запуск

**3. LanguageContext.tsx - локализация**

Добавить строки:
- `flowEditor.emptyInputTitle`: "Пустой запрос — пустой ответ" / "Empty request — empty response"
- `flowEditor.emptyInputDescription`: "Заполните входные данные в настройках блока" / "Fill in input data in block settings"
- `flowEditor.properties.inputValue`: "Входные данные" / "Input data"
- `flowEditor.properties.inputValuePlaceholder`: "Введите данные для передачи в поток..." / "Enter data to pass to the flow..."

**4. useFlowRuntime.ts - передача данных**

При вызове `startFlow` собирать данные из `input`-узлов и передавать их как параметр `input`.

---

### Техническая часть

```
┌─────────────────────────────────────────────────────────┐
│                    handleStartExecution                  │
├─────────────────────────────────────────────────────────┤
│ 1. nodes.filter(n => n.type === 'input')                │
│ 2. Проверить inputNodes.length > 0                      │
│ 3. Проверить inputNodes.some(n => n.data.inputValue)   │
│ 4. Если false → toast + return                          │
│ 5. Собрать inputData из всех input-узлов               │
│ 6. flowRuntime.startFlow(id, session, inputData)        │
└─────────────────────────────────────────────────────────┘
```

**Формат входных данных:**
```typescript
const inputData = inputNodes.reduce((acc, node) => ({
  ...acc,
  [node.id]: node.data.inputValue || '',
  input: node.data.inputValue || '', // fallback для единственного входа
}), {});
```

