
# План улучшения связей (edges) в Thought Flow Editor

## Обзор

Расширение функциональности редактора потоков для более гибкой работы со связями между узлами: настройка стилей линий, валидация соединений, визуальная обратная связь и типизация потоков данных.

---

## Основные функции

### 1. Селектор типа линий в тулбаре
Добавление выпадающего меню для выбора стиля связей по умолчанию:
- **Bezier** (плавные кривые)
- **Smoothstep** (ступенчатые скругленные)
- **Step** (ступенчатые прямые)
- **Straight** (прямые линии)

### 2. Типы стрелок (маркеров)
Выбор стиля концевых маркеров:
- Закрытая стрелка (arrow closed)
- Открытая стрелка (arrow)
- Без стрелки
- Двунаправленная стрелка

### 3. Разные стили для прямых и обратных связей
Автоматическое определение направления связи:
- **Прямая связь** (source.x < target.x): сплошная линия, зеленоватый оттенок
- **Обратная связь** (source.x >= target.x): пунктирная линия, оранжевый оттенок

### 4. Цветовое кодирование по типу потока данных
- **Текст** — голубой (#3B82F6)
- **JSON/Объекты** — фиолетовый (#8B5CF6)
- **Файлы** — оранжевый (#F59E0B)
- **Управляющие сигналы** — серый (#6B7280)

---

## Дополнительные функции

### 5. Валидация соединений
Проверка допустимости связей между типами узлов:
- **input** может соединяться только с: prompt, model, transform, filter
- **output** может принимать связи только от: model, transform, api, database
- **model** требует входящую связь от prompt
- И другие логические правила

При недопустимом соединении — визуальная индикация (красная подсветка) и отмена создания связи.

### 6. Панель свойств связи (Edge Properties Panel)
При клике на связь открывается панель редактирования:
- Тип линии (bezier/step/smoothstep/straight)
- Тип потока данных (text/json/file/signal)
- Подпись (label)
- Анимация (вкл/выкл)
- Толщина линии
- Кнопка удаления связи

### 7. Подсветка при наведении
При наведении на связь:
- Связь становится толще и ярче
- Подсвечиваются исходный и целевой узлы
- Отображается tooltip с информацией о связи

---

## Технические детали

### Новые типы данных

```text
// src/types/flow.ts

FlowDataType = 'text' | 'json' | 'file' | 'signal' | 'any'

EdgeLineType = 'bezier' | 'smoothstep' | 'step' | 'straight'

MarkerType = 'arrow' | 'arrowclosed' | 'none' | 'bidirectional'

FlowEdgeData = {
  dataType?: FlowDataType
  label?: string
  animated?: boolean
  strokeWidth?: number
}

ConnectionRule = {
  sourceTypes: FlowNodeType[]
  targetTypes: FlowNodeType[]
  dataType: FlowDataType
}
```

### Новые компоненты

| Компонент | Описание |
|-----------|----------|
| `EdgeStyleSelector` | Выпадающее меню в тулбаре для выбора стиля линий |
| `EdgePropertiesPanel` | Боковая панель редактирования свойств связи |
| `CustomEdge` | Кастомный компонент связи с поддержкой hover и стилей |
| `ConnectionValidator` | Утилита для проверки допустимости соединений |

### Изменяемые файлы

| Файл | Изменения |
|------|-----------|
| `src/types/flow.ts` | Новые типы для edges, data types, connection rules |
| `src/components/flow/FlowCanvas.tsx` | Подключение custom edge, onConnect validation, hover handlers |
| `src/components/flow/FlowToolbar.tsx` | Добавление EdgeStyleSelector |
| `src/components/flow/edges/CustomEdge.tsx` | Новый компонент кастомной связи |
| `src/components/flow/EdgePropertiesPanel.tsx` | Новый компонент панели свойств связи |
| `src/components/flow/connectionRules.ts` | Правила валидации соединений |
| `src/pages/FlowEditor.tsx` | Состояние selectedEdge, обработчики edge events |
| `src/index.css` | Стили для hover эффектов и анимаций |

---

## Логика определения направления связи

```text
function getEdgeDirection(sourceNode, targetNode):
    if sourceNode.position.x < targetNode.position.x:
        return 'forward'   // Прямая связь (слева направо)
    else:
        return 'backward'  // Обратная связь (справа налево или петля)
```

---

## Правила валидации соединений

```text
CONNECTION_RULES:

input    -> [prompt, model, transform, filter, merge, split, embedding]
prompt   -> [model]
model    -> [condition, output, transform, filter, memory, classifier]
condition-> [any] (множественные выходы)
tool     -> [model, output, transform]
transform-> [any]
filter   -> [any]
merge    -> [any]
split    -> [any] (множественные выходы)
database -> [transform, output, model]
api      -> [transform, output, model]
storage  -> [transform, output]
loop     -> [any] (внутри цикла)
delay    -> [any]
switch   -> [any] (множественные выходы)
embedding-> [memory, model, output]
memory   -> [model, output]
classifier-> [condition, switch, output]
output   <- [model, transform, api, database, storage, tool, classifier]
```

---

## Цветовая палитра потоков данных

| Тип | Цвет | CSS переменная |
|-----|------|----------------|
| Text | #3B82F6 | --flow-text |
| JSON | #8B5CF6 | --flow-json |
| File | #F59E0B | --flow-file |
| Signal | #6B7280 | --flow-signal |

---

## Порядок реализации

1. **Типы и правила** — расширение types/flow.ts, создание connectionRules.ts
2. **CustomEdge компонент** — отрисовка связей с учетом стилей и hover
3. **EdgeStyleSelector** — UI в тулбаре для выбора стиля по умолчанию
4. **Валидация onConnect** — проверка допустимости при создании связи
5. **EdgePropertiesPanel** — панель редактирования свойств связи
6. **Подсветка hover** — эффекты при наведении на связь и узлы
7. **Цветовое кодирование** — стили по типу данных

---

## UX/UI особенности

- При невалидном соединении курсор меняется на "not-allowed", связь не создается
- Toast-уведомление с объяснением, почему соединение недопустимо
- Плавные transitions для всех hover-эффектов (200ms)
- Сохранение настроек связей в диаграмме (edges data)
- Локальное хранение предпочтений стиля линий по умолчанию
