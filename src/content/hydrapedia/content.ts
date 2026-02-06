import type { HydrapediaSection } from './types';
import { allHydrapediaSections } from './_data';

const ids = ['prompt-library', 'tools', 'behavioral-patterns'];
export const contentSections: HydrapediaSection[] = allHydrapediaSections.filter(s => ids.includes(s.id));
