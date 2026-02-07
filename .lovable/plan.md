
# Аудит кодовой базы: РЕАЛИЗОВАНО ✅

Все 10 пунктов аудита реализованы.

## Выполненные изменения

| # | Задача | Статус |
|---|--------|--------|
| 1 | Удалён мёртвый код `useConsultantChat.ts` | ✅ |
| 2 | Единый маппинг `CONSULTANT_MODE_TO_ROLE` / `CONSULTANT_MODE_TO_AGENT_ROLE` / `CONSULTANT_MODE_TO_MESSAGE_ROLE` в `config/roles.ts` | ✅ |
| 3 | Извлечён `useSupervisorWishes` хук, используется в ExpertPanel и ConsultantPanel | ✅ |
| 4 | `memoryContext` обёрнут в `useMemo` в ConsultantPanel (было 3x дублирование) | ✅ |
| 5 | Исправлены зависимости `callOrchestrator` в `useSendMessage.ts` | ✅ |
| 6 | Исправлена тавтология `system_prompt` в `buildModelConfig` | ✅ |
| 7 | Добавлены ключи локализации `errors.rateLimit` / `errors.paymentRequired`, обновлены `useSendMessage`, `useStreamingChat` | ✅ |
| 8 | `handleResizeStart` использует `inputHeightRef` для актуальной высоты | ✅ |
| 9 | `initialQuery` эффект использует `chunksRef` вместо `chunks` в зависимостях | ✅ |
| 10 | Добавлен cleanup для resize listeners через `resizeCleanupRef` + `useEffect` return | ✅ |

## Затронутые файлы

- ❌ Удалён: `src/hooks/useConsultantChat.ts`
- ✨ Создан: `src/hooks/useSupervisorWishes.ts`
- ✏️ Изменён: `src/config/roles.ts` (новые маппинги)
- ✏️ Изменён: `src/components/warroom/ConsultantPanel.tsx` (полный рефакторинг)
- ✏️ Изменён: `src/pages/ExpertPanel.tsx` (wishes → хук)
- ✏️ Изменён: `src/hooks/useSendMessage.ts` (system_prompt, deps, localization, mapping)
- ✏️ Изменён: `src/hooks/useStreamingChat.ts` (centralized mapping, localization)
- ✏️ Изменён: `src/contexts/LanguageContext.tsx` (error keys)
- ✏️ Изменён: `src/hooks/useFlowLogistics.ts` (consistent error messages)
