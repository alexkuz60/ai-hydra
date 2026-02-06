import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { SessionMemoryChunk, ChunkType, SearchResult } from '@/hooks/useSessionMemory';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive,
  Trash2,
  Filter,
  Lightbulb,
  FileText,
  MessageSquare,
  ListChecks,
  BookOpen,
  Loader2,
  AlertTriangle,
  Search,
  Copy,
  Sparkles,
  Text,
} from 'lucide-react';

interface SessionMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chunks: SessionMemoryChunk[];
  isLoading: boolean;
  isDeleting: boolean;
  onDeleteChunk: (chunkId: string) => Promise<void>;
  onDeleteDuplicates?: (chunkIds: string[]) => Promise<void>;
  isDeletingDuplicates?: boolean;
  onClearAll: () => Promise<void>;
  isClearing: boolean;
  // Optional: for semantic search
  onSemanticSearch?: (query: string) => Promise<SearchResult[]>;
  isSearching?: boolean;
}

const CHUNK_TYPE_CONFIG: Record<ChunkType, { icon: React.ElementType; color: string; labelKey: string }> = {
  message: { icon: MessageSquare, color: 'text-muted-foreground', labelKey: 'memory.messages' },
  summary: { icon: FileText, color: 'text-hydra-glow', labelKey: 'memory.summaries' },
  decision: { icon: Lightbulb, color: 'text-hydra-success', labelKey: 'memory.decisions' },
  context: { icon: BookOpen, color: 'text-hydra-expert', labelKey: 'memory.context' },
  instruction: { icon: ListChecks, color: 'text-hydra-critical', labelKey: 'memory.instructions' },
};

// Find duplicate chunks based on content similarity
function findDuplicates(chunks: SessionMemoryChunk[]): Map<string, string[]> {
  const duplicateMap = new Map<string, string[]>();
  const contentToIds = new Map<string, string[]>();

  chunks.forEach((chunk) => {
    // Normalize content for comparison (lowercase, trim, remove extra whitespace)
    const normalizedContent = chunk.content.toLowerCase().trim().replace(/\s+/g, ' ');
    const ids = contentToIds.get(normalizedContent) || [];
    ids.push(chunk.id);
    contentToIds.set(normalizedContent, ids);
  });

  // Only keep entries with duplicates (more than 1 id)
  contentToIds.forEach((ids, content) => {
    if (ids.length > 1) {
      ids.forEach((id) => {
        duplicateMap.set(id, ids.filter((otherId) => otherId !== id));
      });
    }
  });

  return duplicateMap;
}

export function SessionMemoryDialog({
  open,
  onOpenChange,
  chunks,
  isLoading,
  isDeleting,
  onDeleteChunk,
  onDeleteDuplicates,
  isDeletingDuplicates = false,
  onClearAll,
  isClearing,
  onSemanticSearch,
  isSearching: externalIsSearching = false,
}: SessionMemoryDialogProps) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<ChunkType | 'all' | 'duplicates'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteDuplicates, setConfirmDeleteDuplicates] = useState(false);
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [semanticResults, setSemanticResults] = useState<SearchResult[]>([]);
  const [isSearchingInternal, setIsSearchingInternal] = useState(false);
  
  const isSearchingActive = externalIsSearching || isSearchingInternal;
  
  // Debounced semantic search
  const handleSearchChange = useCallback(async (value: string) => {
    setSearchQuery(value);
    
    if (useSemanticSearch && onSemanticSearch && value.trim().length >= 3) {
      setIsSearchingInternal(true);
      try {
        const results = await onSemanticSearch(value.trim());
        setSemanticResults(results);
      } catch (error) {
        console.error('Semantic search failed:', error);
        setSemanticResults([]);
      } finally {
        setIsSearchingInternal(false);
      }
    } else if (!value.trim()) {
      setSemanticResults([]);
    }
  }, [useSemanticSearch, onSemanticSearch]);
  
  // Toggle search mode
  const toggleSearchMode = useCallback(() => {
    setUseSemanticSearch(prev => !prev);
    setSemanticResults([]);
    setSearchQuery('');
  }, []);

  // Find duplicates
  const duplicateMap = useMemo(() => findDuplicates(chunks), [chunks]);
  const duplicateIds = useMemo(() => new Set(duplicateMap.keys()), [duplicateMap]);
  const duplicateCount = useMemo(() => {
    // Count unique duplicate groups (not individual duplicates)
    const seen = new Set<string>();
    let count = 0;
    duplicateMap.forEach((others, id) => {
      const groupKey = [id, ...others].sort().join(',');
      if (!seen.has(groupKey)) {
        seen.add(groupKey);
        count++;
      }
    });
    return count;
  }, [duplicateMap]);

  // Get IDs to delete (keep oldest in each group, delete rest)
  const duplicateIdsToDelete = useMemo(() => {
    const toDelete: string[] = [];
    const seen = new Set<string>();
    
    // Get all duplicate groups
    duplicateMap.forEach((others, id) => {
      const groupKey = [id, ...others].sort().join(',');
      if (!seen.has(groupKey)) {
        seen.add(groupKey);
        // Find all chunks in this group and sort by created_at
        const groupIds = [id, ...others];
        const groupChunks = chunks
          .filter(c => groupIds.includes(c.id))
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        // Keep the oldest, delete the rest
        if (groupChunks.length > 1) {
          groupChunks.slice(1).forEach(c => toDelete.push(c.id));
        }
      }
    });
    
    return toDelete;
  }, [duplicateMap, chunks]);

  // Determine which items to display
  const displayItems = useMemo(() => {
    // If semantic search is active and we have results, show them
    if (useSemanticSearch && semanticResults.length > 0) {
      return semanticResults.map(result => ({
        ...result,
        isSemanticResult: true,
      }));
    }
    
    // Otherwise filter chunks normally
    let result = chunks;

    // Apply type/duplicates filter
    if (activeFilter === 'duplicates') {
      result = result.filter((chunk) => duplicateIds.has(chunk.id));
    } else if (activeFilter !== 'all') {
      result = result.filter((chunk) => chunk.chunk_type === activeFilter);
    }

    // Apply text search filter (only in text mode)
    if (!useSemanticSearch && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((chunk) => chunk.content.toLowerCase().includes(query));
    }

    return result.map(chunk => ({
      ...chunk,
      isSemanticResult: false,
      similarity: undefined,
    }));
  }, [chunks, activeFilter, searchQuery, duplicateIds, useSemanticSearch, semanticResults]);

  const chunkCounts = useMemo(() => {
    const counts: Record<string, number> = { all: chunks.length };
    chunks.forEach((chunk) => {
      counts[chunk.chunk_type] = (counts[chunk.chunk_type] || 0) + 1;
    });
    return counts;
  }, [chunks]);

  const handleDelete = async (chunkId: string) => {
    setDeletingId(chunkId);
    try {
      await onDeleteChunk(chunkId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirmClearAll) {
      setConfirmClearAll(true);
      return;
    }
    await onClearAll();
    setConfirmClearAll(false);
  };

  const handleDeleteDuplicates = async () => {
    if (!onDeleteDuplicates || duplicateIdsToDelete.length === 0) return;
    
    if (!confirmDeleteDuplicates) {
      setConfirmDeleteDuplicates(true);
      return;
    }
    
    await onDeleteDuplicates(duplicateIdsToDelete);
    setConfirmDeleteDuplicates(false);
    setActiveFilter('all'); // Reset filter after deletion
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col min-h-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-hydra-memory" />
            {t('memory.dialogTitle')}
          </DialogTitle>
          <DialogDescription>{t('memory.dialogDescription')}</DialogDescription>
        </DialogHeader>

        {/* Search input with mode toggle */}
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className={cn(
                "pl-9 h-9 pr-10",
                useSemanticSearch && "border-hydra-cyan/50 focus-visible:ring-hydra-cyan/30"
              )}
            />
          </div>
          
          {/* Semantic search toggle */}
          {onSemanticSearch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={useSemanticSearch ? 'secondary' : 'ghost'}
                  size="icon"
                  className={cn(
                    "h-9 w-9 shrink-0",
                    useSemanticSearch && "bg-hydra-cyan/20 text-hydra-cyan hover:bg-hydra-cyan/30"
                  )}
                  onClick={toggleSearchMode}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={useSemanticSearch ? 'semantic' : 'text'}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {useSemanticSearch ? (
                        <Sparkles className="h-4 w-4" />
                      ) : (
                        <Text className="h-4 w-4" />
                      )}
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  {useSemanticSearch ? t('memory.switchToTextSearch') : t('memory.switchToSemanticSearch')}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {/* Semantic search hint */}
        {useSemanticSearch && (
          <div className="flex items-center gap-2 text-xs text-hydra-cyan/80">
            <Sparkles className="h-3 w-3" />
            <span>{t('memory.semanticSearchHint')}</span>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={activeFilter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="h-7"
          >
            {t('common.all')}
            <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">
              {chunkCounts.all}
            </Badge>
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
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px] text-hydra-critical border-hydra-critical/50">
                  {duplicateCount}
                </Badge>
              </Button>
              
              {/* Delete duplicates button - show when duplicates filter is active */}
              {activeFilter === 'duplicates' && onDeleteDuplicates && duplicateIdsToDelete.length > 0 && (
                <Button
                  variant={confirmDeleteDuplicates ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={handleDeleteDuplicates}
                  disabled={isDeletingDuplicates}
                  className={cn(
                    'h-7 ml-auto',
                    confirmDeleteDuplicates && 'animate-pulse'
                  )}
                >
                  {isDeletingDuplicates ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : confirmDeleteDuplicates ? (
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                  )}
                  {confirmDeleteDuplicates 
                    ? t('memory.confirmDeleteDuplicates')
                    : `${t('memory.deleteDuplicates')} (${duplicateIdsToDelete.length})`
                  }
                </Button>
              )}
            </>
          )}
          {(Object.keys(CHUNK_TYPE_CONFIG) as ChunkType[]).map((type) => {
            const config = CHUNK_TYPE_CONFIG[type];
            const count = chunkCounts[type] || 0;
            if (count === 0) return null;
            return (
              <Button
                key={type}
                variant={activeFilter === type ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter(type)}
                className={cn('h-7', activeFilter === type && config.color)}
              >
                <config.icon className="h-3.5 w-3.5 mr-1" />
                {t(config.labelKey)}
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Chunks list */}
        <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
          <ScrollArea className="h-full">
            {isLoading || isSearchingActive ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                {isSearchingActive && useSemanticSearch && (
                  <span className="ml-2 text-sm text-muted-foreground">{t('memory.searching')}</span>
                )}
              </div>
            ) : displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Archive className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">{searchQuery ? t('memory.noSearchResults') : t('memory.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-border pr-3">
              {displayItems.map((item) => {
                const config = CHUNK_TYPE_CONFIG[item.chunk_type as ChunkType] || CHUNK_TYPE_CONFIG.message;
                const Icon = config.icon;
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
                      <div className={cn('mt-0.5', config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={cn('text-[10px] h-5', config.color)}>
                            {t(config.labelKey)}
                          </Badge>
                          {/* Similarity score for semantic results */}
                          {similarity !== undefined && (
                            <Badge 
                              variant="outline" 
                              className="text-[10px] h-5 text-hydra-cyan border-hydra-cyan/50"
                            >
                              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                              {Math.round(similarity * 100)}%
                            </Badge>
                          )}
                          {isDuplicate && (
                            <Tooltip>
                               <TooltipTrigger asChild>
                                 <span>
                                   <Badge variant="outline" className="text-[10px] h-5 text-amber-500 border-amber-500/50">
                                     <Copy className="h-2.5 w-2.5 mr-0.5" />
                                     {t('memory.duplicate')}
                                   </Badge>
                                 </span>
                               </TooltipTrigger>
                              <TooltipContent>{t('memory.duplicateTooltip')}</TooltipContent>
                            </Tooltip>
                          )}
                          {'created_at' in item && (
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(item.created_at), 'dd.MM.yy HH:mm')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm line-clamp-3 text-foreground/90">
                          {item.content}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(item.id)}
                            disabled={isDeleting || deletingId === item.id}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
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

        {/* Footer with Clear All */}
         {chunks.length > 0 && (
           <div className="flex justify-between items-center pt-2 border-t">
             <span className="text-xs text-muted-foreground">
               {t('memory.totalChunks')}: {chunks.length}
               {duplicateCount > 0 && (
                 <span className="ml-2 text-amber-500">
                   ({duplicateCount} {t('memory.duplicateGroups')})
                 </span>
               )}
             </span>
             <div className="flex gap-2">
               {confirmClearAll && (
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setConfirmClearAll(false)}
                   disabled={isClearing}
                 >
                   {t('common.cancel')}
                 </Button>
               )}
               <Button
                 variant={confirmClearAll ? 'destructive' : 'outline'}
                 size="sm"
                 onClick={handleClearAll}
                 disabled={isClearing}
                 className={cn(
                   'transition-all',
                   confirmClearAll && 'animate-pulse'
                 )}
               >
                 {isClearing ? (
                   <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                 ) : confirmClearAll ? (
                   <AlertTriangle className="h-4 w-4 mr-1" />
                 ) : (
                   <Trash2 className="h-4 w-4 mr-1" />
                 )}
                 {confirmClearAll ? t('memory.confirmClearAll') : t('memory.clearAll')}
               </Button>
             </div>
           </div>
         )}
      </DialogContent>
    </Dialog>
  );
}