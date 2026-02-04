import React from 'react';
import { FlowExecutionState, NodeStatus } from '@/hooks/useFlowRuntime';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  X,
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Pause,
  SkipForward,
  Eraser,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface FlowExecutionPanelProps {
  state: FlowExecutionState;
  onCancel: () => void;
  onClose: () => void;
  onClearResults: () => void;
}

const stateIcons: Record<NodeStatus['state'], React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  ready: Clock,
  running: Loader2,
  waiting_user: Pause,
  completed: CheckCircle2,
  failed: XCircle,
  skipped: SkipForward,
};

const stateColors: Record<NodeStatus['state'], string> = {
  pending: 'text-muted-foreground',
  ready: 'text-blue-500',
  running: 'text-primary',
  waiting_user: 'text-amber-500',
  completed: 'text-green-500',
  failed: 'text-destructive',
  skipped: 'text-muted-foreground',
};

export function FlowExecutionPanel({ state, onCancel, onClose, onClearResults }: FlowExecutionPanelProps) {
  const { t } = useLanguage();
  const hasResults = state.nodeStatuses.size > 0 || state.nodeOutputs.size > 0;
  
  const statusArray = Array.from(state.nodeStatuses.values());
  const completedCount = statusArray.filter(s => s.state === 'completed').length;
  const totalCount = statusArray.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {state.isRunning ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : state.error ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : state.finalOutput !== undefined ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Play className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">{t('flowEditor.execution')}</span>
        </div>
        <div className="flex items-center gap-1">
          {hasResults && !state.isRunning && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClearResults}>
                  <Eraser className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('flowEditor.clearResults')}</TooltipContent>
            </Tooltip>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('flowEditor.progress')}</span>
          <span className="font-medium">{completedCount}/{totalCount}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Node statuses */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {statusArray.map((status) => {
            const Icon = stateIcons[status.state];
            const colorClass = stateColors[status.state];
            
            return (
              <div
                key={status.nodeId}
                className={cn(
                  'p-2 rounded-lg border bg-background/50',
                  status.state === 'running' && 'border-primary/50 bg-primary/5',
                  status.state === 'completed' && 'border-green-500/30',
                  status.state === 'failed' && 'border-destructive/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      'h-4 w-4 flex-shrink-0',
                      colorClass,
                      status.state === 'running' && 'animate-spin'
                    )}
                  />
                  <span className="text-sm font-medium truncate flex-1">
                    {status.nodeId}
                  </span>
                </div>
                
                {status.progress && (
                  <p className="text-xs text-muted-foreground mt-1 pl-6">
                    {status.progress}
                  </p>
                )}
                
                {status.error && (
                  <p className="text-xs text-destructive mt-1 pl-6">
                    {status.error}
                  </p>
                )}
              </div>
            );
          })}

          {statusArray.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('flowEditor.noNodesExecuting')}
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Footer actions */}
      <div className="p-3 border-t border-border">
        {state.isRunning ? (
          <Button variant="destructive" className="w-full" onClick={onCancel}>
            <Square className="h-4 w-4 mr-2" />
            {t('flowEditor.stopExecution')}
          </Button>
        ) : state.error ? (
          <div className="text-sm text-destructive text-center">
            {state.error}
          </div>
        ) : state.finalOutput !== undefined ? (
          <div className="text-sm text-green-500 text-center">
            {t('flowEditor.executionComplete')}
          </div>
        ) : null}
      </div>
    </div>
  );
}
