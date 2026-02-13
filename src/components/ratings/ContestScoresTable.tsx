import React from 'react';
import { Crown, BarChart3 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { getCriterionLabel } from './i18n';
import { computeScores, collectCriteriaKeys, type ScoringScheme, type ScoredModel } from '@/lib/contestScoring';
import type { ContestResult } from '@/hooks/useContestSession';

interface ContestScoresTableProps {
  results: ContestResult[];
  rounds: { id: string; round_index: number }[];
  isRu: boolean;
  selectedWinners: Set<string>;
  onToggleWinner: (modelId: string) => void;
  arbitration?: { userWeight?: number; scoringScheme?: ScoringScheme };
}

const SCHEME_LABELS: Record<ScoringScheme, { ru: string; en: string }> = {
  'weighted-avg': { ru: 'Средневзвеш.', en: 'W.Avg' },
  'tournament': { ru: 'Очки', en: 'Points' },
  'elo': { ru: 'Эло', en: 'Elo' },
};

export function ContestScoresTable({ results, rounds, isRu, selectedWinners, onToggleWinner, arbitration }: ContestScoresTableProps) {
  const scheme: ScoringScheme = arbitration?.scoringScheme || 'weighted-avg';
  const userWeight = arbitration?.userWeight ?? 50;

  // Deduplicate results: keep one per (round_id, model_id), prefer 'judged' status
  const deduped = React.useMemo(() => {
    const map = new Map<string, ContestResult>();
    for (const r of results) {
      const key = `${r.round_id}__${r.model_id}`;
      const existing = map.get(key);
      if (!existing || (r.status === 'judged' && existing.status !== 'judged')) {
        map.set(key, r);
      }
    }
    return [...map.values()];
  }, [results]);

  const scored = computeScores({ results: deduped, scheme, userWeight });
  const allCriteriaKeys = collectCriteriaKeys(deduped);
  const hasCriteria = allCriteriaKeys.length > 0;
  const isTournament = scheme === 'tournament';
  const isElo = scheme === 'elo';

  // Build per-round scores for each model
  const sortedRounds = React.useMemo(() =>
    [...rounds].sort((a, b) => a.round_index - b.round_index), [rounds]);

  const roundScoreMap = React.useMemo(() => {
    const map = new Map<string, Map<string, { user: number | null; arbiter: number | null }>>();
    for (const r of deduped) {
      if (!map.has(r.model_id)) map.set(r.model_id, new Map());
      map.get(r.model_id)!.set(r.round_id, {
        user: r.user_score ?? null,
        arbiter: r.arbiter_score ?? null,
      });
    }
    return map;
  }, [deduped]);

  const showRoundCols = sortedRounds.length > 1;

  const formatFinal = (m: ScoredModel) => {
    if (isElo) return `${m.details.eloRating}`;
    if (isTournament) return `${m.details.tournamentPoints}`;
    return m.finalScore.toFixed(1);
  };

  const schemeLabel = isRu ? SCHEME_LABELS[scheme].ru : SCHEME_LABELS[scheme].en;

  return (
    <div className="rounded-lg border border-border/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2">
        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isRu ? 'Таблица оценок' : 'Scores Table'}
        </span>
        <Badge variant="outline" className="text-[10px] ml-1">{schemeLabel}</Badge>
        {selectedWinners.size > 0 && (
          <Badge variant="secondary" className="ml-auto text-[10px] gap-1 bg-primary/10 text-primary">
            <Crown className="h-2.5 w-2.5" />
            {selectedWinners.size} {isRu ? 'выбрано' : 'selected'}
          </Badge>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-[11px]">
              <TableHead className="w-8">
                <Crown className="h-3 w-3 text-primary mx-auto" />
              </TableHead>
              <TableHead className="w-8">#</TableHead>
              <TableHead>{isRu ? 'Модель' : 'Model'}</TableHead>
              <TableHead className="text-center">👤</TableHead>
              <TableHead className="text-center">⚖️</TableHead>
              {isTournament && (
                <>
                  <TableHead className="text-center text-[10px]">W</TableHead>
                  <TableHead className="text-center text-[10px]">D</TableHead>
                  <TableHead className="text-center text-[10px]">L</TableHead>
                </>
              )}
              {showRoundCols && sortedRounds.map(r => (
                <TableHead key={r.id} className="text-center text-[10px] px-1">
                  R{r.round_index + 1}
                </TableHead>
              ))}
              {hasCriteria && allCriteriaKeys.map(key => (
                <TableHead key={key} className="text-center text-[10px] px-1.5">
                  {getCriterionLabel(key, isRu)}
                </TableHead>
              ))}
              <TableHead className="text-center">{schemeLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scored.map((row) => {
              const entry = getModelRegistryEntry(row.modelId);
              const shortName = entry?.displayName || row.modelId.split('/').pop() || row.modelId;
              const ProviderLogo = entry?.provider ? PROVIDER_LOGOS[entry.provider] : undefined;
              const color = entry?.provider ? PROVIDER_COLORS[entry.provider] : '';
              const isSelected = selectedWinners.has(row.modelId);

              return (
                <TableRow
                  key={row.modelId}
                  className={cn("text-xs cursor-pointer transition-colors", isSelected && "bg-primary/5")}
                  onClick={() => onToggleWinner(row.modelId)}
                >
                  <TableCell className="text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleWinner(row.modelId)}
                      onClick={e => e.stopPropagation()}
                      className="h-3.5 w-3.5"
                    />
                  </TableCell>
                  <TableCell className="font-bold text-muted-foreground">{row.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {ProviderLogo && <ProviderLogo className={cn("h-3 w-3", color)} />}
                      <span className="truncate max-w-[140px]">{shortName}</span>
                      {isSelected && <Crown className="h-3 w-3 text-hydra-arbiter shrink-0" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{row.avgUser != null ? row.avgUser.toFixed(1) : '—'}</TableCell>
                  <TableCell className="text-center">{row.avgArbiter != null ? row.avgArbiter.toFixed(1) : '—'}</TableCell>
                  {isTournament && (
                    <>
                      <TableCell className="text-center text-[hsl(var(--hydra-success))]">{row.details.wins}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{row.details.draws}</TableCell>
                      <TableCell className="text-center text-destructive">{row.details.losses}</TableCell>
                    </>
                  )}
                  {showRoundCols && sortedRounds.map(r => {
                    const rs = roundScoreMap.get(row.modelId)?.get(r.id);
                    const val = rs ? (rs.arbiter ?? rs.user) : null;
                    return (
                      <TableCell key={r.id} className="text-center text-muted-foreground px-1 text-[10px]">
                        {val != null ? val.toFixed(1) : '—'}
                      </TableCell>
                    );
                  })}
                  {hasCriteria && allCriteriaKeys.map(key => (
                    <TableCell key={key} className="text-center text-muted-foreground px-1.5">
                      {row.criteriaAvg[key] != null ? row.criteriaAvg[key]!.toFixed(1) : '—'}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-semibold">{formatFinal(row)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          {scored.length > 1 && (
            <TableFooter>
              <TableRow className="text-[10px]">
                <TableCell colSpan={3} className="text-right font-medium">{isRu ? 'Среднее' : 'Average'}</TableCell>
                <TableCell className="text-center">
                  {(() => { const s = scored.filter(r => r.avgUser != null).map(r => r.avgUser!); return s.length ? (s.reduce((a, b) => a + b, 0) / s.length).toFixed(1) : '—'; })()}
                </TableCell>
                <TableCell className="text-center">
                  {(() => { const s = scored.filter(r => r.avgArbiter != null).map(r => r.avgArbiter!); return s.length ? (s.reduce((a, b) => a + b, 0) / s.length).toFixed(1) : '—'; })()}
                </TableCell>
                {isTournament && (
                  <>
                    <TableCell className="text-center" />
                    <TableCell className="text-center" />
                    <TableCell className="text-center" />
                  </>
                )}
                {hasCriteria && allCriteriaKeys.map(key => (
                  <TableCell key={key} className="text-center px-1.5">
                    {(() => {
                      const s = scored.filter(r => r.criteriaAvg[key] != null).map(r => r.criteriaAvg[key]!);
                      return s.length ? (s.reduce((a, b) => a + b, 0) / s.length).toFixed(1) : '—';
                    })()}
                  </TableCell>
                ))}
                <TableCell className="text-center font-semibold">
                  {(() => { const s = scored.map(r => r.finalScore); return s.length ? (s.reduce((a, b) => a + b, 0) / s.length).toFixed(isElo ? 0 : 1) : '—'; })()}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
