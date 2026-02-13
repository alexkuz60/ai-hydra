import React from 'react';
import { Swords, Loader2, CheckCircle2, AlertCircle, MessageSquare, Scale, Trophy, ShieldAlert } from 'lucide-react';
import type { ContestResult } from '@/hooks/useContestSession';

export type DuelPhase =
  | 'idle'
  | 'generating_a'
  | 'generating_b'
  | 'user_pick'
  | 'arbiter_judging'
  | 'round_complete'
  | 'completed'
  | 'failed';

/** Detect current duel phase from results and session status */
export function detectDuelPhase(
  results: ContestResult[],
  status: string,
  modelA: string,
  modelB: string,
): { phase: DuelPhase; activeModelId?: string } {
  if (status === 'completed') return { phase: 'completed' };
  if (status === 'draft' || status === 'paused') return { phase: 'idle' };

  const generatingA = results.find(r => r.status === 'generating' && r.model_id === modelA);
  if (generatingA) return { phase: 'generating_a', activeModelId: modelA };

  const generatingB = results.find(r => r.status === 'generating' && r.model_id === modelB);
  if (generatingB) return { phase: 'generating_b', activeModelId: modelB };

  const readyNoUserScore = results.find(r => r.status === 'ready' && r.user_score == null);
  if (readyNoUserScore) return { phase: 'user_pick', activeModelId: readyNoUserScore.model_id };

  const readyNoArbiter = results.find(r => r.status === 'ready' && r.arbiter_score == null && r.user_score != null);
  if (readyNoArbiter) return { phase: 'arbiter_judging', activeModelId: readyNoArbiter.model_id };

  const failed = results.find(r => r.status === 'failed');
  if (failed) return { phase: 'failed', activeModelId: failed.model_id };

  if (results.length > 0 && results.every(r => r.status === 'judged')) return { phase: 'round_complete' };

  return { phase: 'idle' };
}

export const DUEL_PHASE_MESSAGES_RU: Record<DuelPhase, string[]> = {
  idle: ['Дуэлянты ожидают сигнала…', 'Секунданты проверяют оружие.'],
  generating_a: [
    'Дуэлянт {modelA} выходит к барьеру!',
    '{modelA} обдумывает свой аргумент…',
    '{modelA} формулирует контрудар!',
  ],
  generating_b: [
    'Дуэлянт {modelB} выходит к барьеру!',
    '{modelB} парирует аргумент противника…',
    '{modelB} готовит ответный выпад!',
  ],
  user_pick: [
    'Ваш ход — выберите победителя раунда!',
    'Кто убедительнее? Решение за вами.',
  ],
  arbiter_judging: [
    'Секунданты оценивают раунд…',
    'Арбитр выносит вердикт по раунду.',
  ],
  round_complete: [
    'Раунд завершён! Дуэлянты переводят дух.',
    'Очко присуждено — следующий раунд!',
  ],
  completed: [
    'Дуэль завершена! Победитель определён. ⚔️',
    'К барьеру больше не зовут — итоги зафиксированы.',
  ],
  failed: [
    'Ошибка во время дуэли — технический сбой.',
    'Один из дуэлянтов не смог ответить.',
  ],
};

export const DUEL_PHASE_MESSAGES_EN: Record<DuelPhase, string[]> = {
  idle: ['Duelists await the signal…', 'Seconds are checking the weapons.'],
  generating_a: [
    'Duelist {modelA} steps to the barrier!',
    '{modelA} crafts their argument…',
    '{modelA} prepares a counter-strike!',
  ],
  generating_b: [
    'Duelist {modelB} steps to the barrier!',
    '{modelB} parries the opponent\'s argument…',
    '{modelB} readies a riposte!',
  ],
  user_pick: [
    'Your move — pick the round winner!',
    'Who was more convincing? You decide.',
  ],
  arbiter_judging: [
    'Seconds evaluate the round…',
    'The arbiter delivers the verdict.',
  ],
  round_complete: [
    'Round complete! Duelists catch their breath.',
    'Point awarded — next round!',
  ],
  completed: [
    'Duel complete! The winner is determined. ⚔️',
    'No more calls to the barrier — results are final.',
  ],
  failed: [
    'Error during the duel — technical failure.',
    'One of the duelists could not respond.',
  ],
};

export const DUEL_PHASE_ICONS: Record<DuelPhase, React.ReactNode> = {
  idle: React.createElement(Swords, { className: 'h-8 w-8 text-primary' }),
  generating_a: React.createElement(Loader2, { className: 'h-8 w-8 animate-spin text-primary' }),
  generating_b: React.createElement(Loader2, { className: 'h-8 w-8 animate-spin text-primary' }),
  user_pick: React.createElement(MessageSquare, { className: 'h-8 w-8 text-[hsl(var(--hydra-arbiter))]' }),
  arbiter_judging: React.createElement(Scale, { className: 'h-8 w-8 text-[hsl(var(--hydra-expert))]' }),
  round_complete: React.createElement(CheckCircle2, { className: 'h-8 w-8 text-[hsl(var(--hydra-success))]' }),
  completed: React.createElement(Trophy, { className: 'h-8 w-8 text-[hsl(var(--hydra-arbiter))]' }),
  failed: React.createElement(AlertCircle, { className: 'h-8 w-8 text-destructive' }),
};
