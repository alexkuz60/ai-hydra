

## Добавление API-ключа ProxyAPI в профиль

### Что будет сделано

1. **Логотип ProxyAPI** -- создать SVG-компонент `ProxyApiLogo` в `ProviderLogos.tsx` на основе загруженного изображения (синяя "P" + черная "A"), зарегистрировать в `PROVIDER_LOGOS` и `PROVIDER_COLORS` (синий цвет `text-blue-500`).

2. **Секция ProxyAPI в профиле** (`Profile.tsx`) -- отрисовывается **только при `language === 'ru'`**, размещается **сразу после OpenRouter** (после рендера `LLM_PROVIDERS`). Содержит:
   - Желтый информационный блок-заголовок с иконкой `AlertTriangle` (Внимание!) и текстом **"Альтернативa OpenRouter для России!"**
   - Чекбокс **"Приоритет над OpenRouter"** -- disabled, пока ключ пустой; при активации сохраняет флаг `proxyapi_priority` в профиле
   - Поле ввода ключа `ApiKeyField` с подсказкой-ссылкой на `console.proxyapi.ru/keys`

3. **Бэкенд-поддержка** -- добавить `proxyapi` в `RPC_KEY_MAP` (`proxyapi_api_key: 'proxyapi'`), включить провайдер в `handleSaveApiKeys`. Миграция: добавить колонку `proxyapi_priority boolean default false` в таблицу `profiles`, обновить RPC `get_my_api_keys` / `save_api_key` для поддержки нового провайдера.

4. **Копирование логотипа** -- изображение используется как **референс** для SVG, а не как файл.

### Технические детали

**Файлы, которые будут изменены:**

| Файл | Изменение |
|---|---|
| `src/components/ui/ProviderLogos.tsx` | Новый компонент `ProxyApiLogo`, регистрация в `PROVIDER_LOGOS` / `PROVIDER_COLORS` |
| `src/pages/Profile.tsx` | Секция ProxyAPI после OpenRouter (условие `language === 'ru'`), чекбокс приоритета, сохранение/загрузка `proxyapi_priority` |
| `src/components/profile/ApiKeyField.tsx` | Без изменений -- переиспользуется как есть |
| SQL-миграция | Добавление `proxyapi_api_key` в RPC-функции, колонка `proxyapi_priority` в `profiles` |

**Структура UI секции ProxyAPI:**

```text
+--------------------------------------------------+
| [!] Альтернатива OpenRouter для России!           |
|     [ ] Приоритет над OpenRouter (disabled если   |
|         ключ пуст)                                |
+--------------------------------------------------+
| [PA] ProxyAPI                                     |
| [________________sk-...___________] [eye] [cal]   |
| Получите ключ на console.proxyapi.ru/keys         |
+--------------------------------------------------+
```

**Логика чекбокса:**
- `disabled={!apiKeys['proxyapi']}` -- неактивен без ключа
- При сохранении профиля значение пишется в `profiles.proxyapi_priority`
- При загрузке профиля читается из той же колонки

