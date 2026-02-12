import { useState, useEffect, useCallback } from 'react';

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

const STORAGE_KEYS = {
  models: 'hydra-contest-models',
  rules: 'hydra-contest-rules',
  taskId: 'hydra-contest-task-id',
  taskTitle: 'hydra-contest-task-title',
  mode: 'hydra-contest-mode',
  pipeline: 'hydra-contest-pipeline',
  arbitration: 'hydra-contest-arbitration',
  savedPlan: 'hydra-contest-saved-plan',
} as const;

export const CONTEST_STORAGE_KEYS = Object.values(STORAGE_KEYS);

function tryParse<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

function loadConfig(): ContestConfigData {
  return {
    models: tryParse(localStorage.getItem(STORAGE_KEYS.models), {}),
    rules: tryParse(localStorage.getItem(STORAGE_KEYS.rules), null),
    taskId: localStorage.getItem(STORAGE_KEYS.taskId),
    taskTitle: localStorage.getItem(STORAGE_KEYS.taskTitle),
    mode: localStorage.getItem(STORAGE_KEYS.mode) || 'contest',
    pipeline: localStorage.getItem(STORAGE_KEYS.pipeline) || 'none',
    arbitration: tryParse(localStorage.getItem(STORAGE_KEYS.arbitration), null),
    savedPlan: tryParse(localStorage.getItem(STORAGE_KEYS.savedPlan), null),
  };
}

function dispatchConfigChanged() {
  window.dispatchEvent(new Event('contest-config-changed'));
}

export function useContestConfig() {
  const [config, setConfig] = useState<ContestConfigData>(loadConfig);

  // Синхронизация с localStorage и cross-tab событиями
  useEffect(() => {
    const handleSync = () => setConfig(loadConfig());

    window.addEventListener('storage', handleSync);
    window.addEventListener('contest-config-changed', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('contest-config-changed', handleSync);
    };
  }, []);

  // Вычисляемые значения
  const modelCount = Object.keys(config.models).length;
  const roundCount = config.rules?.roundCount || 1;
  const roundPrompt = config.rules?.rounds?.[0]?.prompt || '';

  // Методы обновления
  const updateModels = useCallback((models: Record<string, string>) => {
    localStorage.setItem(STORAGE_KEYS.models, JSON.stringify(models));
    dispatchConfigChanged();
  }, []);

  const updateRules = useCallback((rules: unknown) => {
    localStorage.setItem(STORAGE_KEYS.rules, JSON.stringify(rules));
    dispatchConfigChanged();
  }, []);

  const updateTaskId = useCallback((taskId: string | null) => {
    if (taskId) {
      localStorage.setItem(STORAGE_KEYS.taskId, taskId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.taskId);
    }
    dispatchConfigChanged();
  }, []);

  const updateTaskTitle = useCallback((taskTitle: string | null) => {
    if (taskTitle) {
      localStorage.setItem(STORAGE_KEYS.taskTitle, taskTitle);
    } else {
      localStorage.removeItem(STORAGE_KEYS.taskTitle);
    }
    dispatchConfigChanged();
  }, []);

  const updateMode = useCallback((mode: string) => {
    localStorage.setItem(STORAGE_KEYS.mode, mode);
    dispatchConfigChanged();
  }, []);

  const updatePipeline = useCallback((pipeline: string) => {
    localStorage.setItem(STORAGE_KEYS.pipeline, pipeline);
    dispatchConfigChanged();
  }, []);

  const updateArbitration = useCallback((arbitration: ArbitrationConfig | null) => {
    if (arbitration) {
      localStorage.setItem(STORAGE_KEYS.arbitration, JSON.stringify(arbitration));
    } else {
      localStorage.removeItem(STORAGE_KEYS.arbitration);
    }
    dispatchConfigChanged();
  }, []);

  const updateSavedPlan = useCallback((savedPlan: SavedPlan | null) => {
    if (savedPlan) {
      localStorage.setItem(STORAGE_KEYS.savedPlan, JSON.stringify(savedPlan));
    } else {
      localStorage.removeItem(STORAGE_KEYS.savedPlan);
    }
    dispatchConfigChanged();
  }, []);

  const exportConfig = useCallback(() => {
    const data: Record<string, unknown> = {};
    CONTEST_STORAGE_KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v) {
        try {
          data[k] = JSON.parse(v);
        } catch {
          data[k] = v;
        }
      }
    });
    return data;
  }, []);

  const importConfig = useCallback((data: Record<string, unknown>) => {
    CONTEST_STORAGE_KEYS.forEach((k) => {
      if (k in data) {
        localStorage.setItem(
          k,
          typeof data[k] === 'string' ? (data[k] as string) : JSON.stringify(data[k])
        );
      }
    });
    dispatchConfigChanged();
  }, []);

  const resetAll = useCallback(() => {
    CONTEST_STORAGE_KEYS.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
    dispatchConfigChanged();
  }, []);

  return {
    // Состояние
    config,
    modelCount,
    roundCount,
    roundPrompt,

    // Данные
    models: config.models,
    rules: config.rules,
    taskId: config.taskId,
    taskTitle: config.taskTitle,
    mode: config.mode,
    pipeline: config.pipeline,
    arbitration: config.arbitration,
    savedPlan: config.savedPlan,

    // Методы обновления
    updateModels,
    updateRules,
    updateTaskId,
    updateTaskTitle,
    updateMode,
    updatePipeline,
    updateArbitration,
    updateSavedPlan,

    // Методы работы с конфигурацией
    exportConfig,
    importConfig,
    resetAll,
  };
}
