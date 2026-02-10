import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { GuideTour, GuideTourStep } from '@/config/guideTours';

export interface GuideTourState {
  isActive: boolean;
  tour: GuideTour | null;
  currentStepIndex: number;
  currentStep: GuideTourStep | null;
  totalSteps: number;
  targetRect: DOMRect | null;
}

export function useGuideTour() {
  const [tour, setTour] = useState<GuideTour | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const pendingNavRef = useRef(false);
  const observerRef = useRef<ResizeObserver | null>(null);

  const currentStep = tour?.steps[stepIndex] ?? null;
  const isActive = tour !== null;

  // Highlight the target element
  const highlightTarget = useCallback((step: GuideTourStep) => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const findAndHighlight = () => {
      const el = document.querySelector(step.selector);
      if (!el) {
        setTargetRect(null);
        return false;
      }
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);

      // Track resize/scroll
      observerRef.current = new ResizeObserver(() => {
        const r = el.getBoundingClientRect();
        setTargetRect(r);
      });
      observerRef.current.observe(el);

      // Execute action if specified
      if (step.action === 'click') {
        (el as HTMLElement).click();
      }
      return true;
    };

    const delay = step.delayMs ?? 300;
    setTimeout(() => {
      if (!findAndHighlight()) {
        // Retry once more after a longer delay
        setTimeout(findAndHighlight, 500);
      }
    }, delay);
  }, []);

  // Navigate and highlight when step changes
  useEffect(() => {
    if (!currentStep || !isActive) return;

    if (currentStep.route && location.pathname !== currentStep.route) {
      pendingNavRef.current = true;
      navigate(currentStep.route);
    } else {
      highlightTarget(currentStep);
    }
  }, [currentStep, isActive, location.pathname, navigate, highlightTarget]);

  // After navigation completes, highlight
  useEffect(() => {
    if (pendingNavRef.current && currentStep) {
      pendingNavRef.current = false;
      highlightTarget(currentStep);
    }
  }, [location.pathname, currentStep, highlightTarget]);

  const startTour = useCallback((t: GuideTour) => {
    setTour(t);
    setStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    if (!tour) return;
    if (stepIndex < tour.steps.length - 1) {
      setStepIndex(i => i + 1);
    } else {
      // Tour finished
      setTour(null);
      setStepIndex(0);
      setTargetRect(null);
    }
  }, [tour, stepIndex]);

  const prevStep = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex(i => i - 1);
    }
  }, [stepIndex]);

  const goToStep = useCallback((index: number) => {
    if (!tour || index < 0 || index >= tour.steps.length) return;
    setStepIndex(index);
  }, [tour]);

  const stopTour = useCallback(() => {
    setTour(null);
    setStepIndex(0);
    setTargetRect(null);
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  // Listen for scroll to update rect
  useEffect(() => {
    if (!isActive || !currentStep) return;
    const onScroll = () => {
      const el = document.querySelector(currentStep.selector);
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [isActive, currentStep]);

  return {
    state: {
      isActive,
      tour,
      currentStepIndex: stepIndex,
      currentStep,
      totalSteps: tour?.steps.length ?? 0,
      targetRect,
    } as GuideTourState,
    startTour,
    nextStep,
    prevStep,
    goToStep,
    stopTour,
  };
}
