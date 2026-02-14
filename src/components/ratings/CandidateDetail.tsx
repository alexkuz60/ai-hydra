import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardContent } from '@/components/ui/hydra-card';
import { Badge } from '@/components/ui/badge';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { getModelRegistryEntry, STRENGTH_LABELS } from '@/config/modelRegistry';
import { type ModelOption } from '@/hooks/useAvailableModels';
import { cn } from '@/lib/utils';
import { Brain, Cpu, Calendar, Scale, DollarSign, Check, X, Crown, KeyRound, Globe, ChevronDown, Swords } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { AGENT_ROLES, ROLE_CONFIG, type AgentRole } from '@/config/roles';
import { RoleSelectOptions, RoleDisplay } from '@/components/ui/RoleSelectItem';
import type { DuelType } from '@/hooks/useDuelConfig';

const COLLAPSE_KEY = 'hydra-candidate-detail-open';

interface CandidateDetailProps {
  model: ModelOption;
  isAvailable: boolean;
  isSelectedForContest?: boolean;
  isSelectedForDuel?: boolean;
  duelType?: DuelType;
  contestRole?: string;
  onToggleContest?: (modelId: string) => void;
  onToggleDuel?: (modelId: string) => void;
  onDuelTypeChange?: (modelId: string, type: DuelType) => void;
  onContestRoleChange?: (modelId: string, role: string) => void;
  /** When true, renders inline without scroll wrapper (for embedding in other scrollable containers) */
  inline?: boolean;
}

export function CandidateDetail({
  model,
  isAvailable,
  isSelectedForContest = false,
  isSelectedForDuel = false,
  duelType = 'critic',
  contestRole = '',
  onToggleContest,
  onToggleDuel,
  onDuelTypeChange,
  onContestRoleChange,
  inline = false,
}: CandidateDetailProps) {
  const { language, t } = useLanguage();
  const isRu = language === 'ru';
  const registry = getModelRegistryEntry(model.id);
  const Logo = PROVIDER_LOGOS[model.provider];
  const providerColor = PROVIDER_COLORS[model.provider] || 'text-muted-foreground';

  const [isOpen, setIsOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_KEY);
      return stored !== 'false';
    } catch { return true; }
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    try { localStorage.setItem(COLLAPSE_KEY, String(open)); } catch {}
  };

  const cardContent = (
    <>
      <HydraCard variant="default">
        <HydraCardContent className="pt-1">
              <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
                {/* Header: logo + name + badges + chevron */}
                <CollapsibleTrigger className="flex items-center gap-3 w-full group cursor-pointer py-1">
                  {Logo && (
                    <div className={cn("shrink-0 p-1.5 rounded-lg bg-muted/50", providerColor)}>
                      <Logo className="h-8 w-8" />
                    </div>
                  )}
                  <h2 className="text-lg font-bold truncate flex-1 text-left">
                    {registry?.displayName || model.name}
                  </h2>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={isAvailable ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                      {isAvailable ? (
                        <><Check className="h-3 w-3 mr-0.5" />{isRu ? 'Доступна' : 'Available'}</>
                      ) : (
                        <><X className="h-3 w-3 mr-0.5" />{isRu ? 'Недоступна' : 'Unavailable'}</>
                      )}
                    </Badge>
                    {isSelectedForContest && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-hydra-arbiter/20 text-hydra-arbiter border-hydra-arbiter/30">
                        <Crown className="h-3 w-3 mr-0.5" />
                        {isRu ? 'На подиуме' : 'On podium'}
                      </Badge>
                    )}
                    {isSelectedForDuel && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                        <Swords className="h-3 w-3 mr-0.5" />
                        {isRu ? 'Дуэлянт' : 'Duelist'}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <Separator className="my-2" />
                  <div className="flex gap-0 pt-2">
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

                    {/* Column 3: Podium + Duel controls */}
                    <div className="w-52 shrink-0 pl-4 space-y-2.5">
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
                          <SelectValue placeholder={isRu ? 'Роль...' : 'Role...'}>
                            {contestRole && ROLE_CONFIG[contestRole as AgentRole] ? (
                              <RoleDisplay role={contestRole as AgentRole} className="text-xs [&_svg]:h-3.5 [&_svg]:w-3.5" />
                            ) : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <RoleSelectOptions />
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        variant={isSelectedForContest ? 'default' : 'outline'}
                        className="w-full h-8 text-xs"
                        disabled={!isAvailable}
                        onClick={() => onToggleContest?.(model.id)}
                      >
                        <Crown className="h-3.5 w-3.5 mr-1.5 text-hydra-arbiter" />
                        {isSelectedForContest
                          ? (isRu ? 'Убрать с подиума' : 'Remove from podium')
                          : (isRu ? 'Пригласить на подиум' : 'Invite to podium')}
                      </Button>

                      <Button
                        size="sm"
                        variant={isSelectedForDuel ? 'default' : 'outline'}
                        className="w-full h-8 text-xs"
                        disabled={!isAvailable}
                        onClick={() => onToggleDuel?.(model.id)}
                      >
                        <Swords className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        {isSelectedForDuel
                          ? (isRu ? 'Отменить дуэль' : 'Cancel duel')
                          : (isRu ? 'Вызвать на дуэль' : 'Challenge to duel')}
                      </Button>

                      <div className="flex items-center gap-3 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Checkbox
                            checked={duelType === 'critic'}
                            onCheckedChange={() => onDuelTypeChange?.(model.id, 'critic')}
                            disabled={!isAvailable}
                            className="h-3.5 w-3.5"
                          />
                          <span className="text-muted-foreground">{isRu ? 'Критик' : 'Critic'}</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Checkbox
                            checked={duelType === 'arbiter'}
                            onCheckedChange={() => onDuelTypeChange?.(model.id, 'arbiter')}
                            disabled={!isAvailable}
                            className="h-3.5 w-3.5"
                          />
                          <span className="text-muted-foreground">{isRu ? 'Арбитр' : 'Arbiter'}</span>
                        </label>
                      </div>
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
    </>
  );

  if (inline) {
    return cardContent;
  }

  return (
    <div className="h-full overflow-hidden relative">
      <div className="absolute inset-0 overflow-y-auto hydra-scrollbar">
        <div className="p-4 space-y-4 relative">
          {cardContent}
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
