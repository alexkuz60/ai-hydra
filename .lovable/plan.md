
# План оптимизации кодовой базы Hydra

## Обзор

Проведён анализ кодовой базы. Выявлены следующие категории проблем:
1. **Дублирование кода** - одинаковые утилиты и константы в разных файлах
2. **Противоречия в типах** - несогласованные определения `MessageRole` 
3. **Избыточная логика** - повторяющиеся паттерны обработки моделей
4. **Отключённая функциональность** - заглушки PDF/DOCX экстракции

---

## 1. Дублирование: `ALL_VALID_MODEL_IDS`

**Проблема:** Константа `ALL_VALID_MODEL_IDS` дублируется в двух файлах:
- `src/pages/Tasks.tsx` (строка 49)
- `src/components/warroom/MultiModelSelector.tsx` (строка 14)

Также дублируются функции `getModelIcon` и `getModelName` в `Tasks.tsx`, хотя аналогичная логика есть в `ModelSelector.tsx` (`PROVIDER_CONFIG`).

**Решение:**
- Вынести `ALL_VALID_MODEL_IDS` в `src/hooks/useAvailableModels.ts` как экспортируемую константу
- Создать утилиты `getModelIcon()` и `getModelDisplayName()` в том же файле
- Обновить импорты в `Tasks.tsx` и `MultiModelSelector.tsx`

---

## 2. Противоречие: Определения `MessageRole`

**Проблема:** Тип `MessageRole` определён в двух местах с **разным** составом ролей:

**`src/types/messages.ts` (строка 5):**
```typescript
export type MessageRole = 'user' | 'assistant' | 'critic' | 'arbiter' | 
  'consultant' | 'moderator' | 'advisor' | 'archivist' | 'analyst' | 'webhunter';
// Отсутствуют: promptengineer, flowregulator
```

**`src/config/roles.ts` (строка 34):**
```typescript
export type MessageRole = 'user' | AgentRole;
// Включает: promptengineer, flowregulator
```

**Решение:**
- Удалить определение `MessageRole` из `src/types/messages.ts`
- Импортировать `MessageRole` из `src/config/roles.ts` (единый источник истины)
- Обновить все импорты в компонентах (`ChatMessage.tsx`, `ChatTreeNav.tsx`)

---

## 3. Дублирование: Логика определения модели в `useSendMessage.ts`

**Проблема:** Одинаковый паттерн подготовки модели повторяется 3 раза:
- `sendMessage()` (строки 210-225)
- `sendToConsultant()` (строки 285-300)
- `retrySingleModel()` (строки 396-421)

Каждый раз выполняется:
```typescript
const isLovable = LOVABLE_AI_MODELS.some(m => m.id === modelId);
const personalModel = PERSONAL_KEY_MODELS.find(m => m.id === modelId);
const settings = perModelSettings[modelId] || DEFAULT_MODEL_SETTINGS;
// ... сборка объекта модели
```

**Решение:**
- Создать приватную функцию `buildModelConfig(modelId, perModelSettings)` внутри хука
- Заменить дублирующийся код вызовами этой функции

---

## 4. Дублирование: Логика определения модели в `useConsultantChat.ts`

**Проблема:** Аналогичный паттерн в строках 89-91:
```typescript
const isLovable = LOVABLE_AI_MODELS.some((m) => m.id === modelId);
const personalModel = PERSONAL_KEY_MODELS.find((m) => m.id === modelId);
```

**Решение:**
- Использовать централизованную утилиту из `useAvailableModels.ts`
- Добавить экспортируемую функцию `getModelInfo(modelId)` возвращающую `{ isLovable, provider, model }`

---

## 5. Заглушки: PDF/DOCX экстракция

**Проблема:** В `hydra-orchestrator/index.ts` функции извлечения текста из документов отключены (строки 83-90):
```typescript
async function extractTextFromPDF(_buffer: ArrayBuffer): Promise<string> {
  console.warn("PDF extraction is temporarily disabled");
  return "[PDF extraction temporarily unavailable]";
}
```

**Решение (опционально):**
- Планируется восстановление — оставить как есть (не влияет на производительность)

---

## 6. Неиспользуемый параметр в ChatMessage

**Проблема:** В `ChatMessage.tsx` импортируется `MessageRole` из types, но также импортируется `ROLE_CONFIG, getRoleConfig` из `config/roles.ts`. Компонент использует `getRoleConfig(message.role)` (строка 126), что уже обрабатывает все роли корректно.

Маппинг `roleCardVariants` (строки 43-54) частично дублирует логику из `getRoleConfig`.

**Решение:**
- Рассмотреть вынос `roleCardVariants` в `config/roles.ts` как часть `RoleConfigItem`
- Добавить поле `cardVariant` в конфигурацию роли

---

## 7. Потенциальная проблема производительности: ModelSelector

**Проблема:** В `MultiModelSelector.tsx` функция `getUnavailableModelIds()` вызывается при каждом рендере (строка 40):
```typescript
const unavailableModelIds = useMemo(() => getUnavailableModelIds(), []);
```

Пустой массив зависимостей означает, что значение вычисляется только один раз при монтировании, но `getUnavailableModelIds()` читает из localStorage синхронно, что может быть неоптимально.

**Решение:**

- Добавить триггер обновления при изменении кэша

---

## План реализации

### Этап 1: Консолидация типов
1. Удалить дублирующееся определение `MessageRole` из `src/types/messages.ts`
2. Обновить импорты в файлах, использующих этот тип

### Этап 2: Централизация модельных утилит
1. Добавить в `useAvailableModels.ts`:
   - `ALL_VALID_MODEL_IDS`
   - `getModelInfo(modelId)`
   - `getModelDisplayName(modelId)`
2. Удалить дублирующийся код из `Tasks.tsx` и `MultiModelSelector.tsx`

### Этап 3: Рефакторинг useSendMessage
1. Создать приватную функцию `buildModelConfig()`
2. Заменить 3 дублирующихся блока одним вызовом

### Этап 4: Очистка заглушек (опционально)
1. Удалить неиспользуемый код PDF/DOCX экстракции или пометить TODO

---

## Затронутые файлы

| Файл | Изменение |
|------|-----------|
| `src/hooks/useAvailableModels.ts` | Добавление утилит |
| `src/types/messages.ts` | Удаление дублирующегося типа |
| `src/pages/Tasks.tsx` | Рефакторинг импортов |
| `src/components/warroom/MultiModelSelector.tsx` | Рефакторинг импортов |
| `src/hooks/useSendMessage.ts` | Выделение `buildModelConfig()` |
| `src/hooks/useConsultantChat.ts` | Использование централизованной утилиты |
| `src/components/warroom/ChatMessage.tsx` | Обновление импорта MessageRole |
| `src/components/warroom/ChatTreeNav.tsx` | Обновление импорта MessageRole |

---

## Ожидаемый результат

- Сокращение дублирующегося кода на ~50 строк
- Единый источник истины для типов ролей
- Упрощение поддержки при добавлении новых моделей/ролей
- Улучшение читаемости `useSendMessage.ts`
