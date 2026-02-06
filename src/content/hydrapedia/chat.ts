import type { HydrapediaSection } from './types';
import { allHydrapediaSections } from './_data';

const ids = ['expert-panel', 'streaming-mode', 'd-chat-moderator'];
export const chatSections: HydrapediaSection[] = allHydrapediaSections.filter(s => ids.includes(s.id));
