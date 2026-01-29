

# План: Tool Calling (Function Calling) в hydra-orchestrator

## Обзор

Добавление поддержки вызова внешних инструментов (Tool Calling) позволит AI-моделям в AI-Hydra выполнять действия: веб-поиск, вычисления, обращение к API и другие операции во время генерации ответа.

## Архитектура решения

```text
┌─────────────────┐     ┌────────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│  hydra-orchestrator │────▶│   AI Model      │
│  (ExpertPanel)  │     │                    │     │  (with tools)   │
└─────────────────┘     └────────┬───────────┘     └────────┬────────┘
                                 │                          │
                                 │  ◀── tool_calls ─────────┘
                                 │
                        ┌────────▼───────────┐
                        │   Tool Executor    │
                        │  ┌───────────────┐ │
                        │  │ Web Search    │ │
                        │  │ Calculator    │ │
                        │  │ Code Execute  │ │
                        │  │ External API  │ │
                        │  └───────────────┘ │
                        └────────────────────┘
```

## Фазы реализации

### Фаза 1: Базовая инфраструктура Tool Calling

**1.1. Типы и интерфейсы для инструментов**

Создать файл определений инструментов с поддержкой:
- `ToolDefinition` - схема инструмента (name, description, parameters)
- `ToolCall` - запрос на вызов от модели
- `ToolResult` - результат выполнения

**1.2. Обновление hydra-orchestrator**

Модифицировать функции `callLovableAI` и `callPersonalModel`:
- Добавить параметр `tools` в запросы к API
- Обработать ответы с `tool_calls` 
- Реализовать цикл: запрос → tool_calls → выполнение → продолжение

**1.3. Tool Executor**

Создать исполнитель инструментов:
```text
executeTools(toolCalls) → Promise<ToolResult[]>
```

### Фаза 2: Встроенные инструменты

**2.1. Калькулятор (`calculator`)**
- Безопасное вычисление математических выражений
- Поддержка базовых и научных операций

**2.2. Текущая дата/время (`current_datetime`)**
- Возврат текущего времени в разных форматах
- Поддержка часовых поясов

**2.3. Веб-поиск (`web_search`)** (опционально)
- Интеграция с API поиска (Tavily, SerpAPI)
- Требует настройки API-ключа

### Фаза 3: UI и отображение

**3.1. Обновление типа Message**

Расширить `metadata` для хранения информации о tool calls:
```typescript
metadata: {
  tool_calls?: ToolCall[];
  tool_results?: ToolResult[];
}
```

**3.2. Компонент ToolCallDisplay**

Создать компонент для отображения:
- Иконка и название инструмента
- Параметры вызова
- Результат выполнения
- Статус (выполняется/завершён/ошибка)

**3.3. Интеграция в ChatMessage**

Обновить ChatMessage для рендеринга tool calls между блоками текста.

---

## Технические детали

### Изменения в файлах

| Файл | Изменение |
|------|-----------|
| `supabase/functions/hydra-orchestrator/index.ts` | Добавить tools в API-запросы, реализовать цикл обработки tool_calls |
| `supabase/functions/hydra-orchestrator/tools.ts` | Новый файл: определения и исполнители инструментов |
| `src/types/messages.ts` | Расширить типы для tool_calls |
| `src/components/warroom/ToolCallDisplay.tsx` | Новый компонент отображения |
| `src/components/warroom/ChatMessage.tsx` | Интеграция ToolCallDisplay |

### Формат Tool Calling (OpenAI-совместимый)

```typescript
// Запрос к API
{
  tools: [{
    type: "function",
    function: {
      name: "calculator",
      description: "Evaluate mathematical expressions",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string" }
        },
        required: ["expression"]
      }
    }
  }]
}

// Ответ с tool_call
{
  choices: [{
    message: {
      tool_calls: [{
        id: "call_123",
        type: "function",
        function: {
          name: "calculator",
          arguments: '{"expression": "2+2*3"}'
        }
      }]
    }
  }]
}
```

### Цикл обработки в orchestrator

```text
1. Отправить запрос с tools
2. Если ответ содержит tool_calls:
   a. Выполнить каждый tool call
   b. Собрать результаты
   c. Отправить новый запрос с tool results
   d. Повторить с шага 2
3. Вернуть финальный ответ
```

### Ограничения безопасности

- Максимум 5 итераций tool calling (защита от бесконечных циклов)
- Таймаут на выполнение инструмента: 30 секунд
- Валидация входных параметров через JSON Schema
- Логирование всех вызовов для аудита

---

## Порядок реализации

1. **Шаг 1**: Создать `tools.ts` с типами и базовыми инструментами (calculator, datetime)
2. **Шаг 2**: Обновить `hydra-orchestrator/index.ts` - добавить tools в запросы
3. **Шаг 3**: Реализовать цикл обработки tool_calls
4. **Шаг 4**: Создать `ToolCallDisplay.tsx` компонент
5. **Шаг 5**: Обновить `ChatMessage.tsx` для отображения tool calls
6. **Шаг 6**: Расширить типы в `src/types/messages.ts`

## Ожидаемый результат

После реализации AI-модели смогут:
- Выполнять вычисления ("Посчитай 15% от 2500")
- Узнавать текущее время ("Который сейчас час в Токио?")
- Расширяться новыми инструментами через конфигурацию

