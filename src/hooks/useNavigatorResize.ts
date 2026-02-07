import { useState, useCallback, useRef, useEffect } from 'react';
import type { ImperativePanelHandle } from 'react-resizable-panels';

type NavigatorMode = 'min' | 'max';

const MIN_PANEL_SIZE = 4; // ~60px at typical widths
const DEFAULT_MAX_SIZE = 30; // default expanded size in %

interface UseNavigatorResizeOptions {
  storageKey: string;
  defaultMode?: NavigatorMode;
  minPanelSize?: number;
  defaultMaxSize?: number;
  maxPanelSize?: number;
}

interface UseNavigatorResizeReturn {
  isMinimized: boolean;
  toggle: () => void;
  panelSize: number;
  mode: NavigatorMode;
  /** Ref to attach to the content container for auto-width measurement */
  contentRef: React.RefObject<HTMLDivElement>;
  /** Ref to attach to ResizablePanel for imperative resize */
  panelRef: React.RefObject<ImperativePanelHandle>;
  /** Call when panel is resized manually by user */
  onPanelResize: (size: number) => void;
}

export function useNavigatorResize({
  storageKey,
  defaultMode = 'max',
  minPanelSize = MIN_PANEL_SIZE,
  defaultMaxSize = DEFAULT_MAX_SIZE,
  maxPanelSize = 50,
}: UseNavigatorResizeOptions): UseNavigatorResizeReturn {
  const [mode, setMode] = useState<NavigatorMode>(() => {
    try {
      const stored = localStorage.getItem(`hydra-nav-mode-${storageKey}`);
      if (stored === 'min' || stored === 'max') return stored;
    } catch { /* ignore */ }
    return defaultMode;
  });

  const [maxSize, setMaxSize] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`hydra-nav-size-${storageKey}`);
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed > minPanelSize) return parsed;
      }
    } catch { /* ignore */ }
    return defaultMaxSize;
  });

  const contentRef = useRef<HTMLDivElement>(null!);
  const panelRef = useRef<ImperativePanelHandle>(null);

  // Persist mode
  useEffect(() => {
    try {
      localStorage.setItem(`hydra-nav-mode-${storageKey}`, mode);
    } catch { /* ignore */ }
  }, [mode, storageKey]);

  // Persist max size
  useEffect(() => {
    try {
      localStorage.setItem(`hydra-nav-size-${storageKey}`, String(maxSize));
    } catch { /* ignore */ }
  }, [maxSize, storageKey]);

  const toggle = useCallback(() => {
    setMode(prev => {
      const next = prev === 'min' ? 'max' : 'min';
      // Imperatively resize the panel
      const targetSize = next === 'min' ? minPanelSize : maxSize;
      requestAnimationFrame(() => {
        panelRef.current?.resize(targetSize);
      });
      return next;
    });
  }, [minPanelSize, maxSize]);

  const onPanelResize = useCallback((size: number) => {
    // If user manually resizes while in max mode, remember the size
    if (mode === 'max' && size > minPanelSize + 1) {
      setMaxSize(size);
    }
  }, [mode, minPanelSize]);

  const panelSize = mode === 'min' ? minPanelSize : maxSize;

  return {
    isMinimized: mode === 'min',
    toggle,
    panelSize,
    mode,
    contentRef,
    panelRef,
    onPanelResize,
  };
}
