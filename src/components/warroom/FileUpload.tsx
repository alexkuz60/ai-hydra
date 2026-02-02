import React, { useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Paperclip, 
  FileText, 
  Image as ImageIcon,
  Files,
  GitBranch
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  onInsertMermaid?: () => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
}

type FileCategory = 'all' | 'images' | 'documents';

const FILE_CATEGORIES: { 
  id: FileCategory; 
  labelKey: string; 
  icon: React.ElementType; 
  accept: string[];
  formats: string;
}[] = [
  { 
    id: 'all', 
    labelKey: 'files.allTypes', 
    icon: Files, 
    accept: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES],
    formats: 'JPG, PNG, GIF, WEBP, PDF, DOCX, TXT, MD'
  },
  { 
    id: 'images', 
    labelKey: 'files.images', 
    icon: ImageIcon, 
    accept: ALLOWED_IMAGE_TYPES,
    formats: 'JPG, PNG, GIF, WEBP'
  },
  { 
    id: 'documents', 
    labelKey: 'files.documents', 
    icon: FileText, 
    accept: ALLOWED_DOC_TYPES,
    formats: 'PDF, DOCX, TXT, MD'
  },
];

const MERMAID_TEMPLATE = `\`\`\`mermaid
graph TD
    A[Начало] --> B{Условие}
    B -->|Да| C[Действие 1]
    B -->|Нет| D[Действие 2]
    C --> E[Конец]
    D --> E
\`\`\``;

function getFileIcon(type: string) {
  if (isImageType(type)) {
    return ImageIcon;
  }
  return FileText;
}

export function FileUpload({
  files,
  onFilesChange,
  onInsertMermaid,
  disabled = false,
  maxFiles = MAX_FILES,
  maxSizeMB = MAX_SIZE_MB,
}: FileUploadProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentAccept, setCurrentAccept] = useState<string[]>([...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES]);

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

  const handleCategorySelect = useCallback((category: FileCategory) => {
    const categoryConfig = FILE_CATEGORIES.find(c => c.id === category);
    if (categoryConfig) {
      setCurrentAccept(categoryConfig.accept);
      // Small delay to ensure state is updated before opening file picker
      setTimeout(() => {
        inputRef.current?.click();
      }, 0);
    }
  }, []);

  const handleMermaidInsert = useCallback(() => {
    if (onInsertMermaid) {
      onInsertMermaid();
    }
  }, [onInsertMermaid]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
            disabled={disabled || files.length >= maxFiles}
            title={t('files.attach')}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {FILE_CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            return (
              <React.Fragment key={category.id}>
                {index === 1 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={() => handleCategorySelect(category.id)}
                  className="flex items-start gap-2 cursor-pointer py-2"
                >
                  <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm">{t(category.labelKey)}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {category.formats}
                    </span>
                  </div>
                </DropdownMenuItem>
              </React.Fragment>
            );
          })}
          
          {/* Mermaid diagram option */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleMermaidInsert}
            className="flex items-start gap-2 cursor-pointer py-2"
          >
            <GitBranch className="h-4 w-4 text-hydra-cyan mt-0.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">{t('files.mermaidDiagram')}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                Flowchart, Sequence, Mindmap
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={currentAccept.join(',')}
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

export { MERMAID_TEMPLATE };
