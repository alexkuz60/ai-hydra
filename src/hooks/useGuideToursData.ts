import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GuideTour, GuideTourStep } from '@/config/guideTours';
import type { PanelElement } from '@/config/guidePanelElements';

interface DbTour {
  id: string;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  icon: string;
  sort_order: number;
}

interface DbStep {
  tour_id: string;
  step_index: number;
  selector: string;
  route: string | null;
  placement: string;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  delay_ms: number | null;
  action: string | null;
}

interface DbElement {
  tour_id: string;
  step_index: number;
  element_id: string;
  label_ru: string;
  label_en: string;
  description_ru: string;
  description_en: string;
  selector: string | null;
  sort_order: number;
}

function buildTours(tours: DbTour[], steps: DbStep[]): GuideTour[] {
  const stepsByTour = new Map<string, DbStep[]>();
  for (const s of steps) {
    const arr = stepsByTour.get(s.tour_id) ?? [];
    arr.push(s);
    stepsByTour.set(s.tour_id, arr);
  }

  return tours
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(t => ({
      id: t.id,
      title: { ru: t.title_ru, en: t.title_en },
      description: { ru: t.description_ru, en: t.description_en },
      icon: t.icon,
      steps: (stepsByTour.get(t.id) ?? [])
        .sort((a, b) => a.step_index - b.step_index)
        .map(s => {
          const step: GuideTourStep = {
            selector: s.selector,
            title: { ru: s.title_ru, en: s.title_en },
            description: { ru: s.description_ru, en: s.description_en },
            placement: s.placement as GuideTourStep['placement'],
          };
          if (s.route) step.route = s.route;
          if (s.delay_ms) step.delayMs = s.delay_ms;
          if (s.action) step.action = s.action as 'click' | 'hover';
          return step;
        }),
    }));
}

function buildElementsMap(elements: DbElement[]): Map<string, Map<number, PanelElement[]>> {
  const map = new Map<string, Map<number, PanelElement[]>>();
  for (const el of elements) {
    if (!map.has(el.tour_id)) map.set(el.tour_id, new Map());
    const tourMap = map.get(el.tour_id)!;
    if (!tourMap.has(el.step_index)) tourMap.set(el.step_index, []);
    tourMap.get(el.step_index)!.push({
      id: el.element_id,
      label: { ru: el.label_ru, en: el.label_en },
      description: { ru: el.description_ru, en: el.description_en },
      selector: el.selector ?? undefined,
    });
  }
  // Sort by sort_order (already ordered in query but ensure)
  return map;
}

async function fetchGuideData() {
  const [toursRes, stepsRes, elementsRes] = await Promise.all([
    supabase.from('guide_tours').select('*').order('sort_order'),
    supabase.from('guide_tour_steps').select('*').order('step_index'),
    supabase.from('guide_panel_elements').select('*').order('sort_order'),
  ]);

  if (toursRes.error) throw toursRes.error;
  if (stepsRes.error) throw stepsRes.error;
  if (elementsRes.error) throw elementsRes.error;

  const tours = buildTours(toursRes.data as DbTour[], stepsRes.data as DbStep[]);
  const elementsMap = buildElementsMap(elementsRes.data as DbElement[]);

  return { tours, elementsMap };
}

export function useGuideToursData() {
  return useQuery({
    queryKey: ['guide-tours-data'],
    queryFn: fetchGuideData,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 30 * 60 * 1000,
  });
}

/** Helper to get panel elements from the map */
export function getElementsFromMap(
  map: Map<string, Map<number, PanelElement[]>> | undefined,
  tourId: string,
  stepIndex: number,
): PanelElement[] {
  if (!map) return [];
  return map.get(tourId)?.get(stepIndex) ?? [];
}
