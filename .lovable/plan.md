
# План: Добавление новых ИИ-ролей с унифицированными иконками

## Обзор

Добавление 5 новых ИИ-ролей во все выпадающие списки проекта с унифицированными иконками. Новые роли:
- **Модератор** (Moderator) — управление дискуссиями
- **Советник** (Advisor) — рекомендации и советы  
- **Архивариус** (Archivist) — работа с данными и архивами
- **Аналитик** (Analyst) — анализ информации
- **Web-Охотник** (Web Hunter) — поиск в интернете

## Затрагиваемые файлы

| Файл | Изменения |
|------|-----------|
| `src/types/messages.ts` | Расширение типа `MessageRole` |
| `src/contexts/LanguageContext.tsx` | Добавление переводов для новых ролей |
| `src/components/warroom/ModelSettings.tsx` | Обновление типа `AgentRole` и дефолтных промптов |
| `src/components/warroom/PerModelSettings.tsx` | Обновление типа `AgentRole` и дефолтных промптов |
| `src/pages/RoleLibrary.tsx` | Обновление типа `AgentRole` и всех Select-списков |
| `src/components/warroom/PromptLibraryPicker.tsx` | Добавление новых ролей в фильтр |
| `src/components/warroom/ChatMessage.tsx` | Добавление конфигураций для новых ролей |
| `src/components/warroom/ChatTreeNav.tsx` | Добавление конфигураций для навигатора |
| `src/index.css` | Добавление CSS-токенов для новых ролей |
| `tailwind.config.ts` | Добавление Tailwind-токенов для новых ролей |
| `src/components/ui/hydra-card.tsx` | Добавление вариантов карточек для новых ролей |

## Иконки для ролей (Lucide React)

| Роль | Иконка | Обоснование |
|------|--------|-------------|
| Expert (assistant) | `Brain` | Интеллект, знания |
| Critic | `Shield` | Защита от ошибок |
| Arbiter | `Scale` | Баланс, взвешенное решение |
| Consultant | `Lightbulb` | Идеи, озарение |
| **Moderator** | `Gavel` | Управление, модерация |
| **Advisor** | `HandHelping` | Помощь, поддержка |
| **Archivist** | `Archive` | Хранение данных |
| **Analyst** | `LineChart` | Анализ данных |
| **Web Hunter** | `Globe` | Интернет-поиск |

## Цветовая схема новых ролей

| Роль | Цвет | HSL значение |
|------|------|--------------|
| Moderator | Синий (уже есть) | `200 80% 50%` |
| Advisor | Изумрудный | `160 70% 45%` |
| Archivist | Коричневый/бронзовый | `30 60% 45%` |
| Analyst | Индиго | `240 70% 55%` |
| Web Hunter | Оранжевый | `25 90% 55%` |

---

## Технические детали

### 1. Обновление типов ролей

```typescript
// src/types/messages.ts
export type MessageRole = 'user' | 'assistant' | 'critic' | 'arbiter' | 'consultant' 
  | 'moderator' | 'advisor' | 'archivist' | 'analyst' | 'webhunter';

// src/components/warroom/ModelSettings.tsx и PerModelSettings.tsx  
export type AgentRole = 'assistant' | 'critic' | 'arbiter' | 'consultant' 
  | 'moderator' | 'advisor' | 'archivist' | 'analyst' | 'webhunter';
```

### 2. Локализация (LanguageContext.tsx)

```typescript
'role.moderator': { ru: 'Модератор', en: 'Moderator' },
'role.advisor': { ru: 'Советник', en: 'Advisor' },
'role.archivist': { ru: 'Архивариус', en: 'Archivist' },
'role.analyst': { ru: 'Аналитик', en: 'Analyst' },
'role.webhunter': { ru: 'Web-Охотник', en: 'Web Hunter' },
```

### 3. Дизайн-токены (index.css)

```css
/* Новые токены для ролей */
--hydra-advisor: 160 70% 45%;
--hydra-archivist: 30 60% 45%;
--hydra-analyst: 240 70% 55%;
--hydra-webhunter: 25 90% 55%;
```

### 4. Создание переиспользуемой конфигурации ролей

Для унификации создадим централизованный объект конфигурации ролей:

```typescript
// Единая конфигурация ролей для всего проекта
export const ROLE_CONFIG = {
  assistant: { icon: Brain, color: 'text-hydra-expert', label: 'role.assistant' },
  critic: { icon: Shield, color: 'text-hydra-critical', label: 'role.critic' },
  arbiter: { icon: Scale, color: 'text-hydra-arbiter', label: 'role.arbiter' },
  consultant: { icon: Lightbulb, color: 'text-hydra-consultant', label: 'role.consultant' },
  moderator: { icon: Gavel, color: 'text-hydra-moderator', label: 'role.moderator' },
  advisor: { icon: HandHelping, color: 'text-hydra-advisor', label: 'role.advisor' },
  archivist: { icon: Archive, color: 'text-hydra-archivist', label: 'role.archivist' },
  analyst: { icon: LineChart, color: 'text-hydra-analyst', label: 'role.analyst' },
  webhunter: { icon: Globe, color: 'text-hydra-webhunter', label: 'role.webhunter' },
};
```

### 5. Компонент RoleSelectItem с иконками

Для унификации выпадающих списков создадим компонент:

```tsx
// Переиспользуемый SelectItem с иконкой роли
function RoleSelectItem({ value, label, icon: Icon, color }: RoleSelectItemProps) {
  return (
    <SelectItem value={value} className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", color)} />
      <span>{label}</span>
    </SelectItem>
  );
}
```

### 6. Обновление всех Select-компонентов

Все места с выбором ролей будут обновлены для использования единой конфигурации:

- `ModelSettings.tsx` — настройки модели
- `PerModelSettings.tsx` — настройки для нескольких моделей
- `RoleLibrary.tsx` — библиотека ролей (3 места)
- `PromptLibraryPicker.tsx` — выбор из библиотеки промптов

### 7. Дефолтные системные промпты

```typescript
const DEFAULT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  // ... существующие роли ...
  moderator: 'Вы - модератор дискуссии. Следите за порядком, направляйте обсуждение...',
  advisor: 'Вы - советник. Предоставляйте рекомендации и стратегические советы...',
  archivist: 'Вы - архивариус. Систематизируйте информацию, находите релевантные данные...',
  analyst: 'Вы - аналитик. Проводите глубокий анализ данных и выявляйте закономерности...',
  webhunter: 'Вы - web-охотник. Специализируетесь на поиске информации в интернете...',
};
```

## Порядок реализации

1. Добавить CSS и Tailwind токены для новых ролей
2. Обновить типы `MessageRole` и `AgentRole`
3. Добавить переводы в `LanguageContext.tsx`
4. Создать централизованную конфигурацию ролей
5. Обновить `ChatMessage.tsx` и `ChatTreeNav.tsx`
6. Обновить все Select-компоненты с иконками
7. Добавить дефолтные промпты для новых ролей
8. Добавить варианты карточек в `hydra-card.tsx`

## Результат

После внедрения:
- Все 9 ИИ-ролей доступны во всех выпадающих списках
- Каждая роль имеет уникальную иконку и цвет
- Унифицированный вид во всём приложении
- Дефолтные системные промпты для каждой роли

