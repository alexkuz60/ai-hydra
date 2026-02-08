import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardContent } from '@/components/ui/hydra-card';
import { Badge } from '@/components/ui/badge';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { getModelRegistryEntry, STRENGTH_LABELS } from '@/config/modelRegistry';
import { type ModelOption } from '@/hooks/useAvailableModels';
import { cn } from '@/lib/utils';
import { Brain, Cpu, Calendar, Scale, DollarSign, Check, X, Crown, KeyRound, Globe, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AGENT_ROLES, ROLE_CONFIG, type AgentRole } from '@/config/roles';

interface CandidateDetailProps {
  model: ModelOption;
  isAvailable: boolean;
  isSelectedForContest?: boolean;
  contestRole?: string;
  onToggleContest?: (modelId: string) => void;
  onContestRoleChange?: (modelId: string, role: string) => void;
}

export function CandidateDetail({
  model,
  isAvailable,
  isSelectedForContest = false,
  contestRole = '',
  onToggleContest,
  onContestRoleChange,
}: CandidateDetailProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const registry = getModelRegistryEntry(model.id);
  const Logo = PROVIDER_LOGOS[model.provider];
  const providerColor = PROVIDER_COLORS[model.provider] || 'text-muted-foreground';

  return (
    <div className="h-full overflow-hidden relative">
      <div className="absolute inset-0 overflow-y-auto hydra-scrollbar">
        <div className="p-4 space-y-4 relative">
          <HydraCard variant="default">
            <HydraCardContent className="pt-4">
              <Collapsible defaultOpen>
                {/* Collapsible header: logo + name + chevron */}
                <CollapsibleTrigger className="flex items-center gap-4 w-full group cursor-pointer">
                  {Logo && (
                    <div className={cn("shrink-0 p-2 rounded-xl bg-muted/50", providerColor)}>
                      <Logo className="h-10 w-10" />
                    </div>
                  )}
                  <h2 className="text-xl font-bold truncate flex-1 text-left">
                    {registry?.displayName || model.name}
                  </h2>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-4">
                  <div className="flex gap-0">
                    {/* Column 1: Info rows */}
                    {registry && (
                      <div className="flex-1 min-w-0 pr-4 border-r border-border">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                          <InfoRow icon={Cpu} label={isRu ? 'Создатель' : 'Creator'} value={registry.creator} />
                          <InfoRow icon={Calendar} label={isRu ? 'Дата выпуска' : 'Released'} value={registry.releaseDate} />
                          <InfoRow icon={Scale} label={isRu ? 'Параметры' : 'Parameters'} value={registry.parameterCount} />
                          <InfoRow icon={DollarSign} label={isRu ? 'Тарифы' : 'Pricing'} value={formatPricing(registry.pricing)} />
                          <InfoRow
                            icon={KeyRound}
                            label={isRu ? 'Тип' : 'Type'}
                            value={model.requiresApiKey ? 'BYOK' : 'Lovable AI'}
                          />
                          <InfoRow icon={Globe} label={isRu ? 'Провайдер' : 'Provider'} value={model.provider} />
                        </div>
                      </div>
                    )}

                    {/* Column 2: Strengths badges */}
                    {registry?.strengths && registry.strengths.length > 0 && (
                      <div className="px-4 border-r border-border">
                        <div className="flex flex-col flex-wrap gap-1.5 max-h-36">
                          {registry.strengths.map(s => (
                            <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0 whitespace-nowrap">
                              {STRENGTH_LABELS[s]?.[isRu ? 'ru' : 'en'] || s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Column 3: Podium controls */}
                    <div className="w-52 shrink-0 pl-4 space-y-2.5">
                      <Badge variant={isAvailable ? 'default' : 'secondary'} className="w-fit">
                        {isAvailable ? (
                          <><Check className="h-3 w-3 mr-1" />{isRu ? 'Доступна' : 'Available'}</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" />{isRu ? 'Недоступна' : 'Unavailable'}</>
                        )}
                      </Badge>

                      {!isAvailable && model.requiresApiKey && (
                        <p className="text-[10px] text-muted-foreground p-1.5 rounded bg-muted/30">
                          {isRu ? 'Добавьте API-ключ в профиле' : 'Add API key in profile'}
                        </p>
                      )}

                      <Select
                        value={contestRole}
                        onValueChange={(v) => onContestRoleChange?.(model.id, v)}
                        disabled={!isAvailable}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={isRu ? 'Роль...' : 'Role...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {AGENT_ROLES.map(role => {
                            const config = ROLE_CONFIG[role];
                            const Icon = config.icon;
                            return (
                              <SelectItem key={role} value={role} className="text-xs">
                                <div className="flex items-center gap-1.5">
                                  <Icon className={cn("h-3.5 w-3.5", config.color)} />
                                  <span>{isRu ? config.label.replace('roles.', '') : role}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        variant={isSelectedForContest ? 'default' : 'outline'}
                        className="w-full h-8 text-xs"
                        disabled={!isAvailable}
                        onClick={() => onToggleContest?.(model.id)}
                      >
                        <Crown className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                        {isSelectedForContest
                          ? (isRu ? 'Убрать с подиума' : 'Remove from podium')
                          : (isRu ? 'Пригласить на подиум' : 'Invite to podium')}
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </HydraCardContent>
          </HydraCard>

          {!registry && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {isRu ? 'Подробная информация о модели пока недоступна' : 'Detailed model info not yet available'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
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
