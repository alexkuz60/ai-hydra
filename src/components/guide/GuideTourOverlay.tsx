import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Compass, ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPanelElements, type PanelElement } from '@/config/guidePanelElements';
import type { GuideTourState } from '@/hooks/useGuideTour';

interface GuideTourOverlayProps {
  state: GuideTourState;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
  onGoToStep: (index: number) => void;
}

const PADDING = 8;

export function GuideTourOverlay({ state, onNext, onPrev, onStop, onGoToStep }: GuideTourOverlayProps) {
  const { language } = useLanguage();
  const [selectedElement, setSelectedElement] = useState<PanelElement | null>(null);
  const [comboOpen, setComboOpen] = useState(false);

  if (!state.isActive || !state.currentStep || !state.tour) return null;

  const step = state.currentStep;
  const rect = state.targetRect;
  const lang = language as 'ru' | 'en';
  const panelElements = getPanelElements(state.tour.id, state.currentStepIndex);

  // Reset selection when step changes — handled via key on the tooltip
  const stepKey = `${state.tour.id}-${state.currentStepIndex}`;

  // Tooltip position with viewport clamping
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const placement = step.placement ?? 'bottom';
    const gap = 16;
    const tooltipWidth = 340;
    const tooltipHeight = selectedElement ? 320 : comboOpen ? 300 : 200;
    const margin = 16;

    const fitsRight = rect.right + PADDING + gap + tooltipWidth + margin < window.innerWidth;
    const fitsLeft = rect.left - PADDING - gap - tooltipWidth - margin > 0;
    const fitsBottom = rect.bottom + PADDING + gap + tooltipHeight + margin < window.innerHeight;
    const fitsTop = rect.top - PADDING - gap - tooltipHeight - margin > 0;

    let effectivePlacement = placement;
    if (placement === 'right' && !fitsRight) effectivePlacement = fitsLeft ? 'left' : 'bottom';
    if (placement === 'left' && !fitsLeft) effectivePlacement = fitsRight ? 'right' : 'bottom';
    if (placement === 'bottom' && !fitsBottom) effectivePlacement = fitsTop ? 'top' : 'right';
    if (placement === 'top' && !fitsTop) effectivePlacement = fitsBottom ? 'bottom' : 'right';

    const clampY = (y: number) => Math.max(margin, Math.min(y, window.innerHeight - tooltipHeight - margin));
    const clampX = (x: number) => Math.max(margin, Math.min(x, window.innerWidth - tooltipWidth - margin));

    switch (effectivePlacement) {
      case 'right':
        return { top: clampY(rect.top + rect.height / 2 - tooltipHeight / 2), left: rect.right + PADDING + gap };
      case 'left':
        return { top: clampY(rect.top + rect.height / 2 - tooltipHeight / 2), left: Math.max(margin, rect.left - PADDING - gap - tooltipWidth) };
      case 'top':
        return { top: Math.max(margin, rect.top - PADDING - gap - tooltipHeight), left: clampX(rect.left + rect.width / 2 - tooltipWidth / 2) };
      case 'bottom':
      default:
        return { top: rect.bottom + PADDING + gap, left: clampX(rect.left + rect.width / 2 - tooltipWidth / 2) };
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
          className="absolute z-10 w-[340px] max-w-[calc(100vw-2rem)]"
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

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description[lang]}</p>

            {/* Panel elements combo-box */}
            {panelElements.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => { setComboOpen(v => !v); setSelectedElement(null); }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                >
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <Info className="h-3.5 w-3.5 text-hydra-guide" />
                    {selectedElement
                      ? selectedElement.label[lang]
                      : (lang === 'ru' ? 'Элементы панели…' : 'Panel elements…')
                    }
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${comboOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {comboOpen && !selectedElement && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 max-h-36 overflow-y-auto hydra-scrollbar">
                        {panelElements.map((el) => (
                          <button
                            key={el.id}
                            onClick={() => { setSelectedElement(el); setComboOpen(false); }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-xs text-muted-foreground hover:bg-hydra-guide/10 hover:text-hydra-guide transition-colors"
                          >
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-hydra-guide/50" />
                            <span className="truncate">{el.label[lang]}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Selected element explanation */}
                <AnimatePresence>
                  {selectedElement && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-lg border border-hydra-guide/20 bg-hydra-guide/5 p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-hydra-guide">{selectedElement.label[lang]}</span>
                          <button
                            onClick={() => { setSelectedElement(null); setComboOpen(true); }}
                            className="text-muted-foreground hover:text-foreground p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{selectedElement.description[lang]}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
