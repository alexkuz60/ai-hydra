

# План: Обновление логотипа на главной странице

## Что будет сделано

Переработка заголовка главной страницы — текст "AI-Hydra" будет преобразован в "ai hydra" с логотипом между словами.

## Визуальные изменения

### Было
```
     [логотип]
     
    AI-Hydra
```

### Станет
```
   ai  [логотип]  hydra
```

- Текст в нижнем регистре без дефиса
- Логотип расположен между словами "ai" и "hydra"
- Шрифт — округлый (Quicksand или Nunito)
- Размер текста увеличен для баланса с логотипом

---

## Технические детали

### 1. Подключение округлого шрифта

**Файл:** `src/index.css`

Добавление Google Font с округлым начертанием (например, Quicksand):

```css
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700&...');
```

### 2. Обновление Tailwind конфигурации

**Файл:** `tailwind.config.ts`

Добавление нового шрифта в `fontFamily`:

```typescript
fontFamily: {
  sans: ["Inter", "sans-serif"],
  mono: ["JetBrains Mono", "monospace"],
  rounded: ["Quicksand", "sans-serif"], // новый
}
```

### 3. Переработка Hero-секции

**Файл:** `src/pages/Index.tsx`

Замена текущей структуры (отдельный логотип + заголовок) на inline-конструкцию:

```tsx
<div className="inline-flex items-center justify-center gap-4 mb-8 group">
  <span className="text-6xl md:text-8xl font-bold font-rounded 
    bg-gradient-to-r from-primary via-hydra-expert to-hydra-arbiter 
    bg-clip-text text-transparent">
    ai
  </span>
  
  <div className="relative">
    <img 
      src="/favicon.png" 
      alt="" 
      className="h-16 md:h-24 w-16 md:w-24 transition-transform 
        duration-500 group-hover:animate-[spin-slow_0.6s_ease-in-out]" 
    />
    <div className="absolute inset-0 bg-primary/30 blur-2xl 
      rounded-full animate-pulse-glow" />
  </div>
  
  <span className="text-6xl md:text-8xl font-bold font-rounded 
    bg-gradient-to-r from-hydra-expert via-hydra-arbiter to-primary 
    bg-clip-text text-transparent">
    hydra
  </span>
</div>
```

### 4. Обновление переводов

**Файл:** `src/contexts/LanguageContext.tsx`

Заголовок теперь не используется как текстовая строка — он собирается из компонентов, поэтому перевод `hero.title` можно оставить как есть или удалить за ненадобностью.

---

## Изменяемые файлы

| Файл | Изменение |
|------|-----------|
| `src/index.css` | Подключение шрифта Quicksand |
| `tailwind.config.ts` | Добавление `font-rounded` |
| `src/pages/Index.tsx` | Новая структура Hero-секции |

