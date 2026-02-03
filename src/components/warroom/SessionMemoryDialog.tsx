import React, { useState, useMemo } from 'react';
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
import { SessionMemoryChunk, ChunkType } from '@/hooks/useSessionMemory';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
} from 'lucide-react';

interface SessionMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chunks: SessionMemoryChunk[];
  isLoading: boolean;
  isDeleting: boolean;
  onDeleteChunk: (chunkId: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  isClearing: boolean;
}

const CHUNK_TYPE_CONFIG: Record<ChunkType, { icon: React.ElementType; color: string; labelKey: string }> = {
  message: { icon: MessageSquare, color: 'text-muted-foreground', labelKey: 'memory.messages' },
  summary: { icon: FileText, color: 'text-hydra-glow', labelKey: 'memory.summaries' },
  decision: { icon: Lightbulb, color: 'text-hydra-success', labelKey: 'memory.decisions' },
  context: { icon: BookOpen, color: 'text-hydra-expert', labelKey: 'memory.context' },
  instruction: { icon: ListChecks, color: 'text-hydra-critical', labelKey: 'memory.instructions' },
};

export function SessionMemoryDialog({
  open,
  onOpenChange,
  chunks,
  isLoading,
  isDeleting,
  onDeleteChunk,
  onClearAll,
  isClearing,
}: SessionMemoryDialogProps) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<ChunkType | 'all'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filteredChunks = useMemo(() => {
    if (activeFilter === 'all') return chunks;
    return chunks.filter((chunk) => chunk.chunk_type === activeFilter);
  }, [chunks, activeFilter]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-hydra-memory" />
            {t('memory.dialogTitle')}
          </DialogTitle>
          <DialogDescription>{t('memory.dialogDescription')}</DialogDescription>
        </DialogHeader>

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
        <ScrollArea className="flex-1 min-h-[200px] max-h-[400px] border rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Archive className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">{t('memory.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredChunks.map((chunk) => {
                const config = CHUNK_TYPE_CONFIG[chunk.chunk_type as ChunkType] || CHUNK_TYPE_CONFIG.message;
                const Icon = config.icon;
                return (
                  <div
                    key={chunk.id}
                    className="p-3 hover:bg-muted/50 transition-colors group"
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
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(chunk.created_at), 'dd.MM.yy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-3 text-foreground/90">
                          {chunk.content}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(chunk.id)}
                            disabled={isDeleting || deletingId === chunk.id}
                          >
                            {deletingId === chunk.id ? (
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

        {/* Footer with Clear All */}
        {chunks.length > 0 && (
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              {t('memory.totalChunks')}: {chunks.length}
            </span>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
