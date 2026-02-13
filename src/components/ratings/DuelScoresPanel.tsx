import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Swords, BarChart3, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCriterionLabel, getRatingsText } from './i18n';
import { ScoringSchemeComparison } from './ScoringSchemeComparison';
import type { ContestResult } from '@/hooks/useContestSession';

interface DuelScoresPanelProps {
  results: ContestResult[];
  rounds: { id: string; round_index: number }[];
  isRu: boolean;
  modelA: string;
  modelB: string;
  nameA: string;
  nameB: string;
  LogoA: React.ComponentType<{ className?: string }> | null;
  LogoB: React.ComponentType<{ className?: string }> | null;
  roundWins: { winsA: number; winsB: number; draws: number };
  arbitration?: any;
}

export function DuelScoresPanel({
  results, rounds, isRu,
  modelA, modelB, nameA, nameB, LogoA, LogoB,
  roundWins, arbitration,
}: DuelScoresPanelProps) {
  // Collect all criteria keys
  const allCriteriaKeys = [...new Set(
    results
      .filter(r => r.criteria_scores)
      .flatMap(r => Object.keys(r.criteria_scores as Record<string, number>))
  )];

  // Per-round data
  const roundData = rounds.map(round => {
    const rResults = results.filter(r => r.round_id === round.id);
    const resultA = rResults.find(r => r.model_id === modelA);
    const resultB = rResults.find(r => r.model_id === modelB);
    return {
      round,
      resultA,
      resultB,
      scoreA: resultA?.arbiter_score ?? null,
      scoreB: resultB?.arbiter_score ?? null,
      userScoreA: resultA?.user_score ?? null,
      userScoreB: resultB?.user_score ?? null,
      criteriaA: (resultA?.criteria_scores as Record<string, number>) || {},
      criteriaB: (resultB?.criteria_scores as Record<string, number>) || {},
    };
  });

  // Averages
  const judgedRounds = roundData.filter(r => r.scoreA != null && r.scoreB != null);
  const avgArbiterA = judgedRounds.length ? judgedRounds.reduce((s, r) => s + (r.scoreA ?? 0), 0) / judgedRounds.length : null;
  const avgArbiterB = judgedRounds.length ? judgedRounds.reduce((s, r) => s + (r.scoreB ?? 0), 0) / judgedRounds.length : null;

  const userJudged = roundData.filter(r => r.userScoreA != null || r.userScoreB != null);
  const avgUserA = userJudged.length ? userJudged.reduce((s, r) => s + (r.userScoreA ?? 0), 0) / userJudged.length : null;
  const avgUserB = userJudged.length ? userJudged.reduce((s, r) => s + (r.userScoreB ?? 0), 0) / userJudged.length : null;

  // Criteria averages
  const criteriaAvgA: Record<string, number> = {};
  const criteriaAvgB: Record<string, number> = {};
  for (const key of allCriteriaKeys) {
    const valsA = judgedRounds.map(r => r.criteriaA[key]).filter(v => v != null);
    const valsB = judgedRounds.map(r => r.criteriaB[key]).filter(v => v != null);
    if (valsA.length) criteriaAvgA[key] = valsA.reduce((a, b) => a + b, 0) / valsA.length;
    if (valsB.length) criteriaAvgB[key] = valsB.reduce((a, b) => a + b, 0) / valsB.length;
  }

  const winnerA = roundWins.winsA > roundWins.winsB;
  const winnerB = roundWins.winsB > roundWins.winsA;

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="rounded-lg border border-border/40 overflow-hidden">
        <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2">
          <Swords className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isRu ? 'Итоги дуэли' : 'Duel Summary'}
          </span>
          <Badge variant="outline" className="text-[10px] ml-1">
            {roundWins.winsA}W — {roundWins.draws}D — {roundWins.winsB}W
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="w-8">#</TableHead>
                <TableHead>{isRu ? 'Дуэлянт' : 'Duelist'}</TableHead>
                <TableHead className="text-center">W</TableHead>
                <TableHead className="text-center">D</TableHead>
                <TableHead className="text-center">L</TableHead>
                <TableHead className="text-center">👤</TableHead>
                <TableHead className="text-center">⚖️</TableHead>
                {allCriteriaKeys.map(key => (
                  <TableHead key={key} className="text-center text-[10px] px-1.5">
                    {getCriterionLabel(key, isRu)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Model A */}
              <TableRow className={cn("text-xs", winnerA && "bg-primary/5")}>
                <TableCell className="font-bold text-muted-foreground">1</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {LogoA && <LogoA className="h-3 w-3" />}
                    <span className="truncate max-w-[140px]">{nameA}</span>
                    {winnerA && <Trophy className="h-3 w-3 text-primary shrink-0" />}
                  </div>
                </TableCell>
                <TableCell className="text-center text-[hsl(var(--hydra-success))]">{roundWins.winsA}</TableCell>
                <TableCell className="text-center text-muted-foreground">{roundWins.draws}</TableCell>
                <TableCell className="text-center text-destructive">{roundWins.winsB}</TableCell>
                <TableCell className="text-center">{avgUserA != null ? avgUserA.toFixed(1) : '—'}</TableCell>
                <TableCell className="text-center">{avgArbiterA != null ? avgArbiterA.toFixed(1) : '—'}</TableCell>
                {allCriteriaKeys.map(key => (
                  <TableCell key={key} className="text-center text-muted-foreground px-1.5">
                    {criteriaAvgA[key] != null ? criteriaAvgA[key].toFixed(1) : '—'}
                  </TableCell>
                ))}
              </TableRow>
              {/* Model B */}
              <TableRow className={cn("text-xs", winnerB && "bg-primary/5")}>
                <TableCell className="font-bold text-muted-foreground">2</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {LogoB && <LogoB className="h-3 w-3" />}
                    <span className="truncate max-w-[140px]">{nameB}</span>
                    {winnerB && <Trophy className="h-3 w-3 text-primary shrink-0" />}
                  </div>
                </TableCell>
                <TableCell className="text-center text-[hsl(var(--hydra-success))]">{roundWins.winsB}</TableCell>
                <TableCell className="text-center text-muted-foreground">{roundWins.draws}</TableCell>
                <TableCell className="text-center text-destructive">{roundWins.winsA}</TableCell>
                <TableCell className="text-center">{avgUserB != null ? avgUserB.toFixed(1) : '—'}</TableCell>
                <TableCell className="text-center">{avgArbiterB != null ? avgArbiterB.toFixed(1) : '—'}</TableCell>
                {allCriteriaKeys.map(key => (
                  <TableCell key={key} className="text-center text-muted-foreground px-1.5">
                    {criteriaAvgB[key] != null ? criteriaAvgB[key].toFixed(1) : '—'}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Per-round breakdown */}
      <div className="rounded-lg border border-border/40 overflow-hidden">
        <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isRu ? 'По раундам' : 'Per Round'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="w-16">{getRatingsText('duelRoundN', isRu)}</TableHead>
                <TableHead className="text-center">{nameA} ⚖️</TableHead>
                <TableHead className="text-center">{nameB} ⚖️</TableHead>
                <TableHead className="text-center">{isRu ? 'Результат' : 'Result'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roundData.map(({ round, scoreA, scoreB }) => {
                const winner = scoreA != null && scoreB != null
                  ? (scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'draw')
                  : null;
                return (
                  <TableRow key={round.id} className="text-xs">
                    <TableCell className="font-medium">{round.round_index + 1}</TableCell>
                    <TableCell className={cn("text-center", winner === 'A' && "font-bold text-primary")}>
                      {scoreA != null ? scoreA.toFixed(1) : '—'}
                    </TableCell>
                    <TableCell className={cn("text-center", winner === 'B' && "font-bold text-primary")}>
                      {scoreB != null ? scoreB.toFixed(1) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {winner === 'draw' ? (
                        <Badge variant="secondary" className="text-[9px]">{getRatingsText('duelDraw', isRu)}</Badge>
                      ) : winner ? (
                        <Badge variant="default" className="text-[9px]">{winner === 'A' ? nameA : nameB}</Badge>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Scoring scheme comparison (reused from contest) */}
      <ScoringSchemeComparison
        results={results}
        userWeight={arbitration?.userWeight}
      />
    </div>
  );
}