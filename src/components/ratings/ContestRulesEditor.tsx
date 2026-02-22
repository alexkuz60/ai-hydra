import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, ListOrdered, Info } from 'lucide-react';
import { getRatingsText, getCriterionLabel } from './i18n';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useContestConfigContext } from '@/contexts/ContestConfigContext';
import { AGENT_ROLES, ROLE_CONFIG, ROLE_SPECIFIC_CRITERIA, type AgentRole } from '@/config/roles';
import { RoleSelectItem, RoleDisplay } from '@/components/ui/RoleSelectItem';
import { mergeRoleCriteria, getCriteriaLabel, isRoleSpecificCriteria } from '@/lib/contestRoleCriteria';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useUserRoles } from '@/hooks/useUserRoles';
import { hasInterviewPlugin } from '@/plugins/interview';

interface RoundConfig {
  type: 'free' | 'role';
  prompt: string;
  criteria: string[];
  roleForEvaluation?: string;
}

// Group roles like Staff: experts, technical, OTK (system-only)
function useGroupedContestRoles() {
  const { isAdmin } = useUserRoles();

  return useMemo(() => {
    const experts: AgentRole[] = [];
    const technical: AgentRole[] = [];
    const otk: AgentRole[] = [];

    AGENT_ROLES.forEach(role => {
      const cfg = ROLE_CONFIG[role];
      // Non-admin: only show roles with interview plugins
      if (!isAdmin && !hasInterviewPlugin(role)) return;
      if (cfg.isSystemOnly) {
        otk.push(role);
      } else if (cfg.isTechnicalStaff) {
        technical.push(role);
      } else {
        experts.push(role);
      }
    });

    return { experts, technical, otk };
  }, [isAdmin]);
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
  return { type: 'free', prompt: '', criteria: ['accuracy', 'completeness'], roleForEvaluation: undefined };
}

export function ContestRulesEditor() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { rules, updateRules } = useContestConfigContext();
  const groupedRoles = useGroupedContestRoles();
  
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
             {getRatingsText('rulesStep2', isRu)}
           </span>
         </div>
         <HydraCardTitle>
           {getRatingsText('rulesContestRules', isRu)}
         </HydraCardTitle>
      </HydraCardHeader>

      <HydraCardContent className="space-y-4">
        {/* Round count */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ListOrdered className="h-3 w-3" />
            {getRatingsText('rulesRoundCount', isRu)}
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
                {getRatingsText('rulesRoundN', isRu)} {idx + 1}
              </Badge>
            </div>

            {/* Task type + inline role selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground">
                {getRatingsText('rulesAssignmentType', isRu)}
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
                       ? getRatingsText('rulesFreePrompt', isRu)
                       : getRatingsText('rulesRoleBased', isRu)}
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
                        <SelectValue placeholder={getRatingsText('rulesRolePlaceholder', isRu)}>
                          {round.roleForEvaluation && (
                            <RoleDisplay role={round.roleForEvaluation as AgentRole} />
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {groupedRoles.experts.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-[10px]">{getRatingsText('rulesExperts', isRu)}</SelectLabel>
                            {groupedRoles.experts.map(role => (
                              <RoleSelectItem key={role} value={role} />
                            ))}
                          </SelectGroup>
                        )}
                        {groupedRoles.technical.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-[10px]">{getRatingsText('rulesTechStaff', isRu)}</SelectLabel>
                            {groupedRoles.technical.map(role => (
                              <RoleSelectItem key={role} value={role} />
                            ))}
                          </SelectGroup>
                        )}
                        {groupedRoles.otk.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-[10px]">{getRatingsText('rulesQC', isRu)}</SelectLabel>
                            {groupedRoles.otk.map(role => (
                              <RoleSelectItem key={role} value={role} />
                            ))}
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground/50 cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                           <p className="text-[10px]">
                             {getRatingsText('rulesRoleTooltip', isRu)}
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
                    {getRatingsText('rulesRoleCriteria', isRu)}
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
                {getRatingsText('rulesRoundPrompt', isRu)}
              </label>
              <Textarea
                value={round.prompt}
                onChange={e => updateRound(idx, { prompt: e.target.value })}
                placeholder={getRatingsText('rulesPromptPlaceholder', isRu)}
                className="min-h-[60px] text-xs resize-none"
              />
            </div>

            {/* Criteria */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground">
                {getRatingsText('rulesEvalCriteria', isRu)}
              </label>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {CRITERIA_OPTIONS.map(c => (
                  <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={round.criteria.includes(c.id)}
                      onCheckedChange={() => toggleCriterion(idx, c.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs">{getCriterionLabel(c.id, isRu)}</span>
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
                {getRatingsText('rulesEliminationRule', isRu)}
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

              {/* Threshold input */}
              {localRules.elimination === 'threshold' && (
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-[11px] text-muted-foreground shrink-0">
                    {getRatingsText('rulesThresholdLabel', isRu)}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    step={0.5}
                    value={(localRules as any).eliminationThreshold ?? 3}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= 7) {
                        const updated = { ...localRules, eliminationThreshold: val };
                        setLocalRules(updated);
                        updateRules(updated);
                      }
                    }}
                    className="h-7 w-20 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {getRatingsText('rulesThresholdDesc', isRu)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </HydraCardContent>
    </HydraCard>
  );
}
