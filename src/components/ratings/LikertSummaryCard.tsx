import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Badge } from '@/components/ui/badge';
import { Scale, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LikertClaim {
  claim: string;
  verdict: string;
  score: number;
  reasoning?: string;
}

interface LikertSummaryCardProps {
  modelId: string;
  isRu: boolean;
}

const LIKERT_LABELS: Record<number, { ru: string; en: string }> = {
  5: { ru: 'Полностью согласен', en: 'Fully agree' },
  4: { ru: 'Есть нюансы', en: 'With nuances' },
  3: { ru: 'Требует разъяснения', en: 'Needs clarification' },
  2: { ru: 'Скорее нет', en: 'Rather disagree' },
  1: { ru: 'Не согласен', en: 'Disagree' },
  0: { ru: 'Бред', en: 'Nonsense' },
};

const LIKERT_COLORS: Record<number, string> = {
  5: 'hsl(var(--success))',
  4: 'hsl(var(--primary))',
  3: 'hsl(var(--accent))',
  2: 'hsl(var(--warning))',
  1: 'hsl(var(--destructive))',
  0: 'hsl(var(--destructive))',
};

export function LikertSummaryCard({ modelId, isRu }: LikertSummaryCardProps) {
  const { user } = useAuth();
  const [allClaims, setAllClaims] = useState<LikertClaim[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchLikertData();
  }, [user, modelId]);

  const fetchLikertData = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('contest_results')
        .select('criteria_scores, session_id')
        .eq('model_id', modelId)
        .not('criteria_scores', 'is', null);

      if (error) throw error;

      const claims: LikertClaim[] = [];
      const sessionIds = new Set<string>();

      (data || []).forEach(row => {
        const scores = row.criteria_scores as any;
        if (scores?.claims && Array.isArray(scores.claims)) {
          sessionIds.add(row.session_id);
          scores.claims.forEach((c: LikertClaim) => {
            if (typeof c.score === 'number') {
              claims.push(c);
            }
          });
        }
      });

      setAllClaims(claims);
      setSessionCount(sessionIds.size);
    } catch (err) {
      console.error('Failed to fetch Likert data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || allClaims.length === 0) return null;

  // Aggregate
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
  allClaims.forEach(c => {
    const s = Math.max(0, Math.min(5, Math.round(c.score)));
    distribution[s] = (distribution[s] || 0) + 1;
  });

  const totalClaims = allClaims.length;
  const avgScore = allClaims.reduce((s, c) => s + c.score, 0) / totalClaims;
  const normalizedScore = (avgScore / 5) * 10;
  const maxCount = Math.max(...Object.values(distribution), 1);

  // Most disputed claims (score <= 2)
  const disputed = allClaims
    .filter(c => c.score <= 2)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  return (
    <HydraCard variant="default">
      <HydraCardHeader className="py-3">
        <Scale className="h-5 w-5 text-hydra-arbiter" />
        <HydraCardTitle>{isRu ? 'Сводка оценок арбитража' : 'Arbitration Assessment Summary'}</HydraCardTitle>
      </HydraCardHeader>
      <HydraCardContent>
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="gap-1.5 text-xs">
              <TrendingUp className="h-3 w-3" />
              <span>{isRu ? 'Средний балл' : 'Avg score'}: <strong>{normalizedScore.toFixed(1)}/10</strong></span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-xs">
              <span>{isRu ? 'Аргументов' : 'Claims'}: <strong>{totalClaims}</strong></span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-xs">
              <span>{isRu ? 'Сессий' : 'Sessions'}: <strong>{sessionCount}</strong></span>
            </Badge>
          </div>

          {/* Distribution */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {isRu ? 'Распределение оценок' : 'Score Distribution'}
            </p>
            {([5, 4, 3, 2, 1, 0] as const).map(score => {
              const count = distribution[score];
              const pct = (count / maxCount) * 100;
              const label = isRu ? LIKERT_LABELS[score].ru : LIKERT_LABELS[score].en;
              return (
                <div key={score} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground flex-1">{label}</span>
                    <span className="font-semibold min-w-[32px] text-right">{count} ({((count / totalClaims) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: LIKERT_COLORS[score] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Most disputed */}
          {disputed.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {isRu ? 'Спорные аргументы' : 'Disputed Arguments'}
                </p>
              </div>
              <div className="space-y-1.5 pl-2 border-l-2 border-destructive/30">
                {disputed.map((claim, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex items-start gap-2">
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 flex-shrink-0 h-fit"
                        style={{ borderColor: LIKERT_COLORS[claim.score] }}
                      >
                        <span style={{ color: LIKERT_COLORS[claim.score] }}>{claim.score}/5</span>
                      </Badge>
                      <span className="text-[11px] text-muted-foreground italic line-clamp-2 flex-1">
                        "{claim.claim}"
                      </span>
                    </div>
                    {claim.reasoning && (
                      <p className="text-[10px] text-muted-foreground/70 pl-8 line-clamp-1">{claim.reasoning}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}
