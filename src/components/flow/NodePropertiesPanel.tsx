import React, { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import {
  X, ArrowDownToLine, ArrowUpFromLine, FileText, Brain, GitBranch, Wrench,
  Shuffle, Filter, Combine, Split, Database, Globe, HardDrive, Repeat, Clock, LayoutList,
  Sparkles, MemoryStick, Tags, Group, SkipForward, Languages
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { FlowNodeType } from '@/types/flow';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseNodeForm } from './properties/DatabaseNodeForm';
import { ApiNodeForm } from './properties/ApiNodeForm';
import { StorageNodeForm } from './properties/StorageNodeForm';
import {
  InputNodeForm, OutputNodeForm, ModelNodeForm, PromptNodeForm, ToolNodeForm,
  ConditionNodeForm, TransformNodeForm, FilterNodeForm, MergeNodeForm, SplitNodeForm,
  LoopNodeForm, DelayNodeForm, SwitchNodeForm,
  EmbeddingNodeForm, MemoryNodeForm, ClassifierNodeForm, TranslateNodeForm, DefaultNodeForm,
} from './properties/NodeForms';

interface PromptLibraryItem {
  id: string; name: string; content: string; role: string; description: string | null;
}

interface CustomToolItem {
  id: string; name: string; display_name: string; description: string; tool_type: string; parameters: unknown;
}

interface NodePropertiesPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onUpdateNode: (nodeId: string, data: Record<string, unknown>) => void;
  onDeleteNode: (nodeId: string) => void;
}

const nodeIcons: Record<FlowNodeType, React.ElementType> = {
  input: ArrowDownToLine, output: ArrowUpFromLine, prompt: FileText, model: Brain,
  condition: GitBranch, tool: Wrench, transform: Shuffle, filter: Filter,
  merge: Combine, split: Split, database: Database, api: Globe,
  storage: HardDrive, loop: Repeat, delay: Clock, switch: LayoutList,
  embedding: Sparkles, memory: MemoryStick, classifier: Tags, translate: Languages,
  group: Group,
};

const nodeColors: Record<FlowNodeType, string> = {
  input: 'text-hydra-info', output: 'text-hydra-glow', prompt: 'text-primary',
  model: 'text-hydra-success', condition: 'text-hydra-warning', tool: 'text-hydra-expert',
  transform: 'text-hydra-analyst', filter: 'text-hydra-warning', merge: 'text-hydra-advisor',
  split: 'text-hydra-archivist', database: 'text-hydra-analyst', api: 'text-hydra-webhunter',
  storage: 'text-hydra-archivist', loop: 'text-hydra-moderator', delay: 'text-muted-foreground',
  switch: 'text-hydra-warning', embedding: 'text-hydra-expert', memory: 'text-hydra-advisor',
  classifier: 'text-hydra-success', translate: 'text-hydra-translator', group: 'text-primary',
};

export function NodePropertiesPanel({ selectedNode, onClose, onUpdateNode, onDeleteNode }: NodePropertiesPanelProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<PromptLibraryItem[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [tools, setTools] = useState<CustomToolItem[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadPrompts = async () => {
      setLoadingPrompts(true);
      try {
        const { data, error } = await supabase.from('prompt_library').select('id, name, content, role, description').or(`user_id.eq.${user.id},is_shared.eq.true`).order('name');
        if (error) throw error;
        setPrompts(data || []);
      } catch (error) { console.error('Failed to load prompts:', error); } finally { setLoadingPrompts(false); }
    };
    loadPrompts();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const loadTools = async () => {
      setLoadingTools(true);
      try {
        const { data, error } = await supabase.rpc('get_custom_tools_safe');
        if (error) throw error;
        setTools((data || []).map(t => ({ id: t.id, name: t.name, display_name: t.display_name, description: t.description, tool_type: t.tool_type, parameters: t.parameters })));
      } catch (error) { console.error('Failed to load tools:', error); } finally { setLoadingTools(false); }
    };
    loadTools();
  }, [user]);

  if (!selectedNode) return null;

  const nodeType = selectedNode.type as FlowNodeType;
  const Icon = nodeIcons[nodeType] || FileText;
  const iconColor = nodeColors[nodeType] || 'text-muted-foreground';

  const handleDataChange = (key: string, value: unknown) => {
    onUpdateNode(selectedNode.id, { ...selectedNode.data, [key]: value });
  };

  const handlePromptSelect = (promptId: string) => {
    const p = prompts.find(p => p.id === promptId);
    if (p) onUpdateNode(selectedNode.id, { ...selectedNode.data, label: p.name, promptId: p.id, promptContent: p.content, promptRole: p.role });
  };

  const handleToolSelect = (toolId: string) => {
    const t = tools.find(t => t.id === toolId);
    if (t) onUpdateNode(selectedNode.id, { ...selectedNode.data, label: t.display_name, toolId: t.id, toolName: t.name, toolType: t.tool_type, toolConfig: t.parameters });
  };

  const renderForm = () => {
    const props = { node: selectedNode, onDataChange: handleDataChange };
    switch (nodeType) {
      case 'input': return <InputNodeForm {...props} />;
      case 'output': return <OutputNodeForm {...props} />;
      case 'model': return <ModelNodeForm {...props} />;
      case 'prompt': return <PromptNodeForm {...props} prompts={prompts} loadingPrompts={loadingPrompts} onPromptSelect={handlePromptSelect} />;
      case 'tool': return <ToolNodeForm {...props} tools={tools} loadingTools={loadingTools} onToolSelect={handleToolSelect} />;
      case 'condition': return <ConditionNodeForm {...props} />;
      case 'transform': return <TransformNodeForm {...props} />;
      case 'filter': return <FilterNodeForm {...props} />;
      case 'merge': return <MergeNodeForm {...props} />;
      case 'split': return <SplitNodeForm {...props} />;
      case 'database': return <DatabaseNodeForm node={selectedNode} onDataChange={handleDataChange} />;
      case 'api': return <ApiNodeForm node={selectedNode} onDataChange={handleDataChange} />;
      case 'storage': return <StorageNodeForm node={selectedNode} onDataChange={handleDataChange} />;
      case 'loop': return <LoopNodeForm {...props} />;
      case 'delay': return <DelayNodeForm {...props} />;
      case 'switch': return <SwitchNodeForm {...props} />;
      case 'embedding': return <EmbeddingNodeForm {...props} />;
      case 'memory': return <MemoryNodeForm {...props} />;
      case 'classifier': return <ClassifierNodeForm {...props} />;
      case 'translate': return <TranslateNodeForm {...props} />;
      default: return <DefaultNodeForm {...props} />;
    }
  };

  return (
    <Card className="w-80 h-full border-l rounded-none overflow-hidden flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={cn('h-5 w-5', iconColor)} />
          {t('flowEditor.properties.title')}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-sm text-muted-foreground">
          {t(`flowEditor.nodes.${nodeType}`)} • ID: {selectedNode.id.slice(0, 8)}...
        </div>
        {renderForm()}
        <Separator className="my-4" />
        {nodeType !== 'group' && (
          <div className="flex items-center justify-between py-2 px-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <SkipForward className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <Label htmlFor="bypass-toggle" className="text-sm font-medium cursor-pointer">{t('flowEditor.properties.bypassNode')}</Label>
                <span className="text-xs text-muted-foreground">{t('flowEditor.properties.bypassHint')}</span>
              </div>
            </div>
            <Switch id="bypass-toggle" checked={Boolean(selectedNode.data.bypassed)} onCheckedChange={checked => handleDataChange('bypassed', checked)} />
          </div>
        )}
        <Separator className="my-4" />
        <Button variant="destructive" className="w-full" onClick={() => { onDeleteNode(selectedNode.id); onClose(); }}>
          {t('flowEditor.properties.deleteNode')}
        </Button>
      </CardContent>
    </Card>
  );
}
