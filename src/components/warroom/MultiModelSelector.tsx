import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAvailableModels, ModelOption, PERSONAL_KEY_MODELS } from '@/hooks/useAvailableModels';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Key, AlertCircle, ChevronDown, Users, Gift, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiModelSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

// Get free OpenRouter models
const FREE_OPENROUTER_MODELS = PERSONAL_KEY_MODELS.filter(
  m => m.provider === 'openrouter' && m.id.includes(':free')
);

// Get Groq models
const GROQ_MODELS = PERSONAL_KEY_MODELS.filter(m => m.provider === 'groq');

// Get paid models (excluding free OpenRouter and Groq)
const PAID_MODELS = PERSONAL_KEY_MODELS.filter(
  m => m.provider !== 'openrouter' && m.provider !== 'groq'
);

export function MultiModelSelector({ value, onChange, className }: MultiModelSelectorProps) {
  const { t } = useLanguage();
  const { isAdmin, lovableModels, personalModels, hasAnyModels, loading } = useAvailableModels();

  const allModels = [...lovableModels, ...personalModels];

  // Get available models by category
  const availableFreeModels = FREE_OPENROUTER_MODELS.filter(m => personalModels.some(p => p.id === m.id));
  const availableGroqModels = GROQ_MODELS.filter(m => personalModels.some(p => p.id === m.id));
  const availablePaidModels = PAID_MODELS.filter(m => personalModels.some(p => p.id === m.id));

  const toggleModel = (modelId: string) => {
    if (value.includes(modelId)) {
      onChange(value.filter(id => id !== modelId));
    } else {
      onChange([...value, modelId]);
    }
  };

  const selectAll = (models: ModelOption[]) => {
    const modelIds = models.map(m => m.id);
    const allSelected = modelIds.every(id => value.includes(id));
    if (allSelected) {
      onChange(value.filter(id => !modelIds.includes(id)));
    } else {
      onChange([...new Set([...value, ...modelIds])]);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className={cn('min-w-[200px]', className)}>
        {t('common.loading')}
      </Button>
    );
  }

  if (!hasAnyModels) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 text-hydra-critical" />
        <span>{t('models.noApiKeys')}</span>
      </div>
    );
  }

  const selectedCount = value.length;
  const selectedModels = allModels.filter(m => value.includes(m.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn('min-w-[200px] justify-between', className)}
        >
          <div className="flex items-center gap-2 truncate">
            <Users className="h-4 w-4 shrink-0" />
            {selectedCount === 0 ? (
              <span className="text-muted-foreground">{t('tasks.modelSelector')}</span>
            ) : selectedCount === 1 ? (
              <span className="truncate">{selectedModels[0]?.name}</span>
            ) : (
              <span>{t('models.modelsSelected').replace('{count}', String(selectedCount))}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="end">
        <ScrollArea className="h-[60vh] max-h-[500px]">
          <div className="p-2">
            {/* Lovable AI Models (Admin only) */}
            {lovableModels.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Sparkles className="h-3 w-3" />
                    Lovable AI
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => selectAll(lovableModels)}
                  >
                    {lovableModels.every(m => value.includes(m.id)) ? t('common.deselectAll') : t('common.selectAll')}
                  </Button>
                </div>
                <div className="space-y-1">
                  {lovableModels.map((model) => (
                    <label
                      key={model.id}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={value.includes(model.id)}
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                      <span className="text-sm truncate">{model.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Free OpenRouter Models - Individual Selection */}
            {availableFreeModels.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-hydra-success">
                    <Gift className="h-3 w-3" />
                    Free Models
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => selectAll(availableFreeModels)}
                  >
                    {availableFreeModels.every(m => value.includes(m.id)) ? t('common.deselectAll') : t('common.selectAll')}
                  </Button>
                </div>
                <div className="space-y-1">
                  {availableFreeModels.map((model) => (
                    <label
                      key={model.id}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={value.includes(model.id)}
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                      <span className="text-sm truncate flex-1">{model.name}</span>
                      <Badge variant="outline" className="text-[10px] bg-hydra-success/10 text-hydra-success border-hydra-success/30">
                        FREE
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Groq Models - Ultra Fast */}
            {availableGroqModels.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-hydra-warning">
                    <Zap className="h-3 w-3" />
                    Groq (Fast)
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => selectAll(availableGroqModels)}
                  >
                    {availableGroqModels.every(m => value.includes(m.id)) ? t('common.deselectAll') : t('common.selectAll')}
                  </Button>
                </div>
                <div className="space-y-1">
                  {availableGroqModels.map((model) => (
                    <label
                      key={model.id}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={value.includes(model.id)}
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                      <span className="text-sm truncate flex-1">{model.name}</span>
                      <Badge variant="outline" className="text-[10px] bg-hydra-warning/10 text-hydra-warning border-hydra-warning/30">
                        ⚡ Fast
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Paid Personal API Key Models */}
            {availablePaidModels.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Key className="h-3 w-3" />
                    {t('models.personalKeys')}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => selectAll(availablePaidModels)}
                  >
                    {availablePaidModels.every(m => value.includes(m.id)) ? t('common.deselectAll') : t('common.selectAll')}
                  </Button>
                </div>
                <div className="space-y-1">
                  {availablePaidModels.map((model) => (
                    <label
                      key={model.id}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={value.includes(model.id)}
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                      <span className="text-sm truncate">{model.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Selected Models Summary */}
        {selectedCount > 0 && (
          <div className="border-t p-2">
            <div className="flex flex-wrap gap-1">
              {selectedModels.slice(0, 3).map(model => (
                <Badge key={model.id} variant="secondary" className="text-xs">
                  {model.name.split(' ')[0]}
                </Badge>
              ))}
              {selectedCount > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{selectedCount - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
