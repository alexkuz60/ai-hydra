

## План: Хронологическая структура TreeNav + Resizable панель

### Цель
1. Изменить структуру навигации на хронологическую — каждый запрос Супервизора с дочерними ответами ИИ в порядке их поступления
2. Добавить изменяемую ширину панели навигации

---

### Часть 1: Новая структура данных

Текущая структура группирует все сообщения по участникам. Новая структура будет представлять **блоки диалога**:

```text
Текущая структура:           Новая структура:
┌─────────────────────┐      ┌─────────────────────────────────────┐
│ 👑 Супервизор (3)   │      │ 👑 Супервизор #1                    │
│ ├─ 🧠 GPT-5 (3)     │  →   │ │  "Начало запроса..." (tooltip)   │
│ └─ 🛡 Claude (3)    │      │ ├─ 🛡 Критик GPT-5                  │
└─────────────────────┘      │ └─ 🧠 Эксперт Claude                │
                             │ 👑 Супервизор #2                    │
                             │ ├─ 🧠 Эксперт Claude                │
                             │ └─ 🛡 Критик GPT-5                  │
                             │ 💡 Консультант-математик            │
                             │ 👑 Супервизор #3                    │
                             │ ├─ ...                              │
                             └─────────────────────────────────────┘
```

---

### Часть 2: Новые интерфейсы

```typescript
interface DialogBlock {
  id: string;              // ID сообщения супервизора или standalone AI
  type: 'supervisor-block' | 'standalone-ai';
  supervisorMessage?: Message;  // Сообщение супервизора (если есть)
  contentPreview: string;       // Первые 50 символов для tooltip
  aiResponses: AIResponse[];    // Ответы ИИ в порядке поступления
}

interface AIResponse {
  id: string;           // ID сообщения
  modelName: string;    // Название модели
  role: MessageRole;    // assistant | critic | arbiter | consultant
  icon: LucideIcon;
  color: string;
  displayName: string;  // "Критик GPT-5" или "Эксперт Claude"
}
```

---

### Часть 3: Алгоритм построения дерева

```typescript
const dialogBlocks = useMemo(() => {
  const blocks: DialogBlock[] = [];
  let currentBlock: DialogBlock | null = null;

  messages.forEach((msg, index) => {
    if (msg.role === 'user') {
      // Начало нового блока супервизора
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        id: msg.id,
        type: 'supervisor-block',
        supervisorMessage: msg,
        contentPreview: msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : ''),
        aiResponses: [],
      };
    } else {
      // Ответ ИИ
      const settings = perModelSettings[msg.model_name || ''];
      const role = settings?.role || msg.role;
      const config = roleConfig[role] || roleConfig.assistant;
      
      const aiResponse: AIResponse = {
        id: msg.id,
        modelName: msg.model_name || 'unknown',
        role: role as MessageRole,
        icon: config.icon,
        color: config.color,
        displayName: `${t(`role.${role}`)} ${getModelShortName(msg.model_name)}`,
      };

      if (currentBlock) {
        // Добавляем к текущему блоку супервизора
        currentBlock.aiResponses.push(aiResponse);
      } else {
        // Standalone AI сообщение (например, консультант без предшествующего запроса)
        blocks.push({
          id: msg.id,
          type: 'standalone-ai',
          contentPreview: msg.content.slice(0, 50) + '...',
          aiResponses: [aiResponse],
        });
      }
    }
  });

  // Добавляем последний блок
  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}, [messages, perModelSettings, t]);
```

---

### Часть 4: Обновлённый UI компонента

```tsx
return (
  <div className="flex flex-col h-full bg-sidebar">
    <div className="p-3 border-b border-border">
      <h3 className="text-sm font-medium text-sidebar-foreground flex items-center gap-2">
        <Users className="h-4 w-4" />
        {t('chat.participants')}
      </h3>
    </div>

    <ScrollArea className="flex-1">
      <div className="p-2 space-y-0.5">
        {dialogBlocks.map((block, blockIndex) => (
          <div key={block.id} className="space-y-0.5">
            {/* Supervisor node */}
            {block.type === 'supervisor-block' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                      activeParticipant === block.id && "bg-sidebar-accent",
                      "hover:bg-sidebar-accent/50"
                    )}
                    onClick={() => onMessageClick(block.id)}
                  >
                    <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="flex-1 text-sm truncate">
                      {t('role.supervisor')} #{blockIndex + 1}
                    </span>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm italic">"{block.contentPreview}"</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* AI responses under this supervisor */}
            {block.aiResponses.map((ai) => {
              const Icon = ai.icon;
              return (
                <div
                  key={ai.id}
                  className={cn(
                    "relative flex items-center gap-2 p-2 rounded-md cursor-pointer ml-4",
                    activeParticipant === ai.id && "bg-sidebar-accent",
                    "hover:bg-sidebar-accent/50"
                  )}
                  onClick={() => onMessageClick(ai.id)}
                >
                  {/* Tree connector line */}
                  <div className="absolute -left-2 top-0 bottom-0 w-px bg-border" />
                  
                  <Icon className={cn("h-4 w-4 shrink-0", ai.color)} />
                  <span className="flex-1 text-sm truncate">
                    {ai.displayName}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </ScrollArea>
  </div>
);
```

---

### Часть 5: Resizable панель

Обновить `ExpertPanel.tsx` для использования `ResizablePanelGroup`:

```tsx
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';

// В return:
<div className="h-[calc(100vh-4rem)] flex overflow-hidden">
  <ResizablePanelGroup direction="horizontal">
    {/* Navigation Panel - resizable */}
    <ResizablePanel 
      defaultSize={20} 
      minSize={15} 
      maxSize={35}
      className="bg-sidebar"
    >
      <ChatTreeNav
        messages={messages}
        perModelSettings={perModelSettings}
        userDisplayInfo={userDisplayInfo}
        onMessageClick={handleMessageClick}
        activeParticipant={activeParticipant}
      />
    </ResizablePanel>

    <ResizableHandle withHandle />

    {/* Main Content */}
    <ResizablePanel defaultSize={80}>
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* ... existing content ... */}
      </div>
    </ResizablePanel>
  </ResizablePanelGroup>
</div>
```

---

### Часть 6: Обновление callback

Изменить `onParticipantClick` на `onMessageClick` для скролла к конкретному сообщению:

```typescript
// В ChatTreeNavProps:
onMessageClick: (messageId: string) => void;

// В ExpertPanel:
const handleMessageClick = (messageId: string) => {
  setActiveParticipant(messageId);
  
  messageRefs.current.get(messageId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });
};
```

---

### Часть 7: Локализация

Добавить/обновить ключи:

```typescript
'chat.queryPreview': { ru: 'Запрос', en: 'Query' },
```

---

### Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/components/warroom/ChatTreeNav.tsx` | Полное обновление структуры |
| `src/pages/ExpertPanel.tsx` | Интегрировать ResizablePanelGroup |

---

### Ожидаемый результат

1. **Хронологическая структура**:
   - Супервизор #1 (с preview запроса в tooltip)
     - Критик GPT-5
     - Эксперт Claude
   - Супервизор #2
     - Эксперт Claude
     - Критик GPT-5
   - Консультант-математик (standalone)
   - И т.д.

2. **Resizable панель**:
   - Ширина от 15% до 35%
   - Ручка для изменения размера
   - Сохранение пропорций при resize окна

3. **Улучшенная навигация**:
   - Клик по любому узлу скроллит к конкретному сообщению
   - Tooltip с началом запроса супервизора

