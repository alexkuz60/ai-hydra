import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFlowDiagrams, exportToMermaid } from '@/hooks/useFlowDiagrams';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Workflow, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface FlowDiagramPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mermaidCode: string) => void;
}

export function FlowDiagramPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: FlowDiagramPickerDialogProps) {
  const { t, language } = useLanguage();
  const { diagrams, isLoading } = useFlowDiagrams();

  const handleSelect = (diagram: typeof diagrams[number]) => {
    const mermaidCode = exportToMermaid(diagram.nodes, diagram.edges);
    const wrappedCode = `\`\`\`mermaid\n${mermaidCode}\`\`\``;
    onSelect(wrappedCode);
    onOpenChange(false);
  };

  const dateLocale = language === 'ru' ? ru : enUS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-hydra-cyan" />
            {t('flow.pickDiagram')}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : diagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Workflow className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {t('flow.noDiagrams')}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {t('flow.createFirst')}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] pr-3">
            <div className="space-y-2">
              {diagrams.map((diagram) => (
                <button
                  key={diagram.id}
                  onClick={() => handleSelect(diagram)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border border-border/50",
                    "bg-muted/30 hover:bg-muted/60 hover:border-primary/30",
                    "transition-colors duration-150 group"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {diagram.name}
                      </h4>
                      {diagram.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {diagram.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(diagram.updated_at), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground/70">
                    <span>{diagram.nodes.length} nodes</span>
                    <span>•</span>
                    <span>{diagram.edges.length} edges</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
