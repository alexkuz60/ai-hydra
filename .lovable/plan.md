
# План: Добавление поддержки HTTP API вызовов в пользовательских инструментах

## Обзор

Расширение системы пользовательских инструментов для поддержки HTTP API вызовов в дополнение к существующим Prompt-шаблонам. Пользователи смогут создавать инструменты, которые вызывают внешние API и возвращают результаты моделям.

## Архитектура решения

```text
+------------------+     +-------------------+     +------------------+
|  ToolsLibrary    |     |  hydra-orchestrator|     |  External API    |
|  (Frontend)      |---->|  (Edge Function)   |---->|  (User-defined)  |
+------------------+     +-------------------+     +------------------+
        |                        |                         |
   Создание/                 Выполнение                Ответ API
   редактирование            HTTP запроса              (JSON/text)
   инструмента               с подстановкой
                             параметров
```

## Изменения

### 1. База данных (миграция)

Добавление новых колонок в таблицу `custom_tools`:

| Колонка | Тип | Описание |
|---------|-----|----------|
| `tool_type` | text | Тип инструмента: 'prompt' или 'http_api' |
| `http_config` | jsonb | Конфигурация HTTP запроса |

Структура `http_config`:
```json
{
  "url": "https://api.example.com/endpoint",
  "method": "GET | POST | PUT | DELETE",
  "headers": { "X-Custom-Header": "value" },
  "body_template": "{\"param\": \"{{value}}\"}",
  "response_path": "data.result"
}
```

### 2. Frontend: ToolsLibrary.tsx

Обновление формы создания/редактирования:
- Добавление переключателя типа инструмента (Prompt-шаблон / HTTP API)
- При выборе HTTP API отображение полей:
  - URL с поддержкой плейсхолдеров `{{param}}`
  - Метод HTTP (GET, POST, PUT, DELETE)
  - Заголовки (редактор ключ-значение)
  - Шаблон тела запроса (для POST/PUT)
  - JSONPath для извлечения результата из ответа

### 3. Backend: hydra-orchestrator/tools.ts

Расширение логики выполнения:
- Обновление интерфейса `CustomToolDefinition` для включения `tool_type` и `http_config`
- Создание функции `executeHttpApiTool`:
  - Подстановка параметров в URL, заголовки и тело запроса
  - Выполнение HTTP запроса с таймаутом
  - Извлечение данных по JSONPath из ответа
  - Форматирование результата для модели
- Обновление роутера `executeToolCall` для обработки HTTP API инструментов

### 4. Backend: hydra-orchestrator/index.ts

Обновление передачи данных:
- Передача `tool_type` и `http_config` при загрузке инструментов из базы
- Обновление типа `CustomToolDef` для новых полей

## Детали реализации

### Безопасность HTTP вызовов

- Таймаут запроса: 30 секунд
- Максимальный размер ответа: 100KB
- Запрет на вызов внутренних адресов (localhost, 127.0.0.1, 10.x.x.x, 192.168.x.x)
- Логирование всех HTTP вызовов для аудита

### Подстановка параметров

Параметры подставляются в:
- URL: `https://api.example.com/users/{{user_id}}`
- Заголовки: `{"Authorization": "Bearer {{api_key}}"}`
- Тело запроса: `{"query": "{{search_term}}"}`

### Извлечение результата (JSONPath)

Упрощённая реализация JSONPath для извлечения данных:
- `data` - весь объект data
- `data.items` - вложенное поле
- `data.items[0]` - первый элемент массива
- `data.items[0].name` - поле первого элемента

### Пример использования

Инструмент "Погода":
- URL: `https://api.weatherapi.com/v1/current.json?q={{city}}`
- Метод: GET
- Заголовки: `{"X-Api-Key": "{{weather_api_key}}"}`
- Response path: `current.condition.text`

## Порядок изменения файлов

1. Миграция БД для добавления колонок
2. `src/integrations/supabase/types.ts` - обновится автоматически
3. `src/pages/ToolsLibrary.tsx` - UI для HTTP конфигурации
4. `src/hooks/useCustomTools.ts` - типы и загрузка новых полей
5. `supabase/functions/hydra-orchestrator/tools.ts` - логика HTTP вызовов
6. `supabase/functions/hydra-orchestrator/index.ts` - передача http_config

## Техническая информация

### Новые типы TypeScript

```typescript
type ToolType = 'prompt' | 'http_api';

interface HttpConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body_template?: string;
  response_path?: string;
}

interface CustomTool {
  // существующие поля...
  tool_type: ToolType;
  http_config: HttpConfig | null;
}
```

### Функция executeHttpApiTool

```typescript
async function executeHttpApiTool(
  toolName: string, 
  args: Record<string, unknown>,
  config: HttpConfig
): Promise<string> {
  // 1. Подстановка параметров
  // 2. Валидация URL (блокировка внутренних адресов)
  // 3. Выполнение запроса с таймаутом
  // 4. Извлечение результата по response_path
  // 5. Возврат JSON результата
}
```

## Ожидаемый результат

После реализации пользователи смогут:
1. Создавать инструменты двух типов через единый интерфейс
2. Подключать любые REST API как инструменты для AI моделей
3. Модели будут автоматически вызывать API и получать актуальные данные
