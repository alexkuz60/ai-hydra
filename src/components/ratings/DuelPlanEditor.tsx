import React, { useState, useCallback } from 'react';
import { getRatingsText, getCriterionLabel } from './i18n';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { getModelRegistryEntry } from '@/config/modelRegistry';
import { PROVIDER_LOGOS } from '@/components/ui/ProviderLogos';
import { CONTEST_FLOW_TEMPLATES, type ContestFlowTemplateId } from '@/lib/contestFlowTemplates';
import { useFlowDiagrams, exportToMermaid } from '@/hooks/useFlowDiagrams';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Swords, Workflow, Scale, Trophy, Weight, Calculator, BarChart3, Users, Info, Save, CheckCircle2, Loader2, FileText, Maximize2, UserCheck, ExternalLink, Play } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { SummaryItem } from './ContestSummaryItem';
import { MermaidPreview } from '@/components/warroom/MermaidPreview';
import { MermaidBlock } from '@/components/warroom/MermaidBlock';
import { DUEL_VALIDATION_MESSAGES } from '@/hooks/useDuelConfig';
import type { useDuelConfig } from '@/hooks/useDuelConfig';

const ALL_CRITERIA = [
  'factuality', 'relevance', 'clarity', 'argument_strength',
  'logic_coherence', 'evidence_quality', 'completeness', 'creativity',
];

const SCORING_OPTIONS = [
  { id: 'weighted-avg', ru: 'Средневзвешенный балл', en: 'Weighted Average' },
  { id: 'tournament', ru: 'Турнирная таблица', en: 'Tournament Table' },
  { id: 'elo', ru: 'Рейтинг Эло', en: 'Elo Rating' },
];

const DUEL_PIPELINE_OPTIONS: { id: ContestFlowTemplateId; ru: string; en: string }[] = [
  { id: 'none', ru: 'Не нужен', en: 'Not needed' },
  { id: 'duel-critic', ru: CONTEST_FLOW_TEMPLATES['duel-critic'].ru, en: CONTEST_FLOW_TEMPLATES['duel-critic'].en },
  { id: 'duel-arbiter', ru: CONTEST_FLOW_TEMPLATES['duel-arbiter'].ru, en: CONTEST_FLOW_TEMPLATES['duel-arbiter'].en },
];

interface DuelPlanEditorProps {
  config: ReturnType<typeof useDuelConfig>;
  isRu: boolean;
  onLaunch?: () => void;
}

interface DuelSavedPlan {
  diagramId: string;
  diagramName: string;
  mermaidCode: string;
  nodeCount: number;
  edgeCount: number;
}

export function DuelPlanEditor({ config, isRu, onLaunch }: DuelPlanEditorProps) {
  const { lovableModels, personalModels } = useAvailableModels();
  const { saveDiagram, isSaving } = useFlowDiagrams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const availableModelIds = [...lovableModels, ...personalModels].map(m => m.id);

  const { loaded: cloudLoaded } = config;

  // Sync duel selections from portfolio AFTER cloud settings are loaded
  React.useEffect(() => {
    if (!cloudLoaded) return;
    config.syncFromPortfolio();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'hydra-duel-models-selected') config.syncFromPortfolio();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [cloudLoaded, config.syncFromPortfolio]);
  const [pipeline, setPipeline] = useState<ContestFlowTemplateId>(() =>
    (localStorage.getItem('hydra-duel-pipeline') as ContestFlowTemplateId) || 'duel-critic'
  );
  const [savedPlan, setSavedPlan] = useState<DuelSavedPlan | null>(() => {
    try {
      const raw = localStorage.getItem('hydra-duel-saved-plan');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const updatePipeline = useCallback((v: ContestFlowTemplateId) => {
    setPipeline(v);
    localStorage.setItem('hydra-duel-pipeline', v);
  }, []);

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

  const setCriterionWeight = useCallback((id: string, value: number) => {
    const weights = { ...config.config.criteriaWeights, [id]: value };
    config.updateCriteriaWeights(weights);
  }, [config]);

  const canSavePlan = pipeline !== 'none' && pipeline in CONTEST_FLOW_TEMPLATES;

  const handleSavePlan = useCallback(async () => {
    const errors = config.validate();
    if (errors.length > 0) {
      const msg = errors.map(e => DUEL_VALIDATION_MESSAGES[e.messageKey]?.[isRu ? 'ru' : 'en'] || e.messageKey).join('; ');
      toast({ variant: 'destructive', description: msg });
      return;
    }
    if (!canSavePlan) return;

    const templateKey = pipeline as keyof typeof CONTEST_FLOW_TEMPLATES;
    const template = CONTEST_FLOW_TEMPLATES[templateKey];
    const { nodes, edges } = template.generate({
      modelA: config.config.modelA || undefined,
      modelB: config.config.modelB || undefined,
      arbiterModel: config.config.arbiterModel || 'google/gemini-2.5-pro',
      criteria: config.config.criteria,
      roundCount: config.config.roundCount,
      duelPrompt: config.config.duelPrompt,
    } as any);

    const diagramName = `${isRu ? 'Дуэль' : 'Duel'}: ${isRu ? template.ru : template.en}`;

    try {
      const result = await saveDiagram({
        name: diagramName,
        description: isRu
          ? `Автогенерация из плана дуэли. Раундов: ${config.config.roundCount}`
          : `Auto-generated from duel plan. Rounds: ${config.config.roundCount}`,
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 0.75 },
        source: 'pattern' as const,
      });

      const mermaidCode = exportToMermaid(nodes, edges);
      const plan: DuelSavedPlan = {
        diagramId: result.id,
        diagramName,
        mermaidCode,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      };
      setSavedPlan(plan);
      localStorage.setItem('hydra-duel-saved-plan', JSON.stringify(plan));

      toast({ description: isRu ? 'План дуэли сохранён' : 'Duel plan saved' });
    } catch (err: any) {
      toast({ variant: 'destructive', description: `${isRu ? 'Ошибка' : 'Error'}: ${err.message}` });
    }
  }, [canSavePlan, pipeline, config, isRu, saveDiagram, toast]);

  const totalWeight = config.config.criteria.reduce((s, c) => s + (config.config.criteriaWeights[c] || 0), 0);

  return (
    <div className="space-y-4">
      {/* ── Step 1: Duel Configuration ── */}
      <HydraCard variant="default" className="border-border/50">
        <HydraCardHeader>
          <div className="flex items-start justify-between w-full">
            <div>
              <div className="flex items-center gap-2 text-primary mb-1">
                <Swords className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                  {isRu ? 'Шаг 1' : 'Step 1'}
                </span>
              </div>
              <HydraCardTitle>{getRatingsText('duelPlanTitle', isRu)}</HydraCardTitle>
            </div>
          </div>
        </HydraCardHeader>
        <HydraCardContent className="space-y-4">
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

        </HydraCardContent>
      </HydraCard>

      {/* ── Step 2: Flow Template ── */}
      <HydraCard variant="default" className="border-border/50">
        <HydraCardHeader>
          <div className="flex items-center gap-2 text-hydra-cyan">
            <Workflow className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">
              {isRu ? 'Шаг 2' : 'Step 2'}
            </span>
          </div>
          <HydraCardTitle>{getRatingsText('duelFlowTemplate', isRu)}</HydraCardTitle>
        </HydraCardHeader>
        <HydraCardContent className="space-y-3">
          <Select value={pipeline} onValueChange={v => updatePipeline(v as ContestFlowTemplateId)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DUEL_PIPELINE_OPTIONS.map(o => (
                <SelectItem key={o.id} value={o.id} className="text-xs">
                  {isRu ? o.ru : o.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pipeline !== 'none' && (
            <p className="text-[10px] text-muted-foreground/80">
              {isRu
                ? CONTEST_FLOW_TEMPLATES[pipeline as keyof typeof CONTEST_FLOW_TEMPLATES]?.descriptionRu
                : CONTEST_FLOW_TEMPLATES[pipeline as keyof typeof CONTEST_FLOW_TEMPLATES]?.descriptionEn}
            </p>
          )}
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/20 border border-border/20">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isRu
                ? 'Шаблон определяет цепочку: аргументы дуэлянтов → перекрёстное слияние → арбитраж → итоги раунда.'
                : 'Template defines the chain: duelist arguments → cross-merge → arbitration → round results.'}
            </p>
          </div>
        </HydraCardContent>
      </HydraCard>

      {/* ── Step 3: Arbitration ── */}
      <HydraCard variant="default" className="border-border/50">
        <HydraCardHeader>
          <div className="flex items-center gap-2 text-hydra-arbiter">
            <Scale className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">
              {isRu ? 'Шаг 3' : 'Step 3'}
            </span>
          </div>
          <HydraCardTitle>{getRatingsText('duelArbitration', isRu)}</HydraCardTitle>
        </HydraCardHeader>
        <HydraCardContent className="space-y-4">
          {/* Criteria */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3" />
              {getRatingsText('evaluationCriteria', isRu)}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{config.config.criteria.length}</Badge>
            </label>
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

          {/* Criteria Weights */}
          {config.config.scoringScheme === 'weighted-avg' && config.config.criteria.length > 0 && (
            <div className="space-y-2 p-2.5 rounded-md bg-muted/20 border border-border/20">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Weight className="h-3 w-3" />
                {getRatingsText('criteriaWeights', isRu)}
                <span className="text-[10px] opacity-50 normal-case font-normal">
                  ({isRu ? 'сумма' : 'total'}: {totalWeight}%)
                </span>
              </label>
              <div className="space-y-1.5">
                {config.config.criteria.map(cId => {
                  const weight = config.config.criteriaWeights[cId] || 0;
                  return (
                    <div key={cId} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-28 truncate">
                        {getCriterionLabel(cId, isRu)}
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

          {/* Arbiter Model */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{getRatingsText('duelArbiterModel', isRu)}</Label>
            <Select value={config.config.arbiterModel || ''} onValueChange={v => config.updateArbiterModel(v || null)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={getRatingsText('duelSelectModel', isRu)} />
              </SelectTrigger>
              <SelectContent>
                {availableModelIds.map(id => {
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

          <Separator className="opacity-30" />

          {/* Scoring Scheme */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="h-3 w-3" />
              {getRatingsText('finalScoringScheme', isRu)}
            </label>
            <Select
              value={config.config.scoringScheme}
              onValueChange={v => config.updateScoringScheme(v as any)}
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
              {config.config.scoringScheme === 'weighted-avg'
                ? (isRu ? 'Итоговый балл = среднее взвешенное по выбранным критериям' : 'Final score = weighted average across selected criteria')
                : config.config.scoringScheme === 'tournament'
                ? (isRu ? 'Модели проходят через сетку попарных сравнений' : 'Models go through a bracket of pairwise comparisons')
                : (isRu ? 'Динамический рейтинг по системе Эло на основе дуэлей' : 'Dynamic rating based on Elo system from duels')}
            </p>
          </div>
        </HydraCardContent>
      </HydraCard>

      {/* ── Step 4: Preview & Launch ── */}
      <HydraCard variant="default" glow className="border-border/50">
        <HydraCardHeader>
          <div className="flex items-center gap-2 text-hydra-arbiter">
            <Trophy className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider opacity-60">
              {isRu ? 'Шаг 4' : 'Step 4'}
            </span>
          </div>
          <HydraCardTitle>{getRatingsText('previewAndLaunch', isRu)}</HydraCardTitle>
        </HydraCardHeader>
        <HydraCardContent className="space-y-3">
          {/* Config summary */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            <SummaryItem
              icon={<Swords className="h-3.5 w-3.5" />}
              label={getRatingsText('duelModelA', isRu)}
              value={config.config.modelA
                ? (getModelRegistryEntry(config.config.modelA)?.displayName || config.config.modelA.split('/').pop() || '—')
                : '—'}
            />
            <SummaryItem
              icon={<Swords className="h-3.5 w-3.5" />}
              label={getRatingsText('duelModelB', isRu)}
              value={config.config.modelB
                ? (getModelRegistryEntry(config.config.modelB)?.displayName || config.config.modelB.split('/').pop() || '—')
                : '—'}
            />
            <SummaryItem
              icon={<BarChart3 className="h-3.5 w-3.5" />}
              label={getRatingsText('duelRounds', isRu)}
              value={String(config.config.roundCount)}
            />
            <SummaryItem
              icon={<Workflow className="h-3.5 w-3.5" />}
              label={getRatingsText('duelFlowTemplate', isRu)}
              value={pipeline === 'none'
                ? (isRu ? 'Не выбран' : 'Not selected')
                : (isRu
                    ? CONTEST_FLOW_TEMPLATES[pipeline as keyof typeof CONTEST_FLOW_TEMPLATES]?.ru
                    : CONTEST_FLOW_TEMPLATES[pipeline as keyof typeof CONTEST_FLOW_TEMPLATES]?.en) || '—'}
            />
          </div>

          {/* Arbitration summary */}
          <Separator className="opacity-30" />
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Scale className="h-3 w-3" />
              {getRatingsText('duelArbitration', isRu)}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              <SummaryItem
                icon={<Calculator className="h-3.5 w-3.5" />}
                label={getRatingsText('duelScoringScheme', isRu)}
                value={SCORING_OPTIONS.find(o => o.id === config.config.scoringScheme)?.[isRu ? 'ru' : 'en'] || config.config.scoringScheme}
              />
              {config.config.arbiterModel && (
                <SummaryItem
                  icon={<Scale className="h-3.5 w-3.5" />}
                  label={getRatingsText('duelArbiterModel', isRu)}
                  value={getModelRegistryEntry(config.config.arbiterModel)?.displayName || config.config.arbiterModel.split('/').pop() || '—'}
                />
              )}
              <SummaryItem
                icon={<UserCheck className="h-3.5 w-3.5" />}
                label={getRatingsText('duelUserEvalEnabled', isRu)}
                value={config.config.userEvaluation ? getRatingsText('duelYes', isRu) : getRatingsText('duelNo', isRu)}
              />
            </div>

            {/* Criteria badges */}
            {config.config.criteria.length > 0 && (
              <div className="flex items-start gap-2">
                <BarChart3 className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {config.config.criteria.map(c => {
                    const w = config.config.criteriaWeights?.[c];
                    return (
                      <Badge key={c} variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                        {getCriterionLabel(c, isRu)}
                        {config.config.scoringScheme === 'weighted-avg' && w != null && (
                          <span className="opacity-50">{w}%</span>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Prompt preview */}
          {config.config.duelPrompt && (
            <>
              <Separator className="opacity-30" />
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full text-left space-y-1 group cursor-pointer rounded-md hover:bg-muted/30 transition-colors p-1 -m-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <FileText className="h-3 w-3" />
                        {getRatingsText('duelPromptLabel', isRu)}
                      </div>
                      <Maximize2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-2 whitespace-pre-wrap">
                      {config.config.duelPrompt}
                    </p>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">{getRatingsText('duelPromptLabel', isRu)}</h3>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {config.config.duelPrompt}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          <Separator className="opacity-30" />

          {/* Save Plan + Launch buttons */}
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <Button
                      disabled={!canSavePlan || isSaving}
                      className="w-full gap-2"
                      variant="outline"
                      onClick={handleSavePlan}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : savedPlan ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {savedPlan ? getRatingsText('duelReSavePlan', isRu) : getRatingsText('duelSavePlan', isRu)}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canSavePlan && (
                  <TooltipContent>
                    <p className="text-xs">
                      {isRu ? 'Выберите шаблон потока в шаге 2' : 'Select flow template in step 2'}
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <Button
              className="flex-1 gap-2"
              size="default"
              onClick={onLaunch}
            >
              <Play className="h-4 w-4" />
              {getRatingsText('duelLaunchButton', isRu)}
            </Button>
          </div>

          {/* Saved Flow preview */}
          {savedPlan && (
            <div className="space-y-2">
              <Separator className="opacity-30" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Workflow className="h-3 w-3" />
                  {getRatingsText('duelSavedFlow', isRu)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] gap-1 px-2"
                  onClick={() => navigate(`/flow-editor?diagram=${savedPlan.diagramId}`)}
                >
                  <ExternalLink className="h-3 w-3" />
                  {getRatingsText('duelOpenInEditor', isRu)}
                </Button>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <SummaryItem
                  icon={<Workflow className="h-3.5 w-3.5" />}
                  label={getRatingsText('duelNodes', isRu)}
                  value={String(savedPlan.nodeCount)}
                />
                <SummaryItem
                  icon={<Workflow className="h-3.5 w-3.5" />}
                  label={getRatingsText('duelEdges', isRu)}
                  value={String(savedPlan.edgeCount)}
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full rounded-md border border-border/30 bg-muted/10 overflow-hidden cursor-pointer hover:border-border/60 transition-colors group relative">
                    <MermaidPreview content={savedPlan.mermaidCode} maxHeight={100} />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/40">
                      <Maximize2 className="h-4 w-4 text-foreground" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] p-4">
                  <MermaidBlock content={savedPlan.mermaidCode} />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </HydraCardContent>
      </HydraCard>
    </div>
  );
}
