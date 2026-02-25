import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
}

export function ConceptVisionaryCall({ planId, planTitle, planGoal, className, response, onExpand }: ConceptVisionaryCallProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleInvoke = async () => {
    if (!user?.id) return;

    const prefillMessage = language === 'ru'
      ? `Сформулируй визионерскую концепцию проекта "${planTitle}"${planGoal ? `. Текущее описание: ${planGoal}` : ''}`
      : `Formulate a visionary concept for the project "${planTitle}"${planGoal ? `. Current description: ${planGoal}` : ''}`;

    setLoading(true);
    try {
      const { data: conceptSession } = await supabase
        .from('sessions')
        .select('id, title')
        .eq('plan_id', planId)
        .eq('user_id', user.id)
        .or('title.ilike.%цели и концепция%,title.ilike.%goals and concept%')
        .limit(1)
        .maybeSingle();

      if (conceptSession) {
        navigate(`/expert-panel?task=${conceptSession.id}`, {
          state: {
            prefillMessage,
            visionaryContext: { planId, planTitle, planGoal },
          },
        });
      } else {
        const { data: firstSession } = await supabase
          .from('sessions')
          .select('id')
          .eq('plan_id', planId)
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true })
          .limit(1)
          .maybeSingle();

        navigate(firstSession ? `/expert-panel?task=${firstSession.id}` : '/expert-panel', {
          state: {
            prefillMessage,
            visionaryContext: { planId, planTitle, planGoal },
          },
        });
      }
    } catch (err) {
      console.error('Failed to find concept session:', err);
      navigate('/expert-panel', {
        state: { prefillMessage },
      });
    } finally {
      setLoading(false);
    }
  };

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
        onClick={handleInvoke}
        variant="outline"
        size="sm"
        className="gap-2 border-hydra-visionary/30 text-hydra-visionary hover:bg-hydra-visionary/10"
        disabled={!planGoal?.trim() || loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
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
