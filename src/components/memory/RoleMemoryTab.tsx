import React, { useState } from 'react';
import { Database, Layers, BookOpen, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROLE_CONFIG } from '@/config/roles';
import { TermLabel } from '@/components/ui/TermLabel';
import type { useHydraMemoryStats } from '@/hooks/useHydraMemoryStats';
import { StatCard, MEMORY_TYPE_COLORS, MEMORY_TYPE_LABELS } from './shared';

export function RoleMemoryTab({ stats, loading, onRefresh }: { stats: ReturnType<typeof useHydraMemoryStats>; loading: boolean; onRefresh: () => void }) {
  const { t, language } = useLanguage();

  const getLocalizedContent = (entry: any): string => {
    if (language === 'en') {
      const meta = (typeof entry.metadata === 'object' && entry.metadata !== null ? entry.metadata : {}) as Record<string, unknown>;
      if (typeof meta.content_en === 'string' && meta.content_en) return meta.content_en;
    }
    return entry.content;
  };
  const { user } = useAuth();
  const [deletingRole, setDeletingRole] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [roleEntries, setRoleEntries] = useState<Record<string, any[]>>({});
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const loadRoleEntries = async (role: string) => {
    if (expanded === role) { setExpanded(null); return; }
    setExpanded(role);
    if (roleEntries[role]) return;
    setLoadingRole(role);
    try {
      const { data } = await supabase
        .from('role_memory')
        .select('id, content, memory_type, confidence_score, created_at, usage_count, metadata')
        .eq('user_id', user!.id)
        .eq('role', role)
        .order('created_at', { ascending: false })
        .limit(20);
      setRoleEntries(prev => ({ ...prev, [role]: data || [] }));
    } finally { setLoadingRole(null); }
  };

  const deleteEntry = async (id: string, role: string) => {
    setDeletingRole(id);
    const { error } = await supabase.from('role_memory').delete().eq('id', id).eq('user_id', user!.id);
    if (error) toast.error(t('memory.hub.deleteEntryError'));
    else {
      toast.success(t('memory.hub.deleteEntrySuccess'));
      setRoleEntries(prev => ({ ...prev, [role]: (prev[role] || []).filter(e => e.id !== id) }));
      onRefresh();
    }
    setDeletingRole(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />) : (
          <>
            <StatCard label={t('memory.hub.totalChunks')} value={stats.totalRoleMemory} icon={Layers} accent />
            <StatCard label={t('memory.hub.roles')} value={stats.roleMemory.length} icon={Database} />
            <StatCard label={t('memory.hub.avgConfidence')} value={stats.roleMemory.length ? (stats.roleMemory.reduce((s, r) => s + r.avg_confidence, 0) / stats.roleMemory.length * 100).toFixed(0) + '%' : '—'} icon={BookOpen} />
          </>
        )}
      </div>
      {!loading && stats.roleMemory.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">{t('memory.hub.empty')}</div>
      )}
      <div className="space-y-2">
        {stats.roleMemory.map(({ role, count, avg_confidence }) => {
          const rc = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
          const roleLabel = rc ? t(rc.label) : role;
          return (
          <Card key={role} className="overflow-hidden">
            <button
              onClick={() => loadRoleEntries(role)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Badge className={cn("text-xs font-medium", rc?.color, rc ? 'border' : '')} variant="outline">
                  {rc && (() => { const Icon = rc.icon; return <Icon className="h-3 w-3 mr-1" />; })()}
                  {roleLabel}
                </Badge>
                <Badge variant="outline" className="text-xs">{count} {t('memory.hub.entriesCount')}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TermLabel term="avg_confidence">{t('memory.hub.confidence')}: {(avg_confidence * 100).toFixed(0)}%</TermLabel>
                <span className={`transition-transform ${expanded === role ? 'rotate-90' : ''}`}>›</span>
              </div>
            </button>
            {expanded === role && (
              <div className="border-t border-border bg-muted/10 divide-y divide-border/50">
                {loadingRole === role ? (
                  <div className="p-3 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : (roleEntries[role] || []).map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TermLabel term="memory_type" className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${MEMORY_TYPE_COLORS[entry.memory_type] || 'bg-muted'}`}>
                          {MEMORY_TYPE_LABELS[entry.memory_type]?.[language === 'ru' ? 'ru' : 'en'] ?? entry.memory_type}
                        </TermLabel>
                        <TermLabel term="confidence_score" className="text-xs text-muted-foreground">{(entry.confidence_score * 100).toFixed(0)}%</TermLabel>
                        {entry.usage_count > 0 && <TermLabel term="usage_count" className="text-xs text-muted-foreground">× {entry.usage_count}</TermLabel>}
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-2">{getLocalizedContent(entry)}</p>
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={deletingRole === entry.id}
                      onClick={() => deleteEntry(entry.id, role)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
          );
        })}
      </div>
    </div>
  );
}
