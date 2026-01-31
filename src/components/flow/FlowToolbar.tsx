import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Save, 
  Download, 
  FileCode, 
  Image, 
  FileJson, 
  Plus,
  FolderOpen,
  ChevronDown,
  Copy,
  Check,
  FileText,
  Clipboard
} from 'lucide-react';
import { FlowDiagram } from '@/types/flow';

interface FlowToolbarProps {
  diagramName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onNew: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportJson: () => void;
  onExportYaml: () => void;
  onExportPdf: () => void;
  onCopyToClipboard: () => void;
  onGenerateMermaid: () => string;
  savedDiagrams: FlowDiagram[];
  onLoadDiagram: (diagram: FlowDiagram) => void;
  isSaving: boolean;
  hasChanges: boolean;
}

export function FlowToolbar({
  diagramName,
  onNameChange,
  onSave,
  onNew,
  onExportPng,
  onExportSvg,
  onExportJson,
  onExportYaml,
  onExportPdf,
  onCopyToClipboard,
  onGenerateMermaid,
  savedDiagrams,
  onLoadDiagram,
  isSaving,
  hasChanges,
}: FlowToolbarProps) {
  const { t } = useLanguage();
  const [mermaidCode, setMermaidCode] = useState('');
  const [mermaidOpen, setMermaidOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateMermaid = () => {
    const code = onGenerateMermaid();
    setMermaidCode(code);
    setMermaidOpen(true);
  };

  const handleCopyMermaid = async () => {
    await navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-14 bg-card border-b border-border flex items-center gap-3 px-4">
      {/* Diagram name */}
      <Input
        value={diagramName}
        onChange={(e) => onNameChange(e.target.value)}
        className="w-48 h-8 text-sm"
        placeholder={t('flowEditor.newDiagram')}
      />
      
      {hasChanges && (
        <span className="text-xs text-muted-foreground">•</span>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <Button variant="outline" size="sm" onClick={onNew}>
        <Plus className="h-4 w-4 mr-1" />
        {t('flowEditor.newDiagram')}
      </Button>

      {/* Load diagram */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={savedDiagrams.length === 0}>
            <FolderOpen className="h-4 w-4 mr-1" />
            Открыть
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-60 overflow-auto">
          {savedDiagrams.map((diagram) => (
            <DropdownMenuItem
              key={diagram.id}
              onClick={() => onLoadDiagram(diagram)}
            >
              <div className="flex flex-col">
                <span>{diagram.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(diagram.updated_at).toLocaleDateString()}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onSave}
        disabled={isSaving}
      >
        <Save className="h-4 w-4 mr-1" />
        {t('flowEditor.save')}
      </Button>

      {/* Export dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            {t('flowEditor.export')}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExportPng}>
            <Image className="h-4 w-4 mr-2" />
            {t('flowEditor.exportPng')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportSvg}>
            <FileCode className="h-4 w-4 mr-2" />
            {t('flowEditor.exportSvg')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExportJson}>
            <FileJson className="h-4 w-4 mr-2" />
            {t('flowEditor.exportJson')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportYaml}>
            <FileText className="h-4 w-4 mr-2" />
            {t('flowEditor.exportYaml')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExportPdf}>
            <FileText className="h-4 w-4 mr-2" />
            {t('flowEditor.exportPdf')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCopyToClipboard}>
            <Clipboard className="h-4 w-4 mr-2" />
            {t('flowEditor.copyToClipboard')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mermaid dialog */}
      <Dialog open={mermaidOpen} onOpenChange={setMermaidOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={handleGenerateMermaid}>
            <FileCode className="h-4 w-4 mr-1" />
            {t('flowEditor.generateMermaid')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('flowEditor.generateMermaid')}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Textarea
              value={mermaidCode}
              readOnly
              className="font-mono text-sm min-h-[200px]"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleCopyMermaid}
            >
              {copied ? (
                <Check className="h-4 w-4 text-hydra-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
