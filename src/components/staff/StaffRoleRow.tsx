import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Wrench, Cpu, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_CONFIG, type AgentRole } from '@/config/roles';
import { getTechRoleDefaultModel } from '@/hooks/useTechRoleDefaults';
import { getModelShortName } from '@/components/warroom/permodel/types';
import { KnowledgeChangedBadge } from './KnowledgeChangedBadge';

interface StaffRoleRowProps {
  role: AgentRole;
  isSelected: boolean;
  hasUnsavedChanges: boolean;
  assignment?: { model_id: string; assigned_at: string } | null;
  language: string;
  onSelect: (role: AgentRole) => void;
  onRecertify: (role: AgentRole) => void;
  t: (key: string) => string;
}

export function StaffRoleRow({
  role, isSelected, hasUnsavedChanges, assignment,
  language, onSelect, onRecertify, t,
}: StaffRoleRowProps) {
  const config = ROLE_CONFIG[role];
  const IconComponent = config.icon;
  const defaultModel = assignment?.model_id || getTechRoleDefaultModel(role);
  const isRu = language === 'ru';

  return (
    <TableRow
      key={role}
      className={cn(
        "cursor-pointer transition-colors",
        isSelected ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/30"
      )}
      onClick={() => onSelect(role)}
    >
      <TableCell className="pl-8">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", `bg-${config.color.replace('text-', '')}/10`)}>
          <IconComponent className={cn("h-6 w-6", config.color)} />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-base font-medium", config.color)}>{t(config.label)}</span>
            {isSelected && hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-hydra-warning animate-pulse-glow shrink-0" title="Unsaved changes" />
            )}
            {config.isTechnicalStaff && (
              <Badge variant="secondary" className="gap-1 text-xs py-0">
                <Wrench className="h-3 w-3" />
              </Badge>
            )}
            {defaultModel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="gap-1 text-[10px] py-0 font-mono text-muted-foreground cursor-default">
                    <Cpu className="h-3.5 w-3.5" />
                    {getModelShortName(defaultModel)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-mono">
                  {defaultModel}
                </TooltipContent>
              </Tooltip>
            )}
            {assignment && (
              <Badge variant="outline" className="gap-1 text-[10px] py-0 text-hydra-success border-hydra-success/30">
                <ShieldCheck className="h-2.5 w-2.5" />
                {new Date(assignment.assigned_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}
              </Badge>
            )}
            {assignment && <KnowledgeChangedBadge role={role} isRu={isRu} onRecertify={() => onRecertify(role)} />}
          </div>
          <span className="text-sm text-muted-foreground font-mono">{role}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}
