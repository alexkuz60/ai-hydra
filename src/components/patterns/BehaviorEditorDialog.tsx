import React, { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_CONFIG, AGENT_ROLES, type AgentRole } from '@/config/roles';
import RoleHierarchyEditor from '@/components/staff/RoleHierarchyEditor';
import type { 
  RoleBehavior, 
  CommunicationTone, 
  Verbosity, 
  RoleReaction,
  RoleInteractions 
} from '@/types/patterns';

interface BehaviorEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  behavior?: RoleBehavior | null;
  onSave: (behavior: Omit<RoleBehavior, 'id'> & { id?: string }, isShared: boolean) => Promise<void>;
  isSaving?: boolean;
}

const TONES: CommunicationTone[] = ['formal', 'friendly', 'neutral', 'provocative'];
const VERBOSITY_OPTIONS: Verbosity[] = ['concise', 'detailed', 'adaptive'];

const emptyReaction: RoleReaction = { trigger: '', behavior: '' };

export function BehaviorEditorDialog({
  open,
  onOpenChange,
  behavior,
  onSave,
  isSaving = false,
}: BehaviorEditorDialogProps) {
  const { t } = useLanguage();
  const isEditing = !!behavior?.id;

  const [role, setRole] = useState<AgentRole>('assistant');
  const [tone, setTone] = useState<CommunicationTone>('friendly');
  const [verbosity, setVerbosity] = useState<Verbosity>('adaptive');
  const [formatPreference, setFormatPreference] = useState<string[]>([]);
  const [reactions, setReactions] = useState<RoleReaction[]>([{ ...emptyReaction }]);
  const [interactions, setInteractions] = useState<RoleInteractions>({
    defers_to: [],
    challenges: [],
    collaborates: [],
  });
  const [isShared, setIsShared] = useState(false);

  // Reset form when behavior changes
  useEffect(() => {
    if (behavior) {
      setRole(behavior.role);
      setTone(behavior.communication.tone);
      setVerbosity(behavior.communication.verbosity);
      setFormatPreference([...behavior.communication.format_preference]);
      setReactions(behavior.reactions.length ? [...behavior.reactions] : [{ ...emptyReaction }]);
      setInteractions({ ...behavior.interactions });
    } else {
      setRole('assistant');
      setTone('friendly');
      setVerbosity('adaptive');
      setFormatPreference([]);
      setReactions([{ ...emptyReaction }]);
      setInteractions({ defers_to: [], challenges: [], collaborates: [] });
      setIsShared(false);
    }
  }, [behavior, open]);

  const addReaction = () => {
    setReactions([...reactions, { ...emptyReaction }]);
  };

  const removeReaction = (index: number) => {
    setReactions(reactions.filter((_, i) => i !== index));
  };

  const updateReaction = (index: number, updates: Partial<RoleReaction>) => {
    setReactions(reactions.map((r, i) => i === index ? { ...r, ...updates } : r));
  };


  const handleSave = async () => {
    const data: Omit<RoleBehavior, 'id'> & { id?: string } = {
      ...(behavior?.id && { id: behavior.id }),
      role,
      communication: {
        tone,
        verbosity,
        format_preference: formatPreference.filter(f => f.trim()),
      },
      reactions: reactions.filter(r => r.trigger.trim() && r.behavior.trim()),
      interactions,
    };
    await onSave(data, isShared);
    onOpenChange(false);
  };

  const isValid = reactions.some(r => r.trigger.trim() && r.behavior.trim());
  const roleConfig = ROLE_CONFIG[role];
  const RoleIcon = roleConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('patterns.editBehavior') : t('patterns.createBehavior')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Role Selection */}
            <div className="grid gap-2">
              <Label>{t('patterns.selectRole')}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AgentRole)}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <RoleIcon className={cn('h-4 w-4', roleConfig.color)} />
                      {t(roleConfig.label)}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AGENT_ROLES.map((r) => {
                    const config = ROLE_CONFIG[r];
                    const Icon = config.icon;
                    return (
                      <SelectItem key={r} value={r}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4', config.color)} />
                          {t(config.label)}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Communication Style */}
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <Label className="text-base font-medium">{t('patterns.communication')}</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs text-muted-foreground">{t('patterns.tone')}</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as CommunicationTone)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((toneOption) => (
                        <SelectItem key={toneOption} value={toneOption}>
                          {t(`patterns.tone.${toneOption}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs text-muted-foreground">{t('patterns.verbosityLabel')}</Label>
                  <Select value={verbosity} onValueChange={(v) => setVerbosity(v as Verbosity)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERBOSITY_OPTIONS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {t(`patterns.verbosity.${v}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">{t('patterns.formatPreference')}</Label>
                <Input
                  value={formatPreference.join(', ')}
                  onChange={(e) => setFormatPreference(e.target.value.split(',').map(f => f.trim()))}
                  placeholder={t('patterns.formatPlaceholder')}
                />
              </div>
            </div>

            {/* Reactions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('patterns.reactions')}</Label>
                <Button variant="outline" size="sm" onClick={addReaction}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('patterns.addReaction')}
                </Button>
              </div>

              {reactions.map((reaction, index) => (
                <div key={index} className="flex gap-2 p-3 rounded-lg border">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={reaction.trigger}
                      onChange={(e) => updateReaction(index, { trigger: e.target.value })}
                      placeholder={t('patterns.triggerPlaceholder')}
                      className="text-sm"
                    />
                    <Input
                      value={reaction.behavior}
                      onChange={(e) => updateReaction(index, { behavior: e.target.value })}
                      placeholder={t('patterns.behaviorPlaceholder')}
                      className="text-sm"
                    />
                  </div>
                  {reactions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReaction(index)}
                      className="text-destructive hover:text-destructive self-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Interactions - Role Hierarchy */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <Label className="text-base font-medium">{t('patterns.interactions')}</Label>
              <RoleHierarchyEditor
                selectedRole={role}
                interactions={interactions}
                onInteractionsChange={setInteractions}
                isEditing={true}
              />
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
