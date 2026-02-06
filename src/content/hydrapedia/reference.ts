import type { HydrapediaSection } from './types';
import { allHydrapediaSections } from './_data';

const ids = ['localization', 'security', 'best-practices', 'api-integrations', 'advanced-patterns', 'faq'];
export const referenceSections: HydrapediaSection[] = allHydrapediaSections.filter(s => ids.includes(s.id));
