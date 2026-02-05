import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ChevronUp, 
  ChevronDown, 
  Equal, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  Users,
  Crown,
} from 'lucide-react';
import { 
  ROLE_CONFIG, 
  AGENT_ROLES, 
  type AgentRole 
} from '@/config/roles';
import { cn } from '@/lib/utils';
import type { RoleInteractions } from '@/types/patterns';

interface RoleHierarchyEditorProps {
  selectedRole: AgentRole;
  interactions: RoleInteractions;
  onInteractionsChange: (interactions: RoleInteractions) => void;
  isEditing: boolean;
}

type InteractionType = 'defers_to' | 'challenges' | 'collaborates';

const RoleHierarchyEditor: React.FC<RoleHierarchyEditorProps> = ({
  selectedRole,
  interactions,
  onInteractionsChange,
  isEditing,
}) => {
  const { t } = useLanguage();

  // Get other roles (exclude self)
  const otherRoles = AGENT_ROLES.filter(role => role !== selectedRole);

  // Calculate role relationship
  const getRoleRelation = (role: AgentRole): 'superior' | 'equal' | 'subordinate' | 'none' => {
    if (interactions.defers_to?.includes(role)) return 'superior';
    if (interactions.challenges?.includes(role)) return 'subordinate';
    if (interactions.collaborates?.includes(role)) return 'equal';
    return 'none';
  };

  // Group roles by relation
  const groupedRoles = {
    superior: otherRoles.filter(r => getRoleRelation(r) === 'superior'),
    equal: otherRoles.filter(r => getRoleRelation(r) === 'equal'),
    subordinate: otherRoles.filter(r => getRoleRelation(r) === 'subordinate'),
    none: otherRoles.filter(r => getRoleRelation(r) === 'none'),
  };

  const toggleRoleInList = (role: AgentRole, type: InteractionType) => {
    const currentList = interactions[type] || [];
    const isInList = currentList.includes(role);
    
    // Remove from all lists first
    const newDefers = (interactions.defers_to || []).filter(r => r !== role);
    const newChallenges = (interactions.challenges || []).filter(r => r !== role);
    const newCollaborates = (interactions.collaborates || []).filter(r => r !== role);
    
    // Add to new list if not toggling off
    if (!isInList || type !== getTypeForRole(role)) {
      if (type === 'defers_to') newDefers.push(role);
      if (type === 'challenges') newChallenges.push(role);
      if (type === 'collaborates') newCollaborates.push(role);
    }
    
    onInteractionsChange({
      defers_to: newDefers,
      challenges: newChallenges,
      collaborates: newCollaborates,
    });
  };

  const getTypeForRole = (role: AgentRole): InteractionType | null => {
    if (interactions.defers_to?.includes(role)) return 'defers_to';
    if (interactions.challenges?.includes(role)) return 'challenges';
    if (interactions.collaborates?.includes(role)) return 'collaborates';
    return null;
  };

  const renderRoleItem = (role: AgentRole, showControls = true) => {
    const config = ROLE_CONFIG[role];
    const IconComponent = config.icon;
    const relation = getRoleRelation(role);
    
    return (
      <div 
        key={role}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg transition-colors",
          isEditing ? "hover:bg-muted/50" : ""
        )}
      >
        <div className={cn(
          "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
          `bg-${config.color.replace('text-', '')}/10`
        )}>
          <IconComponent className={cn("h-4 w-4", config.color)} />
        </div>
        <span className={cn("text-sm flex-1 truncate", config.color)}>
          {t(config.label)}
        </span>
        
        {isEditing && showControls && (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={relation === 'superior' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleRoleInList(role, 'defers_to')}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('staffRoles.hierarchy.superior')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={relation === 'equal' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleRoleInList(role, 'collaborates')}
                  >
                    <Equal className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('staffRoles.hierarchy.equal')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={relation === 'subordinate' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleRoleInList(role, 'challenges')}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('staffRoles.hierarchy.subordinate')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        {!isEditing && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs shrink-0",
              relation === 'superior' && "border-yellow-500/50 text-yellow-600",
              relation === 'equal' && "border-blue-500/50 text-blue-600",
              relation === 'subordinate' && "border-green-500/50 text-green-600",
              relation === 'none' && "border-muted-foreground/30 text-muted-foreground"
            )}
          >
            {relation === 'superior' && <ArrowUp className="h-3 w-3 mr-1" />}
            {relation === 'equal' && <Equal className="h-3 w-3 mr-1" />}
            {relation === 'subordinate' && <ArrowDown className="h-3 w-3 mr-1" />}
            {relation === 'none' && <Minus className="h-3 w-3 mr-1" />}
            {t(`staffRoles.hierarchy.${relation}`)}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Visual hierarchy diagram */}
      <div className="border border-border rounded-lg bg-muted/20 p-4 space-y-3">
        {/* Superiors */}
        {groupedRoles.superior.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-yellow-600 font-medium">
              <Crown className="h-3 w-3" />
              {t('staffRoles.hierarchy.superiorsTitle')}
            </div>
            <div className="flex flex-wrap gap-1.5 pl-5">
              {groupedRoles.superior.map(role => {
                const config = ROLE_CONFIG[role];
                const IconComponent = config.icon;
                return (
                  <TooltipProvider key={role}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "gap-1 border-yellow-500/30 bg-yellow-500/10",
                            config.color
                          )}
                        >
                          <IconComponent className="h-3 w-3" />
                          {t(config.label)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>{t('staffRoles.hierarchy.defersTo')}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        )}

        {/* Equals */}
        {groupedRoles.equal.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
              <Users className="h-3 w-3" />
              {t('staffRoles.hierarchy.equalsTitle')}
            </div>
            <div className="flex flex-wrap gap-1.5 pl-5">
              {groupedRoles.equal.map(role => {
                const config = ROLE_CONFIG[role];
                const IconComponent = config.icon;
                return (
                  <TooltipProvider key={role}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "gap-1 border-blue-500/30 bg-blue-500/10",
                            config.color
                          )}
                        >
                          <IconComponent className="h-3 w-3" />
                          {t(config.label)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>{t('staffRoles.hierarchy.collaborates')}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        )}

        {/* Subordinates */}
        {groupedRoles.subordinate.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
              <ChevronDown className="h-3 w-3" />
              {t('staffRoles.hierarchy.subordinatesTitle')}
            </div>
            <div className="flex flex-wrap gap-1.5 pl-5">
              {groupedRoles.subordinate.map(role => {
                const config = ROLE_CONFIG[role];
                const IconComponent = config.icon;
                return (
                  <TooltipProvider key={role}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "gap-1 border-green-500/30 bg-green-500/10",
                            config.color
                          )}
                        >
                          <IconComponent className="h-3 w-3" />
                          {t(config.label)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>{t('staffRoles.hierarchy.challenges')}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        )}

        {/* No relations */}
        {groupedRoles.superior.length === 0 && 
         groupedRoles.equal.length === 0 && 
         groupedRoles.subordinate.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-2">
            {t('staffRoles.hierarchy.noRelations')}
          </p>
        )}
      </div>

      {/* Edit list */}
      {isEditing && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {t('staffRoles.hierarchy.editRelations')}
          </h4>
          <ScrollArea className="h-[200px] border border-border rounded-lg">
            <div className="p-2 space-y-1">
              {otherRoles.map(role => renderRoleItem(role))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default RoleHierarchyEditor;
