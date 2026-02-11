import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Save, Trophy, CheckCircle2, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CONTEST_FLOW_TEMPLATES } from '@/lib/contestFlowTemplates';
import { useFlowDiagrams } from '@/hooks/useFlowDiagrams';
import { exportToMermaid } from '@/hooks/useFlowDiagrams';
import { useToast } from '@/hooks/use-toast';
import { ContestSummaryConfig } from './ContestSummaryConfig';
import { ContestPromptPreview } from './ContestPromptPreview';
import { ContestArbitrationDetails } from './ContestArbitrationDetails';
import { ContestSummaryActions } from './ContestSummaryActions';
import { ContestSavedPlan } from './ContestSavedPlan';

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
  const { saveDiagram, isSaving } = useFlowDiagrams();

  const [modelCount, setModelCount] = useState(() => {
    try { const m = localStorage.getItem('hydra-contest-models'); return m ? Object.keys(JSON.parse(m)).length : 0; } catch { return 0; }
  });
  const [roundCount, setRoundCount] = useState(() => {
    try { const r = localStorage.getItem('hydra-contest-rules'); return r ? (JSON.parse(r).roundCount || 1) : 1; } catch { return 1; }
  });
  const [taskTitle, setTaskTitle] = useState(() => {
    try { const t = localStorage.getItem('hydra-contest-task-id'); return t ? (isRu ? 'Выбрана' : 'Selected') : ''; } catch { return ''; }
  });
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('hydra-contest-mode') || 'contest'; } catch { return 'contest'; }
  });
  const [pipeline, setPipeline] = useState(() => {
    try { return localStorage.getItem('hydra-contest-pipeline') || 'none'; } catch { return 'none'; }
  });
  const [arbitration, setArbitration] = useState<ArbitrationConfig | null>(() => {
    try { const a = localStorage.getItem('hydra-contest-arbitration'); return a ? JSON.parse(a) : null; } catch { return null; }
  });
  const [roundPrompt, setRoundPrompt] = useState(() => {
    try { const r = localStorage.getItem('hydra-contest-rules'); if (r) { const p = JSON.parse(r); return p.rounds?.[0]?.prompt || ''; } return ''; } catch { return ''; }
  });
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(() => {
    try { const s = localStorage.getItem(SAVED_PLAN_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
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
        <ContestSummaryConfig
          modelCount={modelCount}
          roundCount={roundCount}
          taskTitle={taskTitle}
          mode={mode}
          pipeline={pipeline}
        />

        <ContestPromptPreview prompt={roundPrompt} />

        <ContestArbitrationDetails arbitration={arbitration} />

        <ContestSummaryActions
          onImport={() => {
            try {
              const m = localStorage.getItem('hydra-contest-models');
              setModelCount(m ? Object.keys(JSON.parse(m)).length : 0);
            } catch {
              setModelCount(0);
            }
            try {
              const r = localStorage.getItem('hydra-contest-rules');
              if (r) {
                const p = JSON.parse(r);
                setRoundCount(p.roundCount || 1);
                setRoundPrompt(p.rounds?.[0]?.prompt || '');
              }
            } catch {}
            try {
              const t = localStorage.getItem('hydra-contest-task-id');
              setTaskTitle(t ? (isRu ? 'Выбрана' : 'Selected') : '');
            } catch {}
            try {
              setMode(localStorage.getItem('hydra-contest-mode') || 'contest');
            } catch {}
            try {
              setPipeline(localStorage.getItem('hydra-contest-pipeline') || 'none');
            } catch {}
            try {
              const a = localStorage.getItem('hydra-contest-arbitration');
              setArbitration(a ? JSON.parse(a) : null);
            } catch {}
            try {
              const s = localStorage.getItem(SAVED_PLAN_KEY);
              setSavedPlan(s ? JSON.parse(s) : null);
            } catch {}
          }}
          onReset={() => {
            setModelCount(0);
            setRoundCount(1);
            setTaskTitle('');
            setMode('contest');
            setPipeline('none');
            setArbitration(null);
            setRoundPrompt('');
            setSavedPlan(null);
          }}
        />

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

        <ContestSavedPlan savedPlan={savedPlan} />
      </HydraCardContent>
    </HydraCard>
  );
}

