import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Spline, 
  ChevronDown,
  ArrowRight,
  MoveRight,
  CornerDownRight,
  Minus,
} from 'lucide-react';

import {
  EdgeLineType,
  EdgeMarkerType,
  EdgeStyleSettings,
  EDGE_LINE_OPTIONS,
  EDGE_MARKER_OPTIONS,
} from '@/types/edgeTypes';

interface EdgeStyleSelectorProps {
  settings: EdgeStyleSettings;
  onSettingsChange: (settings: EdgeStyleSettings) => void;
  syncLoaded?: boolean;
}

const LINE_TYPE_ICONS: Record<EdgeLineType, React.ReactNode> = {
  bezier: <Spline className="h-4 w-4" />,
  smoothstep: <CornerDownRight className="h-4 w-4" />,
  step: <MoveRight className="h-4 w-4" />,
  straight: <Minus className="h-4 w-4" />,
};

export function EdgeStyleSelector({ settings, onSettingsChange, syncLoaded = true }: EdgeStyleSelectorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleLineTypeChange = (lineType: EdgeLineType) => {
    onSettingsChange({ ...settings, defaultLineType: lineType });
  };

  const handleMarkerTypeChange = (markerType: EdgeMarkerType) => {
    onSettingsChange({ ...settings, defaultMarkerType: markerType });
  };

  const handleAnimatedChange = (animated: boolean) => {
    onSettingsChange({ ...settings, defaultAnimated: animated });
  };

  const handleDirectionStylesChange = (show: boolean) => {
    onSettingsChange({ ...settings, showDirectionStyles: show });
  };

  const currentLineOption = EDGE_LINE_OPTIONS.find(o => o.value === settings.defaultLineType);
  const currentMarkerOption = EDGE_MARKER_OPTIONS.find(o => o.value === settings.defaultMarkerType);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          {LINE_TYPE_ICONS[settings.defaultLineType]}
          <span className="hidden md:inline">
            {isRu ? 'Стиль связей' : 'Edge Style'}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {isRu ? 'Тип линии' : 'Line Type'}
        </DropdownMenuLabel>
        {EDGE_LINE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleLineTypeChange(option.value)}
            className="gap-2"
          >
            {LINE_TYPE_ICONS[option.value]}
            <span className="flex-1">{isRu ? option.labelRu : option.label}</span>
            {settings.defaultLineType === option.value && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>
          {isRu ? 'Тип стрелки' : 'Arrow Type'}
        </DropdownMenuLabel>
        {EDGE_MARKER_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleMarkerTypeChange(option.value)}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            <span className="flex-1">{isRu ? option.labelRu : option.label}</span>
            {settings.defaultMarkerType === option.value && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        
        <DropdownMenuCheckboxItem
          checked={settings.defaultAnimated}
          onCheckedChange={handleAnimatedChange}
        >
          {isRu ? 'Анимация потока' : 'Flow Animation'}
        </DropdownMenuCheckboxItem>
        
        <DropdownMenuCheckboxItem
          checked={settings.showDirectionStyles}
          onCheckedChange={handleDirectionStylesChange}
        >
          {isRu ? 'Стили направления' : 'Direction Styles'}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
