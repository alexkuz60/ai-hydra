import React, { useEffect, useState } from 'react';
import { Node } from '@xyflow/react';
import { 
  X, ArrowDownToLine, ArrowUpFromLine, FileText, Brain, GitBranch, Wrench, Library,
  Shuffle, Filter, Combine, Split, Database, Globe, HardDrive, Repeat, Clock, LayoutList,
  Sparkles, MemoryStick, Tags
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { FlowNodeType } from '@/types/flow';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface PromptLibraryItem {
  id: string;
  name: string;
  content: string;
  role: string;
  description: string | null;
}

interface CustomToolItem {
  id: string;
  name: string;
  display_name: string;
  description: string;
  tool_type: string;
  parameters: unknown;
}

interface NodePropertiesPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onUpdateNode: (nodeId: string, data: Record<string, unknown>) => void;
  onDeleteNode: (nodeId: string) => void;
}

const nodeIcons: Record<FlowNodeType, React.ElementType> = {
  input: ArrowDownToLine,
  output: ArrowUpFromLine,
  prompt: FileText,
  model: Brain,
  condition: GitBranch,
  tool: Wrench,
  transform: Shuffle,
  filter: Filter,
  merge: Combine,
  split: Split,
  database: Database,
  api: Globe,
  storage: HardDrive,
  loop: Repeat,
  delay: Clock,
  switch: LayoutList,
  embedding: Sparkles,
  memory: MemoryStick,
  classifier: Tags,
};

const nodeColors: Record<FlowNodeType, string> = {
  input: 'text-hydra-info',
  output: 'text-hydra-glow',
  prompt: 'text-primary',
  model: 'text-hydra-success',
  condition: 'text-hydra-warning',
  tool: 'text-hydra-expert',
  transform: 'text-hydra-analyst',
  filter: 'text-hydra-warning',
  merge: 'text-hydra-advisor',
  split: 'text-hydra-archivist',
  database: 'text-hydra-analyst',
  api: 'text-hydra-webhunter',
  storage: 'text-hydra-archivist',
  loop: 'text-hydra-moderator',
  delay: 'text-muted-foreground',
  switch: 'text-hydra-warning',
  embedding: 'text-hydra-expert',
  memory: 'text-hydra-advisor',
  classifier: 'text-hydra-success',
};

export function NodePropertiesPanel({
  selectedNode,
  onClose,
  onUpdateNode,
  onDeleteNode,
}: NodePropertiesPanelProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<PromptLibraryItem[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [tools, setTools] = useState<CustomToolItem[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);

  // Load prompts from library when component mounts or user changes
  useEffect(() => {
    if (!user) return;
    
    const loadPrompts = async () => {
      setLoadingPrompts(true);
      try {
        const { data, error } = await supabase
          .from('prompt_library')
          .select('id, name, content, role, description')
          .or(`user_id.eq.${user.id},is_shared.eq.true`)
          .order('name');
        
        if (error) throw error;
        setPrompts(data || []);
      } catch (error) {
        console.error('Failed to load prompts:', error);
      } finally {
        setLoadingPrompts(false);
      }
    };
    
    loadPrompts();
  }, [user]);

  // Load tools from library when component mounts or user changes
  useEffect(() => {
    if (!user) return;
    
    const loadTools = async () => {
      setLoadingTools(true);
      try {
        const { data, error } = await supabase
          .from('custom_tools')
          .select('id, name, display_name, description, tool_type, parameters')
          .or(`user_id.eq.${user.id},is_shared.eq.true`)
          .order('display_name');
        
        if (error) throw error;
        setTools(data || []);
      } catch (error) {
        console.error('Failed to load tools:', error);
      } finally {
        setLoadingTools(false);
      }
    };
    
    loadTools();
  }, [user]);

  if (!selectedNode) return null;

  const nodeType = selectedNode.type as FlowNodeType;
  const Icon = nodeIcons[nodeType] || FileText;
  const iconColor = nodeColors[nodeType] || 'text-muted-foreground';

  const handleDataChange = (key: string, value: unknown) => {
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      [key]: value,
    });
  };

  const handlePromptSelect = (promptId: string) => {
    const selectedPrompt = prompts.find(p => p.id === promptId);
    if (selectedPrompt) {
      onUpdateNode(selectedNode.id, {
        ...selectedNode.data,
        label: selectedPrompt.name,
        promptId: selectedPrompt.id,
        promptContent: selectedPrompt.content,
        promptRole: selectedPrompt.role,
      });
    }
  };

  const handleToolSelect = (toolId: string) => {
    const selectedTool = tools.find(t => t.id === toolId);
    if (selectedTool) {
      onUpdateNode(selectedNode.id, {
        ...selectedNode.data,
        label: selectedTool.display_name,
        toolId: selectedTool.id,
        toolName: selectedTool.name,
        toolType: selectedTool.tool_type,
        toolConfig: selectedTool.parameters,
      });
    }
  };

  const renderInputFields = () => {
    switch (nodeType) {
      case 'input':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.input')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('flowEditor.properties.description')}</Label>
              <Textarea
                id="description"
                value={(selectedNode.data.description as string) || ''}
                onChange={(e) => handleDataChange('description', e.target.value)}
                placeholder={t('flowEditor.properties.inputDescPlaceholder')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inputType">{t('flowEditor.properties.inputType')}</Label>
              <Input
                id="inputType"
                value={(selectedNode.data.inputType as string) || ''}
                onChange={(e) => handleDataChange('inputType', e.target.value)}
                placeholder="text, file, json..."
              />
            </div>
          </>
        );

      case 'output':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.output')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('flowEditor.properties.description')}</Label>
              <Textarea
                id="description"
                value={(selectedNode.data.description as string) || ''}
                onChange={(e) => handleDataChange('description', e.target.value)}
                placeholder={t('flowEditor.properties.outputDescPlaceholder')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outputType">{t('flowEditor.properties.outputType')}</Label>
              <Input
                id="outputType"
                value={(selectedNode.data.outputType as string) || ''}
                onChange={(e) => handleDataChange('outputType', e.target.value)}
                placeholder="text, markdown, json..."
              />
            </div>
          </>
        );

      case 'prompt':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.prompt')}
              />
            </div>
            
            {/* Prompt Library Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                {t('flowEditor.properties.selectFromLibrary')}
              </Label>
              <Select
                value={(selectedNode.data.promptId as string) || ''}
                onValueChange={handlePromptSelect}
                disabled={loadingPrompts}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue 
                    placeholder={
                      loadingPrompts 
                        ? t('flowEditor.properties.loadingPrompts')
                        : prompts.length === 0
                          ? t('flowEditor.properties.noPromptsAvailable')
                          : t('flowEditor.properties.noPromptSelected')
                    } 
                  />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50 max-h-60">
                  {prompts.map((prompt) => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{prompt.name}</span>
                        {prompt.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {prompt.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Separator className="my-2" />
            
            <div className="space-y-2">
              <Label htmlFor="promptContent" className="text-muted-foreground text-xs">
                {t('flowEditor.properties.orWriteCustom')}
              </Label>
              <Label htmlFor="promptContent">{t('flowEditor.properties.promptContent')}</Label>
              <Textarea
                id="promptContent"
                value={(selectedNode.data.promptContent as string) || ''}
                onChange={(e) => handleDataChange('promptContent', e.target.value)}
                placeholder={t('flowEditor.properties.promptPlaceholder')}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </>
        );

      case 'model':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.model')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelName">{t('flowEditor.properties.modelName')}</Label>
              <Input
                id="modelName"
                value={(selectedNode.data.modelName as string) || ''}
                onChange={(e) => handleDataChange('modelName', e.target.value)}
                placeholder="gpt-4o, gemini-pro, claude-3..."
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t('flowEditor.properties.temperature')}: {(selectedNode.data.temperature as number) ?? 0.7}
              </Label>
              <Slider
                value={[(selectedNode.data.temperature as number) ?? 0.7]}
                onValueChange={([value]) => handleDataChange('temperature', value)}
                min={0}
                max={2}
                step={0.1}
                className="py-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens">{t('flowEditor.properties.maxTokens')}</Label>
              <Input
                id="maxTokens"
                type="number"
                value={(selectedNode.data.maxTokens as number) || 2048}
                onChange={(e) => handleDataChange('maxTokens', parseInt(e.target.value) || 2048)}
                min={1}
                max={128000}
              />
            </div>
          </>
        );

      case 'condition':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.condition')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">{t('flowEditor.properties.condition')}</Label>
              <Textarea
                id="condition"
                value={(selectedNode.data.condition as string) || ''}
                onChange={(e) => handleDataChange('condition', e.target.value)}
                placeholder={t('flowEditor.properties.conditionPlaceholder')}
                rows={3}
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="trueLabel" className="text-hydra-success">
                  {t('flowEditor.properties.trueLabel')}
                </Label>
                <Input
                  id="trueLabel"
                  value={(selectedNode.data.trueLabel as string) || ''}
                  onChange={(e) => handleDataChange('trueLabel', e.target.value)}
                  placeholder={t('flowEditor.properties.yes')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="falseLabel" className="text-destructive">
                  {t('flowEditor.properties.falseLabel')}
                </Label>
                <Input
                  id="falseLabel"
                  value={(selectedNode.data.falseLabel as string) || ''}
                  onChange={(e) => handleDataChange('falseLabel', e.target.value)}
                  placeholder={t('flowEditor.properties.no')}
                />
              </div>
            </div>
          </>
        );

      case 'tool':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.tool')}
              />
            </div>
            
            {/* Tool Library Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                {t('flowEditor.properties.selectFromToolLibrary')}
              </Label>
              <Select
                value={(selectedNode.data.toolId as string) || ''}
                onValueChange={handleToolSelect}
                disabled={loadingTools}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue 
                    placeholder={
                      loadingTools 
                        ? t('flowEditor.properties.loadingTools')
                        : tools.length === 0
                          ? t('flowEditor.properties.noToolsAvailable')
                          : t('flowEditor.properties.noToolSelected')
                    } 
                  />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50 max-h-60">
                  {tools.map((tool) => (
                    <SelectItem key={tool.id} value={tool.id}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tool.display_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {tool.tool_type === 'http_api' ? 'HTTP' : 'Prompt'}
                          </Badge>
                        </div>
                        {tool.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {tool.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Separator className="my-2" />
            
            <div className="space-y-2">
              <Label htmlFor="toolName" className="text-muted-foreground text-xs">
                {t('flowEditor.properties.orConfigureManually')}
              </Label>
              <Label htmlFor="toolName">{t('flowEditor.properties.toolName')}</Label>
              <Input
                id="toolName"
                value={(selectedNode.data.toolName as string) || ''}
                onChange={(e) => handleDataChange('toolName', e.target.value)}
                placeholder={t('flowEditor.properties.toolNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toolConfig">{t('flowEditor.properties.toolConfig')}</Label>
              <Textarea
                id="toolConfig"
                value={
                  typeof selectedNode.data.toolConfig === 'object'
                    ? JSON.stringify(selectedNode.data.toolConfig, null, 2)
                    : ''
                }
                onChange={(e) => {
                  try {
                    const config = JSON.parse(e.target.value);
                    handleDataChange('toolConfig', config);
                  } catch {
                    // Invalid JSON, keep as string for now
                  }
                }}
                placeholder='{ "param": "value" }'
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </>
        );

      // ===== DATA PROCESSING NODES =====
      case 'transform':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.transform')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transformType">{t('flowEditor.properties.transformType')}</Label>
              <Select
                value={(selectedNode.data.transformType as string) || 'json'}
                onValueChange={(value) => handleDataChange('transformType', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('flowEditor.properties.selectTransformType')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50">
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="text">{t('flowEditor.properties.text')}</SelectItem>
                  <SelectItem value="format">{t('flowEditor.properties.format')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transformExpression">{t('flowEditor.properties.transformExpression')}</Label>
              <Textarea
                id="transformExpression"
                value={(selectedNode.data.transformExpression as string) || ''}
                onChange={(e) => handleDataChange('transformExpression', e.target.value)}
                placeholder={t('flowEditor.properties.transformExpressionPlaceholder')}
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </>
        );

      case 'filter':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.filter')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterCondition">{t('flowEditor.properties.filterCondition')}</Label>
              <Textarea
                id="filterCondition"
                value={(selectedNode.data.filterCondition as string) || ''}
                onChange={(e) => handleDataChange('filterCondition', e.target.value)}
                placeholder={t('flowEditor.properties.filterConditionPlaceholder')}
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </>
        );

      case 'merge':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.merge')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mergeStrategy">{t('flowEditor.properties.mergeStrategy')}</Label>
              <Select
                value={(selectedNode.data.mergeStrategy as string) || 'concat'}
                onValueChange={(value) => handleDataChange('mergeStrategy', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('flowEditor.properties.selectMergeStrategy')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50">
                  <SelectItem value="concat">{t('flowEditor.properties.mergeConcat')}</SelectItem>
                  <SelectItem value="object">{t('flowEditor.properties.mergeObject')}</SelectItem>
                  <SelectItem value="array">{t('flowEditor.properties.mergeArray')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'split':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.split')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="splitKey">{t('flowEditor.properties.splitKey')}</Label>
              <Input
                id="splitKey"
                value={(selectedNode.data.splitKey as string) || ''}
                onChange={(e) => handleDataChange('splitKey', e.target.value)}
                placeholder={t('flowEditor.properties.splitKeyPlaceholder')}
              />
            </div>
          </>
        );

      // ===== INTEGRATION NODES =====
      case 'database':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.database')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dbOperation">{t('flowEditor.properties.dbOperation')}</Label>
              <Select
                value={(selectedNode.data.dbOperation as string) || 'read'}
                onValueChange={(value) => handleDataChange('dbOperation', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('flowEditor.properties.selectDbOperation')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50">
                  <SelectItem value="read">{t('flowEditor.properties.dbRead')}</SelectItem>
                  <SelectItem value="write">{t('flowEditor.properties.dbWrite')}</SelectItem>
                  <SelectItem value="update">{t('flowEditor.properties.dbUpdate')}</SelectItem>
                  <SelectItem value="delete">{t('flowEditor.properties.dbDelete')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tableName">{t('flowEditor.properties.tableName')}</Label>
              <Input
                id="tableName"
                value={(selectedNode.data.tableName as string) || ''}
                onChange={(e) => handleDataChange('tableName', e.target.value)}
                placeholder={t('flowEditor.properties.tableNamePlaceholder')}
              />
            </div>
          </>
        );

      case 'api':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.api')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiMethod">{t('flowEditor.properties.apiMethod')}</Label>
              <Select
                value={(selectedNode.data.apiMethod as string) || 'GET'}
                onValueChange={(value) => handleDataChange('apiMethod', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('flowEditor.properties.selectApiMethod')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50">
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiUrl">{t('flowEditor.properties.apiUrl')}</Label>
              <Input
                id="apiUrl"
                value={(selectedNode.data.apiUrl as string) || ''}
                onChange={(e) => handleDataChange('apiUrl', e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
          </>
        );

      case 'storage':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.storage')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storageOperation">{t('flowEditor.properties.storageOperation')}</Label>
              <Select
                value={(selectedNode.data.storageOperation as string) || 'read'}
                onValueChange={(value) => handleDataChange('storageOperation', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('flowEditor.properties.selectStorageOperation')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50">
                  <SelectItem value="read">{t('flowEditor.properties.storageRead')}</SelectItem>
                  <SelectItem value="write">{t('flowEditor.properties.storageWrite')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storagePath">{t('flowEditor.properties.storagePath')}</Label>
              <Input
                id="storagePath"
                value={(selectedNode.data.storagePath as string) || ''}
                onChange={(e) => handleDataChange('storagePath', e.target.value)}
                placeholder="/bucket/path/to/file"
              />
            </div>
          </>
        );

      // ===== LOGIC & CONTROL NODES =====
      case 'loop':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.loop')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loopVariable">{t('flowEditor.properties.loopVariable')}</Label>
              <Input
                id="loopVariable"
                value={(selectedNode.data.loopVariable as string) || ''}
                onChange={(e) => handleDataChange('loopVariable', e.target.value)}
                placeholder={t('flowEditor.properties.loopVariablePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxIterations">{t('flowEditor.properties.maxIterations')}</Label>
              <Input
                id="maxIterations"
                type="number"
                value={(selectedNode.data.maxIterations as number) || 10}
                onChange={(e) => handleDataChange('maxIterations', parseInt(e.target.value) || 10)}
                min={1}
                max={1000}
              />
            </div>
          </>
        );

      case 'delay':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.delay')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delayMs">{t('flowEditor.properties.delayMs')}</Label>
              <Input
                id="delayMs"
                type="number"
                value={(selectedNode.data.delayMs as number) || 1000}
                onChange={(e) => handleDataChange('delayMs', parseInt(e.target.value) || 1000)}
                min={0}
                max={300000}
              />
              <p className="text-xs text-muted-foreground">
                {t('flowEditor.properties.delayMsHint')}
              </p>
            </div>
          </>
        );

      case 'switch':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.switch')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('flowEditor.properties.switchCases')}</Label>
              <Textarea
                value={
                  Array.isArray(selectedNode.data.switchCases)
                    ? JSON.stringify(selectedNode.data.switchCases, null, 2)
                    : '[{"label": "Case 1", "condition": "value == 1"}]'
                }
                onChange={(e) => {
                  try {
                    const cases = JSON.parse(e.target.value);
                    handleDataChange('switchCases', cases);
                  } catch {
                    // Invalid JSON
                  }
                }}
                placeholder='[{"label": "Case 1", "condition": "..."}]'
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {t('flowEditor.properties.switchCasesHint')}
              </p>
            </div>
          </>
        );

      // ===== AI-SPECIFIC NODES =====
      case 'embedding':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.embedding')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="embeddingModel">{t('flowEditor.properties.embeddingModel')}</Label>
              <Select
                value={(selectedNode.data.embeddingModel as string) || 'text-embedding-3-small'}
                onValueChange={(value) => handleDataChange('embeddingModel', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('flowEditor.properties.selectEmbeddingModel')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50">
                  <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                  <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                  <SelectItem value="text-embedding-ada-002">text-embedding-ada-002</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'memory':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.memory')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memoryType">{t('flowEditor.properties.memoryType')}</Label>
              <Select
                value={(selectedNode.data.memoryType as string) || 'short'}
                onValueChange={(value) => handleDataChange('memoryType', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('flowEditor.properties.selectMemoryType')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50">
                  <SelectItem value="short">{t('flowEditor.properties.memoryShort')}</SelectItem>
                  <SelectItem value="long">{t('flowEditor.properties.memoryLong')}</SelectItem>
                  <SelectItem value="rag">{t('flowEditor.properties.memoryRag')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'classifier':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
              <Input
                id="label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                placeholder={t('flowEditor.nodes.classifier')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classifierLabels">{t('flowEditor.properties.classifierLabels')}</Label>
              <Textarea
                id="classifierLabels"
                value={
                  Array.isArray(selectedNode.data.classifierLabels)
                    ? selectedNode.data.classifierLabels.join('\n')
                    : ''
                }
                onChange={(e) => {
                  const labels = e.target.value.split('\n').filter(l => l.trim());
                  handleDataChange('classifierLabels', labels);
                }}
                placeholder={t('flowEditor.properties.classifierLabelsPlaceholder')}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {t('flowEditor.properties.classifierLabelsHint')}
              </p>
            </div>
          </>
        );

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
            <Input
              id="label"
              value={(selectedNode.data.label as string) || ''}
              onChange={(e) => handleDataChange('label', e.target.value)}
            />
          </div>
        );
    }
  };

  return (
    <Card className="w-80 h-full border-l rounded-none overflow-hidden flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={cn('h-5 w-5', iconColor)} />
          {t('flowEditor.properties.title')}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-sm text-muted-foreground">
          {t(`flowEditor.nodes.${nodeType}`)} • ID: {selectedNode.id.slice(0, 8)}...
        </div>
        
        {renderInputFields()}
        
        <Separator className="my-4" />
        
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => {
            onDeleteNode(selectedNode.id);
            onClose();
          }}
        >
          {t('flowEditor.properties.deleteNode')}
        </Button>
      </CardContent>
    </Card>
  );
}
