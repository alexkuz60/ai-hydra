/**
 * Panel UI elements for each guide tour step — type definitions.
 * Content is stored in the database (guide_panel_elements table).
 */

export interface PanelElement {
  id: string;
  label: { ru: string; en: string };
  description: { ru: string; en: string };
  /** Optional CSS selector to highlight the explained element on the page */
  selector?: string;
}

export interface TourStepElements {
  /** tourId from guideTours */
  tourId: string;
  /** stepIndex → array of panel elements */
  steps: Record<number, PanelElement[]>;
}
