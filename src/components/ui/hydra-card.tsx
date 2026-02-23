import React from 'react';
import { cn } from '@/lib/utils';

type HydraCardVariant = 
  | 'default' 
  | 'expert' 
  | 'critic' 
  | 'arbiter' 
  | 'user' 
  | 'supervisor' 
  | 'glass'
  // New AI role variants
  | 'moderator'
  | 'advisor'
  | 'archivist'
  | 'analyst'
  | 'webhunter'
  | 'guide'
  // Technical staff judges
  | 'technocritic'
  | 'technoarbiter'
  | 'technomoderator'
  | 'translator'
  | 'patent_attorney';

interface HydraCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: HydraCardVariant;
  glow?: boolean;
}

export function HydraCard({ 
  children, 
  className, 
  variant = 'default',
  glow = false,
  ...props 
}: HydraCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 transition-all duration-300',
        {
          'hydra-card-expert': variant === 'expert',
          'hydra-card-critic': variant === 'critic' || variant === 'technocritic',
          'hydra-card-arbiter': variant === 'arbiter' || variant === 'technoarbiter',
          'hydra-card-user': variant === 'user',
          'hydra-card-supervisor': variant === 'supervisor',
          'hydra-glass': variant === 'glass',
          // New AI role card styles
          'hydra-card-moderator': variant === 'moderator' || variant === 'technomoderator',
          'hydra-card-advisor': variant === 'advisor',
          'hydra-card-archivist': variant === 'archivist',
          'hydra-card-analyst': variant === 'analyst',
          'hydra-card-webhunter': variant === 'webhunter',
          'hydra-card-guide': variant === 'guide',
          'hydra-card-translator': variant === 'translator',
          'hydra-card-patent-attorney': variant === 'patent_attorney',
          'hydra-glow-sm hover:hydra-glow': glow,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface HydraCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function HydraCardHeader({ children, className, ...props }: HydraCardHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2 mb-3', className)} {...props}>
      {children}
    </div>
  );
}

interface HydraCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function HydraCardTitle({ children, className, ...props }: HydraCardTitleProps) {
  return (
    <h3 className={cn('text-sm font-semibold', className)} {...props}>
      {children}
    </h3>
  );
}

interface HydraCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function HydraCardContent({ children, className, ...props }: HydraCardContentProps) {
  return (
    <div className={cn('text-sm', className)} {...props}>
      {children}
    </div>
  );
}
