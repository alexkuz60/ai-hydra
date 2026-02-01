import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TextSelectionPopupProps {
  containerRef: React.RefObject<HTMLElement>;
  onClarify: (text: string) => void;
}

export function TextSelectionPopup({ containerRef, onClarify }: TextSelectionPopupProps) {
  const { t } = useLanguage();
  const [selectedText, setSelectedText] = useState('');
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0 && selection?.rangeCount) {
        // Check if selection is within our container
        const range = selection.getRangeAt(0);
        const container = containerRef.current;
        
        if (container && container.contains(range.commonAncestorContainer)) {
          const rect = range.getBoundingClientRect();
          
          setSelectedText(text);
          setPopupPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 8
          });
        }
      }
    }, 10);
  }, [containerRef]);

  const handleClearSelection = useCallback((e: MouseEvent) => {
    // Don't clear if clicking on the popup itself
    if (popupRef.current && popupRef.current.contains(e.target as Node)) {
      return;
    }
    
    // Clear popup when clicking anywhere else
    setPopupPosition(null);
    setSelectedText('');
  }, []);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    // If selection is empty or cleared, hide popup
    if (!text || text.length === 0) {
      setPopupPosition(null);
      setSelectedText('');
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleClearSelection);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClearSelection);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [containerRef, handleMouseUp, handleClearSelection, handleSelectionChange]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectedText) {
      onClarify(selectedText);
      setPopupPosition(null);
      setSelectedText('');
      // Clear the selection
      window.getSelection()?.removeAllRanges();
    }
  }, [selectedText, onClarify]);

  if (!popupPosition) return null;

  return (
    <div
      ref={popupRef}
      className={cn(
        "fixed z-50 transform -translate-x-1/2 -translate-y-full",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
      )}
      style={{
        left: popupPosition.x,
        top: popupPosition.y
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8 rounded-full bg-hydra-consultant text-white shadow-lg hover:bg-hydra-consultant/90 hover:scale-110 transition-all"
            onClick={handleClick}
          >
            <Lightbulb className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-background border-border">
          <p>{t('dchat.clarifyWithSpecialist')}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
