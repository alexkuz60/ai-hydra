import type { HydrapediaSection } from './types';

export const flowSections: HydrapediaSection[] = [
  {
    id: 'flow-editor',
    titleKey: 'hydrapedia.sections.flowEditor',
    icon: 'GitBranch',
    content: {
      ru: `# Flow Editor

Flow Editor — визуальный редактор для проектирования логических цепочек ИИ. Позволяет создавать сложные пайплайны обработки данных с использованием узлов и связей.

## Типы узлов

| Узел | Назначение |
|------|-----------|
| Input | Точка входа данных |
| Output | Точка выхода результата |
| Model | Вызов ИИ-модели |
| Prompt | Системный промпт для модели |
| Condition | Ветвление по условию |
| Switch | Множественное ветвление |
| Loop | Циклическая обработка |
| Split | Разделение данных |
| Merge | Объединение потоков |
| Filter | Фильтрация данных |
| Transform | Преобразование данных |
| API | Вызов внешнего API |
| Database | Запрос к базе данных |
| Storage | Работа с файлами |
| Delay | Задержка выполнения |
| Memory | Доступ к памяти |
| Embedding | Генерация эмбеддингов |
| Classifier | Классификация входных данных |
| Group | Контейнер для организации узлов |
| Tool | Вызов инструмента из библиотеки |

## Связи между узлами

Связи имеют цветовую кодировку:
- 🔵 **Текст** — текстовые данные
- 🟢 **JSON** — структурированные данные
- 🟡 **Файлы** — бинарные данные
- 🔴 **Сигналы** — управляющие сигналы
- 🟠 **Обратные связи** — пунктирная линия (циклические)

## Функции редактора

- **Автоматическая раскладка** (Dagre) — упорядочивание узлов
- **Undo/Redo** — до 50 шагов отмены
- **Экспорт** — сохранение диаграмм в JSON
- **Группировка** — контейнеры с настраиваемым цветом и размером
- **Валидация** — проверка корректности соединений
- **Автосохранение** — последняя диаграмма загружается при старте`,
      en: `# Flow Editor

Flow Editor — a visual editor for designing AI logic chains. It allows creating complex data processing pipelines using nodes and connections.

## Node Types

| Node | Purpose |
|------|---------|
| Input | Data entry point |
| Output | Result output point |
| Model | AI model invocation |
| Prompt | System prompt for model |
| Condition | Conditional branching |
| Switch | Multiple branching |
| Loop | Cyclic processing |
| Split | Data splitting |
| Merge | Stream merging |
| Filter | Data filtering |
| Transform | Data transformation |
| API | External API call |
| Database | Database query |
| Storage | File operations |
| Delay | Execution delay |
| Memory | Memory access |
| Embedding | Embedding generation |
| Classifier | Input classification |
| Group | Container for organizing nodes |
| Tool | Tool invocation from library |

## Node Connections

Connections are color-coded:
- 🔵 **Text** — text data
- 🟢 **JSON** — structured data
- 🟡 **Files** — binary data
- 🔴 **Signals** — control signals
- 🟠 **Feedback** — dashed line (cyclic)

## Editor Features

- **Auto-layout** (Dagre) — node arrangement
- **Undo/Redo** — up to 50 undo steps
- **Export** — saving diagrams as JSON
- **Grouping** — containers with customizable color and size
- **Validation** — connection correctness checking
- **Auto-save** — last diagram loads on startup`,
    },
  },
  {
    id: 'flow-editor-guide',
    titleKey: 'hydrapedia.sections.flowEditorGuide',
    icon: 'GitBranch',
    content: {
      ru: `# Руководство по Flow Editor

## Создание диаграммы

1. Откройте **Flow Editor** в боковом меню
2. Перетащите узлы из боковой панели на холст
3. Соедините выходы одного узла со входами другого
4. Настройте свойства каждого узла в правой панели

## Стили связей

Доступные типы:
- **Bezier** — плавные кривые (по умолчанию)
- **Step** — прямоугольные соединения
- **Smooth Step** — скруглённые прямоугольные
- **Straight** — прямые линии

## Runtime

Flow Editor поддерживает выполнение диаграмм через бэкенд:
- Запуск пайплайна с заданными входными данными
- Визуализация выполнения (подсветка активных узлов)
- Логирование результатов каждого шага
- Обработка ошибок с отображением в UI

## Логистика потоков

Модуль логистики анализирует структуру диаграммы:
- Проверка циклических зависимостей
- Оценка сложности пайплайна
- Рекомендации по оптимизации
- Выявление узких мест

## Советы

- Используйте **Group** для организации связанных узлов
- Добавляйте **Memory** узлы для сохранения контекста между вызовами
- **Condition** узлы позволяют создавать адаптивные пайплайны
- Регулярно сохраняйте диаграммы (\`Ctrl+S\`)`,
      en: `# Flow Editor Guide

## Creating a Diagram

1. Open **Flow Editor** from the sidebar
2. Drag nodes from the side panel onto the canvas
3. Connect outputs of one node to inputs of another
4. Configure each node's properties in the right panel

## Connection Styles

Available types:
- **Bezier** — smooth curves (default)
- **Step** — rectangular connections
- **Smooth Step** — rounded rectangular
- **Straight** — straight lines

## Runtime

Flow Editor supports diagram execution via the backend:
- Running pipelines with specified input data
- Execution visualization (highlighting active nodes)
- Logging results of each step
- Error handling with UI display

## Flow Logistics

The logistics module analyzes diagram structure:
- Cyclic dependency checking
- Pipeline complexity assessment
- Optimization recommendations
- Bottleneck identification

## Tips

- Use **Group** to organize related nodes
- Add **Memory** nodes to preserve context between calls
- **Condition** nodes allow creating adaptive pipelines
- Regularly save diagrams (\`Ctrl+S\`)`,
    },
  },
];
