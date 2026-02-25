import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Target, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollapsedResponse } from './ConceptResponsesPreview';
import type { ConceptResponse } from '@/hooks/useConceptResponses';

interface ConceptStrategistCallProps {
  planId: string;
  planTitle: string;
  planGoal: string;
  className?: string;
  response?: ConceptResponse | null;
  onExpand?: () => void;
  onInvoke?: () => void;
  invoking?: boolean;
}

export function ConceptStrategistCall({ planId, planTitle, planGoal, className, response, onExpand, onInvoke, invoking }: ConceptStrategistCallProps) {
  const { t } = useLanguage();

  return (
    <section className={cn('space-y-3', className)}>
      <h3 className="text-base font-medium text-muted-foreground flex items-center gap-2">
        <Target className="h-4 w-4 text-hydra-strategist" />
        {t('concept.strategist.title')}
      </h3>
      <p className="text-sm text-muted-foreground/70">
        {t('concept.strategist.description')}
      </p>
      <Button
        onClick={onInvoke}
        variant="outline"
        size="sm"
        className="gap-2 border-hydra-strategist/30 text-hydra-strategist hover:bg-hydra-strategist/10"
        disabled={!planGoal?.trim() || invoking}
      >
        {invoking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
        {t('concept.strategist.invoke')}
      </Button>
      {!planGoal?.trim() && (
        <p className="text-sm text-muted-foreground/50 italic">
          {t('concept.strategist.needGoal')}
        </p>
      )}
      {response && (
        <CollapsedResponse
          content={response.content}
          contentEn={response.content_en}
          accentClass="hydra-strategist"
          onExpand={() => onExpand?.()}
        />
      )}
    </section>
  );
}
