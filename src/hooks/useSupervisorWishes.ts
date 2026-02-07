import { useState, useEffect } from 'react';

/**
 * Shared hook for managing Supervisor Wishes state with localStorage persistence.
 * Used by both ExpertPanel (main chat) and ConsultantPanel (D-Chat).
 */
export function useSupervisorWishes(sessionId: string | null) {
  const [selectedWishes, setSelectedWishes] = useState<string[]>([]);

  // Load from localStorage on session change
  useEffect(() => {
    if (!sessionId) return;

    try {
      const key = `hydra-supervisor-wishes-${sessionId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const wishes = JSON.parse(saved);
        if (Array.isArray(wishes)) {
          setSelectedWishes(wishes);
        }
      }
    } catch (error) {
      console.error('Failed to load supervisor wishes from localStorage:', error);
    }
  }, [sessionId]);

  // Save to localStorage when they change
  useEffect(() => {
    if (!sessionId) return;

    try {
      const key = `hydra-supervisor-wishes-${sessionId}`;
      localStorage.setItem(key, JSON.stringify(selectedWishes));
    } catch (error) {
      console.error('Failed to save supervisor wishes to localStorage:', error);
    }
  }, [selectedWishes, sessionId]);

  return { selectedWishes, setSelectedWishes };
}
