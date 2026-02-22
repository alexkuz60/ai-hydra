// ─── ProxyAPI Dashboard shared types & constants ───────

export type ProxyModelType = "chat" | "embedding" | "tts" | "stt" | "image" | "image_edit" | "responses";

export interface ProxyApiCatalogModel {
  id: string;
  owned_by: string;
  created?: number;
}

/** Detect model type from its ID */
export function detectModelType(modelId: string): ProxyModelType {
  const id = modelId.toLowerCase();
  if (id.includes("tts") || (id.includes("speech") && !id.includes("speech-to"))) return "tts";
  if (id.includes("whisper") || id.includes("transcription") || id.includes("speech-to")) return "stt";
  if (id.includes("dall-e") || id.includes("dalle") || id.includes("gpt-image") ||
      id.includes("image-generation") || id.includes("sdxl") || id.includes("stable-diffusion")) return "image";
  if (id.includes("image-edit")) return "image_edit";
  if (id.includes("embedding") || id.includes("embed") || id.includes("text-embedding")) return "embedding";
  return "chat";
}

export const MODEL_TYPE_LABELS: Record<ProxyModelType, { label: string; color: string }> = {
  chat: { label: "💬 Chat", color: "" },
  embedding: { label: "📐 Embed", color: "border-blue-500/30 text-blue-400" },
  tts: { label: "🔊 TTS", color: "border-violet-500/30 text-violet-400" },
  stt: { label: "🎤 STT", color: "border-amber-500/30 text-amber-400" },
  image: { label: "🎨 Image", color: "border-pink-500/30 text-pink-400" },
  image_edit: { label: "✏️ ImgEdit", color: "border-rose-500/30 text-rose-400" },
  responses: { label: "⚡ Resp", color: "border-cyan-500/30 text-cyan-400" },
};

export interface PingResult {
  status: 'online' | 'error' | 'timeout';
  latency_ms: number;
  model_count?: number;
  error?: string;
}

export interface TestResult {
  status: 'success' | 'error' | 'timeout' | 'gone' | 'skipped';
  latency_ms: number;
  content?: string;
  model_type?: ProxyModelType;
  tokens?: { input: number; output: number };
  error?: string;
  details?: string;
  message?: string;
}

export interface LogEntry {
  id: string;
  model_id: string;
  request_type: string;
  status: string;
  latency_ms: number | null;
  tokens_input: number | null;
  tokens_output: number | null;
  error_message: string | null;
  created_at: string;
}

export interface ProxyApiSettings {
  timeout_sec: number;
  max_retries: number;
  fallback_enabled: boolean;
}

export interface AnalyticsEntry {
  model: string;
  rawModelId: string;
  total: number;
  success: number;
  errors: number;
  avgLatency: number;
  latencies: number[];
}

export const DEFAULT_SETTINGS: ProxyApiSettings = {
  timeout_sec: 30,
  max_retries: 2,
  fallback_enabled: true,
};

export const SETTINGS_KEY = 'proxyapi_settings';
export const USER_MODELS_KEY = 'proxyapi_user_models';

export const STATUS_EXPLANATIONS: Record<string, { label: { ru: string; en: string }; description: { ru: string; en: string } }> = {
  success: {
    label: { ru: 'Успешно', en: 'Success' },
    description: { ru: 'Запрос выполнен без ошибок. Модель ответила корректно.', en: 'Request completed without errors. Model responded correctly.' },
  },
  error: {
    label: { ru: 'Ошибка', en: 'Error' },
    description: { ru: 'Запрос завершился с ошибкой. Возможные причины: невалидный API-ключ, превышение лимита запросов, внутренняя ошибка провайдера или проблемы с сетью.', en: 'Request failed. Possible causes: invalid API key, rate limit exceeded, provider internal error, or network issues.' },
  },
  timeout: {
    label: { ru: 'Таймаут', en: 'Timeout' },
    description: { ru: 'Модель не успела ответить за отведённое время. Попробуйте увеличить таймаут в настройках или использовать более быструю модель.', en: 'Model did not respond in time. Try increasing the timeout in settings or using a faster model.' },
  },
  gone: {
    label: { ru: '410 Gone', en: '410 Gone' },
    description: { ru: 'Модель навсегда удалена из сервиса ProxyAPI (HTTP 410). Она больше не доступна для запросов. Рекомендуется скрыть её из каталога.', en: 'Model permanently removed from ProxyAPI (HTTP 410). It is no longer available. Consider hiding it from the catalog.' },
  },
  skipped: {
    label: { ru: 'Пропущен', en: 'Skipped' },
    description: { ru: 'Тест не выполнен — этот тип модели (STT/Image Edit) требует загрузки файла и не поддерживает автоматическое тестирование.', en: 'Test skipped — this model type (STT/Image Edit) requires file upload and does not support automatic testing.' },
  },
  fallback: {
    label: { ru: 'Фолбэк', en: 'Fallback' },
    description: { ru: 'Основной провайдер (ProxyAPI) вернул ошибку, запрос автоматически перенаправлен на резервный шлюз (Lovable AI).', en: 'Primary provider (ProxyAPI) returned an error, request automatically redirected to fallback gateway (Lovable AI).' },
  },
  stream: {
    label: { ru: 'Стриминг', en: 'Streaming' },
    description: { ru: 'Потоковый запрос к модели через ProxyAPI. Токены отправляются по мере генерации.', en: 'Streaming request to model via ProxyAPI. Tokens are sent as they are generated.' },
  },
  ping: {
    label: { ru: 'Пинг', en: 'Ping' },
    description: { ru: 'Проверка доступности сервиса ProxyAPI. Измеряет латенси до API-сервера.', en: 'ProxyAPI service availability check. Measures latency to API server.' },
  },
  test: {
    label: { ru: 'Тест', en: 'Test' },
    description: { ru: 'Одиночный тестовый запрос к модели для проверки её работоспособности.', en: 'Single test request to model to verify its functionality.' },
  },
};

/** Helper to get localized status explanation */
export function getStatusExpl(status: string, lang: 'ru' | 'en') {
  const e = STATUS_EXPLANATIONS[status];
  if (!e) return null;
  return { label: e.label[lang], description: e.description[lang] };
}
