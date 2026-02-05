import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconButtonWithTooltipProps {
  icon: LucideIcon;
  tooltip: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  iconClassName?: string;
}

export function IconButtonWithTooltip({
  icon: Icon,
  tooltip,
  onClick,
  variant = 'outline',
  disabled = false,
  className,
  side = 'top',
  iconClassName,
}: IconButtonWithTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className={cn('h-9 w-9 shrink-0', className)}
            onClick={onClick}
            disabled={disabled}
          >
            <Icon className={cn('h-4 w-4', iconClassName)} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
