import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { ModelOption, getProviderOrder } from '@/hooks/useAvailableModels';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = new Map<string, ModelOption[]>();
  availableModels.forEach(m => {
    const list = grouped.get(m.provider) || [];
    list.push(m);
    grouped.set(m.provider, list);
  });

  const providerOrder = getProviderOrder(proxyapiPriority);
  const sel = availableModels.find(m => m.id === selectedModel);

  const toggleGroup = (provider: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCollapsed(prev => ({ ...prev, [provider]: !prev[provider] }));
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
        <SelectContent>
          {providerOrder.filter(p => grouped.has(p)).map(provider => {
            const models = grouped.get(provider)!;
            const Logo = PROVIDER_LOGOS[provider];
            const color = PROVIDER_COLORS[provider] || 'text-muted-foreground';
            const isCollapsed = collapsed[provider] ?? (models.length > 4 && !models.some(m => m.id === selectedModel));
            return (
              <SelectGroup key={provider}>
                <SelectLabel
                  className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-sm mx-1 px-2 py-1 cursor-pointer hover:bg-muted transition-colors"
                  onMouseDown={(e) => toggleGroup(provider, e)}
                >
                  <ChevronRight className={cn('h-3 w-3 transition-transform', !isCollapsed && 'rotate-90')} />
                  {Logo && <Logo className={cn('h-3.5 w-3.5', color)} />}
                  {PROVIDER_LABELS[provider] || provider}
                  <span className="ml-auto text-[10px] opacity-60">{models.length}</span>
                </SelectLabel>
                {!isCollapsed && models.map(model => (
                  <SelectItem key={model.id} value={model.id} className="text-xs">
                    {model.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
