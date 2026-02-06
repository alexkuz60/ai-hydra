import type { HydrapediaSection } from './types';
import { allHydrapediaSections } from './_data';

const ids = ['flow-editor', 'flow-editor-guide'];
export const flowSections: HydrapediaSection[] = allHydrapediaSections.filter(s => ids.includes(s.id));
