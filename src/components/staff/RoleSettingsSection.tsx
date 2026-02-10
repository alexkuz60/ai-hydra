import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Bot } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import { useTechRoleDefaults } from '@/hooks/useTechRoleDefaults';
import { ModelNameWithIcon } from '@/components/ui/ModelNameWithIcon';
import type { AgentRole } from '@/config/roles';

interface RoleSettingsSectionProps {
  isTechnicalStaff: boolean;
  requiresApproval: boolean;
  isSaving: boolean;
  isLoading: boolean;
  userId?: string;
  selectedRole?: AgentRole | null;
  onSaveRequiresApproval: (checked: boolean) => Promise<boolean>;
}

export function RoleSettingsSection({ isTechnicalStaff, requiresApproval, isSaving, isLoading, userId, selectedRole, onSaveRequiresApproval }: RoleSettingsSectionProps) {
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
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">
              {language === 'ru' ? 'Модель по умолчанию' : 'Default Model'}
            </label>
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
