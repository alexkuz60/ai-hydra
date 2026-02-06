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
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
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
        <ScrollArea className="flex-1 mt-4">
          <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/90 p-4 bg-muted/30 rounded-md border border-border">
            {content}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PromptPreviewDialog;
