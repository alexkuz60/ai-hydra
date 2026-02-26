import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { ModelOption, getProviderOrder } from '@/hooks/useAvailableModels';
import { useCollapsedProviders } from '@/hooks/useCollapsedProviders';
import { cn } from '@/lib/utils';
import { getCompactPriceLabel } from '@/lib/modelPricing';
import { ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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

interface DChatModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  availableModels: ModelOption[];
  proxyapiPriority?: boolean;
}

export function DChatModelSelector({ selectedModel, onSelectModel, availableModels, proxyapiPriority = false }: DChatModelSelectorProps) {
  const { t } = useLanguage();
  const { isCollapsed: getCollapsed, toggle: toggleProvider } = useCollapsedProviders('dchat-model-collapsed');
  const [searchQuery, setSearchQuery] = useState('');

  const q = searchQuery.toLowerCase().trim();

  const grouped = useMemo(() => {
    const map = new Map<string, ModelOption[]>();
    availableModels
      .filter(m => !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
      .forEach(m => {
        const list = map.get(m.provider) || [];
        list.push(m);
        map.set(m.provider, list);
      });
    return map;
  }, [availableModels, q]);

  const providerOrder = getProviderOrder(proxyapiPriority);
  const sel = availableModels.find(m => m.id === selectedModel);

  const toggleGroup = (provider: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleProvider(provider);
  };

  return (
    <div className="p-2 border-b border-border">
      <Select value={selectedModel} onValueChange={onSelectModel}>
        <SelectTrigger className="h-8 text-xs min-w-0 [&>span]:!flex [&>span]:items-center [&>span]:gap-1.5 [&>span]:min-w-0 [&>span]:overflow-hidden">
          {(() => {
            if (!sel) return <SelectValue placeholder={t('dchat.selectModel')} />;
            const Logo = PROVIDER_LOGOS[sel.provider];
            const color = PROVIDER_COLORS[sel.provider] || 'text-muted-foreground';
            return (
              <span className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                {Logo && <Logo className={cn('h-3.5 w-3.5 shrink-0', color)} />}
                <span className="truncate whitespace-nowrap">{sel.name}</span>
              </span>
            );
          })()}
        </SelectTrigger>
        <SelectContent className="min-w-[320px]">
          <div className="px-2 pb-1.5 pt-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder={t('common.search') + '...'}
                value={searchQuery}
                onChange={(e) => { e.stopPropagation(); setSearchQuery(e.target.value); }}
                onKeyDown={(e) => e.stopPropagation()}
                className="h-6 text-xs pl-6 bg-transparent"
              />
            </div>
          </div>
          {providerOrder.filter(p => grouped.has(p)).map(provider => {
            const models = grouped.get(provider)!;
            const Logo = PROVIDER_LOGOS[provider];
            const color = PROVIDER_COLORS[provider] || 'text-muted-foreground';
            const collapsedState = getCollapsed(provider, models.length > 4 && !models.some(m => m.id === selectedModel));
            return (
              <SelectGroup key={provider}>
                <SelectLabel
                  className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-sm mx-1 px-2 py-1 cursor-pointer hover:bg-muted transition-colors"
                  onMouseDown={(e) => toggleGroup(provider, e)}
                >
                  <ChevronRight className={cn('h-3 w-3 transition-transform', !collapsedState && 'rotate-90')} />
                  {Logo && <Logo className={cn('h-3.5 w-3.5', color)} />}
                  {PROVIDER_LABELS[provider] || provider}
                  <span className="ml-auto text-[10px] opacity-60">{models.length}</span>
                </SelectLabel>
                {!collapsedState && models.map(model => {
                  const price = getCompactPriceLabel(model.id, provider);
                  return (
                    <SelectItem key={model.id} value={model.id} className="text-xs">
                      <span className="flex items-center justify-between w-full gap-2">
                        <span className="truncate">{model.name}</span>
                        {price && <span className="text-[10px] text-muted-foreground shrink-0">{price}</span>}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
