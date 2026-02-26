import React from 'react';
import { cn } from '@/lib/utils';
import { Eye, Target, Landmark, RotateCcw, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type ConceptPhase = 'visionary' | 'strategist' | 'patent';
export type PipelineStatus = 'idle' | 'running' | 'completed' | 'failed';

interface ConceptPipelineTimelineProps {
  /** Which phase is currently active/running */
  activePhase: ConceptPhase | null;
  /** Status of each phase */
  phaseStatuses: Record<ConceptPhase, 'idle' | 'running' | 'done' | 'failed'>;
  /** Whether concept/goal field is filled */
  hasConceptFilled?: boolean;
  /** Whether patent step is included */
  includePatent?: boolean;
  /** Click handler for individual phase */
  onPhaseClick?: (phase: ConceptPhase) => void;
  /** Restart handler */
  onRestart?: () => void;
}

/** Check if a phase's prerequisites are met */
function isPhaseUnlocked(phase: ConceptPhase, statuses: Record<ConceptPhase, 'idle' | 'running' | 'done' | 'failed'>): boolean {
  if (phase === 'visionary') return true;
  if (phase === 'strategist') return statuses.visionary === 'done';
  if (phase === 'patent') return statuses.visionary === 'done' && statuses.strategist === 'done';
  return false;
}

/** Get tooltip text for locked phases */
function getLockedTooltip(phase: ConceptPhase, isRu: boolean): string {
  if (phase === 'strategist') return isRu ? 'Сначала выполните анализ Визионера' : 'Complete Visionary analysis first';
  if (phase === 'patent') return isRu ? 'Сначала выполните анализ Стратега' : 'Complete Strategist analysis first';
  return '';
}

const PHASES: { key: ConceptPhase; icon: React.ElementType; labelRu: string; labelEn: string; colorVar: string }[] = [
  { key: 'visionary', icon: Eye, labelRu: 'Визионер', labelEn: 'Visionary', colorVar: 'hydra-visionary' },
  { key: 'strategist', icon: Target, labelRu: 'Стратег', labelEn: 'Strategist', colorVar: 'hydra-strategist' },
  { key: 'patent', icon: Landmark, labelRu: 'Патентовед', labelEn: 'Patent', colorVar: 'hydra-patent' },
];

export function ConceptPipelineTimeline({ activePhase, phaseStatuses, hasConceptFilled = false, includePatent = true, onPhaseClick, onRestart }: ConceptPipelineTimelineProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const visiblePhases = includePatent ? PHASES : PHASES.filter(p => p.key !== 'patent');

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center w-full px-1 py-2">
        {/* Step 0: Concept indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300",
                  hasConceptFilled
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-muted-foreground/30 bg-muted/30 text-muted-foreground/50"
                )}
              >
                <Lightbulb className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium leading-none",
                  hasConceptFilled ? "text-primary" : "text-muted-foreground/50"
                )}
              >
                {isRu ? 'Концепт' : 'Concept'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {hasConceptFilled
              ? (isRu ? 'Концепция заполнена' : 'Concept filled')
              : (isRu ? 'Заполните поле концепции для запуска анализа' : 'Fill in the concept field to start analysis')}
          </TooltipContent>
        </Tooltip>

        {/* Connector from concept to first expert */}
        <PipelineConnector
          completed={hasConceptFilled}
          animating={false}
          failed={false}
          colorVar="primary"
        />

        {visiblePhases.map((phase, i) => {
          const status = phaseStatuses[phase.key];
          const isCompleted = status === 'done';
          const isActive = status === 'running';
          const isFailed = status === 'failed';
          const isLocked = !isPhaseUnlocked(phase.key, phaseStatuses);
          const lockedTip = isLocked ? getLockedTooltip(phase.key, isRu) : '';

          const phaseNode = (
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => !isLocked && onPhaseClick?.(phase.key)}
                disabled={isLocked}
                className={cn(
                  "relative flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300",
                  isLocked ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:scale-110 hover:shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  activePhase === phase.key && "ring-2 ring-offset-1 ring-offset-background",
                  isFailed
                    ? "border-destructive bg-destructive/15 text-destructive"
                    : isCompleted
                      ? `border-hydra-${phase.colorVar.replace('hydra-', '')} bg-hydra-${phase.colorVar.replace('hydra-', '')}/15 text-hydra-${phase.colorVar.replace('hydra-', '')}`
                      : isActive
                        ? `border-hydra-${phase.colorVar.replace('hydra-', '')} bg-hydra-${phase.colorVar.replace('hydra-', '')}/10 text-hydra-${phase.colorVar.replace('hydra-', '')}`
                        : "border-muted-foreground/30 bg-muted/30 text-muted-foreground/50"
                )}
                style={
                  (isCompleted || isActive) ? {
                    borderColor: `hsl(var(--${phase.colorVar}))`,
                    color: `hsl(var(--${phase.colorVar}))`,
                    backgroundColor: `hsl(var(--${phase.colorVar}) / ${isCompleted ? 0.15 : 0.1})`,
                  } : undefined
                }
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: `hsl(var(--${phase.colorVar}))` }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                {isFailed ? <RotateCcw className="h-4 w-4" /> : <phase.icon className="h-4 w-4" />}
              </button>
              {isFailed && onRestart && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRestart(); }}
                  className="text-[10px] text-destructive hover:text-destructive/80 font-medium leading-none mt-0.5 transition-colors"
                >
                  {isRu ? 'Повтор' : 'Retry'}
                </button>
              )}
              {!isFailed && (
                <span
                  className={cn(
                    "text-[11px] font-medium leading-none",
                    isCompleted || isActive ? '' : 'text-muted-foreground/50'
                  )}
                  style={(isCompleted || isActive) ? { color: `hsl(var(--${phase.colorVar}))` } : undefined}
                >
                  {isRu ? phase.labelRu : phase.labelEn}
                </span>
              )}
            </div>
          );

          return (
            <React.Fragment key={phase.key}>
              {i > 0 && (
                <PipelineConnector
                  completed={isCompleted || (visiblePhases.findIndex(p => p.key === activePhase) > i - 1 && phaseStatuses[visiblePhases[i - 1].key] === 'done')}
                  animating={isActive}
                  failed={isFailed}
                  colorVar={phase.colorVar}
                />
              )}

              {isLocked ? (
                <Tooltip>
                  <TooltipTrigger asChild>{phaseNode}</TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">{lockedTip}</TooltipContent>
                </Tooltip>
              ) : phaseNode}
            </React.Fragment>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

function PipelineConnector({ completed, animating, failed, colorVar }: { completed: boolean; animating: boolean; failed: boolean; colorVar: string }) {
  if (completed) {
    return (
      <div className="flex-1 mx-1">
        <div className="h-[2px] rounded-full" style={{ backgroundColor: `hsl(var(--${colorVar}))` }} />
      </div>
    );
  }
  if (animating) {
    return (
      <div className="flex-1 mx-1 overflow-hidden">
        <motion.div
          className="h-[2px] rounded-full"
          style={{ backgroundImage: `repeating-linear-gradient(90deg, hsl(var(--${colorVar})) 0px, hsl(var(--${colorVar})) 6px, transparent 6px, transparent 12px)`, backgroundSize: '200% 100%' }}
          animate={{ backgroundPositionX: ['0%', '-100%'] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }
  if (failed) {
    return (
      <div className="flex-1 mx-1">
        <div className="h-[2px]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--destructive)) 0px, hsl(var(--destructive)) 6px, transparent 6px, transparent 12px)' }} />
      </div>
    );
  }
  return (
    <div className="flex-1 mx-1">
      <div className="h-[2px]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--muted-foreground) / 0.3) 0px, hsl(var(--muted-foreground) / 0.3) 6px, transparent 6px, transparent 12px)' }} />
    </div>
  );
}