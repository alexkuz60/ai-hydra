import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Bot, Lightbulb } from 'lucide-react';
import { CloudSyncIndicator } from '@/components/ui/CloudSyncIndicator';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { useTechRoleDefaults } from '@/hooks/useTechRoleDefaults';
import { ModelNameWithIcon } from '@/components/ui/ModelNameWithIcon';
import type { AgentRole } from '@/config/roles';

const MODEL_CHOICE_RATIONALE: Record<string, { ru: string; en: string }> = {
  archivist: {
    ru: 'Gemini 2.5 Flash — баланс скорости и качества для суммаризации и поиска по архивам. Хорошо справляется с большими контекстами при умеренной стоимости.',
    en: 'Gemini 2.5 Flash — balanced speed and quality for summarization and archive retrieval. Handles large contexts well at moderate cost.',
  },
  analyst: {
    ru: 'Gemini 2.5 Pro — сильнейшие аналитические способности в линейке Gemini. Лучший выбор для сложных метрик и многошагового рассуждения.',
    en: 'Gemini 2.5 Pro — strongest analytical capabilities in the Gemini lineup. Best choice for complex metrics and multi-step reasoning.',
  },
  promptengineer: {
    ru: 'GPT-5 — высочайшая языковая точность для работы с промптами. Превосходит аналоги в тонкостях формулировок и структурировании инструкций.',
    en: 'GPT-5 — top-tier linguistic precision for prompt engineering. Excels at nuanced phrasing and instruction structuring.',
  },
  flowregulator: {
    ru: 'Gemini 3 Flash Preview — быстрый структурный анализ потоков. Новое поколение модели обеспечивает лучшее понимание зависимостей при низкой задержке.',
    en: 'Gemini 3 Flash Preview — fast structural flow analysis. Next-gen model provides better dependency understanding at low latency.',
  },
  toolsmith: {
    ru: 'GPT-5 Mini — надёжная генерация кода при умеренной стоимости. Оптимальный баланс для создания и отладки инструментов без переплат.',
    en: 'GPT-5 Mini — reliable code generation at moderate cost. Optimal balance for building and debugging tools without overpaying.',
  },
  guide: {
    ru: 'Gemini 2.5 Flash Lite — самая быстрая и дешёвая модель. Идеальна для FAQ и навигационных подсказок, где скорость важнее глубины рассуждений.',
    en: 'Gemini 2.5 Flash Lite — fastest and cheapest model. Ideal for FAQ and navigation tips where speed matters more than deep reasoning.',
  },
  webhunter: {
    ru: 'Gemini 3 Flash Preview — быстрая мультимодальная обработка веб-контента. Хорошо извлекает данные из разнородных страниц при минимальных затратах.',
    en: 'Gemini 3 Flash Preview — fast multimodal web content processing. Efficiently extracts data from diverse pages at minimal cost.',
  },
};

interface RoleSettingsSectionProps {
  isTechnicalStaff: boolean;
  requiresApproval: boolean;
  isSaving: boolean;
  isLoading: boolean;
  userId?: string;
  selectedRole?: AgentRole | null;
  syncLoaded?: boolean;
  onSaveRequiresApproval: (checked: boolean) => Promise<boolean>;
}

export function RoleSettingsSection({ isTechnicalStaff, requiresApproval, isSaving, isLoading, userId, selectedRole, syncLoaded = true, onSaveRequiresApproval }: RoleSettingsSectionProps) {
  const { t, language } = useLanguage();
  const { lovableModels, personalModels } = useAvailableModels();
  const { getDefaultModel, setDefaultModel } = useTechRoleDefaults();

  const allModels = [...lovableModels, ...personalModels];
  const currentDefault = selectedRole ? getDefaultModel(selectedRole) : null;

  return (
    <>
      <div className="flex items-center gap-3 pt-2">
        <Checkbox id="technicalStaff" checked={isTechnicalStaff} disabled />
        <label htmlFor="technicalStaff" className="text-sm text-muted-foreground cursor-default">
          {t('staffRoles.technicalStaff')}
        </label>
      </div>

       {/* Default model selector for technical staff */}
       {isTechnicalStaff && selectedRole && allModels.length > 0 && (
         <div className="pt-3 space-y-1.5">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Bot className="h-4 w-4 text-muted-foreground" />
               <label className="text-sm font-medium">
                 {language === 'ru' ? 'Модель по умолчанию' : 'Default Model'}
               </label>
             </div>
             <CloudSyncIndicator loaded={syncLoaded} />
           </div>
          <p className="text-xs text-muted-foreground">
            {language === 'ru'
              ? 'Модель, используемая при вызове этого техника. Пользователь может переназначить.'
              : 'Model used when calling this technician. User can override.'}
          </p>
          <Select
            value={currentDefault || '__none__'}
            onValueChange={(val) => {
              const modelId = val === '__none__' ? null : val;
              setDefaultModel(selectedRole, modelId);
              toast.success(language === 'ru' ? 'Модель по умолчанию обновлена' : 'Default model updated');
            }}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder={language === 'ru' ? 'Не назначена' : 'Not assigned'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-muted-foreground text-sm">
                {language === 'ru' ? '— Не назначена —' : '— Not assigned —'}
              </SelectItem>
              {allModels.map(model => (
                <SelectItem key={model.id} value={model.id} className="text-sm">
                  <ModelNameWithIcon modelName={model.name} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedRole && MODEL_CHOICE_RATIONALE[selectedRole] && (
            <div className="flex gap-2 rounded-md border border-hydra-warning/30 bg-hydra-warning/10 px-3 py-2">
              <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-hydra-warning" />
              <p className="text-xs text-hydra-warning leading-relaxed">
                {language === 'ru' ? MODEL_CHOICE_RATIONALE[selectedRole].ru : MODEL_CHOICE_RATIONALE[selectedRole].en}
              </p>
            </div>
          )}
        </div>
      )}

      {userId && (
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <label htmlFor="requiresApproval" className="text-sm font-medium cursor-pointer">
                {t('staffRoles.requiresApproval')}
              </label>
              <p className="text-xs text-muted-foreground">{t('staffRoles.requiresApprovalHint')}</p>
            </div>
          </div>
          <Switch
            id="requiresApproval"
            checked={requiresApproval}
            onCheckedChange={async (checked) => {
              const success = await onSaveRequiresApproval(checked);
              if (success) toast.success(t('common.saved'));
            }}
            disabled={isSaving || isLoading}
          />
        </div>
      )}
    </>
  );
}
