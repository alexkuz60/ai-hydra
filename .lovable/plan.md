

## План: Автоматический множитель токенов для thinking-моделей

### Цель
Предотвратить обрезание сообщений от моделей с Extended Thinking (gemini-2.5-pro, gpt-5 и др.), автоматически увеличивая лимит токенов.

---

### Изменения в файле

**Файл:** `supabase/functions/hydra-orchestrator/index.ts`

#### 1. Добавить константы после строки 52

```typescript
// Thinking models that use reasoning tokens (need higher limits)
const THINKING_MODELS = [
  'google/gemini-2.5-pro',
  'google/gemini-3-pro-preview',
  'openai/gpt-5',
  'openai/gpt-5.2',
];

// Multiplier for thinking models (reasoning consumes ~80-90% of tokens)
const THINKING_MODEL_TOKEN_MULTIPLIER = 4;
```

#### 2. Модифицировать расчёт токенов (строки 462-467)

**Было:**
```typescript
// Use per-model settings or defaults
const temperature = modelReq.temperature ?? 0.7;
const maxTokens = modelReq.max_tokens ?? 2048;
const role = modelReq.role ?? 'assistant';
const systemPrompt = modelReq.system_prompt || defaultPrompts[role] || defaultPrompts.assistant;

console.log(`Starting request for model: ${modelReq.model_id}, role: ${role}, temp: ${temperature}`);
```

**Станет:**
```typescript
// Use per-model settings or defaults
const temperature = modelReq.temperature ?? 0.7;
const role = modelReq.role ?? 'assistant';
const systemPrompt = modelReq.system_prompt || defaultPrompts[role] || defaultPrompts.assistant;

// Check if this is a thinking model that needs more tokens
const isThinkingModel = THINKING_MODELS.some(tm => modelReq.model_id.includes(tm));
const baseMaxTokens = modelReq.max_tokens ?? 2048;
const maxTokens = isThinkingModel 
  ? baseMaxTokens * THINKING_MODEL_TOKEN_MULTIPLIER 
  : baseMaxTokens;

console.log(`Starting request for model: ${modelReq.model_id}, role: ${role}, temp: ${temperature}, maxTokens: ${maxTokens}${isThinkingModel ? ' (thinking model x4)' : ''}`);
```

---

### Логика работы

```text
Запрос с моделью google/gemini-2.5-pro
              │
              ▼
    isThinkingModel = true
              │
              ▼
    baseMaxTokens = 2048 (дефолт)
              │
              ▼
    maxTokens = 2048 × 4 = 8192
              │
              ▼
    AI получает достаточно токенов:
    - ~6000 на reasoning
    - ~2000 на ответ
              │
              ▼
    finish_reason: "stop" ✓
```

---

### Покрытие моделей

| Модель | Множитель | Итоговые токены |
|--------|-----------|-----------------|
| google/gemini-2.5-pro | x4 | 8192 |
| google/gemini-3-pro-preview | x4 | 8192 |
| openai/gpt-5 | x4 | 8192 |
| openai/gpt-5.2 | x4 | 8192 |
| google/gemini-3-flash-preview | x1 | 2048 |
| google/gemini-2.5-flash | x1 | 2048 |
| openai/gpt-5-mini | x1 | 2048 |
| openai/gpt-5-nano | x1 | 2048 |

---

### Ожидаемый результат

- Сообщения Арбитра (gemini-2.5-pro) перестанут обрезаться
- `finish_reason` изменится с `"length"` на `"stop"`
- Логи будут показывать примененный множитель для отладки
- Модели без thinking продолжат использовать стандартный лимит

