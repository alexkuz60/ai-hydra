import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Lightbulb, ChevronDown, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModelOption } from '@/hooks/useAvailableModels';

interface ConsultantSelectorProps {
  availableModels: ModelOption[];
  selectedConsultant: string | null;
  onSelectConsultant: (modelId: string | null) => void;
  onSendToConsultant: () => void;
  disabled?: boolean;
  sending?: boolean;
  hasMessage?: boolean;
}

export function ConsultantSelector({
  availableModels,
  selectedConsultant,
  onSelectConsultant,
  onSendToConsultant,
  disabled = false,
  sending = false,
  hasMessage = false,
}: ConsultantSelectorProps) {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);

  const selectedModel = availableModels.find(m => m.id === selectedConsultant);

  const handleSelect = (modelId: string) => {
    onSelectConsultant(modelId);
    setOpen(false);
  };

  const handleSend = () => {
    if (selectedConsultant && hasMessage) {
      onSendToConsultant();
    }
  };

  if (availableModels.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 h-9 px-3 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10",
              selectedConsultant && "bg-amber-500/10 border-amber-500/50"
            )}
            disabled={disabled}
          >
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline text-xs">
              {selectedModel ? selectedModel.name : t('consultant.select')}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {t('consultant.selectModel')}
            </div>
            {availableModels.map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelect(model.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-amber-500/10",
                  selectedConsultant === model.id && "bg-amber-500/20 text-amber-400"
                )}
              >
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span className="truncate">{model.name}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {selectedConsultant && (
        <Button
          onClick={handleSend}
          disabled={disabled || sending || !hasMessage}
          size="sm"
          className="h-9 gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
          variant="outline"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">{t('consultant.askOnly')}</span>
        </Button>
      )}
    </div>
  );
}
