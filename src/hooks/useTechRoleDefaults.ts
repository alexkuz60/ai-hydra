import { useState, useCallback } from 'react';
import type { AgentRole } from '@/config/roles';

const STORAGE_KEY = 'hydra-tech-role-defaults';

interface TechRoleDefaults {
  [role: string]: string; // role -> modelId
}

function loadDefaults(): TechRoleDefaults {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDefaults(defaults: TechRoleDefaults) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
}

export function useTechRoleDefaults() {
  const [defaults, setDefaults] = useState<TechRoleDefaults>(loadDefaults);

  const getDefaultModel = useCallback((role: AgentRole): string | null => {
    return defaults[role] || null;
  }, [defaults]);

  const setDefaultModel = useCallback((role: AgentRole, modelId: string | null) => {
    setDefaults(prev => {
      const next = { ...prev };
      if (modelId) {
        next[role] = modelId;
      } else {
        delete next[role];
      }
      saveDefaults(next);
      return next;
    });
  }, []);

  return { getDefaultModel, setDefaultModel, defaults };
}

/** Standalone getter for use outside React (e.g. TechSupportDialog init) */
export function getTechRoleDefaultModel(role: string): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed[role] || null;
  } catch {
    return null;
  }
}
