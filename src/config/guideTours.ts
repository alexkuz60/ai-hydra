/**
 * Guide Tours — type definitions for the Экскурсовод.
 * Tour content is stored in the database (guide_tours, guide_tour_steps tables).
 */

export interface GuideTourStep {
  /** CSS selector for the target element to highlight */
  selector: string;
  /** Route to navigate to before highlighting (optional if same page) */
  route?: string;
  /** Localized title */
  title: { ru: string; en: string };
  /** Localized description */
  description: { ru: string; en: string };
  /** Optional action to perform on the element (e.g. click to open a menu) */
  action?: 'click' | 'hover';
  /** Tooltip placement relative to the highlighted element */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay in ms before showing this step (for animations to complete) */
  delayMs?: number;
}

export interface GuideTour {
  id: string;
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  /** Icon name from lucide-react */
  icon: string;
  steps: GuideTourStep[];
}
