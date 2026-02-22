const texts: Record<string, { ru: string; en: string }> = {
  // ProfileTab
  uploadPhoto: { ru: 'Загрузить фото', en: 'Upload photo' },
  deleteAvatar: { ru: 'Удалить', en: 'Delete' },
  avatarHint: { ru: 'JPEG, PNG, WebP · до 2 МБ', en: 'JPEG, PNG, WebP · up to 2 MB' },

  // NotificationsTab
  supervisorNotifications: { ru: 'Уведомления Супервизора', en: 'Supervisor Notifications' },
  notificationsDescription: { ru: 'Новые ИИ-ревизии Эволюциониста, требующие вашей оценки', en: 'New AI revisions from the Evolutioner awaiting your review' },
  allRead: { ru: 'Прочитаны все', en: 'All read' },
  markAllRead: { ru: 'Прочитать все', en: 'Mark all read' },
  loading: { ru: 'Загрузка...', en: 'Loading...' },
  noNotifications: { ru: 'Нет уведомлений', en: 'No notifications' },
  new: { ru: 'Новое', en: 'New' },
  markRead: { ru: 'Прочитано', en: 'Mark read' },
  goToChronicles: { ru: 'Перейти к Хроникам', en: 'Go to Chronicles' },
  delete: { ru: 'Удалить', en: 'Delete' },

  // FinanceTab
  estSpend: { ru: 'Расход (оценка)', en: 'Est. Spend' },
  requests: { ru: 'Запросов', en: 'Requests' },
  tokens: { ru: 'Токенов', en: 'Tokens' },
  spendByProvider: { ru: 'Расходы по провайдерам', en: 'Spend by Provider' },
  noUsageDataYet: { ru: 'Нет данных об использовании', en: 'No usage data yet' },
  provider: { ru: 'Провайдер', en: 'Provider' },
  tokensIn: { ru: 'Токены (вх)', en: 'Tokens (in)' },
  tokensOut: { ru: 'Токены (вых)', en: 'Tokens (out)' },
  costDollar: { ru: 'Расход $', en: 'Cost $' },

  // ApiKeysTab
  byokDescription: { ru: 'Добавьте свои API ключи для использования различных LLM моделей (BYOK — Bring Your Own Key)', en: 'Add your API keys to use various LLM models (BYOK — Bring Your Own Key)' },
  tools: { ru: 'Инструменты', en: 'Tools' },
  getKeyAt: { ru: 'Получите ключ на', en: 'Get your key at' },

  // ApiRoutersTab
  apiRouters: { ru: 'API Роутеры', en: 'API Routers' },
  save: { ru: 'Сохранить', en: 'Save' },

  // LovableAI Panel
  builtIn: { ru: 'Встроенный', en: 'Built-in' },
  lovableDescription: { ru: 'Встроенный роутер Lovable Cloud. Доступ к моделям без собственного API-ключа. Доступен только администратору проекта.', en: 'Built-in Lovable Cloud router. Access models without your own API key. Available to project admin only.' },
  availableModels: { ru: 'Доступные модели', en: 'Available Models' },

  // OpenRouter Panel
  openrouterDescription: { ru: 'Единый шлюз к множеству моделей. Бесплатные и платные модели через один API-ключ.', en: 'Unified gateway to many models. Free and paid models via one API key.' },

  // OpenRouter Balance
  balance: { ru: 'Баланс', en: 'Balance' },
  today: { ru: 'Сегодня', en: 'Today' },
  month: { ru: 'Месяц', en: 'Month' },
  remaining: { ru: 'Остаток', en: 'Remaining' },

  // ApiKeyField
  keyExpiration: { ru: 'Срок действия ключа', en: 'Key expiration date' },
  removeExpiration: { ru: 'Убрать срок', en: 'Remove expiration' },
  added: { ru: 'Добавлен', en: 'Added' },
  unlimited: { ru: 'Бессрочный', en: 'Unlimited' },
  expired: { ru: 'Истёк', en: 'Expired' },
  until: { ru: 'До', en: 'Until' },

  // ApiKeyExpirationNotifier
  expiredKeys: { ru: 'Истёк срок действия ключей', en: 'Expired API keys' },
  keyExpiringSoon: { ru: 'Скоро истекут ключи', en: 'Keys expiring soon' },

  // AvatarCropDialog
  cropAvatar: { ru: 'Кадрирование аватара', en: 'Crop Avatar' },
  cropHint: { ru: 'Перетащите фото, прокрутите для масштабирования', en: 'Drag the photo, scroll to zoom' },
  reset: { ru: 'Сбросить', en: 'Reset' },
  cancel: { ru: 'Отмена', en: 'Cancel' },
  apply: { ru: 'Применить', en: 'Apply' },

  // ProxyApiDashboard / DotPointDashboard shared
  apiKey: { ru: 'ключ', en: 'key' },
  active: { ru: 'Активен', en: 'Active' },
  connectionStatus: { ru: 'Статус подключения', en: 'Connection Status' },
  latency: { ru: 'Латенси', en: 'Latency' },
  models: { ru: 'Моделей', en: 'Models' },
  modelRemoved: { ru: 'Модель удалена', en: 'Model removed' },
  modelRemovedDesc_pre: { ru: 'Модель', en: 'Model' },
  modelRemovedDesc_post: { ru: 'была навсегда удалена из сервиса ProxyAPI (HTTP 410 Gone). Она больше не доступна для запросов. Скрыть её из каталога?', en: 'has been permanently removed from ProxyAPI (HTTP 410 Gone). It is no longer available. Hide it from the catalog?' },
  keep: { ru: 'Оставить', en: 'Keep' },
  hideModel: { ru: 'Скрыть модель', en: 'Hide model' },
  online: { ru: 'Онлайн', en: 'Online' },
  timeout: { ru: 'Таймаут', en: 'Timeout' },
  error: { ru: 'Ошибка', en: 'Error' },
  addKeyHint_proxy: { ru: 'Добавьте ключ ProxyAPI выше и сохраните для доступа к дашборду.', en: 'Add your ProxyAPI key above and save to access the dashboard.' },
  addKeyHint_dotpoint: { ru: 'Добавьте ключ DotPoint выше и сохраните для доступа к дашборду.', en: 'Add your DotPoint key above and save to access the dashboard.' },
  proxyAltTitle: { ru: 'Альтернатива OpenRouter для России', en: 'OpenRouter alternative for Russia' },
  proxyAltDesc: { ru: 'ProxyAPI — российский шлюз для доступа к моделям OpenAI, Anthropic, Google и DeepSeek без VPN. Поддерживает оплату в рублях. Используется как замена OpenRouter при блокировках.', en: 'ProxyAPI — Russian gateway for accessing OpenAI, Anthropic, Google, and DeepSeek models without VPN. Supports payment in rubles. Used as an OpenRouter replacement when blocked.' },
  priorityOverOpenRouter: { ru: 'Приоритет над OpenRouter', en: 'Priority over OpenRouter' },
  dotpointAltTitle: { ru: 'Альтернативный роутер для России', en: 'Alternative router for Russia' },
  dotpointAltDesc: { ru: 'DotPoint — российский AI-роутер с доступом к моделям OpenAI, Anthropic, Google и другим без VPN. Поддерживает оплату в рублях.', en: 'DotPoint — Russian AI router providing access to OpenAI, Anthropic, Google and other models without VPN. Supports payment in rubles.' },

  // Catalog sections
  modelCatalog: { ru: 'Каталог моделей', en: 'Model Catalog' },
  inCatalog: { ru: 'в каталоге', en: 'in catalog' },
  loadingCatalog: { ru: 'Загрузка каталога...', en: 'Loading catalog...' },
  refreshCatalog: { ru: 'Обновить каталог', en: 'Refresh catalog' },
  add: { ru: 'Добавить', en: 'Add' },
  userList: { ru: 'Пользовательский список', en: 'User list' },
  testModel: { ru: 'Тест модели', en: 'Test model' },
  removeFromList: { ru: 'Удалить из списка', en: 'Remove from list' },
  addToUserList: { ru: 'Добавить в пользовательский список', en: 'Add to user list' },
  type: { ru: 'Тип', en: 'Type' },

  // ProxySettings
  settings: { ru: 'Настройки', en: 'Settings' },
  timeoutSec: { ru: 'Таймаут (сек)', en: 'Timeout (sec)' },
  maxRetries: { ru: 'Макс. повторов (retry)', en: 'Max retries' },
  noRetries: { ru: '0 — без повторов', en: '0 — no retries' },
  retry1: { ru: '1 повтор', en: '1 retry' },
  retry2: { ru: '2 повтора', en: '2 retries' },
  retry3: { ru: '3 повтора', en: '3 retries' },
  fallbackLabel: { ru: 'Автоматический фолбэк на Lovable AI при ошибках', en: 'Auto-fallback to Lovable AI on errors' },
  settingsSavedLocally: { ru: 'Настройки сохраняются локально и применяются при следующих запросах через ProxyAPI.', en: 'Settings are saved locally and applied to subsequent requests via ProxyAPI.' },

  // ProxyAnalytics
  analytics: { ru: 'Аналитика', en: 'Analytics' },
  notEnoughData: { ru: 'Недостаточно данных для аналитики', en: 'Not enough data for analytics' },
  avgLatencyByModel: { ru: 'Средняя латенси по моделям (ms)', en: 'Average latency by model (ms)' },
  latencyMs: { ru: 'Латенси (ms)', en: 'Latency (ms)' },
  deleteModelStats: { ru: 'Удалить статистику модели', en: 'Delete model statistics' },
  errorsOnly: { ru: 'Только ошибки', en: 'Errors only' },
  total: { ru: 'Всего', en: 'Total' },
  errors: { ru: 'Ошибки', en: 'Errors' },

  // ProxyLogs
  recentRequests: { ru: 'Последние запросы', en: 'Recent Requests' },
  refresh: { ru: 'Обновить', en: 'Refresh' },
  noRecords: { ru: 'Нет записей', en: 'No records' },
  model: { ru: 'Модель', en: 'Model' },
  requestType: { ru: 'Тип', en: 'Type' },
  requestTypeHint: { ru: 'Тип запроса: stream (потоковый), test (тестовый), ping (проверка связи)', en: 'Request type: stream (streaming), test (testing), ping (connectivity check)' },
  status: { ru: 'Статус', en: 'Status' },
  date: { ru: 'Дата', en: 'Date' },

  // Limits dialogs shared
  testing: { ru: 'Проверка...', en: 'Testing...' },
  available: { ru: 'Доступна', en: 'Available' },
  quotaExceeded: { ru: 'Квота исчерпана', en: 'Quota exceeded' },
  rateLimited: { ru: 'Лимит исчерпан', en: 'Rate limited' },
  availabilityTest: { ru: 'Тест доступности', en: 'Availability Test' },
  reference: { ru: 'Справка', en: 'Reference' },
  limitsReference: { ru: 'Справка по лимитам', en: 'Limits Reference' },
  testAllModels: { ru: 'Проверить все модели', en: 'Test All Models' },
  addKeyFirst_gemini: { ru: 'Сначала добавьте API-ключ Google Gemini выше.', en: 'Add your Google Gemini API key first.' },
  addKeyFirst_mistral: { ru: 'Сначала добавьте API-ключ Mistral выше.', en: 'Add your Mistral API key first.' },
  addKeyFirst_firecrawl: { ru: 'Сначала добавьте API-ключ Firecrawl выше.', en: 'Add your Firecrawl API key first.' },
  addKeyFirst_openrouter: { ru: 'Сначала добавьте API-ключ OpenRouter.', en: 'Add your OpenRouter API key first.' },

  // Gemini limits
  geminiLimits: { ru: 'Лимиты Gemini', en: 'Gemini Limits' },
  geminiFreeLimits: { ru: 'Лимиты бесплатного API Google Gemini', en: 'Google Gemini Free Tier Limits' },
  geminiTestDesc: { ru: 'Отправляет мини-запрос к каждой модели для проверки доступности и текущей квоты.', en: 'Sends a minimal request to each model to check availability and current quota status.' },
  geminiRefDesc: { ru: 'Данные актуальны на февраль 2026 (после сокращения квот в декабре 2025). Лимиты действуют per-project, сброс — в полночь по тихоокеанскому времени (PT).', en: 'Data as of February 2026 (post December 2025 quota reduction). Limits are per-project, daily reset at midnight Pacific Time.' },
  context: { ru: 'Контекст', en: 'Context' },
  rpm: { ru: 'запросов в минуту', en: 'Requests Per Minute' },
  rpd: { ru: 'запросов в день', en: 'Requests Per Day' },
  tpm: { ru: 'токенов в минуту', en: 'Tokens Per Minute' },
  officialGoogleDocs: { ru: 'Официальная документация Google', en: 'Official Google Docs' },

  // Mistral limits
  mistralLimits: { ru: 'Лимиты Mistral', en: 'Mistral Limits' },
  mistralModelCheck: { ru: 'Mistral AI — проверка моделей', en: 'Mistral AI — Model Check' },
  mistralTestDesc: { ru: 'Отправляет мини-запрос к каждой модели Mistral для проверки доступности с вашим ключом.', en: 'Sends a minimal request to each Mistral model to check availability with your key.' },
  mistralRefDesc1: { ru: 'Mistral AI предоставляет бесплатный доступ к API без ограничения по сроку действия ключа. Лимиты зависят от уровня использования (Usage Tier) вашего рабочего пространства.', en: 'Mistral AI provides free API access with no key expiration. Limits depend on your workspace Usage Tier.' },
  mistralRefDesc2: { ru: 'Лимиты задаются в RPS (запросов в секунду) и TPM (токенов в минуту) на уровне воркспейса. Бесплатный уровень: ~1 RPS, 500K TPM.', en: 'Limits are set as RPS (requests per second) and TPM (tokens per minute) at workspace level. Free tier: ~1 RPS, 500K TPM.' },
  parameter: { ru: 'Параметр', en: 'Parameter' },
  freeTier: { ru: 'Бесплатный уровень', en: 'Free Tier' },
  keyExpiry: { ru: 'Срок ключа', en: 'Key Expiry' },
  pricing: { ru: 'Стоимость', en: 'Pricing' },
  freeExperimental: { ru: 'Бесплатно (для эксперим.)', en: 'Free (experimental)' },
  mistralDocs: { ru: 'Документация Mistral AI', en: 'Mistral AI Docs' },

  // Firecrawl limits
  firecrawlLimits: { ru: 'Лимиты Firecrawl', en: 'Firecrawl Limits' },
  firecrawlModeCheck: { ru: 'Firecrawl — проверка режимов', en: 'Firecrawl — Mode Check' },
  modeTest: { ru: 'Тест режимов', en: 'Mode Test' },
  testAllModes: { ru: 'Проверить все режимы', en: 'Test All Modes' },
  firecrawlTestDesc: { ru: 'Отправляет мини-запрос к каждому режиму Firecrawl для проверки доступности с вашим ключом.', en: 'Sends a minimal request to each Firecrawl mode to check availability with your key.' },
  firecrawlRefDesc: { ru: 'Firecrawl предоставляет API для скраппинга, поиска и обхода веб-страниц. Бесплатный план включает 500 кредитов (≈500 страниц scrape).', en: 'Firecrawl provides APIs for scraping, searching, and crawling web pages. Free plan includes 500 credits (≈500 scrape pages).' },
  accountCredits: { ru: 'Кредиты аккаунта', en: 'Account Credits' },
  extractionModes: { ru: 'Режимы извлечения', en: 'Extraction Modes' },
  mode: { ru: 'Режим', en: 'Mode' },
  credits: { ru: 'Кредиты', en: 'Credits' },
  description: { ru: 'Описание', en: 'Description' },
  format: { ru: 'Формат', en: 'Format' },
  scrapeFormats: { ru: 'Форматы извлечения (scrape)', en: 'Scrape Formats' },
  freePlan: { ru: 'Бесплатный план', en: 'Free Plan' },
  value: { ru: 'Значение', en: 'Value' },
  rateLimit: { ru: 'Лимит скорости', en: 'Rate Limit' },
  maxCrawlDepth: { ru: 'Макс. глубина crawl', en: 'Max Crawl Depth' },
  firecrawlDocs: { ru: 'Документация Firecrawl', en: 'Firecrawl Docs' },
  singleWebPage: { ru: 'Одна веб-страница', en: 'Single web page' },
  recursiveSiteCrawl: { ru: 'Рекурсивный обход сайта', en: 'Recursive site crawl' },
  siteUrlMap: { ru: 'Карта URL сайта (до 5000)', en: 'Site URL map (up to 5000)' },
  webSearchScraping: { ru: 'Веб-поиск + скраппинг', en: 'Web search + scraping' },
  availableM: { ru: 'Доступен', en: 'Available' },

  // OpenRouter limits
  openrouterLimits: { ru: 'Лимиты OpenRouter', en: 'OpenRouter Limits' },
  openrouterDiagnostics: { ru: 'OpenRouter — диагностика', en: 'OpenRouter — Diagnostics' },
  keyStatus: { ru: 'Статус ключа', en: 'Key Status' },
  openrouterTestDesc: { ru: 'Отправляет мини-запрос к бесплатным и популярным платным моделям для проверки доступности ключа.', en: 'Sends a minimal request to free and popular paid models to check key availability.' },
  openrouterKeyDesc: { ru: 'Информация о вашем API-ключе OpenRouter (запрос к /api/v1/key).', en: 'Your OpenRouter API key information (from /api/v1/key).' },
  keyLabel: { ru: 'Метка ключа', en: 'Key Label' },
  tier: { ru: 'Тип', en: 'Tier' },
  free: { ru: 'Бесплатный', en: 'Free' },
  paid: { ru: 'Платный', en: 'Paid' },
  usedToday: { ru: 'Использовано сегодня', en: 'Used Today' },
  usedThisMonth: { ru: 'Использовано за месяц', en: 'Used This Month' },
  limit: { ru: 'Лимит', en: 'Limit' },
  noCredits: { ru: 'Нет кредитов', en: 'No credits' },
  modelNotFound: { ru: 'Модель не найдена', en: 'Not found' },
  openrouterDocs: { ru: 'Документация OpenRouter', en: 'OpenRouter Docs' },

  // Mass test
  testingProgress: { ru: 'Тестирование', en: 'Testing' },
  testAllModelsWith: { ru: 'Тест всех моделей', en: 'Test all models' },
  noResults: { ru: 'Ничего не найдено среди', en: 'No results among' },
  modelsWord: { ru: 'моделей', en: 'models' },
  proxyModels: { ru: 'ProxyAPI модели', en: 'ProxyAPI models' },
  dotpointModels: { ru: 'Модели DotPoint', en: 'DotPoint models' },
};

export function getProfileText(key: string, isRu: boolean): string {
  const entry = texts[key];
  if (!entry) return key;
  return isRu ? entry.ru : entry.en;
}

export function getProfileTextTemplate(key: string, isRu: boolean, vars: Record<string, string | number>): string {
  let text = getProfileText(key, isRu);
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return text;
}
