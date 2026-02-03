import React, { useCallback, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload, MERMAID_TEMPLATE, AttachedFile } from '@/components/warroom/FileUpload';
import { FlowDiagramPickerDialog } from '@/components/warroom/FlowDiagramPickerDialog';
import { TimeoutSlider } from '@/components/warroom/TimeoutSlider';
import { UnifiedSendButton } from '@/components/warroom/UnifiedSendButton';
import { MermaidPreview } from '@/components/warroom/MermaidPreview';
import { MermaidBlock } from '@/components/warroom/MermaidBlock';
import { PromptEngineerButton } from '@/components/warroom/PromptEngineerButton';
import { ModelOption } from '@/hooks/useAvailableModels';
import { cn } from '@/lib/utils';
import { Loader2, GitBranch } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

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
}: ChatInputAreaProps) {
  const { t } = useLanguage();
  const [flowPickerOpen, setFlowPickerOpen] = useState(false);

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
    <div className="border-t border-border p-4 bg-background/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
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

        <div className="flex gap-3 items-end">
          {/* Attach button */}
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

          {/* Prompt Engineer button */}
          <PromptEngineerButton
            currentInput={input}
            onOptimizedPrompt={onInputChange}
            disabled={sending}
          />

          <Textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={t('expertPanel.placeholder')}
            className="flex-1 min-h-[60px] max-h-[200px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            onPaste={onPaste}
          />

          {/* Unified send button */}
          <UnifiedSendButton
            onSendToAll={onSend}
            onSendToConsultant={onSendToConsultant}
            sending={sending}
            disabled={disabled}
            hasMessage={!!input.trim() || attachedFiles.length > 0}
            selectedModelsCount={selectedModelsCount}
            availableModels={availableModels}
            selectedConsultant={selectedConsultant}
            onSelectConsultant={onSelectConsultant}
          />
        </div>
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
