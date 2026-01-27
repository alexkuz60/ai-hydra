

## План: Исправление отображения переведённого текста reasoning

### Проблема
При нажатии кнопки "Перевести" в блоке процесса размышлений перевод не отображается. Анализ сетевых запросов показал:
- Запрос к `translate-text` успешен (статус 200)
- Ответ содержит `{"translation":""}` — **пустую строку**

### Причины пустого ответа

1. **Edge function не логирует полный ответ API** — невозможно понять что вернула модель
2. **Возможно проблема с gpt-5-nano** — модель может не справляться с длинными текстами reasoning

### Изменения

#### 1. Добавить логирование в edge function

**Файл:** `supabase/functions/translate-text/index.ts`

После получения ответа от API (строка 74):
```typescript
const data = await response.json();

// Добавить логирование полного ответа для диагностики
console.log("Translation API response:", JSON.stringify(data, null, 2));

const translation = data.choices?.[0]?.message?.content || "";
```

#### 2. Проверить правильность извлечения контента

Возможно API возвращает данные в другом формате. Добавить fallback:
```typescript
const message = data.choices?.[0]?.message;
const translation = message?.content || message?.text || "";

if (!translation) {
  console.warn("Empty translation received. Full response:", JSON.stringify(data));
}
```

#### 3. Улучшить обработку в ThinkingBlock.tsx

**Файл:** `src/components/warroom/ThinkingBlock.tsx`

Добавить логирование ответа клиента (строка 35):
```typescript
console.log("Translation response:", data);

if (data?.translation) {
  setTranslatedText(data.translation);
} else {
  // Если перевод пустой — показать предупреждение
  console.warn("Empty translation received");
  toast({
    title: t('common.error'),
    description: t('thinking.translateError'),
    variant: 'destructive'
  });
}
```

#### 4. Использовать более надёжную модель

Если проблема в gpt-5-nano, можно переключиться на gpt-5-mini:

**Файл:** `supabase/functions/translate-text/index.ts`
```typescript
model: "openai/gpt-5-mini", // более надёжная модель
```

---

### Шаги реализации

1. Добавить логирование полного ответа API в `translate-text` edge function
2. Развернуть edge function и протестировать ещё раз
3. Проанализировать логи и определить причину пустого ответа
4. Если модель gpt-5-nano не справляется — переключить на gpt-5-mini
5. Добавить обработку пустого ответа в UI с уведомлением пользователя

---

### Ожидаемый результат

- Переведённый текст отображается в блоке reasoning
- При ошибке перевода пользователь видит понятное уведомление
- Логи помогают диагностировать проблемы с API

