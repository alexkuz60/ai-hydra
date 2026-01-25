import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Settings, ChevronDown, RotateCcw, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type AgentRole = 'assistant' | 'critic' | 'arbiter';

export interface SingleModelSettings {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  role: AgentRole;
}

export interface PerModelSettingsData {
  [modelId: string]: SingleModelSettings;
}

interface PerModelSettingsProps {
  selectedModels: string[];
  settings: PerModelSettingsData;
  onChange: (settings: PerModelSettingsData) => void;
  className?: string;
}

const DEFAULT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  assistant: `Вы - эксперт в своей области. Предоставляйте четкие, хорошо обоснованные ответы. Будьте лаконичны, но основательны.`,
  critic: `Вы - критик-аналитик. Ваша задача - находить слабые места, противоречия и потенциальные проблемы в рассуждениях. Будьте конструктивны, но строги.`,
  arbiter: `Вы - арбитр дискуссии. Синтезируйте различные точки зрения, выделяйте консенсус и расхождения. Формируйте взвешенное финальное решение.`,
};

export const DEFAULT_MODEL_SETTINGS: SingleModelSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: DEFAULT_SYSTEM_PROMPTS.assistant,
  role: 'assistant',
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

export function PerModelSettings({ selectedModels, settings, onChange, className }: PerModelSettingsProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(selectedModels[0] || '');

  // Ensure active tab is valid
  React.useEffect(() => {
    if (selectedModels.length > 0 && !selectedModels.includes(activeTab)) {
      setActiveTab(selectedModels[0]);
    }
  }, [selectedModels, activeTab]);

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
    updateModelSettings(modelId, {
      role,
      systemPrompt: DEFAULT_SYSTEM_PROMPTS[role],
    });
  };

  const handleReset = (modelId: string) => {
    onChange({
      ...settings,
      [modelId]: DEFAULT_MODEL_SETTINGS,
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

  if (selectedModels.length === 0) {
    return (
      <div className={cn('border-t border-sidebar-border p-4', className)}>
        <p className="text-xs text-muted-foreground text-center">
          {t('warRoom.noModelsSelected')}
        </p>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn('border-t border-sidebar-border', className)}>
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
      <CollapsibleContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              <TabsContent key={modelId} value={modelId} className="mt-0">
                <ScrollArea className="max-h-[350px]">
                  <div className="p-4 space-y-4">
                    {/* Role Selection */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t('settings.role')}</Label>
                      <Select 
                        value={modelSettings.role} 
                        onValueChange={(v) => handleRoleChange(modelId, v as AgentRole)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assistant">{t('role.assistant')}</SelectItem>
                          <SelectItem value="critic">{t('role.critic')}</SelectItem>
                          <SelectItem value="arbiter">{t('role.arbiter')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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

                    {/* System Prompt */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t('settings.systemPrompt')}</Label>
                      <Textarea
                        value={modelSettings.systemPrompt}
                        onChange={(e) => updateModelSettings(modelId, { systemPrompt: e.target.value })}
                        className="min-h-[100px] text-xs resize-none"
                        placeholder={t('settings.systemPromptPlaceholder')}
                      />
                    </div>

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
    </Collapsible>
  );
}

export { DEFAULT_SYSTEM_PROMPTS };
