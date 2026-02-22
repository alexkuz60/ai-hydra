import React from 'react';
import { Node } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Library } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface NodeFormProps {
  node: Node;
  onDataChange: (key: string, value: unknown) => void;
}

// ═══════════════════════════════════════════════
// Input / Output forms
// ═══════════════════════════════════════════════

export function InputNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.input')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inputValue">{t('flowEditor.properties.inputValue')}</Label>
        <Textarea id="inputValue" value={(node.data.inputValue as string) || ''} onChange={e => onDataChange('inputValue', e.target.value)} placeholder={t('flowEditor.properties.inputValuePlaceholder')} rows={5} className="font-mono text-sm" />
      </div>
      <Separator className="my-2" />
      <div className="space-y-2">
        <Label htmlFor="description" className="text-muted-foreground text-xs">{t('flowEditor.properties.description')}</Label>
        <Textarea id="description" value={(node.data.description as string) || ''} onChange={e => onDataChange('description', e.target.value)} placeholder={t('flowEditor.properties.inputDescPlaceholder')} rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inputType" className="text-muted-foreground text-xs">{t('flowEditor.properties.inputType')}</Label>
        <Input id="inputType" value={(node.data.inputType as string) || ''} onChange={e => onDataChange('inputType', e.target.value)} placeholder="text, file, json..." />
      </div>
    </>
  );
}

export function OutputNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.output')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t('flowEditor.properties.description')}</Label>
        <Textarea id="description" value={(node.data.description as string) || ''} onChange={e => onDataChange('description', e.target.value)} placeholder={t('flowEditor.properties.outputDescPlaceholder')} rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="outputType">{t('flowEditor.properties.outputType')}</Label>
        <Input id="outputType" value={(node.data.outputType as string) || ''} onChange={e => onDataChange('outputType', e.target.value)} placeholder="text, markdown, json..." />
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// Model node form
// ═══════════════════════════════════════════════

export function ModelNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.model')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="modelName">{t('flowEditor.properties.modelName')}</Label>
        <Input id="modelName" value={(node.data.modelName as string) || ''} onChange={e => onDataChange('modelName', e.target.value)} placeholder="gpt-4o, gemini-pro, claude-3..." />
      </div>
      <div className="space-y-2">
        <Label>{t('flowEditor.properties.temperature')}: {(node.data.temperature as number) ?? 0.7}</Label>
        <Slider value={[(node.data.temperature as number) ?? 0.7]} onValueChange={([v]) => onDataChange('temperature', v)} min={0} max={2} step={0.1} className="py-2" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxTokens">{t('flowEditor.properties.maxTokens')}</Label>
        <Input id="maxTokens" type="number" value={(node.data.maxTokens as number) || 2048} onChange={e => onDataChange('maxTokens', parseInt(e.target.value) || 2048)} min={1} max={128000} />
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// Prompt node form (needs prompts list)
// ═══════════════════════════════════════════════

interface PromptNodeFormProps extends NodeFormProps {
  prompts: Array<{ id: string; name: string; content: string; role: string; description: string | null }>;
  loadingPrompts: boolean;
  onPromptSelect: (promptId: string) => void;
}

export function PromptNodeForm({ node, onDataChange, prompts, loadingPrompts, onPromptSelect }: PromptNodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.prompt')} />
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Library className="h-4 w-4" />{t('flowEditor.properties.selectFromLibrary')}</Label>
        <Select value={(node.data.promptId as string) || ''} onValueChange={onPromptSelect} disabled={loadingPrompts}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder={loadingPrompts ? t('flowEditor.properties.loadingPrompts') : prompts.length === 0 ? t('flowEditor.properties.noPromptsAvailable') : t('flowEditor.properties.noPromptSelected')} />
          </SelectTrigger>
          <SelectContent className="bg-popover border z-50 max-h-60">
            {prompts.map(p => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{p.name}</span>
                  {p.description && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{p.description}</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Separator className="my-2" />
      <div className="space-y-2">
        <Label htmlFor="promptContent" className="text-muted-foreground text-xs">{t('flowEditor.properties.orWriteCustom')}</Label>
        <Label htmlFor="promptContent">{t('flowEditor.properties.promptContent')}</Label>
        <Textarea id="promptContent" value={(node.data.promptContent as string) || ''} onChange={e => onDataChange('promptContent', e.target.value)} placeholder={t('flowEditor.properties.promptPlaceholder')} rows={8} className="font-mono text-sm" />
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// Tool node form (needs tools list)
// ═══════════════════════════════════════════════

interface ToolNodeFormProps extends NodeFormProps {
  tools: Array<{ id: string; name: string; display_name: string; description: string; tool_type: string; parameters: unknown }>;
  loadingTools: boolean;
  onToolSelect: (toolId: string) => void;
}

export function ToolNodeForm({ node, onDataChange, tools, loadingTools, onToolSelect }: ToolNodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.tool')} />
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Library className="h-4 w-4" />{t('flowEditor.properties.selectFromToolLibrary')}</Label>
        <Select value={(node.data.toolId as string) || ''} onValueChange={onToolSelect} disabled={loadingTools}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder={loadingTools ? t('flowEditor.properties.loadingTools') : tools.length === 0 ? t('flowEditor.properties.noToolsAvailable') : t('flowEditor.properties.noToolSelected')} />
          </SelectTrigger>
          <SelectContent className="bg-popover border z-50 max-h-60">
            {tools.map(tool => (
              <SelectItem key={tool.id} value={tool.id}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tool.display_name}</span>
                    <Badge variant="outline" className="text-xs">{tool.tool_type === 'http_api' ? 'HTTP' : 'Prompt'}</Badge>
                  </div>
                  {tool.description && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{tool.description}</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Separator className="my-2" />
      <div className="space-y-2">
        <Label htmlFor="toolName" className="text-muted-foreground text-xs">{t('flowEditor.properties.orConfigureManually')}</Label>
        <Label htmlFor="toolName">{t('flowEditor.properties.toolName')}</Label>
        <Input id="toolName" value={(node.data.toolName as string) || ''} onChange={e => onDataChange('toolName', e.target.value)} placeholder={t('flowEditor.properties.toolNamePlaceholder')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="toolConfig">{t('flowEditor.properties.toolConfig')}</Label>
        <Textarea
          id="toolConfig"
          value={typeof node.data.toolConfig === 'object' ? JSON.stringify(node.data.toolConfig, null, 2) : ''}
          onChange={e => { try { onDataChange('toolConfig', JSON.parse(e.target.value)); } catch { /* invalid JSON */ } }}
          placeholder='{ "param": "value" }'
          rows={4}
          className="font-mono text-sm"
        />
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// Condition node form
// ═══════════════════════════════════════════════

export function ConditionNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.condition')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="condition">{t('flowEditor.properties.condition')}</Label>
        <Textarea id="condition" value={(node.data.condition as string) || ''} onChange={e => onDataChange('condition', e.target.value)} placeholder={t('flowEditor.properties.conditionPlaceholder')} rows={3} className="font-mono text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="trueLabel" className="text-hydra-success">{t('flowEditor.properties.trueLabel')}</Label>
          <Input id="trueLabel" value={(node.data.trueLabel as string) || ''} onChange={e => onDataChange('trueLabel', e.target.value)} placeholder={t('flowEditor.properties.yes')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="falseLabel" className="text-destructive">{t('flowEditor.properties.falseLabel')}</Label>
          <Input id="falseLabel" value={(node.data.falseLabel as string) || ''} onChange={e => onDataChange('falseLabel', e.target.value)} placeholder={t('flowEditor.properties.no')} />
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// Data processing: Transform, Filter, Merge, Split
// ═══════════════════════════════════════════════

export function TransformNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.transform')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="transformType">{t('flowEditor.properties.transformType')}</Label>
        <Select value={(node.data.transformType as string) || 'json'} onValueChange={v => onDataChange('transformType', v)}>
          <SelectTrigger className="bg-background"><SelectValue placeholder={t('flowEditor.properties.selectTransformType')} /></SelectTrigger>
          <SelectContent className="bg-popover border z-50">
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="text">{t('flowEditor.properties.text')}</SelectItem>
            <SelectItem value="format">{t('flowEditor.properties.format')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="transformExpression">{t('flowEditor.properties.transformExpression')}</Label>
        <Textarea id="transformExpression" value={(node.data.transformExpression as string) || ''} onChange={e => onDataChange('transformExpression', e.target.value)} placeholder={t('flowEditor.properties.transformExpressionPlaceholder')} rows={4} className="font-mono text-sm" />
      </div>
    </>
  );
}

export function FilterNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.filter')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="filterCondition">{t('flowEditor.properties.filterCondition')}</Label>
        <Textarea id="filterCondition" value={(node.data.filterCondition as string) || ''} onChange={e => onDataChange('filterCondition', e.target.value)} placeholder={t('flowEditor.properties.filterConditionPlaceholder')} rows={4} className="font-mono text-sm" />
      </div>
    </>
  );
}

export function MergeNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.merge')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inputCount">{t('flowEditor.properties.inputCount')}</Label>
        <Select value={String((node.data.inputCount as number) || 2)} onValueChange={v => onDataChange('inputCount', parseInt(v))}>
          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover border z-50">
            {[2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} {t('flowEditor.properties.inputs')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mergeStrategy">{t('flowEditor.properties.mergeStrategy')}</Label>
        <Select value={(node.data.mergeStrategy as string) || 'concat'} onValueChange={v => onDataChange('mergeStrategy', v)}>
          <SelectTrigger className="bg-background"><SelectValue placeholder={t('flowEditor.properties.selectMergeStrategy')} /></SelectTrigger>
          <SelectContent className="bg-popover border z-50">
            <SelectItem value="concat">{t('flowEditor.properties.mergeConcat')}</SelectItem>
            <SelectItem value="array">{t('flowEditor.properties.mergeArray')}</SelectItem>
            <SelectItem value="object">{t('flowEditor.properties.mergeObject')}</SelectItem>
            <SelectItem value="first">{t('flowEditor.properties.mergeFirst')}</SelectItem>
            <SelectItem value="last">{t('flowEditor.properties.mergeLast')}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t('flowEditor.properties.mergeStrategyHint')}</p>
      </div>
      <div className="flex items-center justify-between py-2">
        <div className="flex flex-col">
          <Label htmlFor="waitForAll" className="text-sm">{t('flowEditor.properties.waitForAll')}</Label>
          <span className="text-xs text-muted-foreground">{t('flowEditor.properties.waitForAllHint')}</span>
        </div>
        <Switch id="waitForAll" checked={(node.data.waitForAll as boolean) !== false} onCheckedChange={checked => onDataChange('waitForAll', checked)} />
      </div>
    </>
  );
}

export function SplitNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.split')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="outputCount">{t('flowEditor.properties.outputCount')}</Label>
        <Select value={String((node.data.outputCount as number) || 2)} onValueChange={v => onDataChange('outputCount', parseInt(v))}>
          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover border z-50">
            {[2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} {t('flowEditor.properties.outputs')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="splitMode">{t('flowEditor.properties.splitMode')}</Label>
        <Select value={(node.data.splitMode as string) || 'distribute'} onValueChange={v => onDataChange('splitMode', v)}>
          <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover border z-50">
            <SelectItem value="distribute">{t('flowEditor.properties.splitDistribute')}</SelectItem>
            <SelectItem value="duplicate">{t('flowEditor.properties.splitDuplicate')}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t('flowEditor.properties.splitModeHint')}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="splitKey">{t('flowEditor.properties.splitKey')}</Label>
        <Input id="splitKey" value={(node.data.splitKey as string) || ''} onChange={e => onDataChange('splitKey', e.target.value)} placeholder={t('flowEditor.properties.splitKeyPlaceholder')} />
        <p className="text-xs text-muted-foreground">{t('flowEditor.properties.splitKeyHint')}</p>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// Logic & Control: Loop, Delay, Switch
// ═══════════════════════════════════════════════

export function LoopNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.loop')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="loopVariable">{t('flowEditor.properties.loopVariable')}</Label>
        <Input id="loopVariable" value={(node.data.loopVariable as string) || ''} onChange={e => onDataChange('loopVariable', e.target.value)} placeholder={t('flowEditor.properties.loopVariablePlaceholder')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxIterations">{t('flowEditor.properties.maxIterations')}</Label>
        <Input id="maxIterations" type="number" value={(node.data.maxIterations as number) || 10} onChange={e => onDataChange('maxIterations', parseInt(e.target.value) || 10)} min={1} max={1000} />
      </div>
    </>
  );
}

export function DelayNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.delay')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="delayMs">{t('flowEditor.properties.delayMs')}</Label>
        <Input id="delayMs" type="number" value={(node.data.delayMs as number) || 1000} onChange={e => onDataChange('delayMs', parseInt(e.target.value) || 1000)} min={0} max={300000} />
        <p className="text-xs text-muted-foreground">{t('flowEditor.properties.delayMsHint')}</p>
      </div>
    </>
  );
}

export function SwitchNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.switch')} />
      </div>
      <div className="space-y-2">
        <Label>{t('flowEditor.properties.switchCases')}</Label>
        <Textarea
          value={Array.isArray(node.data.switchCases) ? JSON.stringify(node.data.switchCases, null, 2) : '[{"label": "Case 1", "condition": "value == 1"}]'}
          onChange={e => { try { onDataChange('switchCases', JSON.parse(e.target.value)); } catch { /* invalid JSON */ } }}
          placeholder='[{"label": "Case 1", "condition": "..."}]'
          rows={5}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">{t('flowEditor.properties.switchCasesHint')}</p>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// AI-specific: Embedding, Memory, Classifier
// ═══════════════════════════════════════════════

export function EmbeddingNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.embedding')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="embeddingModel">{t('flowEditor.properties.embeddingModel')}</Label>
        <Select value={(node.data.embeddingModel as string) || 'text-embedding-3-small'} onValueChange={v => onDataChange('embeddingModel', v)}>
          <SelectTrigger className="bg-background"><SelectValue placeholder={t('flowEditor.properties.selectEmbeddingModel')} /></SelectTrigger>
          <SelectContent className="bg-popover border z-50">
            <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
            <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
            <SelectItem value="text-embedding-ada-002">text-embedding-ada-002</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export function MemoryNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.memory')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="memoryType">{t('flowEditor.properties.memoryType')}</Label>
        <Select value={(node.data.memoryType as string) || 'short'} onValueChange={v => onDataChange('memoryType', v)}>
          <SelectTrigger className="bg-background"><SelectValue placeholder={t('flowEditor.properties.selectMemoryType')} /></SelectTrigger>
          <SelectContent className="bg-popover border z-50">
            <SelectItem value="short">{t('flowEditor.properties.memoryShort')}</SelectItem>
            <SelectItem value="long">{t('flowEditor.properties.memoryLong')}</SelectItem>
            <SelectItem value="rag">{t('flowEditor.properties.memoryRag')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export function ClassifierNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder={t('flowEditor.nodes.classifier')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="classifierLabels">{t('flowEditor.properties.classifierLabels')}</Label>
        <Textarea
          id="classifierLabels"
          value={Array.isArray(node.data.classifierLabels) ? node.data.classifierLabels.join('\n') : ''}
          onChange={e => onDataChange('classifierLabels', e.target.value.split('\n').filter(l => l.trim()))}
          placeholder={t('flowEditor.properties.classifierLabelsPlaceholder')}
          rows={5}
        />
        <p className="text-xs text-muted-foreground">{t('flowEditor.properties.classifierLabelsHint')}</p>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// Translate node form
// ═══════════════════════════════════════════════

export function TranslateNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
        <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} placeholder="Перевод" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="translateDirection">{t('flowEditor.properties.translateDirection')}</Label>
        <Select value={(node.data.translateDirection as string) || 'ru-en'} onValueChange={v => onDataChange('translateDirection', v)}>
          <SelectTrigger id="translateDirection"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ru-en">RU → EN</SelectItem>
            <SelectItem value="en-ru">EN → RU</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="verifySemantic">{t('flowEditor.properties.verifySemantic')}</Label>
        <Switch id="verifySemantic" checked={Boolean(node.data.verifySemantic)} onCheckedChange={v => onDataChange('verifySemantic', v)} />
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// Default fallback
// ═══════════════════════════════════════════════

export function DefaultNodeForm({ node, onDataChange }: NodeFormProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2">
      <Label htmlFor="label">{t('flowEditor.properties.label')}</Label>
      <Input id="label" value={(node.data.label as string) || ''} onChange={e => onDataChange('label', e.target.value)} />
    </div>
  );
}
