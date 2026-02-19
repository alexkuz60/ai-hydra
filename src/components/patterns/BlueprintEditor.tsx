import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Loader2, Save, X, Target, GitBranch, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_CONFIG, AGENT_ROLES, type AgentRole } from '@/config/roles';
import type { TaskBlueprint, BlueprintStage, BlueprintCheckpoint, PatternCategory } from '@/types/patterns';

interface BlueprintEditorProps {
  blueprint: TaskBlueprint;
  isSystem?: boolean;
  onSave: (blueprint: Omit<TaskBlueprint, 'id'> & { id?: string }, isShared: boolean) => Promise<void>;
  onCancel: () => void;
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
  isSaving?: boolean;
}

const CATEGORIES: PatternCategory[] = ['planning', 'creative', 'analysis', 'technical'];

const emptyStage: BlueprintStage = {
  name: '',
  roles: [],
  objective: '',
  deliverables: [],
};

export function BlueprintEditor({
  blueprint,
  isSystem = false,
  onSave,
  onCancel,
  onHasUnsavedChanges,
  isSaving = false,
}: BlueprintEditorProps) {
  const { t } = useLanguage();
  const isEditing = !!blueprint?.id;

  const [name, setName] = useState(blueprint.name || '');
  const [category, setCategory] = useState<PatternCategory>(blueprint.category || 'planning');
  const [description, setDescription] = useState(blueprint.description || '');
  const [stages, setStages] = useState<BlueprintStage[]>(
    blueprint.stages?.length ? [...blueprint.stages] : [{ ...emptyStage }]
  );
  const [checkpoints, setCheckpoints] = useState<BlueprintCheckpoint[]>(
    (blueprint.checkpoints || []).map(cp => ({
      after_stage: cp.after_stage ?? 0,
      condition: cp.condition || '',
    }))
  );
  const [isShared, setIsShared] = useState(false);

  // Compute initial state hash for change detection
  const initialStateHash = useMemo(() => {
    return JSON.stringify({
      name: blueprint.name || '',
      category: blueprint.category || 'planning',
      description: blueprint.description || '',
      stages: blueprint.stages || [emptyStage],
      checkpoints: blueprint.checkpoints || [],
    });
  }, [blueprint]);

  // Check for unsaved changes
  const currentStateHash = useMemo(() => {
    return JSON.stringify({ name, category, description, stages, checkpoints });
  }, [name, category, description, stages, checkpoints]);

  const hasChanges = currentStateHash !== initialStateHash;

  // Notify parent about unsaved changes
  useEffect(() => {
    onHasUnsavedChanges?.(hasChanges);
  }, [hasChanges, onHasUnsavedChanges]);

  const addStage = () => {
    setStages([...stages, { ...emptyStage }]);
  };

  const removeStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
    // Update checkpoints to reflect removed stage
    setCheckpoints(checkpoints.filter(cp => cp.after_stage !== index).map(cp => ({
      ...cp,
      after_stage: cp.after_stage > index ? cp.after_stage - 1 : cp.after_stage,
    })));
  };

  const updateStage = (index: number, updates: Partial<BlueprintStage>) => {
    setStages(stages.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const toggleRole = (stageIndex: number, role: AgentRole) => {
    const stage = stages[stageIndex];
    const hasRole = stage.roles.includes(role);
    updateStage(stageIndex, {
      roles: hasRole
        ? stage.roles.filter(r => r !== role)
        : [...stage.roles, role],
    });
  };

  const addCheckpoint = () => {
    setCheckpoints([...checkpoints, { after_stage: 0, condition: '' }]);
  };

  const removeCheckpoint = (index: number) => {
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
  };

  const updateCheckpoint = (index: number, updates: Partial<BlueprintCheckpoint>) => {
    setCheckpoints(checkpoints.map((cp, i) => i === index ? { ...cp, ...updates } : cp));
  };

  const handleSave = async () => {
    const data: Omit<TaskBlueprint, 'id'> & { id?: string } = {
      ...(blueprint?.id && { id: blueprint.id }),
      name,
      category,
      description,
      stages: stages.map(s => ({
        ...s,
        deliverables: s.deliverables.filter(d => d.trim()),
      })),
      checkpoints,
    };
    await onSave(data, isShared);
  };

  const isValid = name.trim() && description.trim() && stages.length > 0 && stages.every(s => s.name.trim() && s.roles.length > 0);

  const categoryColors: Record<string, string> = {
    planning: 'text-hydra-info',
    creative: 'text-hydra-expert',
    analysis: 'text-hydra-success',
    technical: 'text-hydra-webhunter',
  };

  return (
    <div className="space-y-6">
      {/* Header with save/cancel buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-hydra-arbiter/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-hydra-arbiter" />
          </div>
          <div>
            <h3 className="font-semibold">{name || t('patterns.newBlueprint')}</h3>
            <p className="text-xs text-muted-foreground">
              {isSystem ? t('patterns.duplicateToEdit') : t('patterns.editBlueprint')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="gap-1"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t('common.save')}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
        <div className="grid gap-2">
          <Label>{t('patterns.name')}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('patterns.namePlaceholder')}
          />
        </div>

        <div className="grid gap-2">
          <Label>{t('patterns.category')}</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as PatternCategory)}>
            <SelectTrigger>
              <SelectValue>
                <span className={categoryColors[category]}>
                  {t(`patterns.category.${category}`)}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  <span className={categoryColors[cat]}>
                    {t(`patterns.category.${cat}`)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>{t('patterns.descriptionLabel')}</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('patterns.descriptionPlaceholder')}
            rows={2}
          />
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <GitBranch className="h-4 w-4" />
            {t('patterns.stages')}
          </div>
          <Button variant="outline" size="sm" onClick={addStage} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            {t('patterns.addStage')}
          </Button>
        </div>

        <div className="relative">
          {stages.map((stage, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-semibold border-2 border-primary/40 z-10">
                  {index + 1}
                </div>
                {index < stages.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-primary/40 to-primary/10 min-h-[20px]" />
                )}
              </div>
              
              {/* Stage content */}
              <div className="flex-1 pb-4">
                <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <Input
                      value={stage.name}
                      onChange={(e) => updateStage(index, { name: e.target.value })}
                      placeholder={t('patterns.stageName')}
                      className="flex-1 font-medium"
                    />
                    {stages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStage(index)}
                        className="text-destructive hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">{t('patterns.objective')}</Label>
                    <Input
                      value={stage.objective}
                      onChange={(e) => updateStage(index, { objective: e.target.value })}
                      placeholder={t('patterns.objectivePlaceholder')}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">{t('patterns.roles')}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {AGENT_ROLES.map((role) => {
                        const config = ROLE_CONFIG[role];
                        const Icon = config.icon;
                        const isSelected = stage.roles.includes(role);
                        return (
                          <Badge
                            key={role}
                            variant={isSelected ? 'default' : 'outline'}
                            className={cn(
                              'cursor-pointer gap-1 transition-all',
                              isSelected && config.color
                            )}
                            onClick={() => toggleRole(index, role)}
                          >
                            <Icon className="h-3 w-3" />
                            {t(config.label)}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs text-muted-foreground">{t('patterns.deliverables')}</Label>
                    <Input
                      value={stage.deliverables.join(', ')}
                      onChange={(e) => updateStage(index, { 
                        deliverables: e.target.value.split(',').map(d => d.trim()) 
                      })}
                      placeholder={t('patterns.deliverablesPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checkpoints */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            {t('patterns.checkpoints')}
          </div>
          <Button variant="outline" size="sm" onClick={addCheckpoint} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            {t('patterns.addCheckpoint')}
          </Button>
        </div>

        {checkpoints.map((checkpoint, index) => (
          <div key={index} className="flex items-center gap-2 p-3 rounded-lg border bg-hydra-arbiter/5">
            <Select
              value={(checkpoint.after_stage ?? 0).toString()}
              onValueChange={(v) => updateCheckpoint(index, { after_stage: parseInt(v) })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {t('patterns.afterStage')} {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={checkpoint.condition}
              onChange={(e) => updateCheckpoint(index, { condition: e.target.value })}
              placeholder={t('patterns.checkpointCondition')}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCheckpoint(index)}
              className="text-destructive hover:text-destructive h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Share toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <Label>{t('patterns.sharePattern')}</Label>
          <p className="text-xs text-muted-foreground">{t('patterns.shareDescription')}</p>
        </div>
        <Switch checked={isShared} onCheckedChange={setIsShared} />
      </div>
    </div>
  );
}
