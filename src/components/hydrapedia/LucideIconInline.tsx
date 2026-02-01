import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface LucideIconInlineProps {
  name: string;
  className?: string;
}

// Function to check if something is a valid React component
function isValidIconComponent(component: unknown): component is React.ComponentType<{ className?: string }> {
  return (
    component !== null &&
    component !== undefined &&
    typeof component === 'object' &&
    '$$typeof' in component
  );
}

export function LucideIconInline({ name, className }: LucideIconInlineProps) {
  // Try to find the icon by name in the lucide-react exports
  const IconComponent = (LucideIcons as Record<string, unknown>)[name];
  
  if (isValidIconComponent(IconComponent)) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-muted/80 border border-border/50",
        className
      )}>
        <IconComponent className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="text-xs font-mono text-muted-foreground">{name}</span>
      </span>
    );
  }
  
  // Handle special cases like logo.svg or file references
  if (name.includes('.')) {
    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground">
        {name}
      </code>
    );
  }
  
  // Fallback to just showing the name with a generic icon indicator
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60 border border-border/40",
      className
    )}>
      <span className="h-4 w-4 flex items-center justify-center text-muted-foreground">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
        </svg>
      </span>
      <span className="text-xs font-mono text-muted-foreground">{name}</span>
    </span>
  );
}
