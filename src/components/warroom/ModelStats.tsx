import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Brain, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelStat {
  model_name: string;
  total_brains: number;
  response_count: number;
  average_rating: number;
}

export function ModelStats() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<ModelStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch all AI messages with ratings for the user
      const { data, error } = await supabase
        .from('messages')
        .select('model_name, metadata')
        .eq('user_id', user.id)
        .neq('role', 'user')
        .not('model_name', 'is', null);

      if (error) throw error;

      // Aggregate stats by model
      const modelMap = new Map<string, { total: number; count: number; rated: number }>();

      data?.forEach(message => {
        const modelName = message.model_name;
        if (!modelName) return;

        const metadata = message.metadata as Record<string, unknown> | null;
        const rating = typeof metadata?.rating === 'number' ? metadata.rating : 0;

        const current = modelMap.get(modelName) || { total: 0, count: 0, rated: 0 };
        current.total += rating;
        current.count += 1;
        if (rating > 0) current.rated += 1;
        modelMap.set(modelName, current);
      });

      // Convert to array and calculate averages
      const statsArray: ModelStat[] = Array.from(modelMap.entries())
        .map(([model_name, { total, count }]) => ({
          model_name,
          total_brains: total,
          response_count: count,
          average_rating: count > 0 ? total / count : 0,
        }))
        .sort((a, b) => b.total_brains - a.total_brains);

      setStats(statsArray);
    } catch (error) {
      console.error('Failed to fetch model stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (stats.length === 0) {
    return null;
  }

  return (
    <HydraCard variant="default" className="mb-4">
      <HydraCardHeader>
        <BarChart3 className="h-5 w-5 text-primary" />
        <HydraCardTitle>{t('stats.modelRatings')}</HydraCardTitle>
      </HydraCardHeader>
      <HydraCardContent>
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div
              key={stat.model_name}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                index === 0 && "bg-primary/10 border border-primary/20"
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {index === 0 && <span className="text-lg">🏆</span>}
                <span className="font-medium truncate text-sm">
                  {stat.model_name}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1" title={t('stats.totalBrains')}>
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-bold text-primary">{stat.total_brains}</span>
                </div>
                
                <div className="flex items-center gap-1 text-muted-foreground" title={t('stats.avgRating')}>
                  <span className="text-xs">ø</span>
                  <span>{stat.average_rating.toFixed(1)}</span>
                </div>
                
                <div className="text-muted-foreground text-xs" title={t('stats.responseCount')}>
                  ({stat.response_count})
                </div>
              </div>
            </div>
          ))}
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}
