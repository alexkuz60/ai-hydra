

# План: Расширение функциональности D-чата

## Обзор

Добавление трёх возможностей для D-чата:
1. Отправка запроса в D-чат из навигатора коллективного чата (ChatTreeNav)
2. Кнопка копирования ответа D-чата в основной чат с привязкой к исходному сообщению
3. Кнопка сворачивания/разворачивания в заголовке D-чата

## Архитектура решения

```text
+----------------+---------------------------+------------------+
|  ChatTreeNav   |      Основной чат         |     D-Чат        |
|                |                           |                  |
|  [Сообщение    |                           |  [Развернуть/    |
|   Супервизора] |                           |   Схлопнуть]     |
|   [🔍] ←──────────────────────────────────────→ Запрос        |
|                |                           |                  |
|                |    ← [Копировать] ←───────── Ответ D-чата    |
+----------------+---------------------------+------------------+
```

## Изменения

### 1. Добавление кнопки "Отправить в D-чат" в ChatTreeNav

Кнопка рядом с узлом сообщения Супервизора для отправки контекста сообщения в D-чат:
- Иконка лампочки (Lightbulb) как идентификатор D-чата
- При клике: передаём ID сообщения и его содержимое в D-чат
- D-чат разворачивается и готов к отправке запроса с контекстом

### 2. Копирование ответа D-чата в основной чат

Под каждым ответом консультанта добавляем кнопку "Копировать в чат":
- Вставляет контент ответа как новое сообщение в основной чат
- Привязка к исходному сообщению супервизора (если запрос был отправлен из навигатора)
- Сообщение сохраняется в БД с ролью `consultant`

### 3. Кнопка сворачивания/разворачивания D-чата

В заголовке D-чата добавляем кнопку:
- Иконка `ChevronRight` (схлопнуть) / `ChevronLeft` (развернуть)
- При клике: устанавливаем ширину панели в 3% (схлопнуто) или 20% (развёрнуто)

## Детали реализации

### Новые Props и Callbacks

**ConsultantPanel:**
```typescript
interface ConsultantPanelProps {
  sessionId: string | null;
  availableModels: ModelOption[];
  isCollapsed: boolean;
  onExpand: () => void;
  onCollapse: () => void;  // Новый callback
  // Контекст запроса из навигатора
  initialQuery?: {
    messageId: string;
    content: string;
  };
  onClearInitialQuery?: () => void;
  // Копирование в основной чат
  onCopyToMainChat?: (content: string, sourceMessageId: string | null) => void;
}
```

**ChatTreeNav:**
```typescript
interface ChatTreeNavProps {
  // Существующие props...
  onSendToDChat?: (messageId: string, content: string) => void;  // Новый callback
}
```

### Хранение контекста запроса

```typescript
// В ExpertPanel.tsx
const [dChatContext, setDChatContext] = useState<{
  messageId: string;
  content: string;
} | null>(null);

const handleSendToDChat = useCallback((messageId: string, content: string) => {
  setDChatContext({ messageId, content });
  saveConsultantPanelWidth(20); // Разворачиваем D-чат
}, [saveConsultantPanelWidth]);
```

### Копирование в основной чат

```typescript
// Новая функция в useSendMessage.ts
const copyConsultantResponse = useCallback(async (
  content: string,
  sourceMessageId: string | null
) => {
  if (!sessionId) return;
  
  await supabase.from('messages').insert({
    session_id: sessionId,
    user_id: userId,
    role: 'consultant',
    content,
    metadata: sourceMessageId ? { source_message_id: sourceMessageId } : null,
  });
}, [sessionId, userId]);
```

### UI элементы

**Кнопка в SupervisorNode (ChatTreeNav):**
```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 opacity-0 group-hover/block:opacity-100"
      onClick={(e) => {
        e.stopPropagation();
        onSendToDChat?.(block.id, block.contentPreview);
      }}
    >
      <Lightbulb className="h-3 w-3 text-hydra-consultant" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>{t('dchat.sendToConsultant')}</TooltipContent>
</Tooltip>
```

**Кнопка копирования под ответом D-чата:**
```typescript
{!isUser && !message.isLoading && onCopyToMainChat && (
  <div className="mt-2 pt-2 border-t border-border/50">
    <Button
      variant="ghost"
      size="sm"
      className="h-6 text-xs"
      onClick={() => onCopyToMainChat(message.content, message.sourceMessageId)}
    >
      <Copy className="h-3 w-3 mr-1" />
      {t('dchat.copyToChat')}
    </Button>
  </div>
)}
```

**Кнопка свернуть в заголовке D-чата:**
```typescript
<Button
  variant="ghost"
  size="icon"
  className="h-7 w-7"
  onClick={onCollapse}
>
  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
</Button>
```

## Порядок изменения файлов

1. `src/contexts/LanguageContext.tsx` — новые ключи переводов
2. `src/hooks/useConsultantChat.ts` — расширение типа ConsultantMessage для sourceMessageId
3. `src/hooks/useSendMessage.ts` — функция copyConsultantResponse
4. `src/components/warroom/ConsultantPanel.tsx` — новые props и UI элементы
5. `src/components/warroom/ChatTreeNav.tsx` — кнопка отправки в D-чат
6. `src/pages/ExpertPanel.tsx` — интеграция всех новых callbacks

## Новые ключи переводов

```typescript
'dchat.sendToConsultant': { ru: 'Спросить в D-чате', en: 'Ask in D-Chat' },
'dchat.copyToChat': { ru: 'Копировать в чат', en: 'Copy to chat' },
'dchat.collapse': { ru: 'Свернуть', en: 'Collapse' },
'dchat.expand': { ru: 'Развернуть', en: 'Expand' },
'dchat.contextFrom': { ru: 'Контекст из: Сообщение #{index}', en: 'Context from: Message #{index}' },
```

## Ожидаемый результат

После реализации:
1. В навигаторе при наведении на сообщение Супервизора появляется кнопка лампочки
2. Клик по лампочке разворачивает D-чат и устанавливает контекст запроса
3. Под ответами D-чата появляется кнопка "Копировать в чат"
4. Скопированное сообщение добавляется в основной чат как сообщение Консультанта
5. В заголовке D-чата есть кнопка для быстрого сворачивания панели

