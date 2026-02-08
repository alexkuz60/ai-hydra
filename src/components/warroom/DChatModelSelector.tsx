import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { ModelOption } from '@/hooks/useAvailableModels';
import { cn } from '@/lib/utils';

const PROVIDER_LABELS: Record<string, string> = {
  lovable: 'Lovable AI',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  xai: 'xAI (Grok)',
  openrouter: 'OpenRouter (Free)',
  groq: 'Groq (Fast)',
  deepseek: 'DeepSeek',
  mistral: 'Mistral AI',
};

const PROVIDER_ORDER = ['lovable', 'openai', 'anthropic', 'gemini', 'xai', 'groq', 'deepseek', 'mistral', 'openrouter'];

interface DChatModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  availableModels: ModelOption[];
}

export function DChatModelSelector({ selectedModel, onSelectModel, availableModels }: DChatModelSelectorProps) {
  const { t } = useLanguage();

  const grouped = new Map<string, ModelOption[]>();
  availableModels.forEach(m => {
    const list = grouped.get(m.provider) || [];
    list.push(m);
    grouped.set(m.provider, list);
  });

  const sel = availableModels.find(m => m.id === selectedModel);

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
          {PROVIDER_ORDER.filter(p => grouped.has(p)).map(provider => {
            const models = grouped.get(provider)!;
            const Logo = PROVIDER_LOGOS[provider];
            const color = PROVIDER_COLORS[provider] || 'text-muted-foreground';
            return (
              <SelectGroup key={provider}>
                <SelectLabel className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-sm mx-1 px-2 py-1">
                  {Logo && <Logo className={cn('h-3.5 w-3.5', color)} />}
                  {PROVIDER_LABELS[provider] || provider}
                </SelectLabel>
                {models.map(model => (
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
