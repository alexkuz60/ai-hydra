import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Landmark, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConceptPatentSearchProps {
  planId: string;
  planTitle: string;
  planGoal: string;
  className?: string;
}

export function ConceptPatentSearch({ planId, planTitle, planGoal, className }: ConceptPatentSearchProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleInvoke = async () => {
    if (!user?.id) return;

    const prefillMessage = language === 'ru'
      ? `Проведи патентный поиск по концепции "${planTitle}"${planGoal ? `. Описание: ${planGoal}` : ''}`
      : `Conduct a patent search for the concept "${planTitle}"${planGoal ? `. Description: ${planGoal}` : ''}`;

    setLoading(true);
    try {
      // Find the "Цели и концепция" session under this plan
      // It's the first child session of the first aspect (sorted by sort_order)
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
            patentSearchContext: { planId, planTitle, planGoal },
          },
        });
      } else {
        // Fallback: find any first child session of this plan
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
            patentSearchContext: { planId, planTitle, planGoal },
          },
        });
      }
    } catch (err) {
      console.error('Failed to find concept session:', err);
      // Fallback: navigate without task param
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
        disabled={!planGoal?.trim() || loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
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
