import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2, Save, X, MessageSquare, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_CONFIG, AGENT_ROLES, type AgentRole } from '@/config/roles';
import { TRIGGER_DICTIONARY, BEHAVIOR_DICTIONARY, FORMAT_DICTIONARY } from '@/config/behaviorDictionaries';
import { DictionaryCombobox } from '@/components/ui/DictionaryCombobox';
import { DictionaryMultiSelect } from '@/components/ui/DictionaryMultiSelect';
import RoleHierarchyEditor from '@/components/staff/RoleHierarchyEditor';
import { ConflictResolutionDialog } from '@/components/staff/ConflictResolutionDialog';
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

interface RoleBehaviorEditorProps {
  behavior: RoleBehavior;
  isSystem?: boolean;
  onSave: (behavior: Omit<RoleBehavior, 'id'> & { id?: string }, isShared: boolean) => Promise<void>;
  onCancel: () => void;
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
  isSaving?: boolean;
}

const TONES: CommunicationTone[] = ['formal', 'friendly', 'neutral', 'provocative'];
const VERBOSITY_OPTIONS: Verbosity[] = ['concise', 'detailed', 'adaptive'];

const emptyReaction: RoleReaction = { trigger: '', behavior: '' };

export function RoleBehaviorEditor({
  behavior,
  isSystem = false,
  onSave,
  onCancel,
  onHasUnsavedChanges,
  isSaving = false,
}: RoleBehaviorEditorProps) {
  const { t, language } = useLanguage();
  const isEditing = !!behavior?.id && !isSystem;
  const { fetchAllBehaviors } = useRoleBehavior(null);

  const [role, setRole] = useState<AgentRole>(behavior.role);
  const [tone, setTone] = useState<CommunicationTone>(behavior.communication?.tone || 'friendly');
  const [verbosity, setVerbosity] = useState<Verbosity>(behavior.communication?.verbosity || 'adaptive');
  const [formatPreference, setFormatPreference] = useState<string[]>([...(behavior.communication?.format_preference || [])]);
  const [reactions, setReactions] = useState<RoleReaction[]>(
    behavior.reactions?.length ? [...behavior.reactions] : [{ ...emptyReaction }]
  );
  const [interactions, setInteractions] = useState<RoleInteractions>({
    defers_to: behavior.interactions?.defers_to || [],
    challenges: behavior.interactions?.challenges || [],
    collaborates: behavior.interactions?.collaborates || [],
  });
  const [isShared, setIsShared] = useState(false);
  
  // Conflict resolution state
  const [conflicts, setConflicts] = useState<HierarchyConflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'ok' | 'conflicts' | null>(null);
  const [pendingBehaviorData, setPendingBehaviorData] = useState<{
    data: Omit<RoleBehavior, 'id'> & { id?: string };
    isShared: boolean;
  } | null>(null);

  // Compute initial state hash for change detection
  const initialStateHash = useMemo(() => {
    return JSON.stringify({
      role: behavior.role,
      tone: behavior.communication?.tone || 'friendly',
      verbosity: behavior.communication?.verbosity || 'adaptive',
      formatPreference: behavior.communication?.format_preference || [],
      reactions: behavior.reactions || [emptyReaction],
      interactions: behavior.interactions || { defers_to: [], challenges: [], collaborates: [] },
    });
  }, [behavior]);

  // Check for unsaved changes
  const currentStateHash = useMemo(() => {
    return JSON.stringify({ role, tone, verbosity, formatPreference, reactions, interactions });
  }, [role, tone, verbosity, formatPreference, reactions, interactions]);

  const hasChanges = currentStateHash !== initialStateHash;

  // Notify parent about unsaved changes
  useEffect(() => {
    onHasUnsavedChanges?.(hasChanges);
  }, [hasChanges, onHasUnsavedChanges]);

  // Reset check result when interactions change
  useEffect(() => {
    setCheckResult(null);
  }, [interactions]);

  const addReaction = () => {
    setReactions([...reactions, { ...emptyReaction }]);
  };

  const removeReaction = (index: number) => {
    setReactions(reactions.filter((_, i) => i !== index));
  };

  const updateReaction = (index: number, updates: Partial<RoleReaction>) => {
    setReactions(reactions.map((r, i) => i === index ? { ...r, ...updates } : r));
  };

  const handleCheckConflicts = async () => {
    setIsChecking(true);
    try {
      const allBehaviors = await fetchAllBehaviors();
      const detectedConflicts = detectConflicts(role, interactions, allBehaviors);
      
      if (detectedConflicts.length > 0) {
        setConflicts(detectedConflicts);
        setCheckResult('conflicts');
        setShowConflictDialog(true);
      } else {
        setCheckResult('ok');
        toast.success(t('staffRoles.hierarchy.noConflicts'));
      }
    } catch (error) {
      console.error('Check failed:', error);
      toast.error(t('common.error'));
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    const data: Omit<RoleBehavior, 'id'> & { id?: string } = {
      ...(behavior?.id && !isSystem && { id: behavior.id }),
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
      setConflicts(detectedConflicts);
      setPendingBehaviorData({ data, isShared });
      setShowConflictDialog(true);
    } else {
      await onSave(data, isShared);
    }
  };
  
  const handleSyncAndSave = useCallback(async () => {
    if (!pendingBehaviorData) return;
    
    setIsSyncing(true);
    try {
      const operations = generateSyncOperations(conflicts);
      const grouped = groupOperationsByRole(operations);
      
      await onSave(pendingBehaviorData.data, pendingBehaviorData.isShared);
      
      const allBehaviors = await fetchAllBehaviors();
      
      for (const [roleKey, ops] of grouped) {
        let roleInteractions = allBehaviors.get(roleKey) || {
          defers_to: [],
          challenges: [],
          collaborates: [],
        };
        
        for (const op of ops) {
          roleInteractions = applyOperationToInteractions(roleInteractions, op);
        }
        
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
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error(t('common.error'));
    } finally {
      setIsSyncing(false);
    }
  }, [conflicts, pendingBehaviorData, onSave, fetchAllBehaviors, t]);

  const isValid = reactions.some(r => r.trigger.trim() && r.behavior.trim());
  const roleConfig = ROLE_CONFIG[role];
  const RoleIcon = roleConfig.icon;

  return (
    <>
      <div className="space-y-6">
        {/* Header with save/cancel buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              `bg-${roleConfig?.color.replace('text-', '')}/10`
            )}>
              <RoleIcon className={cn('h-5 w-5', roleConfig?.color)} />
            </div>
            <div>
              <h3 className="font-semibold">{t(roleConfig?.label || role)}</h3>
              <p className="text-xs text-muted-foreground">
                {isSystem ? t('patterns.duplicateToEdit') : t('patterns.editBehavior')}
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
              disabled={!isValid || isSaving || isSyncing}
              className="gap-1"
            >
              {(isSaving || isSyncing) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t('common.save')}
            </Button>
          </div>
        </div>

        {/* Role Selection (only when duplicating system pattern) */}
        {isSystem && (
          <>
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
            <Separator />
          </>
        )}

        {/* Communication Style */}
        <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="h-4 w-4" />
            {t('patterns.communication')}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">{t('patterns.tone')}</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as CommunicationTone)}>
                <SelectTrigger className="h-9">
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
                <SelectTrigger className="h-9">
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
            <DictionaryMultiSelect
              dictionary={FORMAT_DICTIONARY}
              values={formatPreference}
              onChange={setFormatPreference}
              placeholder={t('patterns.dictionary.addFormat')}
            />
          </div>
        </div>

        {/* Reactions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t('patterns.reactions')}</Label>
            <Button variant="outline" size="sm" onClick={addReaction} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              {t('patterns.addReaction')}
            </Button>
          </div>

          {reactions.map((reaction, index) => (
            <div key={index} className="flex gap-2 p-3 rounded-lg border bg-muted/20">
              <div className="flex-1 space-y-2">
                <DictionaryCombobox
                  dictionary={TRIGGER_DICTIONARY}
                  value={reaction.trigger}
                  onChange={(value) => updateReaction(index, { trigger: value })}
                  placeholder={t('patterns.triggerPlaceholder')}
                />
                <DictionaryCombobox
                  dictionary={BEHAVIOR_DICTIONARY}
                  value={reaction.behavior}
                  onChange={(value) => updateReaction(index, { behavior: value })}
                  placeholder={t('patterns.behaviorPlaceholder')}
                />
              </div>
              {reactions.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeReaction(index)}
                  className="text-destructive hover:text-destructive self-center h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Interactions - Role Hierarchy */}
        <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              {t('patterns.interactions')}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckConflicts}
                  disabled={isChecking}
                  className={cn(
                    "h-7 text-xs gap-1",
                    checkResult === 'ok' && "border-green-500/50 text-green-600",
                    checkResult === 'conflicts' && "border-destructive/50 text-destructive"
                  )}
                >
                  {isChecking ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : checkResult === 'ok' ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : checkResult === 'conflicts' ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {t('staffRoles.hierarchy.checkConflicts')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('staffRoles.hierarchy.checkConflictsTooltip')}
              </TooltipContent>
            </Tooltip>
          </div>
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
