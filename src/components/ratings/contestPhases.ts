import React from 'react';
import { Crown, Loader2, CheckCircle2, AlertCircle, MessageSquare, Scale, Trophy } from 'lucide-react';
import type { ContestResult } from '@/hooks/useContestSession';

export type ContestPhase = 'idle' | 'generating' | 'user_scoring' | 'arbiter_judging' | 'round_complete' | 'completed' | 'failed';

export function detectPhase(results: ContestResult[], status: string): { phase: ContestPhase; activeModelId?: string } {
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

export const PHASE_MESSAGES_RU: Record<ContestPhase, string[]> = {
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

export const PHASE_MESSAGES_EN: Record<ContestPhase, string[]> = {
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

export const PHASE_ICONS: Record<ContestPhase, React.ReactNode> = {
  idle: React.createElement(Crown, { className: "h-8 w-8 text-primary" }),
  generating: React.createElement(Loader2, { className: "h-8 w-8 animate-spin text-primary" }),
  user_scoring: React.createElement(MessageSquare, { className: "h-8 w-8 text-[hsl(var(--hydra-arbiter))]" }),
  arbiter_judging: React.createElement(Scale, { className: "h-8 w-8 text-[hsl(var(--hydra-expert))]" }),
  round_complete: React.createElement(CheckCircle2, { className: "h-8 w-8 text-[hsl(var(--hydra-success))]" }),
  completed: React.createElement(Trophy, { className: "h-8 w-8 text-[hsl(var(--hydra-arbiter))]" }),
  failed: React.createElement(AlertCircle, { className: "h-8 w-8 text-destructive" }),
};

/** Provider accent CSS variable map for active model highlights */
export const PROVIDER_ACCENT: Record<string, string> = {
  gemini: 'var(--hydra-arbiter)',
  openai: 'var(--hydra-success)',
  anthropic: 'var(--hydra-expert)',
  xai: 'var(--hydra-expert)',
  deepseek: 'var(--hydra-success)',
};
