import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getRatingsText, getCriterionLabel } from './i18n';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS } from '@/components/ui/ProviderLogos';
import type { useDuelConfig } from '@/hooks/useDuelConfig';

const ALL_CRITERIA = [
  'factuality', 'relevance', 'clarity', 'argument_strength',
  'logic_coherence', 'evidence_quality', 'completeness', 'creativity',
];

interface DuelPlanEditorProps {
  config: ReturnType<typeof useDuelConfig>;
  isRu: boolean;
}

export function DuelPlanEditor({ config, isRu }: DuelPlanEditorProps) {
  const { lovableModels, personalModels } = useAvailableModels();
  const availableModelIds = [...lovableModels, ...personalModels].map(m => m.id);

  const renderModelSelector = (
    label: string,
    value: string | null,
    onChange: (v: string | null) => void,
    excludeId?: string | null,
  ) => {
    const filtered = availableModelIds.filter(id => id !== excludeId);
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{label}</Label>
        <Select value={value || ''} onValueChange={v => onChange(v || null)}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder={getRatingsText('duelSelectModel', isRu)} />
          </SelectTrigger>
          <SelectContent>
            {filtered.map(id => {
              const entry = getModelRegistryEntry(id);
              const Logo = entry?.provider ? PROVIDER_LOGOS[entry.provider] : null;
              return (
                <SelectItem key={id} value={id} className="text-xs">
                  <div className="flex items-center gap-2">
                    {Logo && <Logo className="h-3.5 w-3.5" />}
                    <span>{entry?.displayName || id.split('/').pop()}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="space-y-4 rounded-lg border border-border/40 p-4 bg-card/50">
      {/* Duel Type */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{getRatingsText('duelType', isRu)}</Label>
        <div className="flex gap-2">
          <button
            onClick={() => config.updateDuelType('critic')}
            className={cn(
              'flex-1 rounded-lg border p-2.5 text-xs text-center transition-colors',
              config.config.duelType === 'critic'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/40 hover:bg-muted/30 text-muted-foreground'
            )}
          >
            {getRatingsText('duelTypeCritic', isRu)}
          </button>
          <button
            onClick={() => config.updateDuelType('arbiter')}
            className={cn(
              'flex-1 rounded-lg border p-2.5 text-xs text-center transition-colors',
              config.config.duelType === 'arbiter'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/40 hover:bg-muted/30 text-muted-foreground'
            )}
          >
            {getRatingsText('duelTypeArbiter', isRu)}
          </button>
        </div>
      </div>

      {/* Model Selectors */}
      <div className="grid grid-cols-2 gap-3">
        {renderModelSelector(
          getRatingsText('duelModelA', isRu),
          config.config.modelA,
          config.updateModelA,
          config.config.modelB,
        )}
        {renderModelSelector(
          getRatingsText('duelModelB', isRu),
          config.config.modelB,
          config.updateModelB,
          config.config.modelA,
        )}
      </div>

      {/* Duel Prompt */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{getRatingsText('duelPromptLabel', isRu)}</Label>
        <Textarea
          value={config.config.duelPrompt}
          onChange={e => config.updateDuelPrompt(e.target.value)}
          placeholder={getRatingsText('duelPromptPlaceholder', isRu)}
          className="min-h-[80px] text-xs resize-y"
        />
      </div>

      {/* Round Count */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">{getRatingsText('duelRounds', isRu)}</Label>
          <Badge variant="secondary" className="text-[10px]">{config.config.roundCount}</Badge>
        </div>
        <Slider
          value={[config.config.roundCount]}
          onValueChange={([v]) => config.updateRoundCount(v)}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
      </div>

      {/* Criteria */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{getRatingsText('evaluationCriteria', isRu)}</Label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CRITERIA.map(c => {
            const selected = config.config.criteria.includes(c);
            return (
              <button
                key={c}
                onClick={() => {
                  const next = selected
                    ? config.config.criteria.filter(x => x !== c)
                    : [...config.config.criteria, c];
                  config.updateCriteria(next);
                }}
                className={cn(
                  'px-2 py-1 rounded-md text-[10px] border transition-colors',
                  selected
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border/30 text-muted-foreground hover:bg-muted/20'
                )}
              >
                {getCriterionLabel(c, isRu)}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Evaluation Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">{getRatingsText('duelUserEval', isRu)}</Label>
        <Switch
          checked={config.config.userEvaluation}
          onCheckedChange={config.updateUserEvaluation}
        />
      </div>
    </div>
  );
}
