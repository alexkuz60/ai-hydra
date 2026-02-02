import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFlowDiagrams, exportToMermaid } from '@/hooks/useFlowDiagrams';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Workflow, Calendar, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { MermaidPreview } from './MermaidPreview';
import { FlowDiagram } from '@/types/flow';

interface FlowDiagramPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mermaidCode: string, diagramName: string) => void;
}

export function FlowDiagramPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: FlowDiagramPickerDialogProps) {
  const { t, language } = useLanguage();
  const { diagrams, isLoading } = useFlowDiagrams();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelect = (diagram: FlowDiagram) => {
    const mermaidCode = exportToMermaid(diagram.nodes, diagram.edges);
    onSelect(mermaidCode, diagram.name);
    onOpenChange(false);
  };

  const dateLocale = language === 'ru' ? ru : enUS;

  // Pre-compute mermaid code for hovered diagram
  const hoveredMermaid = useMemo(() => {
    if (!hoveredId) return null;
    const diagram = diagrams.find(d => d.id === hoveredId);
    if (!diagram) return null;
    return exportToMermaid(diagram.nodes, diagram.edges);
  }, [hoveredId, diagrams]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
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
          <div className="flex gap-4">
            {/* Diagram list */}
            <ScrollArea className="flex-1 max-h-[350px] pr-3">
              <div className="space-y-2">
                {diagrams.map((diagram) => (
                  <button
                    key={diagram.id}
                    onClick={() => handleSelect(diagram)}
                    onMouseEnter={() => setHoveredId(diagram.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border",
                      "transition-all duration-150 group",
                      hoveredId === diagram.id
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border/50 bg-muted/30 hover:bg-muted/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "font-medium text-sm truncate transition-colors",
                          hoveredId === diagram.id ? "text-primary" : "group-hover:text-primary"
                        )}>
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
                      <span>{diagram.nodes.length} {language === 'ru' ? 'узлов' : 'nodes'}</span>
                      <span>•</span>
                      <span>{diagram.edges.length} {language === 'ru' ? 'связей' : 'edges'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Preview panel */}
            <div className="w-[220px] shrink-0">
              <div className="sticky top-0">
                <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{language === 'ru' ? 'Превью' : 'Preview'}</span>
                </div>
                {hoveredMermaid ? (
                  <MermaidPreview 
                    content={hoveredMermaid} 
                    maxHeight={280}
                    className="w-full"
                  />
                ) : (
                  <div className="h-[280px] rounded border border-dashed border-border/50 bg-muted/20 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground/50 text-center px-4">
                      {language === 'ru' 
                        ? 'Наведите на диаграмму для превью' 
                        : 'Hover over a diagram to preview'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
