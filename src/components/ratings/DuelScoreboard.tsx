import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRatingsText } from './i18n';

interface DuelScoreboardProps {
  nameA: string;
  nameB: string;
  LogoA: React.ComponentType<{ className?: string }> | null;
  LogoB: React.ComponentType<{ className?: string }> | null;
  winsA: number;
  winsB: number;
  draws: number;
  currentRound: number;
  totalRounds: number;
  status: string;
  executing: boolean;
  arbiterRunning: boolean;
  isRu: boolean;
}

export function DuelScoreboard({
  nameA, nameB, LogoA, LogoB,
  winsA, winsB, draws,
  currentRound, totalRounds, status,
  executing, arbiterRunning, isRu,
}: DuelScoreboardProps) {
  const statusBadge = status === 'completed'
    ? { label: getRatingsText('done', isRu), variant: 'default' as const }
    : executing || arbiterRunning
      ? { label: getRatingsText('live', isRu), variant: 'default' as const }
      : { label: getRatingsText('paused', isRu), variant: 'secondary' as const };

  return (
    <div className="px-3 py-3 border-b border-border/40 bg-card/50">
      <div className="flex items-center gap-3">
        {/* Phase icon */}
        <div className="flex-shrink-0">
          {executing || arbiterRunning
            ? <Loader2 className="h-7 w-7 animate-spin text-primary" />
            : <Swords className="h-7 w-7 text-primary" />}
        </div>

        {/* Score display */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5">
            {LogoA && <LogoA className="h-4 w-4" />}
            <span className="text-sm font-bold truncate max-w-[120px]">{nameA}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-muted/30">
            <span className={cn('text-lg font-bold tabular-nums', winsA > winsB && 'text-primary')}>{winsA}</span>
            <span className="text-xs text-muted-foreground mx-0.5">—</span>
            {draws > 0 && (
              <>
                <span className="text-sm font-medium tabular-nums text-muted-foreground">{draws}</span>
                <span className="text-xs text-muted-foreground mx-0.5">—</span>
              </>
            )}
            <span className={cn('text-lg font-bold tabular-nums', winsB > winsA && 'text-primary')}>{winsB}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold truncate max-w-[120px]">{nameB}</span>
            {LogoB && <LogoB className="h-4 w-4" />}
          </div>
        </div>

        {/* Status */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {getRatingsText('duelRoundN', isRu)} {currentRound}/{totalRounds}
          </span>
          <Badge variant={statusBadge.variant} className="text-[10px]">
            {statusBadge.label}
          </Badge>
        </div>
      </div>
    </div>
  );
}
