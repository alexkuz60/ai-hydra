import React, { useRef, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskFiles } from '@/hooks/useTaskFiles';
import { useFileDigests } from '@/hooks/useFileDigests';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Upload, Trash2, FileText, Image, File as FileIcon, Loader2, Eye, Globe, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { wt } from '@/components/warroom/i18n';
import { FileViewerDialog } from './FileViewerDialog';
import { toast } from 'sonner';
import { sanitizeFileName } from '@/lib/fileUtils';

interface TaskFilesPanelProps {
  sessionId: string | null;
  className?: string;
}

function isImageMime(mimeType: string | null): boolean {
  return !!mimeType && mimeType.startsWith('image/');
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <FileIcon className="h-4 w-4" />;
  if (isImageMime(mimeType)) return <Image className="h-4 w-4 text-blue-400" />;
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-400" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskFilesPanel({ sessionId, className }: TaskFilesPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files, loading, uploading, uploadFile, deleteFile, updateFileComment, getSignedUrl } = useTaskFiles(sessionId);
  const { digests } = useFileDigests(sessionId);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerInitialFileId, setViewerInitialFileId] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; path: string; name: string } | null>(null);

  // URL scraping state
  const [showScrapeInput, setShowScrapeInput] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  // Fetch signed URLs for image files
  const getOrFetchUrl = useCallback(async (filePath: string): Promise<string> => {
    if (signedUrls[filePath]) return signedUrls[filePath];
    const url = await getSignedUrl(filePath);
    setSignedUrls(prev => ({ ...prev, [filePath]: url }));
    return url;
  }, [signedUrls, getSignedUrl]);

  // Pre-fetch signed URLs for images
  React.useEffect(() => {
    files.forEach(f => {
      if (isImageMime(f.mime_type) && !signedUrls[f.file_path]) {
        getOrFetchUrl(f.file_path);
      }
    });
  }, [files]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    for (let i = 0; i < selectedFiles.length; i++) {
      await uploadFile(selectedFiles[i]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await getOrFetchUrl(filePath);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    } catch {}
  };

  const handleOpenViewer = (fileId?: string) => {
    setViewerInitialFileId(fileId);
    setViewerOpen(true);
  };

  const handleSaveComment = async (fileId: string, comment: string) => {
    await updateFileComment(fileId, comment);
    toast.success(wt('taskFiles.commentSaved', language));
  };

  // URL scraping: fetch content via firecrawl, save as .md file
  const handleScrapeUrl = useCallback(async () => {
    if (!scrapeUrl.trim() || !sessionId || !user) return;
    setIsScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url: scrapeUrl.trim(), options: { formats: ['markdown'], onlyMainContent: true } },
      });
      if (error) throw error;
      const markdown = data?.data?.markdown || data?.markdown;
      const title = data?.data?.metadata?.title || data?.metadata?.title || scrapeUrl.trim();
      if (!markdown) {
        toast.error(wt('taskFiles.scrapeEmpty', language));
        return;
      }

      // Save as .md file in task-files storage
      const safeName = sanitizeFileName(title.slice(0, 80) + '.md');
      const blob = new Blob([`<!-- Source: ${scrapeUrl.trim()} -->\n<!-- Scraped: ${new Date().toISOString()} -->\n\n${markdown}`], { type: 'text/markdown' });
      const file = new File([blob], safeName, { type: 'text/markdown' });
      await uploadFile(file);

      toast.success(wt('taskFiles.scrapeSuccess', language));
      setScrapeUrl('');
      setShowScrapeInput(false);
    } catch (err) {
      console.error('[TaskFilesPanel] Scrape error:', err);
      toast.error(wt('taskFiles.scrapeFailed', language));
    } finally {
      setIsScraping(false);
    }
  }, [scrapeUrl, sessionId, user, uploadFile, language]);

  if (!sessionId) return null;

  return (
    <TooltipProvider delayDuration={200}>
    <section className={cn("space-y-4 min-h-[120px]", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-muted-foreground flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="hover:text-primary transition-colors"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setShowScrapeInput(prev => !prev)}
                disabled={isScraping}
                className="hover:text-primary transition-colors"
              >
                {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{wt('taskFiles.scrapeUrl', language)}</TooltipContent>
          </Tooltip>
          {wt('taskFiles.title', language)}
          {files.length > 0 && (
            <span className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">
              {files.length}
            </span>
          )}
        </h3>
        {files.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-sm gap-1.5"
            onClick={() => handleOpenViewer()}
          >
            <Eye className="h-4 w-4" />
            {wt('taskFiles.viewAll', language)}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleFileSelect}
        />
      </div>

      {/* URL scrape input */}
      {showScrapeInput && (
        <div className="flex items-center gap-2">
          <Input
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            placeholder={wt('taskFiles.scrapeUrlPlaceholder', language)}
            className="flex-1 h-9 text-sm"
            onKeyDown={(e) => { if (e.key === 'Enter') handleScrapeUrl(); }}
            disabled={isScraping}
            autoFocus
          />
          <Button
            size="sm"
            className="h-9 gap-1.5"
            onClick={handleScrapeUrl}
            disabled={!scrapeUrl.trim() || isScraping}
          >
            {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            {isScraping ? wt('taskFiles.scraping', language) : wt('taskFiles.scrapeUrl', language)}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => { setShowScrapeInput(false); setScrapeUrl(''); }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="p-3 rounded-md border border-dashed border-border/40 bg-muted/10 text-center">
          <p className="text-sm text-muted-foreground/60">
            {wt('taskFiles.noFiles', language)}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 max-h-[320px] overflow-y-auto pr-1 py-2">
            {files.map(file => {
              const isImage = isImageMime(file.mime_type);
              const url = signedUrls[file.file_path];

              return (
                <div key={file.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleOpenViewer(file.id)}
                    className={cn(
                      "rounded-md overflow-hidden border border-border/50",
                      "hover:border-primary/50 transition-colors cursor-pointer",
                      isImage ? "w-20 h-20" : "w-auto h-auto px-3 py-2 flex items-center gap-2 bg-muted/20"
                    )}
                  >
                    {isImage && url ? (
                      <img src={url} alt={file.file_name} className="w-full h-full object-cover" />
                    ) : isImage ? (
                      <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        {getFileIcon(file.mime_type)}
                        <span className="text-sm font-medium truncate max-w-[120px]">{file.file_name}</span>
                        <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
                      </>
                    )}
                    {file.comment && (
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                        💬 {file.comment}
                      </span>
                    )}
                  </button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: file.id, path: file.file_path, name: file.file_name }); }}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-sm">{wt('taskFiles.delete', language)}</TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </>
      )}

      <FileViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        files={files}
        digests={digests}
        signedUrls={signedUrls}
        initialFileId={viewerInitialFileId}
        onSaveComment={handleSaveComment}
        onDownload={handleDownload}
        getSignedUrl={getSignedUrl}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{wt('taskFiles.deleteConfirmTitle', language)}</AlertDialogTitle>
            <AlertDialogDescription>
              {wt('taskFiles.deleteConfirmDesc', language).replace('{name}', deleteTarget?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{wt('taskFiles.cancel', language)}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteFile(deleteTarget.id, deleteTarget.path);
                  setDeleteTarget(null);
                }
              }}
            >
              {wt('taskFiles.delete', language)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
    </TooltipProvider>
  );
}
