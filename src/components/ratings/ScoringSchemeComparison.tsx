import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { computeScores, type ScoringScheme, type ScoredModel } from '@/lib/contestScoring';
import type { ContestResult } from '@/hooks/useContestSession';
import { BarChart3, Trophy, TrendingUp, Scale, Info } from 'lucide-react';

interface ScoringSchemeComparisonProps {
  results: ContestResult[];
  userWeight?: number;
  className?: string;
}

const SCHEMES: { id: ScoringScheme; icon: React.ReactNode; colorVar: string }[] = [
  { id: 'weighted-avg', icon: <Scale className="h-3 w-3" />, colorVar: '--primary' },
  { id: 'tournament', icon: <Trophy className="h-3 w-3" />, colorVar: '--hydra-expert' },
  { id: 'elo', icon: <TrendingUp className="h-3 w-3" />, colorVar: '--hydra-arbiter' },
];

const SCHEME_META: Record<ScoringScheme, { ru: string; en: string; descRu: string; descEn: string }> = {
  'weighted-avg': {
    ru: 'Средневзвеш.',
    en: 'Weighted Avg',
    descRu: 'Итоговый балл = (Пользователь × Вес) + (Арбитр × Вес)',
    descEn: 'Final = (User × Weight) + (Arbiter × Weight)',
  },
  tournament: {
    ru: 'Турнир',
    en: 'Tournament',
    descRu: 'Попарные дуэли: 3 за победу, 1 за ничью',
    descEn: 'Pairwise duels: 3 for win, 1 for draw',
  },
  elo: {
    ru: 'Эло',
    en: 'Elo',
    descRu: 'Динамический рейтинг (старт 1500, K=32)',
    descEn: 'Dynamic rating (start 1500, K=32)',
  },
};

/** Normalize score to 0–1 range for bar display */
function normalizeScores(scored: ScoredModel[]): Map<string, number> {
  const map = new Map<string, number>();
  if (!scored.length) return map;
  const min = Math.min(...scored.map(s => s.finalScore));
  const max = Math.max(...scored.map(s => s.finalScore));
  const range = max - min;
  for (const s of scored) {
    map.set(s.modelId, range < 0.01 ? 0.7 : 0.1 + 0.9 * ((s.finalScore - min) / range));
  }
  return map;
}

function formatScore(scheme: ScoringScheme, model: ScoredModel): string {
  if (scheme === 'elo') return `${model.details.eloRating}`;
  if (scheme === 'tournament') return `${model.details.tournamentPoints}pts`;
  return model.finalScore.toFixed(1);
}

/** Rank change indicator */
function RankDelta({ base, current }: { base: number; current: number }) {
  const delta = base - current; // positive = climbed
  if (delta === 0) return <span className="text-[9px] text-muted-foreground/50">—</span>;
  return (
    <span className={cn("text-[9px] font-bold", delta > 0 ? "text-[hsl(var(--hydra-success))]" : "text-destructive")}>
      {delta > 0 ? `▲${delta}` : `▼${Math.abs(delta)}`}
    </span>
  );
}

export function ScoringSchemeComparison({ results, userWeight = 50, className }: ScoringSchemeComparisonProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const allScored = useMemo(() => {
    if (!results.length) return null;
    const map: Record<ScoringScheme, ScoredModel[]> = {
      'weighted-avg': computeScores({ results, scheme: 'weighted-avg', userWeight }),
      tournament: computeScores({ results, scheme: 'tournament', userWeight }),
      elo: computeScores({ results, scheme: 'elo', userWeight }),
    };
    const hasScores = map['weighted-avg'].some(s => s.avgUser != null || s.avgArbiter != null);
    return hasScores && map['weighted-avg'].length > 0 ? map : null;
  }, [results, userWeight]);

  const normalized = useMemo(() => {
    if (!allScored) return null;
    return {
      'weighted-avg': normalizeScores(allScored['weighted-avg']),
      tournament: normalizeScores(allScored['tournament']),
      elo: normalizeScores(allScored['elo']),
    } as Record<ScoringScheme, Map<string, number>>;
  }, [allScored]);

  const baseRanks = useMemo(() => {
    if (!allScored) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const m of allScored['weighted-avg']) map.set(m.modelId, m.rank);
    return map;
  }, [allScored]);

  const modelIds = useMemo(
    () => allScored ? allScored['weighted-avg'].map(m => m.modelId) : [],
    [allScored],
  );

  const disagreements = useMemo(() => {
    if (!allScored) return new Set<string>();
    const set = new Set<string>();
    for (const modelId of modelIds) {
      const ranks = SCHEMES.map(s => {
        const m = allScored[s.id].find(m => m.modelId === modelId);
        return m?.rank ?? 0;
      });
      if (new Set(ranks).size > 1) set.add(modelId);
    }
    return set;
  }, [allScored, modelIds]);

  if (!allScored || !normalized || modelIds.length === 0) return null;

  return (
    <div className={cn("rounded-lg border border-border/40 overflow-hidden", className)}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2">
        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isRu ? 'Сравнение схем оценки' : 'Scoring Schemes Comparison'}
        </span>
        {disagreements.size > 0 && (
          <Badge variant="secondary" className="text-[10px] ml-auto gap-1">
            <Info className="h-2.5 w-2.5" />
            {isRu
              ? `${disagreements.size} расхождени${disagreements.size === 1 ? 'е' : 'й'}`
              : `${disagreements.size} disagreement${disagreements.size > 1 ? 's' : ''}`}
          </Badge>
        )}
      </div>

      {/* Scheme labels row */}
      <div className="px-3 pt-2 pb-1 flex items-center gap-2">
        <div className="w-[120px] shrink-0" />
        <div className="flex-1 grid grid-cols-3 gap-2">
          {SCHEMES.map(s => {
            const meta = SCHEME_META[s.id];
            return (
              <TooltipProvider key={s.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                      <span style={{ color: `hsl(var(${s.colorVar}))` }}>{s.icon}</span>
                      {isRu ? meta.ru : meta.en}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                    {isRu ? meta.descRu : meta.descEn}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {/* Rows per model */}
      <div className="px-3 pb-2 space-y-1.5">
        {modelIds.map(modelId => {
          const entry = getModelRegistryEntry(modelId);
          const shortName = entry?.displayName || modelId.split('/').pop() || modelId;
          const ProviderLogo = entry?.provider ? PROVIDER_LOGOS[entry.provider] : undefined;
          const color = entry?.provider ? PROVIDER_COLORS[entry.provider] : '';
          const hasDisagreement = disagreements.has(modelId);

          return (
            <div
              key={modelId}
              className={cn(
                "flex items-center gap-2 py-1 px-1.5 rounded-md transition-colors",
                hasDisagreement && "bg-accent/30 ring-1 ring-accent/50",
              )}
            >
              {/* Model name */}
              <div className="w-[120px] shrink-0 flex items-center gap-1.5 min-w-0">
                {ProviderLogo && <ProviderLogo className={cn("h-3 w-3 shrink-0", color)} />}
                <span className="text-[11px] font-medium truncate">{shortName}</span>
              </div>

              {/* Bars grid */}
              <div className="flex-1 grid grid-cols-3 gap-2">
                {SCHEMES.map(s => {
                  const scored = allScored[s.id].find(m => m.modelId === modelId);
                  if (!scored) return <div key={s.id} />;
                  const norm = normalized[s.id].get(modelId) ?? 0;
                  const baseRank = baseRanks.get(modelId) ?? scored.rank;

                  return (
                    <div key={s.id} className="flex items-center gap-1.5">
                      {/* Rank */}
                      <span className="text-[10px] font-bold text-muted-foreground w-3 text-right shrink-0">
                        {scored.rank}
                      </span>
                      {/* Bar */}
                      <div className="flex-1 h-4 bg-muted/30 rounded-sm overflow-hidden relative">
                        <div
                          className="h-full rounded-sm transition-all duration-700 ease-out"
                          style={{
                            width: `${norm * 100}%`,
                            backgroundColor: `hsl(var(${s.colorVar}))`,
                            opacity: 0.75,
                          }}
                        />
                        <span className="absolute right-1 top-0 h-full flex items-center text-[9px] font-mono font-semibold text-foreground/80">
                          {formatScore(s.id, scored)}
                        </span>
                      </div>
                      {/* Rank delta vs baseline (only for tournament & elo) */}
                      {s.id !== 'weighted-avg' && (
                        <div className="w-4 shrink-0 flex justify-center">
                          <RankDelta base={baseRank} current={scored.rank} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend footer */}
      <div className="px-3 py-1.5 border-t border-border/20 bg-muted/10">
        <p className="text-[9px] text-muted-foreground/70 text-center">
          {isRu
            ? '▲▼ — изменение позиции относительно средневзвешенного балла • Подсветка = расхождение рейтингов между схемами'
            : '▲▼ — rank change vs weighted avg baseline • Highlight = ranking disagreement between schemes'}
        </p>
      </div>
    </div>
  );
}
