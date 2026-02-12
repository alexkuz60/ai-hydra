import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { BarChart3, Info } from 'lucide-react';
import type { ScoringScheme } from '@/lib/contestScoring';

interface ScoringSchemeComparisonHeaderProps {
  isRu: boolean;
  disagreementCount: number;
  schemes: Array<{ id: ScoringScheme; icon: React.ReactNode; colorVar: string }>;
  schemeMeta: Record<ScoringScheme, { ru: string; en: string; descRu: string; descEn: string }>;
}

export function ScoringSchemeComparisonHeader({
  isRu,
  disagreementCount,
  schemes,
  schemeMeta,
}: ScoringSchemeComparisonHeaderProps) {
  return (
    <>
      {/* Title */}
      <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2">
        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isRu ? 'Сравнение схем оценки' : 'Scoring Schemes Comparison'}
        </span>
        {disagreementCount > 0 && (
          <Badge variant="secondary" className="text-[10px] ml-auto gap-1">
            <Info className="h-2.5 w-2.5" />
            {isRu
              ? `${disagreementCount} расхождени${disagreementCount === 1 ? 'е' : 'й'}`
              : `${disagreementCount} disagreement${disagreementCount > 1 ? 's' : ''}`}
          </Badge>
        )}
      </div>

      {/* Scheme labels row */}
      <div className="px-3 pt-2 pb-1 flex items-center gap-2">
        <div className="w-[120px] shrink-0" />
        <div className="flex-1 grid grid-cols-3 gap-2">
          {schemes.map(s => {
            const meta = schemeMeta[s.id];
            return (
              <TooltipProvider key={s.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                      <span style={{ color: `hsl(var(${s.colorVar}))` }}>{s.icon}</span>
                      {isRu ? meta.ru : meta.en}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] max-w-[200px]">
                    {isRu ? meta.descRu : meta.descEn}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    </>
  );
}
