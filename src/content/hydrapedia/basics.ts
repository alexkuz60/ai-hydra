import type { HydrapediaSection } from './types';
import { allHydrapediaSections } from './_data';

const ids = ['intro', 'getting-started'];
export const basicsSections: HydrapediaSection[] = allHydrapediaSections.filter(s => ids.includes(s.id));
