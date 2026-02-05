import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Settings, ChevronDown, RotateCcw, Save, Trash2, Loader2 } from 'lucide-react';
import { IconButtonWithTooltip } from '@/components/ui/IconButtonWithTooltip';
import { cn } from '@/lib/utils';
import { useModelPresets, ModelPreset } from '@/hooks/useModelPresets';
import { toast } from 'sonner';
import { RoleSelectOptions, RoleDisplay } from '@/components/ui/RoleSelectItem';
import { AgentRole, DEFAULT_SYSTEM_PROMPTS } from '@/config/roles';

export type { AgentRole };

export interface ModelSettingsData {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  role: AgentRole;
}

interface ModelSettingsProps {
  settings: ModelSettingsData;
  onChange: (settings: ModelSettingsData) => void;
  className?: string;
}

const DEFAULT_SETTINGS: ModelSettingsData = {
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: DEFAULT_SYSTEM_PROMPTS.assistant,
  role: 'assistant',
};

export function ModelSettings({ settings, onChange, className }: ModelSettingsProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [saving, setSaving] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<ModelPreset | null>(null);
  
  const { presets, loading, savePreset, deletePreset, presetToSettings } = useModelPresets();

  const handleRoleChange = (role: AgentRole) => {
    onChange({
      ...settings,
      role,
      systemPrompt: DEFAULT_SYSTEM_PROMPTS[role],
    });
  };

  const handleReset = () => {
    onChange(DEFAULT_SETTINGS);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    
    setSaving(true);
    const success = await savePreset(presetName.trim(), settings);
    setSaving(false);
    
    if (success) {
      toast.success(t('presets.saved'));
      setSaveDialogOpen(false);
      setPresetName('');
    }
  };

  const handleApplyPreset = (preset: ModelPreset) => {
    onChange(presetToSettings(preset));
    toast.success(t('presets.applied'));
  };

  const handleDeletePreset = async () => {
    if (!presetToDelete) return;
    
    const success = await deletePreset(presetToDelete.id);
    if (success) {
      toast.success(t('presets.deleted'));
    }
    setPresetToDelete(null);
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn('border-t border-sidebar-border', className)}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto rounded-none hover:bg-sidebar-accent/50"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Settings className="h-4 w-4" />
              {t('settings.modelSettings')}
            </div>
            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ScrollArea className="max-h-[400px]">
            <div className="p-4 space-y-5">
              {/* Presets Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    {t('presets.title')}
                  </Label>
                  <IconButtonWithTooltip
                    icon={Save}
                    tooltip={t('presets.save')}
                    onClick={() => setSaveDialogOpen(true)}
                    variant="ghost"
                    side="left"
                  />
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : presets.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    {t('presets.empty')}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center gap-1 group"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 justify-start font-normal"
                          onClick={() => handleApplyPreset(preset)}
                        >
                          <span className="truncate">{preset.name}</span>
                        </Button>
                        <IconButtonWithTooltip
                          icon={Trash2}
                          tooltip={t('tasks.delete')}
                          onClick={() => setPresetToDelete(preset)}
                          variant="ghost"
                          side="right"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border/50 pt-4" />

              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('settings.role')}</Label>
                <Select value={settings.role} onValueChange={(v) => handleRoleChange(v as AgentRole)}>
                  <SelectTrigger className="h-9">
                    <SelectValue>
                      <RoleDisplay role={settings.role} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <RoleSelectOptions />
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">{t('settings.temperature')}</Label>
                  <span className="text-xs font-mono text-primary">{settings.temperature.toFixed(2)}</span>
                </div>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={([v]) => onChange({ ...settings, temperature: v })}
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">{t('settings.maxTokens')}</Label>
                  <span className="text-xs font-mono text-primary">{settings.maxTokens}</span>
                </div>
                <Slider
                  value={[settings.maxTokens]}
                  onValueChange={([v]) => onChange({ ...settings, maxTokens: v })}
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
                  value={settings.systemPrompt}
                  onChange={(e) => onChange({ ...settings, systemPrompt: e.target.value })}
                  className="min-h-[120px] text-xs resize-none"
                  placeholder={t('settings.systemPromptPlaceholder')}
                />
              </div>

              {/* Reset Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('settings.resetDefaults')}
              </Button>
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('presets.saveTitle')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="preset-name" className="text-sm">
              {t('presets.name')}
            </Label>
            <Input
              id="preset-name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={t('presets.namePlaceholder')}
              className="mt-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePreset();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim() || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('profile.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!presetToDelete} onOpenChange={(open) => !open && setPresetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('presets.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {presetToDelete?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePreset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('tasks.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export { DEFAULT_SETTINGS };
