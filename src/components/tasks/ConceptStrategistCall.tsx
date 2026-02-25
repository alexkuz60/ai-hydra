import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Target, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConceptStrategistCallProps {
  planId: string;
  planTitle: string;
  planGoal: string;
  className?: string;
}

export function ConceptStrategistCall({ planId, planTitle, planGoal, className }: ConceptStrategistCallProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleInvoke = async () => {
    if (!user?.id) return;

    const prefillMessage = language === 'ru'
      ? `Декомпозируй цели проекта "${planTitle}" в иерархию аспектов и задач${planGoal ? `. Концепция: ${planGoal}` : ''}`
      : `Decompose the goals of project "${planTitle}" into a hierarchy of aspects and tasks${planGoal ? `. Concept: ${planGoal}` : ''}`;

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
            strategistContext: { planId, planTitle, planGoal },
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
            strategistContext: { planId, planTitle, planGoal },
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
        <Target className="h-4 w-4 text-hydra-strategist" />
        {t('concept.strategist.title')}
      </h3>
      <p className="text-xs text-muted-foreground/70">
        {t('concept.strategist.description')}
      </p>
      <Button
        onClick={handleInvoke}
        variant="outline"
        size="sm"
        className="gap-2 border-hydra-strategist/30 text-hydra-strategist hover:bg-hydra-strategist/10"
        disabled={!planGoal?.trim() || loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
        {t('concept.strategist.invoke')}
      </Button>
      {!planGoal?.trim() && (
        <p className="text-xs text-muted-foreground/50 italic">
          {t('concept.strategist.needGoal')}
        </p>
      )}
    </section>
  );
}
