import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, ListOrdered, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useContestConfig } from '@/hooks/useContestConfig';
import { EXPERT_ROLES, ROLE_CONFIG, ROLE_SPECIFIC_CRITERIA, type AgentRole } from '@/config/roles';
import { RoleSelectItem, RoleDisplay } from '@/components/ui/RoleSelectItem';
import { mergeRoleCriteria, getCriteriaLabel, isRoleSpecificCriteria } from '@/lib/contestRoleCriteria';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface RoundConfig {
  type: 'free' | 'role';
  prompt: string;
  criteria: string[];
  roleForEvaluation?: string;
}

// Expert roles available for role-based contests (excluding critic — has its own specifics)
const CONTEST_EXPERT_ROLES = EXPERT_ROLES.filter(r => r !== 'critic' && r !== 'arbiter');

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
  return { type: 'free', prompt: '', criteria: ['accuracy', 'completeness'], roleForEvaluation: undefined };
}

export function ContestRulesEditor() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { rules, updateRules } = useContestConfig();
  
  const defaultRules = { roundCount: 1, rounds: [defaultRound()], elimination: 'all-pass' };
  const [localRules, setLocalRules] = useState(rules || defaultRules);

  const setRoundCount = (count: number) => {
    const updated = { ...localRules };
    const rounds = [...updated.rounds];
    while (rounds.length < count) rounds.push(defaultRound());
    updated.roundCount = count;
    updated.rounds = rounds.slice(0, count);
    setLocalRules(updated);
    updateRules(updated);
  };

  const updateRound = (idx: number, patch: Partial<RoundConfig>) => {
    const updated = { ...localRules };
    const rounds = [...updated.rounds];
    rounds[idx] = { ...rounds[idx], ...patch };
    updated.rounds = rounds;
    setLocalRules(updated);
    updateRules(updated);
  };

  const toggleCriterion = (roundIdx: number, criterionId: string) => {
    const updated = { ...localRules };
    const rounds = [...updated.rounds];
    const criteria = [...rounds[roundIdx].criteria];
    const idx = criteria.indexOf(criterionId);
    if (idx >= 0) criteria.splice(idx, 1); else criteria.push(criterionId);
    rounds[roundIdx] = { ...rounds[roundIdx], criteria };
    updated.rounds = rounds;
    setLocalRules(updated);
    updateRules(updated);
  };

  return (
    <HydraCard variant="default" className="border-border/50">
      <HydraCardHeader>
        <div className="flex items-center gap-2 text-hydra-expert">
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
                variant={localRules.roundCount === n ? 'default' : 'outline'}
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
         {localRules.rounds.slice(0, localRules.roundCount).map((round, idx) => (
          <div key={idx} className="space-y-3">
            {idx > 0 && <Separator className="opacity-30" />}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] px-1.5">
                {isRu ? `Тур ${idx + 1}` : `Round ${idx + 1}`}
              </Badge>
            </div>

            {/* Task type + inline role selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground">
                {isRu ? 'Тип задания' : 'Assignment Type'}
              </label>
              <div className="flex items-center gap-1.5">
                {(['free', 'role'] as const).map(t => (
                  <Button
                    key={t}
                    variant={round.type === t ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => updateRound(idx, { type: t, ...(t === 'free' ? { roleForEvaluation: undefined } : {}) })}
                  >
                    {t === 'free'
                      ? (isRu ? 'Свободный промпт' : 'Free Prompt')
                      : (isRu ? 'По роли' : 'Role-based')}
                  </Button>
                ))}

                {/* Inline role selector */}
                {round.type === 'role' && (
                  <>
                    <Select
                      value={round.roleForEvaluation || ''}
                      onValueChange={v => updateRound(idx, { roleForEvaluation: v || undefined })}
                    >
                      <SelectTrigger className="h-7 text-xs w-[160px]">
                        <SelectValue placeholder={isRu ? 'Роль...' : 'Role...'}>
                          {round.roleForEvaluation && (
                            <RoleDisplay role={round.roleForEvaluation as AgentRole} />
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {CONTEST_EXPERT_ROLES.map(role => (
                          <RoleSelectItem key={role} value={role} />
                        ))}
                      </SelectContent>
                    </Select>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          <p className="text-[10px]">
                            {isRu
                              ? 'Ролевой промпт из Штатного расписания будет автоматически объединён с промптом тура. Ролевые критерии оценки добавятся к плану.'
                              : 'Role system prompt from Staff will be merged with round prompt. Role-specific evaluation criteria will be added to the plan.'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </div>

              {/* Role criteria preview below */}
              {round.type === 'role' && round.roleForEvaluation && (
                <div className="p-2 rounded-md bg-muted/20 border border-border/20 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {isRu ? 'Критерии роли (добавятся автоматически):' : 'Role criteria (auto-added):'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(ROLE_SPECIFIC_CRITERIA[round.roleForEvaluation as AgentRole] || []).map(c => (
                      <Badge key={c} variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/5 border-primary/20">
                        {getCriteriaLabel(c)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
         {localRules.roundCount > 1 && (
          <>
            <Separator className="opacity-30" />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {isRu ? 'Правило прохождения' : 'Elimination Rule'}
              </label>
              <Select
                value={localRules.elimination}
                onValueChange={v => {
                  const updated = { ...localRules, elimination: v };
                  setLocalRules(updated);
                  updateRules(updated);
                }}
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
