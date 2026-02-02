import React from 'react';
import { FileText, Download, ExternalLink, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MermaidPreview } from './MermaidPreview';
import { MermaidBlock } from './MermaidBlock';
import type { Attachment } from '@/types/messages';

// Re-export for backward compatibility
export type { Attachment };

interface AttachmentPreviewProps {
  attachment: Attachment;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function isImageType(type: string): boolean {
  return IMAGE_TYPES.includes(type);
}

function isMermaidType(type: string): boolean {
  return type === 'text/x-mermaid' || type === 'application/x-mermaid';
}

export function AttachmentPreview({ attachment }: AttachmentPreviewProps) {
  // Mermaid diagram preview
  if (isMermaidType(attachment.type) && attachment.content) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button
            className={cn(
              "relative group rounded-md overflow-hidden border border-border/50",
              "w-24 cursor-pointer hover:border-hydra-cyan/50 transition-colors",
              "bg-muted/30 p-1"
            )}
          >
            <MermaidPreview content={attachment.content} maxHeight={72} />
            <div className="flex items-center gap-1 mt-1 px-1">
              <GitBranch className="h-3 w-3 text-hydra-cyan shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate">
                {attachment.name}
              </span>
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] p-4">
          <MermaidBlock content={attachment.content} />
        </DialogContent>
      </Dialog>
    );
  }

  // Image preview
  if (isImageType(attachment.type)) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button
            className={cn(
              "relative group rounded-md overflow-hidden border border-border/50",
              "w-20 h-20 cursor-pointer hover:border-primary/50 transition-colors"
            )}
          >
            <img
              src={attachment.url}
              alt={attachment.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-full h-full object-contain rounded"
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Document preview
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.name}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md",
        "border border-border/50 bg-muted/30",
        "hover:bg-muted/50 hover:border-primary/50 transition-colors",
        "text-sm text-foreground/80 hover:text-foreground"
      )}
    >
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="truncate max-w-[150px]">{attachment.name}</span>
      <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </a>
  );
}
