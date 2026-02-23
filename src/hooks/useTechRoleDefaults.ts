import { useState, useCallback, useEffect } from 'react';
import { useCloudSettings } from './useCloudSettings';
import type { AgentRole } from '@/config/roles';

const STORAGE_KEY = 'hydra-tech-role-defaults';

/** Built-in defaults chosen for cost/speed/quality fit per role.
 *  Uses OpenRouter paid models for broad availability (BYOK).
 *  Lovable AI (admin-only) models serve as fallback for admin user. */
const BUILTIN_DEFAULTS: Record<string, string> = {
  // Expert roles — heavy reasoning
  assistant: 'google/gemini-2.5-pro-preview',         // strong all-rounder
  critic: 'anthropic/claude-sonnet-4',                 // best at critical analysis
  arbiter: 'anthropic/claude-sonnet-4',                // strong synthesis & fairness
  consultant: 'google/gemini-2.5-pro-preview',         // deep domain expertise
  moderator: 'google/gemini-2.5-flash-preview',        // fast summarization
  advisor: 'google/gemini-2.5-pro-preview',            // strategic thinking
  // Technical staff
  archivist: 'google/gemini-2.5-flash-preview',        // fast document processing
  analyst: 'google/gemini-2.5-pro-preview',            // data analysis precision
  promptengineer: 'anthropic/claude-sonnet-4',         // excellent at prompt craft
  flowregulator: 'google/gemini-2.5-flash-preview',    // fast pipeline decisions
  toolsmith: 'anthropic/claude-3.5-haiku',             // fast code generation
  guide: 'google/gemini-2.5-flash-lite-preview',       // lightweight, cheap
  webhunter: 'google/gemini-2.5-flash-preview',        // fast web content parsing
  // Technical staff judges (OTK) — need strong reasoning
  technocritic: 'anthropic/claude-sonnet-4',           // rigorous analysis
  technoarbiter: 'google/gemini-2.5-pro-preview',      // balanced judgment
  technomoderator: 'google/gemini-2.5-flash-preview',  // fast consensus building
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
