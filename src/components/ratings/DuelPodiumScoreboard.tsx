import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Play, Loader2, CheckCircle2, AlertCircle, Trophy, Scale, Square, PlusCircle, Pause, RotateCcw, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { getRatingsText } from './i18n';
import { detectDuelPhase, DUEL_PHASE_MESSAGES_RU, DUEL_PHASE_MESSAGES_EN, DUEL_PHASE_ICONS } from './duelPhases';
import { PROVIDER_ACCENT } from './contestPhases';
import type { ContestSession, ContestRound, ContestResult } from '@/hooks/useContestSession';

interface DuelPodiumScoreboardProps {
  session: ContestSession;
  rounds: ContestRound[];
  results: ContestResult[];
  modelA: string;
  modelB: string;
  nameA: string;
  nameB: string;
  LogoA: React.ComponentType<{ className?: string }> | null;
  LogoB: React.ComponentType<{ className?: string }> | null;
  winsA: number;
  winsB: number;
  draws: number;
  currentRound: number;
  totalRounds: number;
  executing: boolean;
  arbiterRunning: boolean;
  paused: boolean;
  isRu: boolean;
  onNewDuel: () => void;
  onFinishDuel: () => void;
  onTogglePause: () => void;
}

export function DuelPodiumScoreboard({
  session, rounds, results, modelA, modelB, nameA, nameB, LogoA, LogoB,
  winsA, winsB, draws, currentRound, totalRounds,
  executing, arbiterRunning, paused, isRu,
  onNewDuel, onFinishDuel, onTogglePause,
}: DuelPodiumScoreboardProps) {
  const { phase, activeModelId } = detectDuelPhase(results, session.status, modelA, modelB);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const msgs = isRu ? DUEL_PHASE_MESSAGES_RU[phase] : DUEL_PHASE_MESSAGES_EN[phase];
    if (msgs.length <= 1) { setMsgIndex(0); return; }
    const t = setInterval(() => setMsgIndex(i => (i + 1) % msgs.length), 4000);
    return () => clearInterval(t);
  }, [phase, isRu]);

  useEffect(() => { setMsgIndex(0); }, [phase]);

  const msgs = isRu ? DUEL_PHASE_MESSAGES_RU[phase] : DUEL_PHASE_MESSAGES_EN[phase];
  const activeEntry = activeModelId ? getModelRegistryEntry(activeModelId) : null;
  const activeDisplayName = activeEntry?.displayName || activeModelId?.split('/').pop() || '…';
  const currentMsg = (msgs[msgIndex % msgs.length] || '')
    .replace(/\{modelA\}/g, nameA)
    .replace(/\{modelB\}/g, nameB)
    .replace(/\{model\}/g, activeDisplayName);

  const statusBadge = session.status === 'completed'
    ? getRatingsText('done', isRu)
    : executing || arbiterRunning
      ? getRatingsText('live', isRu)
      : paused
        ? getRatingsText('paused', isRu)
        : session.status;

  // Mini duel podium — two bars for A/B
  const maxWins = Math.max(winsA, winsB, 1);
  const heightA = 15 + (winsA / maxWins) * 85;
  const heightB = 15 + (winsB / maxWins) * 85;

  const entryA = getModelRegistryEntry(modelA);
  const entryB = getModelRegistryEntry(modelB);
  const duelists = [
    { id: modelA, name: nameA, Logo: LogoA, entry: entryA, isActive: activeModelId === modelA },
    { id: modelB, name: nameB, Logo: LogoB, entry: entryB, isActive: activeModelId === modelB },
  ];

  return (
    <div className="border-b-2 border-primary/30 bg-gradient-to-r from-primary/15 via-primary/8 to-accent/10 px-3 py-3">
      <div className="flex gap-0">
        {/* Column A: Phase icon */}
        <div className="flex-shrink-0 w-14 flex flex-col">
          <div className="h-7" />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-background/60 border border-border/50 flex items-center justify-center shadow-sm">
              {DUEL_PHASE_ICONS[phase]}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 w-[2px] bg-foreground/20 mx-2" />

        {/* Column B: Header + messages + duelist badges */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-bold truncate">{getRatingsText('duelTitle', isRu)}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] border-primary/40 bg-primary/10 gap-1">
                  {isRu ? `Раунд ${currentRound}/${totalRounds}` : `R${currentRound}/${totalRounds}`}
                </Badge>
                <div className="w-16 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <Badge
                variant={executing || arbiterRunning ? 'default' : 'secondary'}
                className={cn("text-[10px]", (executing || arbiterRunning) && "animate-pulse")}
              >
                {statusBadge}
              </Badge>
              {session.status !== 'completed' && (
                <Button
                  size="sm" variant="outline"
                  className="h-6 text-[10px] gap-1 px-2"
                  onClick={onTogglePause}
                >
                  {paused ? <Play className="h-2.5 w-2.5" /> : <Pause className="h-2.5 w-2.5" />}
                  {paused ? (isRu ? 'Продолжить' : 'Resume') : (isRu ? 'Пауза' : 'Pause')}
                </Button>
              )}
              {session.status !== 'completed' && (
                <Button
                  size="sm" variant="outline"
                  className="h-6 text-[10px] gap-1 px-2 border-destructive/40 hover:bg-destructive/10 text-destructive"
                  onClick={onFinishDuel}
                >
                  <Square className="h-2.5 w-2.5" />
                  {isRu ? 'Завершить' : 'Finish'}
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2" onClick={onNewDuel}>
                <Play className="h-2.5 w-2.5" />
                {getRatingsText('new', isRu)}
              </Button>
            </div>
          </div>

          {/* Animated phase messages */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={`${phase}-${msgIndex}`}
                className="text-sm font-medium leading-snug"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
              >
                {currentMsg}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Duelist badges with status */}
          <div className="flex flex-wrap gap-1.5">
            {duelists.map(({ id, name, Logo, entry, isActive }) => {
              const ProviderLogo = Logo;
              const color = entry?.provider ? PROVIDER_COLORS[entry.provider] : '';
              const accent = entry?.provider ? PROVIDER_ACCENT[entry.provider] : undefined;
              const latestResult = results.filter(r => r.model_id === id).slice(-1)[0];

              return (
                <div
                  key={id}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border transition-all",
                    isActive ? "font-semibold ring-1" : "bg-background/50 border-border/30"
                  )}
                  style={isActive ? {
                    backgroundColor: accent ? `hsl(${accent} / 0.15)` : 'hsl(var(--primary) / 0.15)',
                    borderColor: accent ? `hsl(${accent} / 0.5)` : 'hsl(var(--primary) / 0.5)',
                    boxShadow: `0 0 0 1px ${accent ? `hsl(${accent} / 0.3)` : 'hsl(var(--primary) / 0.3)'}`,
                  } : undefined}
                >
                  {ProviderLogo && <ProviderLogo className={cn("h-2.5 w-2.5", color)} />}
                  <span className="truncate max-w-[120px]">{name}</span>
                  {latestResult?.status === 'generating' && <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />}
                  {latestResult?.status === 'ready' && <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--hydra-success))]" />}
                  {latestResult?.status === 'judged' && <Trophy className="h-2.5 w-2.5 text-[hsl(var(--hydra-arbiter))]" />}
                  {latestResult?.status === 'failed' && <AlertCircle className="h-2.5 w-2.5 text-destructive" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-shrink-0 w-[2px] bg-foreground/20 mx-2" />

        {/* Column C: Duel mini-podium — two bars */}
        <div className="flex-shrink-0 w-24 flex items-end justify-center gap-[6px] py-1">
          {/* Model A bar */}
          <div className="flex flex-col items-center gap-0.5" style={{ height: '100%', justifyContent: 'flex-end' }}>
            <span className="text-[8px] font-bold text-muted-foreground truncate max-w-[40px]">
              {nameA.slice(0, 6)}
            </span>
            <div
              className="w-8 rounded-t-sm transition-all duration-700 ease-out"
              style={{
                height: `${heightA}%`,
                backgroundColor: winsA > winsB ? 'hsl(var(--hydra-arbiter))' : winsA === winsB ? 'hsl(var(--primary))' : 'hsl(220 10% 50%)',
                opacity: winsA > 0 ? 1 : 0.5,
              }}
            />
            <span className="text-[9px] font-bold tabular-nums">{winsA}</span>
          </div>
          {/* Draws indicator */}
          {draws > 0 && (
            <div className="flex flex-col items-center gap-0.5 justify-end" style={{ height: '100%' }}>
              <span className="text-[8px] text-muted-foreground">=</span>
              <span className="text-[9px] font-medium tabular-nums text-muted-foreground">{draws}</span>
            </div>
          )}
          {/* Model B bar */}
          <div className="flex flex-col items-center gap-0.5" style={{ height: '100%', justifyContent: 'flex-end' }}>
            <span className="text-[8px] font-bold text-muted-foreground truncate max-w-[40px]">
              {nameB.slice(0, 6)}
            </span>
            <div
              className="w-8 rounded-t-sm transition-all duration-700 ease-out"
              style={{
                height: `${heightB}%`,
                backgroundColor: winsB > winsA ? 'hsl(var(--hydra-arbiter))' : winsB === winsA ? 'hsl(var(--primary))' : 'hsl(220 10% 50%)',
                opacity: winsB > 0 ? 1 : 0.5,
              }}
            />
            <span className="text-[9px] font-bold tabular-nums">{winsB}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
