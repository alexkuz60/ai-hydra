import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserScoreWidgetProps {
  resultId: string;
  currentScore: number | null;
  onScore: (resultId: string, score: number) => void;
  isRu: boolean;
  isExtraRound?: boolean;
}

/** Inline scoring widget for user evaluation — always editable */
export function UserScoreWidget({ resultId, currentScore, onScore, isRu, isExtraRound }: UserScoreWidgetProps) {
  const [hover, setHover] = useState<number | null>(null);

  const accentColor = isExtraRound ? 'text-[hsl(var(--hydra-arbiter))]' : 'text-primary';
  const borderColor = isExtraRound ? 'border-[hsl(var(--hydra-arbiter))]/20' : 'border-primary/20';

  return (
    <div className={cn("pt-2 border-t space-y-1.5", borderColor)}>
      <div className="flex items-center gap-1.5">
        <Star className={cn("h-3 w-3", accentColor)} />
        <span className={cn("text-[11px] font-medium", accentColor)}>
          {isRu ? 'Ваша оценка:' : 'Your score:'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(score => {
          const isActive = hover != null ? hover >= score : (currentScore ?? 0) >= score;
          return (
            <button
              key={score}
              className={cn(
                "w-7 h-7 rounded-md text-[11px] font-semibold transition-all border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary scale-105"
                  : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"
              )}
              onMouseEnter={() => setHover(score)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onScore(resultId, score)}
            >
              {score}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {hover
          ? (isRu ? `Оценка: ${hover}/10` : `Score: ${hover}/10`)
          : currentScore != null
            ? (isRu ? `Текущая: ${currentScore}/10 — нажмите для изменения` : `Current: ${currentScore}/10 — click to change`)
            : (isRu ? 'Нажмите для оценки от 1 до 10' : 'Click to rate 1-10')
        }
      </p>
    </div>
  );
}
