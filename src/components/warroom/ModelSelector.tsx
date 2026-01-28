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
import { Sparkles, Key, AlertCircle, ChevronDown, Check, Cpu, Brain, Atom, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Provider icons and colors
const PROVIDER_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  lovable: { icon: Sparkles, color: 'text-primary', label: 'Lovable AI' },
  openai: { icon: Brain, color: 'text-green-400', label: 'OpenAI' },
  anthropic: { icon: Atom, color: 'text-orange-400', label: 'Anthropic' },
  gemini: { icon: Cpu, color: 'text-blue-400', label: 'Google Gemini' },
  xai: { icon: Zap, color: 'text-purple-400', label: 'xAI (Grok)' },
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
    ['openai', 'anthropic', 'gemini', 'xai'].forEach(provider => {
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

  const selectedProviderConfig = selectedModel 
    ? PROVIDER_CONFIG[selectedModel.provider] 
    : null;

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
            {selectedProviderConfig && (
              <selectedProviderConfig.icon className={cn('h-4 w-4 shrink-0', selectedProviderConfig.color)} />
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
            const config = PROVIDER_CONFIG[group.provider];
            const Icon = config?.icon || Key;
            const isExpanded = expandedProviders.has(group.provider);
            
            return (
              <Collapsible
                key={group.provider}
                open={isExpanded}
                onOpenChange={() => toggleProvider(group.provider)}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-2 text-sm font-medium hover:bg-accent/50 rounded-md transition-colors">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', config?.color || 'text-muted-foreground')} />
                    <span>{config?.label || group.provider}</span>
                    <span className="text-xs text-muted-foreground">({group.models.length})</span>
                  </div>
                  <ChevronDown className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-2 pb-1">
                    {group.models.map((model) => (
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
                      </button>
                    ))}
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
