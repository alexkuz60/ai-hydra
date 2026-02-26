import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAvailableModels, ModelOption, PERSONAL_KEY_MODELS, LOVABLE_AI_MODELS, ALL_VALID_MODEL_IDS, getProviderOrder } from '@/hooks/useAvailableModels';
import { useEnsureRecommendedModels } from '@/hooks/useEnsureRecommendedModels';
import { ROLE_RECOMMENDED_MODELS } from '@/config/roles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, ChevronDown, Users, RefreshCw, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUnavailableModelIds, clearModelCache } from '@/lib/modelAvailabilityCache';
import { PROVIDER_LOGOS, PROVIDER_COLORS, LovableLogo, GroqLogo, OpenRouterLogo, DotPointLogo } from '@/components/ui/ProviderLogos';

interface MultiModelSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

// Provider display labels
const PROVIDER_LABELS: Record<string, string> = {
  lovable: 'Lovable AI',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  xai: 'xAI (Grok)',
  groq: 'Groq (Fast)',
  deepseek: 'DeepSeek',
  mistral: 'Mistral AI',
  openrouter: 'OpenRouter',
  proxyapi: 'ProxyAPI',
  dotpoint: 'DotPoint',
};

// Badge config per provider
const PROVIDER_BADGES: Record<string, { label: string; className: string } | undefined> = {
  groq: { label: '⚡ Fast', className: 'bg-hydra-warning/10 text-hydra-warning border-hydra-warning/30' },
  proxyapi: { label: '🇷🇺 Gateway', className: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  dotpoint: { label: '🇷🇺 Gateway', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
};

// OpenRouter sub-badges
function getOpenRouterBadge(modelId: string) {
  if (modelId.includes(':free')) {
    return { label: 'FREE', className: 'bg-hydra-success/10 text-hydra-success border-hydra-success/30' };
  }
  return { label: '💎 Premium', className: 'bg-violet-500/10 text-violet-400 border-violet-500/30' };
}

export function MultiModelSelector({ value, onChange, className }: MultiModelSelectorProps) {
  const { t } = useLanguage();
  const { isAdmin, proxyapiPriority, lovableModels, personalModels, hasAnyModels, loading } = useAvailableModels();
  
  // Auto-ensure recommended OpenRouter models are in user list
  const hasOpenRouter = personalModels.some(m => m.provider === 'openrouter');
  useEnsureRecommendedModels(hasOpenRouter);

  // Build set of recommended model IDs for badge display
  const recommendedModelIds = useMemo(() => {
    const ids = new Set<string>();
    for (const models of Object.values(ROLE_RECOMMENDED_MODELS)) {
      if (models) models.forEach(m => ids.add(m.modelId));
    }
    return ids;
  }, []);
  
  const [cacheVersion, setCacheVersion] = useState(0);
  const unavailableModelIds = useMemo(() => getUnavailableModelIds(), [cacheVersion]);

  const allModels = [...lovableModels, ...personalModels];

  // Build provider groups in priority order, filtering out unavailable models
  const providerGroups = useMemo(() => {
    const order = getProviderOrder(proxyapiPriority);
    const availableModels = [
      ...(isAdmin ? lovableModels : []),
      ...personalModels,
    ].filter(m => !unavailableModelIds.includes(m.id));

    // Group by provider
    const grouped = new Map<string, ModelOption[]>();
    availableModels.forEach(m => {
      const list = grouped.get(m.provider) || [];
      list.push(m);
      grouped.set(m.provider, list);
    });

    // Return ordered groups
    return order
      .filter(p => grouped.has(p))
      .map(provider => ({
        provider,
        label: PROVIDER_LABELS[provider] || provider,
        models: grouped.get(provider)!,
      }));
  }, [isAdmin, lovableModels, personalModels, unavailableModelIds, proxyapiPriority]);

  // Auto-cleanup deprecated/unavailable model IDs from value
  useEffect(() => {
    if (value.length === 0) return;
    const validValues = value.filter(id => 
      ALL_VALID_MODEL_IDS.includes(id) && !unavailableModelIds.includes(id)
    );
    if (validValues.length !== value.length) {
      onChange(validValues);
    }
  }, [unavailableModelIds]);
  
  const handleClearCache = useCallback(() => {
    clearModelCache();
    setCacheVersion(v => v + 1);
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
            {providerGroups.map(({ provider, label, models }) => {
              const Logo = PROVIDER_LOGOS[provider];
              const color = PROVIDER_COLORS[provider] || 'text-muted-foreground';
              const badge = PROVIDER_BADGES[provider];

              return (
                <div key={provider} className="mb-3">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <div className={cn('flex items-center gap-2 text-sm font-medium', color)}>
                      {Logo && <Logo className="h-4 w-4" />}
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
                    {models.map((model) => {
                      // For openrouter, use per-model badge (free vs premium)
                      const modelBadge = provider === 'openrouter' 
                        ? getOpenRouterBadge(model.id) 
                        : badge;
                      const isRecommended = recommendedModelIds.has(model.id);

                      return (
                        <label
                          key={model.id}
                          className={cn(
                            "flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer",
                            isRecommended && "ring-1 ring-amber-500/30 bg-amber-500/5"
                          )}
                        >
                          <Checkbox
                            checked={value.includes(model.id)}
                            onCheckedChange={() => toggleModel(model.id)}
                          />
                          <span className="text-sm truncate flex-1">
                            {isRecommended && <Star className="inline h-3 w-3 mr-1 text-amber-400" />}
                            {model.name}
                          </span>
                          {isRecommended && (
                            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                              ★ Rec
                            </Badge>
                          )}
                          {modelBadge && (
                            <Badge variant="outline" className={cn('text-[10px]', modelBadge.className)}>
                              {modelBadge.label}
                            </Badge>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-2 space-y-2">
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
