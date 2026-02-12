import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { computeScores, type ScoringScheme, type ScoredModel } from '@/lib/contestScoring';
import type { ContestResult } from '@/hooks/useContestSession';
import { Trophy, TrendingUp, Scale } from 'lucide-react';
import { ScoringSchemeComparisonHeader } from './ScoringSchemeComparisonHeader';
import { ScoringSchemeComparisonRow } from './ScoringSchemeComparisonRow';
import { ScoringSchemeComparisonFooter } from './ScoringSchemeComparisonFooter';

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
  'weighted-avg': { ru: 'Средневзвеш.', en: 'Weighted Avg', descRu: 'Итоговый балл = (Пользователь × Вес) + (Арбитр × Вес)', descEn: 'Final = (User × Weight) + (Arbiter × Weight)' },
  tournament: { ru: 'Турнир', en: 'Tournament', descRu: 'Попарные дуэли: 3 за победу, 1 за ничью', descEn: 'Pairwise duels: 3 for win, 1 for draw' },
  elo: { ru: 'Эло', en: 'Elo', descRu: 'Динамический рейтинг (старт 1500, K=32)', descEn: 'Dynamic rating (start 1500, K=32)' },
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
      <ScoringSchemeComparisonHeader
        isRu={isRu}
        disagreementCount={disagreements.size}
        schemes={SCHEMES}
        schemeMeta={SCHEME_META}
      />

      {/* Rows per model */}
      <div className="px-3 pb-2 space-y-1.5">
        {modelIds.map(modelId => (
          <ScoringSchemeComparisonRow
            key={modelId}
            modelId={modelId}
            schemes={SCHEMES}
            allScored={allScored}
            normalized={normalized}
            baseRanks={baseRanks}
            hasDisagreement={disagreements.has(modelId)}
          />
        ))}
      </div>

      <ScoringSchemeComparisonFooter isRu={isRu} />
    </div>
  );
}
