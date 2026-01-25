import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAvailableModels, ModelOption } from '@/hooks/useAvailableModels';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Key, AlertCircle, ChevronDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiModelSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export function MultiModelSelector({ value, onChange, className }: MultiModelSelectorProps) {
  const { t } = useLanguage();
  const { isAdmin, lovableModels, personalModels, hasAnyModels, loading } = useAvailableModels();

  const allModels = [...lovableModels, ...personalModels];

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
        <span>{t('warRoom.noApiKeys')}</span>
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
              <span className="text-muted-foreground">{t('warRoom.selectModels')}</span>
            ) : selectedCount === 1 ? (
              <span className="truncate">{selectedModels[0]?.name}</span>
            ) : (
              <span>{t('warRoom.modelsSelected').replace('{count}', String(selectedCount))}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="end">
        <ScrollArea className="max-h-[400px]">
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

            {/* Personal API Key Models */}
            {personalModels.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Key className="h-3 w-3" />
                    {t('warRoom.personalKeys')}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => selectAll(personalModels)}
                  >
                    {personalModels.every(m => value.includes(m.id)) ? t('common.deselectAll') : t('common.selectAll')}
                  </Button>
                </div>
                <div className="space-y-1">
                  {personalModels.map((model) => (
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
