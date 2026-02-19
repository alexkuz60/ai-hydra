import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAvailableModels, ModelOption, PERSONAL_KEY_MODELS, LOVABLE_AI_MODELS, ALL_VALID_MODEL_IDS } from '@/hooks/useAvailableModels';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, ChevronDown, Users, Gift, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUnavailableModelIds, clearModelCache } from '@/lib/modelAvailabilityCache';
import { PROVIDER_LOGOS, PROVIDER_COLORS, LovableLogo, GroqLogo, OpenRouterLogo } from '@/components/ui/ProviderLogos';

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

// Provider display config for paid model subgroups
const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  xai: 'xAI (Grok)',
  deepseek: 'DeepSeek',
  mistral: 'Mistral AI',
  proxyapi: 'ProxyAPI',
};

// Order of provider subgroups
const PROVIDER_ORDER = ['openai', 'anthropic', 'gemini', 'xai', 'deepseek', 'mistral', 'proxyapi'];

interface ProviderGroup {
  provider: string;
  label: string;
  models: ModelOption[];
}

export function MultiModelSelector({ value, onChange, className }: MultiModelSelectorProps) {
  const { t } = useLanguage();
  const { isAdmin, lovableModels, personalModels, hasAnyModels, loading } = useAvailableModels();
  
  // Track cache version to trigger re-computation of unavailable models
  const [cacheVersion, setCacheVersion] = useState(0);
  
  // Get list of temporarily unavailable models (cached from errors) - recompute on cache change
  const unavailableModelIds = useMemo(() => getUnavailableModelIds(), [cacheVersion]);

  const allModels = [...lovableModels, ...personalModels];

  // Get available models by category, filtering out unavailable ones
  const availableFreeModels = FREE_OPENROUTER_MODELS
    .filter(m => personalModels.some(p => p.id === m.id))
    .filter(m => !unavailableModelIds.includes(m.id));
  const availableGroqModels = GROQ_MODELS
    .filter(m => personalModels.some(p => p.id === m.id))
    .filter(m => !unavailableModelIds.includes(m.id));
  const availablePaidModels = PAID_MODELS
    .filter(m => personalModels.some(p => p.id === m.id))
    .filter(m => !unavailableModelIds.includes(m.id));

  // Group paid models by provider
  const paidProviderGroups = useMemo<ProviderGroup[]>(() => {
    const groups: ProviderGroup[] = [];
    for (const provider of PROVIDER_ORDER) {
      const models = availablePaidModels.filter(m => m.provider === provider);
      if (models.length > 0) {
        groups.push({
          provider,
          label: PROVIDER_LABELS[provider] || provider,
          models,
        });
      }
    }
    return groups;
  }, [availablePaidModels]);

  // Auto-cleanup deprecated/unavailable model IDs from value
  useEffect(() => {
    if (value.length === 0) return;
    
    // Filter out both deprecated AND temporarily unavailable models
    const validValues = value.filter(id => 
      ALL_VALID_MODEL_IDS.includes(id) && !unavailableModelIds.includes(id)
    );
    if (validValues.length !== value.length) {
      onChange(validValues);
    }
  }, [unavailableModelIds]);
  
  // Handler to clear the cache and refresh - uses state update instead of page reload
  const handleClearCache = useCallback(() => {
    clearModelCache();
    setCacheVersion(v => v + 1);
    // Force re-render by updating with same value
    onChange([...value]);
  }, [onChange, value]);

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

  // Render a provider group section
  const renderProviderGroup = (
    icon: React.ReactNode,
    label: string,
    models: ModelOption[],
    colorClass: string,
    badgeContent?: React.ReactNode,
  ) => (
    <div className="mb-3">
      <div className="flex items-center justify-between px-2 py-1.5">
        <div className={cn('flex items-center gap-2 text-sm font-medium', colorClass)}>
          {icon}
          {label}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => selectAll(models)}
        >
          {models.every(m => value.includes(m.id)) ? t('common.deselectAll') : t('common.selectAll')}
        </Button>
      </div>
      <div className="space-y-1">
        {models.map((model) => (
          <label
            key={model.id}
            className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
          >
            <Checkbox
              checked={value.includes(model.id)}
              onCheckedChange={() => toggleModel(model.id)}
            />
            <span className="text-sm truncate flex-1">{model.name}</span>
            {badgeContent}
          </label>
        ))}
      </div>
    </div>
  );

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
            {lovableModels.length > 0 && renderProviderGroup(
              <LovableLogo className="h-4 w-4" />,
              'Lovable AI',
              lovableModels,
              'text-primary',
            )}

            {/* Free OpenRouter Models */}
            {availableFreeModels.length > 0 && renderProviderGroup(
              <OpenRouterLogo className={cn('h-4 w-4', PROVIDER_COLORS.openrouter)} />,
              'Free Models',
              availableFreeModels,
              'text-hydra-success',
              <Badge variant="outline" className="text-[10px] bg-hydra-success/10 text-hydra-success border-hydra-success/30">
                FREE
              </Badge>,
            )}

            {/* Groq Models - Ultra Fast */}
            {availableGroqModels.length > 0 && renderProviderGroup(
              <GroqLogo className={cn('h-4 w-4', PROVIDER_COLORS.groq)} />,
              'Groq (Fast)',
              availableGroqModels,
              'text-hydra-warning',
              <Badge variant="outline" className="text-[10px] bg-hydra-warning/10 text-hydra-warning border-hydra-warning/30">
                ⚡ Fast
              </Badge>,
            )}

            {/* Paid Personal API Key Models - grouped by provider */}
            {paidProviderGroups.map((group) => {
              const Logo = PROVIDER_LOGOS[group.provider];
              const color = PROVIDER_COLORS[group.provider] || 'text-muted-foreground';
              return (
                <React.Fragment key={group.provider}>
                  {renderProviderGroup(
                    Logo ? <Logo className={cn('h-4 w-4', color)} /> : null,
                    group.label,
                    group.models,
                    color,
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer with cache reset and selected models summary */}
        <div className="border-t p-2 space-y-2">
          {/* Reset cache button if there are unavailable models */}
          {unavailableModelIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={handleClearCache}
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              {t('models.resetCache')} ({unavailableModelIds.length})
            </Button>
          )}
          
          {/* Selected Models Summary */}
          {selectedCount > 0 && (
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
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
