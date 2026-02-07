import React, { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAvailableModels, ModelOption } from '@/hooks/useAvailableModels';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Key, AlertCircle, ChevronDown, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Provider labels
const PROVIDER_LABELS: Record<string, string> = {
  lovable: 'Lovable AI',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  xai: 'xAI (Grok)',
  openrouter: 'OpenRouter (Free)',
  groq: 'Groq (Fast)',
  deepseek: 'DeepSeek',
};

interface GroupedModels {
  provider: string;
  models: ModelOption[];
}

export function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  const { t } = useLanguage();
  const { isAdmin, lovableModels, personalModels, hasAnyModels, loading } = useAvailableModels();
  const [open, setOpen] = useState(false);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set(['lovable', 'openai']));

  // Group models by provider
  const groupedModels = useMemo(() => {
    const groups: GroupedModels[] = [];
    
    // Lovable AI models first (admin only)
    if (lovableModels.length > 0) {
      groups.push({ provider: 'lovable', models: lovableModels });
    }
    
    // Group personal models by provider
    const providerMap = new Map<string, ModelOption[]>();
    personalModels.forEach(model => {
      const existing = providerMap.get(model.provider) || [];
      existing.push(model);
      providerMap.set(model.provider, existing);
    });
    
    // Add in specific order
    ['openai', 'anthropic', 'gemini', 'xai', 'groq', 'openrouter'].forEach(provider => {
      const models = providerMap.get(provider);
      if (models && models.length > 0) {
        groups.push({ provider, models });
      }
    });
    
    return groups;
  }, [lovableModels, personalModels]);

  // Find selected model info
  const selectedModel = useMemo(() => {
    const allModels = [...lovableModels, ...personalModels];
    return allModels.find(m => m.id === value);
  }, [value, lovableModels, personalModels]);

  const toggleProvider = (provider: string) => {
    setExpandedProviders(prev => {
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
      }
      return next;
    });
  };

  const handleSelect = (modelId: string) => {
    onChange(modelId);
    setOpen(false);
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className={cn('w-[220px] justify-between', className)}>
        <span className="text-muted-foreground">{t('common.loading')}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
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

  const SelectedLogo = selectedModel ? PROVIDER_LOGOS[selectedModel.provider] : null;
  const selectedColor = selectedModel ? (PROVIDER_COLORS[selectedModel.provider] || 'text-muted-foreground') : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[220px] justify-between', className)}
        >
          <div className="flex items-center gap-2 truncate">
            {SelectedLogo && (
              <SelectedLogo className={cn('h-4 w-4 shrink-0', selectedColor)} />
            )}
            <span className="truncate">
              {selectedModel?.name || t('models.selectModel')}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 max-h-[400px] overflow-y-auto" align="start">
        <div className="p-1">
          {groupedModels.map((group) => {
            const Logo = PROVIDER_LOGOS[group.provider] || Key;
            const color = PROVIDER_COLORS[group.provider] || 'text-muted-foreground';
            const label = PROVIDER_LABELS[group.provider] || group.provider;
            const isExpanded = expandedProviders.has(group.provider);
            
            return (
              <Collapsible
                key={group.provider}
                open={isExpanded}
                onOpenChange={() => toggleProvider(group.provider)}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-2 text-sm font-medium hover:bg-accent/50 rounded-md transition-colors">
                  <div className="flex items-center gap-2">
                    <Logo className={cn('h-4 w-4', color)} />
                    <span>{label}</span>
                    <span className="text-xs text-muted-foreground">({group.models.length})</span>
                  </div>
                  <ChevronDown className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-2 pb-1">
                    {group.models.map((model) => {
                      const isFree = model.id.endsWith(':free');
                      const isFast = model.provider === 'groq';
                      return (
                        <button
                          key={model.id}
                          onClick={() => handleSelect(model.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                            'hover:bg-accent hover:text-accent-foreground',
                            value === model.id && 'bg-accent text-accent-foreground'
                          )}
                        >
                          <Check className={cn(
                            'h-4 w-4 shrink-0',
                            value === model.id ? 'opacity-100' : 'opacity-0'
                          )} />
                          <span className="truncate">{model.name}</span>
                          {isFast && (
                            <span className="ml-auto shrink-0 flex items-center gap-0.5 rounded bg-hydra-warning/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-hydra-warning">
                              <Zap className="h-3 w-3" />
                              Fast
                            </span>
                          )}
                          {isFree && (
                            <span className="ml-auto shrink-0 rounded bg-hydra-success/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-hydra-success">
                              Free
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
