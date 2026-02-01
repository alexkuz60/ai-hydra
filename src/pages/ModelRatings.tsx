import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Brain, BarChart3, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AGENT_ROLES, ROLE_CONFIG, type AgentRole } from '@/config/roles';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
interface ModelRoleStat {
  model_name: string;
  role: string;
  total_brains: number;
  response_count: number;
  average_rating: number;
}

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

// Use centralized role config for icons and colors

export default function ModelRatings() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AggregatedModelStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchStats();
    }
  }, [user, authLoading, navigate]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch all AI messages with ratings for the user
      const { data, error } = await supabase
        .from('messages')
        .select('model_name, role, metadata')
        .eq('user_id', user.id)
        .neq('role', 'user')
        .not('model_name', 'is', null);

      if (error) throw error;

      // Aggregate stats by model and role
      const modelMap = new Map<string, {
        total: number;
        count: number;
        byRole: Map<string, { total: number; count: number }>;
      }>();

      data?.forEach(message => {
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

        // Role-specific stats
        let roleData = modelData.byRole.get(role);
        if (!roleData) {
          roleData = { total: 0, count: 0 };
          modelData.byRole.set(role, roleData);
        }
        roleData.total += rating;
        roleData.count += 1;
      });

      // Convert to array
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
    } catch (error) {
      console.error('Failed to fetch model stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('ratings.title')}</h1>
        </div>

        {stats.length === 0 ? (
          <HydraCard variant="default">
            <HydraCardContent className="py-16 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('ratings.empty')}</p>
            </HydraCardContent>
          </HydraCard>
        ) : (
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

            {/* Overall Tab */}
            <TabsContent value="overall">
              <HydraCard variant="default">
                <HydraCardHeader>
                  <Brain className="h-5 w-5 text-primary" />
                  <HydraCardTitle>{t('ratings.allModels')}</HydraCardTitle>
                </HydraCardHeader>
                <HydraCardContent>
                  <div className="space-y-3">
                    {stats.map((stat, index) => (
                      <ModelStatRow
                        key={stat.model_name}
                        stat={stat}
                        index={index}
                        t={t}
                      />
                    ))}
                  </div>
                </HydraCardContent>
              </HydraCard>
            </TabsContent>

            {/* Role-specific Tabs */}
            {AGENT_ROLES.map(role => {
              const config = ROLE_CONFIG[role];
              const RoleIcon = config.icon;
              const roleStats = stats
                .filter(s => s.by_role[role])
                .map(s => ({
                  model_name: s.model_name,
                  ...s.by_role[role],
                }))
                .sort((a, b) => b.average_rating - a.average_rating);

              return (
                <TabsContent key={role} value={role}>
                  <HydraCard variant="default">
                    <HydraCardHeader>
                      <RoleIcon className={cn("h-5 w-5", config.color)} />
                      <HydraCardTitle className={config.color}>
                        {t(config.label)}
                      </HydraCardTitle>
                    </HydraCardHeader>
                    <HydraCardContent>
                      {roleStats.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          {t('ratings.noDataForRole')}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {roleStats.map((stat, index) => (
                            <RoleStatRow
                              key={stat.model_name}
                              stat={stat}
                              index={index}
                              t={t}
                            />
                          ))}
                        </div>
                      )}
                    </HydraCardContent>
                  </HydraCard>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </Layout>
  );
}

interface ModelStatRowProps {
  stat: AggregatedModelStat;
  index: number;
  t: (key: string) => string;
}

function ModelStatRow({ stat, index, t }: ModelStatRowProps) {
  const rolesInStat = Object.keys(stat.by_role);

  return (
    <div
      className={cn(
        "p-3 rounded-lg",
        index === 0 && "bg-primary/10 border border-primary/20"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {index === 0 && <span className="text-lg">🏆</span>}
          <span className="font-medium truncate">{stat.model_name}</span>
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

      {/* Role breakdown */}
      <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-border/50">
        {Object.keys(stat.by_role).map(role => {
          const config = ROLE_CONFIG[role as AgentRole] || ROLE_CONFIG.assistant;
          const RoleIcon = config.icon;
          const roleData = stat.by_role[role];
          return (
            <div
              key={role}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              title={t(config.label)}
            >
              <RoleIcon className={cn("h-3 w-3", config.color)} />
              <span>{roleData.total_brains}</span>
              <span className="opacity-50">
                (ø{roleData.average_rating.toFixed(1)})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RoleStatRowProps {
  stat: {
    model_name: string;
    total_brains: number;
    response_count: number;
    average_rating: number;
  };
  index: number;
  t: (key: string) => string;
}

function RoleStatRow({ stat, index, t }: RoleStatRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg",
        index === 0 && "bg-primary/10 border border-primary/20"
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {index === 0 && <span className="text-lg">🏆</span>}
        <span className="font-medium truncate">{stat.model_name}</span>
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
  );
}
