import React, { useState, useEffect, forwardRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Brain, Sparkles } from 'lucide-react';
import { ModelNameWithIcon } from '@/components/ui/ModelNameWithIcon';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AGENT_ROLES, ROLE_CONFIG, type AgentRole } from '@/config/roles';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ModelStatsChart, TimePeriod } from '@/components/ratings/ModelStatsChart';
import { subDays, isAfter } from 'date-fns';

interface AggregatedModelStat {
  model_name: string;
  total_brains: number;
  response_count: number;
  average_rating: number;
  by_role: {
    [role: string]: {
      total_brains: number;
      response_count: number;
      average_rating: number;
    };
  };
}

export function RatingsContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<AggregatedModelStat[]>([]);
  const [allMessages, setAllMessages] = useState<Array<{ model_name: string | null; role: string; created_at: string; metadata: unknown }>>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMessages();
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('model_name, role, metadata, created_at')
        .eq('user_id', user.id)
        .neq('role', 'user')
        .not('model_name', 'is', null);
      if (error) throw error;
      setAllMessages(data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats based on selected period
  useEffect(() => {
    if (allMessages.length === 0) return;
    const now = new Date();
    let cutoffDate: Date | null = null;
    if (selectedPeriod === 'week') cutoffDate = subDays(now, 7);
    else if (selectedPeriod === 'month') cutoffDate = subDays(now, 30);

    const filteredMessages = cutoffDate
      ? allMessages.filter(msg => isAfter(new Date(msg.created_at), cutoffDate!))
      : allMessages;

    const modelMap = new Map<string, {
      total: number; count: number;
      byRole: Map<string, { total: number; count: number }>;
    }>();

    filteredMessages.forEach(message => {
      const modelName = message.model_name;
      const role = message.role;
      if (!modelName) return;
      const metadata = message.metadata as Record<string, unknown> | null;
      const rating = typeof metadata?.rating === 'number' ? metadata.rating : 0;

      let modelData = modelMap.get(modelName);
      if (!modelData) {
        modelData = { total: 0, count: 0, byRole: new Map() };
        modelMap.set(modelName, modelData);
      }
      modelData.total += rating;
      modelData.count += 1;

      let roleData = modelData.byRole.get(role);
      if (!roleData) {
        roleData = { total: 0, count: 0 };
        modelData.byRole.set(role, roleData);
      }
      roleData.total += rating;
      roleData.count += 1;
    });

    const statsArray: AggregatedModelStat[] = Array.from(modelMap.entries())
      .map(([model_name, data]) => {
        const by_role: AggregatedModelStat['by_role'] = {};
        data.byRole.forEach((roleData, role) => {
          by_role[role] = {
            total_brains: roleData.total,
            response_count: roleData.count,
            average_rating: roleData.count > 0 ? roleData.total / roleData.count : 0,
          };
        });
        return {
          model_name,
          total_brains: data.total,
          response_count: data.count,
          average_rating: data.count > 0 ? data.total / data.count : 0,
          by_role,
        };
      })
      .sort((a, b) => b.average_rating - a.average_rating);

    setStats(statsArray);
  }, [allMessages, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <HydraCard variant="default" className="max-w-md w-full">
          <HydraCardContent className="py-16 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('ratings.empty')}</p>
          </HydraCardContent>
        </HydraCard>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <ModelStatsChart
          stats={stats}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />

        <Tabs defaultValue="overall" className="space-y-6">
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <TabsList className="inline-flex w-max gap-1">
              <TabsTrigger value="overall" className="px-4">{t('ratings.overall')}</TabsTrigger>
              {AGENT_ROLES.map(role => {
                const config = ROLE_CONFIG[role];
                const Icon = config.icon;
                return (
                  <TabsTrigger key={role} value={role} className="flex items-center gap-1.5 px-3">
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", config.color)} />
                    <span className="whitespace-nowrap">{t(config.label)}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollBar orientation="horizontal" className="h-2" />
          </ScrollArea>

          <TabsContent value="overall">
            <HydraCard variant="default">
              <HydraCardHeader>
                <Brain className="h-5 w-5 text-primary" />
                <HydraCardTitle>{t('ratings.allModels')}</HydraCardTitle>
              </HydraCardHeader>
              <HydraCardContent>
                <div className="space-y-3">
                  {stats.map((stat, index) => (
                    <ModelStatRow key={stat.model_name} stat={stat} index={index} t={t} />
                  ))}
                </div>
              </HydraCardContent>
            </HydraCard>
          </TabsContent>

          {AGENT_ROLES.map(role => {
            const config = ROLE_CONFIG[role];
            const RoleIcon = config.icon;
            const roleStats = stats
              .filter(s => s.by_role[role])
              .map(s => ({ model_name: s.model_name, ...s.by_role[role] }))
              .sort((a, b) => b.average_rating - a.average_rating);

            return (
              <TabsContent key={role} value={role}>
                <HydraCard variant="default">
                  <HydraCardHeader>
                    <RoleIcon className={cn("h-5 w-5", config.color)} />
                    <HydraCardTitle className={config.color}>{t(config.label)}</HydraCardTitle>
                  </HydraCardHeader>
                  <HydraCardContent>
                    {roleStats.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">{t('ratings.noDataForRole')}</p>
                    ) : (
                      <div className="space-y-3">
                        {roleStats.map((stat, index) => (
                          <RoleStatRow key={stat.model_name} stat={stat} index={index} t={t} />
                        ))}
                      </div>
                    )}
                  </HydraCardContent>
                </HydraCard>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </ScrollArea>
  );
}

// --- Sub-components ---

function ModelStatRow({ stat, index, t }: { stat: AggregatedModelStat; index: number; t: (key: string) => string }) {
  return (
    <div className={cn("p-3 rounded-lg", index === 0 && "bg-primary/10 border border-primary/20")}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {index === 0 && <span className="text-lg">🏆</span>}
          <ModelNameWithIcon modelName={stat.model_name} className="font-medium" iconSize="h-4 w-4" />
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
          <div className="text-muted-foreground text-xs" title={t('stats.responseCount')}>({stat.response_count})</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-border/50">
        {Object.keys(stat.by_role).map(role => {
          const config = ROLE_CONFIG[role as AgentRole] || ROLE_CONFIG.assistant;
          const RoleIcon = config.icon;
          const roleData = stat.by_role[role];
          return (
            <div key={role} className="flex items-center gap-1.5 text-xs text-muted-foreground" title={t(config.label)}>
              <RoleIcon className={cn("h-3 w-3", config.color)} />
              <span>{roleData.total_brains}</span>
              <span className="opacity-50">(ø{roleData.average_rating.toFixed(1)})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const RoleStatRow = forwardRef<HTMLDivElement, {
  stat: { model_name: string; total_brains: number; response_count: number; average_rating: number };
  index: number;
  t: (key: string) => string;
}>(function RoleStatRow({ stat, index, t }, ref) {
  return (
    <div ref={ref} className={cn("flex items-center justify-between p-3 rounded-lg", index === 0 && "bg-primary/10 border border-primary/20")}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {index === 0 && <span className="text-lg">🏆</span>}
        <ModelNameWithIcon modelName={stat.model_name} className="font-medium" iconSize="h-4 w-4" />
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
        <div className="text-muted-foreground text-xs" title={t('stats.responseCount')}>({stat.response_count})</div>
      </div>
    </div>
  );
});
