import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollapsedResponse } from './ConceptResponsesPreview';
import type { ConceptResponse } from '@/hooks/useConceptResponses';

interface ConceptVisionaryCallProps {
  planId: string;
  planTitle: string;
  planGoal: string;
  className?: string;
  response?: ConceptResponse | null;
  onExpand?: () => void;
  onInvoke?: () => void;
  invoking?: boolean;
}

export function ConceptVisionaryCall({ planId, planTitle, planGoal, className, response, onExpand, onInvoke, invoking }: ConceptVisionaryCallProps) {
  const { t } = useLanguage();

  return (
    <section className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Eye className="h-4 w-4 text-hydra-visionary" />
        {t('concept.visionary.title')}
      </h3>
      <p className="text-xs text-muted-foreground/70">
        {t('concept.visionary.description')}
      </p>
      <Button
        onClick={onInvoke}
        variant="outline"
        size="sm"
        className="gap-2 border-hydra-visionary/30 text-hydra-visionary hover:bg-hydra-visionary/10"
        disabled={!planGoal?.trim() || invoking}
      >
        {invoking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        {t('concept.visionary.invoke')}
      </Button>
      {!planGoal?.trim() && (
        <p className="text-xs text-muted-foreground/50 italic">
          {t('concept.visionary.needGoal')}
        </p>
      )}
      {response && (
        <CollapsedResponse
          content={response.content}
          contentEn={response.content_en}
          accentClass="hydra-visionary"
          onExpand={() => onExpand?.()}
        />
      )}
    </section>
  );
}
