import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Trophy, Users, ListOrdered, ClipboardList, Scale, Workflow, Weight, BarChart3, Calculator, CheckCircle2, ExternalLink, Loader2, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CONTEST_FLOW_TEMPLATES, type ContestFlowTemplateId } from '@/lib/contestFlowTemplates';
import { useFlowDiagrams } from '@/hooks/useFlowDiagrams';
import { exportToMermaid } from '@/hooks/useFlowDiagrams';
import { useToast } from '@/hooks/use-toast';
import { MermaidPreview } from '@/components/warroom/MermaidPreview';
import { useNavigate } from 'react-router-dom';

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
  ...Object.fromEntries(
    Object.values(CONTEST_FLOW_TEMPLATES).map(t => [t.id, { ru: t.ru, en: t.en }])
  ),
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

interface SavedPlan {
  diagramId: string;
  diagramName: string;
  mermaidCode: string;
  nodeCount: number;
  edgeCount: number;
}

const SAVED_PLAN_KEY = 'hydra-contest-saved-plan';

export function ContestSummary() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { toast } = useToast();
  const navigate = useNavigate();
  const { saveDiagram, isSaving } = useFlowDiagrams();

  const [modelCount, setModelCount] = useState(0);
  const [roundCount, setRoundCount] = useState(1);
  const [taskTitle, setTaskTitle] = useState('');
  const [mode, setMode] = useState('contest');
  const [pipeline, setPipeline] = useState('none');
  const [arbitration, setArbitration] = useState<ArbitrationConfig | null>(null);
  const [roundPrompt, setRoundPrompt] = useState('');
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(() => {
    try {
      const stored = localStorage.getItem(SAVED_PLAN_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    const sync = () => {
      try {
        const models = localStorage.getItem('hydra-contest-models');
        setModelCount(models ? Object.keys(JSON.parse(models)).length : 0);
      } catch {}
      try {
        const rules = localStorage.getItem('hydra-contest-rules');
        if (rules) {
          const parsed = JSON.parse(rules);
          setRoundCount(parsed.roundCount || 1);
          setRoundPrompt(parsed.rounds?.[0]?.prompt || '');
        }
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
    window.addEventListener('contest-config-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('contest-config-changed', sync);
    };
  }, [isRu]);

  const label = (map: Record<string, { ru: string; en: string }>, key: string) =>
    map[key] ? (isRu ? map[key].ru : map[key].en) : key;

  const canSave = pipeline !== 'none' && pipeline in CONTEST_FLOW_TEMPLATES;

  const handleSavePlan = useCallback(async () => {
    if (!canSave) return;

    const templateKey = pipeline as keyof typeof CONTEST_FLOW_TEMPLATES;
    const template = CONTEST_FLOW_TEMPLATES[templateKey];

    // Read contest config from localStorage
    let candidates: string[] = [];
    try {
      const models = localStorage.getItem('hydra-contest-models');
      if (models) candidates = Object.keys(JSON.parse(models));
    } catch {}

    // Read task prompt from round config
    let taskPrompt = '';
    let taskTitleForFlow = '';
    try {
      const rulesStr = localStorage.getItem('hydra-contest-rules');
      if (rulesStr) {
        const rules = JSON.parse(rulesStr);
        if (rules.rounds?.[0]?.prompt) taskPrompt = rules.rounds[0].prompt;
      }
      const taskName = localStorage.getItem('hydra-contest-task-title');
      if (taskName) taskTitleForFlow = taskName;
    } catch {}

    const { nodes, edges } = template.generate({
      candidates,
      arbiterModel: 'google/gemini-2.5-pro',
      criteria: arbitration?.criteria,
      juryMode: (arbitration?.juryMode as 'user' | 'arbiter' | 'both') || 'both',
      taskTitle: taskTitleForFlow || undefined,
      taskPrompt: taskPrompt || undefined,
    });

    const diagramName = `${isRu ? 'Конкурс' : 'Contest'}: ${isRu ? template.ru : template.en}`;

    try {
      const result = await saveDiagram({
        name: diagramName,
        description: isRu
          ? `Автогенерация из плана конкурса. Участников: ${candidates.length}, Туров: ${roundCount}`
          : `Auto-generated from contest plan. Participants: ${candidates.length}, Rounds: ${roundCount}`,
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 0.75 },
        source: 'pattern' as const,
      });

      const mermaidCode = exportToMermaid(nodes, edges);
      const plan: SavedPlan = {
        diagramId: result.id,
        diagramName,
        mermaidCode,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      };
      setSavedPlan(plan);
      try { localStorage.setItem(SAVED_PLAN_KEY, JSON.stringify(plan)); } catch {}

      toast({
        description: isRu ? 'План конкурса сохранён' : 'Contest plan saved',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        description: isRu ? `Ошибка: ${err.message}` : `Error: ${err.message}`,
      });
    }
  }, [canSave, pipeline, arbitration, roundCount, isRu, saveDiagram, toast]);

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

        {/* Round 1 prompt preview */}
        {roundPrompt && (
          <>
            <Separator className="opacity-30" />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <FileText className="h-3 w-3" />
                {isRu ? 'Промпт тура 1' : 'Round 1 Prompt'}
              </div>
              <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-4 whitespace-pre-wrap rounded-md bg-muted/20 border border-border/20 p-2">
                {roundPrompt}
              </p>
            </div>
          </>
        )}

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

        {/* Save Plan button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  disabled={!canSave || isSaving}
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleSavePlan}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : savedPlan ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isRu
                    ? (savedPlan ? 'Пересохранить план конкурса' : 'Сохранить план конкурса')
                    : (savedPlan ? 'Re-save Contest Plan' : 'Save Contest Plan')}
                </Button>
              </div>
            </TooltipTrigger>
            {!canSave && (
              <TooltipContent>
                <p className="text-xs">
                  {isRu
                    ? 'Выберите шаблон пайплайна в Шаге 3'
                    : 'Select a pipeline template in Step 3'}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Saved plan preview */}
        {savedPlan && (
          <div className="space-y-2">
            <Separator className="opacity-30" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Workflow className="h-3 w-3" />
                {isRu ? 'Сохранённый поток' : 'Saved Flow'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] gap-1 px-2"
                onClick={() => navigate(`/flow-editor?diagram=${savedPlan.diagramId}`)}
              >
                <ExternalLink className="h-3 w-3" />
                {isRu ? 'Открыть в редакторе' : 'Open in Editor'}
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <SummaryItem
                icon={<Workflow className="h-3.5 w-3.5" />}
                label={isRu ? 'Узлов' : 'Nodes'}
                value={String(savedPlan.nodeCount)}
              />
              <SummaryItem
                icon={<Workflow className="h-3.5 w-3.5" />}
                label={isRu ? 'Связей' : 'Edges'}
                value={String(savedPlan.edgeCount)}
              />
            </div>

            {/* Mermaid diagram preview (compact) */}
            <div className="rounded-md border border-border/30 bg-muted/10 overflow-hidden max-h-[200px] overflow-y-auto">
              <MermaidPreview content={savedPlan.mermaidCode} />
            </div>
          </div>
        )}
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
