import React, { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAvailableModels, ModelOption, getProviderOrder } from '@/hooks/useAvailableModels';
import { useCollapsedProviders } from '@/hooks/useCollapsedProviders';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertCircle, ChevronDown, ChevronRight, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCompactPriceLabel } from '@/lib/modelPricing';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Hide Lovable AI models entirely (e.g. for interview where BYOK is required) */
  excludeLovableAI?: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  lovable: 'Lovable AI',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  xai: 'xAI (Grok)',
  openrouter: 'OpenRouter',
  groq: 'Groq (Fast)',
  deepseek: 'DeepSeek',
  mistral: 'Mistral AI',
  proxyapi: 'ProxyAPI',
  dotpoint: 'DotPoint',
};

const PROVIDER_BADGES: Record<string, { label: string; className: string } | undefined> = {
  groq: { label: '⚡ Fast', className: 'bg-hydra-warning/10 text-hydra-warning border-hydra-warning/30' },
  proxyapi: { label: '🇷🇺 Gateway', className: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  dotpoint: { label: '🇷🇺 Gateway', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
};

function getOpenRouterBadge(modelId: string) {
  if (modelId.includes(':free')) {
    return { label: 'FREE', className: 'bg-hydra-success/10 text-hydra-success border-hydra-success/30' };
  }
  return { label: '💎 Premium', className: 'bg-violet-500/10 text-violet-400 border-violet-500/30' };
}

export function ModelSelector({ value, onChange, className, excludeLovableAI }: ModelSelectorProps) {
  const { t } = useLanguage();
  const { isAdmin, proxyapiPriority, lovableModels, personalModels, hasAnyModels, loading } = useAvailableModels();
  const { isCollapsed: getCollapsed, toggle: toggleProvider } = useCollapsedProviders('single-model-collapsed');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allModels = [...lovableModels, ...personalModels];

  const providerGroups = useMemo(() => {
    const order = getProviderOrder(proxyapiPriority);
    const q = searchQuery.toLowerCase().trim();

    const available = [
      ...(!excludeLovableAI && isAdmin ? lovableModels : []),
      ...(excludeLovableAI ? personalModels : [...(!isAdmin ? [] : []), ...personalModels]),
    ].filter(m => !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));

    // Deduplicate
    const seen = new Set<string>();
    const deduped = available.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    const grouped = new Map<string, ModelOption[]>();
    deduped.forEach(m => {
      const list = grouped.get(m.provider) || [];
      list.push(m);
      grouped.set(m.provider, list);
    });

    return order
      .filter(p => grouped.has(p))
      .map(provider => ({
        provider,
        label: PROVIDER_LABELS[provider] || provider,
        models: grouped.get(provider)!,
      }));
  }, [isAdmin, lovableModels, personalModels, excludeLovableAI, proxyapiPriority, searchQuery]);

  const selectedModel = useMemo(() => allModels.find(m => m.id === value), [value, allModels]);

  const handleSelect = (modelId: string) => {
    onChange(modelId);
    setOpen(false);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className={cn('w-[220px] justify-between', className)}>
        <span className="text-muted-foreground">{t('common.loading')}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  const effectiveHasModels = excludeLovableAI ? personalModels.length > 0 : hasAnyModels;

  if (!effectiveHasModels) {
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
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearchQuery(''); }}>
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
      <PopoverContent className="w-[420px] p-0" align="start">
        {/* Search */}
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t('common.search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 text-xs pl-7 bg-transparent"
            />
          </div>
        </div>

        <ScrollArea className="h-[55vh] max-h-[450px]">
          <div className="p-2">
            {providerGroups.map(({ provider, label, models }) => {
              const Logo = PROVIDER_LOGOS[provider];
              const color = PROVIDER_COLORS[provider] || 'text-muted-foreground';
              const badge = PROVIDER_BADGES[provider];

              const hasSelected = models.some(m => m.id === value);
              const defaultClosed = !hasSelected && models.length > 3;
              const collapsed = searchQuery ? false : getCollapsed(provider, defaultClosed);

              return (
                <Collapsible key={provider} open={!collapsed} onOpenChange={() => !searchQuery && toggleProvider(provider)} className="mb-1">
                  <div className="flex items-center px-2 py-1">
                    <CollapsibleTrigger className={cn('flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity group', color)}>
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-90" />
                      {Logo && <Logo className="h-4 w-4" />}
                      {label}
                      <span className="text-xs text-muted-foreground">({models.length})</span>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="space-y-0.5 ml-2">
                      {models.map((model) => {
                        const modelBadge = provider === 'openrouter'
                          ? getOpenRouterBadge(model.id)
                          : badge;
                        const isSelected = value === model.id;

                        return (
                          <button
                            key={model.id}
                            onClick={() => handleSelect(model.id)}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                              'hover:bg-accent hover:text-accent-foreground',
                              isSelected && 'bg-accent text-accent-foreground'
                            )}
                          >
                            <Check className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                            <span className="truncate flex-1 text-left">{model.name}</span>
                            {(() => {
                              const price = getCompactPriceLabel(model.id, provider);
                              if (price) return (
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{price}</span>
                              );
                              return null;
                            })()}
                            {modelBadge && (
                              <Badge variant="outline" className={cn('text-[10px]', modelBadge.className)}>
                                {modelBadge.label}
                              </Badge>
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
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
