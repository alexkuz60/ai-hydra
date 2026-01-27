

## План: Вывод процесса размышлений думающих моделей

### Цель
Отображать шаги рассуждений (thinking/reasoning) от думающих моделей в схлопнутом блоке перед ответом, с возможностью автоматического перевода на русский язык.

---

### Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────┐
│                    hydra-orchestrator                            │
│                                                                  │
│  1. Добавить параметр reasoning в API запрос                    │
│     для thinking-моделей                                         │
│                                                                  │
│  2. Извлечь reasoning из ответа API                             │
│                                                                  │
│  3. Сохранить в поле reasoning_path в БД                        │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ChatMessage.tsx                               │
│                                                                  │
│  4. Создать компонент ThinkingBlock:                            │
│     - Схлопнутый по умолчанию                                   │
│     - Отличительный стиль (мелкий шрифт, другой цвет)          │
│     - Иконка "мозг" или "шестерёнки"                            │
│     - Переключатель "показать/скрыть"                           │
│                                                                  │
│  5. Интеграция перевода:                                        │
│     - Кнопка "Перевести" если язык = ru                         │
│     - Использовать Lovable AI для перевода                      │
└─────────────────────────────────────────────────────────────────┘
```

---

### Часть 1: Изменения в Edge Function

#### 1.1 Модификация запроса для Lovable AI Gateway

В `supabase/functions/hydra-orchestrator/index.ts`, функция `callLovableAI`:

```typescript
// Добавить параметр reasoning для thinking-моделей
const isThinkingModel = THINKING_MODELS.some(tm => model.includes(tm));

const requestBody = {
  model,
  messages: [...],
  ...tempParam,
  ...tokenParam,
  // Запросить reasoning для thinking-моделей
  ...(isThinkingModel ? { 
    reasoning: { 
      effort: "high",  // или "medium"
      exclude: false   // включить в ответ
    }
  } : {}),
};
```

#### 1.2 Извлечение reasoning из ответа

```typescript
const data = await response.json();
const content = data.choices?.[0]?.message?.content || "";
const reasoning = data.choices?.[0]?.message?.reasoning || null;

return {
  model,
  provider: "lovable",
  content,
  reasoning,  // добавить в возврат
};
```

#### 1.3 Сохранение в БД

```typescript
const messagesToInsert = successResults.map(result => ({
  session_id,
  user_id: user.id,
  role: result.role,
  model_name: result.model,
  content: result.content,
  reasoning_path: result.reasoning || null,  // сохранить reasoning
  metadata: { provider: result.provider },
}));
```

---

### Часть 2: Компонент отображения

#### 2.1 Новый компонент ThinkingBlock

Создать `src/components/warroom/ThinkingBlock.tsx`:

```typescript
interface ThinkingBlockProps {
  reasoning: string;
  onTranslate?: () => void;
  isTranslating?: boolean;
  translatedText?: string;
}

export function ThinkingBlock({ 
  reasoning, 
  onTranslate, 
  isTranslating,
  translatedText 
}: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { language, t } = useLanguage();
  
  const displayText = translatedText || reasoning;
  
  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="mb-3 border border-border/30 rounded-lg bg-muted/20">
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/30">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs text-muted-foreground">
            {t('thinking.title')}
          </span>
          <ChevronDown className={cn(
            "h-3.5 w-3.5 ml-auto transition-transform",
            isExpanded && "rotate-180"
          )} />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-3 pt-0">
            <pre className="text-[11px] text-muted-foreground/70 
                          font-mono whitespace-pre-wrap leading-relaxed
                          max-h-[200px] overflow-y-auto">
              {displayText}
            </pre>
            
            {language === 'ru' && !translatedText && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onTranslate}
                disabled={isTranslating}
                className="mt-2 text-xs"
              >
                <Languages className="h-3 w-3 mr-1" />
                {isTranslating ? t('thinking.translating') : t('thinking.translate')}
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
```

#### 2.2 Стилизация

| Элемент | Стиль |
|---------|-------|
| Контейнер | `bg-muted/20`, `border-border/30`, скруглённые углы |
| Заголовок | Иконка ✨ (Sparkles), текст `text-xs text-muted-foreground` |
| Текст reasoning | `text-[11px]`, `font-mono`, `text-muted-foreground/70` |
| Скролл | `max-h-[200px] overflow-y-auto` |

#### 2.3 Интеграция в ChatMessage

```tsx
// В ChatMessage.tsx, перед основным контентом:
{message.reasoning_path && (
  <ThinkingBlock 
    reasoning={message.reasoning_path}
    onTranslate={() => handleTranslate(message.id)}
    isTranslating={translatingId === message.id}
    translatedText={translations[message.id]}
  />
)}
```

---

### Часть 3: Перевод reasoning

#### 3.1 Варианты реализации

| Вариант | Плюсы | Минусы |
|---------|-------|--------|
| **Edge function для перевода** | Использует LOVABLE_API_KEY, надёжно | Требует отдельного запроса |
| **Клиентский вызов** | Быстрее, меньше кода | Требует API ключ пользователя |
| **Автоперевод на сервере** | Прозрачно для пользователя | Увеличивает время ответа, стоимость |

**Рекомендация**: Edge function для перевода по запросу (кнопка "Перевести").

#### 3.2 Новая edge function `translate-text`

```typescript
// supabase/functions/translate-text/index.ts
serve(async (req) => {
  const { text, targetLang } = await req.json();
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5-nano", // быстрая и дешёвая модель
      messages: [
        { 
          role: "system", 
          content: `Translate the following text to ${targetLang}. Return only the translation.` 
        },
        { role: "user", content: text }
      ],
      max_completion_tokens: 4096,
    }),
  });
  
  const data = await response.json();
  return new Response(JSON.stringify({ 
    translation: data.choices?.[0]?.message?.content 
  }));
});
```

---

### Часть 4: Локализация

Добавить в `LanguageContext.tsx`:

```typescript
// Thinking block
'thinking.title': { ru: 'Процесс размышления', en: 'Thinking Process' },
'thinking.translate': { ru: 'Перевести', en: 'Translate' },
'thinking.translating': { ru: 'Перевод...', en: 'Translating...' },
'thinking.translated': { ru: 'Переведено', en: 'Translated' },
```

---

### Шаги реализации

1. **Edge Function**: Добавить параметр `reasoning` в запросы для thinking-моделей
2. **Edge Function**: Извлекать и сохранять reasoning в `reasoning_path`
3. **Компонент**: Создать `ThinkingBlock.tsx` со схлопнутым блоком
4. **ChatMessage**: Интегрировать ThinkingBlock перед контентом
5. **Локализация**: Добавить переводы в LanguageContext
6. **Edge Function**: Создать `translate-text` для перевода по требованию
7. **ChatMessage**: Добавить логику перевода с состоянием

---

### Ожидаемый результат

- Пользователь видит схлопнутый блок "Процесс размышления" перед ответом
- При раскрытии показывается текст reasoning мелким моноширинным шрифтом
- Если интерфейс на русском — доступна кнопка "Перевести"
- Перевод выполняется через быструю модель (gpt-5-nano)
- Визуально блок отличается от основного контента (приглушённые цвета, меньший размер)

