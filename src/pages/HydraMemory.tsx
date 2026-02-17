import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit, Database, Layers, BookOpen, Trash2, RefreshCw,
  HardDrive, FolderOpen, FileImage, FileText, File, Search,
  Loader2, Filter, Copy, Sparkles, Text, MessageSquare, Lightbulb,
  ListChecks, Star, Archive, AlertTriangle,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHydraMemoryStats } from '@/hooks/useHydraMemoryStats';
import { useGlobalSessionMemory } from '@/hooks/useGlobalSessionMemory';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { SessionMemoryChunk, ChunkType, SearchResult } from '@/hooks/useSessionMemory';

// ─── Design tokens ───────────────────────────────────────────────────────────

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

const CHUNK_TYPE_CONFIG: Record<ChunkType, { icon: React.ElementType; color: string; labelKey: string }> = {
  message: { icon: MessageSquare, color: 'text-muted-foreground', labelKey: 'memory.messages' },
  summary: { icon: FileText, color: 'text-hydra-glow', labelKey: 'memory.summaries' },
  decision: { icon: Lightbulb, color: 'text-hydra-success', labelKey: 'memory.decisions' },
  context: { icon: BookOpen, color: 'text-hydra-expert', labelKey: 'memory.context' },
  instruction: { icon: ListChecks, color: 'text-hydra-critical', labelKey: 'memory.instructions' },
  evaluation: { icon: Star, color: 'text-yellow-500', labelKey: 'memory.evaluations' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findDuplicates(chunks: SessionMemoryChunk[]): Map<string, string[]> {
  const duplicateMap = new Map<string, string[]>();
  const contentToIds = new Map<string, string[]>();
  chunks.forEach(chunk => {
    const norm = chunk.content.toLowerCase().trim().replace(/\s+/g, ' ');
    const ids = contentToIds.get(norm) || [];
    ids.push(chunk.id);
    contentToIds.set(norm, ids);
  });
  contentToIds.forEach(ids => {
    if (ids.length > 1) ids.forEach(id => duplicateMap.set(id, ids.filter(o => o !== id)));
  });
  return duplicateMap;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function fileIcon(mime: string | null) {
  if (!mime) return File;
  if (mime.startsWith('image/')) return FileImage;
  if (mime.startsWith('text/') || mime.includes('pdf')) return FileText;
  return File;
}

// ─── StatCard ────────────────────────────────────────────────────────────────

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

// ─── Session Memory Tab (inline manager) ────────────────────────────────────

function SessionMemoryTab({ stats, loading }: { stats: ReturnType<typeof useHydraMemoryStats>; loading: boolean }) {
  const { t } = useLanguage();
  const globalMemory = useGlobalSessionMemory();

  const [activeFilter, setActiveFilter] = useState<ChunkType | 'all' | 'duplicates'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteDuplicates, setConfirmDeleteDuplicates] = useState(false);
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [semanticResults, setSemanticResults] = useState<SearchResult[]>([]);
  const [isSearchingInternal, setIsSearchingInternal] = useState(false);

  const isSearchingActive = globalMemory.isSearching || isSearchingInternal;

  const handleSearchChange = useCallback(async (value: string) => {
    setSearchQuery(value);
    if (useSemanticSearch && globalMemory.semanticSearch && value.trim().length >= 3) {
      setIsSearchingInternal(true);
      try {
        const results = await globalMemory.semanticSearch(value.trim());
        setSemanticResults(results);
      } catch { setSemanticResults([]); }
      finally { setIsSearchingInternal(false); }
    } else if (!value.trim()) {
      setSemanticResults([]);
    }
  }, [useSemanticSearch, globalMemory.semanticSearch]);

  const toggleSearchMode = useCallback(() => {
    setUseSemanticSearch(prev => !prev);
    setSemanticResults([]);
    setSearchQuery('');
  }, []);

  const duplicateMap = useMemo(() => findDuplicates(globalMemory.chunks), [globalMemory.chunks]);
  const duplicateIds = useMemo(() => new Set(duplicateMap.keys()), [duplicateMap]);
  const duplicateCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    duplicateMap.forEach((others, id) => {
      const key = [id, ...others].sort().join(',');
      if (!seen.has(key)) { seen.add(key); count++; }
    });
    return count;
  }, [duplicateMap]);

  const duplicateIdsToDelete = useMemo(() => {
    const toDelete: string[] = [];
    const seen = new Set<string>();
    duplicateMap.forEach((others, id) => {
      const key = [id, ...others].sort().join(',');
      if (!seen.has(key)) {
        seen.add(key);
        const groupChunks = [id, ...others]
          .map(gid => globalMemory.chunks.find(c => c.id === gid)!)
          .filter(Boolean)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        if (groupChunks.length > 1) groupChunks.slice(1).forEach(c => toDelete.push(c.id));
      }
    });
    return toDelete;
  }, [duplicateMap, globalMemory.chunks]);

  const displayItems = useMemo(() => {
    if (useSemanticSearch && semanticResults.length > 0)
      return semanticResults.map(r => ({ ...r, isSemanticResult: true }));
    let result = globalMemory.chunks;
    if (activeFilter === 'duplicates') result = result.filter(c => duplicateIds.has(c.id));
    else if (activeFilter !== 'all') result = result.filter(c => c.chunk_type === activeFilter);
    if (!useSemanticSearch && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => c.content.toLowerCase().includes(q));
    }
    return result.map(c => ({ ...c, isSemanticResult: false, similarity: undefined }));
  }, [globalMemory.chunks, activeFilter, searchQuery, duplicateIds, useSemanticSearch, semanticResults]);

  const chunkCounts = useMemo(() => {
    const counts: Record<string, number> = { all: globalMemory.chunks.length };
    globalMemory.chunks.forEach(c => { counts[c.chunk_type] = (counts[c.chunk_type] || 0) + 1; });
    return counts;
  }, [globalMemory.chunks]);

  const handleDelete = async (chunkId: string) => {
    setDeletingId(chunkId);
    try { await globalMemory.deleteChunk(chunkId); } finally { setDeletingId(null); }
  };

  const handleClearAll = async () => {
    if (!confirmClearAll) { setConfirmClearAll(true); return; }
    await globalMemory.clearAll();
    setConfirmClearAll(false);
  };

  const handleDeleteDuplicates = async () => {
    if (duplicateIdsToDelete.length === 0) return;
    if (!confirmDeleteDuplicates) { setConfirmDeleteDuplicates(true); return; }
    await globalMemory.deleteChunksBatch(duplicateIdsToDelete);
    setConfirmDeleteDuplicates(false);
    setActiveFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
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

      {/* Chunk types breakdown */}
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

      {/* ── Inline memory manager ── */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            {isSearchingActive ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              placeholder={useSemanticSearch ? t('memory.semanticSearchPlaceholder') : t('memory.searchPlaceholder')}
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className={cn('pl-9 h-9 pr-10', useSemanticSearch && 'border-hydra-cyan/50 focus-visible:ring-hydra-cyan/30')}
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={useSemanticSearch ? 'secondary' : 'ghost'}
                size="icon"
                className={cn('h-9 w-9 shrink-0', useSemanticSearch && 'bg-hydra-cyan/20 text-hydra-cyan hover:bg-hydra-cyan/30')}
                onClick={toggleSearchMode}
              >
                <AnimatePresence mode="wait">
                  {useSemanticSearch
                    ? <motion.div key="sem" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}><Sparkles className="h-4 w-4" /></motion.div>
                    : <motion.div key="txt" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}><Text className="h-4 w-4" /></motion.div>
                  }
                </AnimatePresence>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{useSemanticSearch ? t('memory.switchToTextSearch') : t('memory.switchToSemanticSearch')}</p>
            </TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon" onClick={() => globalMemory.refetch()} className="h-9 w-9 shrink-0">
            <RefreshCw className={cn('h-4 w-4', globalMemory.isLoading && 'animate-spin')} />
          </Button>
        </div>

        {useSemanticSearch && (
          <div className="flex items-center gap-2 text-xs text-hydra-cyan/80">
            <Sparkles className="h-3 w-3" />
            <span>{t('memory.semanticSearchHint')}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button variant={activeFilter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveFilter('all')} className="h-7">
            {t('common.all')}
            <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">{chunkCounts.all}</Badge>
          </Button>
          {duplicateCount > 0 && (
            <>
              <Button
                variant={activeFilter === 'duplicates' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter('duplicates')}
                className={cn('h-7', activeFilter === 'duplicates' && 'text-hydra-critical')}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                {t('memory.duplicates')}
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px] text-hydra-critical border-hydra-critical/50">{duplicateCount}</Badge>
              </Button>
              {activeFilter === 'duplicates' && duplicateIdsToDelete.length > 0 && (
                <div className="flex gap-2 ml-auto">
                  {confirmDeleteDuplicates && (
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteDuplicates(false)} disabled={globalMemory.isDeletingBatch} className="h-7">
                      {t('common.cancel')}
                    </Button>
                  )}
                  <Button
                    variant={confirmDeleteDuplicates ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={handleDeleteDuplicates}
                    disabled={globalMemory.isDeletingBatch}
                    className={cn('h-7', confirmDeleteDuplicates && 'animate-pulse')}
                  >
                    {globalMemory.isDeletingBatch ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> :
                      confirmDeleteDuplicates ? <AlertTriangle className="h-3.5 w-3.5 mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                    {confirmDeleteDuplicates ? t('memory.confirmDeleteDuplicates') : `${t('memory.deleteDuplicates')} (${duplicateIdsToDelete.length})`}
                  </Button>
                </div>
              )}
            </>
          )}
          {(Object.keys(CHUNK_TYPE_CONFIG) as ChunkType[]).map(type => {
            const cfg = CHUNK_TYPE_CONFIG[type];
            const count = chunkCounts[type] || 0;
            if (count === 0) return null;
            return (
              <Button key={type} variant={activeFilter === type ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveFilter(type)} className={cn('h-7', activeFilter === type && cfg.color)}>
                <cfg.icon className="h-3.5 w-3.5 mr-1" />
                {t(cfg.labelKey)}
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">{count}</Badge>
              </Button>
            );
          })}
        </div>

        {/* Chunks list */}
        <div className="border rounded-md overflow-hidden">
          <ScrollArea className="h-[420px]">
            {globalMemory.isLoading || isSearchingActive ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Archive className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">{searchQuery ? t('memory.noSearchResults') : t('memory.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-border pr-3">
                {displayItems.map(item => {
                  const cfg = CHUNK_TYPE_CONFIG[item.chunk_type as ChunkType] || CHUNK_TYPE_CONFIG.message;
                  const Icon = cfg.icon;
                  const isDuplicate = duplicateIds.has(item.id);
                  const similarity = 'similarity' in item ? item.similarity : undefined;
                  const isSemanticResult = 'isSemanticResult' in item && item.isSemanticResult;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'p-3 hover:bg-muted/50 transition-colors group',
                        isDuplicate && 'bg-amber-500/5 border-l-2 border-l-amber-500/50',
                        isSemanticResult && 'border-l-2 border-l-hydra-cyan/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('mt-0.5', cfg.color)}><Icon className="h-4 w-4" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className={cn('text-[10px] h-5', cfg.color)}>{t(cfg.labelKey)}</Badge>
                            {similarity !== undefined && (
                              <Badge variant="outline" className="text-[10px] h-5 text-hydra-cyan border-hydra-cyan/50">
                                <Sparkles className="h-2.5 w-2.5 mr-0.5" />{Math.round((similarity as number) * 100)}%
                              </Badge>
                            )}
                            {isDuplicate && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Badge variant="outline" className="text-[10px] h-5 text-amber-500 border-amber-500/50">
                                      <Copy className="h-2.5 w-2.5 mr-0.5" />{t('memory.duplicate')}
                                    </Badge>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>{t('memory.duplicateTooltip')}</TooltipContent>
                              </Tooltip>
                            )}
                            {'created_at' in item && (
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date((item as SessionMemoryChunk).created_at), 'dd.MM.yy HH:mm')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm line-clamp-3 text-foreground/90">{item.content}</p>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(item.id)}
                              disabled={globalMemory.isDeleting || deletingId === item.id}
                            >
                              {deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('common.delete')}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer: clear all */}
        {globalMemory.chunks.length > 0 && (
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-muted-foreground">
              {t('memory.totalChunks')}: {globalMemory.chunks.length}
              {duplicateCount > 0 && <span className="ml-2 text-amber-500">({duplicateCount} {t('memory.duplicateGroups')})</span>}
            </span>
            <div className="flex gap-2">
              {confirmClearAll && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmClearAll(false)} disabled={globalMemory.isClearing}>
                  {t('common.cancel')}
                </Button>
              )}
              <Button
                variant={confirmClearAll ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleClearAll}
                disabled={globalMemory.isClearing}
                className={cn('transition-all', confirmClearAll && 'animate-pulse')}
              >
                {globalMemory.isClearing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> :
                  confirmClearAll ? <AlertTriangle className="h-4 w-4 mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                {confirmClearAll ? t('memory.confirmClearAll') : t('memory.clearAll')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Role Memory Tab ──────────────────────────────────────────────────────────

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
    } finally { setLoadingRole(null); }
  };

  const deleteEntry = async (id: string, role: string) => {
    setDeletingRole(id);
    const { error } = await supabase.from('role_memory').delete().eq('id', id).eq('user_id', user!.id);
    if (error) toast.error('Ошибка удаления');
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
                ) : (roleEntries[role] || []).map(entry => (
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
        ))}
      </div>
    </div>
  );
}

// ─── Knowledge Tab ────────────────────────────────────────────────────────────

function KnowledgeTab({ stats, loading }: { stats: ReturnType<typeof useHydraMemoryStats>; loading: boolean }) {
  const { t } = useLanguage();
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
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm">{role}</CardTitle></CardHeader>
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

// ─── Storage Tab ──────────────────────────────────────────────────────────────

type StorageFile = {
  id: string;
  name: string;
  bucket: string;
  size: number;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
};

const BUCKETS = ['message-files', 'task-files', 'avatars'] as const;

function StorageTab() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBucket, setActiveBucket] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allFiles: StorageFile[] = [];
      for (const bucket of BUCKETS) {
        try {
          const { data, error } = await supabase.storage.from(bucket).list(`${user.id}`, {
            limit: 200,
            sortBy: { column: 'created_at', order: 'desc' },
          });
          if (error || !data) continue;
          for (const f of data) {
            if (f.id) {
              allFiles.push({
                id: `${bucket}/${user.id}/${f.name}`,
                name: f.name,
                bucket,
                size: f.metadata?.size ?? 0,
                mime_type: f.metadata?.mimetype ?? null,
                created_at: f.created_at ?? '',
                updated_at: f.updated_at ?? '',
              });
            }
          }
        } catch { /* skip bucket on error */ }
      }
      setFiles(allFiles);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleDelete = async (file: StorageFile) => {
    setDeletingId(file.id);
    try {
      const path = `${user!.id}/${file.name}`;
      const { error } = await supabase.storage.from(file.bucket).remove([path]);
      if (error) toast.error('Ошибка удаления файла');
      else {
        toast.success(`Файл «${file.name}» удалён`);
        setFiles(prev => prev.filter(f => f.id !== file.id));
      }
    } finally {
      setDeletingId(null); 
    }
  };

  const bucketCounts = useMemo(() => {
    const counts: Record<string, number> = { all: files.length };
    files.forEach(f => { counts[f.bucket] = (counts[f.bucket] || 0) + 1; });
    return counts;
  }, [files]);

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);

  const displayed = useMemo(() => {
    let result = files;
    if (activeBucket !== 'all') result = result.filter(f => f.bucket === activeBucket);
    if (searchQuery.trim()) result = result.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [files, activeBucket, searchQuery]);

  const bucketColors: Record<string, string> = {
    'message-files': 'text-blue-400 border-blue-500/30',
    'task-files': 'text-amber-400 border-amber-500/30',
    'avatars': 'text-green-400 border-green-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />) : (
          <>
            <StatCard label={t('memory.hub.storageFiles')} value={files.length} icon={FolderOpen} accent />
            <StatCard label={t('memory.hub.storageBuckets')} value={BUCKETS.length} icon={HardDrive} />
            <StatCard label={t('memory.hub.storageSize')} value={formatBytes(totalSize)} icon={Database} />
          </>
        )}
      </div>

      {/* Bucket filter + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <Button variant={activeBucket === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveBucket('all')} className="h-7">
            {t('common.all')}
            <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">{bucketCounts.all || 0}</Badge>
          </Button>
          {BUCKETS.map(b => (
            <Button
              key={b}
              variant={activeBucket === b ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveBucket(b)}
              className={cn('h-7', activeBucket === b && bucketColors[b])}
            >
              {b}
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">{bucketCounts[b] || 0}</Badge>
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Поиск по имени..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-7 text-xs" />
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={loadFiles}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* File list */}
      <div className="border rounded-md overflow-hidden">
        <ScrollArea className="h-[420px]">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">{t('memory.hub.storageEmpty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {displayed.map(file => {
                const Icon = fileIcon(file.mime_type);
                return (
                  <div key={file.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5', bucketColors[file.bucket])}>{file.bucket}</Badge>
                        <span className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</span>
                        {file.created_at && (
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(file.created_at), 'dd.MM.yy HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(file)}
                          disabled={deletingId === file.id}
                        >
                          {deletingId === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('common.delete')}</TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
            <TabsTrigger value="storage" className="gap-2">
              <HardDrive className="h-3.5 w-3.5" />
              {t('memory.hub.storage')}
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
          <TabsContent value="storage" className="mt-6">
            <StorageTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
