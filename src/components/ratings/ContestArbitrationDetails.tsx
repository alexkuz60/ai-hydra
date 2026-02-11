import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Scale, Users, Calculator, Weight, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SummaryItem } from './ContestSummaryItem';

const CRITERIA_LABELS: Record<string, { ru: string; en: string }> = {
  factuality: { ru: 'Фактологичность', en: 'Factuality' },
  relevance: { ru: 'Релевантность', en: 'Relevance' },
  completeness: { ru: 'Полнота', en: 'Completeness' },
  creativity: { ru: 'Креативность', en: 'Creativity' },
  clarity: { ru: 'Ясность', en: 'Clarity' },
  consistency: { ru: 'Консистентность', en: 'Consistency' },
  cost_efficiency: { ru: 'Стоимость', en: 'Cost' },
  speed: { ru: 'Скорость', en: 'Speed' },
};

const JURY_LABELS: Record<string, { ru: string; en: string }> = {
  user: { ru: 'Пользователь', en: 'User only' },
  arbiter: { ru: 'Арбитр (ИИ)', en: 'Arbiter (AI)' },
  both: { ru: 'Пользователь + Арбитр', en: 'User + Arbiter' },
};

const SCORING_LABELS: Record<string, { ru: string; en: string }> = {
  'weighted-avg': { ru: 'Средневзвешенный', en: 'Weighted Avg' },
  tournament: { ru: 'Турнирная таблица', en: 'Tournament' },
  elo: { ru: 'Рейтинг Эло', en: 'Elo Rating' },
};

interface ArbitrationConfig {
  juryMode: string;
  criteria: string[];
  criteriaWeights: Record<string, number>;
  userWeight: number;
  scoringScheme: string;
}

interface ContestArbitrationDetailsProps {
  arbitration: ArbitrationConfig | null;
}

export function ContestArbitrationDetails({
  arbitration,
}: ContestArbitrationDetailsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!arbitration) return null;

  const label = (map: Record<string, { ru: string; en: string }>, key: string) =>
    map[key] ? (isRu ? map[key].ru : map[key].en) : key;

  return (
    <>
      <Separator className="opacity-30" />
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <Scale className="h-3 w-3" />
          {isRu ? 'Арбитраж' : 'Arbitration'}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <SummaryItem
            icon={<Users className="h-3.5 w-3.5" />}
            label={isRu ? 'Жюри' : 'Jury'}
            value={label(JURY_LABELS, arbitration.juryMode)}
          />
          <SummaryItem
            icon={<Calculator className="h-3.5 w-3.5" />}
            label={isRu ? 'Схема' : 'Scheme'}
            value={label(SCORING_LABELS, arbitration.scoringScheme)}
          />
        </div>

        {arbitration.juryMode === 'both' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Weight className="h-3 w-3 shrink-0" />
            <span>{isRu ? 'Пользователь' : 'User'} {arbitration.userWeight}%</span>
            <span className="opacity-40">/</span>
            <span>{isRu ? 'Арбитр' : 'Arbiter'} {100 - arbitration.userWeight}%</span>
          </div>
        )}

        {arbitration.criteria.length > 0 && (
          <div className="flex items-start gap-2">
            <BarChart3 className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {arbitration.criteria.map((c) => {
                const w = arbitration.criteriaWeights?.[c];
                return (
                  <Badge
                    key={c}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 gap-1"
                  >
                    {label(CRITERIA_LABELS, c)}
                    {arbitration.scoringScheme === 'weighted-avg' &&
                      w != null && <span className="opacity-50">{w}%</span>}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
