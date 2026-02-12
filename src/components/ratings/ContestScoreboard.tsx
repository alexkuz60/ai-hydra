import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Play, Loader2, CheckCircle2, AlertCircle, Trophy, Scale, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { PodiumHistogram } from './PodiumHistogram';
import { getRatingsText } from './i18n';
import { detectPhase, PHASE_MESSAGES_RU, PHASE_MESSAGES_EN, PHASE_ICONS, PROVIDER_ACCENT } from './contestPhases';
import type { ContestResult } from '@/hooks/useContestSession';

interface ContestScoreboardProps {
  results: ContestResult[];
  currentRound: number;
  totalRounds: number;
  completedRounds?: number;
  status: string;
  sessionName: string;
  arbiterCount: number;
  isRu: boolean;
  onNewContest?: () => void;
  onFinishContest?: () => void;
}

export function ContestScoreboard({
  results, currentRound, totalRounds, completedRounds = 0,
  status, sessionName, arbiterCount, isRu, onNewContest, onFinishContest,
}: ContestScoreboardProps) {
  const modelIds = [...new Set(results.map(r => r.model_id))];
  const { phase, activeModelId } = detectPhase(results, status);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const msgs = isRu ? PHASE_MESSAGES_RU[phase] : PHASE_MESSAGES_EN[phase];
    if (msgs.length <= 1) { setMsgIndex(0); return; }
    const t = setInterval(() => setMsgIndex(i => (i + 1) % msgs.length), 4000);
    return () => clearInterval(t);
  }, [phase, isRu]);

  useEffect(() => { setMsgIndex(0); }, [phase]);

  const msgs = isRu ? PHASE_MESSAGES_RU[phase] : PHASE_MESSAGES_EN[phase];
  const activeEntry = activeModelId ? getModelRegistryEntry(activeModelId) : null;
  const activeDisplayName = activeEntry?.displayName || activeModelId?.split('/').pop() || '…';
  const currentMsg = (msgs[msgIndex % msgs.length] || '').replace(/\{model\}/g, activeDisplayName);

   const statusBadge = status === 'running' ? getRatingsText('live', isRu)
     : status === 'completed' ? getRatingsText('done', isRu)
     : status === 'paused' ? getRatingsText('paused', isRu)
     : status;

  return (
    <div className="border-b-2 border-primary/30 bg-gradient-to-r from-primary/15 via-primary/8 to-accent/10 px-4 py-3">
      <div className="flex gap-0">
        {/* Column A: Icon (below header level) */}
        <div className="flex-shrink-0 w-14 flex flex-col">
          {/* Spacer for header row height */}
          <div className="h-7" />
          {/* Phase icon centered vertically in remaining space */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-background/60 border border-border/50 flex items-center justify-center shadow-sm">
              {PHASE_ICONS[phase]}
            </div>
          </div>
        </div>

        {/* Vertical separator after icon */}
        <div className="flex-shrink-0 w-[2px] bg-border/80 mx-2" />

        {/* Column B: Header + messages + badges */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-bold truncate">{sessionName}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] border-primary/40 bg-primary/10 gap-1">
                  {isRu ? `Тур ${currentRound + 1}/${totalRounds}` : `R${currentRound + 1}/${totalRounds}`}
                </Badge>
                <div className="w-16 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${totalRounds > 0 ? (completedRounds / totalRounds) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Play className="h-2.5 w-2.5" />
                {modelIds.length}
              </Badge>
              {arbiterCount > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 border-[hsl(var(--hydra-expert))]/40">
                  <Scale className="h-2.5 w-2.5" />
                  {arbiterCount}
                </Badge>
              )}
              <Badge
                variant={status === 'running' ? 'default' : 'secondary'}
                className={cn("text-[10px]", status === 'running' && "animate-pulse")}
              >
                {statusBadge}
              </Badge>
              {onFinishContest && status === 'running' && (
                <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2 border-destructive/40 hover:bg-destructive/10 text-destructive" onClick={onFinishContest}>
                  <Square className="h-2.5 w-2.5" />
                  {isRu ? 'Завершить' : 'Finish'}
                </Button>
              )}
              {onNewContest && (
                <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2" onClick={onNewContest}>
                  <Play className="h-2.5 w-2.5" />
                  {getRatingsText('new', isRu)}
                </Button>
              )}
            </div>
          </div>

          {/* Animated messages + model badges */}
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
          <div className="flex flex-wrap gap-1.5">
            {modelIds.map(modelId => {
              const entry = getModelRegistryEntry(modelId);
              const shortName = entry?.displayName || modelId.split('/').pop() || modelId;
              const result = results.find(r => r.model_id === modelId);
              const ProviderLogo = entry?.provider ? PROVIDER_LOGOS[entry.provider] : undefined;
              const color = entry?.provider ? PROVIDER_COLORS[entry.provider] : '';
              const isActive = modelId === activeModelId;
              const accent = entry?.provider ? PROVIDER_ACCENT[entry.provider] : undefined;

              return (
                <div
                  key={modelId}
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
                  <span className="truncate max-w-[120px]">{shortName}</span>
                  {result?.status === 'generating' && <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />}
                  {result?.status === 'ready' && <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--hydra-success))]" />}
                  {result?.status === 'judged' && <Trophy className="h-2.5 w-2.5 text-[hsl(var(--hydra-arbiter))]" />}
                  {result?.status === 'failed' && <AlertCircle className="h-2.5 w-2.5 text-destructive" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Vertical separator before podium */}
        <div className="flex-shrink-0 w-[2px] bg-border/80 mx-2" />

        {/* Column C: Podium — full height */}
        <div className="flex-shrink-0 w-24 flex items-stretch">
          <PodiumHistogram results={results} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
