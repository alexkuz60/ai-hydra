import { useCallback, useMemo } from 'react';
import { useCloudSettings } from './useCloudSettings';

export type DuelType = 'critic' | 'arbiter';

export interface DuelConfigData {
  modelA: string | null;
  modelB: string | null;
  roundCount: number;
  duelPrompt: string;
  duelType: DuelType;
  criteria: string[];
  criteriaWeights: Record<string, number>;
  userEvaluation: boolean;
  scoringScheme: 'weighted-avg' | 'tournament' | 'elo';
  arbiterModel: string | null;
}

const DEFAULT_DUEL_CONFIG: DuelConfigData = {
  modelA: null,
  modelB: null,
  roundCount: 3,
  duelPrompt: '',
  duelType: 'critic',
  criteria: ['factuality', 'relevance', 'clarity', 'argument_strength'],
  criteriaWeights: {},
  userEvaluation: false,
  scoringScheme: 'weighted-avg',
  arbiterModel: null,
};

// Legacy keys for migration
const LEGACY_STORAGE_KEYS = [
  'hydra-duel-model-a', 'hydra-duel-model-b', 'hydra-duel-round-count',
  'hydra-duel-prompt', 'hydra-duel-type', 'hydra-duel-criteria',
  'hydra-duel-criteria-weights', 'hydra-duel-user-eval',
  'hydra-duel-scoring', 'hydra-duel-arbiter-model',
];

export const DUEL_STORAGE_KEYS = LEGACY_STORAGE_KEYS;

function tryParse<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try { return JSON.parse(value); } catch { return defaultValue; }
}

/** Migrate old per-key localStorage to single JSON (one-time) */
function migrateLegacyConfig(): DuelConfigData | null {
  const hasLegacy = LEGACY_STORAGE_KEYS.some(k => localStorage.getItem(k) !== null);
  if (!hasLegacy) return null;

  const config: DuelConfigData = {
    modelA: localStorage.getItem('hydra-duel-model-a'),
    modelB: localStorage.getItem('hydra-duel-model-b'),
    roundCount: tryParse(localStorage.getItem('hydra-duel-round-count'), 3),
    duelPrompt: localStorage.getItem('hydra-duel-prompt') || '',
    duelType: (localStorage.getItem('hydra-duel-type') as DuelType) || 'critic',
    criteria: tryParse(localStorage.getItem('hydra-duel-criteria'), DEFAULT_DUEL_CONFIG.criteria),
    criteriaWeights: tryParse(localStorage.getItem('hydra-duel-criteria-weights'), {}),
    userEvaluation: tryParse(localStorage.getItem('hydra-duel-user-eval'), false),
    scoringScheme: (localStorage.getItem('hydra-duel-scoring') as DuelConfigData['scoringScheme']) || 'weighted-avg',
    arbiterModel: localStorage.getItem('hydra-duel-arbiter-model'),
  };

  // Clean up legacy keys
  LEGACY_STORAGE_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch {} });

  return config;
}

export interface DuelValidationError {
  field: string;
  messageKey: string;
}

export const DUEL_VALIDATION_MESSAGES: Record<string, { ru: string; en: string }> = {
  modelARequired: { ru: 'Выберите модель A', en: 'Select Model A' },
  modelBRequired: { ru: 'Выберите модель B', en: 'Select Model B' },
  sameModels: { ru: 'Модели должны быть разными', en: 'Models must be different' },
  promptRequired: { ru: 'Напишите стартовый промпт дуэли', en: 'Duel prompt is required' },
};

export function useDuelConfig() {
  // One-time migration from legacy per-key format
  const legacyData = useMemo(() => migrateLegacyConfig(), []);
  const initialDefault = legacyData || DEFAULT_DUEL_CONFIG;

  const { value: config, update: setConfig, reset: resetAll, loaded } =
    useCloudSettings<DuelConfigData>('duel-config', initialDefault, 'hydra-cloud-duel-config');

  // If we migrated legacy data, push it into the cloud settings
  useMemo(() => {
    if (legacyData) {
      // Write migrated data to cache key so useCloudSettings picks it up
      try {
        localStorage.setItem('hydra-cloud-duel-config', JSON.stringify(legacyData));
      } catch {}
    }
  }, [legacyData]);

  const updateField = useCallback(<K extends keyof DuelConfigData>(key: K, value: DuelConfigData[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, [setConfig]);

  const updateModelA = useCallback((v: string | null) => updateField('modelA', v), [updateField]);
  const updateModelB = useCallback((v: string | null) => updateField('modelB', v), [updateField]);
  const updateRoundCount = useCallback((v: number) => updateField('roundCount', v), [updateField]);
  const updateDuelPrompt = useCallback((v: string) => updateField('duelPrompt', v), [updateField]);
  const updateDuelType = useCallback((v: DuelType) => updateField('duelType', v), [updateField]);
  const updateCriteria = useCallback((v: string[]) => updateField('criteria', v), [updateField]);
  const updateCriteriaWeights = useCallback((v: Record<string, number>) => updateField('criteriaWeights', v), [updateField]);
  const updateUserEvaluation = useCallback((v: boolean) => updateField('userEvaluation', v), [updateField]);
  const updateScoringScheme = useCallback((v: DuelConfigData['scoringScheme']) => updateField('scoringScheme', v), [updateField]);
  const updateArbiterModel = useCallback((v: string | null) => updateField('arbiterModel', v), [updateField]);

  const validate = useCallback((): DuelValidationError[] => {
    const errors: DuelValidationError[] = [];
    if (!config.modelA) errors.push({ field: 'modelA', messageKey: 'modelARequired' });
    if (!config.modelB) errors.push({ field: 'modelB', messageKey: 'modelBRequired' });
    if (config.modelA && config.modelB && config.modelA === config.modelB) {
      errors.push({ field: 'modelB', messageKey: 'sameModels' });
    }
    if (!config.duelPrompt.trim()) errors.push({ field: 'duelPrompt', messageKey: 'promptRequired' });
    return errors;
  }, [config]);

  return {
    config,
    loaded,
    updateModelA, updateModelB, updateRoundCount, updateDuelPrompt,
    updateDuelType, updateCriteria, updateCriteriaWeights,
    updateUserEvaluation, updateScoringScheme, updateArbiterModel,
    resetAll, validate,
  };
}
