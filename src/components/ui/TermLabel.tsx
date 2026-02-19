import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MEMORY_GLOSSARY, getTermLabel, getTermDescription } from '@/config/memoryGlossary';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TermLabelProps {
  /** The raw technical field name, e.g. "avg_latency_sec" */
  term: string;
  /** Override the displayed label */
  label?: string;
  /** Show the help icon */
  showIcon?: boolean;
  /** Additional class names */
  className?: string;
  children?: React.ReactNode;
}

/**
 * Renders a human-readable label for a technical term with a tooltip description.
 * Falls back to the raw term if no glossary entry exists.
 */
export function TermLabel({ term, label, showIcon = false, className, children }: TermLabelProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const entry = MEMORY_GLOSSARY[term];

  if (!entry) {
    return <span className={className}>{children ?? label ?? term}</span>;
  }

  const displayLabel = children ?? label ?? getTermLabel(term, isRu);
  const description = getTermDescription(term, isRu);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('cursor-help border-b border-dotted border-muted-foreground/40', className)}>
          {displayLabel}
          {showIcon && <HelpCircle className="inline h-3 w-3 ml-0.5 text-muted-foreground/60" />}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px]">
        <p className="text-xs font-medium mb-0.5">{getTermLabel(term, isRu)}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">{term}</p>
      </TooltipContent>
    </Tooltip>
  );
}
