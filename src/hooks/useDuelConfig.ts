import { useState, useEffect, useCallback } from 'react';

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

const STORAGE_KEYS = {
  modelA: 'hydra-duel-model-a',
  modelB: 'hydra-duel-model-b',
  roundCount: 'hydra-duel-round-count',
  duelPrompt: 'hydra-duel-prompt',
  duelType: 'hydra-duel-type',
  criteria: 'hydra-duel-criteria',
  criteriaWeights: 'hydra-duel-criteria-weights',
  userEvaluation: 'hydra-duel-user-eval',
  scoringScheme: 'hydra-duel-scoring',
  arbiterModel: 'hydra-duel-arbiter-model',
} as const;

export const DUEL_STORAGE_KEYS = Object.values(STORAGE_KEYS);

function tryParse<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try { return JSON.parse(value); } catch { return defaultValue; }
}

function loadConfig(): DuelConfigData {
  return {
    modelA: localStorage.getItem(STORAGE_KEYS.modelA),
    modelB: localStorage.getItem(STORAGE_KEYS.modelB),
    roundCount: tryParse(localStorage.getItem(STORAGE_KEYS.roundCount), 3),
    duelPrompt: localStorage.getItem(STORAGE_KEYS.duelPrompt) || '',
    duelType: (localStorage.getItem(STORAGE_KEYS.duelType) as DuelType) || 'critic',
    criteria: tryParse(localStorage.getItem(STORAGE_KEYS.criteria), ['factuality', 'relevance', 'clarity', 'argument_strength']),
    criteriaWeights: tryParse(localStorage.getItem(STORAGE_KEYS.criteriaWeights), {}),
    userEvaluation: tryParse(localStorage.getItem(STORAGE_KEYS.userEvaluation), false),
    scoringScheme: (localStorage.getItem(STORAGE_KEYS.scoringScheme) as DuelConfigData['scoringScheme']) || 'weighted-avg',
    arbiterModel: localStorage.getItem(STORAGE_KEYS.arbiterModel),
  };
}

function dispatchChanged() {
  window.dispatchEvent(new Event('duel-config-changed'));
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
  const [config, setConfig] = useState<DuelConfigData>(loadConfig);

  useEffect(() => {
    const sync = () => setConfig(loadConfig());
    window.addEventListener('storage', sync);
    window.addEventListener('duel-config-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('duel-config-changed', sync);
    };
  }, []);

  const set = useCallback((key: keyof typeof STORAGE_KEYS, value: unknown) => {
    const storageKey = STORAGE_KEYS[key];
    if (value == null || value === '') {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, typeof value === 'string' ? value : JSON.stringify(value));
    }
    dispatchChanged();
  }, []);

  const updateModelA = useCallback((v: string | null) => set('modelA', v), [set]);
  const updateModelB = useCallback((v: string | null) => set('modelB', v), [set]);
  const updateRoundCount = useCallback((v: number) => set('roundCount', v), [set]);
  const updateDuelPrompt = useCallback((v: string) => set('duelPrompt', v), [set]);
  const updateDuelType = useCallback((v: DuelType) => set('duelType', v), [set]);
  const updateCriteria = useCallback((v: string[]) => set('criteria', v), [set]);
  const updateCriteriaWeights = useCallback((v: Record<string, number>) => set('criteriaWeights', v), [set]);
  const updateUserEvaluation = useCallback((v: boolean) => set('userEvaluation', v), [set]);
  const updateScoringScheme = useCallback((v: DuelConfigData['scoringScheme']) => set('scoringScheme', v), [set]);
  const updateArbiterModel = useCallback((v: string | null) => set('arbiterModel', v), [set]);

  const resetAll = useCallback(() => {
    DUEL_STORAGE_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    dispatchChanged();
  }, []);

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
    updateModelA, updateModelB, updateRoundCount, updateDuelPrompt,
    updateDuelType, updateCriteria, updateCriteriaWeights,
    updateUserEvaluation, updateScoringScheme, updateArbiterModel,
    resetAll, validate,
  };
}
