import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ContestResult } from '@/hooks/useContestSession';
import { useToast } from '@/hooks/use-toast';

interface UseContestAutoAdvanceOptions {
  executing: boolean;
  arbiterRunning: boolean;
  session: { id: string; status: string; config: any } | null;
  rounds: Array<{ id: string; round_index: number; status: string; prompt: string }>;
  results: ContestResult[];
  updateResult: (id: string, updates: Partial<ContestResult>) => Promise<void>;
  executeRound: (
    session: any,
    round: any,
    results: ContestResult[],
    updateResult: any,
    rounds: any[],
  ) => Promise<void>;
  isRu: boolean;
}

/**
 * Auto-advances to the next pre-planned round after current one completes.
 */
export function useContestAutoAdvance({
  executing,
  arbiterRunning,
  session,
  rounds,
  results,
  updateResult,
  executeRound,
  isRu,
}: UseContestAutoAdvanceOptions) {
  const { toast } = useToast();

  useEffect(() => {
    if (executing || arbiterRunning) return;
    if (!session || session.status !== 'running') return;
    if (rounds.length === 0) return;

    const completedRounds = rounds.filter(r => r.status === 'completed');
    if (completedRounds.length === 0) return;

    const lastCompleted = completedRounds.sort((a, b) => b.round_index - a.round_index)[0];

    const lastRoundResults = results.filter(r => r.round_id === lastCompleted.id);
    const allDone = lastRoundResults.length > 0 && lastRoundResults.every(
      r => r.status === 'judged' || r.status === 'ready' || r.status === 'failed'
    );
    if (!allDone) return;

    const nextRound = rounds.find(
      r => r.round_index === lastCompleted.round_index + 1 && r.status === 'pending'
    );
    if (!nextRound) return;

    const nextRoundResults = results.filter(r => r.round_id === nextRound.id);
    const roundLabel = `${isRu ? 'Тур' : 'Round'} ${nextRound.round_index + 1}`;
    toast({ description: isRu ? `⏭ Автопереход: ${roundLabel} начинается…` : `⏭ Auto-advance: ${roundLabel} starting…` });

    if (nextRoundResults.length > 0) {
      executeRound(session, nextRound, results, updateResult, rounds);
    } else {
      const eliminated: string[] = (session.config as any).eliminatedModels || [];
      const modelIds = Object.keys(session.config.models || {}).filter(id => !eliminated.includes(id));
      if (modelIds.length === 0) return;

      (async () => {
        const { data: resultsData } = await supabase
          .from('contest_results')
          .insert(modelIds.map(modelId => ({
            round_id: nextRound.id,
            session_id: session.id,
            model_id: modelId,
            status: 'pending',
          })))
          .select();

        if (resultsData) {
          const newResults = resultsData as unknown as ContestResult[];
          executeRound(session, nextRound, [...results, ...newResults], updateResult, rounds);
        }
      })();
    }
  }, [executing, arbiterRunning, rounds, results, session]);
}
