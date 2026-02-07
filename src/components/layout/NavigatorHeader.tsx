import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { IconButtonWithTooltip } from '@/components/ui/IconButtonWithTooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface NavigatorHeaderProps {
  title?: string;
  isMinimized: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function NavigatorHeader({
  title,
  isMinimized,
  onToggle,
  children,
  className,
}: NavigatorHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className={cn(
      "p-2 border-b border-border flex items-center gap-2 shrink-0",
      isMinimized ? "justify-center" : "justify-between",
      className,
    )}>
      {!isMinimized && title && (
        <span className="text-sm font-medium truncate flex-1">{title}</span>
      )}
      {!isMinimized && children}
      <IconButtonWithTooltip
        icon={isMinimized ? PanelLeftOpen : PanelLeftClose}
        tooltip={isMinimized 
          ? (t('nav.expand') || 'Развернуть') 
          : (t('nav.collapse') || 'Свернуть')}
        onClick={onToggle}
        variant="ghost"
        className="h-7 w-7 shrink-0"
        iconClassName="h-3.5 w-3.5"
        side="right"
      />
    </div>
  );
}
