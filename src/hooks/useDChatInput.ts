import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDChatInputOptions {
  storageKeyHeight?: string;
  storageKeyCollapsed?: string;
}

export function useDChatInput(options: UseDChatInputOptions = {}) {
  const {
    storageKeyHeight = 'hydra-dchat-input-height',
    storageKeyCollapsed = 'hydra-dchat-input-collapsed',
  } = options;

  const [inputCollapsed, setInputCollapsed] = useState(false);
  const [inputHeight, setInputHeight] = useState(60);
  const inputHeightRef = useRef(inputHeight);
  const isResizing = useRef(false);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep height ref in sync
  useEffect(() => {
    inputHeightRef.current = inputHeight;
  }, [inputHeight]);

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKeyHeight);
      if (saved) {
        const h = parseInt(saved, 10);
        if (!isNaN(h) && h >= 40 && h <= 200) setInputHeight(h);
      }
      const collapsedSaved = localStorage.getItem(storageKeyCollapsed);
      if (collapsedSaved) setInputCollapsed(collapsedSaved === 'true');
    } catch { /* ignore */ }
  }, [storageKeyHeight, storageKeyCollapsed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { resizeCleanupRef.current?.(); };
  }, []);

  // Resize drag handler
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startY = e.clientY;
    const startHeight = inputHeightRef.current;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startY - moveEvent.clientY;
      const newHeight = Math.max(40, Math.min(200, startHeight + delta));
      setInputHeight(newHeight);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      resizeCleanupRef.current = null;
      try {
        localStorage.setItem(storageKeyHeight, String(inputHeightRef.current));
      } catch { /* ignore */ }
    };

    resizeCleanupRef.current = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [storageKeyHeight]);

  // Toggle collapse
  const toggleInputCollapse = useCallback(() => {
    setInputCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(storageKeyCollapsed, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, [storageKeyCollapsed]);

  // Focus textarea when expanding
  useEffect(() => {
    if (!inputCollapsed && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [inputCollapsed]);

  return {
    inputCollapsed,
    inputHeight,
    textareaRef,
    handleResizeStart,
    toggleInputCollapse,
  };
}
