import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModelDossier } from '@/hooks/useModelDossier';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ROLE_CONFIG, type AgentRole } from '@/config/roles';
import { ModelNameWithIcon } from '@/components/ui/ModelNameWithIcon';
import { cn } from '@/lib/utils';
import { 
  Brain, Sparkles, 
  Swords, ClipboardList, MessageSquare, AlertTriangle,
  Crown, Trophy, FileText, Scale, Radar
} from 'lucide-react';
import { CandidateDetail } from './CandidateDetail';
import { LikertSummaryCard } from './LikertSummaryCard';
import { getModelInfo, type ModelOption } from '@/hooks/useAvailableModels';
import { format } from 'date-fns';
import { ru as ruLocale, enUS } from 'date-fns/locale';
import { getCriterionLabel } from './i18n';

interface ModelDossierProps {
  modelId: string;
  contestModels?: Record<string, string>;
  duelModels?: Record<string, string>;
  onToggleContest?: (modelId: string) => void;
  onToggleDuel?: (modelId: string) => void;
  onDuelTypeChange?: (modelId: string, type: string) => void;
  onContestRoleChange?: (modelId: string, role: string) => void;
}

export function ModelDossier({ modelId, contestModels = {}, duelModels = {}, onToggleContest, onToggleDuel, onDuelTypeChange, onContestRoleChange }: ModelDossierProps) {
  const { language } = useLanguage();
  const dossier = useModelDossier(modelId);
  const isRu = language === 'ru';
  const [criteriaFilter, setCriteriaFilter] = useState<'all' | 'contest' | 'duel_critic' | 'duel_arbiter'>('all');

  if (dossier.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const { registry, stats, statsRoleDistribution, taskHistory, duels } = dossier;

  // Build ModelOption for CandidateDetail
  const modelInfo = getModelInfo(modelId);
  const modelOption: ModelOption = {
    id: modelId,
    name: registry?.displayName || modelId,
    provider: (modelInfo.provider || 'openai') as ModelOption['provider'],
    requiresApiKey: !modelInfo.isLovable,
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* ── Reference Card (reusing CandidateDetail) ── */}
        <CandidateDetail
          model={modelOption}
          isAvailable={true}
          isSelectedForContest={modelId in contestModels}
          isSelectedForDuel={modelId in duelModels}
          duelType={(duelModels[modelId] as any) || 'critic'}
          contestRole={contestModels[modelId] || ''}
          onToggleContest={onToggleContest}
          onToggleDuel={onToggleDuel}
          onDuelTypeChange={onDuelTypeChange}
          onContestRoleChange={onContestRoleChange}
          inline
        />

        {/* ── Statistics ── */}
        <HydraCard variant="default">
          <HydraCardHeader className="py-3">
            <Trophy className="h-5 w-5 text-primary" />
            <HydraCardTitle>{isRu ? 'Статистика участия' : 'Participation Stats'}</HydraCardTitle>
          </HydraCardHeader>
          <HydraCardContent>
            <div className="flex flex-wrap items-center gap-2">
              <StatBadge icon={MessageSquare} value={stats.totalResponses} label={isRu ? 'отв.' : 'resp.'} />
              <StatBadge icon={Brain} value={stats.totalBrains} label="brains" color="text-primary" />
              {stats.totalDismissals > 0 && (
                <StatBadge value={stats.totalDismissals} label={isRu ? 'откл.' : 'dism.'} />
              )}
              {stats.arbiterEvalCount > 0 && (
                <StatBadge icon={Scale} value={stats.arbiterEvalCount} label={`ø${stats.arbiterAvgScore.toFixed(1)}`} />
              )}
              {stats.contestCount > 0 && (
                <StatBadge icon={Crown} value={stats.contestCount} label={isRu ? 'конк.' : 'cont.'} />
              )}
              {stats.contestTotalScore > 0 && (
                <StatBadge icon={Sparkles} value={stats.contestTotalScore} label={isRu ? 'баллы' : 'score'} />
              )}
              {stats.totalHallucinations > 0 && (
                <StatBadge icon={AlertTriangle} value={stats.totalHallucinations} label={isRu ? 'галл.' : 'hall.'} color="text-destructive" />
              )}
              {stats.firstUsedAt && (
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {isRu ? 'с ' : 'since '}
                  {format(new Date(stats.firstUsedAt), 'dd.MM.yy', { locale: isRu ? ruLocale : enUS })}
                </span>
              )}
            </div>
          </HydraCardContent>
        </HydraCard>

        {/* ── Criteria Averages ── */}
        {Object.keys(stats.criteriaAverages).length > 0 && (
          <HydraCard variant="default">
            <HydraCardHeader className="py-3">
              <Radar className="h-5 w-5 text-hydra-arbiter" />
              <HydraCardTitle>{isRu ? 'Профиль по критериям' : 'Criteria Profile'}</HydraCardTitle>
            </HydraCardHeader>
            <HydraCardContent>
              {/* Filter chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {['all', 'contest', 'duel_critic', 'duel_arbiter'].map(filter => {
                  const labels = {
                    all: { ru: 'Все', en: 'All' },
                    contest: { ru: 'Конкурс', en: 'Contest' },
                    duel_critic: { ru: 'Дуэль (Критик)', en: 'Duel (Critic)' },
                    duel_arbiter: { ru: 'Дуэль (Арбитр)', en: 'Duel (Arbiter)' },
                  };
                  const label = labels[filter as keyof typeof labels][isRu ? 'ru' : 'en'];
                  const isActive = criteriaFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setCriteriaFilter(filter as any)}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Filtered criteria */}
              <div className="space-y-2">
                {Object.entries(stats.criteriaAverages)
                  .filter(([key]) => {
                    if (criteriaFilter === 'all') return true;
                    return key.startsWith(`${criteriaFilter}:`);
                  })
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, avg]) => {
                    // Strip prefix for display
                    const displayKey = key.includes(':') ? key.split(':')[1] : key;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-28 truncate shrink-0">
                          {getCriterionLabel(displayKey, isRu)}
                        </span>
                        <div className="flex-1 h-2.5 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-hydra-arbiter/70 transition-all duration-500"
                            style={{ width: `${Math.min(avg * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-8 text-right">{avg.toFixed(1)}</span>
                      </div>
                    );
                  })}
                {Object.entries(stats.criteriaAverages).filter(([key]) => {
                  if (criteriaFilter === 'all') return true;
                  return key.startsWith(`${criteriaFilter}:`);
                }).length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    {isRu ? 'Нет данных для этого фильтра' : 'No data for this filter'}
                  </p>
                )}
              </div>
            </HydraCardContent>
          </HydraCard>
        )}

        {/* ── Likert Arbitration Summary ── */}
        <LikertSummaryCard modelId={modelId} isRu={isRu} />

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
                  // Extract CSS variable from Tailwind class: "text-hydra-expert" → "--hydra-expert"
                  const cssVar = config.color.replace('text-', '--');
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
                              backgroundColor: `hsl(var(${cssVar}))`,
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
              <Swords className="h-5 w-5 text-hydra-arbiter" />
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
                        duel.result === 'win' && 'bg-hydra-success/20 text-hydra-success border-hydra-success/30',
                        duel.result === 'loss' && 'bg-hydra-critical/20 text-hydra-critical border-hydra-critical/30',
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
        {stats.totalResponses === 0 && statsRoleDistribution.length === 0 && (
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

function StatBadge({ icon: Icon, value, label, color }: {
  icon?: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/40 text-xs">
      {Icon && <Icon className={cn("h-3 w-3", color || 'text-muted-foreground')} />}
      <span className={cn("font-semibold", color)}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
