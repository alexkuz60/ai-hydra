export type { HydrapediaSection } from './types';

import { allHydrapediaSections } from './_data';

// Re-export the full sections array preserving original order
export const hydrapediaSections = allHydrapediaSections;

// Re-export themed subsets for targeted imports
export { basicsSections } from './basics';
export { chatSections } from './chat';
export { contentSections } from './content';
export { flowSections } from './flow';
export { featuresSections } from './features';
export { referenceSections } from './reference';
export { adminSections } from './admin';
