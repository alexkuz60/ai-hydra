import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileText, Image, File, Save, Download, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { wt } from '@/components/warroom/i18n';
import type { TaskFile } from '@/hooks/useTaskFiles';
import type { FileDigest } from '@/hooks/useFileDigests';

function isImageMime(mimeType: string | null): boolean {
  return !!mimeType && mimeType.startsWith('image/');
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <File className="h-4 w-4" />;
  if (isImageMime(mimeType)) return <Image className="h-4 w-4 text-blue-400" />;
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-400" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function truncateName(name: string, max = 18): string {
  if (name.length <= max) return name;
  const ext = name.lastIndexOf('.');
  if (ext > 0 && name.length - ext <= 6) {
    return name.slice(0, max - (name.length - ext) - 1) + '…' + name.slice(ext);
  }
  return name.slice(0, max - 1) + '…';
}

interface FileViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: TaskFile[];
  digests: FileDigest[];
  signedUrls: Record<string, string>;
  initialFileId?: string;
  onSaveComment: (fileId: string, comment: string) => Promise<void>;
  onDownload: (filePath: string, fileName: string) => void;
  getSignedUrl: (filePath: string) => Promise<string>;
}

export function FileViewerDialog({
  open, onOpenChange, files, digests, signedUrls,
  initialFileId, onSaveComment, onDownload, getSignedUrl,
}: FileViewerDialogProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialFileId || files[0]?.id || '');
  const [comments, setComments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>(signedUrls);

  // Sync initial tab when dialog opens
  useEffect(() => {
    if (open) {
      setActiveTab(initialFileId || files[0]?.id || '');
      // Init comments from files
      const c: Record<string, string> = {};
      files.forEach(f => { c[f.id] = f.comment || ''; });
      setComments(c);
      setUrls(signedUrls);
    }
  }, [open, initialFileId, files, signedUrls]);

  // Fetch URLs for files without them
  useEffect(() => {
    if (!open) return;
    files.forEach(f => {
      if (!urls[f.file_path]) {
        getSignedUrl(f.file_path).then(url => {
          setUrls(prev => ({ ...prev, [f.file_path]: url }));
        }).catch(() => {});
      }
    });
  }, [open, files, getSignedUrl]);

  const handleSaveComment = useCallback(async (fileId: string) => {
    setSaving(fileId);
    await onSaveComment(fileId, comments[fileId] || '');
    setSaving(null);
  }, [comments, onSaveComment]);

  const digestMap = React.useMemo(() => {
    const map: Record<string, FileDigest> = {};
    digests.forEach(d => { map[d.task_file_id] = d; });
    return map;
  }, [digests]);

  if (files.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-base">
            {wt('taskFiles.viewAll', language)}
            <span className="text-muted-foreground text-sm ml-2">({files.length})</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 border-b">
            <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0 pb-2">
              {files.map(file => (
                <TabsTrigger
                  key={file.id}
                  value={file.id}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 data-[state=active]:bg-muted"
                >
                  {getFileIcon(file.mime_type)}
                  {truncateName(file.file_name)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {files.map(file => {
            const url = urls[file.file_path];
            const digest = digestMap[file.id];
            const isImage = isImageMime(file.mime_type);

            return (
              <TabsContent
                key={file.id}
                value={file.id}
                className="flex-1 overflow-auto px-4 pb-4 mt-0"
              >
                <div className="space-y-4 pt-3">
                  {/* Preview section */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {wt('taskFiles.preview', language)}
                    </h4>
                    {isImage && url ? (
                      <div className="rounded-lg border border-border/50 overflow-hidden bg-muted/10 flex items-center justify-center max-h-[300px]">
                        <img src={url} alt={file.file_name} className="max-h-[300px] object-contain" />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/50 bg-muted/10 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.mime_type)}
                          <div>
                            <p className="text-sm font-medium">{file.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => onDownload(file.file_path, file.file_name)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          {wt('taskFiles.download', language)}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* AI Digest */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      {wt('taskFiles.digest', language)}
                    </h4>
                    {digest ? (
                      <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-auto">
                        {digest.digest}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/50 italic">
                        {wt('taskFiles.noDigest', language)}
                      </p>
                    )}
                  </div>

                  {/* User comment */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      💬 {language === 'ru' ? 'Комментарий' : 'Comment'}
                    </h4>
                    <Textarea
                      value={comments[file.id] || ''}
                      onChange={e => setComments(prev => ({ ...prev, [file.id]: e.target.value }))}
                      placeholder={wt('taskFiles.commentPlaceholder', language)}
                      className="min-h-[60px] text-sm resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-7 text-xs"
                        onClick={() => handleSaveComment(file.id)}
                        disabled={saving === file.id || (comments[file.id] || '') === (file.comment || '')}
                      >
                        {saving === file.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        {wt('taskFiles.save', language)}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
