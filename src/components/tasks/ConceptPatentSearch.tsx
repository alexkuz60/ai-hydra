import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConceptPatentSearchProps {
  planId: string;
  planTitle: string;
  planGoal: string;
  className?: string;
}

export function ConceptPatentSearch({ planId, planTitle, planGoal, className }: ConceptPatentSearchProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleInvoke = () => {
    const prefillMessage = language === 'ru'
      ? `Проведи патентный поиск по концепции "${planTitle}"${planGoal ? `. Описание: ${planGoal}` : ''}`
      : `Conduct a patent search for the concept "${planTitle}"${planGoal ? `. Description: ${planGoal}` : ''}`;

    navigate('/expert-panel', {
      state: {
        prefillMessage,
        selectedModels: [],
        patentSearchContext: {
          planId,
          planTitle,
          planGoal,
          sessionIds: [],
        },
      },
    });
  };

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
        onClick={handleInvoke}
        variant="outline"
        size="sm"
        className="gap-2 border-hydra-patent/30 text-hydra-patent hover:bg-hydra-patent/10"
        disabled={!planGoal?.trim()}
      >
        <Landmark className="h-4 w-4" />
        {t('concept.patentSearch.invoke')}
      </Button>
      {!planGoal?.trim() && (
        <p className="text-xs text-muted-foreground/50 italic">
          {t('concept.patentSearch.needGoal')}
        </p>
      )}
    </section>
  );
}
