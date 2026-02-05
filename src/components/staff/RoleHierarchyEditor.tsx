import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ArrowUp, 
  ArrowLeftRight,
  Swords,
  Plus,
  X,
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
    
    // Add to new list only if not already in this list
    if (!isInList) {
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

  // Render role badge for view mode
  const renderRoleBadge = (role: AgentRole) => {
    const config = ROLE_CONFIG[role];
    const IconComponent = config.icon;
    return (
      <Badge 
        key={role}
        variant="outline" 
        className={cn("gap-1", config.color)}
      >
        <IconComponent className="h-3 w-3" />
        {t(config.label)}
      </Badge>
    );
  };

  // Render editable role item with checkbox
  const renderEditableRoleItem = (role: AgentRole, type: InteractionType) => {
    const config = ROLE_CONFIG[role];
    const IconComponent = config.icon;
    const isInList = interactions[type]?.includes(role) || false;
    
    return (
      <label
        key={role}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
          "hover:bg-muted/50",
          isInList && "bg-primary/5"
        )}
      >
        <Checkbox
          checked={isInList}
          onCheckedChange={() => toggleRoleInList(role, type)}
          className="h-4 w-4"
        />
        <div className={cn(
          "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
          `bg-${config.color.replace('text-', '')}/10`
        )}>
          <IconComponent className={cn("h-3.5 w-3.5", config.color)} />
        </div>
        <span className={cn("text-sm flex-1 truncate", config.color)}>
          {t(config.label)}
        </span>
        {isInList ? (
          <X className="h-3 w-3 text-muted-foreground" />
        ) : (
          <Plus className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
        )}
      </label>
    );
  };

  // View mode content for a tab
  const renderViewContent = (roles: AgentRole[]) => {
    if (roles.length === 0) {
      return <p className="text-xs text-muted-foreground italic py-2">{t('staffRoles.hierarchy.noRelations')}</p>;
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {roles.map(renderRoleBadge)}
      </div>
    );
  };

  // Edit mode content for a tab
  const renderEditContent = (type: InteractionType) => {
    return (
      <div className="space-y-0.5 max-h-[180px] overflow-y-auto">
        {otherRoles.map(role => renderEditableRoleItem(role, type))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tabbed hierarchy view */}
      <Tabs defaultValue="defers_to" className="w-full">
        <TabsList className="w-full h-8 p-0.5">
          <TabsTrigger value="defers_to" className="flex-1 h-7 text-xs gap-1 px-2">
            <ArrowUp className="h-3 w-3" />
            {t('staffRoles.hierarchy.defersTo')}
            {groupedRoles.superior.length > 0 && (
              <span className="text-muted-foreground">({groupedRoles.superior.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="collaborates" className="flex-1 h-7 text-xs gap-1 px-2">
            <ArrowLeftRight className="h-3 w-3" />
            {t('staffRoles.hierarchy.collaborates')}
            {groupedRoles.equal.length > 0 && (
              <span className="text-muted-foreground">({groupedRoles.equal.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex-1 h-7 text-xs gap-1 px-2">
            <Swords className="h-3 w-3" />
            {t('staffRoles.hierarchy.challenges')}
            {groupedRoles.subordinate.length > 0 && (
              <span className="text-muted-foreground">({groupedRoles.subordinate.length})</span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="defers_to" className="mt-2">
          {isEditing ? (
            renderEditContent('defers_to')
          ) : (
            renderViewContent(groupedRoles.superior)
          )}
        </TabsContent>
        
        <TabsContent value="collaborates" className="mt-2">
          {isEditing ? (
            renderEditContent('collaborates')
          ) : (
            renderViewContent(groupedRoles.equal)
          )}
        </TabsContent>
        
        <TabsContent value="challenges" className="mt-2">
          {isEditing ? (
            renderEditContent('challenges')
          ) : (
            renderViewContent(groupedRoles.subordinate)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoleHierarchyEditor;
