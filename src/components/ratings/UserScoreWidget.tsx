import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserScoreWidgetProps {
  resultId: string;
  currentScore: number | null;
  onScore: (resultId: string, score: number) => void;
  isRu: boolean;
  isExtraRound?: boolean;
}

/** Inline brain-icon scoring widget matching the chat expert panel style */
export function UserScoreWidget({ resultId, currentScore, onScore, isRu, isExtraRound }: UserScoreWidgetProps) {
  return (
    <div className="flex items-center gap-0.5">
      <span className="text-xs text-muted-foreground mr-1 shrink-0">
        {isRu ? 'Рейтинг:' : 'Rating:'}
      </span>
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          onClick={() => onScore(resultId, i)}
          className={cn(
            "p-0.5 transition-all hover:scale-125",
            i <= (currentScore ?? -1)
              ? isExtraRound ? "text-[hsl(var(--hydra-arbiter))]" : "text-primary"
              : "text-muted-foreground/30"
          )}
          title={`${i}/10`}
        >
          <Brain className="h-4 w-4" />
        </button>
      ))}
      <span className="ml-2 text-xs text-muted-foreground font-medium">
        {currentScore ?? 0}/10
      </span>
    </div>
  );
}
