import { useState, useCallback, useEffect } from 'react';
import { useCloudSettings } from './useCloudSettings';
import type { AgentRole } from '@/config/roles';

const STORAGE_KEY = 'hydra-tech-role-defaults';

/** Built-in defaults chosen for cost/speed/quality fit per role */
const BUILTIN_DEFAULTS: Record<string, string> = {
  archivist: 'google/gemini-2.5-flash',
  analyst: 'google/gemini-2.5-pro',
  promptengineer: 'openai/gpt-5',
  flowregulator: 'google/gemini-3-flash-preview',
  toolsmith: 'openai/gpt-5-mini',
  guide: 'google/gemini-2.5-flash-lite',
  webhunter: 'google/gemini-3-flash-preview',
};

interface TechRoleDefaults {
  [role: string]: string; // role -> modelId
}

export function useTechRoleDefaults() {
  const { value: overrides, update, loaded } = useCloudSettings<TechRoleDefaults>(
    'tech-role-defaults',
    {},
    STORAGE_KEY,
  );

  const defaults: TechRoleDefaults = { ...BUILTIN_DEFAULTS, ...overrides };

  const getDefaultModel = useCallback((role: AgentRole): string | null => {
    return defaults[role] || null;
  }, [defaults]);

  const setDefaultModel = useCallback((role: AgentRole, modelId: string | null) => {
    update((prev) => {
      const next = { ...prev };
      if (modelId) {
        next[role] = modelId;
      } else {
        delete next[role];
      }
      return next;
    });
  }, [update]);

  return { getDefaultModel, setDefaultModel, defaults, loaded };
}

/** Standalone getter for use outside React (e.g. TechSupportDialog init) */
export function getTechRoleDefaultModel(role: string): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const overrides = raw ? JSON.parse(raw) : {};
    return overrides[role] || BUILTIN_DEFAULTS[role] || null;
  } catch {
    return BUILTIN_DEFAULTS[role] || null;
  }
}
