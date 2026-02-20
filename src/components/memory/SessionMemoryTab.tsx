import React, { useState, useMemo, useCallback } from 'react';
import {
  Database, Layers, BookOpen, Trash2, RefreshCw,
  Search, Loader2, Filter, Copy, Sparkles, Text, MessageSquare,
  Archive, AlertTriangle, GitMerge,
  ThumbsUp, ThumbsDown, Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGlobalSessionMemory } from '@/hooks/useGlobalSessionMemory';
import type { SessionMemoryChunk, ChunkType, SearchResult } from '@/hooks/useSessionMemory';
import type { useHydraMemoryStats } from '@/hooks/useHydraMemoryStats';
import { TermLabel } from '@/components/ui/TermLabel';
import { StatCard, CHUNK_TYPE_CONFIG, CHUNK_TYPE_COLORS, findDuplicates } from './shared';

export function SessionMemoryTab({ stats, loading }: { stats: ReturnType<typeof useHydraMemoryStats>; loading: boolean }) {
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
        <div className="border rounded-md p-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">{t('memory.hub.chunksByType')}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.sessionMemory.by_type).map(([type, count]) => {
              const cfg = CHUNK_TYPE_CONFIG[type as ChunkType];
              const label = cfg ? t(cfg.labelKey) : type;
              return (
                <span key={type} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${CHUNK_TYPE_COLORS[type] || 'bg-muted text-muted-foreground'}`}>
                  {label} <span className="font-bold">{count}</span>
                </span>
              );
            })}
          </div>
        </div>
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
