import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload, MERMAID_TEMPLATE, AttachedFile } from '@/components/warroom/FileUpload';
import { FlowDiagramPickerDialog } from '@/components/warroom/FlowDiagramPickerDialog';
import { TimeoutSlider } from '@/components/warroom/TimeoutSlider';
import { MermaidPreview } from '@/components/warroom/MermaidPreview';
import { MermaidBlock } from '@/components/warroom/MermaidBlock';
import { PromptEngineerButton } from '@/components/warroom/PromptEngineerButton';
import { SupervisorWishesPicker } from '@/components/warroom/SupervisorWishesPicker';
import { HorizontalResizeHandle } from '@/components/ui/horizontal-resize-handle';
import { ModelOption } from '@/hooks/useAvailableModels';
import { cn } from '@/lib/utils';
import { Loader2, GitBranch, ChevronDown, ChevronUp, Send, Users, Lightbulb, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { MessageRole } from '@/config/roles';

// Re-export AttachedFile for external use
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
  // Files
  attachedFiles: AttachedFile[];
  onFilesChange: React.Dispatch<React.SetStateAction<AttachedFile[]>>;
  uploadProgress: UploadProgress | null;
  // Consultant
  availableModels: ModelOption[];
  selectedConsultant: string | null;
  onSelectConsultant: (id: string | null) => void;
  onSendToConsultant: () => void;
  // Timeout
  timeoutSeconds: number;
  onTimeoutChange: (value: number) => void;
  // Model count for send button
  selectedModelsCount: number;
  // Supervisor Wishes
  selectedWishes: string[];
  onWishesChange: (wishes: string[]) => void;
  activeRoles: MessageRole[];
  // Collapsible & resizable
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  supervisorDisplayName?: string | null;
}

export function ChatInputArea({
  input,
  onInputChange,
  onSend,
  onPaste,
  sending,
  disabled,
  attachedFiles,
  onFilesChange,
  uploadProgress,
  availableModels,
  selectedConsultant,
  onSelectConsultant,
  onSendToConsultant,
  timeoutSeconds,
  onTimeoutChange,
  selectedModelsCount,
  selectedWishes,
  onWishesChange,
  activeRoles,
  isCollapsed = false,
  onToggleCollapse,
  supervisorDisplayName,
}: ChatInputAreaProps) {
  const { t } = useLanguage();
  const [flowPickerOpen, setFlowPickerOpen] = useState(false);
   const textareaRef = useRef<HTMLTextAreaElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
   const [textareaHeight, setTextareaHeight] = useState(80);
   const isResizing = useRef(false);
 
   // Handle resize drag
   const handleResizeStart = useCallback((e: React.MouseEvent) => {
     e.preventDefault();
     isResizing.current = true;
     const startY = e.clientY;
     const startHeight = textareaHeight;
 
     const handleMouseMove = (moveEvent: MouseEvent) => {
       if (!isResizing.current) return;
       const delta = startY - moveEvent.clientY;
       const newHeight = Math.max(60, Math.min(300, startHeight + delta));
       setTextareaHeight(newHeight);
     };
 
     const handleMouseUp = () => {
       isResizing.current = false;
       document.removeEventListener('mousemove', handleMouseMove);
       document.removeEventListener('mouseup', handleMouseUp);
       // Save to localStorage
       try {
         localStorage.setItem('hydra-main-input-textarea-height', String(textareaHeight));
       } catch { /* ignore */ }
     };
 
     document.addEventListener('mousemove', handleMouseMove);
     document.addEventListener('mouseup', handleMouseUp);
   }, [textareaHeight]);
 
   // Load saved height on mount
   useEffect(() => {
     try {
       const saved = localStorage.getItem('hydra-main-input-textarea-height');
       if (saved) {
         const h = parseInt(saved, 10);
         if (!isNaN(h) && h >= 60 && h <= 300) {
           setTextareaHeight(h);
         }
       }
     } catch { /* ignore */ }
   }, []);
 
   // Focus textarea when expanding
   useEffect(() => {
     if (!isCollapsed && textareaRef.current) {
       textareaRef.current.focus();
     }
   }, [isCollapsed]);

  // Handler to attach Mermaid diagram (instead of inserting into text)
  const handleAttachMermaid = useCallback((content: string, name?: string) => {
    const newAttachment: AttachedFile = {
      id: `mermaid-${Date.now()}`,
      mermaidContent: content,
      mermaidName: name || 'Diagram',
    };
    onFilesChange(files => [...files, newAttachment]);
  }, [onFilesChange]);

  // Handler for flow diagram selection
  const handleFlowDiagramSelect = useCallback((mermaidCode: string, diagramName: string) => {
    handleAttachMermaid(mermaidCode, diagramName);
  }, [handleAttachMermaid]);

  // Remove attachment handler
  const handleRemoveAttachment = useCallback((id: string, preview?: string) => {
    if (preview) URL.revokeObjectURL(preview);
    onFilesChange(files => files.filter(f => f.id !== id));
  }, [onFilesChange]);

  return (
     <div ref={containerRef} className="border-t border-border bg-card/50">
      <div className="max-w-4xl mx-auto">
         {/* Collapsed state - compact bar */}
         {isCollapsed ? (
           <div className="flex items-center gap-2 px-4 py-3 h-14">
             <Tooltip>
               <TooltipTrigger asChild>
                 <Button
                   variant="ghost"
                   size="icon"
                   className="h-8 w-8 shrink-0"
                   onClick={onToggleCollapse}
                 >
                   <ChevronUp className="h-4 w-4" />
                 </Button>
               </TooltipTrigger>
               <TooltipContent>{t('expertPanel.expandInput')}</TooltipContent>
             </Tooltip>
             <button
               onClick={onToggleCollapse}
               className="flex-1 text-left text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-muted/50"
             >
               {t('expertPanel.clickToType')}
             </button>
              {/* Simple send button in collapsed mode */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onSend}
                    disabled={disabled}
                    size="icon"
                    className="h-9 w-9 hydra-glow-sm"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('send.toAllExperts')} ({selectedModelsCount})</TooltipContent>
              </Tooltip>
           </div>
         ) : (
           <div className="p-4">
        {/* Upload progress indicator */}
        {uploadProgress && (
          <div className="mb-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{t('files.uploading')}</span>
                  <span className="text-muted-foreground">
                    {uploadProgress.current}/{uploadProgress.total}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File preview area */}
        {attachedFiles.length > 0 && !uploadProgress && (
          <div className="mb-3 flex flex-wrap gap-2 p-2 rounded-lg border border-dashed border-border/50 bg-muted/30">
            {attachedFiles.map((attached) => {
              // Mermaid diagram attachment
              if (attached.mermaidContent) {
                return (
                  <Dialog key={attached.id}>
                    <div className="relative group">
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "rounded-md overflow-hidden border border-hydra-cyan/30",
                            "bg-background/80 w-24 cursor-pointer",
                            "hover:border-hydra-cyan/60 transition-colors"
                          )}
                        >
                          <div className="p-1">
                            <MermaidPreview 
                              content={attached.mermaidContent} 
                              maxHeight={64}
                            />
                          </div>
                          <div className="flex items-center gap-1 px-1.5 pb-1">
                            <GitBranch className="h-3 w-3 text-hydra-cyan shrink-0" />
                            <span className="text-[10px] text-muted-foreground truncate">
                              {attached.mermaidName}
                            </span>
                          </div>
                        </button>
                      </DialogTrigger>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAttachment(attached.id);
                        }}
                        className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <span className="sr-only">Remove</span>
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <DialogContent className="max-w-4xl max-h-[85vh] p-4 overflow-auto">
                      <MermaidBlock content={attached.mermaidContent} />
                    </DialogContent>
                  </Dialog>
                );
              }

              // Regular file attachment
              const isImage = attached.file?.type.startsWith('image/');
              return (
                <div
                  key={attached.id}
                  className={cn(
                    "relative group rounded-md overflow-hidden border border-border/50",
                    "bg-background/80 flex items-center",
                    isImage ? "w-16 h-16" : "px-2 py-1 gap-1"
                  )}
                >
                  {isImage && attached.preview ? (
                    <img
                      src={attached.preview}
                      alt={attached.file?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs truncate max-w-[100px]">
                      {attached.file?.name}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(attached.id, attached.preview)}
                    className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="sr-only">Remove</span>
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

              {/* Resize handle */}
              <HorizontalResizeHandle onResizeStart={handleResizeStart} className="mb-2" />
 
              <div className="flex gap-2 items-stretch">
                {/* Left toolbar - vertical column */}
                <div className="flex flex-col gap-1 justify-end">
                  {/* Collapse toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={onToggleCollapse}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{t('expertPanel.collapseInput')}</TooltipContent>
                  </Tooltip>

                  {/* File upload */}
                  <FileUpload
                    files={attachedFiles}
                    onFilesChange={onFilesChange}
                    onAttachMermaid={handleAttachMermaid}
                    onSelectFlowDiagram={() => setFlowPickerOpen(true)}
                    disabled={sending}
                  />

                   {/* Timeout setting */}
                   <TimeoutSlider
                     value={timeoutSeconds}
                     onChange={onTimeoutChange}
                     disabled={sending}
                   />

                   {/* Supervisor Wishes Picker */}
                   <SupervisorWishesPicker
                     selectedWishes={selectedWishes}
                     onWishesChange={onWishesChange}
                     activeRoles={activeRoles}
                     disabled={sending}
                     supervisorDisplayName={supervisorDisplayName}
                   />

                   {/* Prompt Engineer button */}
                  <PromptEngineerButton
                    currentInput={input}
                    onOptimizedPrompt={onInputChange}
                    disabled={sending}
                  />
                </div>

                {/* Textarea - center */}
                <Textarea
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  placeholder={t('expertPanel.placeholder')}
                  ref={textareaRef}
                  style={{ height: textareaHeight }}
                  className="flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  onPaste={onPaste}
                />

                {/* Right toolbar - vertical column */}
                <div className="flex flex-col gap-1 justify-end">
                  {/* Send to all experts */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={onSend}
                        disabled={disabled}
                        size="icon"
                        className="h-9 w-9 hydra-glow-sm"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Users className="h-3 w-3 absolute top-1 right-1 opacity-60" />
                            <Send className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">{t('send.toAllExperts')} ({selectedModelsCount})</TooltipContent>
                  </Tooltip>

                  {/* Consultant selector */}
                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-9 w-9 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10",
                              selectedConsultant && "bg-amber-500/20 border-amber-500/50"
                            )}
                            disabled={sending}
                          >
                            <Lightbulb className="h-4 w-4 text-amber-400" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="left">{t('consultant.selectModel')}</TooltipContent>
                    </Tooltip>
                    <PopoverContent className="w-64 p-2" align="end" side="top">
                      <div className="space-y-1">
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          {t('consultant.selectModel')}
                        </div>
                        {selectedConsultant && (
                          <>
                            <button
                              onClick={() => onSelectConsultant(null)}
                              className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                              <span>{t('consultant.deselect')}</span>
                            </button>
                            <div className="h-px bg-border my-1" />
                          </>
                        )}
                        {availableModels.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => onSelectConsultant(selectedConsultant === model.id ? null : model.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors",
                              "hover:bg-amber-500/10",
                              selectedConsultant === model.id && "bg-amber-500/20 text-amber-400"
                            )}
                          >
                            <Lightbulb className="h-4 w-4 text-amber-400" />
                            <span className="truncate">{model.name}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Send to consultant (only when selected) */}
                  {selectedConsultant && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={onSendToConsultant}
                          disabled={sending || (!input.trim() && attachedFiles.length === 0)}
                          size="icon"
                          className="h-9 w-9 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
                          variant="outline"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Lightbulb className="h-3 w-3 absolute top-1 right-1 opacity-60" />
                              <Send className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {t('consultant.askOnly')}: {availableModels.find(m => m.id === selectedConsultant)?.name}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
           </div>
         )}
      </div>

      {/* Flow diagram picker dialog */}
      <FlowDiagramPickerDialog
        open={flowPickerOpen}
        onOpenChange={setFlowPickerOpen}
        onSelect={handleFlowDiagramSelect}
      />
    </div>
  );
}
