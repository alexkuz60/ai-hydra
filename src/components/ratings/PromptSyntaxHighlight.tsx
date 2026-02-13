import React from 'react';

interface PromptSyntaxHighlightProps {
  text: string;
}

export function PromptSyntaxHighlight({ text }: PromptSyntaxHighlightProps) {
  const lines = text.split('\n');
  
  return (
    <div className="space-y-0 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-mono">
      {lines.map((line, idx) => {
        // Заголовки История дебатов / Round N
        if (line.trim().startsWith('##')) {
          return (
            <div key={idx} className="text-accent font-semibold">
              {line}
            </div>
          );
        }
        
        // Разделители
        if (line.trim() === '---') {
          return (
            <div key={idx} className="text-muted-foreground opacity-50">
              {line}
            </div>
          );
        }
        
        // Секции "Ваш аргумент" и "Аргумент противника"
        if (
          line.trim().startsWith('**Ваш аргумент:**') ||
          line.trim().startsWith('**Your argument:**') ||
          line.trim().startsWith('**Аргумент противника:**') ||
          line.trim().startsWith("**Opponent's argument:**")
        ) {
          const isMineSection = 
            line.includes('Ваш аргумент') || line.includes('Your argument');
          
          return (
            <div 
              key={idx} 
              className={`font-semibold ${
                isMineSection 
                  ? 'text-hydra-success' 
                  : 'text-destructive'
              }`}
            >
              {line}
            </div>
          );
        }
        
        // Обычная строка
        return (
          <div key={idx}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
