import React from 'react';
import { Cloud, Check, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface CloudSyncIndicatorProps {
  loaded: boolean;
  className?: string;
}

export function CloudSyncIndicator({ loaded, className = '' }: CloudSyncIndicatorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!loaded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${className}`}>
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            <span className="text-xs text-muted-foreground">
              {isRu ? 'Синхронизация...' : 'Syncing...'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isRu ? 'Загрузка настроек с облака' : 'Loading settings from cloud'}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-1 ${className}`}>
          <Cloud className="h-4 w-4 text-hydra-success" />
          <Check className="h-3 w-3 text-hydra-success -ml-1.5" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isRu ? 'Синхронизировано с облаком' : 'Synced with cloud'}</p>
      </TooltipContent>
    </Tooltip>
  );
}
