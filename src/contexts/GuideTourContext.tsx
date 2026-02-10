import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useGuideTour } from '@/hooks/useGuideTour';
import { useGuideToursData, getElementsFromMap } from '@/hooks/useGuideToursData';
import { useGuideKnowledgeSync } from '@/hooks/useGuideKnowledgeSync';
import { GuideTourOverlay } from '@/components/guide/GuideTourOverlay';
import { GuideTourPickerDialog } from '@/components/guide/GuideTourPickerDialog';
import type { GuideTour } from '@/config/guideTours';
import type { PanelElement } from '@/config/guidePanelElements';

interface GuideTourContextValue {
  openPicker: () => void;
  startTour: (tour: GuideTour) => void;
  isActive: boolean;
  tours: GuideTour[];
  isLoading: boolean;
  getPanelElements: (tourId: string, stepIndex: number) => PanelElement[];
}

const GuideTourContext = createContext<GuideTourContextValue | null>(null);

export function useGuideTourContext() {
  const ctx = useContext(GuideTourContext);
  if (!ctx) throw new Error('useGuideTourContext must be used within GuideTourProvider');
  return ctx;
}

export function GuideTourProvider({ children }: { children: ReactNode }) {
  const { state, startTour, nextStep, prevStep, goToStep, stopTour } = useGuideTour();
  const { data, isLoading } = useGuideToursData();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { sync: syncGuideKnowledge } = useGuideKnowledgeSync();

  // Auto-sync Hydrapedia → Guide knowledge on mount
  useEffect(() => {
    syncGuideKnowledge();
  }, [syncGuideKnowledge]);

  const openPicker = useCallback(() => setPickerOpen(true), []);

  const handleSelectTour = useCallback((tour: GuideTour) => {
    startTour(tour);
  }, [startTour]);

  const getPanelElementsFn = useCallback((tourId: string, stepIndex: number) => {
    return getElementsFromMap(data?.elementsMap, tourId, stepIndex);
  }, [data?.elementsMap]);

  const tours = data?.tours ?? [];

  return (
    <GuideTourContext.Provider value={{
      openPicker,
      startTour: handleSelectTour,
      isActive: state.isActive,
      tours,
      isLoading,
      getPanelElements: getPanelElementsFn,
    }}>
      {children}
      <GuideTourPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelectTour={handleSelectTour}
        tours={tours}
        isLoading={isLoading}
      />
      <GuideTourOverlay
        state={state}
        onNext={nextStep}
        onPrev={prevStep}
        onStop={stopTour}
        onGoToStep={goToStep}
        getPanelElements={getPanelElementsFn}
      />
    </GuideTourContext.Provider>
  );
}
