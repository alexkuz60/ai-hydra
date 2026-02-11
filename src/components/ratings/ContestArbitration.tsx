import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Scale, Users, BarChart3, Calculator } from 'lucide-react';

const STORAGE_KEY = 'hydra-contest-arbitration';

interface ArbitrationConfig {
  juryMode: 'user' | 'arbiter' | 'both';
  arbiterModel: string;
  criteria: string[];
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

function loadConfig(): ArbitrationConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    juryMode: 'both',
    arbiterModel: '',
    criteria: ['factuality', 'relevance', 'completeness', 'clarity'],
    scoringScheme: 'weighted-avg',
  };
}

export function ContestArbitration() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [config, setConfig] = useState<ArbitrationConfig>(loadConfig);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch {}
  }, [config]);

  const toggleCriterion = (id: string) => {
    setConfig(prev => {
      const criteria = [...prev.criteria];
      const idx = criteria.indexOf(id);
      if (idx >= 0) criteria.splice(idx, 1); else criteria.push(id);
      return { ...prev, criteria };
    });
  };

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
            onValueChange={v => setConfig(prev => ({ ...prev, juryMode: v as ArbitrationConfig['juryMode'] }))}
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

        <Separator className="opacity-30" />

        {/* Scoring scheme */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="h-3 w-3" />
            {isRu ? 'Схема итоговой оценки' : 'Final Scoring Scheme'}
          </label>
          <Select
            value={config.scoringScheme}
            onValueChange={v => setConfig(prev => ({ ...prev, scoringScheme: v as ArbitrationConfig['scoringScheme'] }))}
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
