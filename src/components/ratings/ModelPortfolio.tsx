import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Brain, Key, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS, useAvailableModels, type ModelOption } from '@/hooks/useAvailableModels';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';

const PROVIDER_LABELS: Record<string, { ru: string; en: string }> = {
  lovable: { ru: 'Lovable AI', en: 'Lovable AI' },
  openai: { ru: 'OpenAI', en: 'OpenAI' },
  anthropic: { ru: 'Anthropic', en: 'Anthropic' },
  gemini: { ru: 'Google Gemini', en: 'Google Gemini' },
  xai: { ru: 'xAI (Grok)', en: 'xAI (Grok)' },
  openrouter: { ru: 'OpenRouter', en: 'OpenRouter' },
  groq: { ru: 'Groq', en: 'Groq' },
  deepseek: { ru: 'DeepSeek', en: 'DeepSeek' },
};

function ModelRow({ model, isAvailable }: { model: ModelOption; isAvailable: boolean }) {
  const providerColor = PROVIDER_COLORS[model.provider] || 'text-muted-foreground';

  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg transition-colors",
      isAvailable ? "hover:bg-muted/30" : "opacity-50 hover:bg-muted/10"
    )}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Brain className={cn("h-4 w-4 shrink-0", providerColor)} />
        <span className="text-sm font-medium truncate">{model.name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isAvailable ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

function ProviderHeader({ provider, hasKey, loading, language }: { 
  provider: string; hasKey: boolean; loading: boolean; language: string;
}) {
  const Logo = PROVIDER_LOGOS[provider];
  const label = PROVIDER_LABELS[provider]?.[language === 'ru' ? 'ru' : 'en'] || provider;
  const color = PROVIDER_COLORS[provider];

  return (
    <div className="flex items-center gap-3 mb-3 py-2">
      {Logo && (
        <div className={cn("shrink-0", color)}>
          <Logo className="h-7 w-7" />
        </div>
      )}
      <h4 className={cn("text-sm font-semibold tracking-wide", color)}>
        {label}
      </h4>
      {!loading && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0",
              hasKey ? "bg-green-500" : "bg-muted-foreground/40"
            )} />
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {hasKey
              ? (language === 'ru' ? 'API-ключ настроен' : 'API key configured')
              : (language === 'ru' ? 'API-ключ не найден' : 'No API key found')}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function ModelPortfolio() {
  const { language } = useLanguage();
  const { isAdmin, personalModels, loading } = useAvailableModels();

  const availablePersonalIds = new Set(personalModels.map(m => m.id));
  const isLovableAvailable = isAdmin;

  const LovableLogo = PROVIDER_LOGOS.lovable;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Summary */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-hydra-cyan">
                {(isLovableAvailable ? LOVABLE_AI_MODELS.length : 0) + availablePersonalIds.size}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Доступно вам' : 'Available to you'}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-muted-foreground">
                {LOVABLE_AI_MODELS.length + PERSONAL_KEY_MODELS.length}
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Всего в каталоге' : 'Total in catalog'}
              </div>
            </div>
          </div>
        )}

        <TooltipProvider delayDuration={300}>
          {/* Built-in models */}
          <HydraCard variant="default">
            <HydraCardHeader className="py-3">
              <div className="flex items-center gap-3 flex-1">
                {LovableLogo && <LovableLogo className="h-8 w-8 shrink-0" />}
                <HydraCardTitle className="text-hydra-cyan">
                  {language === 'ru' ? 'Встроенные модели — Lovable AI' : 'Built-in Models — Lovable AI'}
                </HydraCardTitle>
              </div>
              {!loading && (
                <Badge variant={isLovableAvailable ? 'default' : 'secondary'} className="ml-auto text-xs">
                  {isLovableAvailable
                    ? (language === 'ru' ? 'Доступны' : 'Available')
                    : (language === 'ru' ? 'Только админ' : 'Admin only')}
                </Badge>
              )}
            </HydraCardHeader>
            <HydraCardContent>
              <div className="space-y-1">
                {LOVABLE_AI_MODELS.map(model => (
                  <ModelRow key={model.id} model={model} isAvailable={isLovableAvailable} />
                ))}
              </div>
            </HydraCardContent>
          </HydraCard>

          {/* BYOK models grouped by provider */}
          <HydraCard variant="default">
            <HydraCardHeader className="py-3">
              <Key className="h-6 w-6 text-hydra-amber" />
              <HydraCardTitle>
                {language === 'ru' ? 'Модели с личным ключом (BYOK)' : 'Personal Key Models (BYOK)'}
              </HydraCardTitle>
            </HydraCardHeader>
            <HydraCardContent>
              <p className="text-xs text-muted-foreground mb-4">
                {language === 'ru'
                  ? 'Добавьте API-ключ провайдера в профиле для активации.'
                  : 'Add provider API key in your profile to activate.'}
              </p>
              {Object.entries(
                PERSONAL_KEY_MODELS.reduce<Record<string, ModelOption[]>>((acc, m) => {
                  (acc[m.provider] ??= []).push(m);
                  return acc;
                }, {})
              ).map(([provider, models]) => {
                const hasKey = models.some(m => availablePersonalIds.has(m.id));
                return (
                  <div key={provider} className="mb-5 last:mb-0">
                    <ProviderHeader provider={provider} hasKey={hasKey} loading={loading} language={language} />
                    <div className="space-y-1 pl-10">
                      {models.map(model => (
                        <ModelRow key={model.id} model={model} isAvailable={availablePersonalIds.has(model.id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </HydraCardContent>
          </HydraCard>
        </TooltipProvider>
      </div>
    </ScrollArea>
  );
}
