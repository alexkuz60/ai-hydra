import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Landmark, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollapsedResponse } from './ConceptResponsesPreview';
import type { ConceptResponse } from '@/hooks/useConceptResponses';

interface ConceptPatentSearchProps {
  planId: string;
  planTitle: string;
  planGoal: string;
  className?: string;
  response?: ConceptResponse | null;
  onExpand?: () => void;
  onInvoke?: () => void;
  invoking?: boolean;
}

export function ConceptPatentSearch({ planId, planTitle, planGoal, className, response, onExpand, onInvoke, invoking }: ConceptPatentSearchProps) {
  const { t } = useLanguage();

  return (
    <section className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Landmark className="h-4 w-4 text-hydra-patent" />
        {t('concept.patentSearch.title')}
      </h3>
      <p className="text-xs text-muted-foreground/70">
        {t('concept.patentSearch.description')}
      </p>
      <Button
        onClick={onInvoke}
        variant="outline"
        size="sm"
        className="gap-2 border-hydra-patent/30 text-hydra-patent hover:bg-hydra-patent/10"
        disabled={!planGoal?.trim() || invoking}
      >
        {invoking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
        {t('concept.patentSearch.invoke')}
      </Button>
      {!planGoal?.trim() && (
        <p className="text-xs text-muted-foreground/50 italic">
          {t('concept.patentSearch.needGoal')}
        </p>
      )}
      {response && (
        <CollapsedResponse
          content={response.content}
          contentEn={response.content_en}
          accentClass="hydra-patent"
          onExpand={() => onExpand?.()}
        />
      )}
    </section>
  );
}
