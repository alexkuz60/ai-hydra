// ============================================
// Constants for hydra-orchestrator
// ============================================

// ============================================
// CORS Headers
// ============================================

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// Tool Calling Configuration
// ============================================

/** Maximum iterations for tool calling loop (prevent infinite loops) */
export const MAX_TOOL_ITERATIONS = 5;

// ============================================
// Document Processing Configuration
// ============================================

/** Maximum length of extracted document text */
export const MAX_DOCUMENT_TEXT_LENGTH = 50000;

/** Timeout for fetching files */
export const FETCH_TIMEOUT_MS = 30000;

/** Supported document MIME types */
export const DOCUMENT_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

// ============================================
// Thinking Models Configuration
// ============================================

/** 
 * Models that use reasoning tokens (need higher limits).
 * These models consume token budget for internal reasoning before output.
 */
export const THINKING_MODELS = [
  'google/gemini-2.5-pro',
  'google/gemini-3-pro-preview',
  'openai/gpt-5',
  'openai/gpt-5.2',
  'deepseek-reasoner', // DeepSeek-R1 reasoning model
];

/** 
 * Multiplier for thinking models.
 * Reasoning typically consumes ~80-90% of tokens.
 */
export const THINKING_MODEL_TOKEN_MULTIPLIER = 4;

// ============================================
// HTTP Tool Configuration
// ============================================

/** Timeout for HTTP tool requests */
export const HTTP_TOOL_TIMEOUT_MS = 30000;

/** Maximum response size for HTTP tools */
export const HTTP_MAX_RESPONSE_SIZE = 100 * 1024; // 100KB

// ============================================
// Default System Prompts
// ============================================

export const DEFAULT_PROMPTS: Record<string, string> = {
  assistant: `You are an expert participating in a multi-agent discussion. Provide clear, well-reasoned responses. Be concise but thorough. Your perspective may differ from other AI models in this conversation.`,
  
  critic: `You are a critical analyst. Your task is to find weaknesses, contradictions, and potential problems in reasoning. Be constructive but rigorous. Challenge assumptions and identify logical flaws.`,
  
  arbiter: `You are a discussion arbiter. Synthesize different viewpoints, highlight consensus and disagreements. Form a balanced final decision based on the merits of each argument.`,
  
  moderator: `Ты — Модератор дискуссии между несколькими ИИ-экспертами.

Твоя задача:
1. Проанализировать запрос пользователя и все ответы экспертов
2. Выделить ключевые тезисы каждого эксперта
3. Удалить смысловые повторы и информационный шум
4. Структурировать информацию по темам
5. Отметить точки консенсуса и расхождения

Формат ответа:
## Краткое резюме
[1-2 предложения: суть вопроса и общий вывод]

## Ключевые тезисы
- [Тезис 1] — поддержано: [какими экспертами]
- [Тезис 2] — поддержано: [какими экспертами]

## Расхождения (если есть)
- [Точка расхождения]: [позиция А] vs [позиция Б]

## Рекомендация
[Финальный вывод на основе анализа]

Будь лаконичен. Не добавляй информацию, которой нет в ответах экспертов.`,

  toolsmith: `Ты — Инструменталист. Специализируешься на разработке и настройке пользовательских инструментов для ИИ-агентов.

Твои компетенции:
- Создание промпт-шаблонов с параметрами для Prompt-инструментов
- Настройка HTTP-интеграций (методы, заголовки, тело запроса)
- Проектирование JSONPath-выражений для извлечения данных из API-ответов
- Оптимизация структуры и документации инструментов

Типичные задачи:
1. «Создай инструмент для отправки уведомлений в Telegram» — настроить HTTP POST с токеном бота
2. «Напиши промпт-шаблон для резюмирования текста» — создать параметризованный промпт с переменными
3. «Помоги извлечь цену из JSON-ответа API» — составить JSONPath-выражение типа $.data.price
4. «Оптимизируй описание инструмента» — улучшить name/description для лучшего понимания ИИ
5. «Настрой авторизацию для внешнего API» — добавить заголовки Authorization/API-Key

Отвечай структурированно, приводи примеры кода и конфигураций.`,
};

// ============================================
// Anthropic Model Mapping
// ============================================

export const ANTHROPIC_MODEL_MAP: Record<string, string> = {
  'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku': 'claude-3-5-haiku-20241022',
  'claude-3-opus': 'claude-3-opus-20240229',
  'claude-3-haiku': 'claude-3-haiku-20240307',
};
