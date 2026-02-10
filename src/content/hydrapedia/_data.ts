import type { HydrapediaSection } from './types';
import { basicsSections } from './basics';
import { chatSections } from './chat';
import { contentSections } from './content';
import { flowSections } from './flow';
import { featuresSections } from './features';
import { referenceSections } from './reference';
import { adminSections } from './admin';
import { guideSections } from './guide';

// Helper to pluck a section by id from a module array
const pick = (sections: HydrapediaSection[], id: string) =>
  sections.find(s => s.id === id)!;

// Combined array preserving original sidebar order
export const allHydrapediaSections: HydrapediaSection[] = [
  pick(basicsSections, 'intro'),
  pick(basicsSections, 'getting-started'),
  pick(chatSections, 'expert-panel'),
  pick(chatSections, 'chat-actions'),
  pick(chatSections, 'streaming-mode'),
  pick(contentSections, 'prompt-library'),
  pick(contentSections, 'tools'),
  pick(flowSections, 'flow-editor'),
  pick(featuresSections, 'model-ratings'),
  pick(referenceSections, 'best-practices'),
  pick(featuresSections, 'tasks'),
  pick(featuresSections, 'roles-catalog'),
  pick(chatSections, 'd-chat-moderator'),
  pick(featuresSections, 'session-memory'),
  pick(featuresSections, 'web-search'),
  pick(referenceSections, 'localization'),
  pick(referenceSections, 'security'),
  pick(contentSections, 'behavioral-patterns'),
  pick(adminSections, 'hydra-training'),
  pick(adminSections, 'technical-staff'),
  pick(flowSections, 'flow-editor-guide'),
  pick(referenceSections, 'proxyapi'),
  pick(referenceSections, 'api-integrations'),
  pick(referenceSections, 'advanced-patterns'),
  pick(featuresSections, 'roleMemory'),
  pick(referenceSections, 'faq'),
  pick(guideSections, 'guide-tours'),
];
