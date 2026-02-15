import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useCloudSettings } from './useCloudSettings';

export interface ArbitrationConfig {
  juryMode: 'user' | 'arbiter' | 'both';
  criteria: string[];
  criteriaWeights: Record<string, number>;
  userWeight: number;
  scoringScheme: 'weighted-avg' | 'tournament' | 'elo';
}

export interface RoundConfig {
  type: 'free' | 'role';
  prompt: string;
  criteria: string[];
  roleForEvaluation?: string;
}

export interface ContestRules {
  roundCount: number;
  rounds: RoundConfig[];
  elimination: string;
}

export interface SavedPlan {
  diagramId: string;
  diagramName: string;
  mermaidCode: string;
  nodeCount: number;
  edgeCount: number;
}

export interface ContestConfigData {
  models: Record<string, string>;
  rules: ContestRules | null;
  taskId: string | null;
  taskTitle: string | null;
  mode: string;
  pipeline: string;
  arbitration: ArbitrationConfig | null;
  savedPlan: SavedPlan | null;
}

const DEFAULT_CONTEST_CONFIG: ContestConfigData = {
  models: {},
  rules: null,
  taskId: null,
  taskTitle: null,
  mode: 'contest',
  pipeline: 'none',
  arbitration: null,
  savedPlan: null,
};

// Legacy keys for migration
const LEGACY_STORAGE_KEYS = [
  'hydra-contest-models', 'hydra-contest-rules', 'hydra-contest-task-id',
  'hydra-contest-task-title', 'hydra-contest-mode', 'hydra-contest-pipeline',
  'hydra-contest-arbitration', 'hydra-contest-saved-plan',
];

export const CONTEST_STORAGE_KEYS = LEGACY_STORAGE_KEYS;

function tryParse<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try { return JSON.parse(value); } catch { return defaultValue; }
}

/** One-time migration from legacy per-key localStorage */
function migrateLegacyConfig(): ContestConfigData | null {
  const hasLegacy = LEGACY_STORAGE_KEYS.some(k => localStorage.getItem(k) !== null);
  if (!hasLegacy) return null;

  const config: ContestConfigData = {
    models: tryParse(localStorage.getItem('hydra-contest-models'), {}),
    rules: tryParse(localStorage.getItem('hydra-contest-rules'), null),
    taskId: localStorage.getItem('hydra-contest-task-id'),
    taskTitle: localStorage.getItem('hydra-contest-task-title'),
    mode: localStorage.getItem('hydra-contest-mode') || 'contest',
    pipeline: localStorage.getItem('hydra-contest-pipeline') || 'none',
    arbitration: tryParse(localStorage.getItem('hydra-contest-arbitration'), null),
    savedPlan: tryParse(localStorage.getItem('hydra-contest-saved-plan'), null),
  };

  // Don't delete 'hydra-contest-models' — Portfolio still reads it for UI sync
  LEGACY_STORAGE_KEYS.filter(k => k !== 'hydra-contest-models').forEach(k => { try { localStorage.removeItem(k); } catch {} });

  return config;
}

export interface ValidationError {
  field: string;
  messageKey: string;
}

export const VALIDATION_MESSAGES: Record<string, { ru: string; en: string }> = {
  'taskRequired': { ru: 'Выберите задачу', en: 'Task is required' },
  'participantsMin': { ru: 'Нужно минимум 3 участника для пьедестала', en: 'At least 3 participants required for podium' },
  'participantsMax': { ru: 'Максимум 8 участников конкурса', en: 'Maximum 8 contest participants' },
  'promptRequired': { ru: 'Напишите промпт для первого тура', en: 'Round prompt is required' },
  'pipelineRequired': { ru: 'Выберите шаблон пайплайна', en: 'Pipeline is required' },
};

export function useContestConfig() {
  const legacyData = useMemo(() => migrateLegacyConfig(), []);
  const initialDefault = legacyData || DEFAULT_CONTEST_CONFIG;

  const { value: config, update: setConfig, reset: resetAllCloud, loaded } =
    useCloudSettings<ContestConfigData>('contest-config', initialDefault, 'hydra-cloud-contest-config');

  // Push migrated legacy data
  useMemo(() => {
    if (legacyData) {
      try {
        localStorage.setItem('hydra-cloud-contest-config', JSON.stringify(legacyData));
      } catch {}
    }
  }, [legacyData]);

  // ── Bidirectional sync with Portfolio localStorage key ──
  const PORTFOLIO_KEY = 'hydra-contest-models';

  /** Forward sync MUST run before reverse sync to prevent DB-loaded empty
   *  models from overwriting localStorage that Portfolio just wrote. */
  const syncFromPortfolio = useCallback(() => {
    try {
      const raw = localStorage.getItem(PORTFOLIO_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string>;
      setConfig(prev => {
        if (JSON.stringify(prev.models) === JSON.stringify(parsed)) return prev;
        return { ...prev, models: parsed };
      });
    } catch {}
  }, [setConfig]);

  // Forward sync: ingest Portfolio localStorage into config on load & storage events
  useEffect(() => {
    if (!loaded) return;
    syncFromPortfolio();
    const onStorage = (e: StorageEvent) => {
      if (e.key === PORTFOLIO_KEY) syncFromPortfolio();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loaded, syncFromPortfolio]);

  /** Reverse sync: push config.models → localStorage for Portfolio to read.
   *  Always sync when models change to keep Portfolio crown indicators up-to-date. */
  const prevSyncRef = useRef<string>('');
  useEffect(() => {
    if (!loaded) return;
    const serialized = JSON.stringify(config.models);
    if (serialized === prevSyncRef.current) return;
    prevSyncRef.current = serialized;
    try {
      localStorage.setItem(PORTFOLIO_KEY, serialized);
      window.dispatchEvent(new StorageEvent('storage', {
        key: PORTFOLIO_KEY,
        newValue: serialized,
      }));
    } catch {}
  }, [loaded, config.models]);

  // Computed values
  const modelCount = Object.keys(config.models).length;
  const roundCount = config.rules?.roundCount || 1;
  const roundPrompt = config.rules?.rounds?.[0]?.prompt || '';

  // Update methods
  const updateModels = useCallback((models: Record<string, string>) => {
    setConfig(prev => ({ ...prev, models }));
    window.dispatchEvent(new Event('contest-config-changed'));
  }, [setConfig]);

  const updateRules = useCallback((rules: unknown) => {
    setConfig(prev => ({ ...prev, rules: rules as ContestRules | null }));
    window.dispatchEvent(new Event('contest-config-changed'));
  }, [setConfig]);

  const updateTaskId = useCallback((taskId: string | null) => {
    setConfig(prev => ({ ...prev, taskId }));
    window.dispatchEvent(new Event('contest-config-changed'));
  }, [setConfig]);

  const updateTaskTitle = useCallback((taskTitle: string | null) => {
    setConfig(prev => ({ ...prev, taskTitle }));
    window.dispatchEvent(new Event('contest-config-changed'));
  }, [setConfig]);

  const updateMode = useCallback((mode: string) => {
    setConfig(prev => ({ ...prev, mode }));
    window.dispatchEvent(new Event('contest-config-changed'));
  }, [setConfig]);

  const updatePipeline = useCallback((pipeline: string) => {
    setConfig(prev => ({ ...prev, pipeline }));
    window.dispatchEvent(new Event('contest-config-changed'));
  }, [setConfig]);

  const updateArbitration = useCallback((arbitration: ArbitrationConfig | null) => {
    setConfig(prev => ({ ...prev, arbitration }));
    window.dispatchEvent(new Event('contest-config-changed'));
  }, [setConfig]);

  const updateSavedPlan = useCallback((savedPlan: SavedPlan | null) => {
    setConfig(prev => ({ ...prev, savedPlan }));
    window.dispatchEvent(new Event('contest-config-changed'));
  }, [setConfig]);

  const exportConfig = useCallback(() => {
    return config as unknown as Record<string, unknown>;
  }, [config]);

  const importConfig = useCallback((data: Record<string, unknown>) => {
    setConfig(prev => ({ ...prev, ...data } as ContestConfigData));
    window.dispatchEvent(new Event('contest-config-changed'));
  }, [setConfig]);

  const resetAll = useCallback(() => {
    resetAllCloud();
    window.dispatchEvent(new Event('contest-config-changed'));
  }, [resetAllCloud]);

  const validateForSave = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    if (!config.taskId || !config.taskTitle) {
      errors.push({ field: 'taskId', messageKey: 'taskRequired' });
    }
    const mc = Object.keys(config.models).length;
    if (mc < 3) {
      errors.push({ field: 'models', messageKey: 'participantsMin' });
    } else if (mc > 8) {
      errors.push({ field: 'models', messageKey: 'participantsMax' });
    }
    if (!config.rules?.rounds?.[0]?.prompt || !config.rules.rounds[0].prompt.trim()) {
      errors.push({ field: 'prompt', messageKey: 'promptRequired' });
    }
    if (!config.pipeline || config.pipeline === 'none') {
      errors.push({ field: 'pipeline', messageKey: 'pipelineRequired' });
    }
    return errors;
  }, [config]);

  return {
    config,
    loaded,
    modelCount,
    roundCount,
    roundPrompt,
    models: config.models,
    rules: config.rules,
    taskId: config.taskId,
    taskTitle: config.taskTitle,
    mode: config.mode,
    pipeline: config.pipeline,
    arbitration: config.arbitration,
    savedPlan: config.savedPlan,
    updateModels, updateRules, updateTaskId, updateTaskTitle,
    updateMode, updatePipeline, updateArbitration, updateSavedPlan,
    exportConfig, importConfig, resetAll, validateForSave,
  };
}
