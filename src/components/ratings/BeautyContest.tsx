import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useContestSession, type ContestResult } from '@/hooks/useContestSession';
import { Crown, Play, History, Loader2, Clock, CheckCircle2, AlertCircle, MessageSquare, Scale, Trophy, ChevronDown, Send, BarChart3, Archive } from 'lucide-react';
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

/** Progress Scoreboard — vivid sticky header */
function ContestScoreboard({
  results,
  currentRound,
  totalRounds,
  status,
  sessionName,
  arbiterCount,
  isRu,
}: {
  results: ContestResult[];
  currentRound: number;
  totalRounds: number;
  status: string;
  sessionName: string;
  arbiterCount: number;
  isRu: boolean;
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
        </div>
      </div>

      {/* Two-column dynamic area */}
      <div className="flex items-center gap-4">
        {/* Left: large phase icon */}
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-background/60 border border-border/50 flex items-center justify-center shadow-sm">
          {PHASE_ICONS[phase]}
        </div>

        {/* Right: animated notification */}
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

              return (
                <div
                  key={modelId}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border transition-all",
                    isActive
                      ? "bg-primary/15 border-primary/50 ring-1 ring-primary/30 font-semibold"
                      : "bg-background/50 border-border/30"
                  )}
                >
                  {ProviderLogo && <ProviderLogo className={cn("h-2.5 w-2.5", color)} />}
                  <span className="truncate max-w-[70px]">{shortName}</span>
                  {result?.status === 'generating' && <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />}
                  {result?.status === 'ready' && <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--hydra-success))]" />}
                  {result?.status === 'judged' && <Trophy className="h-2.5 w-2.5 text-[hsl(var(--hydra-arbiter))]" />}
                  {result?.status === 'failed' && <AlertCircle className="h-2.5 w-2.5 text-destructive" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Filtered responses chat */
function ContestResponsesPanel({
  results,
  rounds,
  isRu,
}: {
  results: ContestResult[];
  rounds: { id: string; round_index: number; prompt: string }[];
  isRu: boolean;
}) {
  const modelIds = [...new Set(results.map(r => r.model_id))];
  const [activeModel, setActiveModel] = useState<string>('all');

  const filtered = activeModel === 'all'
    ? results.filter(r => r.response_text)
    : results.filter(r => r.model_id === activeModel && r.response_text);

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeModel} onValueChange={setActiveModel} className="flex flex-col h-full">
        <div className="px-3 pt-2 pb-1 border-b border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isRu ? 'Ответы конкурсантов' : 'Contestant Responses'}
            </span>
          </div>
          <TabsList className="h-7 p-0.5 bg-muted/30">
            <TabsTrigger value="all" className="text-[10px] h-6 px-2">
              {isRu ? 'Все' : 'All'}
            </TabsTrigger>
            {modelIds.map(id => {
              const entry = getModelRegistryEntry(id);
              const short = entry?.displayName || id.split('/').pop() || id;
              return (
                <TabsTrigger key={id} value={id} className="text-[10px] h-6 px-2 max-w-[80px] truncate">
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
                      <MarkdownRenderer content={result.response_text || ''} />
                    </div>
                    {(result.user_score != null || result.arbiter_score != null) && (
                      <div className="flex items-center gap-3 text-[10px] pt-1 border-t border-border/30">
                        {result.user_score != null && (
                          <span>👤 {result.user_score}/10</span>
                        )}
                        {result.arbiter_score != null && (
                          <span>⚖️ {result.arbiter_score}/10</span>
                        )}
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
    const totalScore = avgUser != null && avgArbiter != null ? (avgUser + avgArbiter) / 2 : avgUser ?? avgArbiter;

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
        {aggregated.length > 0 && (
          <TableFooter>
            <TableRow className="text-[10px]">
              <TableCell colSpan={2} className="text-muted-foreground">{isRu ? 'Среднее' : 'Average'}</TableCell>
              <TableCell className="text-center">
                {(() => {
                  const vals = aggregated.filter(a => a.avgUser != null).map(a => a.avgUser!);
                  return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
                })()}
              </TableCell>
              <TableCell className="text-center">
                {(() => {
                  const vals = aggregated.filter(a => a.avgArbiter != null).map(a => a.avgArbiter!);
                  return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
                })()}
              </TableCell>
              <TableCell className="text-center font-semibold">
                {(() => {
                  const vals = aggregated.filter(a => a.totalScore != null).map(a => a.totalScore!);
                  return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
                })()}
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
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

  const [followUpText, setFollowUpText] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);

  // On mount, try to restore last session
  useEffect(() => {
    if (user && initialLoad) {
      contest.loadLatestSession().finally(() => setInitialLoad(false));
    }
  }, [user]);

  const handleLaunch = async () => {
    const s = await contest.createFromWizard();
    if (s) {
      toast({ description: isRu ? 'Конкурс запущен!' : 'Contest launched!' });
    }
  };

  const handleLoadFromHistory = async (sessionId: string) => {
    await contest.loadSession(sessionId);
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
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 grid grid-rows-[1fr_auto_auto] min-h-0">
          {/* Upper section: Responses chat */}
          <div className="min-h-0 border-b border-border/30">
            <ContestResponsesPanel
              results={contest.results}
              rounds={contest.rounds}
              isRu={isRu}
            />
          </div>

          {/* Arbiter comments */}
          <div className="h-[200px] border-b border-border/30">
            <ContestArbiterPanel
              results={contest.results}
              isRu={isRu}
            />
          </div>

          {/* Scores table */}
          <div className="p-3">
            <ContestScoresTable
              results={contest.results}
              rounds={contest.rounds}
              isRu={isRu}
            />
          </div>
        </div>

        {/* Follow-up input */}
        <div className="border-t border-border px-3 py-2">
          <div className="flex items-end gap-2">
            <Textarea
              value={followUpText}
              onChange={e => setFollowUpText(e.target.value)}
              placeholder={isRu ? 'Дополнительный вопрос конкурсантам...' : 'Follow-up question for contestants...'}
              className="min-h-[36px] max-h-[100px] text-sm resize-none"
              rows={1}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    disabled={!followUpText.trim() || contest.session?.status !== 'running'}
                    onClick={() => {
                      toast({ description: isRu ? 'Дополнительный вопрос будет реализован в следующей итерации' : 'Follow-up will be implemented in next iteration' });
                    }}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRu ? 'Отправить уточняющий вопрос' : 'Send follow-up question'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
