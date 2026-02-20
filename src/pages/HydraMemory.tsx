import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
// @ts-ignore — TermLabel + glossary for human-readable technical terms
import { TermLabel } from '@/components/ui/TermLabel';
import { getTermLabel } from '@/config/memoryGlossary';
import { Link } from 'react-router-dom';
import {
  BrainCircuit, Database, Layers, BookOpen, Trash2, RefreshCw,
  HardDrive, FolderOpen, FileImage, FileText, File, Search,
  Loader2, Filter, Copy, Sparkles, Text, MessageSquare, Lightbulb,
  ListChecks, Star, Archive, AlertTriangle, AlertCircle, Eye, X, Download, GitMerge,
  GitBranch, Wrench, BarChart2, Zap, ScanSearch, Clock, CheckCircle2, XCircle,
  ExternalLink, Trophy, Users, Cpu, Network, ThumbsUp, ThumbsDown,
  TrendingUp, Activity, Target, Award, ScrollText, FlaskConical, CheckCheck, Timer,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
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
import { useUserRoles } from '@/hooks/useUserRoles';
import { ROLE_CONFIG } from '@/config/roles';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// ─── Design tokens ───────────────────────────────────────────────────────────

const MEMORY_TYPE_COLORS: Record<string, string> = {
  experience: 'bg-hydra-info/15 text-hydra-info border-hydra-info/30',
  preference: 'bg-hydra-expert/15 text-hydra-expert border-hydra-expert/30',
  skill: 'bg-hydra-success/15 text-hydra-success border-hydra-success/30',
  mistake: 'bg-hydra-critical/15 text-hydra-critical border-hydra-critical/30',
  success: 'bg-hydra-warning/15 text-hydra-warning border-hydra-warning/30',
};

const CHUNK_TYPE_COLORS: Record<string, string> = {
  decision: 'bg-hydra-cyan/15 text-hydra-cyan',
  context: 'bg-hydra-info/15 text-hydra-info',
  instruction: 'bg-hydra-memory/15 text-hydra-memory',
  evaluation: 'bg-hydra-warning/15 text-hydra-warning',
  summary: 'bg-hydra-success/15 text-hydra-success',
  message: 'bg-muted text-muted-foreground',
};

const CHUNK_TYPE_CONFIG: Record<ChunkType, { icon: React.ElementType; color: string; labelKey: string }> = {
  message: { icon: MessageSquare, color: 'text-muted-foreground', labelKey: 'memory.messages' },
  summary: { icon: FileText, color: 'text-hydra-glow', labelKey: 'memory.summaries' },
  decision: { icon: Lightbulb, color: 'text-hydra-success', labelKey: 'memory.decisions' },
  context: { icon: BookOpen, color: 'text-hydra-expert', labelKey: 'memory.context' },
  instruction: { icon: ListChecks, color: 'text-hydra-critical', labelKey: 'memory.instructions' },
  evaluation: { icon: Star, color: 'text-hydra-warning', labelKey: 'memory.evaluations' },
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

function StatCard({ label, value, icon: Icon, accent, description }: { label: string; value: string | number; icon: React.ElementType; accent?: boolean; description?: string }) {
  return (
    <Card className={`border ${accent ? 'border-hydra-memory/40 bg-hydra-memory/5' : 'border-border bg-card'}`}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={`rounded-lg p-2 mt-0.5 shrink-0 ${accent ? 'bg-hydra-memory/15' : 'bg-muted'}`}>
          <Icon className={`h-5 w-5 ${accent ? 'text-hydra-memory' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">{label}</p>
          <p className="text-2xl font-extrabold mt-0.5">{value}</p>
          {description && <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{description}</p>}
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
            <StatCard label={t('memory.hub.dataTypes')} value={Object.keys(stats.sessionMemory.by_type).length} icon={BookOpen} />
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
            {Object.entries(stats.sessionMemory.by_type).map(([type, count]) => {
              const cfg = CHUNK_TYPE_CONFIG[type as ChunkType];
              const label = cfg ? t(cfg.labelKey) : type;
              return (
                <span key={type} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${CHUNK_TYPE_COLORS[type] || 'bg-muted text-muted-foreground'}`}>
                  {label} <span className="font-bold">{count}</span>
                </span>
              );
            })}
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
              placeholder={
                searchMode === 'semantic'
                  ? t('memory.semanticSearchPlaceholder')
                  : searchMode === 'hybrid'
                  ? t('memory.hub.hybridSearchPlaceholder')
                  : t('memory.searchPlaceholder')
              }
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className={cn(
                'pl-9 h-9 pr-10',
                 searchMode === 'semantic' && 'border-hydra-cyan/50 focus-visible:ring-hydra-cyan/30',
                 searchMode === 'hybrid' && 'border-hydra-expert/50 focus-visible:ring-hydra-expert/30',
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
                   searchMode === 'hybrid' && 'bg-hydra-expert/20 text-hydra-expert hover:bg-hydra-expert/30',
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
                {searchMode === 'text'
                  ? t('memory.hub.searchModeText')
                  : searchMode === 'semantic'
                  ? t('memory.hub.searchModeSemantic')
                  : t('memory.hub.searchModeHybrid')}
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
          <div className="flex items-center gap-2 text-xs text-hydra-expert/80">
            <GitMerge className="h-3 w-3" />
            <span>{t('memory.hub.hybridSearchHint')}</span>
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
                        isDuplicate && 'bg-hydra-warning/5 border-l-2 border-l-hydra-warning/50',
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
                                    <Badge variant="outline" className="text-[10px] h-5 text-hydra-warning border-hydra-warning/50">
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
                          {/* retrieved_count badge */}
                          {'retrieved_count' in item && (item as SessionMemoryChunk).retrieved_count! > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <TermLabel term="retrieved_count" className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Activity className="h-2.5 w-2.5" />
                                {(item as SessionMemoryChunk).retrieved_count}×
                              </TermLabel>
                              {(item as SessionMemoryChunk).relevance_score !== null && (item as SessionMemoryChunk).relevance_score !== undefined && (
                                <TermLabel term="relevance_score" className="text-[10px] text-muted-foreground">
                                  {((item as SessionMemoryChunk).relevance_score! * 100).toFixed(0)}%
                                </TermLabel>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Feedback + Delete actions */}
                        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost" size="icon"
                                  className={cn('h-6 w-6',
                                    ('feedback' in item && (item as SessionMemoryChunk).feedback === 1)
                                      ? 'text-hydra-success bg-hydra-success/10'
                                      : 'text-muted-foreground hover:text-hydra-success hover:bg-hydra-success/10'
                                  )}
                                  onClick={() => globalMemory.submitFeedback(item.id, 1)}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('memory.feedbackHelpful')}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost" size="icon"
                                  className={cn('h-6 w-6',
                                    ('feedback' in item && (item as SessionMemoryChunk).feedback === -1)
                                      ? 'text-destructive bg-destructive/10'
                                      : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                                  )}
                                  onClick={() => globalMemory.submitFeedback(item.id, -1)}
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('memory.feedbackNotHelpful')}</TooltipContent>
                            </Tooltip>
                          <div className="w-4 border-t border-border/60 my-0.5" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
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
              {duplicateCount > 0 && <span className="ml-2 text-hydra-warning">({duplicateCount} {t('memory.duplicateGroups')})</span>}
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

const MEMORY_TYPE_LABELS: Record<string, { ru: string; en: string }> = {
  experience: { ru: 'Опыт', en: 'Experience' },
  preference: { ru: 'Предпочтение', en: 'Preference' },
  skill: { ru: 'Навык', en: 'Skill' },
  mistake: { ru: 'Ошибка', en: 'Mistake' },
  success: { ru: 'Успех', en: 'Success' },
};

function RoleMemoryTab({ stats, loading, onRefresh }: { stats: ReturnType<typeof useHydraMemoryStats>; loading: boolean; onRefresh: () => void }) {
  const { t, language } = useLanguage();
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
          );
        })}
      </div>
    </div>
  );
}

// ─── Knowledge Tab with Deduplication Tools (Iteration 5) ────────────────────

const KNOWLEDGE_CATEGORY_LABELS: Record<string, { ru: string; en: string }> = {
  general: { ru: 'Общие', en: 'General' },
  documentation: { ru: 'Документация', en: 'Documentation' },
  guide: { ru: 'Руководство', en: 'Guide' },
  reference: { ru: 'Справочник', en: 'Reference' },
  tutorial: { ru: 'Обучение', en: 'Tutorial' },
  faq: { ru: 'ЧаВО', en: 'FAQ' },
  api: { ru: 'API', en: 'API' },
};

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
  const { t, language } = useLanguage();
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
      const { data, error } = await supabase
        .from('role_knowledge')
        .select('id, content, source_title, source_url, category, version, chunk_index, embedding')
        .eq('user_id', user.id);

      if (error) throw error;
      const rows = (data || []) as KnowledgeEntryRaw[];

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
      toast.error(t('memory.hub.scanError'));
    } finally {
      setScanning(false);
    }
  }, [user?.id, t]);

  const deleteEntries = useCallback(async (ids: string[]) => {
    if (!user?.id || ids.length === 0) return;
    setDeletingIds(prev => { const s = new Set(prev); ids.forEach(id => s.add(id)); return s; });
    try {
      const { error } = await supabase
        .from('role_knowledge')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success(`${t('memory.hub.deleteSuccess')} ${ids.length} ${t('memory.hub.deleteRecords')}`);
      // Re-scan after deletion
      await runScan();
      stats.refresh();
    } catch {
      toast.error(t('memory.hub.deleteError'));
    } finally {
      setDeletingIds(new Set());
    }
  }, [user?.id, runScan, stats, t]);

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
            <StatCard label={t('memory.hub.rolesWithKnowledge')} value={Object.keys(roleGroups).length} icon={Database} />
            <StatCard label={t('memory.hub.categories')} value={new Set(stats.knowledge.map(k => k.category)).size} icon={Layers} />
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
            <span className="text-sm font-medium">{t('memory.hub.cleanupTools')}</span>
            {scanDone && (similarGroups.length > 0 || outdatedGroups.length > 0) && (
              <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/40">
                {similarGroups.length + outdatedGroups.length} {t('memory.hub.problems')}
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
                  <p className="text-xs text-muted-foreground">{t('memory.hub.cleanupToolsDesc')}</p>
                  <Button size="sm" variant="outline" onClick={runScan} disabled={scanning} className="h-7 gap-1.5">
                    {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5" />}
                    {scanning ? t('memory.hub.scanning') : t('memory.hub.scan')}
                  </Button>
                </div>

                {scanDone && qualityStats && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                      <BarChart2 className="h-4 w-4 mx-auto mb-1 text-[hsl(var(--hydra-memory))]" />
                      <p className="text-lg font-bold">{qualityStats.avgWords}</p>
                      <p className="text-[10px] text-muted-foreground">{t('memory.hub.avgWordsChunk')}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                      <Copy className="h-4 w-4 mx-auto mb-1 text-amber-400" />
                      <p className="text-lg font-bold text-amber-400">{similarGroups.length}</p>
                      <p className="text-[10px] text-muted-foreground">{t('memory.hub.similarGroups')}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-orange-400" />
                      <p className="text-lg font-bold text-orange-400">{allOutdatedToDelete.length}</p>
                      <p className="text-[10px] text-muted-foreground">{t('memory.hub.outdated')}</p>
                    </div>
                  </div>
                )}

                {scanDone && qualityStats && qualityStats.noEmbedding > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 rounded-lg px-3 py-2 border border-amber-500/20">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{qualityStats.noEmbedding} {t('memory.hub.noEmbeddingWarning')}</span>
                  </div>
                )}

                {scanDone && similarGroups.length === 0 && outdatedGroups.length === 0 && (
                  <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2 border border-green-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{t('memory.hub.cleanResult')}</span>
                  </div>
                )}

                {/* Similar groups */}
                {scanDone && similarGroups.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                        <Copy className="h-3.5 w-3.5" />
                        {t('memory.hub.similarChunks')} ({similarGroups.length} {t('memory.hub.groups')}, {allSimilarToDelete.length} {t('memory.hub.duplicates')})
                      </p>
                      <Button
                        size="sm" variant="outline"
                        className="h-6 text-[10px] border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                        disabled={deletingIds.size > 0}
                        onClick={() => deleteEntries(allSimilarToDelete)}
                      >
                        {deletingIds.size > 0 ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                        {t('memory.hub.deleteAllDuplicates')}
                      </Button>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {similarGroups.map((group, gi) => (
                        <div key={gi} className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-amber-400 font-medium">{group.length} {t('memory.hub.copies')}</span>
                            <Button
                              size="sm" variant="ghost"
                              className="h-5 px-2 text-[10px] text-destructive hover:text-destructive"
                              disabled={deletingIds.size > 0}
                              onClick={() => deleteEntries(group.slice(1).map(r => r.id))}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {t('memory.hub.delete')} {group.length - 1}
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
                        {t('memory.hub.outdatedVersions')} ({allOutdatedToDelete.length} {t('memory.hub.chunks')})
                      </p>
                       <Button
                         size="sm" variant="outline"
                         className="h-6 text-[10px] border-hydra-webhunter/40 text-hydra-webhunter hover:bg-hydra-webhunter/10"
                        disabled={deletingIds.size > 0}
                        onClick={() => deleteEntries(allOutdatedToDelete)}
                      >
                        {deletingIds.size > 0 ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                        {t('memory.hub.deleteOutdated')}
                      </Button>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {outdatedGroups.map((group, gi) => (
                         <div key={gi} className="rounded border border-hydra-webhunter/20 bg-hydra-webhunter/5 px-3 py-2 text-xs">
                           <div className="flex items-center justify-between">
                             <span className="text-muted-foreground truncate">{group[0].source_url}</span>
                             <span className="text-hydra-webhunter ml-2 shrink-0">{group.map(r => r.version).join(', ')}</span>
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
        {Object.entries(roleGroups).map(([role, categories]) => {
          const rc = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
          const roleLabel = rc ? t(rc.label) : role;
          const isRu = language === 'ru';
          return (
          <Card key={role}>
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm">{roleLabel}</CardTitle></CardHeader>
            <CardContent className="pb-3 px-4 flex flex-wrap gap-2">
              {categories.map(({ category, count }) => {
                const catLabel = KNOWLEDGE_CATEGORY_LABELS[category]?.[isRu ? 'ru' : 'en'] ?? category;
                return (
                  <Badge key={category} variant="outline" className="text-xs gap-1.5">
                    {catLabel} <span className="font-bold text-hydra-memory">{count}</span>
                  </Badge>
                );
              })}
            </CardContent>
          </Card>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to="/staff-roles">{t('memory.hub.goToStaff')}</Link>
        </Button>
      </div>
    </div>
  );
}

// ─── RAG Analytics Dashboard ─────────────────────────────────────────────────

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

function RagDashboardTab() {
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
      {/* Stats row */}
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
                  {/* retrieval count badge */}
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

type GraphNodeType = 'center' | 'role' | 'session' | 'knowledge';

interface GraphNode {
  id: string;
  label: string;
  roleId?: string;
  type: GraphNodeType;
  count?: number;
  usageCount?: number;
  confidence?: number;
  category?: string;       // for knowledge nodes
  knowledgeCount?: number; // total knowledge entries for role
  sessionChunks?: number;  // session memory chunks
  x: number;
  y: number;
  r: number;
}

interface GraphEdge {
  source: string;
  target: string;
  kind?: 'role' | 'session' | 'knowledge' | 'cross'; // cross = shared session between roles
}

// Graph filter options
type GraphLayer = 'role' | 'session' | 'knowledge' | 'cross';

function MemoryGraphTab({ stats }: { stats: ReturnType<typeof useHydraMemoryStats> }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgSize, setSvgSize] = useState({ w: 900, h: 560 });

  // ResizeObserver — подключается при монтировании, использует MutationObserver
  // для повторного запуска после того как Radix TabsContent показывает контент
  useEffect(() => {
    let obs: ResizeObserver | null = null;

    const attach = () => {
      const el = containerRef.current;
      if (!el) return false;
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return false;
      setSvgSize({ w: Math.round(width), h: Math.round(height) });
      obs = new ResizeObserver(entries => {
        const e = entries[0];
        if (e && e.contentRect.width > 0 && e.contentRect.height > 0) {
          setSvgSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) });
        }
      });
      obs.observe(el);
      return true;
    };

    // Пробуем сразу
    if (!attach()) {
      // Если не получилось (таб скрыт) — следим за появлением через polling
      const interval = setInterval(() => {
        if (attach()) clearInterval(interval);
      }, 100);
      return () => {
        clearInterval(interval);
        obs?.disconnect();
      };
    }

    return () => obs?.disconnect();
  }, []);

  // Layer toggle state
  const [activeLayers, setActiveLayers] = useState<Set<GraphLayer>>(
    new Set(['role', 'session', 'knowledge', 'cross'])
  );

  // Role memory details: usage + sessions
  const [roleMemoryDetails, setRoleMemoryDetails] = useState<Record<string, { sessions: string[]; usageCount: number }>>({});
  // Session memory: chunks per session_id
  const [sessionChunks, setSessionChunks] = useState<Record<string, number>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleLayer = (layer: GraphLayer) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer); else next.add(layer);
      return next;
    });
  };

  // Fetch role memory + session memory details
  useEffect(() => {
    if (!user?.id || stats.roleMemory.length === 0) return;
    setLoadingDetails(true);

    Promise.all([
      supabase
        .from('role_memory')
        .select('role, source_session_id, usage_count')
        .eq('user_id', user.id),
      supabase
        .from('session_memory')
        .select('session_id')
        .eq('user_id', user.id),
    ]).then(([rmRes, smRes]) => {
      // Role memory details
      const details: Record<string, { sessions: string[]; usageCount: number }> = {};
      (rmRes.data || []).forEach(row => {
        if (!details[row.role]) details[row.role] = { sessions: [], usageCount: 0 };
        details[row.role].usageCount += row.usage_count || 0;
        if (row.source_session_id && !details[row.role].sessions.includes(row.source_session_id)) {
          details[row.role].sessions.push(row.source_session_id);
        }
      });
      setRoleMemoryDetails(details);

      // Session chunks count
      const chunks: Record<string, number> = {};
      (smRes.data || []).forEach(row => {
        if (row.session_id) chunks[row.session_id] = (chunks[row.session_id] || 0) + 1;
      });
      setSessionChunks(chunks);

      setLoadingDetails(false);
    });
  }, [user?.id, stats.roleMemory]);

  // Knowledge per role (collapsed from stats.knowledge)
  const knowledgePerRole = useMemo(() => {
    const map: Record<string, number> = {};
    stats.knowledge.forEach(k => { map[k.role] = (map[k.role] || 0) + k.count; });
    return map;
  }, [stats.knowledge]);

  // Build graph nodes & edges
  const { nodes, edges } = useMemo(() => {
    const W = svgSize.w;
    const H = svgSize.h;
    const cx = W / 2;
    const cy = H / 2;

    const allNodes: GraphNode[] = [];
    const allEdges: GraphEdge[] = [];
    const sessionIds = new Set<string>();

    const maxCount = Math.max(...stats.roleMemory.map(r => r.count), 1);
    const maxKnowledge = Math.max(...Object.values(knowledgePerRole), 1);

    // Center node
    const centerNode: GraphNode = {
      id: 'center',
      label: language === 'ru' ? 'Гидра' : 'Hydra',
      type: 'center',
      x: cx,
      y: cy,
      r: 20,
    };
    allNodes.push(centerNode);

    const roleRadius = Math.min(cx, cy) * 0.58;
    const knowledgeRadius = roleRadius * 0.48;
    const sessionRadius = roleRadius * 1.58;

    stats.roleMemory.forEach((rm, i) => {
      const angle = (2 * Math.PI * i) / stats.roleMemory.length - Math.PI / 2;
      const nodeSize = 11 + (rm.count / maxCount) * 13;
      const roleConfig = ROLE_CONFIG[rm.role as keyof typeof ROLE_CONFIG];
      const roleLabel = roleConfig ? t(roleConfig.label) : rm.role;

      const roleNode: GraphNode = {
        id: `role_${rm.role}`,
        label: roleLabel,
        roleId: rm.role,
        type: 'role',
        count: rm.count,
        confidence: rm.avg_confidence,
        usageCount: roleMemoryDetails[rm.role]?.usageCount || 0,
        knowledgeCount: knowledgePerRole[rm.role] || 0,
        x: cx + roleRadius * Math.cos(angle),
        y: cy + roleRadius * Math.sin(angle),
        r: nodeSize,
      };
      allNodes.push(roleNode);
      allEdges.push({ source: 'center', target: roleNode.id, kind: 'role' });

      // ── Knowledge node (inner orbit) ──
      const hasKnowledge = (knowledgePerRole[rm.role] || 0) > 0;
      if (hasKnowledge && activeLayers.has('knowledge')) {
        const kAngle = angle + 0.35;
        const kNode: GraphNode = {
          id: `know_${rm.role}`,
          label: `${knowledgePerRole[rm.role]}`,
          roleId: rm.role,
          type: 'knowledge',
          knowledgeCount: knowledgePerRole[rm.role],
          x: cx + knowledgeRadius * Math.cos(kAngle) + roleRadius * Math.cos(angle) * 0.1,
          y: cy + knowledgeRadius * Math.sin(kAngle) + roleRadius * Math.sin(angle) * 0.1,
          r: 7,
        };
        // Place near role node
        kNode.x = roleNode.x + Math.cos(angle - Math.PI * 0.35) * (nodeSize + 14);
        kNode.y = roleNode.y + Math.sin(angle - Math.PI * 0.35) * (nodeSize + 14);
        allNodes.push(kNode);
        allEdges.push({ source: roleNode.id, target: kNode.id, kind: 'knowledge' });
      }

      // ── Session nodes (outer orbit) ──
      const detail = roleMemoryDetails[rm.role];
      if (activeLayers.has('session') && detail && detail.usageCount > 0) {
        detail.sessions.slice(0, 2).forEach((sid, si) => {
          const sa = angle + ((si - 0.5) * 0.45);
          if (!sessionIds.has(sid)) {
            sessionIds.add(sid);
            const sessNode: GraphNode = {
              id: `sess_${sid}`,
              label: sid.slice(0, 8) + '…',
              type: 'session',
              sessionChunks: sessionChunks[sid] || 0,
              x: cx + sessionRadius * Math.cos(sa),
              y: cy + sessionRadius * Math.sin(sa),
              r: 6 + Math.min((sessionChunks[sid] || 0) / 10, 4),
            };
            allNodes.push(sessNode);
            allEdges.push({ source: roleNode.id, target: `sess_${sid}`, kind: 'session' });
          } else {
            allEdges.push({ source: roleNode.id, target: `sess_${sid}`, kind: 'session' });
          }
        });
      }
    });

    // ── Cross-connections between roles sharing sessions ──
    if (activeLayers.has('cross')) {
      const roleSessionMap: Record<string, string[]> = {};
      stats.roleMemory.forEach(rm => {
        roleSessionMap[rm.role] = roleMemoryDetails[rm.role]?.sessions || [];
      });
      const roles = stats.roleMemory.map(r => r.role);
      for (let a = 0; a < roles.length; a++) {
        for (let b = a + 1; b < roles.length; b++) {
          const shared = roleSessionMap[roles[a]]?.filter(s => roleSessionMap[roles[b]]?.includes(s));
          if (shared && shared.length > 0) {
            allEdges.push({ source: `role_${roles[a]}`, target: `role_${roles[b]}`, kind: 'cross' });
          }
        }
      }
    }

    return { nodes: allNodes, edges: allEdges };
  }, [stats.roleMemory, roleMemoryDetails, sessionChunks, knowledgePerRole, activeLayers, t, language, svgSize]);

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
        <p className="text-sm">{t('memory.hub.graphEmpty')}</p>
        <p className="text-xs mt-1 opacity-60">{t('memory.hub.graphEmptyHint')}</p>
      </div>
    );
  }

  const maxUsage = Math.max(...stats.roleMemory.map(r => roleMemoryDetails[r.role]?.usageCount || 0), 1);

  // Edge colors by kind
  const edgeColor = (kind?: string, hovered?: boolean) => {
    if (hovered) return 'hsl(var(--hydra-memory))';
    switch (kind) {
      case 'knowledge': return 'hsl(var(--hydra-glow))';
      case 'session':   return 'hsl(var(--hydra-expert))';
      case 'cross':     return 'hsl(var(--hydra-cyan))';
      default:          return 'hsl(var(--border))';
    }
  };

  // Node fill by type
  const nodeFill = (node: GraphNode) => {
    switch (node.type) {
      case 'center':    return 'hsl(var(--hydra-cyan))';
      case 'session':   return 'hsl(var(--hydra-expert))';
      case 'knowledge': return 'hsl(var(--hydra-glow))';
      default:          return 'hsl(var(--hydra-memory))';
    }
  };

  const layerButtons: { key: GraphLayer; label: string; color: string }[] = [
    { key: 'role',      label: t('memory.hub.legendRole'),      color: 'hsl(var(--hydra-memory))' },
    { key: 'session',   label: t('memory.hub.legendSession'),   color: 'hsl(var(--hydra-expert))' },
    { key: 'knowledge', label: t('memory.hub.legendKnowledge'), color: 'hsl(var(--hydra-glow))' },
    { key: 'cross',     label: t('memory.hub.legendCross'),     color: 'hsl(var(--hydra-cyan))' },
  ];

  return (
    <Card className="overflow-hidden border-border">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-[hsl(var(--hydra-memory))]" />
            {language === 'ru' ? 'Граф памяти' : 'Memory Graph'}
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>{t('memory.hub.legendHot')}</span>
          </div>
        </div>
        {/* Layer toggles */}
        <div className="flex items-center gap-3 flex-wrap pt-1">
          {layerButtons.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all',
                activeLayers.has(key)
                  ? 'border-border bg-muted/60 text-foreground'
                  : 'border-transparent bg-transparent text-muted-foreground opacity-50'
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: color }}
              />
              {label}
              {key === 'cross' && (
                <span className="ml-0.5 text-[10px] opacity-70">({t('memory.hub.legendCrossHint')})</span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>
        <div ref={containerRef} className="relative w-full" style={{ height: 560 }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
            className="w-full h-full"
            style={{ background: 'transparent' }}
          >
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.4" />
              </pattern>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--hydra-cyan))" stopOpacity="0.25" />
                <stop offset="100%" stopColor="hsl(var(--hydra-cyan))" stopOpacity="0" />
              </radialGradient>
              <filter id="nodeGlow">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Arrow marker for cross edges */}
              <marker id="arrow-cross" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="hsl(var(--hydra-cyan))" opacity="0.6" />
              </marker>
            </defs>
            <rect width={svgSize.w} height={svgSize.h} fill="url(#grid)" />
            <circle cx={svgSize.w / 2} cy={svgSize.h / 2} r="80" fill="url(#centerGlow)" />

            {/* Edges */}
            {edges.map((edge, i) => {
              const src = nodeMap[edge.source];
              const tgt = nodeMap[edge.target];
              if (!src || !tgt) return null;
              const isHovered = hoveredId === edge.source || hoveredId === edge.target;
              const isCross = edge.kind === 'cross';
              const isKnowledge = edge.kind === 'knowledge';
              const isSession = edge.kind === 'session';
              const color = edgeColor(edge.kind, isHovered);
              return (
                <line
                  key={i}
                  x1={src.x} y1={src.y}
                  x2={tgt.x} y2={tgt.y}
                  stroke={color}
                  strokeWidth={isCross ? (isHovered ? 2 : 1.2) : (isHovered ? 1.8 : 0.7)}
                  strokeDasharray={
                    isCross ? '6 3' :
                    isKnowledge ? '2 2' :
                    isSession ? '4 3' : undefined
                  }
                  opacity={isHovered ? 0.9 : isCross ? 0.5 : isKnowledge ? 0.45 : 0.35}
                  markerEnd={isCross && isHovered ? 'url(#arrow-cross)' : undefined}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const isCenter = node.type === 'center';
              const isHot = node.type === 'role' && (roleMemoryDetails[node.roleId ?? '']?.usageCount || 0) > (maxUsage * 0.5);
              const isSelected = selected?.id === node.id;
              const isHovered = hoveredId === node.id;
              const fill = nodeFill(node);

              return (
                <g
                  key={node.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelected(isSelected ? null : node)}
                  filter={isSelected || isHovered ? 'url(#nodeGlow)' : undefined}
                >
                  {/* Hot ring */}
                  {isHot && (
                    <circle
                      cx={node.x} cy={node.y} r={node.r + 5}
                      fill="none"
                      stroke="hsl(var(--hydra-arbiter))"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                      opacity="0.65"
                    />
                  )}
                  {/* Main circle */}
                  <circle
                    cx={node.x} cy={node.y} r={node.r}
                    fill={fill}
                    opacity={isSelected || isHovered ? 1 : node.type === 'knowledge' ? 0.7 : 0.75}
                    stroke={isSelected ? 'hsl(var(--foreground))' : 'transparent'}
                    strokeWidth="2"
                  />
                  {/* Inner ring for knowledge node */}
                  {node.type === 'knowledge' && (
                    <circle
                      cx={node.x} cy={node.y} r={node.r - 2}
                      fill="none"
                      stroke="hsl(var(--background))"
                      strokeWidth="1"
                      opacity="0.4"
                    />
                  )}
                  {/* Label */}
                  <text
                    x={node.x}
                    y={
                      node.type === 'role' ? node.y + node.r + 10 :
                      node.type === 'knowledge' ? node.y + node.r + 8 :
                      node.y + 3
                    }
                    textAnchor="middle"
                    fill="hsl(var(--foreground))"
                    fontSize={isCenter ? 9 : node.type === 'knowledge' ? 7 : node.type === 'session' ? 6 : 8}
                    fontWeight={isCenter || isSelected ? 600 : 400}
                    opacity={isCenter ? 1 : 0.85}
                  >
                    {isCenter ? node.label : node.label.slice(0, 12)}
                  </text>
                  {/* Count badge on role nodes */}
                  {node.type === 'role' && node.count && node.count > 1 && (
                    <text
                      x={node.x + node.r - 2}
                      y={node.y - node.r + 5}
                      textAnchor="middle"
                      fill="hsl(var(--background))"
                      fontSize="6"
                      fontWeight={700}
                    >
                      {node.count}
                    </text>
                  )}
                  {/* Knowledge count inside node */}
                  {node.type === 'knowledge' && (
                    <text
                      x={node.x} y={node.y + 2.5}
                      textAnchor="middle"
                      fill="hsl(var(--background))"
                      fontSize="6"
                      fontWeight={700}
                    >
                      {node.knowledgeCount}
                    </text>
                  )}
                  {/* Session chunks badge */}
                  {node.type === 'session' && node.sessionChunks && node.sessionChunks > 0 && (
                    <text
                      x={node.x} y={node.y + 2.5}
                      textAnchor="middle"
                      fill="hsl(var(--background))"
                      fontSize="5.5"
                      fontWeight={700}
                    >
                      {node.sessionChunks}
                    </text>
                  )}
                  {/* Hot badge */}
                  {isHot && (
                    <text x={node.x + node.r + 2} y={node.y - node.r + 3} fontSize="7">⚡</text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Selected node tooltip overlay */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-3 left-3 right-3 bg-card/95 backdrop-blur border border-border rounded-lg p-3 text-xs shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: nodeFill(selected) }}
                      />
                      <p className="font-semibold text-sm">{selected.label}</p>
                    </div>
                    {selected.type === 'role' && (
                      <div className="flex items-center gap-3 flex-wrap text-muted-foreground">
                        <span>{t('memory.hub.nodeExperienceRecords')}: <strong className="text-foreground">{selected.count}</strong></span>
                        {selected.confidence !== undefined && (
                          <span>{t('memory.hub.nodeAvgConfidence')}: <strong className="text-foreground">{(selected.confidence * 100).toFixed(0)}%</strong></span>
                        )}
                        {(selected.usageCount ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-hydra-arbiter">
                            <Zap className="h-3 w-3" />
                            {t('memory.hub.nodeUsages')}: {selected.usageCount}
                          </span>
                        )}
                        {(selected.knowledgeCount ?? 0) > 0 && (
                          <span className="text-[hsl(var(--hydra-glow))]">
                            {t('memory.hub.legendKnowledge')}: {selected.knowledgeCount}
                          </span>
                        )}
                        {roleMemoryDetails[selected.roleId ?? '']?.sessions.length > 0 && (
                          <span>{t('memory.hub.nodeLinkedSessions')}: {roleMemoryDetails[selected.roleId ?? ''].sessions.length}</span>
                        )}
                      </div>
                    )}
                    {selected.type === 'knowledge' && (
                      <p className="text-muted-foreground">
                        {t('memory.hub.legendKnowledge')}: <strong className="text-foreground">{selected.knowledgeCount}</strong> {t('memory.hub.knowledgeNodeDesc')}
                      </p>
                    )}
                    {selected.type === 'session' && (
                      <p className="text-muted-foreground">
                        {t('memory.hub.nodeSession')}: {selected.label}
                        {(selected.sessionChunks ?? 0) > 0 && (
                          <span className="ml-2">&middot; {selected.sessionChunks} {t('memory.hub.sessionChunks')}</span>
                        )}
                      </p>
                    )}
                    {selected.type === 'center' && (
                      <p className="text-muted-foreground">{t('memory.hub.nodeCenterDesc')}</p>
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
      {/* Hot roles activity bar */}
      {stats.roleMemory.filter(r => (roleMemoryDetails[r.role]?.usageCount || 0) > 0).length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-hydra-arbiter" />
            {t('memory.hub.roleActivity')}
          </p>
          <div className="space-y-1">
            {stats.roleMemory
              .filter(r => (roleMemoryDetails[r.role]?.usageCount || 0) > 0)
              .sort((a, b) => (roleMemoryDetails[b.role]?.usageCount || 0) - (roleMemoryDetails[a.role]?.usageCount || 0))
              .slice(0, 8)
              .map(r => {
                const roleConfig = ROLE_CONFIG[r.role as keyof typeof ROLE_CONFIG];
                const roleLabel = roleConfig ? t(roleConfig.label) : r.role;
                const usage = roleMemoryDetails[r.role]?.usageCount || 0;
                const pct = Math.round((usage / maxUsage) * 100);
                const kCount = knowledgePerRole[r.role] || 0;
                return (
                  <div key={r.role} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 truncate shrink-0">{roleLabel}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-hydra-memory transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{usage}</span>
                    {kCount > 0 && (
                      <span className="text-[10px] text-hydra-glow w-12 shrink-0">
                        +{kCount} {language === 'ru' ? 'знаний' : 'docs'}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </Card>
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
        toast.error(t('memory.hub.imageLoadError'));
        return;
      }
      setThumbnails(prev => ({ ...prev, [file.id]: data.signedUrl }));
      setPreview({ file, url: data.signedUrl });
    } catch {
      toast.error(t('memory.hub.imageLoadError'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (file: StorageFile) => {
    setDeletingId(file.id);
    try {
      const path = `${user!.id}/${file.name}`;
      const { error } = await supabase.storage.from(file.bucket).remove([path]);
      if (error) toast.error(t('memory.hub.deleteFileError'));
      else {
        toast.success(`«${file.name}» ${t('memory.hub.deleteFileSuccess')}`);
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
    'message-files': 'text-hydra-info border-hydra-info/30',
    'task-files': 'text-hydra-warning border-hydra-warning/30',
    'avatars': 'text-hydra-success border-hydra-success/30',
  };

  const bucketLabels: Record<string, { label: string; hint: string }> = {
    'message-files': {
      label: t('memory.storage.bucketMessageFiles'),
      hint: t('memory.storage.bucketMessageFilesHint'),
    },
    'task-files': {
      label: t('memory.storage.bucketTaskFiles'),
      hint: t('memory.storage.bucketTaskFilesHint'),
    },
    'avatars': {
      label: t('memory.storage.bucketAvatars'),
      hint: t('memory.storage.bucketAvatarsHint'),
    },
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
            <TooltipProvider key={b}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeBucket === b ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveBucket(b)}
                    className={cn('h-7', activeBucket === b && bucketColors[b])}
                  >
                    {bucketLabels[b]?.label ?? b}
                    <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">{bucketCounts[b] || 0}</Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-mono text-muted-foreground">{b}</p>
                  <p>{bucketLabels[b]?.hint}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <div className="relative w-full sm:w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder={t('memory.hub.searchByName')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-7 text-xs" />
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
                          ? 'w-10 h-10 border border-border bg-muted hover:border-hydra-memory/50 transition-colors cursor-pointer'
                          : 'w-7 h-7 cursor-default pointer-events-none'
                      )}
                      onClick={() => isImage && handlePreview(file)}
                      disabled={previewLoading || !isImage}
                      title={isImage ? t('memory.hub.preview') : undefined}
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
                        className={cn('text-sm font-medium truncate', isImage && 'cursor-pointer hover:text-hydra-memory transition-colors')}
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
                              className="h-7 w-7 text-muted-foreground hover:text-hydra-memory"
                              onClick={() => handlePreview(file)}
                              disabled={previewLoading}
                            >
                              {previewLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('memory.hub.preview')}</TooltipContent>
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
              <FileImage className="h-4 w-4 text-hydra-memory shrink-0" />
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
                  <TooltipContent>{t('memory.hub.download')}</TooltipContent>
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
                onError={() => { toast.error(t('memory.hub.imageLoadError')); setPreview(null); }}
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

// ─── Cognitive Arsenal Tab ────────────────────────────────────────────────────

interface ArsenalAction {
  label: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

interface ArsenalLayer {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: 'violet' | 'amber' | 'blue' | 'cyan' | 'emerald' | 'teal';
  href: string;
  total: number;
  items: { label: string; value: number }[];
  actions: ArsenalAction[];
}

function CognitiveArsenalTab({ stats }: { stats: ReturnType<typeof useHydraMemoryStats> }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [counts, setCounts] = useState({
    prompts: { total: 0, system: 0, custom: 0 },
    blueprints: { total: 0, system: 0, custom: 0 },
    behaviors: { total: 0, system: 0, custom: 0 },
    tools: { total: 0, prompt: 0, http: 0 },
    flows: { total: 0 },
    interviews: { total: 0, completed: 0 },
    contests: { total: 0, completed: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const [promptsRes, blueprintsRes, behaviorsRes, toolsRes, flowsRes, interviewsRes, contestsRes] = await Promise.all([
          supabase.from('prompt_library').select('is_default').eq('user_id', user.id),
          supabase.from('task_blueprints').select('is_system'),
          supabase.from('role_behaviors').select('is_system'),
          supabase.rpc('get_custom_tools_safe'),
          supabase.from('flow_diagrams').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('interview_sessions').select('status').eq('user_id', user.id),
          supabase.from('contest_sessions').select('status').eq('user_id', user.id),
        ]);

        const prompts = (promptsRes.data || []) as { is_default: boolean }[];
        const blueprints = (blueprintsRes.data || []) as { is_system: boolean }[];
        const behaviors = (behaviorsRes.data || []) as { is_system: boolean }[];
        const tools = (toolsRes.data || []) as { tool_type?: string }[];
        const interviews = (interviewsRes.data || []) as { status: string }[];
        const contests = (contestsRes.data || []) as { status: string }[];

        setCounts({
          prompts: {
            total: prompts.length,
            system: prompts.filter(p => p.is_default).length,
            custom: prompts.filter(p => !p.is_default).length,
          },
          blueprints: {
            total: blueprints.length,
            system: blueprints.filter(b => b.is_system).length,
            custom: blueprints.filter(b => !b.is_system).length,
          },
          behaviors: {
            total: behaviors.length,
            system: behaviors.filter(b => b.is_system).length,
            custom: behaviors.filter(b => !b.is_system).length,
          },
          tools: {
            total: tools.length,
            prompt: tools.filter(t => t.tool_type === 'prompt' || !t.tool_type).length,
            http: tools.filter(t => t.tool_type === 'http_api').length,
          },
          flows: { total: flowsRes.count || 0 },
          interviews: {
            total: interviews.length,
            completed: interviews.filter(i => i.status === 'completed').length,
          },
          contests: {
            total: contests.length,
            completed: contests.filter(c => c.status === 'completed').length,
          },
        });
      } catch (e) {
        console.error('[CognitiveArsenalTab]', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.id]);

  const grandTotal =
    counts.prompts.total + counts.blueprints.total + counts.behaviors.total +
    counts.tools.total + counts.flows.total + counts.interviews.total + counts.contests.total +
    stats.totalRoleMemory + stats.totalKnowledge + stats.sessionMemory.total;

  // Build roleData for the connections graph
  const [rolePromptCounts, setRolePromptCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('prompt_library').select('role').eq('user_id', user.id).then(({ data }) => {
      const map: Record<string, number> = {};
      (data || []).forEach((r: { role: string }) => { map[r.role] = (map[r.role] || 0) + 1; });
      setRolePromptCounts(map);
    });
  }, [user?.id]);

  const knowledgePerRole = useMemo(() => {
    const map: Record<string, number> = {};
    stats.knowledge.forEach(k => { map[k.role] = (map[k.role] || 0) + k.count; });
    return map;
  }, [stats.knowledge]);

  const roleData = useMemo(() => {
    const allRoles = new Set([
      ...stats.roleMemory.map(r => r.role),
      ...Object.keys(knowledgePerRole),
      ...Object.keys(rolePromptCounts),
    ]);
    return Array.from(allRoles).map(role => ({
      role,
      memCount: stats.roleMemory.find(r => r.role === role)?.count || 0,
      knowledgeCount: knowledgePerRole[role] || 0,
      promptCount: rolePromptCounts[role] || 0,
    }));
  }, [stats.roleMemory, knowledgePerRole, rolePromptCounts]);

  type LayerColor = 'violet' | 'amber' | 'blue' | 'cyan' | 'emerald' | 'teal';

  const LAYER_STYLES: Record<LayerColor, { text: string; bg: string; border: string; glow: string }> = {
    violet: {
      text: 'text-hydra-expert',
      bg: 'bg-hydra-expert/10',
      border: 'border-hydra-expert/25',
      glow: 'shadow-hydra-expert/10',
    },
    amber: {
      text: 'text-hydra-arbiter',
      bg: 'bg-hydra-arbiter/10',
      border: 'border-hydra-arbiter/25',
      glow: 'shadow-hydra-arbiter/10',
    },
    blue: {
      text: 'text-hydra-info',
      bg: 'bg-hydra-info/10',
      border: 'border-hydra-info/25',
      glow: 'shadow-hydra-info/10',
    },
    emerald: {
      text: 'text-hydra-success',
      bg: 'bg-hydra-success/10',
      border: 'border-hydra-success/25',
      glow: 'shadow-hydra-success/10',
    },
    teal: {
      text: 'text-hydra-memory',
      bg: 'bg-hydra-memory/10',
      border: 'border-hydra-memory/25',
      glow: 'shadow-hydra-memory/10',
    },
    cyan: {
      text: 'text-hydra-cyan',
      bg: 'bg-hydra-cyan/10',
      border: 'border-hydra-cyan/25',
      glow: 'shadow-hydra-cyan/10',
    },
  };


  const [confirmClearMemory, setConfirmClearMemory] = useState(false);

  const handleClearSessionMemory = useCallback(async () => {
    if (!confirmClearMemory) { setConfirmClearMemory(true); return; }
    try {
      if (!user?.id) return;
      const { error } = await supabase.from('session_memory').delete().eq('user_id', user.id);
      if (error) throw error;
      toast.success(isRu ? 'Память сессий очищена' : 'Session memory cleared');
      stats.refresh();
    } catch {
      toast.error(isRu ? 'Ошибка очистки памяти' : 'Failed to clear memory');
    } finally {
      setConfirmClearMemory(false);
    }
  }, [confirmClearMemory, user?.id, isRu, stats]);

  const layers: ArsenalLayer[] = [
    {
      id: 'instincts',
      label: isRu ? 'Инстинкты' : 'Instincts',
      description: isRu ? 'Системные промпты и правила' : 'System prompts and rules',
      icon: Sparkles,
      color: 'violet',
      href: '/role-library',
      total: counts.prompts.total,
      items: [
        { label: isRu ? 'Системных' : 'System', value: counts.prompts.system },
        { label: isRu ? 'Пользовательских' : 'Custom', value: counts.prompts.custom },
      ],
      actions: [
        { label: isRu ? 'Создать промпт' : 'Create prompt', icon: Sparkles, href: '/role-library' },
      ],
    },
    {
      id: 'patterns',
      label: isRu ? 'Паттерны мышления' : 'Thinking Patterns',
      description: isRu ? 'Шаблоны задач и поведение' : 'Task blueprints and behaviors',
      icon: GitMerge,
      color: 'amber',
      href: '/behavioral-patterns',
      total: counts.blueprints.total + counts.behaviors.total,
      items: [
        { label: isRu ? 'Шаблонов задач' : 'Blueprints', value: counts.blueprints.total },
        { label: isRu ? 'Профилей поведения' : 'Behaviors', value: counts.behaviors.total },
      ],
      actions: [
        { label: isRu ? 'Создать шаблон' : 'Create blueprint', icon: GitMerge, href: '/behavioral-patterns' },
      ],
    },
    {
      id: 'tools',
      label: isRu ? 'Арсенал инструментов' : 'Tool Arsenal',
      description: isRu ? 'Промпт-штампы и HTTP API' : 'Prompt stamps and HTTP API',
      icon: Wrench,
      color: 'blue',
      href: '/tools-library',
      total: counts.tools.total,
      items: [
        { label: isRu ? 'Промпт-штампы' : 'Prompt stamps', value: counts.tools.prompt },
        { label: isRu ? 'HTTP API' : 'HTTP API', value: counts.tools.http },
      ],
      actions: [
        { label: isRu ? 'Создать инструмент' : 'Create tool', icon: Wrench, href: '/tools-library' },
      ],
    },
    {
      id: 'flows',
      label: isRu ? 'Потоки мыслей' : 'Thought Flows',
      description: isRu ? 'Схемы логики и оркестрации ИИ' : 'AI logic and orchestration diagrams',
      icon: GitBranch,
      color: 'cyan',
      href: '/flow-editor',
      total: counts.flows.total,
      items: [
        { label: isRu ? 'Схем потоков' : 'Flow diagrams', value: counts.flows.total },
      ],
      actions: [
        { label: isRu ? 'Новая схема' : 'New flow', icon: Network, href: '/flow-editor' },
      ],
    },
    {
      id: 'achievements',
      label: isRu ? 'Достижения' : 'Achievements',
      description: isRu ? 'Собеседования и конкурсы' : 'Interviews and contests',
      icon: Trophy,
      color: 'emerald',
      href: '/staff-roles',
      total: counts.interviews.total + counts.contests.total,
      items: [
        { label: isRu ? 'Собеседований' : 'Interviews', value: counts.interviews.total },
        { label: isRu ? 'Конкурсов' : 'Contests', value: counts.contests.total },
      ],
      actions: [
        { label: isRu ? 'Собеседование' : 'Interview', icon: Users, href: '/staff-roles' },
        { label: isRu ? 'Конкурс' : 'Contest', icon: Trophy, href: '/model-ratings' },
      ],
    },
    {
      id: 'memory',
      label: isRu ? 'Долгосрочная память' : 'Long-term Memory',
      description: isRu ? 'Опыт ролей · база знаний RAG · контекст сессий' : 'Role experience · RAG knowledge · session context',
      icon: BrainCircuit,
      color: 'teal',
      href: '/hydra-memory',
      total: stats.totalRoleMemory + stats.totalKnowledge + stats.sessionMemory.total,
      items: [
        { label: isRu ? 'Опыт ролей' : 'Role memory', value: stats.totalRoleMemory },
        { label: isRu ? 'База знаний' : 'Knowledge', value: stats.totalKnowledge },
        { label: isRu ? 'Сессии' : 'Session memory', value: stats.sessionMemory.total },
      ],
      actions: [
        {
          label: confirmClearMemory
            ? (isRu ? 'Подтвердить' : 'Confirm')
            : (isRu ? 'Очистить сессии' : 'Clear sessions'),
          icon: confirmClearMemory ? AlertTriangle : Trash2,
          onClick: handleClearSessionMemory,
          variant: confirmClearMemory ? 'destructive' : 'outline',
        },
      ],
    },
  ];

  const isDataLoading = loading || stats.loading;

  return (
    <div className="space-y-6">
      {/* Grand total banner */}
      <Card className="border-[hsl(var(--hydra-memory)/0.4)] bg-gradient-to-r from-[hsl(var(--hydra-memory)/0.08)] via-[hsl(var(--hydra-memory)/0.04)] to-transparent overflow-hidden">
        <CardContent className="p-5 flex items-center gap-5">
          <div className="rounded-xl p-3.5 bg-[hsl(var(--hydra-memory)/0.15)] border border-[hsl(var(--hydra-memory)/0.35)] shrink-0">
            <BrainCircuit className="h-8 w-8 text-[hsl(var(--hydra-memory))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">
              {isRu ? 'Когнитивный арсенал Гидры' : "Hydra's Cognitive Arsenal"}
            </p>
            {isDataLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <p className="text-4xl font-bold leading-none">
                {grandTotal}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {isRu ? 'объектов' : 'objects'}
                </span>
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1.5 hidden sm:block">
              {isRu
                ? 'Инстинкты · Паттерны · Инструменты · Достижения · Память'
                : 'Instincts · Patterns · Tools · Achievements · Memory'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Layer cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const s = LAYER_STYLES[layer.color];
          return (
            <motion.div key={layer.id} whileHover={{ scale: 1.012, y: -2 }} transition={{ duration: 0.15 }}>
              <Card className={cn(
                `border ${s.bg} ${s.border} hover:shadow-lg ${s.glow} transition-all h-full flex flex-col`
              )}>
                <CardContent className="p-4 space-y-3 flex flex-col flex-1">
                  {/* Header — click goes to section */}
                  <Link to={layer.href} className="flex items-start justify-between gap-2 group/link">
                    <div className="flex items-center gap-2.5">
                      <div className={`rounded-lg p-2 ${s.bg} border ${s.border} shrink-0`}>
                        <Icon className={`h-4 w-4 ${s.text}`} />
                      </div>
                      <div>
                        {layer.id === 'memory' ? (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className={`text-sm font-semibold ${s.text} cursor-help`}>{layer.label}</p>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs p-3 space-y-2">
                                <p className="text-xs font-semibold text-foreground mb-1">
                                  {isRu ? 'Три слоя долгосрочной памяти:' : 'Three layers of long-term memory:'}
                                </p>
                                <div className="space-y-1.5 text-xs">
                                  <div>
                                    <span className="font-medium text-foreground">{isRu ? '🧠 Опыт ролей' : '🧠 Role Experience'}</span>
                                    <p className="text-muted-foreground">{isRu ? 'Поведенческие паттерны, стиль общения и предпочтения каждой роли, накопленные в ходе сессий' : 'Behavioral patterns, communication style and preferences for each role, accumulated through sessions'}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-foreground">{isRu ? '📚 База знаний RAG' : '📚 RAG Knowledge Base'}</span>
                                    <p className="text-muted-foreground">{isRu ? 'Семантически индексированные документы и факты, используемые для контекстного поиска при генерации ответов' : 'Semantically indexed documents and facts used for contextual retrieval during response generation'}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-foreground">{isRu ? '💬 Контекст сессий' : '💬 Session Context'}</span>
                                    <p className="text-muted-foreground">{isRu ? 'Чанки диалогов, решения и инсайты из прошлых сессий, доступные для повторного использования' : 'Conversation chunks, decisions and insights from past sessions, available for reuse'}</p>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <p className={`text-sm font-semibold ${s.text}`}>{layer.label}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground leading-tight">{layer.description}</p>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30 group-hover/link:text-muted-foreground/60 transition-colors shrink-0 mt-0.5" />
                  </Link>

                  {/* Big number */}
                  {isDataLoading ? (
                    <Skeleton className="h-9 w-20" />
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl font-bold tabular-nums ${s.text}`}>{layer.total}</span>
                      <span className="text-xs text-muted-foreground">{isRu ? 'объектов' : 'objects'}</span>
                    </div>
                  )}

                  {/* Sub-items */}
                  <div className="space-y-1 pt-0.5 border-t border-border/50">
                    {layer.items.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-muted-foreground">{item.label}</span>
                        {isDataLoading ? (
                          <Skeleton className="h-4 w-8" />
                        ) : (
                          <span className="font-medium tabular-nums">{item.value}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Quick actions */}
                  <div className="flex flex-wrap gap-1.5 pt-2 mt-auto border-t border-border/30">
                    {layer.actions.map((action) => {
                      const ActionIcon = action.icon;
                      if (action.href) {
                        return (
                          <Link key={action.label} to={action.href}>
                            <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5">
                              <ActionIcon className="h-3 w-3" />
                              {action.label}
                            </Button>
                          </Link>
                        );
                      }
                      return (
                        <Button
                          key={action.label}
                          variant={action.variant || 'outline'}
                          size="sm"
                          className={cn('h-7 text-[11px] gap-1.5', action.variant === 'destructive' && 'animate-pulse')}
                          onClick={(e) => { e.stopPropagation(); action.onClick?.(); }}
                        >
                          <ActionIcon className="h-3 w-3" />
                          {action.label}
                        </Button>
                      );
                    })}
                    {confirmClearMemory && layer.id === 'memory' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => setConfirmClearMemory(false)}
                      >
                        {isRu ? 'Отмена' : 'Cancel'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>



    </div>
  );
}

// ─── Dual Graphs Tab ──────────────────────────────────────────────────────────

function DualGraphsTab({ stats }: { stats: ReturnType<typeof useHydraMemoryStats> }) {
  const { user } = useAuth();

  const [counts, setCounts] = useState({
    prompts: { total: 0, system: 0, custom: 0 },
    blueprints: { total: 0, system: 0, custom: 0 },
    behaviors: { total: 0, system: 0, custom: 0 },
    tools: { total: 0, prompt: 0, http: 0 },
    flows: { total: 0 },
    interviews: { total: 0, completed: 0 },
    contests: { total: 0, completed: 0 },
  });

  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      try {
        const [promptsRes, blueprintsRes, behaviorsRes, toolsRes, flowsRes] = await Promise.all([
          supabase.from('prompt_library').select('is_default').eq('user_id', user.id),
          supabase.from('task_blueprints').select('is_system'),
          supabase.from('role_behaviors').select('is_system'),
          supabase.rpc('get_custom_tools_safe'),
          supabase.from('flow_diagrams').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        const prompts = (promptsRes.data || []) as { is_default: boolean }[];
        const blueprints = (blueprintsRes.data || []) as { is_system: boolean }[];
        const behaviors = (behaviorsRes.data || []) as { is_system: boolean }[];
        const tools = (toolsRes.data || []) as { tool_type?: string }[];
        setCounts(prev => ({
          ...prev,
          prompts: { total: prompts.length, system: prompts.filter(p => p.is_default).length, custom: prompts.filter(p => !p.is_default).length },
          blueprints: { total: blueprints.length, system: blueprints.filter(b => b.is_system).length, custom: blueprints.filter(b => !b.is_system).length },
          behaviors: { total: behaviors.length, system: behaviors.filter(b => b.is_system).length, custom: behaviors.filter(b => !b.is_system).length },
          tools: { total: tools.length, prompt: tools.filter(t => t.tool_type === 'prompt' || !t.tool_type).length, http: tools.filter(t => t.tool_type === 'http_api').length },
          flows: { total: flowsRes.count || 0 },
        }));
      } catch (e) {
        console.error('[DualGraphsTab]', e);
      }
    };
    fetch();
  }, [user?.id]);

  const [rolePromptCounts, setRolePromptCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('prompt_library').select('role').eq('user_id', user.id).then(({ data }) => {
      const map: Record<string, number> = {};
      (data || []).forEach((r: { role: string }) => { map[r.role] = (map[r.role] || 0) + 1; });
      setRolePromptCounts(map);
    });
  }, [user?.id]);

  const knowledgePerRole = useMemo(() => {
    const map: Record<string, number> = {};
    stats.knowledge.forEach(k => { map[k.role] = (map[k.role] || 0) + k.count; });
    return map;
  }, [stats.knowledge]);

  const roleData = useMemo(() => {
    const allRoles = new Set([
      ...stats.roleMemory.map(r => r.role),
      ...Object.keys(knowledgePerRole),
      ...Object.keys(rolePromptCounts),
    ]);
    return Array.from(allRoles).map(role => ({
      role,
      memCount: stats.roleMemory.find(r => r.role === role)?.count || 0,
      knowledgeCount: knowledgePerRole[role] || 0,
      promptCount: rolePromptCounts[role] || 0,
    }));
  }, [stats.roleMemory, knowledgePerRole, rolePromptCounts]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <MemoryGraphTab stats={stats} />
      <ArsenalConnectionsGraph counts={counts} stats={stats} roleData={roleData} />
    </div>
  );
}

// ─── Arsenal Connections Graph ─────────────────────────────────────────────────

interface ArsenalGraphNode {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  r: number;
  color: string;
  glow: string;
  type: 'layer' | 'role';
  value: number;
}

interface ArsenalGraphEdge {
  source: string;
  target: string;
  weight: number; // 0-1
  color: string;
}

function ArsenalConnectionsGraph({
  counts,
  stats,
  roleData,
}: {
  counts: {
    prompts: { total: number; system: number; custom: number };
    blueprints: { total: number; system: number; custom: number };
    behaviors: { total: number; system: number; custom: number };
    tools: { total: number; prompt: number; http: number };
    flows: { total: number };
  };
  stats: ReturnType<typeof useHydraMemoryStats>;
  roleData: { role: string; memCount: number; knowledgeCount: number; promptCount: number }[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 700, h: 440 });
  const [hovered, setHovered] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const isRu = language === 'ru';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e && e.contentRect.width > 0) {
        setSize({ w: Math.round(e.contentRect.width), h: 560 });
      }
    });
    obs.observe(el);
    const { width } = el.getBoundingClientRect();
    if (width > 0) setSize({ w: Math.round(width), h: 560 });
    return () => obs.disconnect();
  }, []);

  const { nodes, edges } = useMemo(() => {
    const { w, h } = size;
    const cx = w / 2;
    const cy = h / 2;
    const layerR = Math.min(cx, cy) * 0.72;
    const roleR = Math.min(cx, cy) * 0.30;

    // 6 layer nodes arranged in a hexagon
    const layerDefs = [
      { id: 'instincts', label: isRu ? 'Инстинкты' : 'Instincts', value: counts.prompts.total, color: 'hsl(var(--hydra-expert))', glow: 'hsl(var(--hydra-expert) / 0.4)' },
      { id: 'patterns',  label: isRu ? 'Паттерны' : 'Patterns',   value: counts.blueprints.total + counts.behaviors.total, color: 'hsl(var(--hydra-arbiter))', glow: 'hsl(var(--hydra-arbiter) / 0.4)' },
      { id: 'tools',     label: isRu ? 'Инструменты' : 'Tools',    value: counts.tools.total, color: 'hsl(var(--hydra-info))', glow: 'hsl(var(--hydra-info) / 0.4)' },
      { id: 'flows',     label: isRu ? 'Потоки' : 'Flows',          value: counts.flows.total, color: 'hsl(var(--hydra-cyan))', glow: 'hsl(var(--hydra-cyan) / 0.4)' },
      { id: 'achieve',   label: isRu ? 'Достижения' : 'Achieve',   value: 0, color: 'hsl(var(--hydra-success))', glow: 'hsl(var(--hydra-success) / 0.4)' },
      { id: 'memory',    label: isRu ? 'Память' : 'Memory',         value: stats.totalRoleMemory + stats.totalKnowledge + stats.sessionMemory.total, color: 'hsl(var(--hydra-memory))', glow: 'hsl(var(--hydra-memory) / 0.4)' },
    ];

    const maxLayerVal = Math.max(...layerDefs.map(l => l.value), 1);

    const layerNodes: ArsenalGraphNode[] = layerDefs.map((def, i) => {
      const angle = (2 * Math.PI * i) / layerDefs.length - Math.PI / 2;
      const nodeR = 30 + (def.value / maxLayerVal) * 22;
      return {
        id: def.id,
        label: def.label,
        x: cx + layerR * Math.cos(angle),
        y: cy + layerR * Math.sin(angle),
        r: nodeR,
        color: def.color,
        glow: def.glow,
        type: 'layer' as const,
        value: def.value,
      };
    });

    // Role nodes — top roles by combined presence
    const topRoles = roleData
      .filter(r => r.memCount > 0 || r.knowledgeCount > 0 || r.promptCount > 0)
      .sort((a, b) => (b.memCount + b.knowledgeCount + b.promptCount) - (a.memCount + a.knowledgeCount + a.promptCount))
      .slice(0, 7);

    const maxRoleVal = Math.max(...topRoles.map(r => r.memCount + r.knowledgeCount + r.promptCount), 1);

    const roleNodes: ArsenalGraphNode[] = topRoles.map((r, i) => {
      const angle = (2 * Math.PI * i) / topRoles.length - Math.PI / 2;
      const total = r.memCount + r.knowledgeCount + r.promptCount;
      const nodeR = 20 + (total / maxRoleVal) * 16;
      const roleConfig = ROLE_CONFIG[r.role as keyof typeof ROLE_CONFIG];
      const roleLabel = roleConfig ? t(roleConfig.label) : r.role;
      return {
        id: `role_${r.role}`,
        label: roleLabel,
        sublabel: `${total}`,
        x: cx + roleR * Math.cos(angle),
        y: cy + roleR * Math.sin(angle),
        r: nodeR,
         color: 'hsl(var(--muted-foreground))',
         glow: 'hsl(var(--muted-foreground) / 0.3)',
        type: 'role' as const,
        value: total,
      };
    });

    const allNodes = [...layerNodes, ...roleNodes];

    // Edges: layer → role based on presence
    const allEdges: ArsenalGraphEdge[] = [];
    const maxEdgeWeight = Math.max(...topRoles.map(r => r.memCount + r.knowledgeCount + r.promptCount), 1);

    topRoles.forEach(r => {
      const roleId = `role_${r.role}`;
       if (r.promptCount > 0) {
         allEdges.push({ source: 'instincts', target: roleId, weight: r.promptCount / maxEdgeWeight, color: 'hsl(var(--hydra-expert))' });
       }
       if (r.memCount > 0) {
         allEdges.push({ source: 'memory', target: roleId, weight: r.memCount / maxLayerVal, color: 'hsl(var(--hydra-memory))' });
       }
       if (r.knowledgeCount > 0) {
         allEdges.push({ source: 'memory', target: roleId, weight: r.knowledgeCount / maxLayerVal, color: 'hsl(var(--hydra-success))' });
       }
     });

     // Layer-to-layer edges
     allEdges.push({ source: 'instincts', target: 'patterns', weight: 0.4, color: 'hsl(var(--hydra-expert) / 0.6)' });
     allEdges.push({ source: 'patterns', target: 'tools', weight: 0.35, color: 'hsl(var(--hydra-info) / 0.6)' });
     allEdges.push({ source: 'tools', target: 'flows', weight: 0.35, color: 'hsl(var(--hydra-cyan) / 0.6)' });
     allEdges.push({ source: 'memory', target: 'achieve', weight: 0.3, color: 'hsl(var(--hydra-success) / 0.6)' });

    return { nodes: allNodes, edges: allEdges };
  }, [size, counts, stats, roleData, isRu]);

  const getNode = (id: string) => nodes.find(n => n.id === id);

  return (
    <Card className="border-border bg-card/50 overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-hydra-memory" />
            {isRu ? 'Граф связей' : 'Connections Graph'}
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            {isRu ? 'Роли как мосты между слоями' : 'Roles as bridges between layers'}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={containerRef} className="w-full relative" style={{ height: 560 }}>
          <svg
            width={size.w}
            height={size.h}
            className="absolute inset-0"
          >
            <defs>
              {nodes.map(n => (
                <radialGradient key={`grad_${n.id}`} id={`grad_${n.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={n.color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={n.color} stopOpacity="0.35" />
                </radialGradient>
              ))}
              <filter id="glow-arsenal">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Edges */}
            {edges.map((edge, i) => {
              const src = getNode(edge.source);
              const tgt = getNode(edge.target);
              if (!src || !tgt) return null;
              const isActive = hovered === edge.source || hovered === edge.target;
              const strokeW = 0.8 + edge.weight * 3.5;
              return (
                <line
                  key={i}
                  x1={src.x} y1={src.y}
                  x2={tgt.x} y2={tgt.y}
                  stroke={edge.color}
                  strokeWidth={strokeW}
                  strokeOpacity={isActive ? 0.85 : 0.22}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-opacity 0.2s' }}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const isHov = hovered === node.id;
              const scale = isHov ? 1.18 : 1;
              const opacity = hovered && !isHov && !edges.some(e => e.source === node.id || e.target === node.id || (hovered && (e.source === hovered || e.target === hovered) && (e.source === node.id || e.target === node.id))) ? 0.45 : 1;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  style={{ cursor: 'pointer', opacity, transition: 'opacity 0.2s' }}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Glow ring */}
                  {isHov && (
                    <circle
                      r={node.r * scale + 6}
                      fill="none"
                      stroke={node.color}
                      strokeWidth={2}
                      strokeOpacity={0.5}
                      filter="url(#glow-arsenal)"
                    />
                  )}
                  {/* Node circle */}
                  <circle
                    r={node.r * scale}
                    fill={`url(#grad_${node.id})`}
                    stroke={node.color}
                    strokeWidth={node.type === 'layer' ? 1.5 : 1}
                    strokeOpacity={0.7}
                    style={{ transition: 'r 0.2s' }}
                  />
                  {/* Label */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                     fontSize={node.type === 'layer' ? Math.max(11, node.r * 0.46) : Math.max(10, node.r * 0.44)}
                    fontWeight={node.type === 'layer' ? 600 : 500}
                    dy={node.sublabel ? -5 : 0}
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {node.label.length > 12 ? node.label.slice(0, 11) + '…' : node.label}
                  </text>
                  {node.sublabel && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={7}
                      fontWeight={400}
                      dy={7}
                      fillOpacity={0.7}
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {node.sublabel}
                    </text>
                  )}
                  {/* Value badge for layer nodes */}
                  {node.type === 'layer' && node.value > 0 && !isHov && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={8}
                      dy={node.r * 0.52 + 10}
                      fillOpacity={0.55}
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {node.value}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hovered && (() => {
            const n = nodes.find(nd => nd.id === hovered);
            if (!n) return null;
            return (
              <div
                className="absolute bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none z-10"
                style={{ left: Math.min(n.x + n.r + 8, size.w - 160), top: Math.max(n.y - 30, 4) }}
              >
                <p className="font-semibold">{n.label}</p>
                {n.type === 'role' && (() => {
                  const rd = roleData.find(r => `role_${r.role}` === n.id);
                  return rd ? (
                    <div className="mt-1 space-y-0.5 text-muted-foreground">
                      {rd.promptCount > 0 && <p>💜 {isRu ? 'Промпты' : 'Prompts'}: {rd.promptCount}</p>}
                      {rd.memCount > 0 && <p>🔵 {isRu ? 'Память' : 'Memory'}: {rd.memCount}</p>}
                      {rd.knowledgeCount > 0 && <p>🟢 {isRu ? 'Знания' : 'Knowledge'}: {rd.knowledgeCount}</p>}
                    </div>
                  ) : null;
                })()}
                {n.type === 'layer' && (
                  <p className="text-muted-foreground mt-0.5">{isRu ? 'Объектов' : 'Objects'}: {n.value}</p>
                )}
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Chronicles helpers ──────────────────────────────────────────────────────

/** Map a free-text role string (e.g. "critic — системный промпт") to a ROLE_CONFIG key */
const ROLE_ALIASES: Record<string, string> = {
  flow_regulator: 'flowregulator',
  prompt_engineer: 'promptengineer',
  supervisor: 'user', // mapped to user icon w/ supervisor color override
  admin: 'user',
  evolutioner: 'evolutioner',
  chronicler: 'chronicler',
};

function matchRoleKey(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  // direct match
  if (ROLE_CONFIG[lower as keyof typeof ROLE_CONFIG]) return lower;
  // alias match
  if (ROLE_ALIASES[lower]) return ROLE_ALIASES[lower];
  // check if starts with a known role key (e.g. "consultant — ...")
  for (const key of Object.keys(ROLE_CONFIG)) {
    if (lower.startsWith(key)) return key;
  }
  for (const [alias, target] of Object.entries(ROLE_ALIASES)) {
    if (lower.startsWith(alias)) return target;
  }
  return null;
}

function RoleBadge({ value, isRu }: { value: string; isRu: boolean }) {
  const roleKey = matchRoleKey(value);
  if (roleKey && ROLE_CONFIG[roleKey as keyof typeof ROLE_CONFIG]) {
    const cfg = ROLE_CONFIG[roleKey as keyof typeof ROLE_CONFIG];
    const Icon = cfg.icon;
    const isSup = value.toLowerCase().startsWith('supervisor') || value.toLowerCase().startsWith('admin');
    const color = isSup ? 'text-hydra-supervisor' : cfg.color;
    return (
      <Badge variant="outline" className={cn('text-xs font-medium gap-1 border', color, cfg.bgClass || '')}>
        <Icon className={cn('h-3 w-3', color)} />
        {value}
      </Badge>
    );
  }
  return <Badge variant="outline" className="text-xs">{value}</Badge>;
}

/** Extract readable markdown from ai_revision (may be JSON with trajectory or plain text) */
function parseAiRevision(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.trajectory && Array.isArray(parsed.trajectory)) {
      return parsed.trajectory
        .filter((s: any) => s.content && typeof s.content === 'string')
        .map((s: any) => s.content)
        .join('\n\n');
    }
    // If it's JSON but no trajectory, return as-is
    return raw;
  } catch {
    // Plain text / markdown
    return raw;
  }
}

// ─── Chronicles Tab ───────────────────────────────────────────────────────────

interface ChronicleDBEntry {
  id: string;
  entry_code: string;
  title: string;
  entry_date: string;
  role_object: string;
  initiator: string;
  status: string;
  supervisor_resolution: string;
  supervisor_comment: string | null;
  hypothesis: string | null;
  metrics_before: Record<string, unknown> | null;
  metrics_after: Record<string, unknown> | null;
  summary: string | null;
  ai_revision: string | null;
  created_at: string;
  updated_at: string;
}

const RESOLUTION_CONFIG: Record<string, { label: { ru: string; en: string }; color: string }> = {
  approved: { label: { ru: '✅ Согласен', en: '✅ Agreed' }, color: 'text-hydra-success' },
  wish: { label: { ru: '💬 Пожелание', en: '💬 User Wish' }, color: 'text-hydra-info' },
  rejected: { label: { ru: '❌ Не согласен', en: '❌ Disagreed' }, color: 'text-hydra-critical' },
  pending: { label: { ru: '⏳ Ожидает', en: '⏳ Pending' }, color: 'text-muted-foreground' },
  revised: { label: { ru: '🔄 Пересмотрено ИИ', en: '🔄 AI Revised' }, color: 'text-hydra-expert' },
};

const STATUS_DISPLAY: Record<string, { label: { ru: string; en: string }; color: string; bg: string; Icon: React.ElementType }> = {
  completed: { label: { ru: 'Выполнено', en: 'Completed' }, color: 'text-hydra-success', bg: 'bg-hydra-success/5 border-hydra-success/30', Icon: CheckCheck },
  pending: { label: { ru: 'Ожидает тестирования', en: 'Awaiting Testing' }, color: 'text-hydra-warning', bg: 'bg-hydra-warning/5 border-hydra-warning/30', Icon: Timer },
  sample: { label: { ru: 'Образцовая запись', en: 'Sample Entry' }, color: 'text-hydra-warning', bg: 'bg-hydra-warning/5 border-hydra-warning/30', Icon: Timer },
  revised: { label: { ru: 'Пересмотрено ИИ', en: 'AI Revised' }, color: 'text-hydra-expert', bg: 'bg-hydra-expert/5 border-hydra-expert/30', Icon: FlaskConical },
};

const EMPTY_FORM = {
  title: '',
  entry_code: '',
  role_object: '',
  initiator: 'Supervisor',
  status: 'pending',
  hypothesis: '',
  summary: '',
  metrics_before: '',
  metrics_after: '',
};

// ─── Chronicles MD Export ─────────────────────────────────────────────────────

function generateChroniclesMD(entries: ChronicleDBEntry[], isRu: boolean): string {
  const now = new Date().toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const resLabel: Record<string, string> = {
    approved: isRu ? '✅ Согласован' : '✅ Approved',
    rejected: isRu ? '❌ Отклонён' : '❌ Rejected',
    wish:     isRu ? '💬 Пожелание' : '💬 Wish',
    pending:  isRu ? '⏳ Ожидает' : '⏳ Pending',
    revised:  isRu ? '🔄 Пересмотрено ИИ' : '🔄 AI Revised',
  };
  const statusLabel: Record<string, string> = {
    completed: isRu ? '✅ Выполнено' : '✅ Completed',
    pending:   isRu ? '🟡 Ожидает тестирования' : '🟡 Awaiting Testing',
    revised:   isRu ? '🔄 Пересмотрено' : '🔄 Revised',
    sample:    isRu ? '🟡 Образцовая запись' : '🟡 Sample Entry',
  };

  const header = isRu
    ? `# 📜 Хроники Гидры\n\n> *Публичный артефакт Отдела Эволюционирования. Экспорт от ${now}.*\n\n`
    : `# 📜 Chronicles of Hydra\n\n> *Public artifact of the Evolution Department. Exported on ${now}.*\n\n`;

  const stats = [
    `| ${isRu ? 'Всего записей' : 'Total'} | ${isRu ? 'Одобрено' : 'Approved'} | ${isRu ? 'Отклонено' : 'Rejected'} | ${isRu ? 'Ожидает' : 'Pending'} |`,
    `|---|---|---|---|`,
    `| ${entries.length} | ${entries.filter(e => e.supervisor_resolution === 'approved').length} | ${entries.filter(e => e.supervisor_resolution === 'rejected').length} | ${entries.filter(e => e.supervisor_resolution === 'pending').length} |`,
  ].join('\n');

  const entriesMD = entries.map(e => {
    const lines: string[] = [
      `---`,
      ``,
      `### [${e.entry_code}] ${e.title}`,
      ``,
      `| ${isRu ? 'Поле' : 'Field'} | ${isRu ? 'Значение' : 'Value'} |`,
      `|---|---|`,
      `| **${isRu ? 'Дата' : 'Date'}** | ${e.entry_date} |`,
      `| **${isRu ? 'Объект' : 'Target'}** | \`${e.role_object || '—'}\` |`,
      `| **${isRu ? 'Инициатор' : 'Initiator'}** | ${e.initiator} |`,
      `| **${isRu ? 'Статус' : 'Status'}** | ${statusLabel[e.status] ?? e.status} |`,
      `| **${isRu ? 'Резолюция' : 'Resolution'}** | ${resLabel[e.supervisor_resolution] ?? e.supervisor_resolution} |`,
    ];

    if (e.supervisor_comment) {
      lines.push(`| **${isRu ? 'Комментарий' : 'Comment'}** | ${e.supervisor_comment} |`);
    }
    lines.push('');

    if (e.hypothesis) {
      lines.push(`**${isRu ? 'Гипотеза' : 'Hypothesis'}:**`);
      lines.push(`> ${e.hypothesis.replace(/\n/g, '\n> ')}`);
      lines.push('');
    }

    if (e.summary) {
      lines.push(`**${isRu ? 'Результат' : 'Summary'}:**`);
      lines.push(e.summary);
      lines.push('');
    }

    const mb = e.metrics_before;
    const ma = e.metrics_after;
    if (mb && ma && Object.keys(mb).length > 0 && Object.keys(ma).length > 0) {
      lines.push(`**${isRu ? 'Метрики' : 'Metrics'}:**`);
      lines.push('');
      const metricKeys = Array.from(new Set([...Object.keys(mb), ...Object.keys(ma)]));
      lines.push(`| ${isRu ? 'Показатель' : 'Metric'} | ${isRu ? 'До' : 'Before'} | ${isRu ? 'После' : 'After'} |`);
      lines.push(`|---|---|---|`);
      metricKeys.forEach(k => {
        const label = getTermLabel(k, isRu);
        lines.push(`| ${label} | ${mb[k] !== undefined ? String(mb[k]) : '—'} | ${ma[k] !== undefined ? String(ma[k]) : '—'} |`);
      });
      lines.push('');
    }

    if (e.ai_revision) {
      lines.push(`<details>`);
      lines.push(`<summary>🔬 ${isRu ? 'ИИ-ревизия Эволюционера' : 'AI Evolutioner Revision'}</summary>`);
      lines.push('');
      lines.push(e.ai_revision);
      lines.push('');
      lines.push(`</details>`);
      lines.push('');
    }

    return lines.join('\n');
  }).join('\n');

  return `${header}## ${isRu ? 'Статистика' : 'Statistics'}\n\n${stats}\n\n## ${isRu ? 'Записи' : 'Entries'}\n\n${entriesMD}\n`;
}

function ChroniclesTab({ language, isSupervisor }: { language: string; isSupervisor: boolean }) {
  const isRu = language === 'ru';
  const { user } = useAuth();
  const [entries, setEntries] = useState<ChronicleDBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [autorunning, setAutorunning] = useState(false);
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [filterResolution, setFilterResolution] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const uniqueRoles = useMemo(() => {
    const roles = Array.from(new Set(entries.map(e => e.role_object).filter(Boolean)));
    return roles.sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterResolution !== 'all' && e.supervisor_resolution !== filterResolution) return false;
      if (filterRole !== 'all' && e.role_object !== filterRole) return false;
      if (filterDateFrom && e.entry_date < filterDateFrom) return false;
      if (filterDateTo && e.entry_date > filterDateTo) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const haystack = [e.title, e.entry_code, e.role_object, e.initiator, e.hypothesis, e.summary, e.ai_revision]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [entries, filterResolution, filterRole, filterDateFrom, filterDateTo, searchText]);

  const hasActiveFilters = filterResolution !== 'all' || filterRole !== 'all' || filterDateFrom || filterDateTo || searchText.trim();
  const clearFilters = () => { setSearchText(''); setFilterResolution('all'); setFilterRole('all'); setFilterDateFrom(''); setFilterDateTo(''); };

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chronicles')
        .select('*')
        .order('entry_code', { ascending: false });
      if (error) throw error;
      setEntries((data || []) as ChronicleDBEntry[]);
    } catch (err) {
      console.error('Failed to load chronicles:', err);
      toast.error(isRu ? 'Ошибка загрузки хроник' : 'Failed to load chronicles');
    } finally {
      setLoading(false);
    }
  }, [isRu]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const setResolution = async (entryId: string, resolution: string) => {
    setUpdatingId(entryId);
    try {
      const { error } = await supabase
        .from('chronicles')
        .update({ supervisor_resolution: resolution })
        .eq('id', entryId);
      if (error) throw error;

      const entry = entries.find(e => e.id === entryId);
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, supervisor_resolution: resolution } : e));
      toast.success(isRu ? 'Резолюция сохранена' : 'Resolution saved');

      // Phase 3: Record outcome for meta-learning when resolving a revised entry
      if (entry?.status === 'revised' && entry?.ai_revision && (resolution === 'approved' || resolution === 'rejected')) {
        try {
          let strategyTags: string[] = [];
          let confidence = 0.5;
          try {
            const parsed = JSON.parse(entry.ai_revision);
            strategyTags = parsed.strategy_tags || [];
            confidence = parsed.confidence || 0.5;
          } catch { /* plain text */ }

          await supabase.functions.invoke('evolution-trigger', {
            body: {
              mode: 'record_outcome',
              entry_code: entry.entry_code,
              title: entry.title,
              role_object: entry.role_object,
              strategy_tags: strategyTags,
              confidence,
              resolution: resolution === 'approved' ? 'accepted' : 'rejected',
              supervisor_comment: entry.supervisor_comment,
              user_id: user?.id,
            },
          });
        } catch (e) {
          console.warn('[Phase3] Outcome recording failed:', e);
        }
      }

      if (resolution === 'rejected') {
        triggerEvolution(entryId, 'single');
      }
    } catch {
      toast.error(isRu ? 'Ошибка сохранения' : 'Save failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const triggerEvolution = async (chronicleId: string | null, mode: 'single' | 'autorun') => {
    if (mode === 'autorun') setAutorunning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evolution-trigger`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ mode, chronicle_id: chronicleId }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Evolution trigger failed');
      if (mode === 'autorun') {
        const revised = result.revised ?? 0;
        const total = result.total ?? 0;
        const remaining = result.remaining ?? 0;
        if (total === 0) {
          toast.info(isRu ? 'Нет записей для авторевизии — все уже пересмотрены' : 'No entries to revise — all already processed');
        } else if (remaining > 0) {
          toast.success(
            isRu
              ? `Батч завершён: ${revised}/${total} пересмотрено. Осталось ещё ${remaining} — запустите повторно.`
              : `Batch complete: ${revised}/${total} revised. ${remaining} remaining — run again.`
          );
        } else {
          toast.success(isRu ? `Автопробег завершён: ${revised}/${total} пересмотрено` : `Autorun complete: ${revised}/${total} revised`);
        }
      } else {
        toast.success(isRu ? 'ИИ-ревизия запущена' : 'AI revision triggered');
      }
      await loadEntries();
    } catch (err) {
      console.error('Evolution trigger error:', err);
      toast.error(isRu ? 'Ошибка запуска Эволюционера' : 'Evolution trigger failed');
    } finally {
      if (mode === 'autorun') setAutorunning(false);
    }
  };

  const generateNextCode = useCallback((existing: ChronicleDBEntry[]) => {
    const nums = existing
      .map(e => parseInt(e.entry_code?.replace(/\D/g, '') || '0', 10))
      .filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `EVO-${String(next).padStart(3, '0')}`;
  }, []);

  const openForm = () => {
    setFormData({ ...EMPTY_FORM, entry_code: generateNextCode(entries) });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.entry_code.trim()) {
      toast.error(isRu ? 'Заполните код и заголовок' : 'Entry code and title are required');
      return;
    }
    setSaving(true);
    try {
      let metricsBefore: Record<string, unknown> | null = null;
      let metricsAfter: Record<string, unknown> | null = null;
      if (formData.metrics_before.trim()) {
        try { metricsBefore = JSON.parse(formData.metrics_before); } catch { toast.error(isRu ? 'Метрики "До" — невалидный JSON' : '"Before" metrics: invalid JSON'); setSaving(false); return; }
      }
      if (formData.metrics_after.trim()) {
        try { metricsAfter = JSON.parse(formData.metrics_after); } catch { toast.error(isRu ? 'Метрики "После" — невалидный JSON' : '"After" metrics: invalid JSON'); setSaving(false); return; }
      }
      const { error } = await supabase.from('chronicles').insert([{
        entry_code: formData.entry_code.trim(),
        title: formData.title.trim(),
        role_object: formData.role_object.trim(),
        initiator: formData.initiator.trim() || 'Supervisor',
        status: formData.status,
        hypothesis: formData.hypothesis.trim() || null,
        summary: formData.summary.trim() || null,
        metrics_before: metricsBefore as import('@/integrations/supabase/types').Json,
        metrics_after: metricsAfter as import('@/integrations/supabase/types').Json,
        supervisor_resolution: 'pending',
        is_visible: true,
      }]);
      if (error) throw error;
      toast.success(isRu ? 'Запись создана' : 'Entry created');
      setShowForm(false);
      setFormData(EMPTY_FORM);
      await loadEntries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(isRu ? `Ошибка: ${msg}` : `Error: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const rejectedCount = entries.filter(e => e.supervisor_resolution === 'rejected' && e.status !== 'revised').length;
  const approvedCount = entries.filter(e => e.supervisor_resolution === 'approved').length;
  const pendingCount = entries.filter(e => e.supervisor_resolution === 'pending').length;

  const exportToMarkdown = useCallback(() => {
    const md = generateChroniclesMD(entries, isRu);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CHRONICLES.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isRu ? 'CHRONICLES.md скачан' : 'CHRONICLES.md downloaded');
  }, [entries, isRu]);

  return (
    <div className="space-y-6">
      {/* Header banner */}
       <Card className="border-hydra-arbiter/30 bg-hydra-arbiter/5">
         <CardContent className="p-5">
           <div className="flex items-start gap-4">
             <div className="rounded-xl p-3 bg-hydra-arbiter/15 border border-hydra-arbiter/30 shrink-0">
               <ScrollText className="h-6 w-6 text-hydra-arbiter" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-hydra-arbiter">
                {isRu ? 'Хроники Эволюции Hydra' : 'Chronicles of Hydra Evolution'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isRu
                  ? 'Публичный артефакт Отдела Эволюционирования. Каждая запись — доказательство того, что «живая архитектура» Hydra не метафора, а инженерный факт.'
                  : "A public artifact of the Evolution Department. Each entry proves that Hydra's \"living architecture\" is not a metaphor — it is an engineering fact."}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                   <FlaskConical className="h-3.5 w-3.5 text-hydra-success" />
                   <span className="text-hydra-success font-medium">{isRu ? 'Эволюционер' : 'Evolutioner'}</span>
                   <span>{isRu ? '→ тестирует и измеряет' : '→ tests & measures'}</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                   <ScrollText className="h-3.5 w-3.5 text-hydra-arbiter" />
                   <span className="text-hydra-arbiter font-medium">{isRu ? 'Летописец' : 'Chronicler'}</span>
                  <span>{isRu ? '→ фиксирует и архивирует' : '→ records & archives'}</span>
                </div>
                {isSupervisor && rejectedCount > 0 && (
                  <div className="ml-auto">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => triggerEvolution(null, 'autorun')}
                      disabled={autorunning}
                      className="gap-1.5 border-hydra-expert/30 text-hydra-expert hover:bg-hydra-expert/10"
                    >
                      {autorunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                      {isRu ? `Автопробег (${rejectedCount} отклонённых)` : `Autorun (${rejectedCount} rejected)`}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          <div className="flex items-center gap-2 shrink-0">
            {isSupervisor && entries.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportToMarkdown}
                className="gap-1.5 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
              >
                <Download className="h-3.5 w-3.5" />
                {isRu ? 'Экспорт в MD' : 'Export MD'}
              </Button>
            )}
            <a href="https://github.com/alexkuz60/ai-hydra/blob/main/CHRONICLES.md" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                <ExternalLink className="h-3.5 w-3.5" />
                GitHub
              </Button>
            </a>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-muted"><ScrollText className="h-4 w-4 text-amber-400" /></div>
          <div><p className="text-xs text-muted-foreground">{isRu ? 'Всего записей' : 'Total entries'}</p><p className="text-2xl font-bold">{entries.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-muted"><CheckCheck className="h-4 w-4 text-emerald-400" /></div>
          <div><p className="text-xs text-muted-foreground">{isRu ? 'Одобрено' : 'Approved'}</p><p className="text-2xl font-bold">{approvedCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-muted"><Timer className="h-4 w-4 text-amber-400" /></div>
          <div><p className="text-xs text-muted-foreground">{isRu ? 'Ожидает' : 'Pending'}</p><p className="text-2xl font-bold">{pendingCount}</p></div>
        </CardContent></Card>
      </div>

      {/* New Entry button & form — Supervisor only */}
      {isSupervisor && (
        <div>
          {!showForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={openForm}
              className="gap-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            >
              <ScrollText className="h-4 w-4" />
              {isRu ? 'Добавить запись Летописца' : 'Add Chronicle Entry'}
            </Button>
          ) : (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                    <ScrollText className="h-4 w-4" />
                    {isRu ? 'Новая запись Летописца' : 'New Chronicle Entry'}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="h-7 w-7">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Код записи *' : 'Entry Code *'}</label>
                    <Input
                      value={formData.entry_code}
                      onChange={e => setFormData(p => ({ ...p, entry_code: e.target.value }))}
                      placeholder="EVO-001"
                      className="h-8 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Статус' : 'Status'}</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="pending">{isRu ? 'Ожидает тестирования' : 'Awaiting Testing'}</option>
                      <option value="completed">{isRu ? 'Выполнено' : 'Completed'}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Заголовок *' : 'Title *'}</label>
                  <Input
                    value={formData.title}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    placeholder={isRu ? 'Оптимизация промпта Критика...' : 'Critic prompt optimization...'}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Объект (роль)' : 'Target Role'}</label>
                    <Input
                      value={formData.role_object}
                      onChange={e => setFormData(p => ({ ...p, role_object: e.target.value }))}
                      placeholder="Critic, Evolutioner..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Инициатор' : 'Initiator'}</label>
                    <Input
                      value={formData.initiator}
                      onChange={e => setFormData(p => ({ ...p, initiator: e.target.value }))}
                      placeholder="Supervisor"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Гипотеза' : 'Hypothesis'}</label>
                  <textarea
                    value={formData.hypothesis}
                    onChange={e => setFormData(p => ({ ...p, hypothesis: e.target.value }))}
                    placeholder={isRu ? 'Что предполагается улучшить...' : 'What is expected to improve...'}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Описание / Результат' : 'Summary / Result'}</label>
                  <textarea
                    value={formData.summary}
                    onChange={e => setFormData(p => ({ ...p, summary: e.target.value }))}
                    placeholder={isRu ? 'Что было сделано и что получилось...' : 'What was done and the outcome...'}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Метрики "До" (JSON)' : '"Before" Metrics (JSON)'}</label>
                    <textarea
                      value={formData.metrics_before}
                      onChange={e => setFormData(p => ({ ...p, metrics_before: e.target.value }))}
                      placeholder={'{"tokens": 450, "score": 6.2}'}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Метрики "После" (JSON)' : '"After" Metrics (JSON)'}</label>
                    <textarea
                      value={formData.metrics_after}
                      onChange={e => setFormData(p => ({ ...p, metrics_after: e.target.value }))}
                      placeholder={'{"tokens": 310, "score": 7.8}'}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} disabled={saving}>
                    {isRu ? 'Отмена' : 'Cancel'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-hydra-arbiter/20 text-hydra-arbiter border border-hydra-arbiter/40 hover:bg-hydra-arbiter/30"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ScrollText className="h-3.5 w-3.5 mr-1.5" />}
                    {isRu ? 'Зафиксировать запись' : 'Save Entry'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Autorun banner for supervisors */}
      {isSupervisor && !loading && rejectedCount > 0 && (
        <div className="sticky top-0 z-10 rounded-xl border border-hydra-critical/40 bg-hydra-critical/10 backdrop-blur-sm p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-hydra-critical shrink-0" />
            <span className="text-hydra-critical font-medium">
              {isRu
                ? `${rejectedCount} ${rejectedCount === 1 ? 'запись отклонена' : rejectedCount < 5 ? 'записи отклонены' : 'записей отклонено'} — требуют авторевизии Эволюционера`
                : `${rejectedCount} ${rejectedCount === 1 ? 'entry rejected' : 'entries rejected'} — awaiting Evolutioner auto-revision`}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => triggerEvolution(null, 'autorun')}
            disabled={autorunning}
            className="gap-1.5 shrink-0 bg-hydra-critical/80 hover:bg-hydra-critical text-white border-0"
          >
            {autorunning
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <FlaskConical className="h-3.5 w-3.5" />}
            {isRu ? 'Запустить авторевизию всех отклонённых' : 'Auto-revise all rejected'}
          </Button>
        </div>
      )}

      {/* Filter & Search panel */}
      {!loading && entries.length > 0 && (
        <Card className="border-border bg-card/60">
          <CardContent className="p-4 space-y-3">
            {/* Search row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder={isRu ? 'Поиск по тексту (заголовок, гипотеза, резолюция...)' : 'Search text (title, hypothesis, revision...)'}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1.5 text-muted-foreground hover:text-foreground shrink-0">
                  <X className="h-3.5 w-3.5" />
                  {isRu ? 'Сбросить' : 'Reset'}
                </Button>
              )}
            </div>
            {/* Filter row */}
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              {/* Resolution filter */}
              <select
                value={filterResolution}
                onChange={e => setFilterResolution(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">{isRu ? 'Все резолюции' : 'All resolutions'}</option>
                <option value="pending">{isRu ? '⏳ Ожидает' : '⏳ Pending'}</option>
                <option value="approved">{isRu ? '✅ Согласовано' : '✅ Approved'}</option>
                <option value="rejected">{isRu ? '❌ Отклонено' : '❌ Rejected'}</option>
                <option value="wish">{isRu ? '💬 Пожелание' : '💬 Wish'}</option>
                <option value="revised">{isRu ? '🔄 Пересмотрено ИИ' : '🔄 AI Revised'}</option>
              </select>
              {/* Role filter */}
              {uniqueRoles.length > 0 && (
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="all">{isRu ? 'Все роли' : 'All roles'}</option>
                  {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
              {/* Date range */}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-muted-foreground shrink-0">{isRu ? 'С' : 'From'}</span>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground shrink-0">{isRu ? 'по' : 'to'}</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={e => setFilterDateTo(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            {/* Result count */}
            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground">
                {isRu
                  ? `Показано ${filteredEntries.length} из ${entries.length} записей`
                  : `Showing ${filteredEntries.length} of ${entries.length} entries`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Entries */}
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : filteredEntries.length === 0 && entries.length > 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {isRu ? 'Нет записей по выбранным фильтрам' : 'No entries match the selected filters'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const statusCfg = STATUS_DISPLAY[entry.status] || STATUS_DISPLAY['pending'];
            const StatusIcon = statusCfg.Icon;
            const resolutionCfg = RESOLUTION_CONFIG[entry.supervisor_resolution] || RESOLUTION_CONFIG['pending'];
            const mb = entry.metrics_before;
            const mat = entry.metrics_after;
            const isUpdating = updatingId === entry.id;
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Card className={`border ${statusCfg.bg}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Badge variant="outline" className="font-mono text-xs shrink-0 border-muted-foreground/30">{entry.entry_code}</Badge>
                        <span className={`inline-flex items-center gap-1 text-xs ${statusCfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label[isRu ? 'ru' : 'en']}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{entry.entry_date}</span>
                    </div>
                    <CardTitle className="text-base mt-1">{entry.title}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="text-xs text-muted-foreground font-medium">{isRu ? 'Объект:' : 'Target:'}</span>
                      <RoleBadge value={entry.role_object} isRu={isRu} />
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground font-medium">{isRu ? 'Инициатор:' : 'Initiator:'}</span>
                      <RoleBadge value={entry.initiator} isRu={isRu} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Hypothesis — collapsible frame with toggle inside */}
                    {entry.hypothesis && (
                      <Collapsible
                        open={expandedCards.has(entry.id)}
                        onOpenChange={() => setExpandedCards(prev => {
                          const next = new Set(prev);
                          next.has(entry.id) ? next.delete(entry.id) : next.add(entry.id);
                          return next;
                        })}
                      >
                        <div className="rounded-lg border border-border bg-muted/20 p-3">
                          <CollapsibleTrigger className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Lightbulb className="h-3.5 w-3.5" />
                              {isRu ? 'Гипотеза' : 'Hypothesis'}
                            </div>
                            <span className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                              {expandedCards.has(entry.id)
                                ? (isRu ? 'Свернуть детали' : 'Collapse details')
                                : (isRu ? 'Показать детали' : 'Show details')}
                              {!expandedCards.has(entry.id) && entry.ai_revision && (
                                <FlaskConical className="h-3 w-3 text-hydra-expert ml-1" />
                              )}
                            </span>
                          </CollapsibleTrigger>
                          <p className="text-sm text-muted-foreground leading-relaxed mt-2">{entry.hypothesis}</p>
                        </div>

                        <CollapsibleContent className="space-y-4 mt-4">
                          {/* Summary */}
                          {entry.summary && (
                            <div className="rounded-lg border border-border bg-muted/20 p-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">{isRu ? 'Результат' : 'Summary'}</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{entry.summary}</p>
                            </div>
                          )}

                          {/* Metrics — show even if only one side has data */}
                          {((mb && Object.keys(mb).length > 0) || (mat && Object.keys(mat).length > 0)) && (
                            <div className="grid grid-cols-2 gap-3">
                              {mb && Object.keys(mb).length > 0 && (
                                <div className="rounded-lg border border-border p-3 space-y-1.5">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{isRu ? 'До' : 'Before'}</p>
                                  {Object.entries(mb).map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-xs">
                                      <TermLabel term={k} className="text-muted-foreground">{getTermLabel(k, isRu)}</TermLabel>
                                      <span className="font-mono font-medium">{String(v)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {mat && Object.keys(mat).length > 0 && (
                                <div className="rounded-lg border border-hydra-success/30 bg-hydra-success/5 p-3 space-y-1.5">
                                  <p className="text-xs font-medium text-hydra-success uppercase tracking-wide">{isRu ? 'Цель →' : 'Target →'}</p>
                                  {Object.entries(mat).map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-xs">
                                      <TermLabel term={k} className="text-muted-foreground">{getTermLabel(k, isRu)}</TermLabel>
                                      <span className="font-mono font-medium text-hydra-success">{String(v)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* AI Revision — with markdown rendering */}
                          {entry.ai_revision && (
                            <Collapsible
                              open={expandedRevision === entry.id}
                              onOpenChange={() => setExpandedRevision(expandedRevision === entry.id ? null : entry.id)}
                            >
                              <div className="rounded-lg border border-hydra-expert/30 bg-hydra-expert/5 p-3">
                                <CollapsibleTrigger className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-1.5 text-xs text-hydra-expert font-medium">
                                    <FlaskConical className="h-3.5 w-3.5" />
                                    {isRu ? 'ИИ-ревизия Эволюционера' : 'AI Evolutioner Revision'}
                                  </div>
                                  <span className="text-xs text-hydra-expert hover:text-hydra-expert/80">
                                    {expandedRevision === entry.id ? (isRu ? 'Свернуть' : 'Collapse') : (isRu ? 'Развернуть' : 'Expand')}
                                  </span>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="mt-2 prose prose-sm dark:prose-invert max-w-none">
                                    <MarkdownRenderer content={parseAiRevision(entry.ai_revision)} className="text-sm" />
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* If no hypothesis but has other details — show them directly */}
                    {!entry.hypothesis && (entry.summary || entry.ai_revision || (mb && Object.keys(mb).length > 0) || (mat && Object.keys(mat).length > 0)) && (
                      <>
                        {entry.summary && (
                          <div className="rounded-lg border border-border bg-muted/20 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">{isRu ? 'Результат' : 'Summary'}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{entry.summary}</p>
                          </div>
                        )}
                        {((mb && Object.keys(mb).length > 0) || (mat && Object.keys(mat).length > 0)) && (
                          <div className="grid grid-cols-2 gap-3">
                            {mb && Object.keys(mb).length > 0 && (
                              <div className="rounded-lg border border-border p-3 space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{isRu ? 'До' : 'Before'}</p>
                                {Object.entries(mb).map(([k, v]) => (
                                  <div key={k} className="flex justify-between text-xs">
                                    <TermLabel term={k} className="text-muted-foreground">{getTermLabel(k, isRu)}</TermLabel>
                                    <span className="font-mono font-medium">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {mat && Object.keys(mat).length > 0 && (
                              <div className="rounded-lg border border-hydra-success/30 bg-hydra-success/5 p-3 space-y-1.5">
                                <p className="text-xs font-medium text-hydra-success uppercase tracking-wide">{isRu ? 'Цель →' : 'Target →'}</p>
                                {Object.entries(mat).map(([k, v]) => (
                                  <div key={k} className="flex justify-between text-xs">
                                    <TermLabel term={k} className="text-muted-foreground">{getTermLabel(k, isRu)}</TermLabel>
                                    <span className="font-mono font-medium text-hydra-success">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {entry.ai_revision && (
                          <Collapsible
                            open={expandedRevision === entry.id}
                            onOpenChange={() => setExpandedRevision(expandedRevision === entry.id ? null : entry.id)}
                          >
                            <div className="rounded-lg border border-hydra-expert/30 bg-hydra-expert/5 p-3">
                              <CollapsibleTrigger className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1.5 text-xs text-hydra-expert font-medium">
                                  <FlaskConical className="h-3.5 w-3.5" />
                                  {isRu ? 'ИИ-ревизия Эволюционера' : 'AI Evolutioner Revision'}
                                </div>
                                <span className="text-xs text-hydra-expert hover:text-hydra-expert/80">
                                  {expandedRevision === entry.id ? (isRu ? 'Свернуть' : 'Collapse') : (isRu ? 'Развернуть' : 'Expand')}
                                </span>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mt-2 prose prose-sm dark:prose-invert max-w-none">
                                  <MarkdownRenderer content={parseAiRevision(entry.ai_revision)} className="text-sm" />
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        )}
                      </>
                    )}

                    {/* Resolution row — always visible */}
                    <div className="flex items-center gap-2 pt-1 border-t border-border flex-wrap">
                      <span className="text-xs text-muted-foreground">{isRu ? 'Резолюция супервизора:' : 'Supervisor resolution:'}</span>
                      <span className={`text-xs font-medium ${resolutionCfg.color}`}>{resolutionCfg.label[isRu ? 'ru' : 'en']}</span>
                      {entry.supervisor_comment && (
                        <span className="text-xs text-muted-foreground">— {entry.supervisor_comment}</span>
                      )}
                      {isSupervisor && (
                        <div className="flex items-center gap-1 ml-auto">
                          {isUpdating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Button variant="ghost" size="sm"
                                onClick={() => setResolution(entry.id, 'approved')}
                                disabled={entry.supervisor_resolution === 'approved'}
                                className={cn('h-6 text-xs', entry.supervisor_resolution === 'approved' ? 'text-hydra-success bg-hydra-success/10' : 'text-muted-foreground hover:text-hydra-success')}
                              >✅ {isRu ? 'Согласен' : 'Agree'}</Button>
                              <Button variant="ghost" size="sm"
                                onClick={() => setResolution(entry.id, 'wish')}
                                disabled={entry.supervisor_resolution === 'wish'}
                                className={cn('h-6 text-xs', entry.supervisor_resolution === 'wish' ? 'text-hydra-info bg-hydra-info/10' : 'text-muted-foreground hover:text-hydra-info')}
                              >💬 {isRu ? 'Пожелание' : 'Wish'}</Button>
                              <Button variant="ghost" size="sm"
                                onClick={() => setResolution(entry.id, 'rejected')}
                                disabled={entry.supervisor_resolution === 'rejected'}
                                className={cn('h-6 text-xs', entry.supervisor_resolution === 'rejected' ? 'text-hydra-critical bg-hydra-critical/10' : 'text-muted-foreground hover:text-hydra-critical')}
                              >❌ {isRu ? 'Не согласен' : 'Reject'}</Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Evolutioner Prompts Manager — Supervisor only */}
      {isSupervisor && <EvolutionerPromptsPanel isRu={isRu} />}
    </div>
  );
}

// ─── Evolutioner Prompts Panel ────────────────────────────────────────────────

interface EvolutionerPrompt {
  id: string;
  name: string;
  description: string | null;
  content: string;
  tags: string[] | null;
  updated_at: string;
}

const PROMPT_LABELS: Record<string, { ru: string; en: string; color: string }> = {
  contest_discrepancy: { ru: 'Расхождение оценок (Конкурс)', en: 'Score Discrepancy (Contest)', color: 'text-hydra-info border-hydra-info/30 bg-hydra-info/10' },
  rejected_default:   { ru: 'Отклонение (универсальный)', en: 'Rejected (default)', color: 'text-hydra-arbiter border-hydra-arbiter/30 bg-hydra-arbiter/10' },
  rejected_technoarbiter: { ru: 'Отклонение → ТехноАрбитр', en: 'Rejected → TechnoArbiter', color: 'text-hydra-expert border-hydra-expert/30 bg-hydra-expert/10' },
  rejected_technocritic:  { ru: 'Отклонение → ТехноКритик', en: 'Rejected → TechnoCritic', color: 'text-hydra-critical border-hydra-critical/30 bg-hydra-critical/10' },
  rejected_guide:         { ru: 'Отклонение → Гид', en: 'Rejected → Guide', color: 'text-hydra-success border-hydra-success/30 bg-hydra-success/10' },
};

function EvolutionerPromptsPanel({ isRu }: { isRu: boolean }) {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<EvolutionerPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('prompt_library')
      .select('id, name, description, content, tags, updated_at')
      .eq('role', 'evolutioner')
      .eq('is_default', true)
      .order('name');
    setPrompts((data || []) as EvolutionerPrompt[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (open) loadPrompts(); }, [open, loadPrompts]);

  const startEdit = (p: EvolutionerPrompt) => {
    setEditingId(p.id);
    setEditContent(p.content);
  };

  const cancelEdit = () => { setEditingId(null); setEditContent(''); };

  const savePrompt = async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('prompt_library')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error(isRu ? 'Ошибка сохранения' : 'Save failed');
    } else {
      toast.success(isRu ? 'Промпт обновлён' : 'Prompt updated');
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, content: editContent } : p));
      setEditingId(null);
    }
    setSaving(false);
  };

  return (
     <Card className="border-hydra-success/20 bg-hydra-success/5 mt-4">
       <CardHeader className="pb-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
         <div className="flex items-center justify-between gap-2">
           <div className="flex items-center gap-2">
             <FlaskConical className="h-4 w-4 text-hydra-success" />
             <CardTitle className="text-sm font-semibold text-hydra-success">
               {isRu ? 'Промпты Эволюционера' : "Evolutioner's Prompts"}
             </CardTitle>
             <Badge variant="secondary" className="text-xs bg-hydra-success/15 text-hydra-success">
              {isRu ? 'только Супервизор' : 'Supervisor only'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{open ? '▲' : '▼'}</span>
        </div>
        {!open && (
          <p className="text-xs text-muted-foreground mt-1">
            {isRu
              ? 'Роль-специфичные шаблоны для авторевизии. Нажмите, чтобы раскрыть и отредактировать.'
              : 'Role-specific templates for auto-revision. Click to expand and edit.'}
          </p>
        )}
      </CardHeader>
      {open && (
        <CardContent className="pt-0 space-y-3">
          <p className="text-xs text-muted-foreground">
            {isRu
              ? 'Шаблоны используют плейсхолдеры: {{entry_code}}, {{title}}, {{role_object}}, {{hypothesis}}, {{metrics_before}}, {{metrics_after}}, {{supervisor_comment}}, {{summary}} — для записей Хроник; и {{model_id}}, {{user_score}}, {{arbiter_score}}, {{delta}}, {{threshold}}, {{round_prompt}}, {{direction}} — для расхождений конкурса.'
              : 'Templates use placeholders: {{entry_code}}, {{title}}, {{role_object}}, {{hypothesis}}, etc. for chronicle entries; {{model_id}}, {{user_score}}, {{arbiter_score}}, {{delta}}, etc. for contest discrepancies.'}
          </p>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {prompts.map(p => {
                const label = PROMPT_LABELS[p.name];
                const isEditing = editingId === p.id;
                return (
                  <div key={p.id} className="rounded-lg border border-border bg-background/50 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {label ? (
                          <Badge className={cn('text-xs border font-mono', label.color)}>
                            {isRu ? label.ru : label.en}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs font-mono">{p.name}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {isRu ? 'обн.' : 'upd.'} {format(new Date(p.updated_at), 'dd.MM.yy')}
                        </span>
                      </div>
                      {!isEditing ? (
                        <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => startEdit(p)}>
                          <Wrench className="h-3 w-3" />
                          {isRu ? 'Изменить' : 'Edit'}
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={cancelEdit} disabled={saving}>
                            {isRu ? 'Отмена' : 'Cancel'}
                          </Button>
                          <Button
                            size="sm"
                            className="h-6 text-xs bg-hydra-success/20 text-hydra-success border border-hydra-success/40 hover:bg-hydra-success/30"
                            onClick={() => savePrompt(p.id)}
                            disabled={saving}
                          >
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            {isRu ? 'Сохранить' : 'Save'}
                          </Button>
                        </div>
                      )}
                    </div>
                    {p.description && !isEditing && (
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    )}
                    {isEditing ? (
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        rows={12}
                        className="w-full rounded-md border border-input bg-background/80 px-3 py-2 text-xs font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                        {p.content.slice(0, 180)}…
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────


const HYDRA_MEMORY_TAB_KEY = 'hydra-memory-active-tab';
const VALID_TABS = ['arsenal', 'session', 'role', 'knowledge', 'graphs', 'storage', 'rag', 'chronicles'];

export default function HydraMemory() {
  const { t, language } = useLanguage();
  const stats = useHydraMemoryStats();
  const { isSupervisor } = useUserRoles();

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(HYDRA_MEMORY_TAB_KEY);
      if (saved && VALID_TABS.includes(saved)) return saved;
    } catch {}
    return 'arsenal';
  });

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    try { localStorage.setItem(HYDRA_MEMORY_TAB_KEY, tab); } catch {}
  }, []);

  return (
    <Layout>
      <div className="flex flex-col gap-6 p-6 lg:p-8 w-full h-full min-h-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="rounded-xl p-2.5 bg-hydra-memory/12 border border-hydra-memory/30">
               <BrainCircuit className="h-6 w-6 text-hydra-memory" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('memory.hub.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('memory.hub.subtitle')}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={stats.refresh} className="shrink-0" title={t('memory.hub.refreshLabel')}>
            <RefreshCw className={`h-4 w-4 ${stats.loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start flex-wrap gap-1 h-auto">
            <TabsTrigger value="arsenal" className="gap-2">
              <BrainCircuit className="h-3.5 w-3.5" />
              {language === 'ru' ? 'Арсенал' : 'Arsenal'}
            </TabsTrigger>
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
            <TabsTrigger value="graphs" className="gap-2">
              <GitBranch className="h-3.5 w-3.5" />
              {language === 'ru' ? 'Графы памяти и связей' : 'Memory & Connections Graphs'}
            </TabsTrigger>
            <TabsTrigger value="storage" className="gap-2">
              <HardDrive className="h-3.5 w-3.5" />
              {t('memory.hub.storage')}
            </TabsTrigger>
            <TabsTrigger value="rag" className="gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              {t('memory.hub.ragDashboard')}
            </TabsTrigger>
            <TabsTrigger value="chronicles" className="gap-2 text-hydra-arbiter data-[state=active]:text-hydra-arbiter">
              <ScrollText className="h-3.5 w-3.5" />
              {language === 'ru' ? 'Хроники Эволюции' : 'Evolution Chronicles'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arsenal" className="mt-6">
            <CognitiveArsenalTab stats={stats} />
          </TabsContent>
          <TabsContent value="session" className="mt-6">
            <SessionMemoryTab stats={stats} loading={stats.loading} />
          </TabsContent>
          <TabsContent value="role" className="mt-6">
            <RoleMemoryTab stats={stats} loading={stats.loading} onRefresh={stats.refresh} />
          </TabsContent>
          <TabsContent value="knowledge" className="mt-6">
            <KnowledgeTab stats={stats} loading={stats.loading} />
          </TabsContent>
          <TabsContent value="graphs" className="mt-4">
            <DualGraphsTab stats={stats} />
          </TabsContent>
          <TabsContent value="storage" className="mt-6">
            <StorageTab />
          </TabsContent>
          <TabsContent value="rag" className="mt-6">
            <RagDashboardTab />
          </TabsContent>
          <TabsContent value="chronicles" className="mt-6">
            <ChroniclesTab language={language} isSupervisor={isSupervisor} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
