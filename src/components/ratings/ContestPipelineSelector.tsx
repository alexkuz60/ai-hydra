import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Workflow, Info } from 'lucide-react';
import { CONTEST_FLOW_TEMPLATES, type ContestFlowTemplateId } from '@/lib/contestFlowTemplates';
import { useContestConfigContext } from '@/contexts/ContestConfigContext';
import { getRatingsText } from './i18n';

const PIPELINE_OPTIONS: { id: ContestFlowTemplateId; ru: string; en: string; descRu?: string; descEn?: string }[] = [
  { id: 'none', ru: 'Не нужен', en: 'Not needed' },
  ...Object.values(CONTEST_FLOW_TEMPLATES).map(t => ({
    id: t.id as ContestFlowTemplateId,
    ru: t.ru,
    en: t.en,
    descRu: t.descriptionRu,
    descEn: t.descriptionEn,
  })),
];

export function ContestPipelineSelector() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { pipeline, updatePipeline } = useContestConfigContext();

  const selectedOption = PIPELINE_OPTIONS.find(o => o.id === pipeline);

  return (
    <HydraCard variant="default" className="border-border/50">
      <HydraCardHeader>
        <div className="flex items-center gap-2 text-hydra-cyan">
          <Workflow className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">
            {getRatingsText('pipelineStep3', isRu)}
          </span>
        </div>
        <HydraCardTitle>
          {getRatingsText('pipelineTitle', isRu)}
        </HydraCardTitle>
      </HydraCardHeader>

      <HydraCardContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {getRatingsText('pipelineFlowTemplate', isRu)}
          </label>
           <Select value={pipeline} onValueChange={updatePipeline}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_OPTIONS.map(o => (
                <SelectItem key={o.id} value={o.id} className="text-xs">
                  {isRu ? o.ru : o.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedOption && selectedOption.id !== 'none' && (
            <p className="text-[10px] text-muted-foreground/80 mt-1">
              {isRu ? selectedOption.descRu : selectedOption.descEn}
            </p>
          )}

          {pipeline === 'none' && (
            <p className="text-[10px] text-muted-foreground/60">
              {getRatingsText('pipelineNoTemplate', isRu)}
            </p>
          )}
        </div>

        <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/20 border border-border/20">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {getRatingsText('pipelineInfo', isRu)}
          </p>
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}
