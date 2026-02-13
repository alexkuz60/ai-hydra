import React, { useState, useMemo } from 'react';
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
  Clipboard,
  Undo2,
  Redo2,
  LayoutGrid,
  ArrowRight,
  ArrowDown,
  History,
  Play,
  Square,
  Loader2,
  Route,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FlowDiagram, FlowNodeData } from '@/types/flow';
import { EdgeStyleSettings } from '@/types/edgeTypes';
import { EdgeStyleSelector } from './EdgeStyleSelector';
import { DiagramHistoryDialog } from './DiagramHistoryDialog';
import { CONTEST_FLOW_TEMPLATES } from '@/lib/contestFlowTemplates';
import { Swords } from 'lucide-react';

interface FlowToolbarProps {
  diagramName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onNew: () => void;
  onNewFromTemplate?: (templateId: string) => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportJson: () => void;
  onExportYaml: () => void;
  onExportPdf: () => void;
  onCopyToClipboard: () => void;
  onGenerateMermaid: () => string;
  savedDiagrams: FlowDiagram[];
  currentDiagramId: string | null;
  onLoadDiagram: (diagram: FlowDiagram) => void;
  onDeleteDiagram?: (id: string) => void;
  isSaving: boolean;
  hasChanges: boolean;
  edgeSettings: EdgeStyleSettings;
  onEdgeSettingsChange: (settings: EdgeStyleSettings) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAutoLayout: (direction: 'LR' | 'TB') => void;
  // Execution
  isExecuting?: boolean;
  onStartExecution?: () => void;
  onStopExecution?: () => void;
  canExecute?: boolean;
  // Logistics
  onToggleLogistics?: () => void;
  isLogisticsOpen?: boolean;
}

// Header actions component for Layout header slot
export function FlowHeaderActions({
  diagramName,
  savedDiagrams,
  currentDiagramId,
  onLoadDiagram,
  onDeleteDiagram,
  onSave,
  onNew,
  onNewFromTemplate,
  onExportPng,
  onExportSvg,
  onExportJson,
  onExportYaml,
  onExportPdf,
  onCopyToClipboard,
  onGenerateMermaid,
  isSaving,
  hasChanges,
}: Pick<FlowToolbarProps, 
  'diagramName' | 'savedDiagrams' | 'currentDiagramId' | 'onLoadDiagram' | 'onDeleteDiagram' |
  'onSave' | 'onNew' | 'onNewFromTemplate' | 'onExportPng' | 'onExportSvg' | 'onExportJson' | 'onExportYaml' |
  'onExportPdf' | 'onCopyToClipboard' | 'onGenerateMermaid' | 'isSaving' | 'hasChanges'
>) {
  const { t, language } = useLanguage();
  const [mermaidCode, setMermaidCode] = useState('');
  const [mermaidOpen, setMermaidOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const uniqueDiagrams = useMemo(() => {
    const byName = new Map<string, FlowDiagram>();
    for (const diagram of savedDiagrams) {
      if (!byName.has(diagram.name)) {
        byName.set(diagram.name, diagram);
      }
    }
    return Array.from(byName.values());
  }, [savedDiagrams]);

  const hasVersionHistory = useMemo(() => {
    return savedDiagrams.filter(d => d.name === diagramName).length > 1;
  }, [savedDiagrams, diagramName]);

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
    <>
      {/* Open diagram */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={uniqueDiagrams.length === 0} className="h-7 text-xs">
            <FolderOpen className="h-3.5 w-3.5 mr-1" />
            {t('flowEditor.open')}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-60 overflow-auto">
          {uniqueDiagrams.map((diagram) => (
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

      {/* History button */}
      {hasVersionHistory && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('flowEditor.versionHistory')}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Save */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onSave}
        disabled={isSaving}
        className="h-7 text-xs"
      >
        <Save className="h-3.5 w-3.5 mr-1" />
        {t('flowEditor.save')}
        {hasChanges && <span className="ml-1 text-hydra-warning">•</span>}
      </Button>

      {/* New — with template dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t('flowEditor.newDiagram')}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onNew}>
            <Plus className="h-4 w-4 mr-2" />
            {t('flowEditor.newDiagram')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {Object.entries(CONTEST_FLOW_TEMPLATES).map(([key, tpl]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onNewFromTemplate?.(key)}
            >
              <Swords className="h-4 w-4 mr-2" />
              {language === 'ru' ? tpl.ru : tpl.en}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Download className="h-3.5 w-3.5 mr-1" />
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleGenerateMermaid}>
            <FileCode className="h-4 w-4 mr-2" />
            {t('flowEditor.generateMermaid')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mermaid dialog */}
      <Dialog open={mermaidOpen} onOpenChange={setMermaidOpen}>
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

      {/* History dialog */}
      <DiagramHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        diagramName={diagramName}
        allDiagrams={savedDiagrams}
        currentDiagramId={currentDiagramId}
        onLoadDiagram={onLoadDiagram}
        onDeleteDiagram={onDeleteDiagram}
      />
    </>
  );
}

export function FlowToolbar({
  diagramName,
  onNameChange,
  edgeSettings,
  onEdgeSettingsChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAutoLayout,
  hasChanges,
  isExecuting,
  onStartExecution,
  onStopExecution,
  canExecute,
  onToggleLogistics,
  isLogisticsOpen,
}: Pick<FlowToolbarProps, 
  'diagramName' | 'onNameChange' | 'edgeSettings' | 'onEdgeSettingsChange' |
  'canUndo' | 'canRedo' | 'onUndo' | 'onRedo' | 'onAutoLayout' | 'hasChanges' |
  'isExecuting' | 'onStartExecution' | 'onStopExecution' | 'canExecute' |
  'onToggleLogistics' | 'isLogisticsOpen'
>) {
  const { t } = useLanguage();

  return (
    <div className="h-12 bg-card border-b border-border flex items-center gap-3 px-4">
      {/* Diagram name */}
      <Input
        value={diagramName}
        onChange={(e) => onNameChange(e.target.value)}
        className="w-48 h-8 text-sm"
        placeholder={t('flowEditor.newDiagram')}
        data-guide="flow-diagram-name"
      />
      
      {hasChanges && (
        <span className="text-xs text-muted-foreground">•</span>
      )}

      {/* Undo/Redo buttons */}
      <div className="flex items-center gap-1 border-l border-border pl-3" data-guide="flow-undo-redo">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Отменить (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Повторить (Ctrl+Shift+Z)</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1" />

      {/* Run/Stop button - icon only */}
      {onStartExecution && onStopExecution && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isExecuting ? 'destructive' : 'default'}
              size="icon"
              className="h-8 w-8"
              data-guide="flow-execute-btn"
              onClick={isExecuting ? onStopExecution : onStartExecution}
              disabled={!canExecute && !isExecuting}
            >
              {isExecuting ? (
                <Square className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isExecuting ? t('flowEditor.stopExecution') : t('flowEditor.runDiagram')}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Logistics button */}
      {onToggleLogistics && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isLogisticsOpen ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={onToggleLogistics}
              data-guide="flow-logistics-btn"
            >
              <Route className="h-4 w-4 text-hydra-flowregulator" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('flowEditor.logistics.title')}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Auto Layout - right aligned */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1" data-guide="flow-auto-layout">
            <LayoutGrid className="h-4 w-4" />
            {t('flowEditor.autoLayout')}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onAutoLayout('LR')}>
            <ArrowRight className="h-4 w-4 mr-2" />
            {t('flowEditor.layoutHorizontal')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAutoLayout('TB')}>
            <ArrowDown className="h-4 w-4 mr-2" />
            {t('flowEditor.layoutVertical')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edge Style Selector */}
      <span data-guide="flow-edge-style">
      <EdgeStyleSelector
        settings={edgeSettings}
        onSettingsChange={onEdgeSettingsChange}
      />
      </span>
    </div>
  );
}
