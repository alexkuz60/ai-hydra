import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { getModelRegistryEntry, STRENGTH_LABELS } from '@/config/modelRegistry';
import { type ModelOption } from '@/hooks/useAvailableModels';
import { cn } from '@/lib/utils';
import { Brain, Cpu, Calendar, Scale, DollarSign, Sparkles, Check, X } from 'lucide-react';

interface CandidateDetailProps {
  model: ModelOption;
  isAvailable: boolean;
}

export function CandidateDetail({ model, isAvailable }: CandidateDetailProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const registry = getModelRegistryEntry(model.id);
  const Logo = PROVIDER_LOGOS[model.provider];
  const providerColor = PROVIDER_COLORS[model.provider] || 'text-muted-foreground';

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Header card */}
        <HydraCard variant="default">
          <HydraCardContent className="pt-5">
            <div className="flex items-start gap-4">
              {Logo && (
                <div className={cn("shrink-0 p-2 rounded-xl bg-muted/50", providerColor)}>
                  <Logo className="h-12 w-12" />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold truncate">
                    {registry?.displayName || model.name}
                  </h2>
                  <Badge variant={isAvailable ? 'default' : 'secondary'} className="shrink-0">
                    {isAvailable ? (
                      <><Check className="h-3 w-3 mr-1" />{isRu ? 'Доступна' : 'Available'}</>
                    ) : (
                      <><X className="h-3 w-3 mr-1" />{isRu ? 'Недоступна' : 'Unavailable'}</>
                    )}
                  </Badge>
                </div>

                {registry && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <InfoRow icon={Cpu} label={isRu ? 'Создатель' : 'Creator'} value={registry.creator} />
                    <InfoRow icon={Calendar} label={isRu ? 'Дата выпуска' : 'Released'} value={registry.releaseDate} />
                    <InfoRow icon={Scale} label={isRu ? 'Параметры' : 'Parameters'} value={registry.parameterCount} />
                    <InfoRow icon={DollarSign} label={isRu ? 'Тарифы' : 'Pricing'} value={formatPricing(registry.pricing)} />
                  </div>
                )}

                {registry?.strengths && registry.strengths.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {registry.strengths.map(s => (
                      <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {STRENGTH_LABELS[s]?.[isRu ? 'ru' : 'en'] || s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </HydraCardContent>
        </HydraCard>

        {/* Access info */}
        <HydraCard variant="default">
          <HydraCardHeader className="py-3">
            <Sparkles className="h-5 w-5 text-hydra-cyan" />
            <HydraCardTitle>{isRu ? 'Доступ' : 'Access'}</HydraCardTitle>
          </HydraCardHeader>
          <HydraCardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{isRu ? 'Тип:' : 'Type:'}</span>
                <span className="font-medium">
                  {model.requiresApiKey
                    ? (isRu ? 'Личный API-ключ (BYOK)' : 'Personal API Key (BYOK)')
                    : (isRu ? 'Встроенная (Lovable AI)' : 'Built-in (Lovable AI)')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{isRu ? 'Провайдер:' : 'Provider:'}</span>
                <span className={cn("font-medium", providerColor)}>{model.provider}</span>
              </div>
              {!isAvailable && model.requiresApiKey && (
                <p className="text-xs text-muted-foreground mt-2 p-2 rounded-lg bg-muted/30">
                  {isRu
                    ? 'Для активации добавьте API-ключ провайдера в разделе профиля.'
                    : 'Add the provider API key in your profile to activate this model.'}
                </p>
              )}
            </div>
          </HydraCardContent>
        </HydraCard>

        {/* No registry data fallback */}
        {!registry && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {isRu ? 'Подробная информация о модели пока недоступна' : 'Detailed model info not yet available'}
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

function formatPricing(pricing: { input: string; output: string } | 'free' | 'included' | undefined): string {
  if (!pricing) return '—';
  if (pricing === 'free') return 'Free';
  if (pricing === 'included') return 'Included';
  return `${pricing.input} / ${pricing.output}`;
}
