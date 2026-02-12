import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Scale, Users, BarChart3, Calculator, Weight } from 'lucide-react';
import { useContestConfig } from '@/hooks/useContestConfig';

interface ArbitrationConfig {
  juryMode: 'user' | 'arbiter' | 'both';
  criteria: string[];
  criteriaWeights: Record<string, number>;
  userWeight: number;
  scoringScheme: 'weighted-avg' | 'tournament' | 'elo';
}

const JURY_OPTIONS = [
  { id: 'user', ru: 'Только пользователь', en: 'User only' },
  { id: 'arbiter', ru: 'Только Арбитр (ИИ)', en: 'Arbiter (AI) only' },
  { id: 'both', ru: 'Пользователь + Арбитр', en: 'User + Arbiter' },
];

const CRITERIA_OPTIONS = [
  { id: 'factuality', ru: 'Фактологичность', en: 'Factuality' },
  { id: 'relevance', ru: 'Релевантность', en: 'Relevance' },
  { id: 'completeness', ru: 'Полнота', en: 'Completeness' },
  { id: 'creativity', ru: 'Креативность', en: 'Creativity' },
  { id: 'clarity', ru: 'Ясность', en: 'Clarity' },
  { id: 'consistency', ru: 'Консистентность', en: 'Consistency' },
  { id: 'cost_efficiency', ru: 'Стоимость (токены)', en: 'Cost (tokens)' },
  { id: 'speed', ru: 'Скорость ответа', en: 'Response Speed' },
];

const SCORING_OPTIONS = [
  { id: 'weighted-avg', ru: 'Средневзвешенный балл', en: 'Weighted Average' },
  { id: 'tournament', ru: 'Турнирная таблица', en: 'Tournament Table' },
  { id: 'elo', ru: 'Рейтинг Эло', en: 'Elo Rating' },
];

export function ContestArbitration() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { arbitration, updateArbitration } = useContestConfig();
  const [config, setConfig] = useState<ArbitrationConfig>(
    arbitration || {
      juryMode: 'both',
      criteria: ['factuality', 'relevance', 'completeness', 'clarity'],
      criteriaWeights: { factuality: 30, relevance: 25, completeness: 25, clarity: 20 },
      userWeight: 40,
      scoringScheme: 'weighted-avg',
    }
  );

  const toggleCriterion = (id: string) => {
    const updated = { ...config };
    const criteria = [...updated.criteria];
    const weights = { ...updated.criteriaWeights };
    const idx = criteria.indexOf(id);
    if (idx >= 0) {
      criteria.splice(idx, 1);
      delete weights[id];
    } else {
      criteria.push(id);
      weights[id] = 25;
    }
    const total = Object.values(weights).reduce((s, v) => s + v, 0);
    if (total > 0 && criteria.length > 0) {
      for (const k of Object.keys(weights)) {
        weights[k] = Math.round((weights[k] / total) * 100);
      }
      const diff = 100 - Object.values(weights).reduce((s, v) => s + v, 0);
      if (diff !== 0 && criteria.length > 0) {
        weights[criteria[0]] += diff;
      }
    }
    const newConfig = { ...updated, criteria, criteriaWeights: weights };
    setConfig(newConfig);
    updateArbitration(newConfig);
  };

  const setCriterionWeight = useCallback((id: string, value: number) => {
    const updated = { ...config, criteriaWeights: { ...config.criteriaWeights, [id]: value } };
    setConfig(updated);
    updateArbitration(updated);
  }, [config, updateArbitration]);

  const updateJuryMode = useCallback((juryMode: ArbitrationConfig['juryMode']) => {
    const updated = { ...config, juryMode };
    setConfig(updated);
    updateArbitration(updated);
  }, [config, updateArbitration]);

  const updateUserWeight = useCallback((userWeight: number) => {
    const updated = { ...config, userWeight };
    setConfig(updated);
    updateArbitration(updated);
  }, [config, updateArbitration]);

  const updateScoringScheme = useCallback((scoringScheme: ArbitrationConfig['scoringScheme']) => {
    const updated = { ...config, scoringScheme };
    setConfig(updated);
    updateArbitration(updated);
  }, [config, updateArbitration]);

  return (
    <HydraCard variant="default" className="border-border/50">
      <HydraCardHeader>
        <div className="flex items-center gap-2 text-hydra-arbiter">
          <Scale className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">
            {isRu ? 'Шаг 4' : 'Step 4'}
          </span>
        </div>
        <HydraCardTitle>
          {isRu ? 'Арбитраж конкурса' : 'Contest Arbitration'}
        </HydraCardTitle>
      </HydraCardHeader>

      <HydraCardContent className="space-y-4">
        {/* Jury composition */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            {isRu ? 'Состав жюри' : 'Jury Composition'}
          </label>
          <Select
            value={config.juryMode}
            onValueChange={updateJuryMode}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JURY_OPTIONS.map(o => (
                <SelectItem key={o.id} value={o.id} className="text-xs">
                  {isRu ? o.ru : o.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Jury weight slider — only shown when both */}
        {config.juryMode === 'both' && (
          <>
            <div className="space-y-2 p-2.5 rounded-md bg-muted/20 border border-border/20">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Weight className="h-3 w-3" />
                {isRu ? 'Вес оценки: Пользователь vs Арбитр' : 'Score Weight: User vs Arbiter'}
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 text-right">
                  {isRu ? 'Пользователь' : 'User'} {config.userWeight}%
                </span>
                <Slider
                  value={[config.userWeight]}
                  onValueChange={([v]) => updateUserWeight(v)}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-16">
                  {isRu ? 'Арбитр' : 'Arbiter'} {100 - config.userWeight}%
                </span>
              </div>
            </div>
          </>
        )}

        <Separator className="opacity-30" />

        {/* Evaluation criteria */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3" />
            {isRu ? 'Категории оценки кандидатов' : 'Candidate Evaluation Categories'}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {config.criteria.length}
            </Badge>
          </label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {CRITERIA_OPTIONS.map(c => (
              <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={config.criteria.includes(c.id)}
                  onCheckedChange={() => toggleCriterion(c.id)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs">{isRu ? c.ru : c.en}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Criteria weights — only when weighted-avg and criteria selected */}
        {config.scoringScheme === 'weighted-avg' && config.criteria.length > 0 && (
          <div className="space-y-2 p-2.5 rounded-md bg-muted/20 border border-border/20">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Weight className="h-3 w-3" />
              {isRu ? 'Веса критериев' : 'Criteria Weights'}
              <span className="text-[10px] opacity-50 normal-case font-normal">
                ({isRu ? 'сумма' : 'total'}: {Object.entries(config.criteriaWeights)
                  .filter(([k]) => config.criteria.includes(k))
                  .reduce((s, [, v]) => s + v, 0)}%)
              </span>
            </label>
            <div className="space-y-1.5">
              {config.criteria.map(cId => {
                const opt = CRITERIA_OPTIONS.find(o => o.id === cId);
                const weight = config.criteriaWeights[cId] || 0;
                return (
                  <div key={cId} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-28 truncate">
                      {opt ? (isRu ? opt.ru : opt.en) : cId}
                    </span>
                    <Slider
                      value={[weight]}
                      onValueChange={([v]) => setCriterionWeight(cId, v)}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-8 text-right">{weight}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Separator className="opacity-30" />

        {/* Scoring scheme */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="h-3 w-3" />
            {isRu ? 'Схема итоговой оценки' : 'Final Scoring Scheme'}
          </label>
          <Select
            value={config.scoringScheme}
            onValueChange={updateScoringScheme}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCORING_OPTIONS.map(o => (
                <SelectItem key={o.id} value={o.id} className="text-xs">
                  {isRu ? o.ru : o.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground/60">
            {config.scoringScheme === 'weighted-avg'
              ? (isRu ? 'Итоговый балл = среднее взвешенное по выбранным критериям' : 'Final score = weighted average across selected criteria')
              : config.scoringScheme === 'tournament'
              ? (isRu ? 'Модели проходят через сетку попарных сравнений' : 'Models go through a bracket of pairwise comparisons')
              : (isRu ? 'Динамический рейтинг по системе Эло на основе дуэлей' : 'Dynamic rating based on Elo system from duels')}
          </p>
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}
