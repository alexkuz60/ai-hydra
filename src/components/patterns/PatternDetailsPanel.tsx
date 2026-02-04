import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, GitBranch, CheckCircle2, MessageSquare, Users, ArrowRight, Loader2, Pencil, Copy, Lock } from 'lucide-react';
import { ROLE_CONFIG } from '@/config/roles';
import { cn } from '@/lib/utils';
import type { TaskBlueprint, RoleBehavior } from '@/types/patterns';
import { isTaskBlueprint } from '@/types/patterns';
import { useFlowDiagrams } from '@/hooks/useFlowDiagrams';
import { blueprintToFlow } from '@/lib/blueprintToFlow';
import { useToast } from '@/hooks/use-toast';
import type { PatternMeta } from '@/hooks/usePatterns';

interface PatternDetailsPanelProps {
  selectedPattern: TaskBlueprint | RoleBehavior | null;
  patternMeta?: PatternMeta | null;
  onEdit?: () => void;
}

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const { t } = useLanguage();
  const categoryColors: Record<string, string> = {
    planning: 'bg-hydra-analyst/20 text-hydra-analyst border-hydra-analyst/30',
    creative: 'bg-hydra-consultant/20 text-hydra-consultant border-hydra-consultant/30',
    analysis: 'bg-hydra-advisor/20 text-hydra-advisor border-hydra-advisor/30',
    technical: 'bg-hydra-critical/20 text-hydra-critical border-hydra-critical/30',
  };

  return (
    <Badge variant="outline" className={cn('text-xs', categoryColors[category])}>
      {t(`patterns.category.${category}`)}
    </Badge>
  );
};

const TaskBlueprintDetails: React.FC<{ pattern: TaskBlueprint }> = ({ pattern }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { saveDiagram, isSaving } = useFlowDiagrams();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleOpenInFlowEditor = async () => {
    setIsGenerating(true);
    try {
      // Generate flow from blueprint
      const { nodes, edges } = blueprintToFlow(pattern);
      
      // Save as new diagram with source='pattern' to hide from regular users' "Open" list
      const diagram = await saveDiagram({
        name: `Flow: ${pattern.name}`,
        description: `Автоматически сгенерировано из паттерна "${pattern.name}"`,
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 0.8 },
        source: 'pattern',
      });
      
      toast({
        description: t('patterns.flowGenerated'),
      });
      
      // Navigate to flow editor with the new diagram
      navigate(`/flow-editor?id=${diagram.id}`);
    } catch (error) {
      console.error('Failed to generate flow:', error);
      toast({
        variant: 'destructive',
        description: t('patterns.flowGenerationError'),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-hydra-arbiter/10 flex items-center justify-center shrink-0">
          <Target className="h-7 w-7 text-hydra-arbiter" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold mb-2">{pattern.name}</h2>
          <CategoryBadge category={pattern.category} />
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          {t('patterns.description')}
        </h3>
        <p className="text-sm leading-relaxed">{pattern.description}</p>
      </div>

      <Separator className="my-4" />

      {/* Stages */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          {t('patterns.stages')} ({pattern.stages.length})
        </h3>
        <div className="relative">
          {pattern.stages.map((stage, index) => (
            <div key={index} className="relative flex gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-semibold border-2 border-primary/40 z-10">
                  {index + 1}
                </div>
                {index < pattern.stages.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/40 to-primary/10 min-h-[16px]" />
                )}
              </div>
              
              {/* Stage content */}
              <div className="flex-1 pb-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <span className="font-medium text-sm">{stage.name}</span>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">{stage.objective}</p>
                  <div className="flex flex-wrap gap-1">
                    {stage.roles.map((role) => {
                      const config = ROLE_CONFIG[role];
                      const Icon = config?.icon;
                      return (
                        <Badge
                          key={role}
                          variant="outline"
                          className={cn('text-xs gap-1', config?.color)}
                        >
                          {Icon && <Icon className="h-3 w-3" />}
                          {t(config?.label || role)}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checkpoints */}
      {pattern.checkpoints.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {t('patterns.checkpoints')} ({pattern.checkpoints.length})
            </h3>
            <div className="space-y-2">
              {pattern.checkpoints.map((checkpoint, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 rounded-md bg-hydra-arbiter/10 border border-hydra-arbiter/20"
                >
                  <CheckCircle2 className="h-4 w-4 text-hydra-arbiter mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs text-hydra-arbiter">
                      {t('patterns.afterStage')} {checkpoint.after_stage + 1}:
                    </span>
                    <p className="text-sm">{checkpoint.condition}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Action Button */}
      <Separator className="my-4" />
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleOpenInFlowEditor}
        disabled={isGenerating || isSaving}
      >
        {isGenerating || isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GitBranch className="h-4 w-4" />
        )}
        {isGenerating ? t('patterns.generatingFlow') : t('patterns.openInFlowEditor')}
        {!isGenerating && <ArrowRight className="h-4 w-4 ml-auto" />}
      </Button>
    </>
  );
};

const RoleBehaviorDetails: React.FC<{ pattern: RoleBehavior }> = ({ pattern }) => {
  const { t } = useLanguage();
  const roleConfig = ROLE_CONFIG[pattern.role];
  const RoleIcon = roleConfig?.icon;

  const toneLabels: Record<string, string> = {
    formal: 'patterns.tone.formal',
    friendly: 'patterns.tone.friendly',
    neutral: 'patterns.tone.neutral',
    provocative: 'patterns.tone.provocative',
  };

  const verbosityLabels: Record<string, string> = {
    concise: 'patterns.verbosity.concise',
    detailed: 'patterns.verbosity.detailed',
    adaptive: 'patterns.verbosity.adaptive',
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center shrink-0',
            `bg-${roleConfig?.color.replace('text-', '')}/10`
          )}
        >
          {RoleIcon && <RoleIcon className={cn('h-7 w-7', roleConfig?.color)} />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold mb-1">{t(roleConfig?.label || pattern.role)}</h2>
          <Badge variant="outline" className="text-xs">
            {t('patterns.roleBehavior')}
          </Badge>
        </div>
      </div>

      {/* Communication Style */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          {t('patterns.communication')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-xs text-muted-foreground">{t('patterns.tone')}</span>
            <p className="text-sm font-medium mt-1">{t(toneLabels[pattern.communication.tone])}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-xs text-muted-foreground">{t('patterns.verbosity')}</span>
            <p className="text-sm font-medium mt-1">
              {t(verbosityLabels[pattern.communication.verbosity])}
            </p>
          </div>
        </div>
        {pattern.communication?.format_preference && pattern.communication.format_preference.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-xs text-muted-foreground">{t('patterns.formatPreference')}</span>
            <div className="flex flex-wrap gap-1 mt-2">
              {pattern.communication.format_preference.map((format) => (
                <Badge key={format} variant="secondary" className="text-xs">
                  {format}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator className="my-4" />

      {/* Reactions */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {t('patterns.reactions')} ({pattern.reactions.length})
        </h3>
        <div className="space-y-2">
          {pattern.reactions.map((reaction, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="text-xs text-muted-foreground mb-1">
                {t('patterns.trigger')}: <span className="text-foreground">{reaction.trigger}</span>
              </div>
              <p className="text-sm">{reaction.behavior}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Interactions */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('patterns.interactions')}
        </h3>
        <div className="space-y-3">
          {pattern.interactions?.defers_to && pattern.interactions.defers_to.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-xs text-muted-foreground">{t('patterns.defersTo')}</span>
              <div className="flex flex-wrap gap-1 mt-2">
                {pattern.interactions.defers_to.map((role) => {
                  const config = ROLE_CONFIG[role];
                  return (
                    <Badge key={role} variant="outline" className={cn('text-xs', config?.color)}>
                      {t(config?.label || role)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
          {pattern.interactions?.challenges && pattern.interactions.challenges.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-xs text-muted-foreground">{t('patterns.challenges')}</span>
              <div className="flex flex-wrap gap-1 mt-2">
                {pattern.interactions.challenges.map((role) => {
                  const config = ROLE_CONFIG[role];
                  return (
                    <Badge key={role} variant="outline" className={cn('text-xs', config?.color)}>
                      {t(config?.label || role)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
          {pattern.interactions?.collaborates && pattern.interactions.collaborates.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-xs text-muted-foreground">{t('patterns.collaborates')}</span>
              <div className="flex flex-wrap gap-1 mt-2">
                {pattern.interactions.collaborates.map((role) => {
                  const config = ROLE_CONFIG[role];
                  return (
                    <Badge key={role} variant="outline" className={cn('text-xs', config?.color)}>
                      {t(config?.label || role)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const PatternDetailsPanel: React.FC<PatternDetailsPanelProps> = ({ selectedPattern, patternMeta, onEdit }) => {
  const { t } = useLanguage();

  if (!selectedPattern) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-8 text-center">
        <div>
          <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>{t('patterns.selectPattern')}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        {/* Edit button */}
        {onEdit && (
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="gap-2"
            >
              {patternMeta?.isSystem ? (
                <>
                  <Copy className="h-4 w-4" />
                  {t('patterns.duplicateToEdit')}
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  {t('common.edit')}
                </>
              )}
            </Button>
          </div>
        )}

        {/* System pattern indicator */}
        {patternMeta?.isSystem && (
          <div className="flex items-center gap-2 mb-4 p-2 rounded-md bg-muted/50 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            {t('patterns.cannotEditSystem')}
          </div>
        )}

        {isTaskBlueprint(selectedPattern) ? (
          <TaskBlueprintDetails pattern={selectedPattern} />
        ) : (
          <RoleBehaviorDetails pattern={selectedPattern} />
        )}
      </div>
    </ScrollArea>
  );
};

export default PatternDetailsPanel;
