
## План: Перенос настроек моделей в панель "Задачи"

### Что реализуем

1. **Перенос MultiModelSelector** — селектор выбора AI-моделей переносится в страницу Tasks
2. **Выдвижная панель настроек** — PerModelSettings перемещается в Sheet (боковую выдвигающуюся панель)
3. **Сохранение состояния** — выбранные модели и их настройки будут связаны с конкретной задачей

### Визуальный макет

```text
┌──────────────────────────────────────────────────────────────┐
│  ⚡ AI-Hydra                                                 │
├────────────────────────────────────────────────────────────────
│                                                              │
│   Задачи                                                     │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │  + Новая задача                                      │   │
│   │  ┌────────────────────┐  ┌──────────┐ ⚙️             │   │
│   │  │ Название задачи... │  │ Создать  │ Настройки     │   │
│   │  └────────────────────┘  └──────────┘                │   │
│   │                                                      │   │
│   │  👥 Модели: GPT-5, Gemini 3 Flash (2 выбрано)  ▼     │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │  📋 Задача 1                          🗑️            │   │
│   │     24.01.2025 14:30                                 │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                                                      
                                        ┌────────────────────┐
                                        │ ← Настройки модели │
                                        │                    │
                                        │  [Tabs: Model1 | ] │
                                        │                    │
                                        │  Роль: Эксперт  ▼  │
                                        │  Temperature: 0.7  │
                                        │  Max tokens: 2048  │
                                        │  System prompt:    │
                                        │  ┌──────────────┐  │
                                        │  │  ...         │  │
                                        │  └──────────────┘  │
                                        │                    │
                                        │  [Сбросить]        │
                                        └────────────────────┘
```

### Технические изменения

#### 1. Обновление `src/pages/Tasks.tsx`

- Добавить импорты `MultiModelSelector`, `PerModelSettings` и `Sheet` компонентов
- Добавить state для `selectedModels` и `perModelSettings`
- Добавить кнопку настроек (⚙️) рядом с формой создания задачи
- Обернуть `PerModelSettings` в `Sheet` (выдвигается справа)
- Передавать выбранные модели при создании задачи → Expert Panel

```tsx
import { MultiModelSelector } from '@/components/warroom/MultiModelSelector';
import { PerModelSettings, PerModelSettingsData, DEFAULT_MODEL_SETTINGS } from '@/components/warroom/PerModelSettings';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Settings } from 'lucide-react';

// State
const [selectedModels, setSelectedModels] = useState<string[]>([]);
const [perModelSettings, setPerModelSettings] = useState<PerModelSettingsData>({});
const [settingsOpen, setSettingsOpen] = useState(false);

// В JSX добавляем:
<MultiModelSelector value={selectedModels} onChange={setSelectedModels} />
<Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon"><Settings /></Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>{t('settings.modelSettings')}</SheetTitle>
    </SheetHeader>
    <PerModelSettings
      selectedModels={selectedModels}
      settings={perModelSettings}
      onChange={setPerModelSettings}
    />
  </SheetContent>
</Sheet>
```

#### 2. Передача настроек в Expert Panel

При навигации передаём параметры через URL state:
```tsx
navigate(`/expert-panel?task=${data.id}`, { 
  state: { 
    selectedModels, 
    perModelSettings 
  } 
});
```

#### 3. Обновление `src/pages/ExpertPanel.tsx`

- Принимать начальные настройки из `location.state`
- Убрать секцию выбора моделей из хедера (оставить только название задачи)
- Оставить правый sidebar с настройками для текущей сессии

```tsx
import { useLocation } from 'react-router-dom';

const location = useLocation();
const initialState = location.state as { 
  selectedModels?: string[]; 
  perModelSettings?: PerModelSettingsData 
} | null;

// Инициализация state из переданных параметров
useEffect(() => {
  if (initialState?.selectedModels?.length) {
    setSelectedModels(initialState.selectedModels);
  }
  if (initialState?.perModelSettings) {
    setPerModelSettings(initialState.perModelSettings);
  }
}, []);
```

#### 4. Добавление переводов в `LanguageContext.tsx`

```tsx
'tasks.modelConfig': { ru: 'Настройки моделей', en: 'Model Settings' },
'tasks.selectModelsFirst': { ru: 'Сначала выберите модели', en: 'Select models first' },
```

#### 5. Исправление навигации в `Tasks.tsx`

Заменить `/war-room` на `/expert-panel`:
```tsx
navigate(`/expert-panel?task=${data.id}`);
```

### Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/pages/Tasks.tsx` | Добавить MultiModelSelector + Sheet с PerModelSettings, передача state при навигации |
| `src/pages/ExpertPanel.tsx` | Принимать начальные настройки из location.state |
| `src/contexts/LanguageContext.tsx` | Добавить новые ключи переводов |

### Результат

- На странице "Задачи" пользователь выбирает модели ДО создания задачи
- Кнопка ⚙️ открывает боковую панель настроек моделей (Sheet)
- При создании задачи настройки передаются в Expert Panel
- В Expert Panel пользователь может продолжить редактировать настройки в процессе работы
- Более логичный UX: сначала выбор инструментов, потом работа
