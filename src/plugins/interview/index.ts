/**
 * Interview Plugin Registry
 * 
 * Central registry for role-specific interview plugins.
 * Each technical role implements RoleTestPlugin to provide
 * specialized test tasks for its interview pipeline.
 */

import type { RoleTestPlugin } from '@/types/interview';
import { promptEngineerPlugin, COMPETENCY_LABELS as PE_LABELS } from './promptEngineerPlugin';
import { flowRegulatorPlugin, COMPETENCY_LABELS as FR_LABELS } from './flowRegulatorPlugin';

// ── Registry ──

const plugins = new Map<string, RoleTestPlugin>();
const competencyLabelsMap = new Map<string, Record<string, { ru: string; en: string }>>();

function register(plugin: RoleTestPlugin, labels?: Record<string, { ru: string; en: string }>) {
  plugins.set(plugin.role, plugin);
  if (labels) competencyLabelsMap.set(plugin.role, labels);
}

// Register all available plugins
register(promptEngineerPlugin, PE_LABELS);
register(flowRegulatorPlugin, FR_LABELS);

// ── Public API ──

/** Get the plugin for a specific role, or null if none exists */
export function getInterviewPlugin(role: string): RoleTestPlugin | null {
  return plugins.get(role) || null;
}

/** Check if a role has a specialized interview plugin */
export function hasInterviewPlugin(role: string): boolean {
  return plugins.has(role);
}

/** List all roles with specialized plugins */
export function getPluginRoles(): string[] {
  return Array.from(plugins.keys());
}

/** Get localized competency labels for a role */
export function getCompetencyLabels(role: string): Record<string, { ru: string; en: string }> | null {
  return competencyLabelsMap.get(role) || null;
}
