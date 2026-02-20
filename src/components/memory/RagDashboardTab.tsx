import React, { useState, useCallback, useEffect } from 'react';
import {
  Archive, RefreshCw, Loader2, Target, Activity, ThumbsUp, ThumbsDown, TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from './shared';

interface RagRow {
  chunk_id: string;
  session_id: string;
  content_preview: string;
  chunk_type: string;
  retrieved_count: number;
  relevance_score: number | null;
  feedback: number | null;
  last_retrieved_at: string | null;
  created_at: string;
}

export function RagDashboardTab() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [rows, setRows] = useState<RagRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_rag_analytics' as any);
      if (!error && data) setRows(data as RagRow[]);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const positive = rows.filter(r => r.feedback === 1).length;
  const negative = rows.filter(r => r.feedback === -1).length;
  const avgScore = rows.length
    ? (rows.filter(r => r.relevance_score !== null).reduce((s, r) => s + (r.relevance_score ?? 0), 0) /
       Math.max(rows.filter(r => r.relevance_score !== null).length, 1) * 100).toFixed(0)
    : '—';
  const totalRetrievals = rows.reduce((s, r) => s + r.retrieved_count, 0);

  const chunkTypeColor: Record<string, string> = {
    decision: 'text-hydra-cyan', context: 'text-hydra-info', instruction: 'text-hydra-memory',
    evaluation: 'text-hydra-warning', summary: 'text-hydra-success', message: 'text-muted-foreground',
  };

  const chunkTypeLabel: Record<string, string> = {
    message: t('memory.hub.chunkTypeMessage'),
    summary: t('memory.hub.chunkTypeSummary'),
    decision: t('memory.hub.chunkTypeDecision'),
    context: t('memory.hub.chunkTypeContext'),
    instruction: t('memory.hub.chunkTypeInstruction'),
    evaluation: t('memory.hub.chunkTypeEvaluation'),
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t('memory.hub.ragAvgScore')} value={avgScore + (avgScore !== '—' ? '%' : '')} icon={Target} accent description={t('memory.hub.ragAvgScoreDesc')} />
        <StatCard label={t('memory.hub.ragRetrievals')} value={totalRetrievals} icon={Activity} description={t('memory.hub.ragRetrievalsDesc')} />
        <StatCard label={t('memory.hub.ragPositiveFeedback')} value={positive} icon={ThumbsUp} description={t('memory.hub.ragPositiveFeedbackDesc')} />
        <StatCard label={t('memory.hub.ragNegativeFeedback')} value={negative} icon={ThumbsDown} description={t('memory.hub.ragNegativeFeedbackDesc')} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {t('memory.hub.ragTopChunks')}
        </h3>
        <Button variant="ghost" size="icon" onClick={load} className="h-7 w-7">
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Archive className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">{t('memory.hub.ragNoData')}</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <ScrollArea className="h-[420px]">
            <div className="divide-y divide-border">
              {rows.map(row => (
                <div key={row.chunk_id} className="flex items-start gap-3 p-3 hover:bg-muted/40 transition-colors group">
                  <div className="flex flex-col items-center shrink-0 min-w-[2.5rem]">
                    <span className="text-lg font-bold text-foreground">{row.retrieved_count}</span>
                    <span className="text-[9px] text-muted-foreground leading-tight text-center">
                      {t('memory.hub.ragRetrievalsShort')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                       <span className={cn('text-[10px] font-medium', chunkTypeColor[row.chunk_type] || 'text-muted-foreground')}>
                         {chunkTypeLabel[row.chunk_type] || row.chunk_type}
                       </span>
                      {row.relevance_score !== null && (
                        <Badge variant="outline" className="text-[10px] h-4 text-hydra-cyan border-hydra-cyan/40">
                          {(row.relevance_score * 100).toFixed(0)}%
                        </Badge>
                      )}
                      {row.feedback === 1 && <ThumbsUp className="h-3 w-3 text-hydra-success" />}
                      {row.feedback === -1 && <ThumbsDown className="h-3 w-3 text-destructive" />}
                      {row.last_retrieved_at && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {format(new Date(row.last_retrieved_at), 'dd.MM HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/80 line-clamp-2">{row.content_preview}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
