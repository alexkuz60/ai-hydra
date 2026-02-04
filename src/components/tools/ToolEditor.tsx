import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Plus, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  FileText, 
  Loader2,
  Save,
} from 'lucide-react';
import { HttpToolTester } from '@/components/tools/HttpToolTester';
import { 
  ToolFormData, 
  ToolParameter, 
  ToolType, 
  HttpMethod,
  PARAM_TYPES,
  HTTP_METHODS,
  validateToolName,
} from '@/types/customTools';

interface ToolEditorProps {
  formData: ToolFormData;
  onChange: (data: ToolFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEditing: boolean;
}

export function ToolEditor({
  formData,
  onChange,
  onSave,
  onCancel,
  saving,
  isEditing,
}: ToolEditorProps) {
  const { t } = useLanguage();
  const [paramsExpanded, setParamsExpanded] = React.useState(formData.parameters.length > 0);

  const updateField = <K extends keyof ToolFormData>(field: K, value: ToolFormData[K]) => {
    onChange({ ...formData, [field]: value });
  };

  const addParameter = () => {
    const newParam: ToolParameter = {
      name: '',
      type: 'string',
      description: '',
      required: false,
    };
    updateField('parameters', [...formData.parameters, newParam]);
    setParamsExpanded(true);
  };

  const updateParameter = (index: number, field: keyof ToolParameter, value: unknown) => {
    const updated = [...formData.parameters];
    updated[index] = { ...updated[index], [field]: value };
    updateField('parameters', updated);
  };

  const removeParameter = (index: number) => {
    updateField('parameters', formData.parameters.filter((_, i) => i !== index));
  };

  const addHeader = () => {
    updateField('httpHeaders', [...formData.httpHeaders, { key: '', value: '' }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...formData.httpHeaders];
    updated[index] = { ...updated[index], [field]: value };
    updateField('httpHeaders', updated);
  };

  const removeHeader = (index: number) => {
    updateField('httpHeaders', formData.httpHeaders.filter((_, i) => i !== index));
  };

  const isValid = 
    formData.name.trim() && 
    formData.displayName.trim() && 
    formData.description.trim() &&
    (formData.toolType === 'prompt' ? formData.promptTemplate.trim() : formData.httpUrl.trim());

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {isEditing ? t('tools.editTool') : t('tools.createTool')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving || !isValid}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Save className="h-4 w-4 mr-2" />
            {t('common.save')}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Tool Type Selector */}
          <div className="space-y-2">
            <Label>{t('tools.toolType')}</Label>
            <Tabs 
              value={formData.toolType} 
              onValueChange={(v) => updateField('toolType', v as ToolType)} 
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="prompt" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('tools.promptTemplate')}
                </TabsTrigger>
                <TabsTrigger value="http_api" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  HTTP API
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label>{t('tools.displayName')} <span className="text-destructive">*</span></Label>
            <Input
              value={formData.displayName}
              onChange={(e) => updateField('displayName', e.target.value)}
              placeholder={t('tools.displayNamePlaceholder')}
            />
          </div>

          {/* Technical Name */}
          <div className="space-y-2">
            <Label>{t('tools.technicalName')} <span className="text-destructive">*</span></Label>
            <Input
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="report_generator"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">{t('tools.technicalNameHint')}</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t('tools.descriptionLabel')} <span className="text-destructive">*</span></Label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder={t('tools.descriptionPlaceholder')}
              className="min-h-[80px]"
            />
          </div>

          {/* Prompt Template - only for prompt type */}
          {formData.toolType === 'prompt' && (
            <div className="space-y-2">
              <Label>{t('tools.promptTemplate')} <span className="text-destructive">*</span></Label>
              <Textarea
                value={formData.promptTemplate}
                onChange={(e) => updateField('promptTemplate', e.target.value)}
                placeholder={t('tools.promptTemplatePlaceholder')}
                className="min-h-[120px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">{t('tools.promptTemplateHint')}</p>
            </div>
          )}

          {/* HTTP Configuration - only for http_api type */}
          {formData.toolType === 'http_api' && (
            <div className="space-y-4 p-3 rounded-lg bg-muted/30 border border-border/50">
              <h4 className="font-medium text-sm">{t('tools.httpConfig')}</h4>
              
              {/* URL */}
              <div className="space-y-2">
                <Label>URL <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.httpUrl}
                  onChange={(e) => updateField('httpUrl', e.target.value)}
                  placeholder="https://api.example.com/v1/{{resource}}"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">{t('tools.httpUrlHint')}</p>
              </div>

              {/* Method */}
              <div className="space-y-2">
                <Label>{t('tools.httpMethod')}</Label>
                <Select 
                  value={formData.httpMethod} 
                  onValueChange={(v) => updateField('httpMethod', v as HttpMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    {HTTP_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Headers */}
              <div className="space-y-2">
                <Label>{t('tools.headers')}</Label>
                <div className="space-y-2">
                  {formData.httpHeaders.map((header, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={header.key}
                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                        placeholder="Header-Name"
                        className="flex-1 font-mono text-sm"
                      />
                      <Input
                        value={header.value}
                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                        placeholder="{{api_key}}"
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHeader(index)}
                        className="h-9 w-9 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addHeader}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('tools.addHeader')}
                  </Button>
                </div>
              </div>

              {/* Body Template - for POST/PUT */}
              {(formData.httpMethod === 'POST' || formData.httpMethod === 'PUT') && (
                <div className="space-y-2">
                  <Label>{t('tools.bodyTemplate')}</Label>
                  <Textarea
                    value={formData.httpBodyTemplate}
                    onChange={(e) => updateField('httpBodyTemplate', e.target.value)}
                    placeholder={'{"query": "{{search_term}}", "limit": 10}'}
                    className="min-h-[80px] font-mono text-sm"
                  />
                </div>
              )}

              {/* Response Path */}
              <div className="space-y-2">
                <Label>{t('tools.responsePath')}</Label>
                <Input
                  value={formData.httpResponsePath}
                  onChange={(e) => updateField('httpResponsePath', e.target.value)}
                  placeholder="data.results[0].value"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">{t('tools.responsePathHint')}</p>
              </div>

              {/* HTTP Tool Tester */}
              {formData.httpUrl.trim() && (
                <HttpToolTester
                  httpConfig={{
                    url: formData.httpUrl.trim(),
                    method: formData.httpMethod,
                    headers: formData.httpHeaders.length > 0 
                      ? Object.fromEntries(formData.httpHeaders.filter(h => h.key.trim()).map(h => [h.key.trim(), h.value]))
                      : undefined,
                    body_template: formData.httpBodyTemplate.trim() || undefined,
                    response_path: formData.httpResponsePath.trim() || undefined,
                  }}
                  parameters={formData.parameters}
                  toolName={formData.displayName || t('tools.newTool')}
                />
              )}
            </div>
          )}

          {/* Parameters */}
          <Collapsible open={paramsExpanded} onOpenChange={setParamsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-medium">
                {t('tools.parameters')} ({formData.parameters.length})
                {paramsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="space-y-3">
                {formData.parameters.map((param, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={param.name}
                          onChange={(e) => updateParameter(index, 'name', validateToolName(e.target.value))}
                          placeholder="param_name"
                          className="flex-1 font-mono text-sm"
                        />
                        <Select 
                          value={param.type} 
                          onValueChange={(v) => updateParameter(index, 'type', v)}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border border-border z-50">
                            {PARAM_TYPES.map((pt) => (
                              <SelectItem key={pt.value} value={pt.value}>
                                {t(pt.labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        value={param.description}
                        onChange={(e) => updateParameter(index, 'description', e.target.value)}
                        placeholder={t('tools.paramDescriptionPlaceholder')}
                        className="text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={param.required}
                          onCheckedChange={(v) => updateParameter(index, 'required', v)}
                          id={`req-${index}`}
                        />
                        <Label htmlFor={`req-${index}`} className="text-xs cursor-pointer">
                          {t('tools.required')}
                        </Label>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParameter(index)}
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addParameter}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('tools.addParameter')}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Shared toggle */}
          <div className="flex items-center gap-2 pt-2">
            <Switch
              id="shared"
              checked={formData.isShared}
              onCheckedChange={(v) => updateField('isShared', v)}
            />
            <Label htmlFor="shared" className="cursor-pointer">
              {t('tools.shareAccess')}
            </Label>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
