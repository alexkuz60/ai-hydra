import { useCallback } from 'react';
import { useCloudSettings } from './useCloudSettings';

/**
 * Shared hook for managing Supervisor Wishes state with DB persistence + localStorage cache.
 * Used by both ExpertPanel (main chat) and ConsultantPanel (D-Chat).
 */
export function useSupervisorWishes(sessionId: string | null) {
  const cacheKey = sessionId ? `hydra-supervisor-wishes-${sessionId}` : 'hydra-supervisor-wishes-none';
  const settingKey = sessionId ? `supervisor-wishes-${sessionId}` : 'supervisor-wishes-none';

  const { value: selectedWishes, update, loaded } =
    useCloudSettings<string[]>(settingKey, [], cacheKey);

  const setSelectedWishes = useCallback(
    (wishes: string[] | ((prev: string[]) => string[])) => {
      update(wishes as string[]);
    },
    [update],
  );

  return { selectedWishes, setSelectedWishes, loaded };
}
