import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useGuideTour } from '@/hooks/useGuideTour';
import { GuideTourOverlay } from '@/components/guide/GuideTourOverlay';
import { GuideTourPickerDialog } from '@/components/guide/GuideTourPickerDialog';
import type { GuideTour } from '@/config/guideTours';

interface GuideTourContextValue {
  openPicker: () => void;
  startTour: (tour: GuideTour) => void;
  isActive: boolean;
}

const GuideTourContext = createContext<GuideTourContextValue | null>(null);

export function useGuideTourContext() {
  const ctx = useContext(GuideTourContext);
  if (!ctx) throw new Error('useGuideTourContext must be used within GuideTourProvider');
  return ctx;
}

export function GuideTourProvider({ children }: { children: ReactNode }) {
  const { state, startTour, nextStep, prevStep, stopTour } = useGuideTour();
  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = useCallback(() => setPickerOpen(true), []);

  const handleSelectTour = useCallback((tour: GuideTour) => {
    startTour(tour);
  }, [startTour]);

  return (
    <GuideTourContext.Provider value={{ openPicker, startTour: handleSelectTour, isActive: state.isActive }}>
      {children}
      <GuideTourPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelectTour={handleSelectTour}
      />
      <GuideTourOverlay
        state={state}
        onNext={nextStep}
        onPrev={prevStep}
        onStop={stopTour}
      />
    </GuideTourContext.Provider>
  );
}
