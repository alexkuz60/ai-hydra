
# План: Добавление Tavily и Perplexity в секцию API-ключей

## Обзор
Добавляем подкатегорию "Web Search" (Веб-поиск) в раздел API-ключей профиля с поддержкой Tavily и Perplexity. Включаем предупреждение о режиме "по умолчанию" для Web-Hunter с рекомендацией добавить персональный ключ.

## Визуальная структура

```text
┌─────────────────────────────────────────────────────────┐
│  🔑 API-ключи                                           │
├─────────────────────────────────────────────────────────┤
│  Добавьте свои API ключи для использования LLM (BYOK)   │
│                                                         │
│  ▸ OpenAI          [sk-...              ] 👁            │
│  ▸ Google Gemini   [AIza...             ] 👁            │
│  ▸ Anthropic       [sk-ant-...          ] 👁            │
│  ▸ xAI (Grok)      [xai-...             ] 👁            │
│  ▸ OpenRouter      [sk-or-...           ] 👁            │
│  ▸ Groq            [gsk_...             ] 👁            │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│  🔍 Web Search                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ⚠️ По умолчанию используется общий ключ Tavily с   ││
│  │ ограничениями (1000 запросов/мес). Для полного     ││
│  │ доступа добавьте персональный ключ ниже.           ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ▸ Tavily          [tvly-...            ] 👁            │
│    ↳ tavily.com/app — бесплатный план: 1000 запр./мес  │
│                                                         │
│  ▸ Perplexity      [pplx-...            ] 👁            │
│    ↳ perplexity.ai/settings/api — Sonar API            │
│                                                         │
│  [ 💾 Сохранить ]                                       │
└─────────────────────────────────────────────────────────┘
```

## Шаги реализации

### 1. Миграция базы данных
Добавляем новые колонки в таблицу `user_api_keys`:
- `tavily_vault_id UUID`
- `perplexity_vault_id UUID`

Обновляем SQL-функции:
- `get_my_api_key_status()` — добавляем `has_tavily`, `has_perplexity`
- `get_my_api_keys()` — добавляем `tavily_api_key`, `perplexity_api_key`
- `save_api_key()` — добавляем поддержку провайдеров `tavily`, `perplexity`

### 2. Обновление Profile.tsx

**Состояния:**
```typescript
// Новые state-переменные
const [tavilyKey, setTavilyKey] = useState('');
const [perplexityKey, setPerplexityKey] = useState('');

// Расширение showKeys
const [showKeys, setShowKeys] = useState({
  // ...existing
  tavily: false,
  perplexity: false,
});
```

**UI структура:**
- Разделитель `<Separator />` после секции Groq
- Подзаголовок "🔍 Web Search" (локализованный)
- Предупреждающий блок с `bg-amber-500/10 border-amber-500/30` стилями
- Поля ввода для Tavily и Perplexity с описаниями

### 3. Обновление useAvailableModels.ts

Расширяем типы и состояния:
```typescript
interface UserApiKeys {
  // ...existing
  tavily: boolean;
  perplexity: boolean;
}
```

### 4. Обновление оркестратора (опционально, фаза 2)

Логика приоритетов для web_search:
1. Персональный ключ Tavily пользователя (если есть)
2. Персональный ключ Perplexity (если есть, альтернативный провайдер)
3. Общий TAVILY_API_KEY из env (fallback с ограничениями)

### 5. Локализация

Добавляем ключи в `LanguageContext.tsx`:
```typescript
'profile.webSearch': { ru: 'Веб-поиск', en: 'Web Search' },
'profile.webSearchWarning': { 
  ru: 'По умолчанию используется общий ключ Tavily с ограничениями (1000 запросов/мес на всех пользователей). Для полноценной работы Web-Hunter добавьте персональный ключ.',
  en: 'By default, a shared Tavily key with limitations (1000 requests/month for all users) is used. For full Web-Hunter functionality, add your personal key.'
},
'profile.tavily': { ru: 'Tavily (AI Search)', en: 'Tavily (AI Search)' },
'profile.perplexity': { ru: 'Perplexity (Sonar API)', en: 'Perplexity (Sonar API)' },
```

---

## Технические детали

### SQL миграция
```sql
-- Добавляем колонки
ALTER TABLE public.user_api_keys 
ADD COLUMN IF NOT EXISTS tavily_vault_id UUID,
ADD COLUMN IF NOT EXISTS perplexity_vault_id UUID;

-- Обновляем функции get_my_api_key_status, get_my_api_keys, save_api_key
-- (полный SQL в миграции)
```

### Стили предупреждения
```tsx
<div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
  <div className="flex gap-3">
    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-amber-200">
      {t('profile.webSearchWarning')}
    </p>
  </div>
</div>
```

---

## Результат
- Пользователи видят отдельную секцию "Web Search" с визуально выделенным предупреждением
- Могут добавить собственные ключи Tavily/Perplexity
- Веб-охотник работает "из коробки" с общим ключом, но с ограничениями
- Чёткая рекомендация перейти на персональную подписку
