import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Workflow, ExternalLink, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { MermaidPreview } from '@/components/warroom/MermaidPreview';
import { MermaidBlock } from '@/components/warroom/MermaidBlock';
import { SummaryItem } from './ContestSummaryItem';
import { getRatingsText } from './i18n';

interface SavedPlan {
  diagramId: string;
  diagramName: string;
  mermaidCode: string;
  nodeCount: number;
  edgeCount: number;
}

interface ContestSavedPlanProps {
  savedPlan: SavedPlan | null;
}

export function ContestSavedPlan({ savedPlan }: ContestSavedPlanProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  if (!savedPlan) return null;

  return (
    <div className="space-y-2">
      <Separator className="opacity-30" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <Workflow className="h-3 w-3" />
          {getRatingsText('savedFlow', isRu)}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] gap-1 px-2"
          onClick={() => navigate(`/flow-editor?diagram=${savedPlan.diagramId}`)}
        >
          <ExternalLink className="h-3 w-3" />
          {getRatingsText('openInEditor', isRu)}
        </Button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <SummaryItem
          icon={<Workflow className="h-3.5 w-3.5" />}
          label={getRatingsText('nodesLabel', isRu)}
          value={String(savedPlan.nodeCount)}
        />
        <SummaryItem
          icon={<Workflow className="h-3.5 w-3.5" />}
          label={getRatingsText('edgesLabel', isRu)}
          value={String(savedPlan.edgeCount)}
        />
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <button className="w-full rounded-md border border-border/30 bg-muted/10 overflow-hidden cursor-pointer hover:border-border/60 transition-colors group relative">
            <MermaidPreview content={savedPlan.mermaidCode} maxHeight={100} />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/40">
              <Maximize2 className="h-4 w-4 text-foreground" />
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] p-4">
          <MermaidBlock content={savedPlan.mermaidCode} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
