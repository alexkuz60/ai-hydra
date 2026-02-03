import React from 'react';
import { SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ROLE_CONFIG, AGENT_ROLES, type AgentRole } from '@/config/roles';
import { useLanguage } from '@/contexts/LanguageContext';
import type { LucideIcon } from 'lucide-react';

interface RoleSelectItemProps {
  value: AgentRole;
  className?: string;
}

// Custom SelectItem with role icon
export function RoleSelectItem({ value, className }: RoleSelectItemProps) {
  const { t } = useLanguage();
  const config = ROLE_CONFIG[value];
  const Icon = config.icon;

  return (
    <SelectItem value={value} className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", config.color)} />
        <span>{t(config.label)}</span>
      </div>
    </SelectItem>
  );
}

// Helper component to render all role options
interface RoleSelectOptionsProps {
  excludeRoles?: AgentRole[];
  excludeTechnicalStaff?: boolean;
}

export function RoleSelectOptions({ excludeRoles = [], excludeTechnicalStaff = false }: RoleSelectOptionsProps) {
  return (
    <>
      {AGENT_ROLES
        .filter(role => !excludeRoles.includes(role))
        .filter(role => !excludeTechnicalStaff || !ROLE_CONFIG[role].isTechnicalStaff)
        .map((role) => (
          <RoleSelectItem key={role} value={role} />
        ))}
    </>
  );
}

// Render role with icon inline (for SelectValue display)
interface RoleDisplayProps {
  role: AgentRole;
  className?: string;
}

export function RoleDisplay({ role, className }: RoleDisplayProps) {
  const { t } = useLanguage();
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon className={cn("h-4 w-4", config.color)} />
      <span>{t(config.label)}</span>
    </div>
  );
}
