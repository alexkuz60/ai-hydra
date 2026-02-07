import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Brain, Key, Sparkles, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS, useAvailableModels, type ModelOption } from '@/hooks/useAvailableModels';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const PROVIDER_COLORS: Record<string, string> = {
  lovable: 'text-hydra-cyan',
  openai: 'text-green-400',
  anthropic: 'text-hydra-amber',
  gemini: 'text-blue-400',
  xai: 'text-red-400',
  openrouter: 'text-hydra-purple',
  groq: 'text-orange-400',
  deepseek: 'text-teal-400',
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
        <Badge variant="outline" className={cn("text-xs", providerColor)}>
          {model.provider}
        </Badge>
        {isAvailable ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

export function ModelPortfolio() {
  const { language } = useLanguage();
  const { isAdmin, lovableModels, personalModels, loading } = useAvailableModels();

  const availablePersonalIds = new Set(personalModels.map(m => m.id));
  const isLovableAvailable = isAdmin;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6 max-w-3xl mx-auto">
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

        {/* Built-in models */}
        <TooltipProvider delayDuration={300}>
          <HydraCard variant="default">
            <HydraCardHeader>
              <Sparkles className="h-5 w-5 text-hydra-cyan" />
              <HydraCardTitle>
                {language === 'ru' ? 'Встроенные модели (Lovable AI)' : 'Built-in Models (Lovable AI)'}
              </HydraCardTitle>
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

          {/* BYOK models */}
          <HydraCard variant="default">
            <HydraCardHeader>
              <Key className="h-5 w-5 text-hydra-amber" />
              <HydraCardTitle>
                {language === 'ru' ? 'Модели с личным ключом (BYOK)' : 'Personal Key Models (BYOK)'}
              </HydraCardTitle>
            </HydraCardHeader>
            <HydraCardContent>
              <p className="text-xs text-muted-foreground mb-3">
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
                  <div key={provider} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={cn("text-xs font-semibold uppercase tracking-wider", PROVIDER_COLORS[provider])}>
                        {provider}
                      </h4>
                      {!loading && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn(
                              "w-2 h-2 rounded-full shrink-0",
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
                    <div className="space-y-1">
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
