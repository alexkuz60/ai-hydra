import React, { forwardRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Wrench } from 'lucide-react';
import RoleKnowledgeTab from './RoleKnowledgeTab';
import { ROLE_CONFIG, DEFAULT_SYSTEM_PROMPTS, type AgentRole } from '@/config/roles';
import { cn } from '@/lib/utils';
import { useRoleBehavior } from '@/hooks/useRoleBehavior';
import { useRolePromptEditor } from '@/hooks/useRolePromptEditor';
import { RolePromptSection } from './RolePromptSection';
import { RoleHierarchySection } from './RoleHierarchySection';
import { RoleSettingsSection } from './RoleSettingsSection';

interface RoleDetailsPanelProps {
  selectedRole: AgentRole | null;
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
}

const RoleDetailsPanel = forwardRef<HTMLDivElement, RoleDetailsPanelProps>(
  ({ selectedRole, onHasUnsavedChanges }, ref) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { behavior, isLoading: isLoadingBehavior, isSaving, saveRequiresApproval } = useRoleBehavior(selectedRole);
    const promptEditor = useRolePromptEditor(selectedRole, user?.id);

    if (!selectedRole) {
      return (
        <div ref={ref} className="h-full flex items-center justify-center p-6">
          <p className="text-muted-foreground text-center">{t('staffRoles.selectRole')}</p>
        </div>
      );
    }

    const config = ROLE_CONFIG[selectedRole];
    const IconComponent = config.icon;
    const systemPrompt = DEFAULT_SYSTEM_PROMPTS[selectedRole];

    return (
      <div ref={ref} className="h-full flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", `bg-${config.color.replace('text-', '')}/10`)}>
                <IconComponent className={cn("h-7 w-7", config.color)} />
              </div>
              <div className="flex-1">
                <h2 className={cn("text-xl font-semibold", config.color)}>{t(config.label)}</h2>
                <code className="text-xs text-muted-foreground font-mono">{selectedRole}</code>
              </div>
              {config.isTechnicalStaff && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="gap-1.5"><Wrench className="h-3 w-3" />{t('staffRoles.technicalStaff')}</Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs"><p>{t('staffRoles.technicalStaffHint')}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t('staffRoles.roleDescription')}</h3>
              <p className="text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">{t(config.description)}</p>
            </div>

            <Separator />

            {/* Prompt Section */}
            <div data-guide="role-prompt-section">
            <RolePromptSection
              selectedRole={selectedRole}
              systemPrompt={systemPrompt}
              userId={user?.id}
              {...promptEditor}
            />
            </div>

            <Separator />

            {/* Hierarchy Section */}
            <div data-guide="role-hierarchy-section">
            <RoleHierarchySection
              selectedRole={selectedRole}
              userId={user?.id}
              onHasUnsavedChanges={onHasUnsavedChanges}
            />
            </div>

            {/* Knowledge - technical staff only */}
            {config.isTechnicalStaff && (
              <>
                <Separator />
                <div data-guide="role-knowledge-section">
                <RoleKnowledgeTab role={selectedRole} />
                </div>
              </>
            )}

            <Separator />

            {/* Settings */}
            <div data-guide="role-settings-section">
            <RoleSettingsSection
              selectedRole={selectedRole}
              isTechnicalStaff={config.isTechnicalStaff}
              requiresApproval={behavior?.requires_approval ?? false}
              isSaving={isSaving}
              isLoading={isLoadingBehavior}
              userId={user?.id}
              onSaveRequiresApproval={saveRequiresApproval}
            />
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }
);

RoleDetailsPanel.displayName = 'RoleDetailsPanel';

export default RoleDetailsPanel;
