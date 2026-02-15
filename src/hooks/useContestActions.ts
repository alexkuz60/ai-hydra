import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { getRatingsText } from '@/components/ratings/i18n';
import type { ContestSession, ContestRound, ContestResult } from '@/hooks/useContestSession';

// ── Types shared with the execution hook ──

interface ExecutionHandle {
  executeRound: (
    session: ContestSession,
    round: ContestRound,
    results: ContestResult[],
    updateResult: (id: string, u: Partial<ContestResult>) => Promise<void>,
    allRounds: ContestRound[],
  ) => Promise<void>;
  executing: boolean;
}

interface ContestHandle {
  session: ContestSession | null;
  results: ContestResult[];
  rounds: ContestRound[];
  createFromWizard: () => Promise<{ session: ContestSession; rounds: ContestRound[]; results: ContestResult[] } | null>;
  createFollowUpRound: (prompt: string, targetModelIds?: string[]) => Promise<{ round: ContestRound; results: ContestResult[] } | null>;
  updateResult: (id: string, u: Partial<ContestResult>) => Promise<void>;
}

interface UseContestActionsOptions {
  userId: string | undefined;
  contest: ContestHandle;
  execution: ExecutionHandle;
  isRu: boolean;
}

export function useContestActions({ userId, contest, execution, isRu }: UseContestActionsOptions) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [savingToTask, setSavingToTask] = useState(false);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  const { session, results, rounds } = contest;

  // ── Launch contest from wizard config ──

  const handleLaunch = useCallback(async () => {
    const result = await contest.createFromWizard();
    if (result) {
      toast({ description: getRatingsText('contestLaunched', isRu) });
      const firstRound = result.rounds.find(r => r.status === 'running') || result.rounds[0];
      if (firstRound) {
        await execution.executeRound(result.session, firstRound, result.results, contest.updateResult, result.rounds);
      }
    }
  }, [contest, execution, isRu, toast]);

  // ── Send follow-up question ──

  const handleSendFollowUp = useCallback(async (followUpText: string, activeModel: string) => {
    if (!followUpText.trim() || !session) return;
    setSendingFollowUp(true);
    try {
      const targetModels = activeModel === 'all' ? undefined : [activeModel];
      const followUp = await contest.createFollowUpRound(followUpText.trim(), targetModels);
      if (followUp) {
        const targetName = activeModel === 'all'
          ? getRatingsText('all', isRu)
          : (getModelRegistryEntry(activeModel)?.displayName || activeModel.split('/').pop());
        toast({ description: `${getRatingsText('questionSentTo', isRu)} ${targetName}` });
        await execution.executeRound(session, followUp.round, [...results, ...followUp.results], contest.updateResult, rounds);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', description: err.message });
    } finally {
      setSendingFollowUp(false);
    }
  }, [session, results, rounds, contest, execution, isRu, toast]);

  // ── Migrate winners to Expert Panel ──

  const handleMigrateToExpertPanel = useCallback((selectedWinners: Set<string>) => {
    if (selectedWinners.size === 0 || !session) return;

    const winnerModels = [...selectedWinners];
    const winnerResults = results.filter(r => winnerModels.includes(r.model_id));
    const taskPrompt = rounds[0]?.prompt || '';

    const migrationData = {
      contestName: session.name,
      taskPrompt,
      winners: winnerModels.map(modelId => {
        const entry = getModelRegistryEntry(modelId);
        const modelResults = winnerResults.filter(r => r.model_id === modelId);
        const userScores = modelResults.filter(r => r.user_score != null).map(r => r.user_score!);
        const arbiterScores = modelResults.filter(r => r.arbiter_score != null).map(r => r.arbiter_score!);
        const avgUser = userScores.length ? userScores.reduce((a, b) => a + b, 0) / userScores.length : null;
        const avgArbiter = arbiterScores.length ? arbiterScores.reduce((a, b) => a + b, 0) / arbiterScores.length : null;
        const bestResponse = modelResults.find(r => r.response_text)?.response_text || '';
        return {
          modelId,
          displayName: entry?.displayName || modelId.split('/').pop() || modelId,
          provider: entry?.provider || null,
          avgUserScore: avgUser,
          avgArbiterScore: avgArbiter,
          totalScore: (avgUser ?? 0) + (avgArbiter ?? 0),
          bestResponse,
        };
      }).sort((a, b) => b.totalScore - a.totalScore),
    };

    sessionStorage.setItem('contest-migration', JSON.stringify(migrationData));
    navigate('/expert-panel');
    toast({ description: `${selectedWinners.size} ${getRatingsText('winnersToExpertPanel', isRu)}` });
  }, [session, results, rounds, navigate, isRu, toast]);

  // ── Save contest results to a task ──

  const handleSaveToTask = useCallback(async () => {
    if (!userId || !session) return;
    const taskId = session.config?.taskId;
    if (!taskId) {
      toast({ variant: 'destructive', description: isRu ? 'Задача не выбрана в конфигурации конкурса' : 'No task selected in contest config' });
      return;
    }
    const exportableResults = results.filter(r => r.response_text);
    if (exportableResults.length === 0) {
      toast({ variant: 'destructive', description: getRatingsText('noScoredResponses', isRu) });
      return;
    }
    setSavingToTask(true);
    try {
      const messages: Array<{
        session_id: string; user_id: string; role: string;
        content: string; model_name: string | null; metadata: Record<string, unknown>;
      }> = [];

      const resultsByRound = new Map<string, typeof exportableResults>();
      for (const result of exportableResults) {
        const arr = resultsByRound.get(result.round_id) || [];
        arr.push(result);
        resultsByRound.set(result.round_id, arr);
      }

      const initialRoundCount = session.config?.rules?.roundCount ?? rounds.length;

      for (const round of rounds) {
        const roundResults = resultsByRound.get(round.id);
        if (!roundResults || roundResults.length === 0) continue;

        const isFollowUp = round.round_index >= initialRoundCount;

        if (round.prompt) {
          messages.push({
            session_id: taskId,
            user_id: userId,
            role: 'user',
            content: round.prompt,
            model_name: null,
            metadata: {
              source: 'contest',
              contest_session_id: session.id,
              round_index: round.round_index,
              ...(isFollowUp && { is_follow_up: true }),
            },
          });
        }

        const sorted = [...roundResults].sort((a, b) => a.model_id.localeCompare(b.model_id));
        for (const result of sorted) {
          messages.push({
            session_id: taskId,
            user_id: userId,
            role: 'assistant',
            content: result.response_text!,
            model_name: result.model_id,
            metadata: {
              source: 'contest',
              contest_session_id: session.id,
              round_index: round.round_index,
              user_score: result.user_score,
              arbiter_score: result.arbiter_score,
              criteria_scores: result.criteria_scores,
              response_time_ms: result.response_time_ms,
              token_count: result.token_count,
              rating: result.user_score != null ? result.user_score : 0,
              ...(isFollowUp && { is_follow_up: true }),
            },
          });

          if (result.arbiter_score != null || result.arbiter_comment) {
            const criteriaLines = result.criteria_scores
              ? Object.entries(result.criteria_scores as Record<string, number>)
                  .map(([k, v]) => `- **${k}**: ${v}/10`)
                  .join('\n')
              : '';
            const arbiterContent = [
              result.arbiter_comment || '',
              criteriaLines ? `\n${criteriaLines}` : '',
              result.arbiter_score != null ? `\n**⚖️ ${result.arbiter_score}/10**` : '',
            ].filter(Boolean).join('\n');

            messages.push({
              session_id: taskId,
              user_id: userId,
              role: 'arbiter',
              content: arbiterContent,
              model_name: result.arbiter_model || null,
              metadata: {
                source: 'contest',
                contest_session_id: session.id,
                round_index: round.round_index,
                arbiter_score: result.arbiter_score,
                criteria_scores: result.criteria_scores,
                evaluated_model: result.model_id,
                ...(isFollowUp && { is_follow_up: true }),
              },
            });
          }
        }
      }

      const { error: msgErr } = await supabase.from('messages').insert(messages as any);
      if (msgErr) throw msgErr;

      toast({ description: getRatingsText('savedToTask', isRu) });
      navigate('/tasks');
    } catch (err: any) {
      toast({ variant: 'destructive', description: err.message });
    } finally {
      setSavingToTask(false);
    }
  }, [userId, session, results, rounds, isRu, toast, navigate]);

  return {
    handleLaunch,
    handleSendFollowUp,
    handleMigrateToExpertPanel,
    handleSaveToTask,
    savingToTask,
    sendingFollowUp,
  };
}
