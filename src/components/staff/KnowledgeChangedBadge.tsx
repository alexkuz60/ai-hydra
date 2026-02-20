import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useKnowledgeVersioning } from '@/hooks/useKnowledgeVersioning';

interface KnowledgeChangedBadgeProps {
  role: string;
  isRu: boolean;
  onRecertify?: () => void;
}

/** Small badge that shows if a role's knowledge changed since last certification */
export function KnowledgeChangedBadge({ role, isRu, onRecertify }: KnowledgeChangedBadgeProps) {
  const { hasChanged, changeSummary } = useKnowledgeVersioning(role);
  if (!hasChanged) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "gap-1 text-[10px] py-0 text-hydra-warning border-hydra-warning/30 animate-pulse",
            onRecertify && "cursor-pointer hover:bg-hydra-warning/10"
          )}
          onClick={(e) => {
            if (onRecertify) {
              e.stopPropagation();
              onRecertify();
            }
          }}
        >
          <RefreshCw className="h-2.5 w-2.5" />
          {isRu ? 'Обновлено' : 'Updated'}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        {isRu ? 'Знания изменились с последней аттестации. Нажмите для переаттестации.' : 'Knowledge changed since last certification. Click to re-certify.'}
        {changeSummary && <div className="font-mono text-[10px] mt-0.5">{changeSummary}</div>}
      </TooltipContent>
    </Tooltip>
  );
}
