import { useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { AttachedFile } from '@/components/warroom/FileUpload';
import { MAX_FILES, MAX_SIZE_MB } from '@/lib/fileUtils';

interface UsePasteHandlerOptions {
  attachedFiles: AttachedFile[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<AttachedFile[]>>;
  disabled?: boolean;
}

/**
 * Hook for handling clipboard paste events with images
 */
export function usePasteHandler({ 
  attachedFiles, 
  setAttachedFiles, 
  disabled = false 
}: UsePasteHandlerOptions) {
  const { t } = useLanguage();

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (disabled) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;
    
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }
    
    if (imageFiles.length > 0) {
      e.preventDefault();
      
      const newFiles: AttachedFile[] = [];
      for (const file of imageFiles) {
        if (attachedFiles.length + newFiles.length >= MAX_FILES) {
          toast.error(t('files.tooMany'));
          break;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          toast.error(`${t('files.tooLarge')}: ${file.name}`);
          continue;
        }
        // Generate safe filename for clipboard images
        const ext = file.type.split('/')[1] || 'png';
        const safeName = `clipboard_${Date.now()}_${newFiles.length}.${ext}`;
        const renamedFile = new File([file], safeName, { type: file.type });
        
        newFiles.push({
          id: crypto.randomUUID(),
          file: renamedFile,
          preview: URL.createObjectURL(file),
        });
      }
      
      if (newFiles.length > 0) {
        setAttachedFiles(prev => [...prev, ...newFiles]);
      }
    }
  }, [attachedFiles, setAttachedFiles, disabled, t]);

  return { handlePaste };
}
