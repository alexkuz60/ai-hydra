// ─── ProxyAPI Dashboard shared types & constants ───────

export interface ProxyApiCatalogModel {
  id: string;
  owned_by: string;
  created?: number;
}

export interface PingResult {
  status: 'online' | 'error' | 'timeout';
  latency_ms: number;
  model_count?: number;
  error?: string;
}

export interface TestResult {
  status: 'success' | 'error' | 'timeout' | 'gone';
  latency_ms: number;
  content?: string;
  tokens?: { input: number; output: number };
  error?: string;
  details?: string;
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

export const STATUS_EXPLANATIONS: Record<string, { label: string; description: string }> = {
  success: { label: 'Успешно', description: 'Запрос выполнен без ошибок. Модель ответила корректно.' },
  error: { label: 'Ошибка', description: 'Запрос завершился с ошибкой. Возможные причины: невалидный API-ключ, превышение лимита запросов, внутренняя ошибка провайдера или проблемы с сетью.' },
  timeout: { label: 'Таймаут', description: 'Модель не успела ответить за отведённое время. Попробуйте увеличить таймаут в настройках или использовать более быструю модель.' },
  gone: { label: '410 Gone', description: 'Модель навсегда удалена из сервиса ProxyAPI (HTTP 410). Она больше не доступна для запросов. Рекомендуется скрыть её из каталога.' },
  fallback: { label: 'Фолбэк', description: 'Основной провайдер (ProxyAPI) вернул ошибку, запрос автоматически перенаправлен на резервный шлюз (Lovable AI).' },
  stream: { label: 'Стриминг', description: 'Потоковый запрос к модели через ProxyAPI. Токены отправляются по мере генерации.' },
  ping: { label: 'Пинг', description: 'Проверка доступности сервиса ProxyAPI. Измеряет латенси до API-сервера.' },
  test: { label: 'Тест', description: 'Одиночный тестовый запрос к модели для проверки её работоспособности.' },
};
