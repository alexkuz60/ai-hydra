// Shared types and constants for hydra-stream

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const SSE_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
};

export interface MemoryChunk {
  content: string;
  chunk_type: string;
  metadata?: Record<string, unknown>;
}

export interface StreamRequest {
  message: string;
  model_id: string;
  role?: string;
  system_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  memory_context?: MemoryChunk[];
}

// DeepSeek models that need direct API access
export const DEEPSEEK_MODELS = ["deepseek-chat", "deepseek-reasoner"];

// Mistral models that need direct API access
export const MISTRAL_MODELS = [
  "mistral-large-latest",
  "mistral-small-latest",
  "codestral-latest",
  "mistral-medium-latest",
];

// Default prompts by role
export const DEFAULT_PROMPTS: Record<string, string> = {
  assistant: `You are an expert AI assistant. Provide clear, well-reasoned responses.`,

  consultant: `You are an AI consultant helping with research and analysis. Use available tools when needed. Provide insightful, well-structured answers.`,

  critic: `You are a critical analyst. Find weaknesses, contradictions, and potential problems in reasoning. Be constructive but rigorous.`,

  arbiter: `You are a discussion arbiter. Synthesize different viewpoints, highlight consensus and disagreements.`,

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

## Расхождения (если есть)
- [Точка расхождения]: [позиция А] vs [позиция Б]

## Рекомендация
[Финальный вывод на основе анализа]`,
};

/** Build memory context section for system prompt */
export function buildMemoryContext(chunks: MemoryChunk[]): string {
  if (!chunks || chunks.length === 0) return "";

  const sections: Record<string, string[]> = {
    decision: [],
    context: [],
    instruction: [],
    summary: [],
  };

  chunks.forEach((chunk) => {
    const type = chunk.chunk_type || "context";
    if (sections[type]) {
      sections[type].push(`• ${chunk.content}`);
    } else {
      sections.context.push(`• ${chunk.content}`);
    }
  });

  let contextText = "\n\n---\n## Контекст из памяти сессии\n";

  if (sections.decision.length > 0) {
    contextText += "\n### Принятые решения:\n" + sections.decision.join("\n") + "\n";
  }
  if (sections.instruction.length > 0) {
    contextText += "\n### Инструкции:\n" + sections.instruction.join("\n") + "\n";
  }
  if (sections.context.length > 0) {
    contextText += "\n### Дополнительный контекст:\n" + sections.context.join("\n") + "\n";
  }
  if (sections.summary.length > 0) {
    contextText += "\n### Саммари:\n" + sections.summary.join("\n") + "\n";
  }

  contextText += "---\n\nУчитывай эту информацию при формировании ответа.";

  return contextText;
}
