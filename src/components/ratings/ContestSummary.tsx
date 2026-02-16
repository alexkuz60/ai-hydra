import React, { useCallback } from 'react';
import { useHiredTechnoArbiter } from '@/hooks/useHiredTechnoArbiter';
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
import { VALIDATION_MESSAGES } from '@/hooks/useContestConfig';
import { useContestConfigContext } from '@/contexts/ContestConfigContext';
import { getRatingsText } from './i18n';
import { ContestSummaryConfig } from './ContestSummaryConfig';
import { ContestPromptPreview } from './ContestPromptPreview';
import { ContestArbitrationDetails } from './ContestArbitrationDetails';
import { ContestSummaryActions } from './ContestSummaryActions';
import { ContestSavedPlan } from './ContestSavedPlan';

export function ContestSummary() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { toast } = useToast();
  const { saveDiagram, isSaving } = useFlowDiagrams();
  const { effectiveArbiter } = useHiredTechnoArbiter();
  const {
    models,
    modelCount,
    roundCount,
    roundPrompt,
    taskTitle,
    mode,
    pipeline,
    arbitration,
    savedPlan,
    updateSavedPlan,
    resetAll,
    importConfig,
    validateForSave,
    loaded: cloudLoaded,
  } = useContestConfigContext();

  const canSave = pipeline !== 'none' && pipeline in CONTEST_FLOW_TEMPLATES;

  const handleSavePlan = useCallback(async () => {
    // Проверка обязательных полей
    const validationErrors = validateForSave();
    if (validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map(e => VALIDATION_MESSAGES[e.messageKey]?.[isRu ? 'ru' : 'en'] || e.messageKey)
        .join(', ');
      toast({
        variant: 'destructive',
        description: isRu 
          ? `Ошибка валидации: ${errorMessages}` 
          : `Validation error: ${errorMessages}`,
      });
      return;
    }

    if (!canSave) return;

    const templateKey = pipeline as keyof typeof CONTEST_FLOW_TEMPLATES;
    const template = CONTEST_FLOW_TEMPLATES[templateKey];
    const candidates = Object.keys(models);
    const taskNameForFlow = taskTitle || '';
    const taskPrompt = roundPrompt;

    const { nodes, edges } = template.generate({
      candidates,
      arbiterModel: (arbitration as any)?.arbiterModel || effectiveArbiter,
      criteria: arbitration?.criteria,
      juryMode: (arbitration?.juryMode as 'user' | 'arbiter' | 'both') || 'both',
      taskTitle: taskNameForFlow || undefined,
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
      updateSavedPlan({
        diagramId: result.id,
        diagramName,
        mermaidCode,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });

      toast({
        description: isRu ? 'План конкурса сохранён' : 'Contest plan saved',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        description: isRu ? `Ошибка: ${err.message}` : `Error: ${err.message}`,
      });
    }
  }, [canSave, pipeline, arbitration, roundCount, isRu, saveDiagram, toast, roundPrompt, updateSavedPlan, validateForSave]);

  return (
     <HydraCard variant="default" glow className="border-border/50">
        <HydraCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-hydra-arbiter">
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                {getRatingsText('step5', isRu)}
              </span>
            </div>
          </div>
          <HydraCardTitle>
            {getRatingsText('previewAndLaunch', isRu)}
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
          onImport={importConfig}
          onReset={resetAll}
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
                   {savedPlan ? getRatingsText('reSaveContestPlan', isRu) : getRatingsText('saveContestPlan', isRu)}
                </Button>
              </div>
            </TooltipTrigger>
             {!canSave && (
               <TooltipContent>
                 <p className="text-xs">
                   {getRatingsText('selectPipelineTemplateInStep3', isRu)}
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

