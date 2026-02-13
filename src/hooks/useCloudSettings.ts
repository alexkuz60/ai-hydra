import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Универсальный хук для синхронизации настроек между БД (user_settings) и localStorage.
 * Приоритет: БД → localStorage (кеш).
 * 
 * @param settingKey — уникальный ключ настройки (например, 'duel-config', 'contest-config')
 * @param defaultValue — значение по умолчанию
 * @param localStorageKey — ключ для localStorage-кеша (опционально, по умолчанию `hydra-cloud-${settingKey}`)
 */
export function useCloudSettings<T>(
  settingKey: string,
  defaultValue: T,
  localStorageKey?: string,
) {
  const { user } = useAuth();
  const cacheKey = localStorageKey || `hydra-cloud-${settingKey}`;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [value, setValue] = useState<T>(() => {
    // Начальная загрузка из localStorage-кеша
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached) as T;
    } catch {}
    return defaultValue;
  });
  const [loaded, setLoaded] = useState(false);

  // При появлении пользователя — загружаем из БД
  useEffect(() => {
    if (!user?.id) {
      setLoaded(true);
      return;
    }

    let cancelled = false;

    const loadFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings' as any)
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', settingKey)
          .maybeSingle();

        if (cancelled) return;

        if (!error && data) {
          const dbValue = (data as any).setting_value as T;
          setValue(dbValue);
          // Обновляем localStorage-кеш
          try {
            localStorage.setItem(cacheKey, JSON.stringify(dbValue));
          } catch {}
        }
      } catch (err) {
        console.error(`[useCloudSettings] Failed to load "${settingKey}" from DB:`, err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    loadFromDb();
    return () => { cancelled = true; };
  }, [user?.id, settingKey, cacheKey]);

  // Сохранение в БД с debounce
  const saveToDb = useCallback(
    (newValue: T) => {
      if (!user?.id) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          await supabase
            .from('user_settings' as any)
            .upsert(
              {
                user_id: user.id,
                setting_key: settingKey,
                setting_value: newValue as any,
              },
              { onConflict: 'user_id,setting_key' }
            );
        } catch (err) {
          console.error(`[useCloudSettings] Failed to save "${settingKey}" to DB:`, err);
        }
      }, 400);
    },
    [user?.id, settingKey],
  );

  // Обновление значения: localStorage мгновенно + debounce в БД
  const update = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(prev)
          : newValue;

        // Мгновенно в localStorage
        try {
          localStorage.setItem(cacheKey, JSON.stringify(resolved));
        } catch {}

        // Debounce в БД
        saveToDb(resolved);

        // Уведомление другим хукам на этой вкладке
        window.dispatchEvent(new CustomEvent('cloud-settings-changed', { detail: { key: settingKey } }));

        return resolved;
      });
    },
    [cacheKey, saveToDb, settingKey],
  );

  // Сброс настройки
  const reset = useCallback(() => {
    setValue(defaultValue);
    try { localStorage.removeItem(cacheKey); } catch {}

    if (user?.id) {
      supabase
        .from('user_settings' as any)
        .delete()
        .eq('user_id', user.id)
        .eq('setting_key', settingKey)
        .then();
    }

    window.dispatchEvent(new CustomEvent('cloud-settings-changed', { detail: { key: settingKey } }));
  }, [defaultValue, cacheKey, user?.id, settingKey]);

  // Очистка debounce при размонтировании
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { value, update, reset, loaded };
}
