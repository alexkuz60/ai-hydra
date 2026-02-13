import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, Check, Languages, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useContentTranslation } from '@/hooks/usePromptTranslation';

interface PromptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
}

const PromptPreviewDialog: React.FC<PromptPreviewDialogProps> = ({
  open,
  onOpenChange,
  title,
  content,
}) => {
  const { language, t } = useLanguage();
  const lang = (language === 'ru' || language === 'en') ? language : 'ru';
  const [copied, setCopied] = useState(false);
  
  const {
    isTranslating,
    isRussianContent,
    isShowingTranslation,
    displayContent,
    handleTranslate,
    reset,
  } = useContentTranslation(content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopied(true);
      toast.success(lang === 'ru' ? 'Скопировано в буфер обмена' : 'Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(lang === 'ru' ? 'Не удалось скопировать' : 'Failed to copy');
    }
  };

  // Reset translation state when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col gap-0">
        <DialogHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-base font-semibold">
              {title || (lang === 'ru' ? 'Полный текст промпта' : 'Full Prompt Text')}
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTranslate}
                disabled={isTranslating}
                className="gap-1.5 h-7 text-xs"
              >
                {isTranslating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Languages className="h-3 w-3" />
                )}
                {isShowingTranslation 
                  ? (lang === 'ru' ? 'Оригинал' : 'Original')
                  : (isRussianContent 
                      ? (lang === 'ru' ? 'На английский' : 'To English')
                      : (lang === 'ru' ? 'На русский' : 'To Russian')
                    )
                }
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 h-7 text-xs"
              >
                {copied ? (
                   <Check className="h-3 w-3 text-primary" />
                 ) : (
                   <Copy className="h-3 w-3" />
                 )}
                 {copied ? t('common.copied') : t('common.copy')}
              </Button>
            </div>
          </div>
          {isShowingTranslation && (
            <div className="text-xs text-muted-foreground mt-1">
              {lang === 'ru' 
                ? `Показан перевод на ${isRussianContent ? 'английский' : 'русский'}`
                : `Showing ${isRussianContent ? 'English' : 'Russian'} translation`
              }
            </div>
          )}
        </DialogHeader>
        <div className="flex-1 min-h-0 border-t border-border">
          <ScrollArea className="h-full w-full">
            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/90 p-4">
              {displayContent}
            </pre>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromptPreviewDialog;
