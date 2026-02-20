import { useEffect } from 'react';

/**
 * Picks up contest migration data from sessionStorage and populates the input field.
 */
export function useContestMigration(setInput: (value: string) => void) {
  useEffect(() => {
    const raw = sessionStorage.getItem('contest-migration');
    if (!raw) return;
    sessionStorage.removeItem('contest-migration');
    try {
      const data = JSON.parse(raw);
      const winnersText = (data.winners || []).map((w: any, i: number) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const scores = `👤 ${w.avgUserScore?.toFixed(1) ?? '—'} + ⚖️ ${w.avgArbiterScore?.toFixed(1) ?? '—'} = ${w.totalScore?.toFixed(1) ?? '—'}`;
        return `${medal} **${w.displayName}** (${scores})\n> ${(w.bestResponse || '').slice(0, 500)}${(w.bestResponse || '').length > 500 ? '…' : ''}`;
      }).join('\n\n');

      const migrationMessage = `🏆 **${data.contestName || 'Конкурс'}** — победители:\n\n**Задача:** ${data.taskPrompt || '—'}\n\n${winnersText}\n\n---\n_Выбранные модели предлагаются как ролевые эксперты для решения задачи._`;
      setInput(migrationMessage);
    } catch { /* ignore */ }
  }, []);
}
