import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useContestSession, type ContestResult } from '@/hooks/useContestSession';
import { useContestExecution } from '@/hooks/useContestExecution';
import { Crown, Play, History, Loader2, Clock, CheckCircle2, AlertCircle, MessageSquare, Scale, Trophy, ChevronDown, ChevronUp, Send, BarChart3, Archive, Star, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { useToast } from '@/hooks/use-toast';

// ============================================
// Sub-components
// ============================================

// ============================================
// Scoreboard phase detection & messages
// ============================================

type ContestPhase = 'idle' | 'generating' | 'user_scoring' | 'arbiter_judging' | 'round_complete' | 'completed' | 'failed';

function detectPhase(results: ContestResult[], status: string): { phase: ContestPhase; activeModelId?: string } {
  if (status === 'completed') return { phase: 'completed' };
  if (status === 'draft' || status === 'paused') return { phase: 'idle' };

  const generating = results.find(r => r.status === 'generating');
  if (generating) return { phase: 'generating', activeModelId: generating.model_id };

  const readyNoUserScore = results.find(r => r.status === 'ready' && r.user_score == null);
  if (readyNoUserScore) return { phase: 'user_scoring', activeModelId: readyNoUserScore.model_id };

  const readyNoArbiter = results.find(r => r.status === 'ready' && r.arbiter_score == null && r.user_score != null);
  if (readyNoArbiter) return { phase: 'arbiter_judging', activeModelId: readyNoArbiter.model_id };

  const failed = results.find(r => r.status === 'failed');
  if (failed) return { phase: 'failed', activeModelId: failed.model_id };

  if (results.length > 0 && results.every(r => r.status === 'judged')) return { phase: 'round_complete' };

  return { phase: 'idle' };
}

const PHASE_MESSAGES_RU: Record<ContestPhase, string[]> = {
  idle: ['Конкурс ожидает запуска…', 'Подиум готов, жюри заняло свои места.'],
  generating: [
    'На подиуме модель {model} — демонстрирует своё мастерство!',
    'Модель {model} обдумывает ответ… глубокие нейронные связи активированы!',
    '{model} выступает перед жюри — все взгляды устремлены на подиум!',
  ],
  user_scoring: [
    'Ответ {model} готов — ваша очередь поставить оценку!',
    'Жюри ожидает вашу экспертную оценку для {model}.',
    'Модель {model} замерла в ожидании вашего вердикта…',
  ],
  arbiter_judging: [
    'Арбитры совещаются по выступлению {model}…',
    'Судьи оценивают мастерство {model} — шепот в зале…',
    'Арбитр анализирует ответ {model} по всем критериям.',
  ],
  round_complete: [
    'Тур завершён! Результаты занесены в протокол.',
    'Все конкурсанты выступили — итоги подведены!',
  ],
  completed: [
    'Конкурс завершён! Победители определены. 🏆',
    'Финальные результаты зафиксированы. Поздравляем!',
  ],
  failed: [
    'Возникла ошибка при обработке ответа {model}.',
    'Модель {model} не смогла ответить — технический сбой.',
  ],
};

const PHASE_MESSAGES_EN: Record<ContestPhase, string[]> = {
  idle: ['Contest awaiting launch…', 'The podium is ready, the jury is seated.'],
  generating: [
    'Model {model} is on the podium — showcasing its skills!',
    '{model} is thinking deeply… neural pathways activated!',
    '{model} performs for the jury — all eyes on the stage!',
  ],
  user_scoring: [
    '{model}\'s response is ready — your turn to score!',
    'The jury awaits your expert evaluation of {model}.',
    '{model} stands frozen, awaiting your verdict…',
  ],
  arbiter_judging: [
    'Arbiters deliberate on {model}\'s performance…',
    'Judges evaluate {model}\'s craft — whispers in the hall…',
    'Arbiter analyzes {model}\'s response across all criteria.',
  ],
  round_complete: [
    'Round complete! Results recorded in the protocol.',
    'All contestants have performed — scores tallied!',
  ],
  completed: [
    'Contest finished! Winners determined. 🏆',
    'Final results are in. Congratulations!',
  ],
  failed: [
    'Error processing {model}\'s response.',
    '{model} failed to respond — technical issue.',
  ],
};

const PHASE_ICONS: Record<ContestPhase, React.ReactNode> = {
  idle: <Crown className="h-8 w-8 text-primary" />,
  generating: <Loader2 className="h-8 w-8 animate-spin text-primary" />,
  user_scoring: <MessageSquare className="h-8 w-8 text-[hsl(var(--hydra-arbiter))]" />,
  arbiter_judging: <Scale className="h-8 w-8 text-[hsl(var(--hydra-expert))]" />,
  round_complete: <CheckCircle2 className="h-8 w-8 text-[hsl(var(--hydra-success))]" />,
  completed: <Trophy className="h-8 w-8 text-[hsl(var(--hydra-arbiter))]" />,
  failed: <AlertCircle className="h-8 w-8 text-destructive" />,
};

/** Mini podium histogram — vertical bars representing top 3 */
function PodiumHistogram({ results }: { results: ContestResult[] }) {
  const modelIds = [...new Set(results.map(r => r.model_id))];

  // Compute total scores per model (user + arbiter)
  const scored = modelIds.map(modelId => {
    const mrs = results.filter(r => r.model_id === modelId);
    const uScores = mrs.filter(r => r.user_score != null).map(r => r.user_score!);
    const aScores = mrs.filter(r => r.arbiter_score != null).map(r => r.arbiter_score!);
    const avgU = uScores.length ? uScores.reduce((a, b) => a + b, 0) / uScores.length : 0;
    const avgA = aScores.length ? aScores.reduce((a, b) => a + b, 0) / aScores.length : 0;
    const total = avgU + avgA;
    const hasScore = uScores.length > 0 || aScores.length > 0;
    return { modelId, total, hasScore };
  }).sort((a, b) => b.total - a.total);

  const hasAnyScore = scored.some(s => s.hasScore);
  const maxScore = hasAnyScore ? Math.max(...scored.map(s => s.total), 1) : 1;

  // Show top 3 (or pad to 3)
  const podium = [scored[1], scored[0], scored[2]]; // 2nd, 1st, 3rd — classic podium order
  const defaultHeights = [60, 100, 40]; // fallback percentage heights for 2nd, 1st, 3rd

  // Dynamic range: use min score as floor to amplify visual differences
  const scores = scored.filter(s => s.hasScore).map(s => s.total);
  const minScore = scores.length > 1 ? Math.min(...scores) : 0;
  const range = maxScore - minScore;
  // Map score to 15%–100% range for maximum visual contrast
  const dynamicHeight = (total: number) => {
    if (range < 0.01) return 100; // all equal
    const normalized = (total - minScore) / range; // 0..1
    return 15 + normalized * 85; // 15%..100%
  };

  const podiumColors = hasAnyScore
    ? ['hsl(var(--hydra-expert))', 'hsl(var(--hydra-arbiter))', 'hsl(var(--primary))']
    : ['hsl(var(--muted))', 'hsl(var(--muted))', 'hsl(var(--muted))'];
  const podiumLabels = ['2', '1', '3'];

  return (
    <div className="flex-shrink-0 w-16 h-14 flex items-end justify-center gap-[3px]">
      {podium.map((entry, i) => {
        const heightPct = entry?.hasScore
          ? dynamicHeight(entry.total)
          : defaultHeights[i] * 0.4;
        const color = entry?.hasScore ? podiumColors[i] : 'hsl(var(--muted))';
        const entryData = entry ? getModelRegistryEntry(entry.modelId) : null;
        const shortName = entryData?.displayName || entry?.modelId?.split('/').pop() || '';

        return (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-0.5" style={{ height: '100%', justifyContent: 'flex-end' }}>
                  <span className="text-[8px] font-bold text-muted-foreground">{podiumLabels[i]}</span>
                  <div
                    className="w-4 rounded-t-sm"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: color,
                      opacity: entry?.hasScore ? 1 : 0.3,
                      transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.4s ease, opacity 0.4s ease',
                    }}
                  />
                </div>
              </TooltipTrigger>
              {entry && (
                <TooltipContent side="bottom" className="text-[10px]">
                  {shortName}{entry.hasScore ? `: ${entry.total.toFixed(1)}` : ''}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

/** Progress Scoreboard — vivid sticky header */
function ContestScoreboard({
  results,
  currentRound,
  totalRounds,
  status,
  sessionName,
  arbiterCount,
  isRu,
  onNewContest,
}: {
  results: ContestResult[];
  currentRound: number;
  totalRounds: number;
  status: string;
  sessionName: string;
  arbiterCount: number;
  isRu: boolean;
  onNewContest?: () => void;
}) {
  const modelIds = [...new Set(results.map(r => r.model_id))];
  const { phase, activeModelId } = detectPhase(results, status);
  const [msgIndex, setMsgIndex] = useState(0);

  // Rotate messages every 4s
  useEffect(() => {
    const msgs = isRu ? PHASE_MESSAGES_RU[phase] : PHASE_MESSAGES_EN[phase];
    if (msgs.length <= 1) { setMsgIndex(0); return; }
    const t = setInterval(() => setMsgIndex(i => (i + 1) % msgs.length), 4000);
    return () => clearInterval(t);
  }, [phase, isRu]);

  // Reset index on phase change
  useEffect(() => { setMsgIndex(0); }, [phase]);

  const msgs = isRu ? PHASE_MESSAGES_RU[phase] : PHASE_MESSAGES_EN[phase];
  const activeEntry = activeModelId ? getModelRegistryEntry(activeModelId) : null;
  const activeDisplayName = activeEntry?.displayName || activeModelId?.split('/').pop() || '…';
  const currentMsg = (msgs[msgIndex % msgs.length] || '').replace(/\{model\}/g, activeDisplayName);

  const statusBadge = status === 'running' ? (isRu ? 'Идёт' : 'Live')
    : status === 'completed' ? (isRu ? 'Завершён' : 'Done')
    : status === 'paused' ? (isRu ? 'Пауза' : 'Paused')
    : status;

  return (
    <div className="border-b-2 border-primary/30 bg-gradient-to-r from-primary/15 via-primary/8 to-accent/10 px-4 py-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Crown className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-bold truncate">{sessionName}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className="text-[10px] border-primary/40 bg-primary/10">
            {isRu ? `Тур ${currentRound + 1}/${totalRounds}` : `R${currentRound + 1}/${totalRounds}`}
          </Badge>
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
          {onNewContest && (
            <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2" onClick={onNewContest}>
              <Play className="h-2.5 w-2.5" />
              {isRu ? 'Новый' : 'New'}
            </Button>
          )}
        </div>
      </div>

      {/* Three-column dynamic area */}
      <div className="flex items-center gap-4">
        {/* Left: large phase icon */}
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-background/60 border border-border/50 flex items-center justify-center shadow-sm">
          {PHASE_ICONS[phase]}
        </div>

        {/* Center: animated notification + chips */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug animate-fade-in" key={`${phase}-${msgIndex}`}>
            {currentMsg}
          </p>
          {/* Model chips */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {modelIds.map(modelId => {
              const entry = getModelRegistryEntry(modelId);
              const shortName = entry?.displayName || modelId.split('/').pop() || modelId;
              const result = results.find(r => r.model_id === modelId);
              const ProviderLogo = entry?.provider ? PROVIDER_LOGOS[entry.provider] : undefined;
              const color = entry?.provider ? PROVIDER_COLORS[entry.provider] : '';
              const isActive = modelId === activeModelId;

              // Resolve provider accent color for active highlight
              const PROVIDER_ACCENT: Record<string, string> = {
                gemini: 'var(--hydra-arbiter)',
                openai: 'var(--hydra-success)',
                anthropic: 'var(--hydra-expert)',
                xai: 'var(--hydra-expert)',
                deepseek: 'var(--hydra-success)',
              };
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

        {/* Right: mini podium histogram */}
        <PodiumHistogram results={results} />
      </div>
    </div>
  );
}

/** Inline scoring widget for user evaluation — always editable */
function UserScoreWidget({
  resultId,
  currentScore,
  onScore,
  isRu,
}: {
  resultId: string;
  currentScore: number | null;
  onScore: (resultId: string, score: number) => void;
  isRu: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="pt-2 border-t border-primary/20 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Star className="h-3 w-3 text-primary" />
        <span className="text-[11px] font-medium text-primary">
          {isRu ? 'Ваша оценка:' : 'Your score:'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(score => {
          const isActive = hover != null ? hover >= score : (currentScore ?? 0) >= score;
          return (
            <button
              key={score}
              className={cn(
                "w-7 h-7 rounded-md text-[11px] font-semibold transition-all border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary scale-105"
                  : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60"
              )}
              onMouseEnter={() => setHover(score)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onScore(resultId, score)}
            >
              {score}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {hover
          ? (isRu ? `Оценка: ${hover}/10` : `Score: ${hover}/10`)
          : currentScore != null
            ? (isRu ? `Текущая: ${currentScore}/10 — нажмите для изменения` : `Current: ${currentScore}/10 — click to change`)
            : (isRu ? 'Нажмите для оценки от 1 до 10' : 'Click to rate 1-10')
        }
      </p>
    </div>
  );
}

/** Filtered responses chat */
function ContestResponsesPanel({
  results,
  rounds,
  streamingTexts,
  isRu,
  onScore,
  expanded,
  onToggleExpand,
  activeModel,
  onActiveModelChange,
}: {
  results: ContestResult[];
  rounds: { id: string; round_index: number; prompt: string }[];
  streamingTexts: Record<string, string>;
  isRu: boolean;
  onScore?: (resultId: string, score: number) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
  activeModel: string;
  onActiveModelChange: (model: string) => void;
}) {
  const modelIds = [...new Set(results.map(r => r.model_id))];

  // Include streaming results that don't have response_text yet
  const allDisplayable = activeModel === 'all'
    ? results.filter(r => r.response_text || streamingTexts[r.model_id])
    : results.filter(r => r.model_id === activeModel && (r.response_text || streamingTexts[r.model_id]));

  const filtered = allDisplayable;

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeModel} onValueChange={onActiveModelChange} className="flex flex-col h-full">
        <div className="px-3 pt-2 pb-1 border-b border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1">
              {isRu ? 'Ответы конкурсантов' : 'Contestant Responses'}
            </span>
            {onToggleExpand && (
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onToggleExpand}>
                {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
          <TabsList className="h-9 p-1 bg-muted/30 w-full justify-start gap-1">
            <TabsTrigger value="all" className="text-xs h-7 px-4">
              {isRu ? 'Все' : 'All'}
            </TabsTrigger>
            {modelIds.map(id => {
              const entry = getModelRegistryEntry(id);
              const short = entry?.displayName || id.split('/').pop() || id;
              return (
                <TabsTrigger key={id} value={id} className="text-xs h-7 px-4 max-w-[160px] truncate">
                  {short}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                {isRu ? 'Ответы появятся здесь после запуска' : 'Responses will appear here after launch'}
              </div>
            ) : (
              filtered.map(result => {
                const entry = getModelRegistryEntry(result.model_id);
                const shortName = entry?.displayName || result.model_id.split('/').pop() || result.model_id;
                const ProviderLogo = entry?.provider ? PROVIDER_LOGOS[entry.provider] : undefined;
                const color = entry?.provider ? PROVIDER_COLORS[entry.provider] : '';
                const round = rounds.find(r => r.id === result.round_id);

                return (
                  <div key={result.id} className="rounded-lg border border-border/40 bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {ProviderLogo && <ProviderLogo className={cn("h-3.5 w-3.5", color)} />}
                        <span className="text-xs font-semibold">{shortName}</span>
                        {round && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {isRu ? `Тур ${round.round_index + 1}` : `R${round.round_index + 1}`}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {result.response_time_ms && (
                          <span>{(result.response_time_ms / 1000).toFixed(1)}s</span>
                        )}
                        {result.token_count && (
                          <span>{result.token_count} tok</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm">
                      <MarkdownRenderer content={result.response_text || streamingTexts[result.model_id] || ''} />
                      {result.status === 'generating' && !result.response_text && streamingTexts[result.model_id] && (
                        <Loader2 className="h-3 w-3 animate-spin text-primary inline ml-1" />
                      )}
                    </div>
                    {/* Scoring widget — always visible & editable (even after arbiter judging) */}
                    {(result.status === 'ready' || result.status === 'judged') && onScore && (
                      <UserScoreWidget
                        resultId={result.id}
                        currentScore={result.user_score}
                        onScore={onScore}
                        isRu={isRu}
                      />
                    )}
                    {result.arbiter_score != null && (
                      <div className="flex items-center gap-3 text-[10px] pt-1 border-t border-border/30">
                        <span>⚖️ {result.arbiter_score}/10</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

/** Arbiter comments panel */
function ContestArbiterPanel({
  results,
  isRu,
}: {
  results: ContestResult[];
  isRu: boolean;
}) {
  const judged = results.filter(r => r.arbiter_comment);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-2 pb-1 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Scale className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isRu ? 'Комментарии арбитра' : 'Arbiter Comments'}
          </span>
        </div>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {judged.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6">
              {isRu ? 'Арбитр ещё не оценивал' : 'Arbiter has not judged yet'}
            </div>
          ) : (
            judged.map(r => {
              const entry = getModelRegistryEntry(r.model_id);
              const shortName = entry?.displayName || r.model_id.split('/').pop() || r.model_id;
              return (
                <div key={r.id} className="rounded-md border border-border/30 bg-muted/10 p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{shortName}</span>
                    {r.arbiter_score != null && (
                      <Badge variant="secondary" className="text-[10px]">{r.arbiter_score}/10</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.arbiter_comment}</p>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/** Scores table with footer totals */
function ContestScoresTable({
  results,
  rounds,
  isRu,
}: {
  results: ContestResult[];
  rounds: { id: string; round_index: number }[];
  isRu: boolean;
}) {
  const modelIds = [...new Set(results.map(r => r.model_id))];

  // Aggregate scores per model
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
      </div>
      <Table>
        <TableHeader>
          <TableRow className="text-[11px]">
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

            return (
              <TableRow key={row.modelId} className="text-xs">
                <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {ProviderLogo && <ProviderLogo className={cn("h-3 w-3", color)} />}
                    <span className="truncate max-w-[120px]">{shortName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">{row.avgUser != null ? row.avgUser.toFixed(1) : '—'}</TableCell>
                <TableCell className="text-center">{row.avgArbiter != null ? row.avgArbiter.toFixed(1) : '—'}</TableCell>
                <TableCell className="text-center font-semibold">{row.totalScore != null ? row.totalScore.toFixed(1) : '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function BeautyContest() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isRu = language === 'ru';
  const contest = useContestSession();
  const execution = useContestExecution();

  const [followUpText, setFollowUpText] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [responsesExpanded, setResponsesExpanded] = useState(false);
  const [activeModel, setActiveModel] = useState<string>('all');
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  // On mount, try to restore last session
  useEffect(() => {
    if (user && initialLoad) {
      contest.loadLatestSession().finally(() => setInitialLoad(false));
    }
  }, [user]);

  const handleLaunch = async () => {
    const result = await contest.createFromWizard();
    if (result) {
      toast({ description: isRu ? 'Конкурс запущен!' : 'Contest launched!' });
      const firstRound = result.rounds.find(r => r.status === 'running') || result.rounds[0];
      if (firstRound) {
        await execution.executeRound(result.session, firstRound, result.results, contest.updateResult);
      }
    }
  };

  const handleLoadFromHistory = async (sessionId: string) => {
    await contest.loadSession(sessionId);
  };

  const handleSendFollowUp = async () => {
    if (!followUpText.trim() || !contest.session) return;
    setSendingFollowUp(true);
    try {
      const targetModels = activeModel === 'all' ? undefined : [activeModel];
      const followUp = await contest.createFollowUpRound(followUpText.trim(), targetModels);
      if (followUp) {
        setFollowUpText('');
        const targetName = activeModel === 'all'
          ? (isRu ? 'всем' : 'all')
          : (getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop());
        toast({ description: isRu ? `Вопрос отправлен: ${targetName}` : `Question sent to: ${targetName}` });
        await execution.executeRound(contest.session, followUp.round, followUp.results, contest.updateResult);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', description: err.message });
    } finally {
      setSendingFollowUp(false);
    }
  };

  // No session yet — show launch / restore UI
  if (!contest.session && !initialLoad) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
              <Crown className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">
                {isRu ? 'Конкурс интеллект-красоты' : 'Intelligence Beauty Contest'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Настройте конкурс в разделе «Правила» и запустите его здесь, или восстановите предыдущую сессию.'
                  : 'Configure the contest in "Rules" section and launch it here, or restore a previous session.'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleLaunch} className="gap-2" size="lg">
                <Play className="h-4 w-4" />
                {isRu ? 'Запустить из плана' : 'Launch from Plan'}
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2" onClick={() => contest.loadHistory()}>
                    <Archive className="h-4 w-4" />
                    {isRu ? 'Загрузить из архива' : 'Load from Archive'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[70vh]">
                  <DialogHeader>
                    <DialogTitle>{isRu ? 'Архив конкурсов' : 'Contest Archive'}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[50vh]">
                    <div className="space-y-2 pr-2">
                      {contest.sessionHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {isRu ? 'Нет сохранённых конкурсов' : 'No saved contests'}
                        </p>
                      ) : (
                        contest.sessionHistory.map(s => (
                          <button
                            key={s.id}
                            onClick={() => handleLoadFromHistory(s.id)}
                            className="w-full text-left rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{s.name}</span>
                              <Badge variant={s.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                                {s.status}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(s.created_at).toLocaleDateString()} • {Object.keys(s.config.models || {}).length} {isRu ? 'моделей' : 'models'}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (initialLoad) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Active session view
  const currentRoundIndex = contest.rounds.findIndex(r => r.status === 'running') ?? 0;
  const currentRound = contest.rounds[currentRoundIndex >= 0 ? currentRoundIndex : 0];

  return (
    <div className="h-full flex flex-col">
      {/* Scoreboard */}
      <ContestScoreboard
        results={contest.results}
        currentRound={currentRoundIndex >= 0 ? currentRoundIndex : 0}
        totalRounds={contest.rounds.length || 1}
        status={contest.session?.status || 'draft'}
        sessionName={contest.session?.name || (isRu ? 'Конкурс' : 'Contest')}
        arbiterCount={contest.session?.config?.arbitration?.juryMode === 'ai' ? 1 : contest.session?.config?.arbitration?.juryMode === 'hybrid' ? 2 : 0}
        isRu={isRu}
        onNewContest={() => { contest.setSession(null); }}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Responses chat */}
        <div className={cn(
          "border-b border-border/30 overflow-hidden flex flex-col",
          responsesExpanded ? "flex-1" : "flex-1 min-h-[200px]"
        )}>
           <ContestResponsesPanel
            results={contest.results}
            rounds={contest.rounds}
            streamingTexts={execution.streamingTexts}
            isRu={isRu}
            onScore={async (resultId, score) => {
              await contest.updateResult(resultId, { user_score: score } as any);
            }}
            expanded={responsesExpanded}
            onToggleExpand={() => setResponsesExpanded(e => !e)}
            activeModel={activeModel}
            onActiveModelChange={setActiveModel}
          />
        </div>

        {/* Arbiter + Scores — hidden when expanded */}
        {!responsesExpanded && (
          <>
            <div className="h-[140px] flex-shrink-0 border-b border-border/30 overflow-hidden">
              <ContestArbiterPanel
                results={contest.results}
                isRu={isRu}
              />
            </div>
            <div className="flex-shrink-0 max-h-[160px] overflow-auto p-3">
              <ContestScoresTable
                results={contest.results}
                rounds={contest.rounds}
                isRu={isRu}
              />
            </div>
          </>
        )}

        {/* Follow-up input */}
        <div className="border-t border-border px-3 py-2 flex-shrink-0">
          {/* Target indicator */}
          {activeModel !== 'all' && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <Badge variant="outline" className="text-[10px] gap-1 border-primary/40 bg-primary/5">
                {(() => {
                  const entry = getModelRegistryEntry(activeModel);
                  const ProviderLogo = entry?.provider ? PROVIDER_LOGOS[entry.provider] : undefined;
                  const color = entry?.provider ? PROVIDER_COLORS[entry.provider] : '';
                  const name = entry?.displayName || activeModel.split('/').pop() || activeModel;
                  return (
                    <>
                      {ProviderLogo && <ProviderLogo className={cn("h-2.5 w-2.5", color)} />}
                      {isRu ? `Вопрос для: ${name}` : `Question for: ${name}`}
                    </>
                  );
                })()}
              </Badge>
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setActiveModel('all')}
              >
                {isRu ? '(всем)' : '(all)'}
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={followUpText}
              onChange={e => setFollowUpText(e.target.value)}
              placeholder={
                activeModel === 'all'
                  ? (isRu ? 'Дополнительный вопрос всем конкурсантам...' : 'Follow-up question for all contestants...')
                  : (isRu ? `Вопрос для ${getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop()}...` : `Question for ${getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop()}...`)
              }
              className="min-h-[36px] max-h-[100px] text-sm resize-none"
              rows={1}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (followUpText.trim() && contest.session?.status === 'running' && !sendingFollowUp && !execution.executing) {
                    handleSendFollowUp();
                  }
                }
              }}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    disabled={!followUpText.trim() || contest.session?.status !== 'running' || sendingFollowUp || execution.executing}
                    onClick={handleSendFollowUp}
                  >
                    {sendingFollowUp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {activeModel === 'all'
                    ? (isRu ? 'Отправить всем конкурсантам' : 'Send to all contestants')
                    : (isRu ? `Отправить только ${getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop()}` : `Send only to ${getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop()}`)
                  }
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
