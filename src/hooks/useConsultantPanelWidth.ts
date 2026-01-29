import { useState, useCallback } from 'react';

const STORAGE_KEY = 'hydra-dchat-panel-width';
const DEFAULT_WIDTH = 3; // Percentage, ~48px minimum (collapsed sidebar width)

export function useConsultantPanelWidth() {
  const [width, setWidth] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseFloat(stored) : DEFAULT_WIDTH;
  });

  const saveWidth = useCallback((newWidth: number) => {
    setWidth(newWidth);
    localStorage.setItem(STORAGE_KEY, String(newWidth));
  }, []);

  const isCollapsed = width <= 5; // Consider collapsed if 5% or less

  return { width, saveWidth, isCollapsed };
}
