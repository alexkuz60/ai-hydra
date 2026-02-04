import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Activity, Calendar, Zap } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import type { CustomTool } from '@/types/customTools';

interface ToolUsageStatsProps {
  tool: CustomTool;
  allTools: CustomTool[];
}

export function ToolUsageStats({ tool, allTools }: ToolUsageStatsProps) {
  const { t, language } = useLanguage();
  const locale = language === 'ru' ? ru : enUS;

  // Calculate statistics
  const stats = useMemo(() => {
    const daysSinceCreation = differenceInDays(new Date(), new Date(tool.created_at)) || 1;
    const avgPerDay = tool.usage_count / daysSinceCreation;
    
    // Find rank among all tools
    const sortedByUsage = [...allTools].sort((a, b) => b.usage_count - a.usage_count);
    const rank = sortedByUsage.findIndex(t => t.id === tool.id) + 1;
    
    // Calculate percentile
    const percentile = allTools.length > 1 
      ? Math.round((1 - (rank - 1) / (allTools.length - 1)) * 100)
      : 100;
    
    return {
      totalUsage: tool.usage_count,
      avgPerDay: avgPerDay.toFixed(1),
      daysSinceCreation,
      rank,
      totalTools: allTools.length,
      percentile,
    };
  }, [tool, allTools]);

  // Prepare chart data - top 5 tools for comparison
  const chartData = useMemo(() => {
    const sorted = [...allTools]
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 5)
      .map(t => ({
        name: t.display_name.length > 12 ? t.display_name.slice(0, 12) + '…' : t.display_name,
        fullName: t.display_name,
        usage: t.usage_count,
        isCurrent: t.id === tool.id,
      }));
    
    // If current tool not in top 5, add it
    if (!sorted.some(t => t.isCurrent)) {
      sorted.push({
        name: tool.display_name.length > 12 ? tool.display_name.slice(0, 12) + '…' : tool.display_name,
        fullName: tool.display_name,
        usage: tool.usage_count,
        isCurrent: true,
      });
    }
    
    return sorted;
  }, [tool, allTools]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullName: string; usage: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="font-medium text-sm">{data.fullName}</p>
          <p className="text-xs text-muted-foreground">
            {t('tools.usageCount')}: {data.usage}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">{t('tools.usageStatistics')}</h3>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{stats.totalUsage}</p>
                <p className="text-xs text-muted-foreground">{t('tools.totalCalls')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-accent/50 border-accent/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/30">
                <TrendingUp className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgPerDay}</p>
                <p className="text-xs text-muted-foreground">{t('tools.avgPerDay')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.daysSinceCreation}</p>
                <p className="text-xs text-muted-foreground">{t('tools.daysActive')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-muted">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">#{stats.rank}</p>
                <p className="text-xs text-muted-foreground">{t('tools.rankOf')} {stats.totalTools}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Comparison Chart */}
      {allTools.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">{t('tools.usageComparison')}</h4>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={80}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                <Bar 
                  dataKey="usage" 
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Metadata row */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2 border-t">
        <div>
          <span className="font-medium">{t('tools.created')}:</span>{' '}
          {format(new Date(tool.created_at), 'dd.MM.yyyy', { locale })}
        </div>
        <div>
          <span className="font-medium">{t('tools.updated')}:</span>{' '}
          {format(new Date(tool.updated_at), 'dd.MM.yyyy', { locale })}
        </div>
      </div>
    </section>
  );
}
