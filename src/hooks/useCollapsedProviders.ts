import { useCallback } from 'react';
import { useCloudSettings } from '@/hooks/useCloudSettings';

/**
 * Persisted collapsed state for provider groups in model selectors.
 * Stores a Record<string, boolean> where key = provider, value = collapsed.
 */
export function useCollapsedProviders(settingKey = 'model-selector-collapsed') {
  const { value, update, loaded } = useCloudSettings<Record<string, boolean>>(settingKey, {});

  const isCollapsed = useCallback(
    (provider: string, defaultCollapsed: boolean) => {
      return value[provider] ?? defaultCollapsed;
    },
    [value],
  );

  const toggle = useCallback(
    (provider: string) => {
      update(prev => ({ ...prev, [provider]: !prev[provider] }));
    },
    [update],
  );

  const setCollapsed = useCallback(
    (provider: string, collapsed: boolean) => {
      update(prev => ({ ...prev, [provider]: collapsed }));
    },
    [update],
  );

  return { isCollapsed, toggle, setCollapsed, loaded };
}
