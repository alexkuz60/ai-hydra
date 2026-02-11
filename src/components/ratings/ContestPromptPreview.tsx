import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface ContestPromptPreviewProps {
  prompt: string;
}

export function ContestPromptPreview({ prompt }: ContestPromptPreviewProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!prompt) return null;

  return (
    <>
      <Separator className="opacity-30" />
      <Dialog>
        <DialogTrigger asChild>
          <button className="w-full text-left space-y-1 group cursor-pointer rounded-md hover:bg-muted/30 transition-colors p-1 -m-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <FileText className="h-3 w-3" />
                {isRu ? 'Промпт тура 1' : 'Round 1 Prompt'}
              </div>
              <Maximize2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-2 whitespace-pre-wrap">
              {prompt}
            </p>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              {isRu ? 'Промпт тура 1' : 'Round 1 Prompt'}
            </h3>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {prompt}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
