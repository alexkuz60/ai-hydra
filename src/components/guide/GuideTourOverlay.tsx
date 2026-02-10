import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Compass, ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PanelElement } from '@/config/guidePanelElements';
import type { GuideTourState } from '@/hooks/useGuideTour';

interface GuideTourOverlayProps {
  state: GuideTourState;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
  onGoToStep: (index: number) => void;
  getPanelElements: (tourId: string, stepIndex: number) => PanelElement[];
}

const PADDING = 8;

export function GuideTourOverlay({ state, onNext, onPrev, onStop, onGoToStep, getPanelElements }: GuideTourOverlayProps) {
  const { language } = useLanguage();
  const [selectedElement, setSelectedElement] = useState<PanelElement | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);
  const elementObserverRef = useRef<ResizeObserver | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(200);

  const stepKey = state.tour && state.isActive
    ? `${state.tour.id}-${state.currentStepIndex}`
    : '';

  // Clean up element observer on step change
  useEffect(() => {
    setSelectedElement(null);
    setElementRect(null);
    setComboOpen(false);
    setTooltipHeight(200);
    if (elementObserverRef.current) {
      elementObserverRef.current.disconnect();
      elementObserverRef.current = null;
    }
  }, [stepKey]);

  // Measure actual tooltip height for positioning
  useEffect(() => {
    if (!tooltipRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setTooltipHeight(entry.contentRect.height);
      }
    });
    ro.observe(tooltipRef.current);
    return () => ro.disconnect();
  });

  if (!state.isActive || !state.currentStep || !state.tour) return null;

  const step = state.currentStep;
  const rect = state.targetRect;
  const lang = language as 'ru' | 'en';
  const panelElements = getPanelElements(state.tour.id, state.currentStepIndex);

  // Track highlighted element rect
  const handleSelectElement = (el: PanelElement) => {
    setSelectedElement(el);
    // Clean up previous observer
    if (elementObserverRef.current) {
      elementObserverRef.current.disconnect();
      elementObserverRef.current = null;
    }
    if (el.selector) {
      const domEl = document.querySelector(el.selector);
      if (domEl) {
        setElementRect(domEl.getBoundingClientRect());
        elementObserverRef.current = new ResizeObserver(() => {
          setElementRect(domEl.getBoundingClientRect());
        });
        elementObserverRef.current.observe(domEl);
      } else {
        setElementRect(null);
      }
    } else {
      setElementRect(null);
    }
  };


  // Tooltip position with viewport clamping
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const placement = step.placement ?? 'bottom';
    const gap = 16;
    const tooltipWidth = 540;
    const estHeight = tooltipHeight;
    const margin = 16;

    const fitsRight = rect.right + PADDING + gap + tooltipWidth + margin < window.innerWidth;
    const fitsLeft = rect.left - PADDING - gap - tooltipWidth - margin > 0;
    const fitsBottom = rect.bottom + PADDING + gap + estHeight + margin < window.innerHeight;
    const fitsTop = rect.top - PADDING - gap - estHeight - margin > 0;

    let effectivePlacement = placement;
    if (placement === 'right' && !fitsRight) effectivePlacement = fitsLeft ? 'left' : fitsTop ? 'top' : 'bottom';
    if (placement === 'left' && !fitsLeft) effectivePlacement = fitsRight ? 'right' : fitsTop ? 'top' : 'bottom';
    if (placement === 'bottom' && !fitsBottom) effectivePlacement = fitsTop ? 'top' : fitsRight ? 'right' : 'left';
    if (placement === 'top' && !fitsTop) effectivePlacement = fitsBottom ? 'bottom' : fitsRight ? 'right' : 'left';

    const clampY = (y: number) => Math.max(margin, Math.min(y, window.innerHeight - estHeight - margin));
    const clampX = (x: number) => Math.max(margin, Math.min(x, window.innerWidth - tooltipWidth - margin));

    switch (effectivePlacement) {
      case 'right':
        return { top: clampY(rect.top + rect.height / 2 - estHeight / 2), left: rect.right + PADDING + gap };
      case 'left':
        return { top: clampY(rect.top + rect.height / 2 - estHeight / 2), left: Math.max(margin, rect.left - PADDING - gap - tooltipWidth) };
      case 'top':
        return { top: Math.max(margin, rect.top - PADDING - gap - estHeight), left: clampX(rect.left + rect.width / 2 - tooltipWidth / 2) };
      case 'bottom':
      default:
        return { top: clampY(rect.bottom + PADDING + gap), left: clampX(rect.left + rect.width / 2 - tooltipWidth / 2) };
    }
  };

  const overlay = (
    <AnimatePresence>
      <motion.div
        key="guide-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Dark backdrop with cutout */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <mask id="guide-spotlight">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {rect && (
                <rect
                  x={rect.left - PADDING} y={rect.top - PADDING}
                  width={rect.width + PADDING * 2} height={rect.height + PADDING * 2}
                  rx="8" fill="black"
                />
              )}
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#guide-spotlight)" />
        </svg>

        {/* Glowing border around target */}
        {rect && (
          <motion.div
            key={`highlight-${state.currentStepIndex}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute rounded-lg pointer-events-none"
            style={{
              left: rect.left - PADDING, top: rect.top - PADDING,
              width: rect.width + PADDING * 2, height: rect.height + PADDING * 2,
              boxShadow: '0 0 0 2px hsl(var(--hydra-guide)), 0 0 20px hsl(var(--hydra-guide) / 0.3)',
            }}
          />
        )}

        {/* Blue highlight ring on explained element (skip if overlaps green spotlight) */}
        {elementRect && selectedElement && (() => {
          // Don't show blue ring if it matches the step target (would duplicate green)
          if (rect) {
            const dx = Math.abs(elementRect.left - rect.left);
            const dy = Math.abs(elementRect.top - rect.top);
            const dw = Math.abs(elementRect.width - rect.width);
            const dh = Math.abs(elementRect.height - rect.height);
            if (dx < 12 && dy < 12 && dw < 12 && dh < 12) return null;
          }
          return (
            <motion.div
              key={`element-highlight-${selectedElement.id}`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute rounded-md pointer-events-none"
              style={{
                left: elementRect.left - 4, top: elementRect.top - 4,
                width: elementRect.width + 8, height: elementRect.height + 8,
                boxShadow: '0 0 0 2px hsl(200 80% 55%), 0 0 16px hsl(200 80% 55% / 0.35)',
              }}
            />
          );
        })()}

        {/* Click-through area over the target */}
        {rect && (
          <div className="absolute" style={{
            left: rect.left - PADDING, top: rect.top - PADDING,
            width: rect.width + PADDING * 2, height: rect.height + PADDING * 2,
            pointerEvents: 'none',
          }} />
        )}

        {/* Click backdrop to prevent interaction outside */}
        <div className="absolute inset-0" onClick={onStop} style={{ pointerEvents: 'auto' }} />

        {/* Tooltip card */}
        <motion.div
          key={stepKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="absolute z-10 w-[540px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto hydra-scrollbar"
          ref={tooltipRef}
          style={{ ...getTooltipStyle(), pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-hydra-guide" />
                <h3 className="font-semibold text-sm">{step.title[lang]}</h3>
              </div>
              <button onClick={onStop} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Two-column body: description left, details right */}
            {panelElements.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Left column: step description */}
                  <div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description[lang]}</p>
                  </div>

                  {/* Right column: element selector */}
                  <div>
                    {panelElements.length === 1 ? (
                      (() => {
                        const el = panelElements[0];
                        if (!selectedElement || selectedElement.id !== el.id) {
                          setTimeout(() => handleSelectElement(el), 0);
                        }
                        return null;
                      })()
                    ) : (
                      <div className="relative space-y-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                          {lang === 'ru' ? 'Элементы UI' : 'UI elements'}
                        </span>
                        <button
                          onClick={() => setComboOpen(v => !v)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                        >
                          <span className="flex items-center gap-2 text-xs font-medium">
                            <Info className="h-3.5 w-3.5 text-hydra-guide" />
                            {selectedElement
                              ? selectedElement.label[lang]
                              : (lang === 'ru' ? 'Выберите элемент…' : 'Select element…')
                            }
                          </span>
                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${comboOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Floating dropdown overlay */}
                        <AnimatePresence>
                          {comboOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg"
                            >
                              <div className="space-y-0.5 max-h-36 overflow-y-auto hydra-scrollbar p-1">
                                {panelElements.map((el) => (
                                  <button
                                    key={el.id}
                                    onClick={() => { handleSelectElement(el); setComboOpen(false); }}
                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-xs transition-colors ${
                                      selectedElement?.id === el.id
                                        ? 'bg-hydra-guide/15 text-hydra-guide font-medium'
                                        : 'text-muted-foreground hover:bg-hydra-guide/10 hover:text-hydra-guide'
                                    }`}
                                  >
                                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                                      selectedElement?.id === el.id ? 'bg-hydra-guide' : 'bg-hydra-guide/50'
                                    }`} />
                                    <span className="truncate">{el.label[lang]}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>

                {/* Explanation — full width below */}
                <AnimatePresence mode="wait">
                  {(selectedElement || panelElements.length === 1) && (() => {
                    const el = selectedElement ?? panelElements[0];
                    return (
                      <motion.div
                        key={el.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="rounded-lg border border-hydra-guide/20 bg-hydra-guide/5 p-3 space-y-1.5">
                          <span className="text-xs font-semibold text-hydra-guide">{el.label[lang]}</span>
                          <p className="text-xs text-muted-foreground leading-relaxed">{el.description[lang]}</p>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            ) : (
              /* No panel elements — just description */
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description[lang]}</p>
            )}

            {/* Footer with navigation */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground font-mono">
                {state.currentStepIndex + 1} / {state.totalSteps}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onPrev} disabled={state.currentStepIndex === 0} className="h-7 px-2">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={onNext} className="h-7 px-3 bg-hydra-guide hover:bg-hydra-guide/90 text-white">
                  {state.currentStepIndex === state.totalSteps - 1
                    ? (lang === 'ru' ? 'Готово' : 'Done')
                    : (lang === 'ru' ? 'Далее' : 'Next')
                  }
                  {state.currentStepIndex < state.totalSteps - 1 && <ChevronRight className="h-3.5 w-3.5 ml-0.5" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}
