

## План: Создание панели "Библиотека ИИ-ролей"

### Цель
Создать полноценную страницу управления библиотекой промптов для ИИ-ролей по аналогии с панелью "Задачи", с возможностью добавления, просмотра, редактирования и удаления промптов.

---

### Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────┐
│                    AppSidebar.tsx                                │
│                                                                  │
│  Добавить новый пункт меню:                                     │
│  { path: '/role-library', icon: Library, label: 'Библиотека' } │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    App.tsx                                       │
│                                                                  │
│  Добавить маршрут:                                              │
│  <Route path="/role-library" element={<RoleLibrary />} />       │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RoleLibrary.tsx                               │
│                                                                  │
│  Структура (по аналогии с Tasks.tsx):                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  HydraCard: Создание нового промпта                        │ │
│  │  - Название (Input)                                        │ │
│  │  - Описание (Input, опционально)                           │ │
│  │  - Роль (Select: expert/critic/arbiter)                    │ │
│  │  - Контент промпта (Textarea)                              │ │
│  │  - Переключатель "Публичный" (Switch)                      │ │
│  │  - Кнопка "Создать"                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Фильтры и поиск                                           │ │
│  │  - Поиск по названию/контенту                              │ │
│  │  - Фильтр по роли (все / эксперт / критик / арбитр)        │ │
│  │  - Фильтр: свои / публичные                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Список промптов (cards)                                   │ │
│  │  Каждая карточка:                                          │ │
│  │  - Название (inline edit)                                  │ │
│  │  - Badge роли (цвет по роли)                               │ │
│  │  - Описание (если есть)                                    │ │
│  │  - Контент (truncated, expand toggle)                      │ │
│  │  - Счётчик использования                                   │ │
│  │  - Иконка публичности                                      │ │
│  │  - Кнопки: редактировать / удалить                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

### Часть 1: Навигация

#### 1.1 Добавить пункт меню в AppSidebar.tsx

```typescript
import { Library } from 'lucide-react';

const navItems = user ? [
  { path: '/', icon: Home, label: t('nav.home') },
  { path: '/expert-panel', icon: Users, label: t('nav.expertPanel') },
  { path: '/tasks', icon: CheckSquare, label: t('nav.tasks') },
  { path: '/role-library', icon: Library, label: t('nav.roleLibrary') }, // новый пункт
  { path: '/model-ratings', icon: BarChart3, label: t('nav.modelRatings') },
] : [
  { path: '/', icon: Home, label: t('nav.home') },
];
```

#### 1.2 Добавить маршрут в App.tsx

```typescript
import RoleLibrary from "./pages/RoleLibrary";

<Route path="/role-library" element={<RoleLibrary />} />
```

---

### Часть 2: Локализация

Добавить в LanguageContext.tsx:

```typescript
// Navigation
'nav.roleLibrary': { ru: 'Библиотека ролей', en: 'Role Library' },

// Role Library page
'roleLibrary.title': { ru: 'Библиотека ИИ-ролей', en: 'AI Role Library' },
'roleLibrary.new': { ru: 'Новая роль', en: 'New Role' },
'roleLibrary.empty': { ru: 'Библиотека пуста', en: 'Library is empty' },
'roleLibrary.name': { ru: 'Название', en: 'Name' },
'roleLibrary.namePlaceholder': { ru: 'Название роли...', en: 'Role name...' },
'roleLibrary.description': { ru: 'Описание', en: 'Description' },
'roleLibrary.descriptionPlaceholder': { ru: 'Краткое описание...', en: 'Brief description...' },
'roleLibrary.content': { ru: 'Системный промпт', en: 'System Prompt' },
'roleLibrary.contentPlaceholder': { ru: 'Инструкции для ИИ...', en: 'Instructions for AI...' },
'roleLibrary.role': { ru: 'Роль', en: 'Role' },
'roleLibrary.isShared': { ru: 'Публичный', en: 'Public' },
'roleLibrary.create': { ru: 'Создать', en: 'Create' },
'roleLibrary.created': { ru: 'Роль создана', en: 'Role created' },
'roleLibrary.updated': { ru: 'Роль обновлена', en: 'Role updated' },
'roleLibrary.deleted': { ru: 'Роль удалена', en: 'Role deleted' },
'roleLibrary.deleteConfirmTitle': { ru: 'Удалить роль?', en: 'Delete role?' },
'roleLibrary.deleteConfirmDescription': { ru: 'Это действие нельзя отменить.', en: 'This action cannot be undone.' },
'roleLibrary.search': { ru: 'Поиск...', en: 'Search...' },
'roleLibrary.filterAll': { ru: 'Все', en: 'All' },
'roleLibrary.filterOwn': { ru: 'Мои', en: 'My own' },
'roleLibrary.filterShared': { ru: 'Публичные', en: 'Public' },
'roleLibrary.usedCount': { ru: 'Использований: {count}', en: 'Used: {count} times' },
'roleLibrary.noResults': { ru: 'Ничего не найдено', en: 'No results found' },
```

---

### Часть 3: Страница RoleLibrary.tsx

#### 3.1 Структура компонента

| Секция | Описание |
|--------|----------|
| Форма создания | HydraCard с полями для нового промпта |
| Фильтры | Поиск + фильтр по роли + фильтр своих/публичных |
| Список | Карточки промптов с действиями |

#### 3.2 Основной функционал

**Состояния:**
```typescript
interface RolePrompt {
  id: string;
  name: string;
  description: string | null;
  content: string;
  role: string;
  is_shared: boolean;
  is_default: boolean;
  usage_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const [prompts, setPrompts] = useState<RolePrompt[]>([]);
const [loading, setLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const [roleFilter, setRoleFilter] = useState<string>('all');
const [ownerFilter, setOwnerFilter] = useState<'all' | 'own' | 'shared'>('all');

// Форма создания
const [newName, setNewName] = useState('');
const [newDescription, setNewDescription] = useState('');
const [newContent, setNewContent] = useState('');
const [newRole, setNewRole] = useState<AgentRole>('assistant');
const [newIsShared, setNewIsShared] = useState(false);
const [creating, setCreating] = useState(false);

// Редактирование
const [editingId, setEditingId] = useState<string | null>(null);
const [editSheet, setEditSheet] = useState(false);
const [editingPrompt, setEditingPrompt] = useState<RolePrompt | null>(null);

// Удаление
const [promptToDelete, setPromptToDelete] = useState<RolePrompt | null>(null);
```

**CRUD операции:**
- `fetchPrompts()` - загрузка всех промптов (своих + публичных)
- `handleCreate()` - создание нового промпта
- `handleUpdate()` - обновление существующего
- `handleDelete()` - удаление

**Фильтрация:**
```typescript
const filteredPrompts = prompts.filter(prompt => {
  // Поиск
  const matchesSearch = 
    prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
  
  // Фильтр по роли
  const matchesRole = roleFilter === 'all' || prompt.role === roleFilter;
  
  // Фильтр по владельцу
  const matchesOwner = 
    ownerFilter === 'all' ||
    (ownerFilter === 'own' && prompt.user_id === user?.id) ||
    (ownerFilter === 'shared' && prompt.is_shared);
  
  return matchesSearch && matchesRole && matchesOwner;
});
```

#### 3.3 UI элементы

**Карточка промпта:**
```tsx
<HydraCard variant="glass" glow className="p-4">
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1 min-w-0">
      {/* Заголовок с inline edit */}
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-medium truncate">{prompt.name}</h3>
        <Badge className={getRoleBadgeColor(prompt.role)}>
          {t(`role.${prompt.role}`)}
        </Badge>
        {prompt.is_shared && <Users className="h-3.5 w-3.5" />}
      </div>
      
      {/* Описание */}
      {prompt.description && (
        <p className="text-sm text-muted-foreground mb-2">{prompt.description}</p>
      )}
      
      {/* Контент с truncate */}
      <p className="text-xs text-muted-foreground/70 line-clamp-2">
        {prompt.content}
      </p>
      
      {/* Метаданные */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
        <span>{t('roleLibrary.usedCount').replace('{count}', String(prompt.usage_count))}</span>
        <span>{format(new Date(prompt.updated_at), 'dd.MM.yyyy')}</span>
      </div>
    </div>
    
    {/* Действия (только для своих) */}
    {prompt.user_id === user?.id && (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => openEditSheet(prompt)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setPromptToDelete(prompt)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )}
  </div>
</HydraCard>
```

**Sheet для редактирования:**
```tsx
<Sheet open={editSheet} onOpenChange={setEditSheet}>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>{t('roleLibrary.edit')}</SheetTitle>
    </SheetHeader>
    
    {/* Форма редактирования: name, description, role, content, is_shared */}
    
    <SheetFooter>
      <Button variant="outline" onClick={() => setEditSheet(false)}>
        {t('common.cancel')}
      </Button>
      <Button onClick={handleUpdate}>
        {t('common.save')}
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

---

### Часть 4: Стилизация

| Элемент | Цвет бейджа роли |
|---------|------------------|
| expert (assistant) | `bg-primary/20 text-primary` |
| critic | `bg-orange-500/20 text-orange-400` |
| arbiter | `bg-purple-500/20 text-purple-400` |

---

### Шаги реализации

1. **Локализация**: Добавить ключи переводов в LanguageContext.tsx
2. **Маршрутизация**: Добавить Route в App.tsx
3. **Навигация**: Добавить пункт меню в AppSidebar.tsx
4. **Страница**: Создать src/pages/RoleLibrary.tsx с полным CRUD функционалом
5. **Тестирование**: Проверить создание, редактирование, удаление промптов

---

### Ожидаемый результат

- Новый пункт "Библиотека ролей" в боковом меню (для авторизованных пользователей)
- Полноценная страница управления промптами ИИ-ролей
- Возможность создавать, просматривать, редактировать и удалять свои промпты
- Возможность видеть публичные промпты других пользователей
- Фильтрация и поиск по библиотеке
- Единый стиль с панелью "Задачи" (HydraCard, Sheet, AlertDialog)

