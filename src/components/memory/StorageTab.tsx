import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  HardDrive, FolderOpen, FileImage, FileText, File, Search,
  Loader2, Trash2, Eye, X, Download, RefreshCw, Database, Eraser,
  ChevronDown, ChevronRight, FolderClosed, ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

type SessionInfo = {
  id: string;
  title: string;
  plan_title: string | null;
};

const BUCKETS = ['message-files', 'task-files', 'avatars'] as const;

type PreviewState = { file: StorageFile; url: string; textContent?: string } | null;

const isTextFile = (mime: string | null, name: string): boolean => {
  if (!mime) return false;
  if (mime.startsWith('text/')) return true;
  if (mime === 'application/json') return true;
  const ext = name.split('.').pop()?.toLowerCase();
  return ext === 'md' || ext === 'txt' || ext === 'json' || ext === 'csv' || ext === 'yaml' || ext === 'yml' || ext === 'xml' || ext === 'log';
};

const isDocFile = (mime: string | null, name: string): boolean => {
  if (!mime) return false;
  if (mime === 'application/pdf') return true;
  if (mime.includes('msword') || mime.includes('wordprocessingml') || mime.includes('opendocument')) return true;
  const ext = name.split('.').pop()?.toLowerCase();
  return ext === 'pdf' || ext === 'doc' || ext === 'docx' || ext === 'odt';
};

const isPreviewable = (file: StorageFile): boolean => {
  return (file.mime_type?.startsWith('image/') ?? false) || isTextFile(file.mime_type, file.name) || isDocFile(file.mime_type, file.name);
};

export function StorageTab() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [cleaning, setCleaning] = useState(false);
  const [sessionInfoMap, setSessionInfoMap] = useState<Record<string, SessionInfo>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<StorageFile | null>(null);

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
        const subFiles = await listBucketRecursive(bucket, fullPath);
        result.push(...subFiles);
      }
    }
    return result;
  }, []);

  /** Extract session ID from a task-files path: {user_id}/{session_id}/... */
  const extractSessionId = useCallback((file: StorageFile): string | null => {
    if (file.bucket !== 'task-files') return null;
    const storagePath = file.id.replace(`${file.bucket}/`, '');
    const parts = storagePath.split('/');
    // parts[0] = user_id, parts[1] = session_id
    return parts.length >= 3 ? parts[1] : null;
  }, []);

  const loadSessionInfo = useCallback(async (sessionIds: string[]) => {
    if (sessionIds.length === 0) return;
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, title, title_en, plan_id')
      .in('id', sessionIds);

    if (!sessions || sessions.length === 0) return;

    // Fetch plan titles for sessions that have plan_id
    const planIds = [...new Set(sessions.filter(s => s.plan_id).map(s => s.plan_id!))];
    let planMap: Record<string, string> = {};
    if (planIds.length > 0) {
      const { data: plans } = await supabase
        .from('strategic_plans')
        .select('id, title, title_en')
        .in('id', planIds);
      if (plans) {
        planMap = Object.fromEntries(plans.map(p => [p.id, language === 'en' ? (p.title_en || p.title) : p.title]));
      }
    }

    const infoMap: Record<string, SessionInfo> = {};
    for (const s of sessions) {
      const title = language === 'en' ? (s.title_en || s.title) : s.title;
      infoMap[s.id] = {
        id: s.id,
        title,
        plan_title: s.plan_id ? (planMap[s.plan_id] || null) : null,
      };
    }
    setSessionInfoMap(infoMap);
  }, [language]);

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

      // Load session info for task-files
      const sessionIds = [...new Set(allFiles
        .filter(f => f.bucket === 'task-files')
        .map(f => {
          const path = f.id.replace(`${f.bucket}/`, '');
          const parts = path.split('/');
          return parts.length >= 3 ? parts[1] : null;
        })
        .filter(Boolean) as string[])];
      await loadSessionInfo(sessionIds);

      // Load thumbnails
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
  }, [user, listBucketRecursive, loadSessionInfo]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const getSignedUrl = async (file: StorageFile): Promise<string | null> => {
    if (thumbnails[file.id]) return thumbnails[file.id];
    const path = file.id.replace(`${file.bucket}/`, '');
    const { data, error } = await supabase.storage.from(file.bucket).createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return null;
    setThumbnails(prev => ({ ...prev, [file.id]: data.signedUrl }));
    return data.signedUrl;
  };

  const handlePreview = async (file: StorageFile) => {
    const isImage = file.mime_type?.startsWith('image/') ?? false;
    const isText = isTextFile(file.mime_type, file.name);
    const isDoc = isDocFile(file.mime_type, file.name);

    if (!isImage && !isText && !isDoc) return;

    setPreviewLoading(true);
    try {
      const url = await getSignedUrl(file);
      if (!url) {
        toast.error(t('memory.hub.imageLoadError'));
        return;
      }

      // Doc/PDF: open in new tab
      if (isDoc) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }

      // Text/MD: fetch content and show in dialog
      if (isText) {
        try {
          const resp = await fetch(url);
          const textContent = await resp.text();
          setPreview({ file, url, textContent });
        } catch {
          toast.error(t('memory.hub.imageLoadError'));
        }
        return;
      }

      // Image
      setPreview({ file, url });
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

  const cleanOrphanedFiles = useCallback(async () => {
    if (!user) return;
    setCleaning(true);
    try {
      const storageFiles = files.filter(f => f.bucket === 'task-files');
      if (storageFiles.length === 0) {
        toast.info(t('memory.storage.noOrphans'));
        return;
      }
      const { data: dbFiles } = await supabase
        .from('task_files')
        .select('file_path')
        .eq('user_id', user.id);
      const knownPaths = new Set((dbFiles || []).map((f: any) => f.file_path));
      const orphans = storageFiles.filter(f => {
        const storagePath = f.id.replace(`${f.bucket}/`, '');
        return !knownPaths.has(storagePath);
      });
      if (orphans.length === 0) {
        toast.info(t('memory.storage.noOrphans'));
        return;
      }
      const orphanPaths = orphans.map(f => f.id.replace(`${f.bucket}/`, ''));
      for (let i = 0; i < orphanPaths.length; i += 100) {
        await supabase.storage.from('task-files').remove(orphanPaths.slice(i, i + 100));
      }
      setFiles(prev => prev.filter(f => !orphans.some(o => o.id === f.id)));
      toast.success(
        t('memory.storage.orphansDeleted').replace('{count}', String(orphans.length))
      );
    } catch (e: any) {
      toast.error(e.message || 'Cleanup failed');
    } finally {
      setCleaning(false);
    }
  }, [user, files, t]);

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);

  const displayed = useMemo(() => {
    if (!searchQuery.trim()) return files;
    return files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, searchQuery]);

  /** Group files: bucket -> (for task-files: session_id -> files) */
  const groupedFiles = useMemo(() => {
    const bucketGroups: Record<string, StorageFile[]> = {};
    for (const b of BUCKETS) bucketGroups[b] = [];
    for (const f of displayed) {
      if (bucketGroups[f.bucket]) bucketGroups[f.bucket].push(f);
    }
    return bucketGroups;
  }, [displayed]);

  /** Sub-group task-files by session */
  const taskFilesBySession = useMemo(() => {
    const map: Record<string, StorageFile[]> = {};
    const unknownKey = '__unknown__';
    for (const f of (groupedFiles['task-files'] || [])) {
      const sessionId = extractSessionId(f) || unknownKey;
      if (!map[sessionId]) map[sessionId] = [];
      map[sessionId].push(f);
    }
    return map;
  }, [groupedFiles, extractSessionId]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const bucketColors: Record<string, string> = {
    'message-files': 'text-hydra-info border-hydra-info/30',
    'task-files': 'text-hydra-warning border-hydra-warning/30',
    'avatars': 'text-hydra-success border-hydra-success/30',
  };

  const bucketLabels: Record<string, string> = {
    'message-files': t('memory.storage.bucketMessageFiles'),
    'task-files': t('memory.storage.bucketTaskFiles'),
    'avatars': t('memory.storage.bucketAvatars'),
  };

  const bucketIcons: Record<string, React.ElementType> = {
    'message-files': FileText,
    'task-files': FolderOpen,
    'avatars': HardDrive,
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

      {/* Search + actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder={t('memory.hub.searchByName')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-7 text-xs" />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={cleanOrphanedFiles} disabled={cleaning || loading}>
                {cleaning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eraser className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('memory.storage.cleanOrphans')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={loadFiles}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* File list grouped by bucket */}
      <div className="border rounded-md overflow-hidden">
        <ScrollArea className="h-[calc(100vh-22rem)]">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">{t('memory.hub.storageEmpty')}</p>
            </div>
          ) : (
            <div>
              {BUCKETS.map(bucket => {
                const bucketFiles = groupedFiles[bucket] || [];
                if (bucketFiles.length === 0) return null;
                const BucketIcon = bucketIcons[bucket] || FolderClosed;
                const isCollapsed = collapsedGroups.has(bucket);
                const bucketSize = bucketFiles.reduce((s, f) => s + f.size, 0);

                return (
                  <Collapsible key={bucket} open={!isCollapsed} onOpenChange={() => toggleGroup(bucket)}>
                    <CollapsibleTrigger asChild>
                      <button className={cn(
                        'w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/40 transition-colors border-b border-border',
                        bucketColors[bucket]
                      )}>
                        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
                        <BucketIcon className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-semibold">{bucketLabels[bucket]}</span>
                        <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">{bucketFiles.length}</Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">{formatBytes(bucketSize)}</span>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {bucket === 'task-files' ? (
                        <TaskFilesGrouped
                          filesBySession={taskFilesBySession}
                          sessionInfoMap={sessionInfoMap}
                          collapsedGroups={collapsedGroups}
                          toggleGroup={toggleGroup}
                          thumbnails={thumbnails}
                          previewLoading={previewLoading}
                          preview={preview}
                          deletingId={deletingId}
                          onPreview={handlePreview}
                             onDelete={setDeleteTarget}
                          t={t}
                          bucketColors={bucketColors}
                        />
                      ) : (
                        <div className="divide-y divide-border">
                          {bucketFiles.map(file => (
                            <FileRow
                              key={file.id}
                              file={file}
                              thumbnails={thumbnails}
                              previewLoading={previewLoading}
                              preview={preview}
                              deletingId={deletingId}
                              onPreview={handlePreview}
                              onDelete={setDeleteTarget}
                              t={t}
                              bucketColors={bucketColors}
                              indent={false}
                            />
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Preview Dialog (images + text/md) */}
      <Dialog open={!!preview} onOpenChange={open => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background/95 backdrop-blur">
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-sm font-medium truncate max-w-[calc(100%-5rem)] flex items-center gap-2">
              {preview?.textContent !== undefined
                ? <FileText className="h-4 w-4 text-hydra-info shrink-0" />
                : <FileImage className="h-4 w-4 text-hydra-memory shrink-0" />
              }
              {preview?.file.name}
            </DialogTitle>
            <div className="flex items-center gap-1 shrink-0 mr-8">
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
              {preview.textContent !== undefined ? (
                <pre className="w-full text-sm font-mono whitespace-pre-wrap break-words text-foreground bg-muted/30 rounded-md p-4 max-h-[65vh] overflow-auto">
                  {preview.textContent}
                </pre>
              ) : (
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="max-w-full max-h-[65vh] object-contain rounded-md shadow-lg"
                  onError={() => { toast.error(t('memory.hub.imageLoadError')); setPreview(null); }}
                />
              )}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('memory.hub.deleteFileConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('memory.hub.deleteFileConfirmDesc').replace('{name}', deleteTarget?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  handleDelete(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Task Files Grouped by Session ──────────────────────────────────────── */

function TaskFilesGrouped({
  filesBySession,
  sessionInfoMap,
  collapsedGroups,
  toggleGroup,
  thumbnails,
  previewLoading,
  preview,
  deletingId,
  onPreview,
  onDelete,
  t,
  bucketColors,
}: {
  filesBySession: Record<string, StorageFile[]>;
  sessionInfoMap: Record<string, SessionInfo>;
  collapsedGroups: Set<string>;
  toggleGroup: (key: string) => void;
  thumbnails: Record<string, string>;
  previewLoading: boolean;
  preview: PreviewState;
  deletingId: string | null;
  onPreview: (f: StorageFile) => void;
  onDelete: (f: StorageFile) => void;
  t: (key: string) => string;
  bucketColors: Record<string, string>;
}) {
  const sessionIds = Object.keys(filesBySession).sort((a, b) => {
    // Put __unknown__ last
    if (a === '__unknown__') return 1;
    if (b === '__unknown__') return -1;
    return 0;
  });

  return (
    <div>
      {sessionIds.map(sessionId => {
        const sessionFiles = filesBySession[sessionId];
        const info = sessionInfoMap[sessionId];
        const groupKey = `task-session-${sessionId}`;
        const isCollapsed = collapsedGroups.has(groupKey);

        let label: string;
        if (sessionId === '__unknown__') {
          label = t('memory.storage.unknownTask');
        } else if (info) {
          label = info.plan_title
            ? `${info.title} · ${info.plan_title}`
            : info.title;
        } else {
          label = sessionId.slice(0, 8) + '…';
        }

        const sessionSize = sessionFiles.reduce((s, f) => s + f.size, 0);

        return (
          <Collapsible key={sessionId} open={!isCollapsed} onOpenChange={() => toggleGroup(groupKey)}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center gap-2 pl-8 pr-4 py-2 text-left hover:bg-muted/30 transition-colors border-b border-border/50">
                {isCollapsed ? <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />}
                <FolderClosed className="h-3.5 w-3.5 shrink-0 text-hydra-warning/70" />
                <span className="text-xs font-medium truncate">{label}</span>
                <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px]">{sessionFiles.length}</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">{formatBytes(sessionSize)}</span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="divide-y divide-border/50">
                {sessionFiles.map(file => (
                  <FileRow
                    key={file.id}
                    file={file}
                    thumbnails={thumbnails}
                    previewLoading={previewLoading}
                    preview={preview}
                    deletingId={deletingId}
                    onPreview={onPreview}
                    onDelete={onDelete}
                    t={t}
                    bucketColors={bucketColors}
                    indent
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

/* ─── Single File Row ────────────────────────────────────────────────────── */

function FileRow({
  file,
  thumbnails,
  previewLoading,
  preview,
  deletingId,
  onPreview,
  onDelete,
  t,
  bucketColors,
  indent,
}: {
  file: StorageFile;
  thumbnails: Record<string, string>;
  previewLoading: boolean;
  preview: PreviewState;
  deletingId: string | null;
  onPreview: (f: StorageFile) => void;
  onDelete: (f: StorageFile) => void;
  t: (key: string) => string;
  bucketColors: Record<string, string>;
  indent: boolean;
}) {
  const isImage = file.mime_type?.startsWith('image/') ?? false;
  const canPreview = isPreviewable(file);
  const Icon = fileIcon(file.mime_type);

  return (
    <div className={cn('flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors group', indent && 'pl-14')}>
      <button
        className={cn(
          'shrink-0 flex items-center justify-center rounded overflow-hidden',
          isImage
            ? 'w-10 h-10 border border-border bg-muted hover:border-hydra-memory/50 transition-colors cursor-pointer'
            : canPreview
              ? 'w-7 h-7 cursor-pointer hover:text-hydra-memory transition-colors'
              : 'w-7 h-7 cursor-default pointer-events-none'
        )}
        onClick={() => canPreview && onPreview(file)}
        disabled={previewLoading || !canPreview}
        title={canPreview ? t('memory.hub.preview') : undefined}
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
          className={cn('text-sm font-medium truncate', canPreview && 'cursor-pointer hover:text-hydra-memory transition-colors')}
          onClick={() => canPreview && onPreview(file)}
        >
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</span>
          {file.created_at && (
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(file.created_at), 'dd.MM.yy HH:mm')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {canPreview && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-hydra-memory"
                  onClick={() => onPreview(file)}
                  disabled={previewLoading}
                >
                  {previewLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                    isDocFile(file.mime_type, file.name)
                      ? <ExternalLink className="h-3.5 w-3.5" />
                      : <Eye className="h-3.5 w-3.5" />
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isDocFile(file.mime_type, file.name) ? t('memory.hub.openInTab') : t('memory.hub.preview')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(file)}
                disabled={deletingId === file.id}
              >
                {deletingId === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.delete')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
