import React from 'react';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getProfileText } from '../i18n';
import type { AnalyticsEntry } from './types';

interface ProxyAnalyticsSectionProps {
  analyticsData: AnalyticsEntry[];
  onDeleteStats: (rawModelId: string, displayModel: string) => void;
}

export function ProxyAnalyticsSection({ analyticsData, onDeleteStats }: ProxyAnalyticsSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const p = (key: string) => getProfileText(key, isRu);

  return (
    <AccordionItem value="analytics" className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="font-semibold">{p('analytics')}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        {analyticsData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{p('notEnoughData')}</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">{p('avgLatencyByModel')}</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analyticsData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="model" width={120} tick={{ fontSize: 10 }} />
                  <RechartsTooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="avgLatency" name={p('latencyMs')} radius={[0, 4, 4, 0]}>
                    {analyticsData.map((_, i) => (
                      <Cell key={i} fill={`hsl(var(--primary) / ${0.4 + (i % 3) * 0.2})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {analyticsData.map(m => {
                const isProblematic = m.errors > 0 && m.success === 0;
                return (
                  <div key={m.model} className={cn(
                    "relative p-3 rounded-lg border space-y-1 transition-colors",
                    isProblematic ? "bg-destructive/10 border-destructive/40" : "bg-card/50"
                  )}>
                    <button
                      onClick={() => onDeleteStats(m.rawModelId, m.model)}
                      className="absolute top-1.5 right-1.5 p-0.5 rounded-sm text-muted-foreground hover:text-destructive transition-colors"
                      title={p('deleteModelStats')}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                    <p className="text-xs font-medium truncate pr-5">{m.model}</p>
                    {isProblematic && (
                      <div className="flex items-center gap-1 text-[10px] text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{p('errorsOnly')}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{p('total')}</span>
                      <span className="font-mono">{m.total}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400">✓ OK</span>
                      <span className="font-mono">{m.success}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-destructive">✗ {p('errors')}</span>
                      <span className="font-mono">{m.errors}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
