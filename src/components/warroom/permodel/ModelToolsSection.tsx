import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Wrench, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomTools } from '@/hooks/useCustomTools';
import {
  AVAILABLE_TOOL_IDS, TOOL_INFO, TOOL_USAGE_MODE_INFO, SEARCH_PROVIDER_INFO,
  DEFAULT_TOOL_USAGE_MODES,
  type ToolId, type ToolUsageMode, type SearchProvider,
  type SingleModelSettings, type ToolSettings,
  getToolSettingsForModel,
} from './types';

interface ModelToolsSectionProps {
  modelId: string;
  modelSettings: SingleModelSettings;
  onUpdate: (patch: Partial<SingleModelSettings>) => void;
}

export function ModelToolsSection({ modelId, modelSettings, onUpdate }: ModelToolsSectionProps) {
  const { t } = useLanguage();
  const { tools: customTools } = useCustomTools();
  const lang = t('language') === 'ru' ? 'ru' : 'en';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <div>
            <Label className="text-sm font-medium">{t('settings.enableTools')}</Label>
            <p className="text-[10px] text-muted-foreground">{t('settings.enableToolsDesc')}</p>
          </div>
        </div>
        <Switch checked={modelSettings.enableTools ?? true} onCheckedChange={checked => onUpdate({ enableTools: checked })} />
      </div>

      {(modelSettings.enableTools ?? true) && (
        <div className="ml-2 pl-3 border-l-2 border-border/50 space-y-2">
          <Label className="text-xs text-muted-foreground">Доступные инструменты</Label>
          {AVAILABLE_TOOL_IDS.map(toolId => {
            const toolInfo = TOOL_INFO[toolId];
            const toolSettings = getToolSettingsForModel(modelSettings);
            const current = toolSettings[toolId] || { enabled: true, usageMode: DEFAULT_TOOL_USAGE_MODES[toolId] };
            const isEnabled = current.enabled;

            return (
              <div key={toolId} className="space-y-2">
                <div className="flex items-center justify-between py-1.5 px-2 rounded bg-background/50 border border-border/30">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{toolInfo.icon}</span>
                    <div>
                      <span className="text-xs font-medium">{toolInfo.name}</span>
                      <p className="text-[10px] text-muted-foreground">{toolInfo.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={checked => {
                      const newTS = { ...toolSettings, [toolId]: { ...current, enabled: checked } };
                      onUpdate({ toolSettings: newTS, enabledTools: AVAILABLE_TOOL_IDS.filter(t => newTS[t]?.enabled ?? true) });
                    }}
                    className="scale-75"
                  />
                </div>

                {isEnabled && (
                  <div className="ml-6 pl-3 border-l-2 border-primary/30 space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">{lang === 'ru' ? 'Режим использования' : 'Usage mode'}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(TOOL_USAGE_MODE_INFO) as ToolUsageMode[]).map(mode => {
                        const info = TOOL_USAGE_MODE_INFO[mode];
                        const isSelected = current.usageMode === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => onUpdate({ toolSettings: { ...toolSettings, [toolId]: { ...current, usageMode: mode } } })}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] border transition-all",
                              isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background/50 text-muted-foreground border-border/50 hover:border-primary/50"
                            )}
                            title={info.description[lang]}
                          >
                            {info.label[lang]}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-muted-foreground">{TOOL_USAGE_MODE_INFO[current.usageMode].description[lang]}</p>
                  </div>
                )}

                {toolId === 'web_search' && isEnabled && (
                  <div className="ml-6 pl-3 border-l-2 border-primary/30 space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">Провайдер поиска</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(SEARCH_PROVIDER_INFO) as SearchProvider[]).map(provider => {
                        const info = SEARCH_PROVIDER_INFO[provider];
                        const isSelected = (modelSettings.searchProvider ?? 'tavily') === provider;
                        return (
                          <button
                            key={provider}
                            type="button"
                            onClick={() => onUpdate({ searchProvider: provider })}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] border transition-all",
                              isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background/50 text-muted-foreground border-border/50 hover:border-primary/50"
                            )}
                            title={info.description}
                          >
                            {info.name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-muted-foreground">{SEARCH_PROVIDER_INFO[modelSettings.searchProvider ?? 'tavily'].description}</p>
                  </div>
                )}
              </div>
            );
          })}

          {customTools.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/30">
                <User className="h-3 w-3 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Пользовательские инструменты</Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {customTools.map(tool => {
                  const enabledCustomTools = modelSettings.enabledCustomTools ?? [];
                  const isEnabled = enabledCustomTools.includes(tool.id);
                  return (
                    <div key={tool.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-background/50 border border-border/30">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium truncate block">{tool.display_name}</span>
                          <p className="text-[10px] text-muted-foreground truncate">{tool.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={checked => {
                          const next = checked ? [...enabledCustomTools, tool.id] : enabledCustomTools.filter(id => id !== tool.id);
                          onUpdate({ enabledCustomTools: next });
                        }}
                        className="scale-75 shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
