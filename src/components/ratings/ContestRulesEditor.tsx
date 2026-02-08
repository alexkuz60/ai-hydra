import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const STORAGE_KEY = 'hydra-contest-rules';

interface RoundConfig {
  type: 'free' | 'role';
  prompt: string;
  criteria: string[];
}

interface ContestRules {
  roundCount: number;
  rounds: RoundConfig[];
  elimination: string;
}

const CRITERIA_OPTIONS = [
  { id: 'accuracy', ru: 'Точность', en: 'Accuracy' },
  { id: 'completeness', ru: 'Полнота', en: 'Completeness' },
  { id: 'creativity', ru: 'Креативность', en: 'Creativity' },
  { id: 'structure', ru: 'Структурированность', en: 'Structure' },
  { id: 'practicality', ru: 'Практичность', en: 'Practicality' },
];

const ELIMINATION_OPTIONS = [
  { id: 'all-pass', ru: 'Все проходят', en: 'All pass' },
  { id: 'worst-percent', ru: 'Худшие N% выбывают', en: 'Worst N% eliminated' },
  { id: 'threshold', ru: 'Ниже порога X баллов', en: 'Below score threshold' },
  { id: 'manual', ru: 'Ручной отбор', en: 'Manual selection' },
];

function defaultRound(): RoundConfig {
  return { type: 'free', prompt: '', criteria: ['accuracy', 'completeness'] };
}

function loadRules(): ContestRules {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { roundCount: 1, rounds: [defaultRound()], elimination: 'all-pass' };
}

export function ContestRulesEditor() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [rules, setRules] = useState<ContestRules>(loadRules);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)); } catch {}
  }, [rules]);

  const setRoundCount = (count: number) => {
    setRules(prev => {
      const rounds = [...prev.rounds];
      while (rounds.length < count) rounds.push(defaultRound());
      return { ...prev, roundCount: count, rounds: rounds.slice(0, count) };
    });
  };

  const updateRound = (idx: number, patch: Partial<RoundConfig>) => {
    setRules(prev => {
      const rounds = [...prev.rounds];
      rounds[idx] = { ...rounds[idx], ...patch };
      return { ...prev, rounds };
    });
  };

  const toggleCriterion = (roundIdx: number, criterionId: string) => {
    setRules(prev => {
      const rounds = [...prev.rounds];
      const criteria = [...rounds[roundIdx].criteria];
      const idx = criteria.indexOf(criterionId);
      if (idx >= 0) criteria.splice(idx, 1); else criteria.push(criterionId);
      rounds[roundIdx] = { ...rounds[roundIdx], criteria };
      return { ...prev, rounds };
    });
  };

  return (
    <HydraCard variant="default" className="border-border/50">
      <HydraCardHeader>
        <div className="flex items-center gap-2 text-hydra-purple">
          <Settings2 className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">
            {isRu ? 'Шаг 2' : 'Step 2'}
          </span>
        </div>
        <HydraCardTitle>
          {isRu ? 'Правила конкурса' : 'Contest Rules'}
        </HydraCardTitle>
      </HydraCardHeader>

      <HydraCardContent className="space-y-4">
        {/* Round count */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ListOrdered className="h-3 w-3" />
            {isRu ? 'Количество туров' : 'Number of Rounds'}
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(n => (
              <Button
                key={n}
                variant={rules.roundCount === n ? 'default' : 'outline'}
                size="sm"
                className="w-10 h-8"
                onClick={() => setRoundCount(n)}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>

        {/* Each round */}
        {rules.rounds.slice(0, rules.roundCount).map((round, idx) => (
          <div key={idx} className="space-y-3">
            {idx > 0 && <Separator className="opacity-30" />}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-1.5">
                {isRu ? `Тур ${idx + 1}` : `Round ${idx + 1}`}
              </Badge>
            </div>

            {/* Task type */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground">
                {isRu ? 'Тип задания' : 'Assignment Type'}
              </label>
              <div className="flex gap-1.5">
                {(['free', 'role'] as const).map(t => (
                  <Button
                    key={t}
                    variant={round.type === t ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => updateRound(idx, { type: t })}
                  >
                    {t === 'free'
                      ? (isRu ? 'Свободный промпт' : 'Free Prompt')
                      : (isRu ? 'По роли' : 'Role-based')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground">
                {isRu ? 'Промпт тура' : 'Round Prompt'}
              </label>
              <Textarea
                value={round.prompt}
                onChange={e => updateRound(idx, { prompt: e.target.value })}
                placeholder={isRu ? 'Введите задание для моделей...' : 'Enter assignment for models...'}
                className="min-h-[60px] text-xs resize-none"
              />
            </div>

            {/* Criteria */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground">
                {isRu ? 'Критерии оценки' : 'Evaluation Criteria'}
              </label>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {CRITERIA_OPTIONS.map(c => (
                  <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={round.criteria.includes(c.id)}
                      onCheckedChange={() => toggleCriterion(idx, c.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs">{isRu ? c.ru : c.en}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Elimination rule */}
        {rules.roundCount > 1 && (
          <>
            <Separator className="opacity-30" />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {isRu ? 'Правило прохождения' : 'Elimination Rule'}
              </label>
              <Select
                value={rules.elimination}
                onValueChange={v => setRules(prev => ({ ...prev, elimination: v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ELIMINATION_OPTIONS.map(o => (
                    <SelectItem key={o.id} value={o.id} className="text-xs">
                      {isRu ? o.ru : o.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </HydraCardContent>
    </HydraCard>
  );
}
