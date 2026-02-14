import React, { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserLikertWidgetProps {
  resultId: string;
  currentValue: number | null; // 0-5 scale
  onRate: (resultId: string, value: number) => void;
  isRu: boolean;
  isExtraRound?: boolean;
}

const LIKERT_OPTIONS = [
  { value: 5, ru: 'Отлично', en: 'Excellent', emoji: '🌟' },
  { value: 4, ru: 'Хорошо', en: 'Good', emoji: '👍' },
  { value: 3, ru: 'Нормально', en: 'Okay', emoji: '🤔' },
  { value: 2, ru: 'Слабо', en: 'Weak', emoji: '👎' },
  { value: 1, ru: 'Плохо', en: 'Poor', emoji: '😕' },
  { value: 0, ru: 'Бред', en: 'Nonsense', emoji: '🚫' },
];

/** Likert-scale user evaluation widget (0-5) — sits alongside the numeric 1-10 UserScoreWidget */
export function UserLikertWidget({ resultId, currentValue, onRate, isRu, isExtraRound }: UserLikertWidgetProps) {
  const [hover, setHover] = useState<number | null>(null);

  const accentColor = isExtraRound ? 'text-[hsl(var(--hydra-arbiter))]' : 'text-primary';
  const borderColor = isExtraRound ? 'border-[hsl(var(--hydra-arbiter))]/20' : 'border-primary/20';

  return (
    <div className={cn("pt-2 border-t space-y-1.5", borderColor)}>
      <div className="flex items-center gap-1.5">
        <ThumbsUp className={cn("h-3 w-3", accentColor)} />
        <span className={cn("text-[11px] font-medium", accentColor)}>
          {isRu ? 'Ваша оценка (Likert):' : 'Your rating (Likert):'}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {LIKERT_OPTIONS.map(opt => {
          const isActive = currentValue === opt.value;
          const isHovered = hover === opt.value;
          return (
            <button
              key={opt.value}
              className={cn(
                "px-2 py-1 rounded-md text-[11px] font-medium transition-all border flex items-center gap-1",
                isActive
                  ? "bg-primary text-primary-foreground border-primary scale-105 shadow-sm"
                  : isHovered
                    ? "bg-muted/60 text-foreground border-border/60"
                    : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50"
              )}
              onMouseEnter={() => setHover(opt.value)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onRate(resultId, opt.value)}
            >
              <span>{opt.emoji}</span>
              <span>{isRu ? opt.ru : opt.en}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {hover != null
          ? `${LIKERT_OPTIONS.find(o => o.value === hover)?.[isRu ? 'ru' : 'en']} (${hover}/5)`
          : currentValue != null
            ? (isRu
              ? `Выбрано: ${LIKERT_OPTIONS.find(o => o.value === currentValue)?.[isRu ? 'ru' : 'en']} (${currentValue}/5) — нажмите для изменения`
              : `Selected: ${LIKERT_OPTIONS.find(o => o.value === currentValue)?.[isRu ? 'ru' : 'en']} (${currentValue}/5) — click to change`)
            : (isRu ? 'Выберите качество ответа' : 'Rate response quality')
        }
      </p>
    </div>
  );
}
