import React from 'react';

interface ScoringSchemeComparisonFooterProps {
  isRu: boolean;
}

export function ScoringSchemeComparisonFooter({ isRu }: ScoringSchemeComparisonFooterProps) {
  return (
    <div className="px-3 py-1.5 border-t border-border/20 bg-muted/10">
      <p className="text-[9px] text-muted-foreground/70 text-center">
        {isRu
          ? '▲▼ — изменение позиции относительно средневзвешенного балла • Подсветка = расхождение рейтингов между схемами'
          : '▲▼ — rank change vs weighted avg baseline • Highlight = ranking disagreement between schemes'}
      </p>
    </div>
  );
}
