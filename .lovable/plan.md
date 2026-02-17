
# Память ИИ-Гидры — Новый раздел управления RAG

## Цель

Создать централизованную страницу управления всеми слоями RAG-памяти Гидры: `session_memory`, `role_memory` и `role_knowledge`. Страница даёт пользователю инструменты инспекции, поиска, очистки и понимания накопленного интеллекта. Первая итерация — фундамент (пункт 1 задачи), без тяжёлого функционала управления.

## Что будет сделано

### 1. Маршрут и ленивая загрузка

- Добавить `const HydraMemory = lazyWithRetry(...)` в `src/App.tsx`
- Добавить `<Route path="/hydra-memory" element={<HydraMemory />} />` рядом с остальными роутами
- Создать `src/pages/HydraMemory.tsx` — страница-заглушка с базовой структурой

### 2. Пункт меню в AppSidebar

- Добавить иконку `BrainCircuit` из lucide-react (или `MemoryStick`) в массив `navItems` в `src/components/layout/AppSidebar.tsx`
- Добавить ключ перевода `nav.hydraMemory` в `src/contexts/LanguageContext.tsx`
- Путь: `/hydra-memory`, доступен только авторизованным пользователям
- Позиция в списке: после `flow-editor`, перед `model-ratings` (логично: память — между логикой потоков и рейтингами)
- Цвет иконки при активном состоянии: `text-hydra-memory` (уже определён в CSS-переменных как violet)

### 3. Страница HydraMemory.tsx — структура первой итерации

Страница разделена на три вкладки (Tabs):

**Вкладка 1: Память сессий** (`session_memory`)
- Общая статистика: всего чанков, разбивка по типам (decision / context / instruction / evaluation / summary / message)
- Список последних сессий с количеством чанков
- Кнопка «Поиск по памяти» (открывает диалог с семантическим поиском — переиспользует логику из `SessionMemoryDialog`)
- Заглушка с пояснением, что полный функционал — в следующих итерациях

**Вкладка 2: Опыт ролей** (`role_memory`)
- Статистика по ролям: сколько записей у каждой роли, средний confidence score
- Список записей с типами (experience / preference / skill / mistake / success) и уверенностью
- Кнопка удаления отдельных записей (использует `useRoleMemory`)
- Цветовые бейджи типов памяти

**Вкладка 3: База знаний** (`role_knowledge`)
- Количество чанков по ролям
- Категории знаний (из `category` колонки)
- Информация о версиях и источниках
- Кнопка «Обновить» ведёт к Штату специалистов (для управления — там уже есть инструменты)

### 4. Хук useHydraMemoryStats.ts

Новый хук для агрегации статистики по всем трём слоям памяти:

```
src/hooks/useHydraMemoryStats.ts
```

- Запрашивает агрегированные данные из `session_memory` (GROUP BY user_id — общее количество)
- Запрашивает данные из `role_memory` (GROUP BY role)
- Запрашивает данные из `role_knowledge` (GROUP BY role, category)
- Возвращает единый объект статистики для страницы

### 5. Локализация

Добавить в `src/contexts/LanguageContext.tsx`:

```
'nav.hydraMemory': { ru: 'Память Гидры', en: 'Hydra Memory' }
'memory.hub.title': { ru: 'Центр управления памятью', en: 'Memory Control Hub' }
'memory.hub.session': { ru: 'Память сессий', en: 'Session Memory' }
'memory.hub.roleMemory': { ru: 'Опыт ролей', en: 'Role Experience' }
'memory.hub.knowledge': { ru: 'База знаний', en: 'Knowledge Base' }
'memory.hub.totalChunks': { ru: 'Всего фрагментов', en: 'Total Chunks' }
'memory.hub.roles': { ru: 'Ролей с опытом', en: 'Roles with experience' }
'memory.hub.avgConfidence': { ru: 'Средняя уверенность', en: 'Average confidence' }
'memory.hub.empty': { ru: 'Память пуста', en: 'Memory is empty' }
```

## Технические детали

### Данные в базе (текущее состояние)
```text
session_memory:  160 записей
role_memory:      27 записей (27 единиц опыта ролей)
role_knowledge:   88 записей (база знаний штата)
```

### Цветовая схема страницы
- Акцент: `text-hydra-memory` / `bg-hydra-memory/10` / `border-hydra-memory` (violet, уже в CSS-переменных)
- Иконка раздела: `BrainCircuit` (lucide-react)

### Что НЕ делается в этой итерации
- Полноценное управление `role_knowledge` (оно уже в StaffRoles)
- Reranking-интерфейс (стратегический задел на будущее)
- Редактирование чанков памяти сессий
- Экспорт памяти в файл

## Затронутые файлы

| Файл | Действие |
|------|----------|
| `src/App.tsx` | Добавить роут `/hydra-memory` |
| `src/components/layout/AppSidebar.tsx` | Добавить пункт меню |
| `src/contexts/LanguageContext.tsx` | Добавить ключи перевода |
| `src/pages/HydraMemory.tsx` | Создать (новый файл) |
| `src/hooks/useHydraMemoryStats.ts` | Создать (новый файл) |

## Стратегический контекст

Эта страница — первый кирпич в архитектуре «Reflection» из дорожной карты Гидры. Следующие итерации на этом фундаменте:
- Интерфейс для Reranking и оценки качества чанков
- Инструмент дедупликации `role_knowledge`
- HyDE-поиск через Архивариуса
- Hybrid Search (BM25 + vector) для технических запросов
- Визуализация связей между слоями памяти (граф)
