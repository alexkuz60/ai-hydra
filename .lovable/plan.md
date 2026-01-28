
## План: Навигация по чату TreeView с инфо-иконками

### Цель
Добавить боковую панель навигации в Панели экспертов с древовидной структурой участников чата:
- **Супервизор** (корневой узел - пользователь с supervisor-ролью)
  - ИИ 1 (модель с ролью/настройками)
  - ИИ 2
  - ...

Каждый узел будет иметь:
- Иконку роли (Crown для супервизора, Brain/Shield/Scale для ИИ)
- Название (для ИИ - название модели)
- Инфо-иконку с tooltip показывающим детали (роль, системный промпт, кол-во сообщений)
- Возможность клика для скролла к сообщениям этого участника

---

### Архитектура решения

```text
┌────────────────────────────────────────────────────────────────────────┐
│                         ExpertPanel.tsx                                 │
│                                                                         │
│  ┌─────────────────┐  ┌──────────────────────────────────────────────┐ │
│  │ ChatTreeNav     │  │                Chat Area                      │ │
│  │                 │  │                                               │ │
│  │ 👑 Супервизор   │  │  ┌────────────────────────────────────────┐  │ │
│  │   (info-icon)   │  │  │ Message 1                              │  │ │
│  │                 │  │  └────────────────────────────────────────┘  │ │
│  │ ├─ 🧠 GPT-5     │  │  ┌────────────────────────────────────────┐  │ │
│  │ │    (info)     │  │  │ Message 2                              │  │ │
│  │ │               │  │  └────────────────────────────────────────┘  │ │
│  │ ├─ 🛡 Claude    │  │                                               │ │
│  │ │    (info)     │  │                                               │ │
│  │ │               │  │                                               │ │
│  │ └─ ⚖ Gemini    │  │                                               │ │
│  │      (info)     │  │                                               │ │
│  └─────────────────┘  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Часть 1: Новый компонент ChatTreeNav

#### Файл: `src/components/warroom/ChatTreeNav.tsx`

Создать новый компонент с древовидной структурой:

```typescript
interface ChatParticipant {
  id: string;           // 'user' или model_id
  type: 'supervisor' | 'ai';
  name: string;         // Имя пользователя или модели
  role?: AgentRole;     // assistant | critic | arbiter | consultant
  icon: React.ElementType;
  color: string;
  messageCount: number;
  systemPrompt?: string;
}

interface ChatTreeNavProps {
  messages: Message[];
  selectedModels: string[];
  perModelSettings: PerModelSettingsData;
  userDisplayInfo: UserDisplayInfo;
  onParticipantClick: (participantId: string) => void;
  activeParticipant: string | null;
}
```

**Функциональность:**
1. Анализ `messages` для подсчёта сообщений каждого участника
2. Построение дерева: Супервизор → AI модели
3. Collapsible секции для сворачивания AI-узлов
4. Инфо-иконки с Tooltip для каждого участника:
   - **Супервизор**: имя, кол-во сообщений
   - **AI**: роль, модель, системный промпт (первые 100 символов), кол-во сообщений

---

### Часть 2: Структура компонента

```typescript
// Иконки и цвета по ролям (повторно используем из ChatMessage)
const roleIcons = {
  user: { icon: Crown, color: 'text-amber-500' },
  assistant: { icon: Brain, color: 'text-hydra-expert' },
  critic: { icon: Shield, color: 'text-hydra-critical' },
  arbiter: { icon: Scale, color: 'text-hydra-arbiter' },
  consultant: { icon: Lightbulb, color: 'text-amber-400' },
};

// Вычисление участников из сообщений
const participants = useMemo(() => {
  const result: ChatParticipant[] = [];
  
  // Супервизор (все user сообщения)
  const userMessages = messages.filter(m => m.role === 'user');
  result.push({
    id: 'user',
    type: 'supervisor',
    name: userDisplayInfo.displayName || t('role.supervisor'),
    icon: Crown,
    color: 'text-amber-500',
    messageCount: userMessages.length,
  });
  
  // AI модели (группировка по model_name)
  const modelGroups = new Map<string, Message[]>();
  messages.filter(m => m.role !== 'user').forEach(m => {
    const key = m.model_name || 'unknown';
    const existing = modelGroups.get(key) || [];
    existing.push(m);
    modelGroups.set(key, existing);
  });
  
  modelGroups.forEach((msgs, modelName) => {
    const lastRole = msgs[msgs.length - 1]?.role || 'assistant';
    const settings = perModelSettings[modelName];
    result.push({
      id: modelName,
      type: 'ai',
      name: getModelShortName(modelName),
      role: settings?.role || lastRole,
      icon: roleIcons[lastRole].icon,
      color: roleIcons[lastRole].color,
      messageCount: msgs.length,
      systemPrompt: settings?.systemPrompt,
    });
  });
  
  return result;
}, [messages, perModelSettings, userDisplayInfo]);
```

---

### Часть 3: UI компонента

```typescript
return (
  <div className="w-56 border-r border-border bg-sidebar flex flex-col">
    <div className="p-3 border-b border-border">
      <h3 className="text-sm font-medium text-sidebar-foreground flex items-center gap-2">
        <Users className="h-4 w-4" />
        {t('chat.participants')}
      </h3>
    </div>
    
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {participants.map((participant, index) => (
          <div 
            key={participant.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all",
              participant.type === 'ai' && "ml-4", // Отступ для AI
              activeParticipant === participant.id && "bg-sidebar-accent",
              "hover:bg-sidebar-accent/50"
            )}
            onClick={() => onParticipantClick(participant.id)}
          >
            {/* Линия дерева для AI */}
            {participant.type === 'ai' && (
              <div className="absolute left-4 w-px h-full bg-border" />
            )}
            
            {/* Иконка роли */}
            <participant.icon className={cn("h-4 w-4", participant.color)} />
            
            {/* Имя */}
            <span className="flex-1 text-sm truncate">
              {participant.name}
            </span>
            
            {/* Счётчик сообщений */}
            <Badge variant="secondary" className="text-xs">
              {participant.messageCount}
            </Badge>
            
            {/* Info tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1">
                  {participant.type === 'supervisor' ? (
                    <>
                      <p className="font-medium">{t('role.supervisor')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('chat.messagesCount')}: {participant.messageCount}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">{participant.name}</p>
                      <p className="text-xs">
                        <span className="text-muted-foreground">{t('settings.role')}:</span>{' '}
                        {t(`role.${participant.role}`)}
                      </p>
                      {participant.systemPrompt && (
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {participant.systemPrompt.slice(0, 100)}...
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t('chat.messagesCount')}: {participant.messageCount}
                      </p>
                    </>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    </ScrollArea>
  </div>
);
```

---

### Часть 4: Интеграция в ExpertPanel

#### Обновить `src/pages/ExpertPanel.tsx`

1. Добавить состояние для активного участника:
```typescript
const [activeParticipant, setActiveParticipant] = useState<string | null>(null);
```

2. Добавить refs для скролла к сообщениям:
```typescript
const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
```

3. Добавить handler для клика по участнику:
```typescript
const handleParticipantClick = (participantId: string) => {
  setActiveParticipant(participantId);
  
  // Найти первое сообщение этого участника и проскролить
  const firstMessage = messages.find(m => 
    participantId === 'user' 
      ? m.role === 'user' 
      : m.model_name === participantId
  );
  
  if (firstMessage) {
    messageRefs.current.get(firstMessage.id)?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }
};
```

4. Обновить layout с боковой панелью:
```typescript
<div className="h-[calc(100vh-4rem)] flex overflow-hidden">
  {/* Tree Navigation */}
  <ChatTreeNav
    messages={messages}
    selectedModels={selectedModels}
    perModelSettings={perModelSettings}
    userDisplayInfo={userDisplayInfo}
    onParticipantClick={handleParticipantClick}
    activeParticipant={activeParticipant}
  />
  
  {/* Main Content */}
  <div className="flex-1 flex flex-col">
    {/* ... existing chat area ... */}
  </div>
</div>
```

---

### Часть 5: Локализация

#### Добавить в `src/contexts/LanguageContext.tsx`:

```typescript
'chat.participants': { ru: 'Участники', en: 'Participants' },
'chat.messagesCount': { ru: 'Сообщений', en: 'Messages' },
'chat.scrollTo': { ru: 'Перейти к сообщениям', en: 'Scroll to messages' },
'chat.noParticipants': { ru: 'Нет участников', en: 'No participants' },
```

---

### Часть 6: Визуальная связь с сообщениями

Для подсветки сообщений выбранного участника:

```typescript
// В ChatMessage добавить подсветку
<HydraCard 
  variant={config.variant}
  className={cn(
    "animate-slide-up group relative",
    isHighlighted && "ring-2 ring-primary/50"
  )}
>
```

---

### Опциональные улучшения

1. **Сворачивание панели** - кнопка для скрытия TreeNav на мобильных
2. **Фильтр по участнику** - показывать только сообщения выбранного
3. **Статистика в tooltip** - средний рейтинг ответов модели

---

### Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/components/warroom/ChatTreeNav.tsx` | Создать новый |
| `src/pages/ExpertPanel.tsx` | Интегрировать ChatTreeNav |
| `src/contexts/LanguageContext.tsx` | Добавить переводы |
| `src/components/warroom/ChatMessage.tsx` | Опционально: добавить подсветку |

---

### Ожидаемый результат

- Левая панель с деревом участников чата
- Супервизор (Crown) как корневой узел
- AI модели как дочерние узлы с отступом
- Иконки ролей с цветовой кодировкой
- Badges с количеством сообщений
- Info-иконки с tooltips (роль, системный промпт, статистика)
- Клик переносит к сообщениям участника
