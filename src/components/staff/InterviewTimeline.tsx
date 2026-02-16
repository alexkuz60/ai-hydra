import React from 'react';
import { cn } from '@/lib/utils';
import { FileText, Play, Gavel } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

type Phase = 'briefing' | 'briefed' | 'testing' | 'tested' | 'verdict' | 'completed';

interface InterviewTimelineProps {
  status: string;
  /** true while SSE tests are streaming */
  isTesting?: boolean;
  /** true while verdict is being generated */
  isVerdicting?: boolean;
}

/** Map session status to a numeric phase index: 0=briefing, 1=testing, 2=verdict */
function getPhaseIndex(status: string, isTesting?: boolean, isVerdicting?: boolean): number {
  if (status === 'completed' || status === 'verdict') return 3; // all done or on verdict
  if (isVerdicting) return 2.5; // animating to verdict
  if (status === 'tested') return 2; // testing complete
  if (isTesting || status === 'testing') return 1.5; // animating to testing complete
  if (status === 'briefed') return 1; // briefing complete
  if (status === 'briefing') return 0.5; // animating briefing
  return 0; // initial
}

/** Determine which phase failed based on status and phase index */
function getFailedPhaseIndex(status: string, phaseIdx: number): number {
  if (status !== 'failed') return -1;
  // If failed during or after verdict phase
  if (phaseIdx >= 2) return 2;
  // If failed during or after testing phase
  if (phaseIdx >= 1) return 1;
  // Failed during briefing
  return 0;
}

const PHASES = [
  { key: 'briefing', icon: FileText, labelRu: 'Брифинг', labelEn: 'Briefing' },
  { key: 'testing', icon: Play, labelRu: 'Тесты', labelEn: 'Tests' },
  { key: 'verdict', icon: Gavel, labelRu: 'Вердикт', labelEn: 'Verdict' },
] as const;

export function InterviewTimeline({ status, isTesting, isVerdicting }: InterviewTimelineProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const phaseIdx = getPhaseIndex(status, isTesting, isVerdicting);
  const isFailed = status === 'failed';
  const failedAt = getFailedPhaseIndex(status, phaseIdx);

  return (
    <div className="flex items-center w-full px-2 py-2">
      {PHASES.map((phase, i) => {
        const phaseStart = i; // 0, 1, 2
        const phaseFailed = isFailed && failedAt === i;
        const isCompleted = !isFailed && phaseIdx > phaseStart;
        const isActive = !isFailed && phaseIdx >= phaseStart && phaseIdx < phaseStart + 1;
        const isPulsing = isActive && (phaseIdx % 1 !== 0); // fractional = in progress

        return (
          <React.Fragment key={phase.key}>
            {/* Connector line before this phase (not for first) */}
            {i > 0 && (
              <TimelineConnector
                completed={!isFailed && phaseIdx >= phaseStart}
                animating={!isFailed && phaseIdx > (phaseStart - 1) && phaseIdx < phaseStart}
                failed={isFailed && failedAt >= i}
              />
            )}

            {/* Phase icon */}
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div
                className={cn(
                  "relative flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors duration-300",
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
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.7, 0, 0.7],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
                <phase.icon className="h-3.5 w-3.5" />
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium leading-none",
                  phaseFailed
                    ? "text-destructive"
                    : isCompleted
                      ? "text-hydra-success"
                      : isActive
                        ? "text-primary"
                        : "text-muted-foreground/50"
                )}
              >
                {isRu ? phase.labelRu : phase.labelEn}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** Line between two phase circles */
function TimelineConnector({
  completed,
  animating,
  failed,
}: {
  completed: boolean;
  animating: boolean;
  failed: boolean;
}) {
  if (completed) {
    // Solid line
    return (
      <div className="flex-1 mx-1">
        <div className="h-[2px] bg-hydra-success rounded-full" />
      </div>
    );
  }

  if (animating) {
    // Animated dashed line (running)
    return (
      <div className="flex-1 mx-1 overflow-hidden">
        <motion.div
          className="h-[2px] rounded-full"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--primary)) 0px, hsl(var(--primary)) 6px, transparent 6px, transparent 12px)',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPositionX: ['0%', '-100%'],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    );
  }

  if (failed) {
    // Red dashed
    return (
      <div className="flex-1 mx-1">
        <div
          className="h-[2px]"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--hydra-critical)) 0px, hsl(var(--hydra-critical)) 6px, transparent 6px, transparent 12px)',
          }}
        />
      </div>
    );
  }

  // Inactive dashed (muted)
  return (
    <div className="flex-1 mx-1">
      <div
        className="h-[2px]"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--muted-foreground) / 0.3) 0px, hsl(var(--muted-foreground) / 0.3) 6px, transparent 6px, transparent 12px)',
        }}
      />
    </div>
  );
}
