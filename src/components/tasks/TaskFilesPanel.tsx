import React, { useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaskFiles } from '@/hooks/useTaskFiles';
import { Button } from '@/components/ui/button';
import { Paperclip, Upload, Trash2, FileText, Image, File, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface TaskFilesPanelProps {
  sessionId: string | null;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <File className="h-4 w-4" />;
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-400" />;
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-400" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

export function TaskFilesPanel({ sessionId, className }: TaskFilesPanelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files, loading, uploading, uploadFile, deleteFile, getSignedUrl } = useTaskFiles(sessionId);

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
      const url = await getSignedUrl(filePath);
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
          {isRu ? 'Файлы задачи' : 'Task Files'}
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
          {isRu ? 'Загрузить' : 'Upload'}
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
            {isRu ? 'Нет прикреплённых файлов' : 'No attached files'}
          </p>
        </div>
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="space-y-1">
            {files.map(file => (
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
                  <TooltipContent className="text-xs">{isRu ? 'Скачать' : 'Download'}</TooltipContent>
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
                  <TooltipContent className="text-xs">{isRu ? 'Удалить' : 'Delete'}</TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        </TooltipProvider>
      )}
    </section>
  );
}
