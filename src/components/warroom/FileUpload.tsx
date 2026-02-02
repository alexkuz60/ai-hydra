import React, { useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Paperclip, 
  FileText, 
  Image as ImageIcon,
  Files,
  GitBranch,
  FileCode,
  Workflow,
  FileEdit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
  id: string;
  file?: File;
  preview?: string;
  // For Mermaid diagrams (no real file)
  mermaidContent?: string;
  mermaidName?: string;
}

interface FileUploadProps {
  files: AttachedFile[];
  onFilesChange: (files: AttachedFile[]) => void;
  onAttachMermaid?: (content: string, name?: string) => void;
  onSelectFlowDiagram?: () => void;
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
  onAttachMermaid,
  onSelectFlowDiagram,
  disabled = false,
  maxFiles = MAX_FILES,
  maxSizeMB = MAX_SIZE_MB,
}: FileUploadProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const mermaidInputRef = useRef<HTMLInputElement>(null);
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
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
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

  const handleMermaidTemplateAttach = useCallback(() => {
    if (onAttachMermaid) {
      // Extract raw mermaid content without code block wrapper
      const rawMermaid = MERMAID_TEMPLATE.replace(/```mermaid\n?|\n?```/g, '').trim();
      onAttachMermaid(rawMermaid, t('files.mermaidTemplate'));
    }
  }, [onAttachMermaid, t]);

  const handleMermaidFileLoad = useCallback((fileList: FileList | null) => {
    if (!fileList?.[0]) return;
    const file = fileList[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content && onAttachMermaid) {
        // Extract raw mermaid content, remove code block wrapper if present
        const rawMermaid = content.replace(/```mermaid\n?|\n?```/g, '').trim();
        const fileName = file.name.replace(/\.(mmd|mermaid|md|txt)$/i, '');
        onAttachMermaid(rawMermaid, fileName || 'Diagram');
      }
    };
    reader.readAsText(file);
  }, [onAttachMermaid]);

  const handleMermaidFromFile = useCallback(() => {
    mermaidInputRef.current?.click();
  }, []);

  const handleFlowDiagramSelect = useCallback(() => {
    if (onSelectFlowDiagram) {
      onSelectFlowDiagram();
    }
  }, [onSelectFlowDiagram]);

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
          
          {/* Mermaid diagram submenu */}
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-start gap-2 cursor-pointer py-2">
              <GitBranch className="h-4 w-4 text-hydra-cyan mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm">{t('files.mermaidDiagram')}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  Flowchart, Sequence, Mindmap
                </span>
              </div>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              {/* Empty template */}
              <DropdownMenuItem
                onClick={handleMermaidTemplateAttach}
                className="flex items-start gap-2 cursor-pointer py-2"
              >
                <FileEdit className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">{t('files.mermaidTemplate')}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Graph TD
                  </span>
                </div>
              </DropdownMenuItem>
              
              {/* From file */}
              <DropdownMenuItem
                onClick={handleMermaidFromFile}
                className="flex items-start gap-2 cursor-pointer py-2"
              >
                <FileCode className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">{t('files.mermaidFromFile')}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {t('files.mermaidFileHint')}
                  </span>
                </div>
              </DropdownMenuItem>
              
              {/* From flow library */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleFlowDiagramSelect}
                className="flex items-start gap-2 cursor-pointer py-2"
              >
                <Workflow className="h-4 w-4 text-hydra-cyan mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">{t('files.mermaidFromFlow')}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Thought Flow Editor
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Hidden file input for regular files */}
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
      
      {/* Hidden file input for mermaid files */}
      <input
        ref={mermaidInputRef}
        type="file"
        accept=".mmd,.mermaid,.md,.txt"
        className="hidden"
        onChange={(e) => {
          handleMermaidFileLoad(e.target.files);
          e.target.value = '';
        }}
        disabled={disabled}
      />
    </>
  );
}

export { MERMAID_TEMPLATE };
