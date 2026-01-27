import React, { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { 
  ALLOWED_IMAGE_TYPES, 
  ALLOWED_DOC_TYPES, 
  MAX_FILES, 
  MAX_SIZE_MB, 
  isImageType 
} from '@/lib/fileUtils';

export interface AttachedFile {
  file: File;
  preview?: string;
  id: string;
}

interface FileUploadProps {
  files: AttachedFile[];
  onFilesChange: (files: AttachedFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
}

function getFileIcon(type: string) {
  if (isImageType(type)) {
    return ImageIcon;
  }
  return FileText;
}

export function FileUpload({
  files,
  onFilesChange,
  disabled = false,
  maxFiles = MAX_FILES,
  maxSizeMB = MAX_SIZE_MB,
}: FileUploadProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles || disabled) return;

    const fileArray = Array.from(newFiles);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      toast({
        title: t('files.tooMany'),
        description: t('files.maxFiles').replace('{count}', String(maxFiles)),
        variant: 'destructive',
      });
      return;
    }

    const validFiles: AttachedFile[] = [];

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxSizeBytes) {
        toast({
          title: t('files.tooLarge'),
          description: `${file.name}: ${t('files.maxSize').replace('{size}', String(maxSizeMB))}`,
          variant: 'destructive',
        });
        continue;
      }

      // Check file type
      const isAllowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES].includes(file.type);
      if (!isAllowed) {
        toast({
          title: t('files.invalidType'),
          description: file.name,
          variant: 'destructive',
        });
        continue;
      }

      const attachedFile: AttachedFile = {
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      // Create preview for images
      if (isImageType(file.type)) {
        attachedFile.preview = URL.createObjectURL(file);
      }

      validFiles.push(attachedFile);
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  }, [files, onFilesChange, disabled, maxFiles, maxSizeMB, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const removeFile = useCallback((id: string) => {
    const file = files.find(f => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onFilesChange(files.filter(f => f.id !== id));
  }, [files, onFilesChange]);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
        onClick={handleButtonClick}
        disabled={disabled || files.length >= maxFiles}
        title={t('files.attach')}
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES].join(',')}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
        disabled={disabled}
      />
    </>
  );
}
