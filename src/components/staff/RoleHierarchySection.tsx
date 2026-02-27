import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Pencil, X, Save, Loader2, ChevronDown, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { type AgentRole } from '@/config/roles';
import RoleHierarchyEditor from './RoleHierarchyEditor';
import { ConflictResolutionDialog } from './ConflictResolutionDialog';
import { useRoleBehavior } from '@/hooks/useRoleBehavior';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import {
  detectConflicts, generateSyncOperations, applyOperationToInteractions,
  groupOperationsByRole, type HierarchyConflict,
} from '@/lib/hierarchyConflictDetector';
import type { RoleInteractions } from '@/types/patterns';
import type { Json } from '@/integrations/supabase/types';

interface RoleHierarchySectionProps {
  selectedRole: AgentRole;
  userId?: string;
  onHasUnsavedChanges?: (v: boolean) => void;
}

export function RoleHierarchySection({ selectedRole, userId, onHasUnsavedChanges }: RoleHierarchySectionProps) {
  const { t } = useLanguage();
  const unsavedChanges = useUnsavedChanges();

  const [hierarchyOpen, setHierarchyOpen] = useState(true);
  const [isEditingHierarchy, setIsEditingHierarchy] = useState(false);
  const [interactions, setInteractions] = useState<RoleInteractions>({ defers_to: [], challenges: [], collaborates: [] });
  const [originalInteractions, setOriginalInteractions] = useState<RoleInteractions | null>(null);
  const [conflicts, setConflicts] = useState<HierarchyConflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingInteractions, setPendingInteractions] = useState<RoleInteractions | null>(null);

  const { behavior, isLoading: isLoadingBehavior, isSaving, saveInteractions, saveRequiresApproval, fetchAllBehaviors } = useRoleBehavior(selectedRole);

  const handleInteractionsChange = useCallback((newInteractions: RoleInteractions) => {
    setInteractions(newInteractions);
    if (isEditingHierarchy && originalInteractions) {
      unsavedChanges.setHasUnsavedChanges(JSON.stringify(newInteractions) !== JSON.stringify(originalInteractions));
    }
  }, [isEditingHierarchy, originalInteractions, unsavedChanges]);

  useEffect(() => { onHasUnsavedChanges?.(unsavedChanges.hasUnsavedChanges); }, [unsavedChanges.hasUnsavedChanges, onHasUnsavedChanges]);

  useEffect(() => {
    if (!unsavedChanges.hasUnsavedChanges) {
      setIsEditingHierarchy(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    if (behavior?.interactions) setInteractions(behavior.interactions);
    else setInteractions({ defers_to: [], challenges: [], collaborates: [] });
  }, [behavior]);

  const handleCancel = useCallback(() => {
    const doCancel = () => {
      if (originalInteractions) setInteractions(originalInteractions);
      setIsEditingHierarchy(false);
      setOriginalInteractions(null);
      unsavedChanges.markSaved();
    };
    if (unsavedChanges.hasUnsavedChanges) unsavedChanges.withConfirmation(doCancel);
    else doCancel();
  }, [originalInteractions, unsavedChanges]);

  const handleSaveOrEdit = useCallback(async () => {
    if (isEditingHierarchy) {
      const allBehaviors = await fetchAllBehaviors();
      const detectedConflicts = detectConflicts(selectedRole, interactions, allBehaviors);
      if (detectedConflicts.length > 0) {
        setConflicts(detectedConflicts);
        setPendingInteractions(interactions);
        setShowConflictDialog(true);
      } else {
        const success = await saveInteractions(interactions);
        if (success) {
          toast.success(t('staffRoles.hierarchy.saved'));
          setIsEditingHierarchy(false);
          setOriginalInteractions(null);
          unsavedChanges.markSaved();
        }
      }
    } else {
      setOriginalInteractions({ ...interactions });
      setIsEditingHierarchy(true);
    }
  }, [isEditingHierarchy, selectedRole, interactions, fetchAllBehaviors, saveInteractions, t, unsavedChanges]);

  const handleSync = useCallback(async () => {
    if (!pendingInteractions) return;
    setIsSyncing(true);
    try {
      const operations = generateSyncOperations(conflicts);
      const grouped = groupOperationsByRole(operations);
      const success = await saveInteractions(pendingInteractions);
      if (!success) throw new Error('Failed to save current role');
      const allBehaviors = await fetchAllBehaviors();
      for (const [role, ops] of grouped) {
        let roleInteractions = allBehaviors.get(role) || { defers_to: [], challenges: [], collaborates: [] };
        for (const op of ops) roleInteractions = applyOperationToInteractions(roleInteractions, op);
        const { error } = await supabase.from('role_behaviors').update({
          interactions: roleInteractions as unknown as Json,
          updated_at: new Date().toISOString(),
        }).eq('role', role);
        if (error) console.error(`Failed to update role ${role}:`, error);
      }
      toast.success(t('staffRoles.hierarchy.syncSuccess'));
      setShowConflictDialog(false);
      setConflicts([]);
      setPendingInteractions(null);
      setIsEditingHierarchy(false);
      setOriginalInteractions(null);
      unsavedChanges.markSaved();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error(t('common.error'));
    } finally {
      setIsSyncing(false);
    }
  }, [pendingInteractions, conflicts, saveInteractions, fetchAllBehaviors, t, unsavedChanges]);

  return (
    <>
      <Collapsible open={hierarchyOpen} onOpenChange={setHierarchyOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 hover:text-foreground transition-colors">
             <ChevronDown className={cn("h-5 w-5 transition-transform", !hierarchyOpen && "-rotate-90")} />
            <Network className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-medium text-muted-foreground">{t('staffRoles.hierarchy.title')}</h3>
          </CollapsibleTrigger>
          {userId && (
            <div className="flex items-center gap-1">
              {isEditingHierarchy && (
                <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="gap-1.5 h-7 text-xs">
                  <X className="h-3 w-3" />{t('staffRoles.hierarchy.cancel')}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSaveOrEdit} disabled={isSaving || isSyncing} className="gap-1.5 h-7 text-xs">
                {isSaving ? <><Loader2 className="h-3 w-3 animate-spin" />{t('staffRoles.hierarchy.saving')}</>
                  : isEditingHierarchy ? <><Save className="h-3 w-3" />{t('staffRoles.hierarchy.save')}</>
                  : <><Pencil className="h-3 w-3" />{t('staffRoles.hierarchy.edit')}</>
                }
              </Button>
            </div>
          )}
        </div>
        <CollapsibleContent className="pt-3">
          {isLoadingBehavior ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-base text-muted-foreground">{t('staffRoles.hierarchy.loading')}</span>
            </div>
          ) : (
            <RoleHierarchyEditor selectedRole={selectedRole} interactions={interactions} onInteractionsChange={handleInteractionsChange} isEditing={isEditingHierarchy} />
          )}
        </CollapsibleContent>
      </Collapsible>

      <UnsavedChangesDialog open={unsavedChanges.showConfirmDialog} onConfirm={unsavedChanges.confirmAndProceed} onCancel={unsavedChanges.cancelNavigation} />
      <ConflictResolutionDialog open={showConflictDialog} onOpenChange={setShowConflictDialog} conflicts={conflicts} isSyncing={isSyncing} onSync={handleSync} />
    </>
  );
}
