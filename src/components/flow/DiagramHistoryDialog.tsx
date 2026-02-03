import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { FlowDiagram } from '@/types/flow';
import { History, RotateCcw, Clock, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DiagramHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagramName: string;
  allDiagrams: FlowDiagram[];
  currentDiagramId: string | null;
  onLoadDiagram: (diagram: FlowDiagram) => void;
  onDeleteDiagram?: (id: string) => void;
}

export function DiagramHistoryDialog({
  open,
  onOpenChange,
  diagramName,
  allDiagrams,
  currentDiagramId,
  onLoadDiagram,
  onDeleteDiagram,
}: DiagramHistoryDialogProps) {
  const { language } = useLanguage();
  const dateLocale = language === 'ru' ? ru : enUS;
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Get all versions of this diagram (same name)
  const versions = useMemo(() => {
    return allDiagrams
      .filter(d => d.name === diagramName)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [allDiagrams, diagramName]);

  const handleRestore = (diagram: FlowDiagram) => {
    onLoadDiagram(diagram);
    onOpenChange(false);
  };

  const handleDelete = (id: string) => {
    if (onDeleteDiagram) {
      onDeleteDiagram(id);
      setDeleteConfirmId(null);
    }
  };

  if (versions.length === 0) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {language === 'ru' ? 'История версий' : 'Version History'}
            </DialogTitle>
          </DialogHeader>

          <div className="text-sm text-muted-foreground mb-2">
            {language === 'ru' 
              ? `Диаграмма: ${diagramName}` 
              : `Diagram: ${diagramName}`}
          </div>

          <ScrollArea className="max-h-[400px] pr-3">
            <div className="space-y-2">
              {versions.map((version, index) => {
                const isCurrent = version.id === currentDiagramId;
                const isLatest = index === 0;

                return (
                  <div
                    key={version.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      isCurrent 
                        ? "border-primary/50 bg-primary/5" 
                        : "border-border/50 bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium">
                            {format(new Date(version.updated_at), 'dd.MM.yyyy HH:mm', { locale: dateLocale })}
                          </span>
                          {isLatest && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                              {language === 'ru' ? 'Последняя' : 'Latest'}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
                              {language === 'ru' ? 'Текущая' : 'Current'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(version.updated_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {version.nodes.length} {language === 'ru' ? 'узлов' : 'nodes'}, {version.edges.length} {language === 'ru' ? 'связей' : 'edges'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isCurrent && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRestore(version)}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {language === 'ru' ? 'Восстановить версию' : 'Restore version'}
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {onDeleteDiagram && versions.length > 1 && !isCurrent && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteConfirmId(version.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {language === 'ru' ? 'Удалить версию' : 'Delete version'}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {versions.length > 1 && (
            <p className="text-xs text-muted-foreground/70 mt-2">
              {language === 'ru' 
                ? `Всего ${versions.length} версий` 
                : `${versions.length} versions total`}
            </p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ru' ? 'Удалить версию?' : 'Delete version?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ru' 
                ? 'Это действие нельзя отменить. Версия будет удалена безвозвратно.'
                : 'This action cannot be undone. The version will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              {language === 'ru' ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
