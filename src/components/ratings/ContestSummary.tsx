import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, Trophy, Users, ListOrdered, ClipboardList, Scale, Workflow, Weight, BarChart3, Calculator } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

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

const PIPELINE_LABELS: Record<string, { ru: string; en: string }> = {
  none: { ru: 'Не нужен', en: 'Not needed' },
};

const MODE_LABELS: Record<string, { ru: string; en: string }> = {
  contest: { ru: 'Конкурс', en: 'Contest' },
  interview: { ru: 'Собеседование', en: 'Interview' },
};

interface ArbitrationConfig {
  juryMode: string;
  criteria: string[];
  criteriaWeights: Record<string, number>;
  userWeight: number;
  scoringScheme: string;
}

export function ContestSummary() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [modelCount, setModelCount] = useState(0);
  const [roundCount, setRoundCount] = useState(1);
  const [taskTitle, setTaskTitle] = useState('');
  const [mode, setMode] = useState('contest');
  const [pipeline, setPipeline] = useState('none');
  const [arbitration, setArbitration] = useState<ArbitrationConfig | null>(null);

  useEffect(() => {
    const sync = () => {
      try {
        const models = localStorage.getItem('hydra-contest-models');
        setModelCount(models ? Object.keys(JSON.parse(models)).length : 0);
      } catch {}
      try {
        const rules = localStorage.getItem('hydra-contest-rules');
        if (rules) setRoundCount(JSON.parse(rules).roundCount || 1);
      } catch {}
      try {
        const taskId = localStorage.getItem('hydra-contest-task-id');
        setTaskTitle(taskId ? (isRu ? 'Выбрана' : 'Selected') : '');
      } catch {}
      try {
        setMode(localStorage.getItem('hydra-contest-mode') || 'contest');
      } catch {}
      try {
        setPipeline(localStorage.getItem('hydra-contest-pipeline') || 'none');
      } catch {}
      try {
        const arb = localStorage.getItem('hydra-contest-arbitration');
        if (arb) setArbitration(JSON.parse(arb));
      } catch {}
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [isRu]);

  const label = (map: Record<string, { ru: string; en: string }>, key: string) =>
    map[key] ? (isRu ? map[key].ru : map[key].en) : key;

  return (
    <HydraCard variant="default" glow className="border-border/50">
      <HydraCardHeader>
        <div className="flex items-center gap-2 text-hydra-amber">
          <Trophy className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">
            {isRu ? 'Шаг 5' : 'Step 5'}
          </span>
        </div>
        <HydraCardTitle>
          {isRu ? 'Предпросмотр и запуск' : 'Preview & Launch'}
        </HydraCardTitle>
      </HydraCardHeader>

      <HydraCardContent className="space-y-3">
        {/* Basic info row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <SummaryItem icon={<ClipboardList className="h-3.5 w-3.5" />} label={isRu ? 'Режим' : 'Mode'} value={label(MODE_LABELS, mode)} />
          <SummaryItem icon={<Users className="h-3.5 w-3.5" />} label={isRu ? 'Участников' : 'Participants'} value={String(modelCount)} />
          <SummaryItem icon={<ListOrdered className="h-3.5 w-3.5" />} label={isRu ? 'Туров' : 'Rounds'} value={String(roundCount)} />
          <SummaryItem icon={<ClipboardList className="h-3.5 w-3.5" />} label={isRu ? 'Задача' : 'Task'} value={taskTitle || (isRu ? 'Не выбрана' : 'Not selected')} />
          <SummaryItem icon={<Workflow className="h-3.5 w-3.5" />} label={isRu ? 'Пайплайн' : 'Pipeline'} value={label(PIPELINE_LABELS, pipeline)} />
        </div>

        {/* Arbitration details */}
        {arbitration && (
          <>
            <Separator className="opacity-30" />
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Scale className="h-3 w-3" />
                {isRu ? 'Арбитраж' : 'Arbitration'}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                <SummaryItem icon={<Users className="h-3.5 w-3.5" />} label={isRu ? 'Жюри' : 'Jury'} value={label(JURY_LABELS, arbitration.juryMode)} />
                <SummaryItem icon={<Calculator className="h-3.5 w-3.5" />} label={isRu ? 'Схема' : 'Scheme'} value={label(SCORING_LABELS, arbitration.scoringScheme)} />
              </div>

              {/* User vs Arbiter weights */}
              {arbitration.juryMode === 'both' && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Weight className="h-3 w-3 shrink-0" />
                  <span>{isRu ? 'Пользователь' : 'User'} {arbitration.userWeight}%</span>
                  <span className="opacity-40">/</span>
                  <span>{isRu ? 'Арбитр' : 'Arbiter'} {100 - arbitration.userWeight}%</span>
                </div>
              )}

              {/* Criteria with weights */}
              {arbitration.criteria.length > 0 && (
                <div className="flex items-start gap-2">
                  <BarChart3 className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {arbitration.criteria.map(c => {
                      const w = arbitration.criteriaWeights?.[c];
                      return (
                        <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                          {label(CRITERIA_LABELS, c)}
                          {arbitration.scoringScheme === 'weighted-avg' && w != null && (
                            <span className="opacity-50">{w}%</span>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <Separator className="opacity-30" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button disabled className="w-full gap-2 hydra-glow-sm" size="lg">
                  <Play className="h-4 w-4" />
                  {isRu ? 'Начать конкурс' : 'Start Contest'}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {isRu
                  ? 'Функция запуска будет доступна позже'
                  : 'Launch feature will be available later'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </HydraCardContent>
    </HydraCard>
  );
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {icon}
      <span>{label}:</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
