
# Аватар пользователя: загрузка фото и кроппер

## Что делаем

1. Создаём приватный storage bucket `avatars` с RLS — доступ только к своим файлам.
2. Новый компонент `AvatarCropDialog` — диалог загрузки + кроппер на чистом Canvas (без сторонних библиотек).
3. Встраиваем в таб "Профиль" страницы `Profile.tsx`.
4. Отображаем аватар в сайдбаре вместо иконки `User`.

---

## Технические детали

### Storage bucket `avatars`

Новая SQL-миграция:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', false);

-- RLS: пользователь читает только свои файлы
CREATE POLICY "Users can view own avatars"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

Путь файла в бакете: `{user_id}/avatar.jpg` — при перезаписи новый файл заменяет старый (upsert).

### Компонент `AvatarCropDialog`

Новый файл `src/components/profile/AvatarCropDialog.tsx`.

**Логика кроппера (Canvas):**
- Загрузка файла → `FileReader` → `Image` → рисуем на канвасе.
- Пользователь перетаскивает и масштабирует изображение мышью (drag + колёсико).
- Поверх — фиксированная круглая маска (clip path) 200×200px с затемнением.
- Кнопка «Применить» — вырезаем нужный участок, `canvas.toBlob(jpeg, 0.85)` → загружаем в storage → записываем `avatar_url` (signed URL на 10 лет) в `profiles`.

**Ограничение 2 МБ** — проверка до открытия диалога:
```ts
if (file.size > 2 * 1024 * 1024) {
  toast.error('Максимальный размер — 2 МБ');
  return;
}
```

**Поддерживаемые форматы:** `image/jpeg`, `image/png`, `image/webp`.

### Интеграция в `Profile.tsx`

В таб "profile" добавляем секцию с аватаром над полями имени:

```
┌────────────────────────────────────┐
│  [Аватар 80px]  [Загрузить фото]   │
│                 [Удалить]          │
├────────────────────────────────────┤
│  Email ...                         │
│  Display Name ...                  │
│  Username ...                      │
└────────────────────────────────────┘
```

### Аватар в сайдбаре (`AppSidebar.tsx`)

В пользовательском меню (кнопка "User") заменяем иконку `<User />` на `<Avatar>` с `useUserProfile`:
- Если `avatarUrl` есть → показываем `<AvatarImage>`.
- Если нет → fallback на иконку `<User />` или инициалы.

### Хук `useUserProfile`

Уже есть и уже читает `avatar_url`. Остаётся добавить `refetch` после загрузки в `Profile.tsx`.

---

## Файлы, которые создаём / изменяем

| Файл | Действие |
|---|---|
| SQL migration | Создаём bucket + RLS |
| `src/components/profile/AvatarCropDialog.tsx` | Новый компонент |
| `src/pages/Profile.tsx` | Добавляем секцию аватара в таб "profile" |
| `src/components/layout/AppSidebar.tsx` | Заменяем иконку User на аватар |

---

## UX-поведение кроппера

- Drag мышью — двигаем фото внутри круга.
- Scroll колёсика — масштабируем (зум 1×–5×).
- Квадратный холст 320px с круглой маской по центру диаметром 280px.
- После «Применить» — загрузка → спиннер → toast «Аватар обновлён».
- Кнопка «Удалить аватар» — удаляет файл из storage и обнуляет `avatar_url` в профиле.
