import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type TimePeriod = 'week' | 'month' | 'all';

interface ModelStat {
  model_name: string;
  total_brains: number;
  response_count: number;
  average_rating: number;
}

interface ModelStatsChartProps {
  stats: ModelStat[];
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

// Generate colors based on position
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--hydra-cyan))',
  'hsl(var(--hydra-purple))',
  'hsl(var(--hydra-amber))',
  'hsl(160, 70%, 50%)',
  'hsl(200, 60%, 60%)',
  'hsl(330, 65%, 55%)',
  'hsl(45, 80%, 55%)',
  'hsl(280, 55%, 60%)',
  'hsl(15, 75%, 55%)',
];

export function ModelStatsChart({ stats, selectedPeriod, onPeriodChange }: ModelStatsChartProps) {
  const { t } = useLanguage();

  if (stats.length === 0) return null;

  // Prepare data for charts
  const top10 = stats.slice(0, 10);
  
  const barData = top10.map((stat, index) => ({
    name: formatModelName(stat.model_name),
    fullName: stat.model_name,
    avgRating: Number(stat.average_rating.toFixed(2)),
    totalBrains: stat.total_brains,
    responses: stat.response_count,
    fill: COLORS[index % COLORS.length],
  }));

  const pieData = top10.map((stat, index) => ({
    name: formatModelName(stat.model_name),
    value: stat.total_brains,
    fill: COLORS[index % COLORS.length],
  }));

  // Calculate summary stats
  const totalResponses = stats.reduce((sum, s) => sum + s.response_count, 0);
  const totalBrains = stats.reduce((sum, s) => sum + s.total_brains, 0);
  const overallAvg = totalResponses > 0 
    ? stats.reduce((sum, s) => sum + s.average_rating * s.response_count, 0) / totalResponses 
    : 0;

  const chartConfig: ChartConfig = {
    avgRating: {
      label: t('ratings.avgRating'),
      color: 'hsl(var(--primary))',
    },
    totalBrains: {
      label: t('stats.totalBrains'),
      color: 'hsl(var(--hydra-cyan))',
    },
  };

  return (
    <HydraCard variant="default" className="mb-6">
      <HydraCardHeader className="flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <HydraCardTitle>{t('ratings.statsOverview')}</HydraCardTitle>
        </div>
        
        {/* Period Filter */}
        <div className="flex items-center gap-2 ml-auto">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <ToggleGroup 
            type="single" 
            value={selectedPeriod} 
            onValueChange={(value) => value && onPeriodChange(value as TimePeriod)}
            className="gap-0"
          >
            <ToggleGroupItem value="week" size="sm" className="text-xs px-2 h-7">
              {t('ratings.periodWeek')}
            </ToggleGroupItem>
            <ToggleGroupItem value="month" size="sm" className="text-xs px-2 h-7">
              {t('ratings.periodMonth')}
            </ToggleGroupItem>
            <ToggleGroupItem value="all" size="sm" className="text-xs px-2 h-7">
              {t('ratings.periodAll')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </HydraCardHeader>
      <HydraCardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{stats.length}</div>
            <div className="text-xs text-muted-foreground">{t('ratings.modelsUsed')}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-hydra-cyan">{totalBrains}</div>
            <div className="text-xs text-muted-foreground">{t('stats.totalBrains')}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-hydra-arbiter">{overallAvg.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">{t('ratings.overallAvg')}</div>
          </div>
        </div>

        {/* Charts */}
        <Tabs defaultValue="bar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="bar" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('ratings.barChart')}
            </TabsTrigger>
            <TabsTrigger value="pie" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              {t('ratings.pieChart')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bar" className="mt-0">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100} 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
                        <div className="font-medium mb-1">{data.fullName}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{t('ratings.avgRating')}:</span>
                          <span className="font-bold text-primary">{data.avgRating}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{t('stats.totalBrains')}:</span>
                          <span className="font-bold">{data.totalBrains}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{t('stats.responseCount')}:</span>
                          <span>{data.responses}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="avgRating" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="pie" className="mt-0">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={40}
                  paddingAngle={2}
                  label={({ name, percent, x, y, textAnchor }) => (
                    <text x={x} y={y} textAnchor={textAnchor} fill="hsl(var(--foreground))" fontSize={12}>
                      {`${name} (${(percent * 100).toFixed(0)}%)`}
                    </text>
                  )}
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
                        <div className="font-medium mb-1">{data.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{t('stats.totalBrains')}:</span>
                          <span className="font-bold text-primary">{data.value}</span>
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </HydraCardContent>
    </HydraCard>
  );
}

// Shorten model names for display
function formatModelName(name: string): string {
  // Remove provider prefix for compact display
  const parts = name.split('/');
  const modelName = parts[parts.length - 1];
  
  // Truncate if too long
  if (modelName.length > 15) {
    return modelName.slice(0, 12) + '...';
  }
  return modelName;
}
