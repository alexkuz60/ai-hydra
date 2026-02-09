import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ClipboardCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface RoleSettingsSectionProps {
  isTechnicalStaff: boolean;
  requiresApproval: boolean;
  isSaving: boolean;
  isLoading: boolean;
  userId?: string;
  onSaveRequiresApproval: (checked: boolean) => Promise<boolean>;
}

export function RoleSettingsSection({ isTechnicalStaff, requiresApproval, isSaving, isLoading, userId, onSaveRequiresApproval }: RoleSettingsSectionProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="flex items-center gap-3 pt-2">
        <Checkbox id="technicalStaff" checked={isTechnicalStaff} disabled />
        <label htmlFor="technicalStaff" className="text-sm text-muted-foreground cursor-default">
          {t('staffRoles.technicalStaff')}
        </label>
      </div>

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
