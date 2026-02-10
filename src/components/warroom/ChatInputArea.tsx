import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload, AttachedFile } from '@/components/warroom/FileUpload';
import { FlowDiagramPickerDialog } from '@/components/warroom/FlowDiagramPickerDialog';
import { TimeoutSlider } from '@/components/warroom/TimeoutSlider';
import { PromptEngineerButton } from '@/components/warroom/PromptEngineerButton';
import { SupervisorWishesPicker } from '@/components/warroom/SupervisorWishesPicker';
import { HorizontalResizeHandle } from '@/components/ui/horizontal-resize-handle';
import { ChatInputAttachments } from '@/components/warroom/ChatInputAttachments';
import { ModelOption } from '@/hooks/useAvailableModels';
import { cn } from '@/lib/utils';
import { Loader2, ChevronDown, ChevronUp, Send, Users, Lightbulb, X, ListChecks } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { MessageRole } from '@/config/roles';

export type { AttachedFile };

export interface UploadProgress {
  current: number;
  total: number;
}

interface ChatInputAreaProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  sending: boolean;
  disabled: boolean;
  attachedFiles: AttachedFile[];
  onFilesChange: React.Dispatch<React.SetStateAction<AttachedFile[]>>;
  uploadProgress: UploadProgress | null;
  availableModels: ModelOption[];
  selectedConsultant: string | null;
  onSelectConsultant: (id: string | null) => void;
  onSendToConsultant: () => void;
  timeoutSeconds: number;
  onTimeoutChange: (value: number) => void;
  selectedModelsCount: number;
  selectedWishes: string[];
  onWishesChange: (wishes: string[]) => void;
  activeRoles: MessageRole[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  supervisorDisplayName?: string | null;
  interactiveChecklists?: boolean;
  onInteractiveChecklistsChange?: (value: boolean) => void;
}

export function ChatInputArea(props: ChatInputAreaProps) {
  const {
    input, onInputChange, onSend, onPaste, sending, disabled,
    attachedFiles, onFilesChange, uploadProgress,
    availableModels, selectedConsultant, onSelectConsultant, onSendToConsultant,
    timeoutSeconds, onTimeoutChange, selectedModelsCount,
    selectedWishes, onWishesChange, activeRoles,
    isCollapsed = false, onToggleCollapse, supervisorDisplayName,
    interactiveChecklists = false, onInteractiveChecklistsChange,
  } = props;

  const { t } = useLanguage();
  const [flowPickerOpen, setFlowPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_TEXTAREA_HEIGHT = 200;
  const MAX_TEXTAREA_HEIGHT = 400;
  const DEFAULT_TEXTAREA_HEIGHT = 200;

  const [textareaHeight, setTextareaHeight] = useState(DEFAULT_TEXTAREA_HEIGHT);
  const [isResizingState, setIsResizingState] = useState(false);
  const textareaHeightRef = useRef(DEFAULT_TEXTAREA_HEIGHT);
  const isResizing = useRef(false);

  useEffect(() => { textareaHeightRef.current = textareaHeight; }, [textareaHeight]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    setIsResizingState(true);
    const startY = e.clientY;
    const startHeight = textareaHeightRef.current;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startY - moveEvent.clientY;
      const newHeight = Math.max(MIN_TEXTAREA_HEIGHT, Math.min(MAX_TEXTAREA_HEIGHT, startHeight + delta));
      textareaHeightRef.current = newHeight;
      setTextareaHeight(newHeight);
    };
    const handleMouseUp = () => {
      isResizing.current = false;
      setIsResizingState(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      try { localStorage.setItem('hydra-main-chat-textarea-height', String(textareaHeightRef.current)); } catch { /* ignore */ }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hydra-main-chat-textarea-height');
      if (saved) {
        const h = parseInt(saved, 10);
        if (!isNaN(h) && h >= MIN_TEXTAREA_HEIGHT && h <= MAX_TEXTAREA_HEIGHT) {
          textareaHeightRef.current = h;
          setTextareaHeight(h);
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!isCollapsed && textareaRef.current) textareaRef.current.focus();
  }, [isCollapsed]);

  const handleAttachMermaid = useCallback((content: string, name?: string) => {
    const newAttachment: AttachedFile = { id: `mermaid-${Date.now()}`, mermaidContent: content, mermaidName: name || 'Diagram' };
    onFilesChange(files => [...files, newAttachment]);
  }, [onFilesChange]);

  const handleFlowDiagramSelect = useCallback((mermaidCode: string, diagramName: string) => {
    handleAttachMermaid(mermaidCode, diagramName);
  }, [handleAttachMermaid]);

  const handleRemoveAttachment = useCallback((id: string, preview?: string) => {
    if (preview) URL.revokeObjectURL(preview);
    onFilesChange(files => files.filter(f => f.id !== id));
  }, [onFilesChange]);

  return (
    <div ref={containerRef} className="border-t border-border bg-card/50 shrink-0">
      <div>
        {isCollapsed ? (
          <div className="flex items-center gap-2 px-3 py-3 h-14">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onToggleCollapse}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('expertPanel.expandInput')}</TooltipContent>
            </Tooltip>
            <button onClick={onToggleCollapse} className="flex-1 text-left text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted/50">
              {t('expertPanel.clickToType')}
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onSend} disabled={disabled} size="icon" className="h-9 w-9 hydra-glow-sm">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('send.toAllExperts')} ({selectedModelsCount})</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="px-3 py-3">
            <ChatInputAttachments attachedFiles={attachedFiles} uploadProgress={uploadProgress} onRemoveAttachment={handleRemoveAttachment} />

            <HorizontalResizeHandle onResizeStart={handleResizeStart} className="mb-1" isResizing={isResizingState} currentHeight={textareaHeight} />

            <div className="flex gap-2 items-stretch" style={{ height: textareaHeight }}>
              {/* Left toolbar */}
              <div className="flex flex-col gap-1 justify-end shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onToggleCollapse}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t('expertPanel.collapseInput')}</TooltipContent>
                </Tooltip>
                <span data-guide="chat-attach-btn"><FileUpload files={attachedFiles} onFilesChange={onFilesChange} onAttachMermaid={handleAttachMermaid} onSelectFlowDiagram={() => setFlowPickerOpen(true)} disabled={sending} /></span>
                <span data-guide="chat-timeout"><TimeoutSlider value={timeoutSeconds} onChange={onTimeoutChange} disabled={sending} /></span>
                <span data-guide="chat-wishes-btn"><SupervisorWishesPicker selectedWishes={selectedWishes} onWishesChange={onWishesChange} activeRoles={activeRoles} disabled={sending} supervisorDisplayName={supervisorDisplayName} /></span>
                {onInteractiveChecklistsChange && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant={interactiveChecklists ? 'default' : 'ghost'} size="icon"
                        className={cn("h-9 w-9", interactiveChecklists && "bg-primary/20 text-primary border border-primary/30")}
                        onClick={() => onInteractiveChecklistsChange(!interactiveChecklists)} disabled={sending}>
                        <ListChecks className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{interactiveChecklists ? t('checklists.interactive') : t('checklists.enable')}</TooltipContent>
                  </Tooltip>
                )}
                <PromptEngineerButton currentInput={input} onOptimizedPrompt={onInputChange} disabled={sending} />
              </div>

              {/* Textarea */}
              <Textarea
                data-guide="chat-textarea"
                value={input}
                onChange={e => onInputChange(e.target.value)}
                placeholder={t('expertPanel.placeholder')}
                ref={textareaRef}
                className="flex-1 resize-none h-full min-h-0"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                onPaste={onPaste}
              />

              {/* Right toolbar */}
              <div className="flex flex-col gap-1 justify-end shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={onSend} disabled={disabled} size="icon" className="h-9 w-9 hydra-glow-sm" data-guide="chat-send-btn">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Users className="h-3 w-3 absolute top-1 right-1 opacity-60" /><Send className="h-4 w-4" /></>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">{t('send.toAllExperts')} ({selectedModelsCount})</TooltipContent>
                </Tooltip>

                <Popover>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon"
                          className={cn("h-9 w-9 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10", selectedConsultant && "bg-amber-500/20 border-amber-500/50")}
                          disabled={sending}>
                          <Lightbulb className="h-4 w-4 text-amber-400" />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="left">{t('consultant.selectModel')}</TooltipContent>
                  </Tooltip>
                  <PopoverContent className="w-64 p-2" align="end" side="top">
                    <div className="space-y-1">
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{t('consultant.selectModel')}</div>
                      {selectedConsultant && (
                        <>
                          <button onClick={() => onSelectConsultant(null)} className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" /><span>{t('consultant.deselect')}</span>
                          </button>
                          <div className="h-px bg-border my-1" />
                        </>
                      )}
                      {availableModels.map(model => (
                        <button key={model.id} onClick={() => onSelectConsultant(selectedConsultant === model.id ? null : model.id)}
                          className={cn("w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors hover:bg-amber-500/10", selectedConsultant === model.id && "bg-amber-500/20 text-amber-400")}>
                          <Lightbulb className="h-4 w-4 text-amber-400" /><span className="truncate">{model.name}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {selectedConsultant && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={onSendToConsultant} disabled={sending || (!input.trim() && attachedFiles.length === 0)} size="icon"
                        className="h-9 w-9 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30" variant="outline">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Lightbulb className="h-3 w-3 absolute top-1 right-1 opacity-60" /><Send className="h-4 w-4" /></>}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">{t('consultant.askOnly')}: {availableModels.find(m => m.id === selectedConsultant)?.name}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <FlowDiagramPickerDialog open={flowPickerOpen} onOpenChange={setFlowPickerOpen} onSelect={handleFlowDiagramSelect} />
    </div>
  );
}
