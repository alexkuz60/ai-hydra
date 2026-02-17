import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit, Database, Layers, BookOpen, Trash2, RefreshCw,
  HardDrive, FolderOpen, FileImage, FileText, File, Search,
  Loader2, Filter, Copy, Sparkles, Text, MessageSquare, Lightbulb,
  ListChecks, Star, Archive, AlertTriangle, Eye, X, Download, GitMerge,
  GitBranch, Wrench, BarChart2, Zap, ScanSearch, Clock, CheckCircle2, XCircle,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  type SearchMode = 'text' | 'semantic' | 'hybrid';
  const [searchMode, setSearchMode] = useState<SearchMode>('text');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchingInternal, setIsSearchingInternal] = useState(false);

  const isSearchingActive = globalMemory.isSearching || isSearchingInternal;
  const isAdvancedSearch = searchMode !== 'text';

  const handleSearchChange = useCallback(async (value: string) => {
    setSearchQuery(value);
    if (searchMode !== 'text' && value.trim().length >= 3) {
      setIsSearchingInternal(true);
      try {
        const fn = searchMode === 'hybrid' ? globalMemory.hybridSearch : globalMemory.semanticSearch;
        const results = fn ? await fn(value.trim()) : [];
        setSearchResults(results);
      } catch { setSearchResults([]); }
      finally { setIsSearchingInternal(false); }
    } else if (!value.trim()) {
      setSearchResults([]);
    }
  }, [searchMode, globalMemory.hybridSearch, globalMemory.semanticSearch]);

  const cycleSearchMode = useCallback(() => {
    setSearchMode(prev => prev === 'text' ? 'semantic' : prev === 'semantic' ? 'hybrid' : 'text');
    setSearchResults([]);
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
    if (isAdvancedSearch && searchResults.length > 0)
      return searchResults.map(r => ({ ...r, isSemanticResult: true }));
    let result = globalMemory.chunks;
    if (activeFilter === 'duplicates') result = result.filter(c => duplicateIds.has(c.id));
    else if (activeFilter !== 'all') result = result.filter(c => c.chunk_type === activeFilter);
    if (!isAdvancedSearch && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => c.content.toLowerCase().includes(q));
    }
    return result.map(c => ({ ...c, isSemanticResult: false, similarity: undefined }));
  }, [globalMemory.chunks, activeFilter, searchQuery, duplicateIds, isAdvancedSearch, searchResults]);

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
              placeholder={searchMode === 'semantic' ? t('memory.semanticSearchPlaceholder') : searchMode === 'hybrid' ? 'Гибридный поиск (BM25 + вектор)...' : t('memory.searchPlaceholder')}
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className={cn(
                'pl-9 h-9 pr-10',
                searchMode === 'semantic' && 'border-hydra-cyan/50 focus-visible:ring-hydra-cyan/30',
                searchMode === 'hybrid' && 'border-purple-500/50 focus-visible:ring-purple-500/30',
              )}
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isAdvancedSearch ? 'secondary' : 'ghost'}
                size="icon"
                className={cn(
                  'h-9 w-9 shrink-0',
                  searchMode === 'semantic' && 'bg-hydra-cyan/20 text-hydra-cyan hover:bg-hydra-cyan/30',
                  searchMode === 'hybrid' && 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30',
                )}
                onClick={cycleSearchMode}
              >
                <AnimatePresence mode="wait">
                  {searchMode === 'semantic'
                    ? <motion.div key="sem" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}><Sparkles className="h-4 w-4" /></motion.div>
                    : searchMode === 'hybrid'
                    ? <motion.div key="hyb" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}><GitMerge className="h-4 w-4" /></motion.div>
                    : <motion.div key="txt" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}><Text className="h-4 w-4" /></motion.div>
                  }
                </AnimatePresence>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">
                {searchMode === 'text' ? 'Текстовый поиск → нажми для семантического' : searchMode === 'semantic' ? 'Семантический поиск → нажми для гибридного' : 'Гибридный поиск (BM25+вектор) → нажми для текстового'}
              </p>
            </TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon" onClick={() => globalMemory.refetch()} className="h-9 w-9 shrink-0">
            <RefreshCw className={cn('h-4 w-4', globalMemory.isLoading && 'animate-spin')} />
          </Button>
        </div>

        {searchMode === 'semantic' && (
          <div className="flex items-center gap-2 text-xs text-hydra-cyan/80">
            <Sparkles className="h-3 w-3" />
            <span>{t('memory.semanticSearchHint')}</span>
          </div>
        )}
        {searchMode === 'hybrid' && (
          <div className="flex items-center gap-2 text-xs text-purple-400/80">
            <GitMerge className="h-3 w-3" />
            <span>Гибридный поиск: BM25 + косинусное сходство, объединение через RRF</span>
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

// ─── Knowledge Tab with Deduplication Tools (Iteration 5) ────────────────────

interface KnowledgeEntryRaw {
  id: string;
  content: string;
  source_title: string | null;
  source_url: string | null;
  category: string;
  version: string | null;
  chunk_index: number;
  embedding: unknown;
}

function KnowledgeTab({ stats, loading }: { stats: ReturnType<typeof useHydraMemoryStats>; loading: boolean }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [similarGroups, setSimilarGroups] = useState<KnowledgeEntryRaw[][]>([]);
  const [outdatedGroups, setOutdatedGroups] = useState<KnowledgeEntryRaw[][]>([]);
  const [qualityStats, setQualityStats] = useState<{ avgWords: number; noEmbedding: number; total: number } | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [scanDone, setScanDone] = useState(false);

  const roleGroups = stats.knowledge.reduce<Record<string, { category: string; count: number }[]>>((acc, k) => {
    if (!acc[k.role]) acc[k.role] = [];
    acc[k.role].push({ category: k.category, count: k.count });
    return acc;
  }, {});

  const runScan = useCallback(async () => {
    if (!user?.id) return;
    setScanning(true);
    setScanDone(false);
    try {
      const { data, error } = await (supabase as any)
        .from('role_knowledge')
        .select('id, content, source_title, source_url, category, version, chunk_index, embedding')
        .eq('user_id', user.id);

      if (error) throw error;
      const rows = (data || []) as unknown as KnowledgeEntryRaw[];

      // Quality stats
      const wordCounts = rows.map(r => r.content.trim().split(/\s+/).length);
      const avgWords = rows.length ? wordCounts.reduce((a, b) => a + b, 0) / rows.length : 0;
      const noEmbedding = rows.filter(r => !r.embedding).length;
      setQualityStats({ avgWords: Math.round(avgWords), noEmbedding, total: rows.length });

      // Find similar (exact content duplicates or very similar)
      const contentMap = new Map<string, KnowledgeEntryRaw[]>();
      rows.forEach(r => {
        const key = r.content.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 200);
        const arr = contentMap.get(key) || [];
        arr.push(r);
        contentMap.set(key, arr);
      });
      setSimilarGroups(Array.from(contentMap.values()).filter(g => g.length > 1));

      // Find outdated: same source_url + role, keep highest version
      const sourceMap = new Map<string, KnowledgeEntryRaw[]>();
      rows.forEach(r => {
        if (r.source_url) {
          const key = r.source_url;
          const arr = sourceMap.get(key) || [];
          arr.push(r);
          sourceMap.set(key, arr);
        }
      });
      const outdated: KnowledgeEntryRaw[][] = [];
      sourceMap.forEach(group => {
        const withVersion = group.filter(r => r.version);
        if (withVersion.length < 2) return;
        const sorted = [...withVersion].sort((a, b) => (b.version || '').localeCompare(a.version || ''));
        const latestVersion = sorted[0].version;
        const old = group.filter(r => r.version && r.version !== latestVersion);
        if (old.length > 0) outdated.push(old);
      });
      setOutdatedGroups(outdated);
      setScanDone(true);
    } catch (e) {
      console.error('[KnowledgeTab] scan error', e);
      toast.error('Ошибка сканирования базы знаний');
    } finally {
      setScanning(false);
    }
  }, [user?.id]);

  const deleteEntries = useCallback(async (ids: string[]) => {
    if (!user?.id || ids.length === 0) return;
    setDeletingIds(prev => { const s = new Set(prev); ids.forEach(id => s.add(id)); return s; });
    try {
      const { error } = await supabase
        .from('role_knowledge' as any)
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success(`Удалено ${ids.length} записей`);
      // Re-scan after deletion
      await runScan();
      stats.refresh();
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setDeletingIds(new Set());
    }
  }, [user?.id, runScan, stats]);

  const allSimilarToDelete = useMemo(() =>
    similarGroups.flatMap(g => g.slice(1).map(r => r.id)), [similarGroups]);
  const allOutdatedToDelete = useMemo(() =>
    outdatedGroups.flatMap(g => g.map(r => r.id)), [outdatedGroups]);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />) : (
          <>
            <StatCard label={t('memory.hub.knowledgeChunks')} value={stats.totalKnowledge} icon={BookOpen} accent />
            <StatCard label="Ролей с базой" value={Object.keys(roleGroups).length} icon={Database} />
            <StatCard label="Категорий" value={new Set(stats.knowledge.map(k => k.category)).size} icon={Layers} />
          </>
        )}
      </div>

      {/* Deduplication Tools Panel */}
      <Card className="border-[hsl(var(--hydra-memory)/0.25)] bg-[hsl(var(--hydra-memory)/0.03)]">
        <button
          onClick={() => { setToolsOpen(o => !o); if (!toolsOpen && !scanDone) runScan(); }}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[hsl(var(--hydra-memory))]" />
            <span className="text-sm font-medium">Инструменты очистки</span>
            {scanDone && (similarGroups.length > 0 || outdatedGroups.length > 0) && (
              <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/40">
                {similarGroups.length + outdatedGroups.length} проблем
              </Badge>
            )}
          </div>
          <span className={`text-muted-foreground transition-transform text-xs ${toolsOpen ? 'rotate-90' : ''}`}>›</span>
        </button>

        <AnimatePresence>
          {toolsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="p-4 space-y-4">
                {/* Scan button */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Анализ базы знаний на дубликаты и устаревшие версии</p>
                  <Button size="sm" variant="outline" onClick={runScan} disabled={scanning} className="h-7 gap-1.5">
                    {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5" />}
                    {scanning ? 'Сканирование...' : 'Сканировать'}
                  </Button>
                </div>

                {scanDone && qualityStats && (
                  <div className="grid grid-cols-3 gap-3">
                    {/* Quality stats */}
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                      <BarChart2 className="h-4 w-4 mx-auto mb-1 text-[hsl(var(--hydra-memory))]" />
                      <p className="text-lg font-bold">{qualityStats.avgWords}</p>
                      <p className="text-[10px] text-muted-foreground">ср. слов/чанк</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                      <Copy className="h-4 w-4 mx-auto mb-1 text-amber-400" />
                      <p className="text-lg font-bold text-amber-400">{similarGroups.length}</p>
                      <p className="text-[10px] text-muted-foreground">групп похожих</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-orange-400" />
                      <p className="text-lg font-bold text-orange-400">{allOutdatedToDelete.length}</p>
                      <p className="text-[10px] text-muted-foreground">устаревших</p>
                    </div>
                  </div>
                )}

                {scanDone && qualityStats && qualityStats.noEmbedding > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 rounded-lg px-3 py-2 border border-amber-500/20">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{qualityStats.noEmbedding} чанков без эмбеддинга — семантический поиск будет неточным</span>
                  </div>
                )}

                {scanDone && similarGroups.length === 0 && outdatedGroups.length === 0 && (
                  <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2 border border-green-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>База знаний чистая — дубликатов и устаревших записей не найдено</span>
                  </div>
                )}

                {/* Similar groups */}
                {scanDone && similarGroups.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                        <Copy className="h-3.5 w-3.5" />
                        Похожие чанки ({similarGroups.length} групп, {allSimilarToDelete.length} дубликатов)
                      </p>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                        disabled={deletingIds.size > 0}
                        onClick={() => deleteEntries(allSimilarToDelete)}
                      >
                        {deletingIds.size > 0 ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                        Удалить все дубликаты
                      </Button>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {similarGroups.map((group, gi) => (
                        <div key={gi} className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-amber-400 font-medium">{group.length} копий</span>
                            <Button
                              size="sm" variant="ghost"
                              className="h-5 px-2 text-[10px] text-destructive hover:text-destructive"
                              disabled={deletingIds.size > 0}
                              onClick={() => deleteEntries(group.slice(1).map(r => r.id))}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Удалить {group.length - 1}
                            </Button>
                          </div>
                          <p className="text-muted-foreground line-clamp-1">{group[0].content.slice(0, 120)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outdated groups */}
                {scanDone && outdatedGroups.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-orange-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Устаревшие версии ({allOutdatedToDelete.length} чанков)
                      </p>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                        disabled={deletingIds.size > 0}
                        onClick={() => deleteEntries(allOutdatedToDelete)}
                      >
                        {deletingIds.size > 0 ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                        Удалить устаревшие
                      </Button>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {outdatedGroups.map((group, gi) => (
                        <div key={gi} className="rounded border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground truncate">{group[0].source_url}</span>
                            <span className="text-orange-400 ml-2 shrink-0">{group.map(r => r.version).join(', ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

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

// ─── Memory Graph Tab (Iteration 6) ──────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: 'role' | 'memory' | 'session';
  count?: number;
  usageCount?: number;
  confidence?: number;
  x: number;
  y: number;
  r: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

function MemoryGraphTab({ stats }: { stats: ReturnType<typeof useHydraMemoryStats> }) {
  const { user } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);
  const [roleMemoryDetails, setRoleMemoryDetails] = useState<Record<string, { sessions: string[]; usageCount: number }>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || stats.roleMemory.length === 0) return;
    setLoadingDetails(true);
    supabase
      .from('role_memory')
      .select('role, source_session_id, usage_count')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const details: Record<string, { sessions: string[]; usageCount: number }> = {};
        (data || []).forEach(row => {
          if (!details[row.role]) details[row.role] = { sessions: [], usageCount: 0 };
          details[row.role].usageCount += row.usage_count || 0;
          if (row.source_session_id && !details[row.role].sessions.includes(row.source_session_id)) {
            details[row.role].sessions.push(row.source_session_id);
          }
        });
        setRoleMemoryDetails(details);
        setLoadingDetails(false);
      });
  }, [user?.id, stats.roleMemory]);

  // Build graph nodes & edges
  const { nodes, edges } = useMemo(() => {
    const W = 740;
    const H = 460;
    const cx = W / 2;
    const cy = H / 2;

    const roleNodes: GraphNode[] = [];
    const memoryNodes: GraphNode[] = [];
    const sessionNodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const sessionIds = new Set<string>();

    const maxCount = Math.max(...stats.roleMemory.map(r => r.count), 1);

    stats.roleMemory.forEach((rm, i) => {
      const angle = (2 * Math.PI * i) / stats.roleMemory.length - Math.PI / 2;
      const radius = Math.min(cx, cy) * 0.62;
      const nodeSize = 18 + (rm.count / maxCount) * 18;
      const roleNode: GraphNode = {
        id: `role_${rm.role}`,
        label: rm.role,
        type: 'role',
        count: rm.count,
        confidence: rm.avg_confidence,
        usageCount: roleMemoryDetails[rm.role]?.usageCount || 0,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        r: nodeSize,
      };
      roleNodes.push(roleNode);
      edges.push({ source: 'center', target: roleNode.id });

      // Add session nodes for hot roles (usageCount > 2)
      const detail = roleMemoryDetails[rm.role];
      if (detail && detail.usageCount > 2) {
        detail.sessions.slice(0, 2).forEach((sid, si) => {
          if (!sessionIds.has(sid)) {
            sessionIds.add(sid);
            const sa = angle + ((si - 0.5) * 0.4);
            const sr = radius * 1.55;
            const sessNode: GraphNode = {
              id: `sess_${sid}`,
              label: sid.slice(0, 8) + '…',
              type: 'session',
              x: cx + sr * Math.cos(sa),
              y: cy + sr * Math.sin(sa),
              r: 10,
            };
            sessionNodes.push(sessNode);
            edges.push({ source: roleNode.id, target: sessNode.id });
          } else {
            edges.push({ source: roleNode.id, target: `sess_${sid}` });
          }
        });
      }
    });

    const centerNode: GraphNode = {
      id: 'center',
      label: 'Гидра',
      type: 'memory',
      x: cx,
      y: cy,
      r: 28,
    };
    memoryNodes.push(centerNode);

    return { nodes: [...memoryNodes, ...roleNodes, ...sessionNodes], edges };
  }, [stats.roleMemory, roleMemoryDetails]);

  const nodeMap = useMemo(() => {
    const m: Record<string, GraphNode> = {};
    nodes.forEach(n => { m[n.id] = n; });
    return m;
  }, [nodes]);

  if (stats.loading || loadingDetails) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--hydra-memory))]" />
      </div>
    );
  }

  if (stats.roleMemory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <GitBranch className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">Нет данных для графа памяти</p>
        <p className="text-xs mt-1 opacity-60">Добавьте записи опыта через чат с ролями</p>
      </div>
    );
  }

  const maxUsage = Math.max(...stats.roleMemory.map(r => roleMemoryDetails[r.role]?.usageCount || 0), 1);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-3 w-3 rounded-full bg-[hsl(var(--hydra-memory))] opacity-80" />
          <span>Роль</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-3 w-3 rounded-full bg-[hsl(var(--hydra-cyan))]" />
          <span>Центр (Гидра)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-3 w-3 rounded-full bg-[hsl(var(--hydra-expert))]" opacity-70 />
          <span>Связанная сессия</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 text-amber-400" />
          <span>Горячая роль (высокий usage)</span>
        </div>
      </div>

      {/* SVG Graph */}
      <Card className="overflow-hidden border-border">
        <div className="relative w-full" style={{ aspectRatio: '740/460' }}>
          <svg
            ref={svgRef}
            viewBox="0 0 740 460"
            className="w-full h-full"
            style={{ background: 'transparent' }}
          >
            {/* Grid background pattern */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.5" />
              </pattern>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--hydra-cyan))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--hydra-cyan))" stopOpacity="0" />
              </radialGradient>
              <filter id="nodeGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <rect width="740" height="460" fill="url(#grid)" />

            {/* Center glow */}
            <circle cx="370" cy="230" r="60" fill="url(#centerGlow)" />

            {/* Edges */}
            {edges.map((edge, i) => {
              const src = nodeMap[edge.source];
              const tgt = nodeMap[edge.target];
              if (!src || !tgt) return null;
              const isHovered = hoveredId === edge.source || hoveredId === edge.target;
              return (
                <line
                  key={i}
                  x1={src.x} y1={src.y}
                  x2={tgt.x} y2={tgt.y}
                  stroke={isHovered ? 'hsl(var(--hydra-memory))' : 'hsl(var(--border))'}
                  strokeWidth={isHovered ? 1.5 : 0.8}
                  strokeDasharray={edge.source === 'center' ? undefined : '4 3'}
                  opacity={isHovered ? 0.8 : 0.4}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const isCenter = node.id === 'center';
              const isHot = node.type === 'role' && (roleMemoryDetails[node.label]?.usageCount || 0) > (maxUsage * 0.5);
              const isSelected = selected?.id === node.id;
              const isHovered = hoveredId === node.id;
              const fill = isCenter
                ? 'hsl(var(--hydra-cyan))'
                : node.type === 'session'
                ? 'hsl(var(--hydra-expert))'
                : 'hsl(var(--hydra-memory))';

              return (
                <g
                  key={node.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelected(isSelected ? null : node)}
                  filter={isSelected || isHovered ? 'url(#nodeGlow)' : undefined}
                >
                  {/* Hot badge ring */}
                  {isHot && (
                    <circle
                      cx={node.x} cy={node.y} r={node.r + 5}
                      fill="none"
                      stroke="hsl(38, 92%, 50%)"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                      opacity="0.7"
                    />
                  )}
                  <circle
                    cx={node.x} cy={node.y} r={node.r}
                    fill={fill}
                    opacity={isSelected || isHovered ? 1 : 0.75}
                    stroke={isSelected ? 'hsl(var(--foreground))' : 'transparent'}
                    strokeWidth="2"
                  />
                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.type === 'role' ? node.y + node.r + 13 : node.y + 4}
                    textAnchor="middle"
                    fill="hsl(var(--foreground))"
                    fontSize={isCenter ? 11 : node.type === 'session' ? 8 : 10}
                    fontWeight={isCenter || isSelected ? 600 : 400}
                    opacity={isCenter ? 1 : 0.85}
                  >
                    {isCenter ? node.label : node.label.slice(0, 14)}
                  </text>
                  {/* Count badge */}
                  {node.type === 'role' && node.count && node.count > 1 && (
                    <text
                      x={node.x + node.r - 3}
                      y={node.y - node.r + 7}
                      textAnchor="middle"
                      fill="hsl(var(--background))"
                      fontSize="7"
                      fontWeight={700}
                    >
                      {node.count}
                    </text>
                  )}
                  {isHot && (
                    <text x={node.x + node.r + 3} y={node.y - node.r + 4} fontSize="8">⚡</text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Selected node details */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-3 left-3 right-3 bg-card/95 backdrop-blur border border-border rounded-lg p-3 text-xs shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{selected.label}</p>
                    {selected.type === 'role' && (
                      <>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>Записей опыта: <strong className="text-foreground">{selected.count}</strong></span>
                          {selected.confidence !== undefined && (
                            <span>Ср. уверенность: <strong className="text-foreground">{(selected.confidence * 100).toFixed(0)}%</strong></span>
                          )}
                          {(selected.usageCount ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-amber-400">
                              <Zap className="h-3 w-3" />
                              Использований: {selected.usageCount}
                            </span>
                          )}
                        </div>
                        {roleMemoryDetails[selected.label]?.sessions.length > 0 && (
                          <p className="text-muted-foreground">
                            Связанных сессий: {roleMemoryDetails[selected.label].sessions.length}
                          </p>
                        )}
                      </>
                    )}
                    {selected.type === 'session' && (
                      <p className="text-muted-foreground">Сессия: {selected.label}</p>
                    )}
                    {selected.type === 'memory' && (
                      <p className="text-muted-foreground">Центральный узел — память всей Гидры</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setSelected(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Hot roles list */}
      {stats.roleMemory.filter(r => (roleMemoryDetails[r.role]?.usageCount || 0) > 0).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Активность ролей
          </p>
          <div className="space-y-1">
            {stats.roleMemory
              .filter(r => (roleMemoryDetails[r.role]?.usageCount || 0) > 0)
              .sort((a, b) => (roleMemoryDetails[b.role]?.usageCount || 0) - (roleMemoryDetails[a.role]?.usageCount || 0))
              .slice(0, 8)
              .map(r => {
                const usage = roleMemoryDetails[r.role]?.usageCount || 0;
                const pct = Math.round((usage / maxUsage) * 100);
                return (
                  <div key={r.role} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 truncate shrink-0">{r.role}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--hydra-memory))] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{usage}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
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

type PreviewState = { file: StorageFile; url: string } | null;

function StorageTab() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBucket, setActiveBucket] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

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
      // Generate thumbnails for image files
      const thumbMap: Record<string, string> = {};
      const imageFiles = allFiles.filter(f => f.mime_type?.startsWith('image/'));
      await Promise.all(
        imageFiles.map(async f => {
          try {
            const path = `${user.id}/${f.name}`;
            const { data } = await supabase.storage.from(f.bucket).createSignedUrl(path, 3600);
            if (data?.signedUrl) thumbMap[f.id] = data.signedUrl;
          } catch { /* skip */ }
        })
      );
      setThumbnails(thumbMap);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handlePreview = async (file: StorageFile) => {
    if (!file.mime_type?.startsWith('image/')) return;
    // Reuse thumbnail URL if already loaded
    if (thumbnails[file.id]) {
      setPreview({ file, url: thumbnails[file.id] });
      return;
    }
    setPreviewLoading(true);
    try {
      const path = `${user!.id}/${file.name}`;
      const { data, error } = await supabase.storage.from(file.bucket).createSignedUrl(path, 3600);
      if (error || !data?.signedUrl) {
        toast.error('Не удалось загрузить изображение');
        return;
      }
      setThumbnails(prev => ({ ...prev, [file.id]: data.signedUrl }));
      setPreview({ file, url: data.signedUrl });
    } catch {
      toast.error('Ошибка предпросмотра');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (file: StorageFile) => {
    setDeletingId(file.id);
    try {
      const path = `${user!.id}/${file.name}`;
      const { error } = await supabase.storage.from(file.bucket).remove([path]);
      if (error) toast.error('Ошибка удаления файла');
      else {
        toast.success(`Файл «${file.name}» удалён`);
        setFiles(prev => prev.filter(f => f.id !== file.id));
        if (preview?.file.id === file.id) setPreview(null);
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
                const isImage = file.mime_type?.startsWith('image/') ?? false;
                const Icon = fileIcon(file.mime_type);
                return (
                  <div key={file.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group">
                    {/* Thumbnail or icon */}
                    <button
                      className={cn(
                        'shrink-0 flex items-center justify-center rounded overflow-hidden',
                        isImage
                          ? 'w-10 h-10 border border-border bg-muted hover:border-[hsl(var(--hydra-memory)/0.5)] transition-colors cursor-pointer'
                          : 'w-7 h-7 cursor-default pointer-events-none'
                      )}
                      onClick={() => isImage && handlePreview(file)}
                      disabled={previewLoading || !isImage}
                      title={isImage ? 'Предпросмотр' : undefined}
                    >
                      {isImage && thumbnails[file.id] ? (
                        <img
                          src={thumbnails[file.id]}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : previewLoading && preview === null && isImage ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Icon className={cn('text-muted-foreground', isImage ? 'h-5 w-5' : 'h-4 w-4')} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn('text-sm font-medium truncate', isImage && 'cursor-pointer hover:text-[hsl(var(--hydra-memory))] transition-colors')}
                        onClick={() => isImage && handlePreview(file)}
                      >
                        {file.name}
                      </p>
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

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isImage && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-[hsl(var(--hydra-memory))]"
                              onClick={() => handlePreview(file)}
                              disabled={previewLoading}
                            >
                              {previewLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Предпросмотр</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(file)}
                            disabled={deletingId === file.id}
                          >
                            {deletingId === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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

      {/* Image Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={open => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background/95 backdrop-blur">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-sm font-medium truncate max-w-[calc(100%-5rem)] flex items-center gap-2">
              <FileImage className="h-4 w-4 text-[hsl(var(--hydra-memory))] shrink-0" />
              {preview?.file.name}
            </DialogTitle>
            <div className="flex items-center gap-1 shrink-0">
              {preview && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={preview.url}
                      download={preview.file.name}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Скачать</TooltipContent>
                </Tooltip>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreview(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {preview && (
            <div className="flex flex-col items-center justify-center p-4 min-h-[300px] max-h-[75vh] overflow-auto">
              <img
                src={preview.url}
                alt={preview.file.name}
                className="max-w-full max-h-[65vh] object-contain rounded-md shadow-lg"
                onError={() => { toast.error('Не удалось загрузить изображение'); setPreview(null); }}
              />
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <Badge variant="outline" className={cn('text-[10px]', bucketColors[preview.file.bucket])}>{preview.file.bucket}</Badge>
                <span>{formatBytes(preview.file.size)}</span>
                <span>{preview.file.mime_type}</span>
                {preview.file.created_at && <span>{format(new Date(preview.file.created_at), 'dd.MM.yyyy HH:mm')}</span>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HydraMemory() {
  const { t } = useLanguage();
  const stats = useHydraMemoryStats();

  return (
    <Layout>
      <div className="flex flex-col gap-6 p-6 lg:p-8 w-full">
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
          <TabsList className="w-full justify-start flex-wrap gap-1 h-auto">
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
            <TabsTrigger value="graph" className="gap-2">
              <GitBranch className="h-3.5 w-3.5" />
              Граф памяти
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
          <TabsContent value="graph" className="mt-6">
            <MemoryGraphTab stats={stats} />
          </TabsContent>
          <TabsContent value="storage" className="mt-6">
            <StorageTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
