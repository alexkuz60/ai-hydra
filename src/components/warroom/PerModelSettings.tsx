import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Settings, ChevronDown, RotateCcw, Copy, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { RoleSelectOptions, RoleDisplay } from '@/components/ui/RoleSelectItem';
import { useRoleBehavior } from '@/hooks/useRoleBehavior';

// Re-export types from the new module
import {
  type AgentRole,
  type SingleModelSettings,
  type PerModelSettingsData,
  type ToolId,
  type ToolUsageMode,
  type ToolSettings,
  type SearchProvider,
  DEFAULT_MODEL_SETTINGS,
  DEFAULT_SYSTEM_PROMPTS,
  AVAILABLE_TOOL_IDS,
  TOOL_INFO,
  TOOL_USAGE_MODE_INFO,
  DEFAULT_TOOL_USAGE_MODES,
  SEARCH_PROVIDER_INFO,
  getToolSettingsForModel,
  getModelShortName,
} from './permodel/types';

export type { AgentRole, SingleModelSettings, PerModelSettingsData, ToolId, ToolUsageMode, ToolSettings, SearchProvider };
export { DEFAULT_MODEL_SETTINGS, DEFAULT_SYSTEM_PROMPTS, AVAILABLE_TOOL_IDS, TOOL_INFO, TOOL_USAGE_MODE_INFO, DEFAULT_TOOL_USAGE_MODES, SEARCH_PROVIDER_INFO, getToolSettingsForModel };

// Sub-sections
import { ModelToolsSection } from './permodel/ModelToolsSection';
import { ModelPricingSection } from './permodel/ModelPricingSection';
import { ModelPromptSection } from './permodel/ModelPromptSection';

export interface ModelSettingsData {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

interface PerModelSettingsProps {
  selectedModels: string[];
  settings: PerModelSettingsData;
  onChange: (settings: PerModelSettingsData) => void;
  className?: string;
  currentMessage?: string;
}

export function PerModelSettings({ selectedModels, settings, onChange, className, currentMessage = '' }: PerModelSettingsProps) {
  const { t } = useLanguage();
  const { fetchAllApprovalSettings } = useRoleBehavior(null);
  const [roleApprovalMap, setRoleApprovalMap] = useState<Map<AgentRole, boolean>>(new Map());
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(() => selectedModels[0] || '');
  const [editingPromptModel, setEditingPromptModel] = useState<string | null>(null);
  const [originalPrompts, setOriginalPrompts] = useState<Record<string, string>>({});
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchAllApprovalSettings().then(setRoleApprovalMap); }, [fetchAllApprovalSettings]);

  useEffect(() => {
    if (roleApprovalMap.size === 0) return;
    let hasChanges = false;
    const updated = { ...settings };
    selectedModels.forEach(modelId => {
      const ms = settings[modelId] || DEFAULT_MODEL_SETTINGS;
      const shouldRequire = roleApprovalMap.get(ms.role || 'assistant') ?? false;
      if (ms.requiresApproval !== shouldRequire) {
        hasChanges = true;
        updated[modelId] = { ...ms, requiresApproval: shouldRequire };
      }
    });
    if (hasChanges) onChange(updated);
  }, [roleApprovalMap, selectedModels]);

  React.useEffect(() => {
    setActiveTab(prev => {
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

  const getMS = (id: string): SingleModelSettings => settings[id] || DEFAULT_MODEL_SETTINGS;
  const updateMS = (id: string, patch: Partial<SingleModelSettings>) => onChange({ ...settings, [id]: { ...getMS(id), ...patch } });

  const handleRoleChange = (id: string, role: AgentRole) => {
    updateMS(id, { role, systemPrompt: DEFAULT_SYSTEM_PROMPTS[role], requiresApproval: roleApprovalMap.get(role) ?? false });
  };

  const handleReset = (id: string) => {
    onChange({ ...settings, [id]: DEFAULT_MODEL_SETTINGS });
    setEditingPromptModel(null);
    setOriginalPrompts(prev => { const n = { ...prev }; delete n[id]; return n; });
    toast.success(t('settings.resetDefaults'));
  };

  const handleCopyToAll = (sourceId: string) => {
    const src = getMS(sourceId);
    const next: PerModelSettingsData = {};
    selectedModels.forEach(id => { next[id] = { ...src }; });
    onChange(next);
    toast.success(t('settings.copiedToAll'));
  };

  if (selectedModels.length === 0) {
    return (
      <div className={cn('border-t border-sidebar-border p-4', className)}>
        <p className="text-xs text-muted-foreground text-center">{t('models.noModelsSelected')}</p>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn('border-t border-sidebar-border flex flex-col min-h-0', className)}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-4 py-3 h-auto rounded-none hover:bg-sidebar-accent/50">
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
                {selectedModels.map(id => (
                  <TabsTrigger key={id} value={id} className="text-xs px-2 py-1 h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    {getModelShortName(id)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>

          {selectedModels.map(modelId => {
            const ms = getMS(modelId);
            return (
              <TabsContent key={modelId} value={modelId} className="mt-0 flex-1 min-h-0">
                <ScrollArea className="h-full hydra-scrollbar">
                  <div className="p-4 space-y-4">
                    {/* Role */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t('settings.role')}</Label>
                      <Select value={ms.role} onValueChange={v => handleRoleChange(modelId, v as AgentRole)}>
                        <SelectTrigger className="h-9"><SelectValue><RoleDisplay role={ms.role} /></SelectValue></SelectTrigger>
                        <SelectContent><RoleSelectOptions excludeTechnicalStaff /></SelectContent>
                      </Select>
                    </div>

                    {ms.requiresApproval && (
                      <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-warning/10 border border-warning/30">
                        <ShieldCheck className="h-4 w-4 text-warning" />
                        <div>
                          <span className="text-xs font-medium text-warning">{t('settings.supervisorApproval')}</span>
                          <p className="text-[10px] text-muted-foreground">{t('settings.supervisorApprovalDesc')}</p>
                        </div>
                      </div>
                    )}

                    {/* Tools */}
                    <ModelToolsSection modelId={modelId} modelSettings={ms} onUpdate={patch => updateMS(modelId, patch)} />

                    {/* Pricing */}
                    <ModelPricingSection modelId={modelId} modelSettings={ms} currentMessage={currentMessage} />

                    {/* Temperature & Max Tokens */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">{t('settings.temperature')}</Label>
                          <span className="text-xs font-mono text-primary">{ms.temperature.toFixed(2)}</span>
                        </div>
                        <Slider value={[ms.temperature]} onValueChange={([v]) => updateMS(modelId, { temperature: v })} min={0} max={2} step={0.1} className="w-full" />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{t('settings.precise')}</span>
                          <span>{t('settings.creative')}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">{t('settings.maxTokens')}</Label>
                          <span className="text-xs font-mono text-primary">{ms.maxTokens}</span>
                        </div>
                        <Slider value={[ms.maxTokens]} onValueChange={([v]) => updateMS(modelId, { maxTokens: v })} min={256} max={8192} step={256} className="w-full" />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>256</span>
                          <span>8192</span>
                        </div>
                      </div>
                    </div>

                    {/* Prompt */}
                    <ModelPromptSection
                      modelId={modelId}
                      modelSettings={ms}
                      onUpdate={patch => updateMS(modelId, patch)}
                      onReset={() => handleReset(modelId)}
                      onCopyToAll={() => handleCopyToAll(modelId)}
                      showCopyToAll={selectedModels.length > 1}
                      editingPromptModel={editingPromptModel}
                      setEditingPromptModel={setEditingPromptModel}
                      originalPrompts={originalPrompts}
                      setOriginalPrompts={setOriginalPrompts}
                      expandedPrompts={expandedPrompts}
                      setExpandedPrompts={setExpandedPrompts}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            );
          })}
        </Tabs>
      </CollapsibleContent>
    </Collapsible>
  );
}
