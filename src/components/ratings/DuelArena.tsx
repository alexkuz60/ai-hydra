import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDuelConfig } from '@/hooks/useDuelConfig';
import { useDuelSession } from '@/hooks/useDuelSession';
import { useDuelExecution } from '@/hooks/useDuelExecution';
import { Swords, Play, Loader2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getRatingsText } from './i18n';
import { DuelBattleView } from './DuelBattleView';

export function DuelArena() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isRu = language === 'ru';
  const duelConfig = useDuelConfig();
  const duelSession = useDuelSession();
  const execution = useDuelExecution();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (user && initialLoad) {
      duelSession.loadLatestDuel().finally(() => setInitialLoad(false));
    }
  }, [user]);

  // Auto-advance to next round after arbiter finishes (when userEvaluation is off)
  useEffect(() => {
    if (execution.executing || execution.arbiterRunning) return;
    if (!duelSession.session || duelSession.session.status === 'completed') return;
    if (duelConfig.config.userEvaluation) return; // user picks winner manually

    const completedRounds = duelSession.rounds.filter(r => r.status === 'completed');
    const lastCompleted = completedRounds[completedRounds.length - 1];
    if (!lastCompleted) return;

    // Check if last completed round has been judged
    const roundResults = duelSession.results.filter(r => r.round_id === lastCompleted.id);
    const allJudged = roundResults.length >= 2 && roundResults.every(r => r.status === 'judged');
    if (!allJudged) return;

    const nextRound = duelSession.rounds.find(r => r.round_index === lastCompleted.round_index + 1);
    if (nextRound && nextRound.status !== 'completed') {
      execution.executeDuelRound(
        duelSession.session!, nextRound, duelSession.results,
        duelSession.updateResult, duelConfig.config,
      );
    } else if (!nextRound) {
      // All rounds done — mark session completed
      duelSession.updateSessionStatus('completed');
    }
  }, [duelSession.results, execution.executing, execution.arbiterRunning]);

  const handleLaunch = async () => {
    const errors = duelConfig.validate();
    if (errors.length > 0) {
      const msg = errors.map(e => {
        const msgs: Record<string, { ru: string; en: string }> = {
          modelARequired: { ru: 'Выберите модель A', en: 'Select Model A' },
          modelBRequired: { ru: 'Выберите модель B', en: 'Select Model B' },
          sameModels: { ru: 'Модели должны быть разными', en: 'Models must be different' },
          promptRequired: { ru: 'Напишите стартовый промпт', en: 'Duel prompt required' },
        };
        return (msgs[e.messageKey] || {})[isRu ? 'ru' : 'en'] || e.messageKey;
      }).join('; ');
      toast({ variant: 'destructive', description: msg });
      return;
    }

    const result = await duelSession.createFromConfig(duelConfig.config);
    if (result) {
      toast({ description: isRu ? 'Дуэль началась!' : 'Duel started!' });
      await execution.executeDuelRound(result.session, result.rounds[0], result.results, duelSession.updateResult, duelConfig.config);
    }
  };

  const handleLoadFromHistory = async (sessionId: string) => {
    await duelSession.loadSession(sessionId);
  };

  // No session — launch UI (plan is in Contest Rules tab)
  if (!duelSession.session && !initialLoad) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                <Swords className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{getRatingsText('duelTitle', isRu)}</h2>
                <p className="text-sm text-muted-foreground">{getRatingsText('duelConfigureAndLaunch', isRu)}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleLaunch} className="gap-2" size="lg">
                <Play className="h-4 w-4" />
                {getRatingsText('duelLaunch', isRu)}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2" onClick={() => duelSession.loadHistory()}>
                    <Archive className="h-4 w-4" />
                    {getRatingsText('duelLoadArchive', isRu)}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[70vh]">
                  <DialogHeader>
                    <DialogTitle>{getRatingsText('duelLoadArchive', isRu)}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[50vh]">
                    <div className="space-y-2 pr-2">
                      {duelSession.sessionHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {getRatingsText('duelNoSaved', isRu)}
                        </p>
                      ) : (
                        duelSession.sessionHistory.map(s => (
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
                              {new Date(s.created_at).toLocaleDateString()}
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

  // Active duel view
  return (
    <DuelBattleView
      session={duelSession.session!}
      rounds={duelSession.rounds}
      results={duelSession.results}
      streamingTexts={execution.streamingTexts}
      executing={execution.executing}
      arbiterRunning={execution.arbiterRunning}
      isRu={isRu}
      onNewDuel={() => duelSession.setSession(null)}
      onFinishDuel={() => duelSession.updateSessionStatus('completed')}
      onPickRoundWinner={async (roundId, winnerId) => {
        // Record user pick in metadata
        const roundResults = duelSession.results.filter(r => r.round_id === roundId);
        for (const r of roundResults) {
          await duelSession.updateResult(r.id, {
            metadata: { ...(r.metadata || {}), user_winner: winnerId },
          } as any);
        }
        // Advance to next round
        const currentRound = duelSession.rounds.find(r => r.id === roundId);
        if (currentRound) {
          const nextRound = duelSession.rounds.find(r => r.round_index === currentRound.round_index + 1);
          if (nextRound) {
            await execution.executeDuelRound(
              duelSession.session!, nextRound, duelSession.results,
              duelSession.updateResult, duelConfig.config,
            );
          } else {
            // All rounds done
            await duelSession.updateSessionStatus('completed');
          }
        }
      }}
    />
  );
}
