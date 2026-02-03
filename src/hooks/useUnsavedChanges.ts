import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for tracking unsaved changes and prompting for confirmation
 * before destructive navigation or actions.
 */
export interface UseUnsavedChangesReturn {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Mark changes as present or absent */
  setHasUnsavedChanges: (value: boolean) => void;
  /** Called when trying to leave/navigate - returns true if can proceed */
  confirmNavigation: () => boolean;
  /** Call when changes are saved successfully */
  markSaved: () => void;
  /** Dialog control state */
  showConfirmDialog: boolean;
  /** Pending action to execute after confirmation */
  pendingAction: (() => void) | null;
  /** Confirm and proceed with pending action */
  confirmAndProceed: () => void;
  /** Cancel the pending navigation */
  cancelNavigation: () => void;
  /** Wrap an action that requires confirmation if unsaved changes exist */
  withConfirmation: (action: () => void) => void;
}

export function useUnsavedChanges(initialValue = false): UseUnsavedChangesReturn {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(initialValue);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Warn on browser close/refresh with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const confirmNavigation = useCallback(() => {
    if (!hasUnsavedChanges) return true;
    // If changes exist, show dialog
    setShowConfirmDialog(true);
    return false;
  }, [hasUnsavedChanges]);

  const markSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    setPendingAction(null);
    setShowConfirmDialog(false);
  }, []);

  const confirmAndProceed = useCallback(() => {
    setShowConfirmDialog(false);
    setHasUnsavedChanges(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const cancelNavigation = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  }, []);

  const withConfirmation = useCallback((action: () => void) => {
    if (!hasUnsavedChanges) {
      action();
      return;
    }
    setPendingAction(() => action);
    setShowConfirmDialog(true);
  }, [hasUnsavedChanges]);

  return {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    confirmNavigation,
    markSaved,
    showConfirmDialog,
    pendingAction,
    confirmAndProceed,
    cancelNavigation,
    withConfirmation,
  };
}
