import React, { useState } from 'react';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { FileText, Trophy, Swords, Brain, MessageSquare, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CritiqueEntry } from '@/hooks/useModelDossier';

interface CritiqueSummaryCardProps {
  critiques: CritiqueEntry[];
  legacyCritique: string | null;
  isRu: boolean;
}

const SOURCE_CONFIG = {
  panel: {
    icon: Brain,
    color: 'text-hydra-expert',
    labelRu: 'Панель Экспертов',
    labelEn: 'Expert Panel',
  },
  dchat: {
    icon: MessageSquare,
    color: 'text-hydra-cyan',
    labelRu: 'Д-чат',
    labelEn: 'D-Chat',
  },
  contest: {
    icon: Trophy,
    color: 'text-primary',
    labelRu: 'Конкурсы',
    labelEn: 'Contests',
  },
  duel: {
    icon: Swords,
    color: 'text-hydra-arbiter',
    labelRu: 'Дуэли',
    labelEn: 'Duels',
  },
} as const;

const SOURCE_ORDER: Array<CritiqueEntry['source']> = ['panel', 'dchat', 'contest', 'duel'];

export function CritiqueSummaryCard({ critiques, legacyCritique, isRu }: CritiqueSummaryCardProps) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  // Group critiques by source
  const grouped = new Map<CritiqueEntry['source'], CritiqueEntry[]>();
  for (const c of critiques) {
    const list = grouped.get(c.source) || [];
    list.push(c);
    grouped.set(c.source, list);
  }

  const hasCritiques = critiques.length > 0 || !!legacyCritique;
  if (!hasCritiques) return null;

  // If only legacy critique and no structured data, show simple card
  if (critiques.length === 0 && legacyCritique) {
    return (
      <HydraCard variant="default">
        <HydraCardHeader className="py-3">
          <FileText className="h-5 w-5 text-hydra-critic" />
          <HydraCardTitle>{isRu ? 'Критика' : 'Critique'}</HydraCardTitle>
        </HydraCardHeader>
        <HydraCardContent>
          <p className="text-sm text-muted-foreground italic">"{legacyCritique}"</p>
        </HydraCardContent>
      </HydraCard>
    );
  }

  return (
    <HydraCard variant="default">
      <HydraCardHeader className="py-3">
        <FileText className="h-5 w-5 text-hydra-critic" />
        <HydraCardTitle>{isRu ? 'Критика' : 'Critique'}</HydraCardTitle>
        <span className="text-xs text-muted-foreground ml-auto">{critiques.length}</span>
      </HydraCardHeader>
      <HydraCardContent>
        <div className="space-y-1">
          {SOURCE_ORDER.filter(s => grouped.has(s)).map(source => {
            const config = SOURCE_CONFIG[source];
            const SourceIcon = config.icon;
            const items = grouped.get(source)!;
            const isOpen = expandedSource === source;

            return (
              <div key={source}>
                <button
                  onClick={() => setExpandedSource(isOpen ? null : source)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <SourceIcon className={cn("h-4 w-4 shrink-0", config.color)} />
                  <span className="text-sm font-medium">
                    {isRu ? config.labelRu : config.labelEn}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
                </button>
                {isOpen && (
                  <div className="ml-6 space-y-2 mt-1 mb-2">
                    {items.map((entry, i) => (
                      <div key={i} className="p-2 rounded-lg bg-muted/20 space-y-1">
                        <p className="text-sm text-muted-foreground italic leading-relaxed">
                          "{entry.text}"
                        </p>
                        {entry.score != null && (
                          <div className="flex items-center gap-1.5">
                            <Scale className="h-3 w-3 text-hydra-arbiter" />
                            <span className="text-xs font-semibold">{entry.score.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}
