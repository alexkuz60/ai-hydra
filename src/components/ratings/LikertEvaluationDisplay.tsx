import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getRatingsText } from './i18n';

interface LikertClaim {
  claim: string;
  verdict: string;
  score: number;
  reasoning?: string;
}

interface LikertEvaluationDisplayProps {
  claims: LikertClaim[];
  isRu: boolean;
}

const LIKERT_LABELS = {
  5: { ru: 'Полностью согласен', en: 'Fully agree' },
  4: { ru: 'Согласен, но есть нюансы', en: 'Agree, but with nuances' },
  3: { ru: 'Требует разъяснения', en: 'Requires clarification' },
  2: { ru: 'Скорее нет, чем да', en: 'Rather disagree' },
  1: { ru: 'Не согласен', en: 'Disagree' },
  0: { ru: 'Бред', en: 'Nonsense' },
};

const LIKERT_COLORS = {
  5: 'hsl(var(--success))',
  4: 'hsl(var(--primary))',
  3: 'hsl(var(--accent))',
  2: 'hsl(var(--warning))',
  1: 'hsl(var(--destructive))',
  0: 'hsl(var(--destructive))',
};

export function LikertEvaluationDisplay({ claims, isRu }: LikertEvaluationDisplayProps) {
  if (!claims || claims.length === 0) return null;

  const scoreDistribution = {
    5: claims.filter(c => c.score === 5).length,
    4: claims.filter(c => c.score === 4).length,
    3: claims.filter(c => c.score === 3).length,
    2: claims.filter(c => c.score === 2).length,
    1: claims.filter(c => c.score === 1).length,
    0: claims.filter(c => c.score === 0).length,
  };

  const totalClaims = claims.length;
  const maxCount = Math.max(...Object.values(scoreDistribution), 1);

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        📊 {getRatingsText('likertArgumentAssessment', isRu)} ({totalClaims})
      </div>

      <div className="space-y-1.5">
        {([5, 4, 3, 2, 1, 0] as const).map(score => {
          const count = scoreDistribution[score];
          const label = LIKERT_LABELS[score];
          const percentage = (count / maxCount) * 100;
          const displayLabel = isRu ? label.ru : label.en;

          return (
            <div key={score} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground flex-1">{displayLabel}</span>
                <span className="font-semibold min-w-[20px] text-right">{count}</span>
              </div>
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: LIKERT_COLORS[score],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <details className="text-[10px]">
        <summary className="cursor-pointer text-primary hover:underline">
          {getRatingsText('likertShowArguments', isRu).replace('{count}', String(totalClaims))}
        </summary>
        <div className="mt-2 space-y-1.5 pl-2 border-l border-border/50">
          {claims.map((claim, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex items-start gap-2">
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 flex-shrink-0 h-fit"
                  style={{ borderColor: LIKERT_COLORS[claim.score as keyof typeof LIKERT_COLORS] }}
                >
                  <span style={{ color: LIKERT_COLORS[claim.score as keyof typeof LIKERT_COLORS] }}>
                    {claim.score}
                  </span>
                </Badge>
                <span className="text-muted-foreground italic line-clamp-2 flex-1">"{claim.claim}"</span>
              </div>
              {claim.reasoning && (
                <p className="text-[9px] text-muted-foreground/70 pl-8">{claim.reasoning}</p>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
