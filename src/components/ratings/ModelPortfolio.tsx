import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Brain, Key, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS, type ModelOption } from '@/hooks/useAvailableModels';
import { ScrollArea } from '@/components/ui/scroll-area';

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

function ModelRow({ model }: { model: ModelOption }) {
  const providerColor = PROVIDER_COLORS[model.provider] || 'text-muted-foreground';

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Brain className={cn("h-4 w-4 shrink-0", providerColor)} />
        <span className="text-sm font-medium truncate">{model.name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className={cn("text-xs", providerColor)}>
          {model.provider}
        </Badge>
        {model.requiresApiKey && (
          <Key className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

export function ModelPortfolio() {
  const { t, language } = useLanguage();

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6 max-w-3xl mx-auto">
        {/* Built-in models */}
        <HydraCard variant="default">
          <HydraCardHeader>
            <Sparkles className="h-5 w-5 text-hydra-cyan" />
            <HydraCardTitle>
              {language === 'ru' ? 'Встроенные модели (Lovable AI)' : 'Built-in Models (Lovable AI)'}
            </HydraCardTitle>
          </HydraCardHeader>
          <HydraCardContent>
            <p className="text-xs text-muted-foreground mb-3">
              {language === 'ru' 
                ? 'Доступны только администратору. Не требуют API-ключей.'
                : 'Admin-only. No API keys required.'}
            </p>
            <div className="space-y-1">
              {LOVABLE_AI_MODELS.map(model => (
                <ModelRow key={model.id} model={model} />
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
                ? 'Требуют настройки API-ключа в профиле.'
                : 'Require API key configuration in profile.'}
            </p>
            {/* Group by provider */}
            {Object.entries(
              PERSONAL_KEY_MODELS.reduce<Record<string, ModelOption[]>>((acc, m) => {
                (acc[m.provider] ??= []).push(m);
                return acc;
              }, {})
            ).map(([provider, models]) => (
              <div key={provider} className="mb-4 last:mb-0">
                <h4 className={cn("text-xs font-semibold uppercase tracking-wider mb-2", PROVIDER_COLORS[provider])}>
                  {provider}
                </h4>
                <div className="space-y-1">
                  {models.map(model => (
                    <ModelRow key={model.id} model={model} />
                  ))}
                </div>
              </div>
            ))}
          </HydraCardContent>
        </HydraCard>
      </div>
    </ScrollArea>
  );
}
