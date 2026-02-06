import type { HydrapediaSection } from './types';
import { allHydrapediaSections } from './_data';

const ids = ['model-ratings', 'tasks', 'roles-catalog', 'session-memory', 'web-search', 'roleMemory'];
export const featuresSections: HydrapediaSection[] = allHydrapediaSections.filter(s => ids.includes(s.id));
