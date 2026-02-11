import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Workflow, Info } from 'lucide-react';

const STORAGE_KEY = 'hydra-contest-pipeline';

const PIPELINE_OPTIONS = [
  { id: 'none', ru: 'Не нужен', en: 'Not needed' },
];

export function ContestPipelineSelector() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [pipeline, setPipeline] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'none'; } catch { return 'none'; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, pipeline); } catch {}
  }, [pipeline]);

  return (
    <HydraCard variant="default" className="border-border/50">
      <HydraCardHeader>
        <div className="flex items-center gap-2 text-hydra-cyan">
          <Workflow className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">
            {isRu ? 'Шаг 3' : 'Step 3'}
          </span>
        </div>
        <HydraCardTitle>
          {isRu ? 'Пайплайн (шаблон потока)' : 'Pipeline (Flow Template)'}
        </HydraCardTitle>
      </HydraCardHeader>

      <HydraCardContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {isRu ? 'Шаблон потока выполнения' : 'Execution Flow Template'}
          </label>
          <Select value={pipeline} onValueChange={setPipeline}>
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
          <p className="text-[10px] text-muted-foreground/60">
            {isRu
              ? 'Шаблон определяет цепочку: ответы → оценки → арбитраж. Специализированные шаблоны будут добавлены позже.'
              : 'Template defines the chain: responses → evaluations → arbitration. Specialized templates will be added later.'}
          </p>
        </div>

        <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/20 border border-border/20">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {isRu
              ? 'Для большинства конкурсов рекомендуется использовать шаблон потока, автоматизирующий цепочку действий: получение ответов от кандидатов, критический анализ и арбитраж.'
              : 'For most contests, a flow template is recommended to automate the action chain: collecting candidate responses, critical analysis, and arbitration.'}
          </p>
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}
