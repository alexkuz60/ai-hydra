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

/** Progress Scoreboard — sticky top bar */
function ContestScoreboard({
  results,
  currentRound,
  totalRounds,
  status,
  isRu,
}: {
  results: ContestResult[];
  currentRound: number;
  totalRounds: number;
  status: string;
  isRu: boolean;
}) {
  const modelIds = [...new Set(results.map(r => r.model_id))];
  const statusIcon = (s: string) => {
    switch (s) {
      case 'generating': return <Loader2 className="h-3 w-3 animate-spin text-primary" />;
      case 'ready': return <CheckCircle2 className="h-3 w-3 text-accent-foreground" />;
      case 'judged': return <Trophy className="h-3 w-3 text-primary" />;
      case 'failed': return <AlertCircle className="h-3 w-3 text-destructive" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="border-b border-border bg-muted/20 px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            {isRu ? `Тур ${currentRound + 1} из ${totalRounds}` : `Round ${currentRound + 1} of ${totalRounds}`}
          </span>
        </div>
        <Badge variant={status === 'running' ? 'default' : 'secondary'} className="text-[10px]">
          {status === 'running' ? (isRu ? 'Идёт' : 'Running') :
           status === 'completed' ? (isRu ? 'Завершён' : 'Completed') :
           status === 'paused' ? (isRu ? 'Пауза' : 'Paused') :
           status}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {modelIds.map(modelId => {
          const entry = getModelRegistryEntry(modelId);
          const shortName = entry?.displayName || modelId.split('/').pop() || modelId;
          const result = results.find(r => r.model_id === modelId && r.round_id === results.find(rr => rr.model_id === modelId)?.round_id);
          const ProviderLogo = entry?.provider ? PROVIDER_LOGOS[entry.provider] : undefined;
          const color = entry?.provider ? PROVIDER_COLORS[entry.provider] : '';

          return (
            <div key={modelId} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border/50 text-xs">
              {ProviderLogo && <ProviderLogo className={cn("h-3 w-3", color)} />}
              <span className="font-medium truncate max-w-[100px]">{shortName}</span>
              {result && statusIcon(result.status)}
            </div>
          );
        })}
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
