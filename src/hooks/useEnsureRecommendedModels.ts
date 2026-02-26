import { useEffect, useRef } from 'react';
import { useCloudSettings } from './useCloudSettings';
import { ROLE_RECOMMENDED_MODELS } from '@/config/roles';

/**
 * Ensures all role-recommended OpenRouter models are present
 * in the user's custom OpenRouter model list.
 * Auto-adds missing models on mount (once per session).
 */
export function useEnsureRecommendedModels(hasOpenRouterKey: boolean) {
  const { value: cloudUserModels, update: updateCloudUserModels, loaded } = useCloudSettings<string[]>(
    'openrouter-user-models', [], 'openrouter_user_models',
  );
  const didRun = useRef(false);

  useEffect(() => {
    if (!hasOpenRouterKey || !loaded || didRun.current) return;
    didRun.current = true;

    // Collect all recommended model IDs
    const recommended = new Set<string>();
    for (const models of Object.values(ROLE_RECOMMENDED_MODELS)) {
      if (models) {
        for (const m of models) {
          recommended.add(m.modelId);
        }
      }
    }

    // Find missing ones
    const currentSet = new Set(cloudUserModels);
    const missing = [...recommended].filter(id => !currentSet.has(id));

    if (missing.length > 0) {
      console.log('[Hydra] Auto-adding recommended models to OpenRouter list:', missing);
      updateCloudUserModels(prev => [...new Set([...prev, ...missing])]);
    }
  }, [hasOpenRouterKey, loaded, cloudUserModels, updateCloudUserModels]);
}
