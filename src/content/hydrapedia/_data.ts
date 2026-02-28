import type { HydrapediaSection } from './types';
import { basicsSections } from './basics';
import { chatSections } from './chat';
import { contentSections } from './content';
import { flowSections } from './flow';
import { featuresSections, duelModeSections, podiumInterviewSections } from './features';
import { referenceSections } from './reference';
import { adminSections } from './admin';
import { guideSections } from './guide';

// Helper to pluck a section by id from a module array
const pick = (sections: HydrapediaSection[], id: string) =>
  sections.find(s => s.id === id)!;

// Navigation group definition
export interface HydrapediaNavGroup {
  titleKey: string;
  sections: HydrapediaSection[];
}

// Grouped navigation structure matching main sidebar
export const hydrapediaNavGroups: HydrapediaNavGroup[] = [
  {
    titleKey: 'hydrapedia.group.basics',
    sections: [
      pick(basicsSections, 'intro'),
      pick(basicsSections, 'getting-started'),
    ],
  },
  {
    titleKey: 'hydrapedia.group.expertPanel',
    sections: [
      pick(chatSections, 'expert-panel'),
      pick(chatSections, 'chat-actions'),
      pick(chatSections, 'streaming-mode'),
      pick(chatSections, 'd-chat-moderator'),
    ],
  },
  {
    titleKey: 'hydrapedia.group.content',
    sections: [
      pick(contentSections, 'prompt-library'),
      pick(contentSections, 'tools'),
      pick(contentSections, 'behavioral-patterns'),
    ],
  },
  {
    titleKey: 'hydrapedia.group.flow',
    sections: [
      pick(flowSections, 'flow-editor'),
      pick(flowSections, 'flow-editor-guide'),
    ],
  },
  {
    titleKey: 'hydrapedia.group.ratings',
    sections: [
      pick(featuresSections, 'model-ratings'),
      pick(duelModeSections, 'duel-mode'),
      pick(duelModeSections, 'contest-rules'),
      pick(podiumInterviewSections, 'podium-interview'),
    ],
  },
  {
    titleKey: 'hydrapedia.group.staff',
    sections: [
      pick(featuresSections, 'tasks'),
      pick(featuresSections, 'roles-catalog'),
      pick(featuresSections, 'web-search'),
      pick(adminSections, 'hydra-training'),
      pick(adminSections, 'technical-staff'),
      pick(adminSections, 'interview-panel'),
    ],
  },
  {
    titleKey: 'hydrapedia.group.memory',
    sections: [
      pick(featuresSections, 'hydra-memory-hub'),
      pick(featuresSections, 'session-memory'),
      pick(featuresSections, 'roleMemory'),
    ],
  },
  {
    titleKey: 'hydrapedia.group.reference',
    sections: [
      pick(referenceSections, 'best-practices'),
      pick(referenceSections, 'localization'),
      pick(referenceSections, 'security'),
      pick(referenceSections, 'proxyapi'),
      pick(referenceSections, 'api-integrations'),
      pick(referenceSections, 'advanced-patterns'),
      pick(referenceSections, 'faq'),
      pick(referenceSections, 'architectural-contracts'),
    ],
  },
  {
    titleKey: 'hydrapedia.group.other',
    sections: [
      pick(guideSections, 'guide-tours'),
    ],
  },
];

// Combined flat array preserving grouped order
export const allHydrapediaSections: HydrapediaSection[] =
  hydrapediaNavGroups.flatMap(g => g.sections);
