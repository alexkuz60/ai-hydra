import React, { useRef, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaskFiles } from '@/hooks/useTaskFiles';
import { Button } from '@/components/ui/button';
import { Paperclip, Upload, Trash2, FileText, Image, File, Loader2, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { wt } from '@/components/warroom/i18n';

interface TaskFilesPanelProps {
  sessionId: string | null;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mimeType: string | null): boolean {
  return !!mimeType && mimeType.startsWith('image/');
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <File className="h-4 w-4" />;
  if (isImageMime(mimeType)) return <Image className="h-4 w-4 text-blue-400" />;
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-400" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

/** Image thumbnail with fullscreen dialog on click */
function ImageFileThumbnail({ url, name }: { url: string; name: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative group rounded-md overflow-hidden border border-border/50",
            "w-16 h-16 cursor-pointer hover:border-primary/50 transition-colors shrink-0"
          )}
        >
          <img src={url} alt={name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-2">
        <img src={url} alt={name} className="w-full h-full object-contain rounded" />
      </DialogContent>
    </Dialog>
  );
}

export function TaskFilesPanel({ sessionId, className }: TaskFilesPanelProps) {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files, loading, uploading, uploadFile, deleteFile, getSignedUrl } = useTaskFiles(sessionId);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Fetch signed URLs for image files
  const getOrFetchUrl = useCallback(async (filePath: string): Promise<string> => {
    if (signedUrls[filePath]) return signedUrls[filePath];
    const url = await getSignedUrl(filePath);
    setSignedUrls(prev => ({ ...prev, [filePath]: url }));
    return url;
  }, [signedUrls, getSignedUrl]);

  // Pre-fetch signed URLs for images on mount / file change
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

  if (!sessionId) return null;

  return (
    <section className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" />
          {wt('taskFiles.title', language)}
          {files.length > 0 && (
            <span className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">
              {files.length}
            </span>
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {wt('taskFiles.upload', language)}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleFileSelect}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="p-3 rounded-md border border-dashed border-border/40 bg-muted/10 text-center">
          <p className="text-[11px] text-muted-foreground/60">
            {wt('taskFiles.noFiles', language)}
          </p>
        </div>
      ) : (
        <TooltipProvider delayDuration={200}>
          {/* Image previews row */}
          {files.some(f => isImageMime(f.mime_type)) && (
            <div className="flex flex-wrap gap-2 mb-2">
              {files.filter(f => isImageMime(f.mime_type)).map(file => (
                <div key={file.id} className="relative group">
                  {signedUrls[file.file_path] ? (
                    <ImageFileThumbnail url={signedUrls[file.file_path]} name={file.file_name} />
                  ) : (
                    <div className="w-16 h-16 rounded-md border border-border/50 bg-muted/30 flex items-center justify-center">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => deleteFile(file.id, file.file_path)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">{wt('taskFiles.delete', language)}</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}

          {/* Non-image file list */}
          <div className="space-y-1">
            {files.filter(f => !isImageMime(f.mime_type)).map(file => (
              <div
                key={file.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/20 border border-border/20 group"
              >
                {getFileIcon(file.mime_type)}
                <span className="text-xs font-medium truncate flex-1">{file.file_name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatFileSize(file.file_size)}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDownload(file.file_path, file.file_name)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">{wt('taskFiles.download', language)}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => deleteFile(file.id, file.file_path)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">{wt('taskFiles.delete', language)}</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        </TooltipProvider>
      )}
    </section>
  );
}
