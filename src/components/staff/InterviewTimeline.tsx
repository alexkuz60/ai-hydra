import React from 'react';
import { cn } from '@/lib/utils';
import { FileText, Play, Gavel, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { s } from './i18n';

type Phase = 'briefing' | 'briefed' | 'testing' | 'tested' | 'verdict' | 'completed';

interface InterviewTimelineProps {
  status: string;
  isTesting?: boolean;
  isVerdicting?: boolean;
  onPhaseClick?: (phase: 'briefing' | 'testing' | 'verdict') => void;
  activePhase?: string;
  onRestart?: () => void;
}

function getPhaseIndex(status: string, isTesting?: boolean, isVerdicting?: boolean): number {
  if (status === 'completed' || status === 'verdict') return 3;
  if (isVerdicting) return 2.5;
  if (status === 'tested') return 2;
  if (isTesting || status === 'testing') return 1.5;
  if (status === 'briefed') return 1;
  if (status === 'briefing') return 0.5;
  return 0;
}

function getFailedPhaseIndex(status: string, phaseIdx: number): number {
  if (status !== 'failed') return -1;
  if (phaseIdx >= 2) return 2;
  if (phaseIdx >= 1) return 1;
  return 0;
}

const PHASES = [
  { key: 'briefing' as const, icon: FileText, i18nKey: 'briefing' as const },
  { key: 'testing' as const, icon: Play, i18nKey: 'testsLabel' as const },
  { key: 'verdict' as const, icon: Gavel, i18nKey: 'verdict' as const },
];

export function InterviewTimeline({ status, isTesting, isVerdicting, onPhaseClick, activePhase, onRestart }: InterviewTimelineProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const phaseIdx = getPhaseIndex(status, isTesting, isVerdicting);
  const isFailed = status === 'failed';
  const failedAt = getFailedPhaseIndex(status, phaseIdx);

  return (
    <div className="flex items-center w-full px-2 py-2">
      {PHASES.map((phase, i) => {
        const phaseStart = i;
        const phaseFailed = isFailed && failedAt === i;
        const isCompleted = !isFailed && phaseIdx > phaseStart;
        const isActive = !isFailed && phaseIdx >= phaseStart && phaseIdx < phaseStart + 1;
        const isPulsing = isActive && (phaseIdx % 1 !== 0);

        return (
          <React.Fragment key={phase.key}>
            {i > 0 && (
              <TimelineConnector
                completed={!isFailed && phaseIdx >= phaseStart}
                animating={!isFailed && phaseIdx > (phaseStart - 1) && phaseIdx < phaseStart}
                failed={isFailed && failedAt >= i}
              />
            )}

            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => onPhaseClick?.(phase.key)}
                className={cn(
                  "relative flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all duration-300 cursor-pointer",
                  "hover:scale-110 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  activePhase === phase.key && "ring-2 ring-primary/40 ring-offset-1 ring-offset-background",
                  phaseFailed
                    ? "border-destructive bg-destructive/15 text-destructive"
                    : isCompleted
                      ? "border-hydra-success bg-hydra-success/15 text-hydra-success"
                      : isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted-foreground/30 bg-muted/30 text-muted-foreground/50"
                )}
              >
                {isPulsing && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                {phaseFailed ? <RotateCcw className="h-3.5 w-3.5" /> : <phase.icon className="h-3.5 w-3.5" />}
              </button>
              {phaseFailed && onRestart && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRestart(); }}
                  className="text-[8px] text-destructive hover:text-destructive/80 font-medium leading-none mt-0.5 transition-colors"
                >
                  {s('retry', isRu)}
                </button>
              )}
              {!phaseFailed && (
                <span className={cn(
                  "text-[9px] font-medium leading-none",
                  phaseFailed ? "text-destructive"
                    : isCompleted ? "text-hydra-success"
                    : isActive ? "text-primary"
                    : "text-muted-foreground/50"
                )}>
                  {s(phase.i18nKey, isRu)}
                </span>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TimelineConnector({ completed, animating, failed }: { completed: boolean; animating: boolean; failed: boolean }) {
  if (completed) {
    return <div className="flex-1 mx-1"><div className="h-[2px] bg-hydra-success rounded-full" /></div>;
  }
  if (animating) {
    return (
      <div className="flex-1 mx-1 overflow-hidden">
        <motion.div
          className="h-[2px] rounded-full"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--primary)) 0px, hsl(var(--primary)) 6px, transparent 6px, transparent 12px)', backgroundSize: '200% 100%' }}
          animate={{ backgroundPositionX: ['0%', '-100%'] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }
  if (failed) {
    return <div className="flex-1 mx-1"><div className="h-[2px]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--hydra-critical)) 0px, hsl(var(--hydra-critical)) 6px, transparent 6px, transparent 12px)' }} /></div>;
  }
  return <div className="flex-1 mx-1"><div className="h-[2px]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--muted-foreground) / 0.3) 0px, hsl(var(--muted-foreground) / 0.3) 6px, transparent 6px, transparent 12px)' }} /></div>;
}
