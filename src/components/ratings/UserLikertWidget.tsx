import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserLikertWidgetProps {
  resultId: string;
  currentValue: number | null;
  onRate: (resultId: string, value: number) => void;
  isRu: boolean;
  isExtraRound?: boolean;
  compact?: boolean;
}

const LIKERT_OPTIONS = [
  { value: 5, ru: 'Отлично', en: 'Excellent', emoji: '🌟' },
  { value: 4, ru: 'Хорошо', en: 'Good', emoji: '👍' },
  { value: 3, ru: 'Нормально', en: 'Okay', emoji: '🤔' },
  { value: 2, ru: 'Слабо', en: 'Weak', emoji: '👎' },
  { value: 1, ru: 'Плохо', en: 'Poor', emoji: '😕' },
  { value: 0, ru: 'Бред', en: 'Nonsense', emoji: '😱' },
];

export function UserLikertWidget({ resultId, currentValue, onRate, isRu, isExtraRound, compact }: UserLikertWidgetProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-0.5">
        {LIKERT_OPTIONS.map(opt => {
          const isActive = currentValue === opt.value;
          const label = isRu ? opt.ru : opt.en;
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "p-1 rounded transition-all text-base leading-none",
                    isActive
                      ? "bg-primary/20 scale-110 ring-1 ring-primary"
                      : "hover:bg-muted/50 opacity-60 hover:opacity-100"
                  )}
                  onClick={() => onRate(resultId, opt.value)}
                >
                  {opt.emoji}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {label} ({opt.value}/5)
              </TooltipContent>
            </Tooltip>
          );
        })}
        {currentValue != null && (
          <span className="text-[10px] text-muted-foreground ml-1">{currentValue}/5</span>
        )}
      </div>
    </TooltipProvider>
  );
}
