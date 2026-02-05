import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Settings, ChevronDown, ChevronUp, RotateCcw, Copy, DollarSign, Pencil, Save, Undo2, Library, Clipboard, Trash2, Wrench, User } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { PromptLibraryPicker } from './PromptLibraryPicker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCustomTools, CustomTool } from '@/hooks/useCustomTools';
import { RoleSelectOptions, RoleDisplay } from '@/components/ui/RoleSelectItem';
import { AgentRole, DEFAULT_SYSTEM_PROMPTS } from '@/config/roles';
import { useRoleBehavior } from '@/hooks/useRoleBehavior';

export type { AgentRole };

// Pricing per 1M tokens (input/output) in USD
interface ModelPricing {
  input: number;
  output: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  // Google models
  'google/gemini-2.5-pro': { input: 1.25, output: 10.00 },
  'google/gemini-3-pro-preview': { input: 1.25, output: 10.00 },
  'google/gemini-3-flash-preview': { input: 0.10, output: 0.40 },
  'google/gemini-2.5-flash': { input: 0.15, output: 0.60 },
  'google/gemini-2.5-flash-lite': { input: 0.075, output: 0.30 },
  'google/gemini-3-pro-image-preview': { input: 0.0315, output: 0.0315 },
  // OpenAI models
  'openai/gpt-5': { input: 2.50, output: 10.00 },
  'openai/gpt-5-mini': { input: 0.40, output: 1.60 },
  'openai/gpt-5-nano': { input: 0.10, output: 0.40 },
  'openai/gpt-5.2': { input: 3.00, output: 12.00 },
  'openai/gpt-4o': { input: 2.50, output: 10.00 },
  // Anthropic models
  'anthropic/claude-3-opus': { input: 15.00, output: 75.00 },
  'anthropic/claude-3-sonnet': { input: 3.00, output: 15.00 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
};

function getModelPricing(modelId: string): ModelPricing | null {
  return MODEL_PRICING[modelId] || null;
}

function formatPrice(price: number): string {
  if (price < 0.0001) return `$${price.toFixed(6)}`;
  if (price < 0.01) return `$${price.toFixed(4)}`;
  if (price < 1) return `$${price.toFixed(3)}`;
  return `$${price.toFixed(2)}`;
}

// Approximate token count: ~4 characters per token for English, ~2 for Russian
function estimateTokens(text: string): number {
  if (!text) return 0;
  // Check if mostly Cyrillic
  const cyrillicRatio = (text.match(/[\u0400-\u04FF]/g) || []).length / text.length;
  const charsPerToken = cyrillicRatio > 0.3 ? 2 : 4;
  return Math.ceil(text.length / charsPerToken);
}

function calculateRequestCost(
  pricing: ModelPricing,
  inputTokens: number,
  maxOutputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (maxOutputTokens / 1_000_000) * pricing.output;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

// Available tools that can be toggled per model
export const AVAILABLE_TOOL_IDS = ['calculator', 'current_datetime', 'web_search'] as const;
export type ToolId = typeof AVAILABLE_TOOL_IDS[number];

// Search provider options for web_search tool
export type SearchProvider = 'tavily' | 'perplexity' | 'both';

export const TOOL_INFO: Record<ToolId, { name: string; description: string; icon: string }> = {
  calculator: { name: 'Калькулятор', description: 'Математические вычисления', icon: '🧮' },
  current_datetime: { name: 'Дата/Время', description: 'Текущая дата и время', icon: '🕐' },
  web_search: { name: 'Веб-поиск', description: 'Поиск в интернете', icon: '🔍' },
};

export const SEARCH_PROVIDER_INFO: Record<SearchProvider, { name: string; description: string }> = {
  tavily: { name: 'Tavily', description: 'Бесплатный (1000 запросов/мес)' },
  perplexity: { name: 'Perplexity', description: 'Требуется API-ключ' },
  both: { name: 'Оба', description: 'Два результата в одном ответе' },
};

export interface SingleModelSettings {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  role: AgentRole;
  enableTools: boolean;
  enabledTools?: ToolId[]; // Built-in tools enabled for this model
  enabledCustomTools?: string[]; // Custom tool IDs enabled for this model
  searchProvider?: SearchProvider; // Provider for web_search tool
  requiresApproval?: boolean; // Whether supervisor approval is enabled for this role
}

export interface PerModelSettingsData {
  [modelId: string]: SingleModelSettings;
}

interface PerModelSettingsProps {
  selectedModels: string[];
  settings: PerModelSettingsData;
  onChange: (settings: PerModelSettingsData) => void;
  className?: string;
  currentMessage?: string; // Current message text for cost estimation
}

export const DEFAULT_MODEL_SETTINGS: SingleModelSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: DEFAULT_SYSTEM_PROMPTS.assistant,
  role: 'assistant',
  enableTools: true,
  enabledTools: [...AVAILABLE_TOOL_IDS], // All built-in tools enabled by default
  enabledCustomTools: [], // No custom tools enabled by default
  searchProvider: 'tavily', // Default to Tavily (free tier available)
};

// Get short display name for model
function getModelShortName(modelId: string): string {
  const parts = modelId.split('/');
  const name = parts[parts.length - 1];
  // Shorten common names
  if (name.includes('gemini-3-flash')) return 'Gemini 3 Flash';
  if (name.includes('gemini-3-pro')) return 'Gemini 3 Pro';
  if (name.includes('gemini-2.5-pro')) return 'Gemini 2.5 Pro';
  if (name.includes('gemini-2.5-flash')) return 'Gemini 2.5 Flash';
  if (name.includes('gpt-5-mini')) return 'GPT-5 Mini';
  if (name.includes('gpt-5.2')) return 'GPT-5.2';
  if (name.includes('gpt-5')) return 'GPT-5';
  if (name.includes('gpt-4o')) return 'GPT-4o';
  if (name.includes('claude')) return 'Claude';
  return name.slice(0, 12);
}

export function PerModelSettings({ selectedModels, settings, onChange, className, currentMessage = '' }: PerModelSettingsProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { tools: customTools, loading: customToolsLoading } = useCustomTools();
  const { fetchAllApprovalSettings } = useRoleBehavior(null);
  const [roleApprovalMap, setRoleApprovalMap] = useState<Map<AgentRole, boolean>>(new Map());
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(() => selectedModels[0] || '');
  const [editingPromptModel, setEditingPromptModel] = useState<string | null>(null);
  const [originalPrompts, setOriginalPrompts] = useState<Record<string, string>>({});
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savePromptName, setSavePromptName] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [modelToSave, setModelToSave] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryTargetModel, setLibraryTargetModel] = useState<string | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});

  // Load requires_approval settings for all roles on mount
  useEffect(() => {
    fetchAllApprovalSettings().then(setRoleApprovalMap);
  }, [fetchAllApprovalSettings]);

  // Ensure active tab is always valid when selection changes
  React.useEffect(() => {
    setActiveTab((prev) => {
      if (selectedModels.length === 0) return '';
      if (!prev || !selectedModels.includes(prev)) return selectedModels[0];
      return prev;
    });
  }, [selectedModels]);

  const tabValue = React.useMemo(() => {
    if (selectedModels.length === 0) return '';
    if (activeTab && selectedModels.includes(activeTab)) return activeTab;
    return selectedModels[0];
  }, [activeTab, selectedModels]);

  const getModelSettings = (modelId: string): SingleModelSettings => {
    return settings[modelId] || DEFAULT_MODEL_SETTINGS;
  };

  const updateModelSettings = (modelId: string, newSettings: Partial<SingleModelSettings>) => {
    const currentSettings = getModelSettings(modelId);
    onChange({
      ...settings,
      [modelId]: { ...currentSettings, ...newSettings },
    });
  };

  const handleRoleChange = (modelId: string, role: AgentRole) => {
    const requiresApproval = roleApprovalMap.get(role) ?? false;
    updateModelSettings(modelId, {
      role,
      systemPrompt: DEFAULT_SYSTEM_PROMPTS[role],
      requiresApproval,
    });
  };

  const handleReset = (modelId: string) => {
    onChange({
      ...settings,
      [modelId]: DEFAULT_MODEL_SETTINGS,
    });
    setEditingPromptModel(null);
    setOriginalPrompts(prev => {
      const newPrompts = { ...prev };
      delete newPrompts[modelId];
      return newPrompts;
    });
    toast.success(t('settings.resetDefaults'));
  };

  const handleCopyToAll = (sourceModelId: string) => {
    const sourceSettings = getModelSettings(sourceModelId);
    const newSettings: PerModelSettingsData = {};
    selectedModels.forEach(modelId => {
      newSettings[modelId] = { ...sourceSettings };
    });
    onChange(newSettings);
    toast.success(t('settings.copiedToAll'));
  };

  // Prompt editing handlers
  const handleStartEditPrompt = (modelId: string) => {
    const currentSettings = getModelSettings(modelId);
    setOriginalPrompts(prev => ({ ...prev, [modelId]: currentSettings.systemPrompt }));
    setEditingPromptModel(modelId);
  };

  const handleRevertPrompt = (modelId: string) => {
    const original = originalPrompts[modelId];
    if (original !== undefined) {
      updateModelSettings(modelId, { systemPrompt: original });
      setOriginalPrompts(prev => {
        const newPrompts = { ...prev };
        delete newPrompts[modelId];
        return newPrompts;
      });
    } else {
      const role = getModelSettings(modelId).role;
      updateModelSettings(modelId, { systemPrompt: DEFAULT_SYSTEM_PROMPTS[role] });
    }
    setEditingPromptModel(null);
    toast.success(t('settings.promptReverted'));
  };

  const handleOpenSaveDialog = (modelId: string) => {
    setModelToSave(modelId);
    setSavePromptName('');
    setSaveDialogOpen(true);
  };

  const handleSavePromptToLibrary = async () => {
    if (!user || !modelToSave || !savePromptName.trim()) return;
    setSavingPrompt(true);

    try {
      const modelSettings = getModelSettings(modelToSave);
      const { error } = await supabase
        .from('prompt_library')
        .insert({
          user_id: user.id,
          name: savePromptName.trim(),
          role: modelSettings.role,
          content: modelSettings.systemPrompt,
        });

      if (error) throw error;

      toast.success(t('settings.promptSaved'));
      setSaveDialogOpen(false);
      setEditingPromptModel(null);
      setOriginalPrompts(prev => {
        const newPrompts = { ...prev };
        delete newPrompts[modelToSave];
        return newPrompts;
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleOpenLibrary = (modelId: string) => {
    setLibraryTargetModel(modelId);
    setLibraryOpen(true);
  };

  const handleApplyFromLibrary = (prompt: { content: string; role: AgentRole }) => {
    if (libraryTargetModel) {
      updateModelSettings(libraryTargetModel, {
        role: prompt.role,
        systemPrompt: prompt.content,
      });
    }
  };

  if (selectedModels.length === 0) {
    return (
      <div className={cn('border-t border-sidebar-border p-4', className)}>
        <p className="text-xs text-muted-foreground text-center">
          {t('models.noModelsSelected')}
        </p>
      </div>
    );
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('border-t border-sidebar-border flex flex-col min-h-0', className)}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-4 py-3 h-auto rounded-none hover:bg-sidebar-accent/50"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings className="h-4 w-4" />
            {t('settings.modelSettings')}
            <span className="text-xs text-muted-foreground">({selectedModels.length})</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col h-[55vh] md:h-[60vh] lg:flex-1 lg:h-auto min-h-0">
        <Tabs value={tabValue} onValueChange={setActiveTab} className="w-full flex flex-col h-full min-h-0">
          <div className="px-2 pt-2">
            <ScrollArea className="w-full">
              <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                {selectedModels.map((modelId) => (
                  <TabsTrigger
                    key={modelId}
                    value={modelId}
                    className="text-xs px-2 py-1 h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {getModelShortName(modelId)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>

          {selectedModels.map((modelId) => {
            const modelSettings = getModelSettings(modelId);
            
            return (
              <TabsContent key={modelId} value={modelId} className="mt-0 flex-1 min-h-0">
                <ScrollArea className="h-full hydra-scrollbar">
                  <div className="p-4 space-y-4">
                    {/* Role Selection */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t('settings.role')}</Label>
                      <Select 
                        value={modelSettings.role} 
                        onValueChange={(v) => handleRoleChange(modelId, v as AgentRole)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue>
                            <RoleDisplay role={modelSettings.role} />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <RoleSelectOptions excludeTechnicalStaff />
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Enable Tools Toggle */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label className="text-sm font-medium">{t('settings.enableTools')}</Label>
                            <p className="text-[10px] text-muted-foreground">{t('settings.enableToolsDesc')}</p>
                          </div>
                        </div>
                        <Switch
                          checked={modelSettings.enableTools ?? true}
                          onCheckedChange={(checked) => updateModelSettings(modelId, { enableTools: checked })}
                        />
                      </div>

                      {/* Individual Tool Selection */}
                      {(modelSettings.enableTools ?? true) && (
                        <div className="ml-2 pl-3 border-l-2 border-border/50 space-y-2">
                          <Label className="text-xs text-muted-foreground">Доступные инструменты</Label>
                          {AVAILABLE_TOOL_IDS.map((toolId) => {
                            const toolInfo = TOOL_INFO[toolId];
                            const enabledTools = modelSettings.enabledTools ?? [...AVAILABLE_TOOL_IDS];
                            const isEnabled = enabledTools.includes(toolId);
                            
                            return (
                              <div key={toolId} className="space-y-2">
                                <div
                                  className="flex items-center justify-between py-1.5 px-2 rounded bg-background/50 border border-border/30"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{toolInfo.icon}</span>
                                    <div>
                                      <span className="text-xs font-medium">{toolInfo.name}</span>
                                      <p className="text-[10px] text-muted-foreground">{toolInfo.description}</p>
                                    </div>
                                  </div>
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) => {
                                      const newEnabledTools = checked
                                        ? [...enabledTools, toolId]
                                        : enabledTools.filter(t => t !== toolId);
                                      updateModelSettings(modelId, { enabledTools: newEnabledTools });
                                    }}
                                    className="scale-75"
                                  />
                                </div>
                                
                                {/* Search Provider Selector - only for web_search when enabled */}
                                {toolId === 'web_search' && isEnabled && (
                                  <div className="ml-6 pl-3 border-l-2 border-primary/30 space-y-1.5">
                                    <Label className="text-[10px] text-muted-foreground">Провайдер поиска</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(Object.keys(SEARCH_PROVIDER_INFO) as SearchProvider[]).map((provider) => {
                                        const info = SEARCH_PROVIDER_INFO[provider];
                                        const isSelected = (modelSettings.searchProvider ?? 'tavily') === provider;
                                        
                                        return (
                                          <button
                                            key={provider}
                                            type="button"
                                            onClick={() => updateModelSettings(modelId, { searchProvider: provider })}
                                            className={cn(
                                              "px-2 py-1 rounded text-[10px] border transition-all",
                                              isSelected
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background/50 text-muted-foreground border-border/50 hover:border-primary/50"
                                            )}
                                            title={info.description}
                                          >
                                            {info.name}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <p className="text-[9px] text-muted-foreground">
                                      {SEARCH_PROVIDER_INFO[modelSettings.searchProvider ?? 'tavily'].description}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Custom Tools Section */}
                          {customTools.length > 0 && (
                            <>
                              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/30">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <Label className="text-xs text-muted-foreground">Пользовательские инструменты</Label>
                              </div>
                              {customTools.map((tool) => {
                                const enabledCustomTools = modelSettings.enabledCustomTools ?? [];
                                const isEnabled = enabledCustomTools.includes(tool.id);
                                
                                return (
                                  <div
                                    key={tool.id}
                                    className="flex items-center justify-between py-1.5 px-2 rounded bg-background/50 border border-border/30"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />
                                      <div className="min-w-0">
                                        <span className="text-xs font-medium truncate block">{tool.display_name}</span>
                                        <p className="text-[10px] text-muted-foreground truncate">{tool.description}</p>
                                      </div>
                                    </div>
                                    <Switch
                                      checked={isEnabled}
                                      onCheckedChange={(checked) => {
                                        const newEnabledCustomTools = checked
                                          ? [...enabledCustomTools, tool.id]
                                          : enabledCustomTools.filter(id => id !== tool.id);
                                        updateModelSettings(modelId, { enabledCustomTools: newEnabledCustomTools });
                                      }}
                                      className="scale-75 shrink-0"
                                    />
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pricing Info */}
                    {(() => {
                      const pricing = getModelPricing(modelId);
                      const inputTokens = estimateTokens(currentMessage + modelSettings.systemPrompt);
                      const costEstimate = pricing ? calculateRequestCost(pricing, inputTokens, modelSettings.maxTokens) : null;
                      
                      return (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {t('settings.pricing')}
                          </Label>
                          {pricing ? (
                            <div className="bg-muted/50 rounded-md p-2 text-xs space-y-2">
                              {/* Base pricing */}
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{t('settings.inputCost')}:</span>
                                <span className="font-mono text-muted-foreground">{formatPrice(pricing.input)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{t('settings.outputCost')}:</span>
                                <span className="font-mono text-muted-foreground">{formatPrice(pricing.output)}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground text-center border-b border-border pb-2">
                                {t('settings.perMillion')}
                              </div>
                              
                              {/* Cost estimate */}
                              <div className="pt-1">
                                <div className="text-[10px] text-muted-foreground mb-1">{t('settings.estimatedCost')}:</div>
                                {inputTokens > 0 ? (
                                  <>
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">{t('settings.inputTokens')}:</span>
                                      <span className="font-mono">~{inputTokens.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-muted-foreground">{t('settings.outputTokens')}:</span>
                                      <span className="font-mono">≤{modelSettings.maxTokens.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-border font-medium">
                                      <span>{t('settings.totalCost')}:</span>
                                      <span className="font-mono text-primary">≤{formatPrice(costEstimate!.totalCost)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-[10px] text-muted-foreground italic">
                                    {t('settings.enterMessage')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-muted/50 rounded-md p-2 text-xs text-muted-foreground text-center">
                              {t('settings.noPricing')}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Temperature */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">{t('settings.temperature')}</Label>
                        <span className="text-xs font-mono text-primary">{modelSettings.temperature.toFixed(2)}</span>
                      </div>
                      <Slider
                        value={[modelSettings.temperature]}
                        onValueChange={([v]) => updateModelSettings(modelId, { temperature: v })}
                        min={0}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{t('settings.precise')}</span>
                        <span>{t('settings.creative')}</span>
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">{t('settings.maxTokens')}</Label>
                        <span className="text-xs font-mono text-primary">{modelSettings.maxTokens}</span>
                      </div>
                      <Slider
                        value={[modelSettings.maxTokens]}
                        onValueChange={([v]) => updateModelSettings(modelId, { maxTokens: v })}
                        min={256}
                        max={8192}
                        step={256}
                        className="w-full"
                      />
                    </div>

                    {/* Role Prompt */}
                    {(() => {
                      const promptTokens = estimateTokens(modelSettings.systemPrompt);
                      const pricing = getModelPricing(modelId);
                      const promptCost = pricing ? (promptTokens / 1_000_000) * pricing.input : null;
                      
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">{t('settings.rolePrompt')}</Label>
                            <div className="flex items-center gap-2">
                              {/* Token count and cost */}
                              {promptTokens > 0 && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  ~{promptTokens} {t('settings.promptTokens')}
                                  {promptCost !== null && ` • ${formatPrice(promptCost)}`}
                                </span>
                              )}
                              {editingPromptModel === modelId && (
                                <span className="text-[10px] text-primary font-medium">{t('settings.promptEditing')}</span>
                              )}
                              {/* Expand/collapse toggle for long prompts */}
                              {modelSettings.systemPrompt.length > 150 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => {
                                    setExpandedPrompts(prev => ({
                                      ...prev,
                                      [modelId]: !prev[modelId]
                                    }));
                                  }}
                                >
                                  {expandedPrompts[modelId] ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Collapsible prompt display / Editable textarea */}
                          {editingPromptModel === modelId ? (
                            <Textarea
                              value={modelSettings.systemPrompt}
                              onChange={(e) => {
                                updateModelSettings(modelId, { systemPrompt: e.target.value });
                              }}
                              className="min-h-[100px] max-h-[200px] text-xs resize-none overflow-y-auto hydra-scrollbar"
                              placeholder={t('settings.systemPromptPlaceholder')}
                              autoFocus
                            />
                          ) : (
                            <div 
                              className={cn(
                                "bg-muted/50 rounded-md p-2 text-xs cursor-pointer hover:bg-muted/70 transition-colors",
                                expandedPrompts[modelId] ? "max-h-[200px] overflow-y-auto hydra-scrollbar" : "max-h-[60px] overflow-hidden"
                              )}
                              onClick={() => handleStartEditPrompt(modelId)}
                            >
                              <p className="whitespace-pre-wrap text-muted-foreground">
                                {modelSettings.systemPrompt || t('settings.systemPromptPlaceholder')}
                              </p>
                              {!expandedPrompts[modelId] && modelSettings.systemPrompt.length > 150 && (
                                <span className="text-primary text-[10px]">...</span>
                              )}
                            </div>
                          )}
                          
                          {/* Quick action buttons: Copy, Clear, Paste */}
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => {
                                navigator.clipboard.writeText(modelSettings.systemPrompt);
                                toast.success(t('settings.promptCopied'));
                              }}
                              disabled={!modelSettings.systemPrompt}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              {t('settings.copyPrompt')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={async () => {
                                try {
                                  const text = await navigator.clipboard.readText();
                                  if (text) {
                                    handleStartEditPrompt(modelId);
                                    updateModelSettings(modelId, { systemPrompt: text });
                                    toast.success(t('settings.promptPasted'));
                                  }
                                } catch {
                                  toast.error('Clipboard access denied');
                                }
                              }}
                            >
                              <Clipboard className="h-3 w-3 mr-1" />
                              {t('settings.pastePrompt')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px] text-destructive hover:text-destructive"
                              onClick={() => {
                                handleStartEditPrompt(modelId);
                                updateModelSettings(modelId, { systemPrompt: '' });
                                toast.success(t('settings.promptCleared'));
                              }}
                              disabled={!modelSettings.systemPrompt}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {t('settings.clearPrompt')}
                            </Button>
                          </div>
                          
                          {/* Prompt library buttons */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleOpenLibrary(modelId)}
                            >
                              <Library className="h-3 w-3 mr-1" />
                              {t('settings.loadFromLibrary')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleRevertPrompt(modelId)}
                            >
                              <Undo2 className="h-3 w-3 mr-1" />
                              {t('settings.revertPrompt')}
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="col-span-2 h-7 text-xs"
                              onClick={() => handleOpenSaveDialog(modelId)}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              {t('settings.savePrompt')}
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleReset(modelId)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {t('settings.reset')}
                      </Button>
                      {selectedModels.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleCopyToAll(modelId)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {t('settings.copyToAll')}
                        </Button>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            );
          })}
        </Tabs>
      </CollapsibleContent>

      {/* Save Prompt Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings.savePrompt')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('settings.promptName')}</Label>
              <Input
                value={savePromptName}
                onChange={(e) => setSavePromptName(e.target.value)}
                placeholder={t('settings.promptNamePlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSavePromptToLibrary}
              disabled={!savePromptName.trim() || savingPrompt}
            >
              {savingPrompt ? t('common.loading') : t('profile.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prompt Library Picker */}
      <PromptLibraryPicker
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={handleApplyFromLibrary}
        currentRole={libraryTargetModel ? getModelSettings(libraryTargetModel).role : undefined}
      />
    </Collapsible>
  );
}

export { DEFAULT_SYSTEM_PROMPTS };
