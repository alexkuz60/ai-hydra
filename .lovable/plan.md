
# Аудит кодовой базы: избыточность, ошибки логики, оптимизация

## 1. Мертвый код: `useConsultantChat.ts` -- не используется

Файл `src/hooks/useConsultantChat.ts` (191 строка) **нигде не импортируется**. Он был заменен на `useStreamingChat.ts`, но не удален. Содержит устаревшую версию `ConsultantMode` (без `promptengineer` и `duel`).

**Действие:** Удалить файл.

---

## 2. Тройное дублирование маппинга `modeToRole`

Маппинг `ConsultantMode -> role` определен **в трех местах** с расхождениями:

| Файл | Ключи | Значения |
|------|-------|----------|
| `useConsultantChat.ts` | 5 режимов | без `promptengineer`, `duel` |
| `useStreamingChat.ts` | 7 режимов | полный набор |
| `ConsultantPanel.tsx` | 7 режимов | маппит на `AgentRole` (другой тип) |

Плюс четвертый маппинг `ROLE_MAP` в `useSendMessage.ts` (строка 396) для `copyConsultantResponse`.

**Действие:** Вынести единый маппинг в `src/config/roles.ts`.

---

## 3. Дублирование логики Supervisor Wishes (localStorage)

Идентичные пары `useEffect` для загрузки/сохранения `selectedWishes` в `localStorage` присутствуют в:
- `ExpertPanel.tsx` (строки 107-134)
- `ConsultantPanel.tsx` (строки 114-142)

Оба компонента используют ключ `hydra-supervisor-wishes-${sessionId}`, но **независимо управляют своим состоянием**. Это значит, что при изменении wishes в D-Chat, основной чат об этом не знает и наоборот.

**Действие:** Извлечь в пользовательский хук `useSupervisorWishes(sessionId)`.

---

## 4. Тройное дублирование подготовки `memoryContext`

В `ConsultantPanel.tsx` один и тот же блок `chunks.map(chunk => ...)` повторяется **3 раза** (строки 173, 250, 322).

**Действие:** Вынести в `useMemo` один раз.

---

## 5. Ошибка логики: пропущены зависимости в `useCallback`

`callOrchestrator` в `useSendMessage.ts` (строка 225) имеет зависимости `[sessionId, onRequestError]`, но использует `selectedModelsRef` и `selectedModels` из замыкания. Значение `selectedModels` будет устаревшим (stale closure).

**Действие:** Добавить `selectedModelsRef` в зависимости (он стабилен как ref) или убрать `selectedModels` из тела, полностью полагаясь на `selectedModelsRef.current`.

---

## 6. Ошибка логики: `system_prompt` в `buildModelConfig`

Строка 33:
```
system_prompt: settings.systemPrompt || (roleOverride === 'consultant' ? DEFAULT_MODEL_SETTINGS.systemPrompt : settings.systemPrompt)
```

Если `settings.systemPrompt` -- пустая строка `""` (falsy), условие перейдет к правой части. Но если `roleOverride !== 'consultant'`, результат снова будет `settings.systemPrompt` (та же пустая строка). Логика тавтологична для не-консультантов.

**Действие:** Упростить до: `system_prompt: roleOverride === 'consultant' ? (settings.systemPrompt || DEFAULT_MODEL_SETTINGS.systemPrompt) : settings.systemPrompt`.

---

## 7. Жестко зашитые строки ошибок (не локализованы)

Сообщения `'Превышен лимит запросов. Попробуйте позже.'` и `'Требуется пополнение баланса Lovable AI.'` повторяются **в 5 файлах** без использования системы `t()`:
- `useSendMessage.ts`
- `useConsultantChat.ts`
- `useStreamingChat.ts`
- `useStreamingResponses.ts`
- `useFlowLogistics.ts`

**Действие:** Добавить ключи локализации и заменить на `t('errors.rateLimit')` / `t('errors.paymentRequired')`.

---

## 8. Ошибка: `handleResizeStart` сохраняет устаревшую высоту

В `ConsultantPanel.tsx` (строка 218):
```js
localStorage.setItem('hydra-dchat-input-height', String(inputHeight));
```
`inputHeight` замкнут на момент начала resize, а не на финальное значение. К моменту `mouseup` реальная высота уже другая.

**Действие:** Использовать ref или читать актуальное значение через callback.

---

## 9. Избыточный `useEffect` для `initialQuery` в ConsultantPanel

Эффект на строке 246 зависит от `[initialQuery, selectedModel, sendQuery, onClearInitialQuery, chunks]`. Изменение `chunks` (память обновилась) **повторно запустит весь эффект**, что может привести к повторной отправке запроса модератору.

**Действие:** Использовать ref для `chunks` вместо включения в зависимости.

---

## 10. Потенциальная утечка: отсутствует cleanup в resize handler

В `handleResizeStart` (строка 200) слушатели `mousemove`/`mouseup` добавляются на `document`. Если компонент размонтируется до `mouseup`, слушатели останутся.

**Действие:** Добавить cleanup через `useEffect` return или хранить ссылки на обработчики.

---

## Сводка приоритетов

| # | Тип | Приоритет | Сложность |
|---|-----|-----------|-----------|
| 1 | Мертвый код | Высокий | Простая |
| 2 | Дублирование маппинга | Средний | Средняя |
| 3 | Дублирование wishes | Средний | Средняя |
| 4 | Дублирование memoryContext | Низкий | Простая |
| 5 | Stale closure | Высокий | Простая |
| 6 | Тавтология system_prompt | Средний | Простая |
| 7 | Жесткие строки | Средний | Средняя |
| 8 | Устаревшая высота resize | Низкий | Простая |
| 9 | Повторный запуск эффекта | Высокий | Средняя |
| 10 | Утечка resize listeners | Низкий | Простая |

## План реализации

1. Удалить `useConsultantChat.ts`
2. Создать единый маппинг в `config/roles.ts` и обновить импорты
3. Извлечь `useSupervisorWishes` хук
4. Обернуть `memoryContext` в `useMemo` в `ConsultantPanel`
5. Исправить зависимости `callOrchestrator`
6. Исправить логику `system_prompt`
7. Добавить ключи локализации для ошибок
8. Исправить `handleResizeStart` через ref
9. Использовать ref для `chunks` в эффекте `initialQuery`
10. Добавить cleanup для resize listeners
