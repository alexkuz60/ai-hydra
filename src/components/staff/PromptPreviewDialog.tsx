import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

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
  const { language } = useLanguage();
  const lang = (language === 'ru' || language === 'en') ? language : 'ru';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success(lang === 'ru' ? 'Скопировано в буфер обмена' : 'Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(lang === 'ru' ? 'Не удалось скопировать' : 'Failed to copy');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col gap-0">
        <DialogHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-base font-semibold">
              {title || (lang === 'ru' ? 'Полный текст промпта' : 'Full Prompt Text')}
            </DialogTitle>
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
              {lang === 'ru' ? 'Копировать' : 'Copy'}
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 border-t border-border">
          <ScrollArea className="h-full w-full">
            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/90 p-4">
              {content}
            </pre>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromptPreviewDialog;
