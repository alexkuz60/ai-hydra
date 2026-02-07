import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Brain, Key, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS, useAvailableModels, type ModelOption } from '@/hooks/useAvailableModels';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

// --- Brand SVG logos ---

function LovableLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="lovable-heart-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(280, 80%, 60%)" />
          <stop offset="40%" stopColor="hsl(350, 90%, 60%)" />
          <stop offset="100%" stopColor="hsl(30, 100%, 55%)" />
        </linearGradient>
      </defs>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="url(#lovable-heart-grad)"
      />
    </svg>
  );
}

function OpenAILogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function AnthropicLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.304 3.541h-3.48l6.175 16.918H23.5zm-10.608 0L.5 20.459h3.572l1.272-3.48h6.534l1.272 3.48h3.572L10.547 3.541zm-.524 10.462l2.244-6.144 2.244 6.144z" />
    </svg>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function XAILogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.8 4l7.2 10.8L2.4 20h1.6l6.4-4.4L16.8 20H22l-7.6-11.2L21.2 4h-1.6L13.6 8.2 7.2 4H2.8zm2.4 1.2h2.4l11.2 13.6h-2.4L5.2 5.2z" />
    </svg>
  );
}

function OpenRouterLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
    </svg>
  );
}

function GroqLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 0 1 7 7h-3a4 4 0 0 0-4-4V5zm0 14a7 7 0 0 1-7-7h3a4 4 0 0 0 4 4v3z" />
    </svg>
  );
}

function DeepSeekLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Map provider to brand icon component
const PROVIDER_LOGOS: Record<string, React.ComponentType<{ className?: string }>> = {
  lovable: LovableLogo,
  openai: OpenAILogo,
  anthropic: AnthropicLogo,
  gemini: GoogleLogo,
  xai: XAILogo,
  openrouter: OpenRouterLogo,
  groq: GroqLogo,
  deepseek: DeepSeekLogo,
};

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
