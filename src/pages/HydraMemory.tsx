import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Database, Layers, BookOpen, Trash2, RefreshCw, Settings2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHydraMemoryStats } from '@/hooks/useHydraMemoryStats';
import { useGlobalSessionMemory } from '@/hooks/useGlobalSessionMemory';
import { SessionMemoryDialog } from '@/components/warroom/SessionMemoryDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const MEMORY_TYPE_COLORS: Record<string, string> = {
  experience: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  preference: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  skill: 'bg-green-500/15 text-green-400 border-green-500/30',
  mistake: 'bg-red-500/15 text-red-400 border-red-500/30',
  success: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

const CHUNK_TYPE_COLORS: Record<string, string> = {
  decision: 'bg-cyan-500/15 text-cyan-400',
  context: 'bg-blue-500/15 text-blue-400',
  instruction: 'bg-violet-500/15 text-violet-400',
  evaluation: 'bg-amber-500/15 text-amber-400',
  summary: 'bg-green-500/15 text-green-400',
  message: 'bg-muted text-muted-foreground',
};

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent?: boolean }) {
  return (
    <Card className={`border ${accent ? 'border-[hsl(var(--hydra-memory)/0.4)] bg-[hsl(var(--hydra-memory)/0.05)]' : 'border-border bg-card'}`}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2 ${accent ? 'bg-[hsl(var(--hydra-memory)/0.15)]' : 'bg-muted'}`}>
          <Icon className={`h-5 w-5 ${accent ? 'text-[hsl(var(--hydra-memory))]' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Session Memory Tab ─────────────────────────────────────────────────────
function SessionMemoryTab({ stats, loading }: { stats: ReturnType<typeof useHydraMemoryStats>; loading: boolean }) {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const globalMemory = useGlobalSessionMemory();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <StatCard label={t('memory.hub.totalChunks')} value={stats.sessionMemory.total} icon={Layers} accent />
            <StatCard label={t('memory.hub.sessions')} value={stats.sessionMemory.session_count} icon={Database} />
            <StatCard label="Типов данных" value={Object.keys(stats.sessionMemory.by_type).length} icon={BookOpen} />
          </>
        )}
      </div>

      {!loading && stats.sessionMemory.total > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('memory.hub.chunksByType')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(stats.sessionMemory.by_type).map(([type, count]) => (
              <span key={type} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${CHUNK_TYPE_COLORS[type] || 'bg-muted text-muted-foreground'}`}>
                {type} <span className="font-bold">{count}</span>
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      {!loading && stats.sessionMemory.total === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">{t('memory.hub.empty')}</div>
      )}

      {/* Manager button */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="gap-2 border-[hsl(var(--hydra-memory)/0.4)] text-[hsl(var(--hydra-memory))] hover:bg-[hsl(var(--hydra-memory)/0.08)]"
          onClick={() => setDialogOpen(true)}
          disabled={globalMemory.isLoading}
        >
          <Settings2 className="h-4 w-4" />
          {t('memory.manageMemory')}
          {!globalMemory.isLoading && globalMemory.chunks.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">{globalMemory.chunks.length}</Badge>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => globalMemory.refetch()} className="h-8 w-8">
          <RefreshCw className={`h-3.5 w-3.5 ${globalMemory.isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <SessionMemoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        chunks={globalMemory.chunks}
        isLoading={globalMemory.isLoading}
        isDeleting={globalMemory.isDeleting}
        onDeleteChunk={globalMemory.deleteChunk}
        onDeleteDuplicates={globalMemory.deleteChunksBatch}
        isDeletingDuplicates={globalMemory.isDeletingBatch}
        onClearAll={globalMemory.clearAll}
        isClearing={globalMemory.isClearing}
        onSemanticSearch={globalMemory.semanticSearch}
        isSearching={globalMemory.isSearching}
      />
    </div>
  );
}

// ─── Role Memory Tab ─────────────────────────────────────────────────────────
function RoleMemoryTab({ stats, loading, onRefresh }: { stats: ReturnType<typeof useHydraMemoryStats>; loading: boolean; onRefresh: () => void }) {
  const { t } = useLanguage();
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
        .select('id, content, memory_type, confidence_score, created_at, usage_count')
        .eq('user_id', user!.id)
        .eq('role', role)
        .order('created_at', { ascending: false })
        .limit(20);
      setRoleEntries(prev => ({ ...prev, [role]: data || [] }));
    } finally {
      setLoadingRole(null);
    }
  };

  const deleteEntry = async (id: string, role: string) => {
    setDeletingRole(id);
    const { error } = await supabase.from('role_memory').delete().eq('id', id).eq('user_id', user!.id);
    if (error) { toast.error('Ошибка удаления'); }
    else {
      toast.success('Запись удалена');
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
        {stats.roleMemory.map(({ role, count, avg_confidence }) => (
          <Card key={role} className="overflow-hidden">
            <button
              onClick={() => loadRoleEntries(role)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm">{role}</span>
                <Badge variant="outline" className="text-xs">{count} записей</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t('memory.hub.confidence')}: {(avg_confidence * 100).toFixed(0)}%</span>
                <span className={`transition-transform ${expanded === role ? 'rotate-90' : ''}`}>›</span>
              </div>
            </button>

            {expanded === role && (
              <div className="border-t border-border bg-muted/10 divide-y divide-border/50">
                {loadingRole === role ? (
                  <div className="p-3 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : (roleEntries[role] || []).map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${MEMORY_TYPE_COLORS[entry.memory_type] || 'bg-muted'}`}>
                          {entry.memory_type}
                        </span>
                        <span className="text-xs text-muted-foreground">{(entry.confidence_score * 100).toFixed(0)}%</span>
                        {entry.usage_count > 0 && <span className="text-xs text-muted-foreground">× {entry.usage_count}</span>}
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-2">{entry.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
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
        ))}
      </div>
    </div>
  );
}

// ─── Knowledge Tab ─────────────────────────────────────────────────────────
function KnowledgeTab({ stats, loading }: { stats: ReturnType<typeof useHydraMemoryStats>; loading: boolean }) {
  const { t, language } = useLanguage();
  const roleGroups = stats.knowledge.reduce<Record<string, { category: string; count: number }[]>>((acc, k) => {
    if (!acc[k.role]) acc[k.role] = [];
    acc[k.role].push({ category: k.category, count: k.count });
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />) : (
          <>
            <StatCard label={t('memory.hub.knowledgeChunks')} value={stats.totalKnowledge} icon={BookOpen} accent />
            <StatCard label="Ролей с базой" value={Object.keys(roleGroups).length} icon={Database} />
            <StatCard label="Категорий" value={new Set(stats.knowledge.map(k => k.category)).size} icon={Layers} />
          </>
        )}
      </div>

      {!loading && stats.totalKnowledge === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">{t('memory.hub.empty')}</div>
      )}

      <div className="space-y-3">
        {Object.entries(roleGroups).map(([role, categories]) => (
          <Card key={role}>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">{role}</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4 flex flex-wrap gap-2">
              {categories.map(({ category, count }) => (
                <Badge key={category} variant="outline" className="text-xs gap-1.5">
                  {category} <span className="font-bold text-[hsl(var(--hydra-memory))]">{count}</span>
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to="/staff-roles">{t('memory.hub.goToStaff')}</Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function HydraMemory() {
  const { t } = useLanguage();
  const stats = useHydraMemoryStats();

  return (
    <Layout>
      <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2.5 bg-[hsl(var(--hydra-memory)/0.12)] border border-[hsl(var(--hydra-memory)/0.3)]">
              <BrainCircuit className="h-6 w-6 text-[hsl(var(--hydra-memory))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('memory.hub.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('memory.hub.subtitle')}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={stats.refresh} className="shrink-0" title="Обновить">
            <RefreshCw className={`h-4 w-4 ${stats.loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="session">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="session" className="gap-2">
              <Database className="h-3.5 w-3.5" />
              {t('memory.hub.session')}
              <Badge variant="secondary" className="ml-1 text-xs">{stats.sessionMemory.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="role" className="gap-2">
              <Layers className="h-3.5 w-3.5" />
              {t('memory.hub.roleMemory')}
              <Badge variant="secondary" className="ml-1 text-xs">{stats.totalRoleMemory}</Badge>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              {t('memory.hub.knowledge')}
              <Badge variant="secondary" className="ml-1 text-xs">{stats.totalKnowledge}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="session" className="mt-6">
            <SessionMemoryTab stats={stats} loading={stats.loading} />
          </TabsContent>
          <TabsContent value="role" className="mt-6">
            <RoleMemoryTab stats={stats} loading={stats.loading} onRefresh={stats.refresh} />
          </TabsContent>
          <TabsContent value="knowledge" className="mt-6">
            <KnowledgeTab stats={stats} loading={stats.loading} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
