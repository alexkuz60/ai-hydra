import React, { useState } from 'react';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/warroom/MarkdownRenderer';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Columns2, Maximize2 } from 'lucide-react';
import { InterviewExpandDialog } from './InterviewExpandDialog';
import { getCompetencyLabel, estimateCost, formatCost } from './interviewUtils';
import type { InterviewTestStep } from '@/types/interview';
import { s } from './i18n';

// ── Step Card (progress view) ──

interface StepCardProps {
  step: InterviewTestStep;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  statusIcon: React.ReactNode;
  isRu: boolean;
  modelId?: string;
}

export function StepCard({ step, index, expanded, onToggle, statusIcon, isRu, modelId }: StepCardProps) {
  const [expandDialogOpen, setExpandDialogOpen] = useState(false);
  const stepCost = modelId && step.token_count > 0 ? estimateCost(modelId, step.token_count) : null;

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-xs",
          expanded ? "bg-muted/40" : "hover:bg-muted/20",
        )}>
          {statusIcon}
          <div className="flex-1 min-w-0">
            <span className="font-medium">{getCompetencyLabel(step.competency, isRu)}</span>
            <span className="text-muted-foreground ml-2">#{index + 1}</span>
          </div>
          {step.elapsed_ms > 0 && (
            <span className="text-[10px] text-muted-foreground">{(step.elapsed_ms / 1000).toFixed(1)}s</span>
          )}
          {step.token_count > 0 && (
            <span className="text-[10px] text-muted-foreground">{step.token_count} tok</span>
          )}
          {stepCost && (
            <span className="text-[10px] text-amber-500 font-medium">{formatCost(stepCost.total)}</span>
          )}
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 pr-2 pb-2 space-y-2">
          <div className="text-xs">
            <span className="text-muted-foreground font-medium">{s('taskLabel', isRu)}</span>
            <p className="mt-0.5 text-foreground/80">{step.task_prompt}</p>
          </div>
          {step.candidate_output?.proposed_value && (
            <div className="text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-medium">{s('candidateOutput', isRu)}</span>
                <button
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                  onClick={(e) => { e.stopPropagation(); setExpandDialogOpen(true); }}
                  title={s('expand', isRu)}
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
              <div className="mt-1 p-2 rounded-md bg-muted/30 border border-border max-h-48 overflow-y-auto">
                <MarkdownRenderer content={step.candidate_output.proposed_value} className="text-xs" />
              </div>
              <InterviewExpandDialog
                open={expandDialogOpen}
                onOpenChange={setExpandDialogOpen}
                title={`${getCompetencyLabel(step.competency, isRu)} #${index + 1}`}
                content={step.candidate_output.proposed_value}
                meta={{
                  tokens: step.token_count,
                  elapsed: step.elapsed_ms,
                  cost: stepCost ? formatCost(stepCost.total) : undefined,
                }}
              />
            </div>
          )}
          {step.error && (
            <div className="text-xs text-hydra-critical bg-hydra-critical/5 p-2 rounded">
              {step.error}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Side-by-Side Card (results comparison view) ──

interface SideBySideCardProps {
  step: InterviewTestStep;
  index: number;
  isRu: boolean;
  modelId?: string;
}

export function SideBySideCard({ step, index, isRu, modelId }: SideBySideCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [expandDialogOpen, setExpandDialogOpen] = useState(false);
  const hasBaseline = !!step.baseline?.current_value;
  const hasCandidate = !!step.candidate_output?.proposed_value;
  const stepCost = modelId && step.token_count > 0 ? estimateCost(modelId, step.token_count) : null;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/20 transition-colors text-xs">
          <Columns2 className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium flex-1">{getCompetencyLabel(step.competency, isRu)}</span>
          <Badge variant="outline" className="text-[10px]">#{index + 1}</Badge>
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-2 pb-3 space-y-2">
          <p className="text-[11px] text-muted-foreground italic">{step.task_prompt}</p>
          <div className={cn("grid gap-2", hasBaseline ? "grid-cols-2" : "grid-cols-1")}>
            {hasBaseline && (
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {s('currentBaseline', isRu)}
                </div>
                <div className="p-2 rounded-md bg-muted/20 border border-border max-h-64 overflow-y-auto">
                  <MarkdownRenderer content={step.baseline!.current_value} className="text-xs" />
                </div>
              </div>
            )}
            {hasCandidate && (
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-primary uppercase tracking-wider flex items-center gap-1.5">
                  {s('candidateLabel', isRu)}
                  <button
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                    onClick={(e) => { e.stopPropagation(); setExpandDialogOpen(true); }}
                    title={s('expand', isRu)}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-2 rounded-md bg-primary/5 border border-primary/20 max-h-64 overflow-y-auto">
                  <MarkdownRenderer content={step.candidate_output!.proposed_value} className="text-xs" />
                </div>
                <InterviewExpandDialog
                  open={expandDialogOpen}
                  onOpenChange={setExpandDialogOpen}
                  title={`${getCompetencyLabel(step.competency, isRu)} #${index + 1}`}
                  content={step.candidate_output!.proposed_value}
                  meta={{
                    tokens: step.token_count,
                    elapsed: step.elapsed_ms,
                    cost: stepCost ? formatCost(stepCost.total) : undefined,
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {step.elapsed_ms > 0 && <span>⏱ {(step.elapsed_ms / 1000).toFixed(1)}s</span>}
            {step.token_count > 0 && <span>🪙 {step.token_count} tok</span>}
            {stepCost && <span className="text-amber-500 font-medium">💰 {formatCost(stepCost.total)}</span>}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
