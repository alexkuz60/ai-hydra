import React, { forwardRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wrench } from 'lucide-react';
import { 
  ROLE_CONFIG, 
  DEFAULT_SYSTEM_PROMPTS, 
  type AgentRole 
} from '@/config/roles';
import { cn } from '@/lib/utils';

interface RoleDetailsPanelProps {
  selectedRole: AgentRole | null;
}

const RoleDetailsPanel = forwardRef<HTMLDivElement, RoleDetailsPanelProps>(
  ({ selectedRole }, ref) => {
    const { t } = useLanguage();

    if (!selectedRole) {
      return (
        <div ref={ref} className="h-full flex items-center justify-center p-6">
          <p className="text-muted-foreground text-center">
            {t('staffRoles.selectRole')}
          </p>
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
            {/* Header with icon and name */}
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center",
                `bg-${config.color.replace('text-', '')}/10`
              )}>
                <IconComponent className={cn("h-7 w-7", config.color)} />
              </div>
              <div className="flex-1">
                <h2 className={cn("text-xl font-semibold", config.color)}>
                  {t(config.label)}
                </h2>
                <code className="text-xs text-muted-foreground font-mono">
                  {selectedRole}
                </code>
              </div>
              {config.isTechnicalStaff && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="gap-1.5">
                        <Wrench className="h-3 w-3" />
                        {t('staffRoles.technicalStaff')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{t('staffRoles.technicalStaffHint')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('staffRoles.roleDescription')}
              </h3>
              <p className="text-sm leading-relaxed">
                {t(config.description)}
              </p>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t('staffRoles.systemPrompt')}
              </h3>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {systemPrompt}
                </pre>
              </div>
            </div>

            {/* Technical Staff Checkbox */}
            <div className="flex items-center gap-3 pt-2">
              <Checkbox 
                id="technicalStaff" 
                checked={config.isTechnicalStaff}
                disabled
              />
              <label 
                htmlFor="technicalStaff" 
                className="text-sm text-muted-foreground cursor-default"
              >
                {t('staffRoles.technicalStaff')}
              </label>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }
);

RoleDetailsPanel.displayName = 'RoleDetailsPanel';

export default RoleDetailsPanel;
