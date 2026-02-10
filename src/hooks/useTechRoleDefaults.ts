import { useState, useCallback } from 'react';
import type { AgentRole } from '@/config/roles';

const STORAGE_KEY = 'hydra-tech-role-defaults';

/** Built-in defaults chosen for cost/speed/quality fit per role */
const BUILTIN_DEFAULTS: Record<string, string> = {
  archivist: 'google/gemini-2.5-flash',         // summarization + retrieval — balanced speed & reasoning
  analyst: 'google/gemini-2.5-pro',              // complex metrics — strongest reasoning
  promptengineer: 'openai/gpt-5',               // prompt craft — top-tier language precision
  flowregulator: 'google/gemini-3-flash-preview', // structural analysis — fast & capable
  toolsmith: 'openai/gpt-5-mini',               // code generation — good quality, moderate cost
  guide: 'google/gemini-2.5-flash-lite',         // FAQ answers — fastest & cheapest
  webhunter: 'google/gemini-3-flash-preview',    // web content processing — fast multimodal
};

interface TechRoleDefaults {
  [role: string]: string; // role -> modelId
}

function loadDefaults(): TechRoleDefaults {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...BUILTIN_DEFAULTS, ...JSON.parse(raw) } : { ...BUILTIN_DEFAULTS };
  } catch {
    return { ...BUILTIN_DEFAULTS };
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
    const overrides = raw ? JSON.parse(raw) : {};
    return overrides[role] || BUILTIN_DEFAULTS[role] || null;
  } catch {
    return BUILTIN_DEFAULTS[role] || null;
  }
}
