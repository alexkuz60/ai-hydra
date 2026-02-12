import React from 'react';
import { Crown, BarChart3 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import type { ContestResult } from '@/hooks/useContestSession';

interface ContestScoresTableProps {
  results: ContestResult[];
  rounds: { id: string; round_index: number }[];
  isRu: boolean;
  selectedWinners: Set<string>;
  onToggleWinner: (modelId: string) => void;
}

export function ContestScoresTable({ results, rounds, isRu, selectedWinners, onToggleWinner }: ContestScoresTableProps) {
  const modelIds = [...new Set(results.map(r => r.model_id))];

  const aggregated = modelIds.map(modelId => {
    const modelResults = results.filter(r => r.model_id === modelId);
    const userScores = modelResults.filter(r => r.user_score != null).map(r => r.user_score!);
    const arbiterScores = modelResults.filter(r => r.arbiter_score != null).map(r => r.arbiter_score!);
    const avgUser = userScores.length ? userScores.reduce((a, b) => a + b, 0) / userScores.length : null;
    const avgArbiter = arbiterScores.length ? arbiterScores.reduce((a, b) => a + b, 0) / arbiterScores.length : null;
    const totalScore = (avgUser ?? 0) + (avgArbiter ?? 0) || null;
    return { modelId, avgUser, avgArbiter, totalScore, responseCount: modelResults.length };
  }).sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));

  return (
    <div className="rounded-lg border border-border/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2">
        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isRu ? 'Таблица оценок' : 'Scores Table'}
        </span>
        {selectedWinners.size > 0 && (
          <Badge variant="secondary" className="ml-auto text-[10px] gap-1 bg-primary/10 text-primary">
            <Crown className="h-2.5 w-2.5" />
            {selectedWinners.size} {isRu ? 'выбрано' : 'selected'}
          </Badge>
        )}
      </div>
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
            <TableHead className="text-center">{isRu ? 'Итого' : 'Total'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aggregated.map((row, i) => {
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
                <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {ProviderLogo && <ProviderLogo className={cn("h-3 w-3", color)} />}
                    <span className="truncate max-w-[140px]">{shortName}</span>
                    {isSelected && <Crown className="h-3 w-3 text-hydra-arbiter shrink-0" />}
                  </div>
                </TableCell>
                <TableCell className="text-center">{row.avgUser != null ? row.avgUser.toFixed(1) : '—'}</TableCell>
                <TableCell className="text-center">{row.avgArbiter != null ? row.avgArbiter.toFixed(1) : '—'}</TableCell>
                <TableCell className="text-center font-semibold">{row.totalScore != null ? row.totalScore.toFixed(1) : '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        {aggregated.length > 1 && (
          <TableFooter>
            <TableRow className="text-[10px]">
              <TableCell colSpan={3} className="text-right font-medium">{isRu ? 'Среднее' : 'Average'}</TableCell>
              <TableCell className="text-center">
                {(() => { const s = aggregated.filter(r => r.avgUser != null).map(r => r.avgUser!); return s.length ? (s.reduce((a, b) => a + b, 0) / s.length).toFixed(1) : '—'; })()}
              </TableCell>
              <TableCell className="text-center">
                {(() => { const s = aggregated.filter(r => r.avgArbiter != null).map(r => r.avgArbiter!); return s.length ? (s.reduce((a, b) => a + b, 0) / s.length).toFixed(1) : '—'; })()}
              </TableCell>
              <TableCell className="text-center font-semibold">
                {(() => { const s = aggregated.filter(r => r.totalScore != null).map(r => r.totalScore!); return s.length ? (s.reduce((a, b) => a + b, 0) / s.length).toFixed(1) : '—'; })()}
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
