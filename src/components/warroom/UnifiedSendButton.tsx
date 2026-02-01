import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, ChevronDown, Lightbulb, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { ModelOption } from '@/hooks/useAvailableModels';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UnifiedSendButtonProps {
  onSendToAll: () => void;
  onSendToConsultant: () => void;
  sending: boolean;
  disabled: boolean;
  hasMessage: boolean;
  selectedModelsCount: number;
  // Consultant
  availableModels: ModelOption[];
  selectedConsultant: string | null;
  onSelectConsultant: (id: string | null) => void;
}

export function UnifiedSendButton({
  onSendToAll,
  onSendToConsultant,
  sending,
  disabled,
  hasMessage,
  selectedModelsCount,
  availableModels,
  selectedConsultant,
  onSelectConsultant,
}: UnifiedSendButtonProps) {
  const { t } = useLanguage();
  const [open, setOpen] = React.useState(false);

  const selectedModel = availableModels.find(m => m.id === selectedConsultant);

  const handleSendToAll = () => {
    onSendToAll();
    setOpen(false);
  };

  const handleSendToConsultant = () => {
    if (selectedConsultant && hasMessage) {
      onSendToConsultant();
      setOpen(false);
    }
  };

  const handleSelectConsultant = (modelId: string) => {
    onSelectConsultant(modelId);
  };

  // If no consultant selected, show simple send button
  if (!selectedConsultant) {
    return (
      <div className="flex items-center">
        <Button
          onClick={onSendToAll}
          disabled={disabled}
          className="hydra-glow-sm rounded-r-none"
          size="lg"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              <Send className="h-5 w-5" />
            </>
          )}
        </Button>
        
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="lg"
              className="rounded-l-none border-l border-primary-foreground/20 px-2"
              disabled={sending}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={handleSendToAll}
              disabled={disabled}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              <span>{t('send.toAllExperts')} ({selectedModelsCount})</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {t('consultant.selectModel')}
            </div>
            
            {availableModels.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => handleSelectConsultant(model.id)}
                className={cn(
                  "gap-2",
                  selectedConsultant === model.id && "bg-amber-500/20 text-amber-400"
                )}
              >
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span className="truncate">{model.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // With consultant selected, show split button
  return (
    <div className="flex items-center">
      {/* Primary action: Send to consultant */}
      <Button
        onClick={handleSendToConsultant}
        disabled={sending || !hasMessage}
        className={cn(
          "rounded-r-none gap-2",
          "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
        )}
        variant="outline"
        size="lg"
      >
        {sending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Lightbulb className="h-4 w-4" />
            <Send className="h-5 w-5" />
          </>
        )}
      </Button>
      
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className={cn(
              "rounded-l-none border-l-0 px-2",
              "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
            )}
            disabled={sending}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={handleSendToAll}
            disabled={disabled}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            <span>{t('send.toAllExperts')} ({selectedModelsCount})</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => onSelectConsultant(null)}
            className="gap-2 text-muted-foreground"
          >
            <span>{t('consultant.deselect')}</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {t('consultant.selectModel')}
          </div>
          
          {availableModels.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleSelectConsultant(model.id)}
              className={cn(
                "gap-2",
                selectedConsultant === model.id && "bg-amber-500/20 text-amber-400"
              )}
            >
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span className="truncate">{model.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
