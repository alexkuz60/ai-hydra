import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModelDossier, type ModelDossierData } from '@/hooks/useModelDossier';
import { STRENGTH_LABELS } from '@/config/modelRegistry';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { ROLE_CONFIG, type AgentRole } from '@/config/roles';
import { ModelNameWithIcon } from '@/components/ui/ModelNameWithIcon';
import { cn } from '@/lib/utils';
import { 
  Brain, Calendar, Scale, Cpu, Sparkles, DollarSign, 
  Swords, ClipboardList, MessageSquare, AlertTriangle,
  Crown, Trophy, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ru as ruLocale, enUS } from 'date-fns/locale';

interface ModelDossierProps {
  modelId: string;
}

export function ModelDossier({ modelId }: ModelDossierProps) {
  const { language } = useLanguage();
  const dossier = useModelDossier(modelId);
  const isRu = language === 'ru';

  if (dossier.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const { registry, stats, statsRoleDistribution, roleDistribution, taskHistory, duels } = dossier;
  const provider = registry?.provider || 'openai';
  const Logo = PROVIDER_LOGOS[provider];
  const providerColor = PROVIDER_COLORS[provider] || 'text-muted-foreground';

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* ── Reference Card ── */}
        <HydraCard variant="default">
          <HydraCardContent className="pt-5">
            <div className="flex items-start gap-4">
              {Logo && (
                <div className={cn("shrink-0 p-2 rounded-xl bg-muted/50", providerColor)}>
                  <Logo className="h-12 w-12" />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <h2 className="text-xl font-bold truncate">
                  {registry?.displayName || modelId}
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <InfoRow icon={Cpu} label={isRu ? 'Создатель' : 'Creator'} value={registry?.creator || '—'} />
                  <InfoRow icon={Calendar} label={isRu ? 'Дата выпуска' : 'Released'} value={registry?.releaseDate || '—'} />
                  <InfoRow icon={Scale} label={isRu ? 'Параметры' : 'Parameters'} value={registry?.parameterCount || '—'} />
                  <InfoRow icon={DollarSign} label={isRu ? 'Тарифы' : 'Pricing'} value={formatPricing(registry?.pricing)} />
                </div>
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

        {/* ── Statistics ── */}
        <HydraCard variant="default">
          <HydraCardHeader className="py-3">
            <Trophy className="h-5 w-5 text-primary" />
            <HydraCardTitle>{isRu ? 'Статистика участия' : 'Participation Stats'}</HydraCardTitle>
          </HydraCardHeader>
          <HydraCardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCell label={isRu ? 'Ответов' : 'Responses'} value={stats.totalResponses} icon={MessageSquare} />
              <StatCell label={isRu ? 'Brains' : 'Brains'} value={stats.totalBrains} icon={Brain} color="text-primary" />
              <StatCell label={isRu ? 'Откл.' : 'Dismissed'} value={stats.totalDismissals} />
              <StatCell 
                label={isRu ? 'Оценок Арбитра' : 'Arbiter Evals'} 
                value={stats.arbiterEvalCount} 
                icon={Scale}
                suffix={stats.arbiterEvalCount > 0 ? ` (ø${stats.arbiterAvgScore.toFixed(1)})` : ''}
              />
              <StatCell label={isRu ? 'Конкурсов' : 'Contests'} value={stats.contestCount} icon={Crown} />
              <StatCell label={isRu ? 'Балл конкурсов' : 'Contest Score'} value={stats.contestTotalScore} icon={Sparkles} />
              <StatCell label={isRu ? 'Галлюцинации' : 'Hallucinations'} value={stats.totalHallucinations} icon={AlertTriangle} color="text-destructive" />
            </div>
            {stats.firstUsedAt && (
              <p className="text-xs text-muted-foreground mt-3">
                {isRu ? 'Первое использование: ' : 'First used: '}
                {format(new Date(stats.firstUsedAt), 'dd MMM yyyy', { locale: isRu ? ruLocale : enUS })}
              </p>
            )}
          </HydraCardContent>
        </HydraCard>

        {/* ── Role Distribution (from model_statistics) ── */}
        {statsRoleDistribution.length > 0 && (
          <HydraCard variant="default">
            <HydraCardHeader className="py-3">
              <Sparkles className="h-5 w-5 text-hydra-cyan" />
              <HydraCardTitle>{isRu ? 'Распределение ролей' : 'Role Distribution'}</HydraCardTitle>
            </HydraCardHeader>
            <HydraCardContent>
              <div className="space-y-2.5">
                {statsRoleDistribution.map(rd => {
                  const config = ROLE_CONFIG[rd.role as AgentRole] || ROLE_CONFIG.assistant;
                  const RoleIcon = config.icon;
                  return (
                    <div key={rd.role} className="flex items-center gap-3">
                      <RoleIcon className={cn("h-4 w-4 shrink-0", config.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate">{config.label.replace('role.', '')}</span>
                          <span className="text-muted-foreground text-xs">{rd.responseCount} ({rd.percentage}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/50 mt-1">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${rd.percentage}%`,
                              backgroundColor: `hsl(var(--primary))`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </HydraCardContent>
          </HydraCard>
        )}

        {/* ── Duels ── */}
        {duels.length > 0 && (
          <HydraCard variant="default">
            <HydraCardHeader className="py-3">
              <Swords className="h-5 w-5 text-hydra-amber" />
              <HydraCardTitle>{isRu ? 'Дуэли в Д-чате' : 'D-Chat Duels'}</HydraCardTitle>
            </HydraCardHeader>
            <HydraCardContent>
              <div className="space-y-2">
                {duels.slice(0, 10).map((duel, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs text-muted-foreground">vs</span>
                      <ModelNameWithIcon modelName={duel.opponentModelId} className="text-sm" iconSize="h-3.5 w-3.5" />
                    </div>
                    <Badge 
                      variant={duel.result === 'win' ? 'default' : 'secondary'}
                      className={cn(
                        "text-[10px]",
                        duel.result === 'win' && 'bg-green-500/20 text-green-400 border-green-500/30',
                        duel.result === 'loss' && 'bg-red-500/20 text-red-400 border-red-500/30',
                        duel.result === 'draw' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {duel.result === 'win' ? (isRu ? 'Победа' : 'Win') :
                       duel.result === 'loss' ? (isRu ? 'Поражение' : 'Loss') :
                       (isRu ? 'Ничья' : 'Draw')}
                    </Badge>
                  </div>
                ))}
              </div>
            </HydraCardContent>
          </HydraCard>
        )}

        {/* ── Task History ── */}
        {taskHistory.length > 0 && (
          <HydraCard variant="default">
            <HydraCardHeader className="py-3">
              <ClipboardList className="h-5 w-5 text-hydra-cyan" />
              <HydraCardTitle>{isRu ? 'Послужной список' : 'Task History'}</HydraCardTitle>
            </HydraCardHeader>
            <HydraCardContent>
              <div className="space-y-2">
                {taskHistory.slice(0, 10).map(t => {
                  const config = ROLE_CONFIG[t.role as AgentRole] || ROLE_CONFIG.assistant;
                  const RoleIcon = config.icon;
                  return (
                    <div key={t.sessionId} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30">
                      <RoleIcon className={cn("h-3.5 w-3.5 shrink-0", config.color)} />
                      <span className="text-sm truncate flex-1">{t.sessionTitle}</span>
                      <span className="text-xs text-muted-foreground">{t.responseCount} {isRu ? 'отв.' : 'resp.'}</span>
                    </div>
                  );
                })}
              </div>
            </HydraCardContent>
          </HydraCard>
        )}

        {/* ── Critique Summary ── */}
        {stats.critiqueSummary && (
          <HydraCard variant="default">
            <HydraCardHeader className="py-3">
              <FileText className="h-5 w-5 text-hydra-critic" />
              <HydraCardTitle>{isRu ? 'Критика' : 'Critique'}</HydraCardTitle>
            </HydraCardHeader>
            <HydraCardContent>
              <p className="text-sm text-muted-foreground italic">"{stats.critiqueSummary}"</p>
            </HydraCardContent>
          </HydraCard>
        )}

        {/* Empty state */}
        {stats.totalResponses === 0 && roleDistribution.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {isRu ? 'Нет данных об участии этой модели в задачах' : 'No task participation data for this model'}
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ── Helpers ──

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

function StatCell({ label, value, icon: Icon, color, suffix }: {
  label: string;
  value: number;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  suffix?: string;
}) {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/30">
      <div className={cn("text-lg font-bold", color || 'text-foreground')}>
        {Icon && <Icon className={cn("h-4 w-4 inline mr-1 -mt-0.5", color)} />}
        {value}{suffix}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function formatPricing(pricing: { input: string; output: string } | 'free' | 'included' | undefined): string {
  if (!pricing) return '—';
  if (pricing === 'free') return 'Free';
  if (pricing === 'included') return 'Included';
  return `${pricing.input} / ${pricing.output}`;
}
