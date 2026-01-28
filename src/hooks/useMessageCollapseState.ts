import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY_PREFIX = 'hydra-collapsed-messages-';

export function useMessageCollapseState(taskId: string | null) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Load from localStorage on mount or taskId change
  useEffect(() => {
    if (!taskId) {
      setCollapsedIds(new Set());
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + taskId);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCollapsedIds(new Set(parsed));
        }
      } else {
        setCollapsedIds(new Set());
      }
    } catch (e) {
      console.error('Failed to load collapsed state:', e);
      setCollapsedIds(new Set());
    }
  }, [taskId]);

  // Save to localStorage whenever collapsedIds changes
  const saveToStorage = useCallback((ids: Set<string>) => {
    if (!taskId) return;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + taskId, JSON.stringify([...ids]));
    } catch (e) {
      console.error('Failed to save collapsed state:', e);
    }
  }, [taskId]);

  const isCollapsed = useCallback((messageId: string) => {
    return collapsedIds.has(messageId);
  }, [collapsedIds]);

  const toggleCollapsed = useCallback((messageId: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      saveToStorage(next);
      return next;
    });
  }, [saveToStorage]);

  const collapseAll = useCallback((messageIds: string[]) => {
    const next = new Set(messageIds);
    setCollapsedIds(next);
    saveToStorage(next);
  }, [saveToStorage]);

  const expandAll = useCallback(() => {
    const next = new Set<string>();
    setCollapsedIds(next);
    saveToStorage(next);
  }, [saveToStorage]);

  return {
    isCollapsed,
    toggleCollapsed,
    collapseAll,
    expandAll,
    collapsedCount: collapsedIds.size,
  };
}
