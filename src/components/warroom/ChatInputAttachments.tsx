import React, { useCallback } from 'react';
import { MermaidPreview } from '@/components/warroom/MermaidPreview';
import { MermaidBlock } from '@/components/warroom/MermaidBlock';
import { Loader2, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AttachedFile } from '@/components/warroom/FileUpload';
import type { UploadProgress } from './ChatInputArea';

interface ChatInputAttachmentsProps {
  attachedFiles: AttachedFile[];
  uploadProgress: UploadProgress | null;
  onRemoveAttachment: (id: string, preview?: string) => void;
}

export function ChatInputAttachments({ attachedFiles, uploadProgress, onRemoveAttachment }: ChatInputAttachmentsProps) {
  const { t } = useLanguage();

  if (uploadProgress) {
    return (
      <div className="mb-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-foreground">{t('files.uploading')}</span>
              <span className="text-muted-foreground">{uploadProgress.current}/{uploadProgress.total}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (attachedFiles.length === 0) return null;

  const RemoveButton = ({ id, preview }: { id: string; preview?: string }) => (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onRemoveAttachment(id, preview); }}
      className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
    >
      <span className="sr-only">Remove</span>
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
    </button>
  );

  return (
    <div className="mb-3 flex flex-wrap gap-2 p-2 rounded-lg border border-dashed border-border/50 bg-muted/30">
      {attachedFiles.map(attached => {
        if (attached.mermaidContent) {
          return (
            <Dialog key={attached.id}>
              <div className="relative group">
                <DialogTrigger asChild>
                  <button type="button" className={cn("rounded-md overflow-hidden border border-hydra-cyan/30 bg-background/80 w-24 cursor-pointer hover:border-hydra-cyan/60 transition-colors")}>
                    <div className="p-1"><MermaidPreview content={attached.mermaidContent} maxHeight={64} /></div>
                    <div className="flex items-center gap-1 px-1.5 pb-1">
                      <GitBranch className="h-3 w-3 text-hydra-cyan shrink-0" />
                      <span className="text-[10px] text-muted-foreground truncate">{attached.mermaidName}</span>
                    </div>
                  </button>
                </DialogTrigger>
                <RemoveButton id={attached.id} />
              </div>
              <DialogContent className="max-w-4xl max-h-[85vh] p-4 overflow-auto"><MermaidBlock content={attached.mermaidContent} /></DialogContent>
            </Dialog>
          );
        }

        const isImage = attached.file?.type.startsWith('image/');
        if (isImage && attached.preview) {
          return (
            <Dialog key={attached.id}>
              <div className="relative group">
                <DialogTrigger asChild>
                  <button type="button" className={cn("rounded-md overflow-hidden border border-border/50 bg-background/80 w-16 h-16 cursor-pointer hover:border-primary/50 transition-colors")}>
                    <img src={attached.preview} alt={attached.file?.name} className="w-full h-full object-cover" />
                  </button>
                </DialogTrigger>
                <RemoveButton id={attached.id} preview={attached.preview} />
              </div>
              <DialogContent className="max-w-4xl max-h-[85vh] p-2">
                <img src={attached.preview} alt={attached.file?.name} className="w-full h-full object-contain rounded" />
              </DialogContent>
            </Dialog>
          );
        }

        return (
          <div key={attached.id} className={cn("relative group rounded-md overflow-hidden border border-border/50 bg-background/80 flex items-center px-2 py-1 gap-1")}>
            <span className="text-xs truncate max-w-[100px]">{attached.file?.name}</span>
            <RemoveButton id={attached.id} preview={attached.preview} />
          </div>
        );
      })}
    </div>
  );
}
