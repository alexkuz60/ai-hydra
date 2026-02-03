import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { TaskBlueprint, RoleBehavior, BlueprintStage, BlueprintCheckpoint, CommunicationStyle, RoleReaction, RoleInteractions } from '@/types/patterns';
import type { AgentRole } from '@/config/roles';
import { TASK_BLUEPRINTS, ROLE_BEHAVIORS } from '@/config/patterns';

interface DbTaskBlueprint {
  id: string;
  user_id: string | null;
  name: string;
  category: 'planning' | 'creative' | 'analysis' | 'technical';
  description: string;
  stages: unknown;
  checkpoints: unknown;
  is_system: boolean;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface DbRoleBehavior {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  communication: unknown;
  reactions: unknown;
  interactions: unknown;
  is_system: boolean;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Transform DB row to TaskBlueprint
function dbToTaskBlueprint(row: DbTaskBlueprint): TaskBlueprint {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    stages: row.stages as BlueprintStage[],
    checkpoints: row.checkpoints as BlueprintCheckpoint[],
  };
}

// Transform DB row to RoleBehavior
function dbToRoleBehavior(row: DbRoleBehavior): RoleBehavior {
  return {
    id: row.id,
    role: row.role as AgentRole,
    communication: row.communication as CommunicationStyle,
    reactions: row.reactions as RoleReaction[],
    interactions: row.interactions as RoleInteractions,
  };
}

export interface PatternMeta {
  isSystem: boolean;
  isShared: boolean;
  isOwned: boolean;
  usageCount: number;
}

export type TaskBlueprintWithMeta = TaskBlueprint & { meta: PatternMeta };
export type RoleBehaviorWithMeta = RoleBehavior & { meta: PatternMeta };

export function usePatterns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [blueprints, setBlueprints] = useState<TaskBlueprintWithMeta[]>([]);
  const [behaviors, setBehaviors] = useState<RoleBehaviorWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch patterns from DB with fallback to static
  const fetchPatterns = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch blueprints
      const { data: dbBlueprints, error: blueprintsError } = await supabase
        .from('task_blueprints')
        .select('*')
        .order('is_system', { ascending: false })
        .order('updated_at', { ascending: false });

      if (blueprintsError) throw blueprintsError;

      // Fetch behaviors
      const { data: dbBehaviors, error: behaviorsError } = await supabase
        .from('role_behaviors')
        .select('*')
        .order('is_system', { ascending: false })
        .order('updated_at', { ascending: false });

      if (behaviorsError) throw behaviorsError;

      // If DB is empty, use static patterns
      if (!dbBlueprints?.length) {
        setBlueprints(TASK_BLUEPRINTS.map(bp => ({
          ...bp,
          meta: { isSystem: true, isShared: true, isOwned: false, usageCount: 0 }
        })));
      } else {
        setBlueprints(dbBlueprints.map((row: DbTaskBlueprint) => ({
          ...dbToTaskBlueprint(row),
          meta: {
            isSystem: row.is_system,
            isShared: row.is_shared,
            isOwned: row.user_id === user?.id,
            usageCount: row.usage_count,
          }
        })));
      }

      if (!dbBehaviors?.length) {
        setBehaviors(ROLE_BEHAVIORS.map(b => ({
          ...b,
          meta: { isSystem: true, isShared: true, isOwned: false, usageCount: 0 }
        })));
      } else {
        setBehaviors(dbBehaviors.map((row: DbRoleBehavior) => ({
          ...dbToRoleBehavior(row),
          meta: {
            isSystem: row.is_system,
            isShared: row.is_shared,
            isOwned: row.user_id === user?.id,
            usageCount: row.usage_count,
          }
        })));
      }
    } catch (error) {
      console.error('Failed to fetch patterns:', error);
      // Fallback to static patterns
      setBlueprints(TASK_BLUEPRINTS.map(bp => ({
        ...bp,
        meta: { isSystem: true, isShared: true, isOwned: false, usageCount: 0 }
      })));
      setBehaviors(ROLE_BEHAVIORS.map(b => ({
        ...b,
        meta: { isSystem: true, isShared: true, isOwned: false, usageCount: 0 }
      })));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  // Save blueprint
  const saveBlueprint = async (blueprint: Omit<TaskBlueprint, 'id'> & { id?: string }, isShared = false): Promise<TaskBlueprint> => {
    if (!user) throw new Error('User not authenticated');
    setIsSaving(true);

    try {
      const data = {
        user_id: user.id,
        name: blueprint.name,
        category: blueprint.category,
        description: blueprint.description,
        stages: JSON.parse(JSON.stringify(blueprint.stages)),
        checkpoints: JSON.parse(JSON.stringify(blueprint.checkpoints)),
        is_shared: isShared,
        is_system: false,
      };

      if (blueprint.id) {
        // Update existing
        const { data: updated, error } = await supabase
          .from('task_blueprints')
          .update(data)
          .eq('id', blueprint.id)
          .select()
          .single();

        if (error) throw error;
        await fetchPatterns();
        toast({ description: 'Паттерн обновлён' });
        return dbToTaskBlueprint(updated);
      } else {
        // Create new
        const { data: created, error } = await supabase
          .from('task_blueprints')
          .insert(data)
          .select()
          .single();

        if (error) throw error;
        await fetchPatterns();
        toast({ description: 'Паттерн создан' });
        return dbToTaskBlueprint(created);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Save behavior
  const saveBehavior = async (behavior: Omit<RoleBehavior, 'id'> & { id?: string }, isShared = false): Promise<RoleBehavior> => {
    if (!user) throw new Error('User not authenticated');
    setIsSaving(true);

    try {
      const data = {
        user_id: user.id,
        name: `Behavior: ${behavior.role}`,
        role: behavior.role,
        communication: JSON.parse(JSON.stringify(behavior.communication)),
        reactions: JSON.parse(JSON.stringify(behavior.reactions)),
        interactions: JSON.parse(JSON.stringify(behavior.interactions)),
        is_shared: isShared,
        is_system: false,
      };

      if (behavior.id) {
        const { data: updated, error } = await supabase
          .from('role_behaviors')
          .update(data)
          .eq('id', behavior.id)
          .select()
          .single();

        if (error) throw error;
        await fetchPatterns();
        toast({ description: 'Поведение обновлено' });
        return dbToRoleBehavior(updated);
      } else {
        const { data: created, error } = await supabase
          .from('role_behaviors')
          .insert(data)
          .select()
          .single();

        if (error) throw error;
        await fetchPatterns();
        toast({ description: 'Поведение создано' });
        return dbToRoleBehavior(created);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete blueprint
  const deleteBlueprint = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('task_blueprints')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPatterns();
      toast({ description: 'Паттерн удалён' });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete behavior
  const deleteBehavior = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('role_behaviors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPatterns();
      toast({ description: 'Поведение удалено' });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    blueprints,
    behaviors,
    isLoading,
    isSaving,
    saveBlueprint,
    saveBehavior,
    deleteBlueprint,
    deleteBehavior,
    refetch: fetchPatterns,
  };
}
