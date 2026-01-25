import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Settings, ChevronDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AgentRole = 'assistant' | 'critic' | 'arbiter';

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

const DEFAULT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  assistant: `Вы - эксперт-ассистент. Предоставляйте четкие, хорошо обоснованные ответы. Будьте лаконичны, но основательны.`,
  critic: `Вы - критик-аналитик. Ваша задача - находить слабые места, противоречия и потенциальные проблемы в рассуждениях. Будьте конструктивны, но строги.`,
  arbiter: `Вы - арбитр дискуссии. Синтезируйте различные точки зрения, выделяйте консенсус и расхождения. Формируйте взвешенное финальное решение.`,
};

const DEFAULT_SETTINGS: ModelSettingsData = {
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: DEFAULT_SYSTEM_PROMPTS.assistant,
  role: 'assistant',
};

export function ModelSettings({ settings, onChange, className }: ModelSettingsProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(true);

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
          </div>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ScrollArea className="max-h-[400px]">
          <div className="p-4 space-y-5">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('settings.role')}</Label>
              <Select value={settings.role} onValueChange={(v) => handleRoleChange(v as AgentRole)}>
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
              className="w-full"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              {t('settings.resetDefaults')}
            </Button>
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { DEFAULT_SETTINGS, DEFAULT_SYSTEM_PROMPTS };
