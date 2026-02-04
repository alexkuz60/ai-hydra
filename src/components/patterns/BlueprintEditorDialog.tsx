import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_CONFIG, AGENT_ROLES, type AgentRole } from '@/config/roles';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import type { TaskBlueprint, BlueprintStage, BlueprintCheckpoint, PatternCategory } from '@/types/patterns';

interface BlueprintEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blueprint?: TaskBlueprint | null;
  onSave: (blueprint: Omit<TaskBlueprint, 'id'> & { id?: string }, isShared: boolean) => Promise<void>;
  isSaving?: boolean;
}

const CATEGORIES: PatternCategory[] = ['planning', 'creative', 'analysis', 'technical'];

const emptyStage: BlueprintStage = {
  name: '',
  roles: [],
  objective: '',
  deliverables: [],
};

export function BlueprintEditorDialog({
  open,
  onOpenChange,
  blueprint,
  onSave,
  isSaving = false,
}: BlueprintEditorDialogProps) {
  const { t } = useLanguage();
  const isEditing = !!blueprint?.id;
  const unsavedChanges = useUnsavedChanges();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<PatternCategory>('planning');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<BlueprintStage[]>([{ ...emptyStage }]);
  const [checkpoints, setCheckpoints] = useState<BlueprintCheckpoint[]>([]);
  const [isShared, setIsShared] = useState(false);

  // Compute initial state hash for change detection
  const initialStateHash = useMemo(() => {
    if (!open) return '';
    if (blueprint) {
      return JSON.stringify({
        name: blueprint.name,
        category: blueprint.category,
        description: blueprint.description,
        stages: blueprint.stages,
        checkpoints: blueprint.checkpoints,
      });
    }
    return JSON.stringify({
      name: '',
      category: 'planning',
      description: '',
      stages: [emptyStage],
      checkpoints: [],
    });
  }, [blueprint, open]);

  // Check for unsaved changes
  const currentStateHash = useMemo(() => {
    return JSON.stringify({ name, category, description, stages, checkpoints });
  }, [name, category, description, stages, checkpoints]);

  // Update unsaved changes state
  useEffect(() => {
    if (open && initialStateHash) {
      unsavedChanges.setHasUnsavedChanges(currentStateHash !== initialStateHash);
    }
  }, [currentStateHash, initialStateHash, open]);

  // Reset form when blueprint changes
  useEffect(() => {
    if (blueprint) {
      setName(blueprint.name);
      setCategory(blueprint.category);
      setDescription(blueprint.description);
      setStages(blueprint.stages?.length ? [...blueprint.stages] : [{ ...emptyStage }]);
      // Ensure checkpoints have valid after_stage values
      const validCheckpoints = (blueprint.checkpoints || []).map(cp => ({
        after_stage: cp.after_stage ?? 0,
        condition: cp.condition || '',
      }));
      setCheckpoints(validCheckpoints);
    } else {
      setName('');
      setCategory('planning');
      setDescription('');
      setStages([{ ...emptyStage }]);
      setCheckpoints([]);
      setIsShared(false);
    }
    unsavedChanges.markSaved();
  }, [blueprint, open]);

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
    unsavedChanges.markSaved();
    onOpenChange(false);
  };

  const handleClose = () => {
    if (unsavedChanges.hasUnsavedChanges) {
      unsavedChanges.withConfirmation(() => {
        unsavedChanges.markSaved();
        onOpenChange(false);
      });
    } else {
      onOpenChange(false);
    }
  };

  const isValid = name.trim() && description.trim() && stages.length > 0 && stages.every(s => s.name.trim() && s.roles.length > 0);

  return (
    <>
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen ? handleClose() : onOpenChange(true)}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('patterns.editBlueprint') : t('patterns.createBlueprint')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid gap-4">
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t(`patterns.category.${cat}`)}
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
                <Label>{t('patterns.stages')}</Label>
                <Button variant="outline" size="sm" onClick={addStage}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('patterns.addStage')}
                </Button>
              </div>

              {stages.map((stage, index) => (
                <div key={index} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <Input
                      value={stage.name}
                      onChange={(e) => updateStage(index, { name: e.target.value })}
                      placeholder={t('patterns.stageName')}
                      className="flex-1"
                    />
                    {stages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStage(index)}
                        className="text-destructive hover:text-destructive"
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
              ))}
            </div>

            {/* Checkpoints */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('patterns.checkpoints')}</Label>
                <Button variant="outline" size="sm" onClick={addCheckpoint}>
                  <Plus className="h-4 w-4 mr-1" />
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
                    className="text-destructive hover:text-destructive"
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
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <UnsavedChangesDialog
      open={unsavedChanges.showConfirmDialog}
      onConfirm={unsavedChanges.confirmAndProceed}
      onCancel={unsavedChanges.cancelNavigation}
    />
    </>
  );
}
