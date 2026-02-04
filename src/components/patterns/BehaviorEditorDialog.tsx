import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { ConflictResolutionDialog } from '@/components/staff/ConflictResolutionDialog';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useRoleBehavior } from '@/hooks/useRoleBehavior';
import { detectConflicts, generateSyncOperations, applyOperationToInteractions, groupOperationsByRole, type HierarchyConflict } from '@/lib/hierarchyConflictDetector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
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
  const unsavedChanges = useUnsavedChanges();
  
  // Use role behavior hook for fetching all behaviors (for conflict detection)
  const { fetchAllBehaviors } = useRoleBehavior(null);

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
  
  // Conflict resolution state
  const [conflicts, setConflicts] = useState<HierarchyConflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingBehaviorData, setPendingBehaviorData] = useState<{
    data: Omit<RoleBehavior, 'id'> & { id?: string };
    isShared: boolean;
  } | null>(null);

  // Compute initial state hash for change detection
  const initialStateHash = useMemo(() => {
    if (!open) return '';
    if (behavior) {
      return JSON.stringify({
        role: behavior.role,
        tone: behavior.communication.tone,
        verbosity: behavior.communication.verbosity,
        formatPreference: behavior.communication.format_preference,
        reactions: behavior.reactions,
        interactions: behavior.interactions,
      });
    }
    return JSON.stringify({
      role: 'assistant',
      tone: 'friendly',
      verbosity: 'adaptive',
      formatPreference: [],
      reactions: [emptyReaction],
      interactions: { defers_to: [], challenges: [], collaborates: [] },
    });
  }, [behavior, open]);

  // Check for unsaved changes
  const currentStateHash = useMemo(() => {
    return JSON.stringify({ role, tone, verbosity, formatPreference, reactions, interactions });
  }, [role, tone, verbosity, formatPreference, reactions, interactions]);

  // Update unsaved changes state
  useEffect(() => {
    if (open && initialStateHash) {
      unsavedChanges.setHasUnsavedChanges(currentStateHash !== initialStateHash);
    }
  }, [currentStateHash, initialStateHash, open]);

  // Reset form when behavior changes
  useEffect(() => {
    if (behavior) {
      setRole(behavior.role);
      setTone(behavior.communication?.tone || 'friendly');
      setVerbosity(behavior.communication?.verbosity || 'adaptive');
      setFormatPreference([...(behavior.communication?.format_preference || [])]);
      setReactions(behavior.reactions?.length ? [...behavior.reactions] : [{ ...emptyReaction }]);
      setInteractions({
        defers_to: behavior.interactions?.defers_to || [],
        challenges: behavior.interactions?.challenges || [],
        collaborates: behavior.interactions?.collaborates || [],
      });
    } else {
      setRole('assistant');
      setTone('friendly');
      setVerbosity('adaptive');
      setFormatPreference([]);
      setReactions([{ ...emptyReaction }]);
      setInteractions({ defers_to: [], challenges: [], collaborates: [] });
      setIsShared(false);
    }
    unsavedChanges.markSaved();
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
    
    // Check for conflicts before saving
    const allBehaviors = await fetchAllBehaviors();
    const detectedConflicts = detectConflicts(role, interactions, allBehaviors);
    
    if (detectedConflicts.length > 0) {
      // Show conflict resolution dialog
      setConflicts(detectedConflicts);
      setPendingBehaviorData({ data, isShared });
      setShowConflictDialog(true);
    } else {
      // No conflicts, save directly
      await onSave(data, isShared);
      unsavedChanges.markSaved();
      onOpenChange(false);
    }
  };
  
  const handleSyncAndSave = useCallback(async () => {
    if (!pendingBehaviorData) return;
    
    setIsSyncing(true);
    try {
      // Generate sync operations
      const operations = generateSyncOperations(conflicts);
      const grouped = groupOperationsByRole(operations);
      
      // First save the current behavior
      await onSave(pendingBehaviorData.data, pendingBehaviorData.isShared);
      
      // Then update all affected roles
      const allBehaviors = await fetchAllBehaviors();
      
      for (const [roleKey, ops] of grouped) {
        let roleInteractions = allBehaviors.get(roleKey) || {
          defers_to: [],
          challenges: [],
          collaborates: [],
        };
        
        // Apply all operations for this role
        for (const op of ops) {
          roleInteractions = applyOperationToInteractions(roleInteractions, op);
        }
        
        // Update in database
        const { error } = await supabase
          .from('role_behaviors')
          .update({
            interactions: roleInteractions as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('role', roleKey);
        
        if (error) {
          console.error(`Failed to update role ${roleKey}:`, error);
        }
      }
      
      toast.success(t('staffRoles.hierarchy.syncSuccess'));
      setShowConflictDialog(false);
      setConflicts([]);
      setPendingBehaviorData(null);
      unsavedChanges.markSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error(t('common.error'));
    } finally {
      setIsSyncing(false);
    }
  }, [conflicts, pendingBehaviorData, onSave, fetchAllBehaviors, t, unsavedChanges, onOpenChange]);

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

  const isValid = reactions.some(r => r.trigger.trim() && r.behavior.trim());
  const roleConfig = ROLE_CONFIG[role];
  const RoleIcon = roleConfig.icon;

  return (
    <>
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen ? handleClose() : onOpenChange(true)}>
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
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving || isSyncing}>
            {(isSaving || isSyncing) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
    
    <ConflictResolutionDialog
      open={showConflictDialog}
      onOpenChange={(open) => {
        setShowConflictDialog(open);
        if (!open) {
          setConflicts([]);
          setPendingBehaviorData(null);
        }
      }}
      conflicts={conflicts}
      isSyncing={isSyncing}
      onSync={handleSyncAndSave}
    />
    </>
  );
}
