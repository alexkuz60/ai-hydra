import type { HydrapediaSection } from './types';
import { allHydrapediaSections } from './_data';

const ids = ['hydra-training', 'technical-staff'];
export const adminSections: HydrapediaSection[] = allHydrapediaSections.filter(s => ids.includes(s.id));
