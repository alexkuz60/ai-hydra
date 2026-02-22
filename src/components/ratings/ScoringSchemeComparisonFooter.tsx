import React from 'react';
import { getRatingsText } from './i18n';

interface ScoringSchemeComparisonFooterProps {
  isRu: boolean;
}

export function ScoringSchemeComparisonFooter({ isRu }: ScoringSchemeComparisonFooterProps) {
  return (
    <div className="px-3 py-1.5 border-t border-border/20 bg-muted/10">
      <p className="text-[9px] text-muted-foreground/70 text-center">
        {getRatingsText('schemesFooter', isRu)}
      </p>
    </div>
  );
}
