import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface TimeoutSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function TimeoutSlider({
  value,
  onChange,
  min = 30,
  max = 240,
  disabled = false,
}: TimeoutSliderProps) {
  const { t } = useLanguage();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return secs > 0 ? `${mins}м ${secs}с` : `${mins}м`;
    }
    return `${secs}с`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "h-9 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground",
            "border border-transparent hover:border-border/50"
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono">{formatTime(value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('settings.timeout')}</span>
            <span className="text-sm font-mono text-primary">{formatTime(value)}</span>
          </div>
          
          <Slider
            value={[value]}
            onValueChange={([val]) => onChange(val)}
            min={min}
            max={max}
            step={30}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(min)}</span>
            <span>{formatTime(max)}</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {t('settings.timeoutDescription')}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
