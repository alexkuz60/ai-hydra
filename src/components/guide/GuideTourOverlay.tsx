import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { GuideTourState } from '@/hooks/useGuideTour';

interface GuideTourOverlayProps {
  state: GuideTourState;
  onNext: () => void;
  onPrev: () => void;
  onStop: () => void;
}

const PADDING = 8;

export function GuideTourOverlay({ state, onNext, onPrev, onStop }: GuideTourOverlayProps) {
  const { language } = useLanguage();

  if (!state.isActive || !state.currentStep) return null;

  const step = state.currentStep;
  const rect = state.targetRect;
  const lang = language as 'ru' | 'en';

  // Tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const placement = step.placement ?? 'bottom';
    const gap = 16;
    const tooltipWidth = 320; // w-80
    const tooltipHeight = 160; // approximate
    const margin = 16; // viewport margin

    // Check if tooltip fits on the preferred side, otherwise flip
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
        return {
          top: clampY(rect.top + rect.height / 2 - tooltipHeight / 2),
          left: rect.right + PADDING + gap,
        };
      case 'left':
        return {
          top: clampY(rect.top + rect.height / 2 - tooltipHeight / 2),
          left: Math.max(margin, rect.left - PADDING - gap - tooltipWidth),
        };
      case 'top':
        return {
          top: Math.max(margin, rect.top - PADDING - gap - tooltipHeight),
          left: clampX(rect.left + rect.width / 2 - tooltipWidth / 2),
        };
      case 'bottom':
      default:
        return {
          top: rect.bottom + PADDING + gap,
          left: clampX(rect.left + rect.width / 2 - tooltipWidth / 2),
        };
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
                  x={rect.left - PADDING}
                  y={rect.top - PADDING}
                  width={rect.width + PADDING * 2}
                  height={rect.height + PADDING * 2}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0" y="0"
            width="100%" height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#guide-spotlight)"
          />
        </svg>

        {/* Glowing border around target */}
        {rect && (
          <motion.div
            key={`highlight-${state.currentStepIndex}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute rounded-lg pointer-events-none"
            style={{
              left: rect.left - PADDING,
              top: rect.top - PADDING,
              width: rect.width + PADDING * 2,
              height: rect.height + PADDING * 2,
              boxShadow: '0 0 0 2px hsl(var(--hydra-guide)), 0 0 20px hsl(var(--hydra-guide) / 0.3)',
            }}
          />
        )}

        {/* Click-through area over the target */}
        {rect && (
          <div
            className="absolute"
            style={{
              left: rect.left - PADDING,
              top: rect.top - PADDING,
              width: rect.width + PADDING * 2,
              height: rect.height + PADDING * 2,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Click backdrop to prevent interaction outside */}
        <div className="absolute inset-0" onClick={onStop} style={{ pointerEvents: 'auto' }} />

        {/* Tooltip card */}
        <motion.div
          key={`tooltip-${state.currentStepIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="absolute z-10 w-80 max-w-[calc(100vw-2rem)]"
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
              <button
                onClick={onStop}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description[lang]}
            </p>

            {/* Footer with navigation */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground font-mono">
                {state.currentStepIndex + 1} / {state.totalSteps}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrev}
                  disabled={state.currentStepIndex === 0}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={onNext}
                  className="h-7 px-3 bg-hydra-guide hover:bg-hydra-guide/90 text-white"
                >
                  {state.currentStepIndex === state.totalSteps - 1
                    ? (lang === 'ru' ? 'Готово' : 'Done')
                    : (lang === 'ru' ? 'Далее' : 'Next')
                  }
                  {state.currentStepIndex < state.totalSteps - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  )}
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
