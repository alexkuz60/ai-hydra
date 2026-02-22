import React, { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { CONTEST_STORAGE_KEYS } from '@/hooks/useContestConfig';
import { getRatingsText } from './i18n';

interface ContestSummaryActionsProps {
  onImport: (data: Record<string, unknown>) => void;
  onReset: () => void;
}

export function ContestSummaryActions({
  onImport,
  onReset,
}: ContestSummaryActionsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { toast } = useToast();

  const handleExport = useCallback(() => {
    const data: Record<string, unknown> = {};
    CONTEST_STORAGE_KEYS.forEach((k) => {
      try {
        const v = localStorage.getItem(k);
        if (v) data[k] = JSON.parse(v);
      } catch {
        const v = localStorage.getItem(k);
        if (v) data[k] = v;
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contest-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      description: getRatingsText('actionsExported', isRu),
    });
  }, [isRu, toast]);

  const handleImportClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          onImport(data);
          toast({
            description: getRatingsText('actionsImported', isRu),
          });
        } catch {
          toast({
            variant: 'destructive',
            description: getRatingsText('actionsImportError', isRu),
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [isRu, toast, onImport]);

  const handleReset = useCallback(() => {
    CONTEST_STORAGE_KEYS.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
    window.dispatchEvent(new Event('contest-config-changed'));
    onReset();
    toast({
      description: getRatingsText('actionsResetDone', isRu),
    });
  }, [isRu, toast, onReset]);

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[11px] gap-1.5"
        onClick={handleImportClick}
      >
        <Upload className="h-3 w-3" />
        {getRatingsText('actionsImport', isRu)}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[11px] gap-1.5"
        onClick={handleExport}
      >
        <Download className="h-3 w-3" />
        {getRatingsText('actionsExport', isRu)}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="h-3 w-3" />
            {getRatingsText('actionsResetAll', isRu)}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
             <AlertDialogTitle>
               {getRatingsText('actionsResetTitle', isRu)}
             </AlertDialogTitle>
             <AlertDialogDescription>
               {getRatingsText('actionsResetDesc', isRu)}
             </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {getRatingsText('actionsCancel', isRu)}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleReset}
            >
              {getRatingsText('actionsReset', isRu)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
