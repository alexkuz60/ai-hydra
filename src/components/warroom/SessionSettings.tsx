import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Zap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionSettingsProps {
  useHybridStreaming: boolean;
  onHybridStreamingChange: (value: boolean) => void;
  className?: string;
}

export function SessionSettings({
  useHybridStreaming,
  onHybridStreamingChange,
  className,
}: SessionSettingsProps) {
  const { t } = useLanguage();

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Settings className="h-4 w-4" />
        {t('settings.sessionSettings') || 'Настройки сессии'}
      </div>
      
      {/* Hybrid Streaming Toggle */}
      <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Label className="text-sm font-medium cursor-pointer">
              {t('settings.hybridStreaming')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('settings.hybridStreamingDescription')}
            </p>
          </div>
        </div>
        <Switch
          checked={useHybridStreaming}
          onCheckedChange={onHybridStreamingChange}
        />
      </div>
    </div>
  );
}
