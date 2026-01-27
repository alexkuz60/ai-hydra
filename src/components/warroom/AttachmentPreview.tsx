import React, { useState } from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

interface AttachmentPreviewProps {
  attachment: Attachment;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function isImageType(type: string): boolean {
  return IMAGE_TYPES.includes(type);
}

export function AttachmentPreview({ attachment }: AttachmentPreviewProps) {
  const { t } = useLanguage();
  const isImage = isImageType(attachment.type);

  if (isImage) {
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
