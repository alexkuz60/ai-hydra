import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SPRZ_TAXONOMY, type SprzType } from '@/lib/sprzTaxonomy';
import { cn } from '@/lib/utils';

interface SprzTaxonomyTreeProps {
  /** Highlighted type IDs (selected in the plan) */
  activeTypeIds?: string[];
  /** Highlighted subtype IDs */
  activeSubtypeIds?: string[];
  /** Compact mode for embedding in cards */
  compact?: boolean;
}

export function SprzTaxonomyTree({ activeTypeIds = [], activeSubtypeIds = [], compact = false }: SprzTaxonomyTreeProps) {
  const { language } = useLanguage();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(activeTypeIds));

  const toggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isRu = language === 'ru';

  return (
    <div className={cn('space-y-1', compact ? 'text-xs' : 'text-sm')}>
      {/* Root label */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🧬</span>
        <span className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>
          {isRu ? 'Таксономия СПРЗ' : 'SPRS Taxonomy'}
        </span>
      </div>

      {SPRZ_TAXONOMY.map((type) => (
        <TypeNode
          key={type.id}
          type={type}
          isExpanded={expandedIds.has(type.id)}
          isActive={activeTypeIds.includes(type.id)}
          activeSubtypeIds={activeSubtypeIds}
          onToggle={() => toggle(type.id)}
          isRu={isRu}
          compact={compact}
        />
      ))}
    </div>
  );
}

function TypeNode({
  type,
  isExpanded,
  isActive,
  activeSubtypeIds,
  onToggle,
  isRu,
  compact,
}: {
  type: SprzType;
  isExpanded: boolean;
  isActive: boolean;
  activeSubtypeIds: string[];
  onToggle: () => void;
  isRu: boolean;
  compact: boolean;
}) {
  return (
    <div className="ml-2">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 w-full rounded-md px-2 py-1.5 transition-colors text-left',
          'hover:bg-accent/50',
          isActive && 'bg-primary/10 border border-primary/30',
          !isActive && 'border border-transparent'
        )}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0"
        >
          <ChevronRight className={cn('text-muted-foreground', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        </motion.div>
        <span className="text-base leading-none">{type.icon}</span>
        <span className={cn(
          'font-medium',
          isActive ? 'text-primary' : 'text-foreground'
        )}>
          {isRu ? type.label.ru : type.label.en}
        </span>
        <span className="text-muted-foreground ml-auto text-[10px]">
          {type.subtypes.length}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-6 border-l border-muted-foreground/20 pl-3 py-1 space-y-0.5">
              {type.subtypes.map((sub) => {
                const isSubActive = activeSubtypeIds.includes(sub.id);
                return (
                  <div
                    key={sub.id}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1 transition-colors',
                      isSubActive
                        ? 'bg-accent/60 text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                    )}
                  >
                    <div className={cn(
                      'rounded-full shrink-0',
                      compact ? 'w-1.5 h-1.5' : 'w-2 h-2',
                      isSubActive ? 'bg-primary' : 'bg-muted-foreground/40'
                    )} />
                    <span>{isRu ? sub.label.ru : sub.label.en}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
