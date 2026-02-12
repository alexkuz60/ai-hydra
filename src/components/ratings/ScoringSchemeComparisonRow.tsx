import React from 'react';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import type { ScoringScheme, ScoredModel } from '@/lib/contestScoring';

interface ScoringSchemeComparisonRowProps {
  modelId: string;
  schemes: Array<{ id: ScoringScheme; colorVar: string }>;
  allScored: Record<ScoringScheme, ScoredModel[]>;
  normalized: Record<ScoringScheme, Map<string, number>>;
  baseRanks: Map<string, number>;
  hasDisagreement: boolean;
}

function RankDelta({ base, current }: { base: number; current: number }) {
  const delta = base - current;
  if (delta === 0) return <span className="text-[9px] text-muted-foreground/50">—</span>;
  return (
    <span className={cn("text-[9px] font-bold", delta > 0 ? "text-[hsl(var(--hydra-success))]" : "text-destructive")}>
      {delta > 0 ? `▲${delta}` : `▼${Math.abs(delta)}`}
    </span>
  );
}

function formatScore(scheme: ScoringScheme, model: ScoredModel): string {
  if (scheme === 'elo') return `${model.details.eloRating}`;
  if (scheme === 'tournament') return `${model.details.tournamentPoints}pts`;
  return model.finalScore.toFixed(1);
}

export function ScoringSchemeComparisonRow({
  modelId,
  schemes,
  allScored,
  normalized,
  baseRanks,
  hasDisagreement,
}: ScoringSchemeComparisonRowProps) {
  const entry = getModelRegistryEntry(modelId);
  const shortName = entry?.displayName || modelId.split('/').pop() || modelId;
  const ProviderLogo = entry?.provider ? PROVIDER_LOGOS[entry.provider] : undefined;
  const color = entry?.provider ? PROVIDER_COLORS[entry.provider] : '';

  return (
    <div
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
        {schemes.map(s => {
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
}
