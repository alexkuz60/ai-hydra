import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  HardDrive, FolderOpen, FileImage, FileText, File, Search,
  Loader2, Trash2, Eye, X, Download, RefreshCw, Database,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { StatCard, formatBytes, fileIcon } from './shared';

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

export function StorageTab() {
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

  /** Recursively list files in a storage bucket under a prefix */
  const listBucketRecursive = useCallback(async (bucket: string, prefix: string): Promise<StorageFile[]> => {
    const result: StorageFile[] = [];
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 500,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error || !data) return result;
    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) {
        // It's a file
        result.push({
          id: `${bucket}/${fullPath}`,
          name: item.name,
          bucket,
          size: item.metadata?.size ?? 0,
          mime_type: item.metadata?.mimetype ?? null,
          created_at: item.created_at ?? '',
          updated_at: item.updated_at ?? '',
        });
      } else {
        // It's a folder — recurse
        const subFiles = await listBucketRecursive(bucket, fullPath);
        result.push(...subFiles);
      }
    }
    return result;
  }, []);

  const loadFiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allFiles: StorageFile[] = [];
      for (const bucket of BUCKETS) {
        try {
          const bucketFiles = await listBucketRecursive(bucket, user.id);
          allFiles.push(...bucketFiles);
        } catch { /* skip bucket on error */ }
      }
      setFiles(allFiles);
      const thumbMap: Record<string, string> = {};
      const imageFiles = allFiles.filter(f => f.mime_type?.startsWith('image/'));
      await Promise.all(
        imageFiles.map(async f => {
          try {
            const storagePath = f.id.replace(`${f.bucket}/`, '');
            const { data } = await supabase.storage.from(f.bucket).createSignedUrl(storagePath, 3600);
            if (data?.signedUrl) thumbMap[f.id] = data.signedUrl;
          } catch { /* skip */ }
        })
      );
      setThumbnails(thumbMap);
    } finally {
      setLoading(false);
    }
  }, [user, listBucketRecursive]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handlePreview = async (file: StorageFile) => {
    if (!file.mime_type?.startsWith('image/')) return;
    if (thumbnails[file.id]) {
      setPreview({ file, url: thumbnails[file.id] });
      return;
    }
    setPreviewLoading(true);
    try {
      const path = file.id.replace(`${file.bucket}/`, '');
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
      const path = file.id.replace(`${file.bucket}/`, '');
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
                        <img src={thumbnails[file.id]} alt={file.name} className="w-full h-full object-cover" />
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
