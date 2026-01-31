# AI-Hydra Design System

## Цветовые токены

### Базовые
- `background` / `foreground` — основной фон и текст
- `card` / `card-foreground` — карточки
- `primary` / `primary-foreground` — акцентные элементы (cyan)
- `secondary` / `secondary-foreground` — вторичные элементы
- `muted` / `muted-foreground` — приглушённые элементы
- `destructive` / `destructive-foreground` — опасные действия

### Hydra-специфичные
- `hydra-glow` — неоновое свечение (cyan)
- `hydra-success` — успех (зелёный)
- `hydra-warning` — предупреждение (жёлтый)
- `hydra-critical` — критично (красный)

### AI-роли
| Роль | Токен | Цвет |
|------|-------|------|
| Ассистент | `hydra-success` | Зелёный |
| Критик | `hydra-critical` | Красный |
| Арбитр | `hydra-arbiter` | Золотой |
| Консультант | `hydra-consultant` | Янтарный |
| Модератор | `hydra-moderator` | Синий |
| Советник | `hydra-advisor` | Изумрудный |
| Архивист | `hydra-archivist` | Бронзовый |
| Аналитик | `hydra-analyst` | Индиго |
| Вебхантер | `hydra-webhunter` | Оранжевый |
| Эксперт | `hydra-expert` | Фиолетовый |

## Использование

### В Tailwind
```tsx
// Правильно — используем токены
<div className="bg-primary text-primary-foreground" />
<span className="text-hydra-success" />
<div className="border-hydra-glow" />

// Неправильно — прямые цвета
<div className="bg-cyan-500" /> // ❌
<span className="text-green-400" /> // ❌
```

### В CSS
```css
.my-element {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--hydra-glow));
}
```

## Шрифты
- `font-sans` — Inter (основной)
- `font-mono` — JetBrains Mono (код)
- `font-rounded` — Quicksand (заголовки, лого)

## Анимации
- `animate-pulse-glow` — пульсирующее свечение
- `animate-fade-in` — плавное появление
- `animate-slide-up` — появление снизу

## Компоненты

### Свечение
```tsx
<Button className="hydra-glow" />     // Полное свечение
<Button className="hydra-glow-sm" />  // Слабое свечение
```

### Скроллбар
```tsx
<ScrollArea className="hydra-scrollbar" />
```
