import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getRatingsText, type RatingsI18nKey } from '@/components/ratings/i18n';

interface UserLikertWidgetProps {
  resultId: string;
  currentValue: number | null;
  onRate: (resultId: string, value: number) => void;
  isRu: boolean;
  isExtraRound?: boolean;
  compact?: boolean;
}

const LIKERT_OPTIONS: { value: number; i18nKey: RatingsI18nKey; emoji: string }[] = [
  { value: 5, i18nKey: 'likertExcellent', emoji: '🌟' },
  { value: 4, i18nKey: 'likertGood', emoji: '👍' },
  { value: 3, i18nKey: 'likertOkay', emoji: '🤔' },
  { value: 2, i18nKey: 'likertWeak', emoji: '👎' },
  { value: 1, i18nKey: 'likertPoor', emoji: '😕' },
  { value: 0, i18nKey: 'likertNonsense', emoji: '😱' },
];

export function UserLikertWidget({ resultId, currentValue, onRate, isRu, isExtraRound, compact }: UserLikertWidgetProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-0.5">
        {LIKERT_OPTIONS.map(opt => {
          const isActive = currentValue === opt.value;
          const label = getRatingsText(opt.i18nKey, isRu);
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
