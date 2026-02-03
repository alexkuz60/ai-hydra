import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { AgentRole } from '@/config/roles';
import type { RoleInteractions, CommunicationStyle, RoleReaction } from '@/types/patterns';
import { ROLE_CONFIG, AGENT_ROLES } from '@/config/roles';
import type { Json } from '@/integrations/supabase/types';

export interface RoleBehaviorData {
  id: string;
  role: string;
  name: string;
  communication: CommunicationStyle;
  reactions: RoleReaction[];
  interactions: RoleInteractions;
  is_system: boolean;
  is_shared: boolean;
  user_id: string | null;
}

interface UseRoleBehaviorResult {
  behavior: RoleBehaviorData | null;
  isLoading: boolean;
  isSaving: boolean;
  saveInteractions: (interactions: RoleInteractions) => Promise<boolean>;
  refetch: () => Promise<void>;
  fetchAllBehaviors: () => Promise<Map<AgentRole, RoleInteractions>>;
}

const DEFAULT_INTERACTIONS: RoleInteractions = {
  defers_to: [],
  challenges: [],
  collaborates: [],
};

const DEFAULT_COMMUNICATION: CommunicationStyle = {
  tone: 'neutral',
  verbosity: 'adaptive',
  format_preference: ['markdown'],
};

export function useRoleBehavior(role: AgentRole | null): UseRoleBehaviorResult {
  const { user } = useAuth();
  const [behavior, setBehavior] = useState<RoleBehaviorData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchBehavior = useCallback(async () => {
    if (!role) {
      setBehavior(null);
      return;
    }

    setIsLoading(true);
    try {
      // Query all accessible behaviors for this role
      // Priority: user's own behavior > shared > system
      let query = supabase
        .from('role_behaviors')
        .select('*')
        .eq('role', role);

      const { data, error } = await query.order('is_system', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Sort to prioritize user's own behavior
        const sorted = data.sort((a, b) => {
          // User's own behavior first
          if (user && a.user_id === user.id) return -1;
          if (user && b.user_id === user.id) return 1;
          // Then non-system (shared behaviors)
          if (!a.is_system && b.is_system) return -1;
          if (a.is_system && !b.is_system) return 1;
          return 0;
        });

        const selected = sorted[0];
        setBehavior({
          id: selected.id,
          role: selected.role,
          name: selected.name,
          communication: selected.communication as unknown as CommunicationStyle,
          reactions: selected.reactions as unknown as RoleReaction[],
          interactions: (selected.interactions as unknown as RoleInteractions) || DEFAULT_INTERACTIONS,
          is_system: selected.is_system,
          is_shared: selected.is_shared,
          user_id: selected.user_id,
        });
      } else {
        setBehavior(null);
      }
    } catch (error: any) {
      console.error('Failed to load role behavior:', error);
      setBehavior(null);
    } finally {
      setIsLoading(false);
    }
  }, [role, user]);

  useEffect(() => {
    fetchBehavior();
  }, [fetchBehavior]);

  const saveInteractions = useCallback(async (interactions: RoleInteractions): Promise<boolean> => {
    if (!role || !user) {
      toast.error('Необходима авторизация');
      return false;
    }

    setIsSaving(true);
    try {
      // Check if user already has a custom behavior for this role
      const { data: existing, error: checkError } = await supabase
        .from('role_behaviors')
        .select('id, communication, reactions')
        .eq('role', role)
        .eq('user_id', user.id)
        .eq('is_system', false)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        // Update existing user behavior
        const { error: updateError } = await supabase
          .from('role_behaviors')
          .update({
            interactions: interactions as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Create new user behavior based on system defaults
        const roleConfig = ROLE_CONFIG[role];
        const roleName = roleConfig ? role : role;

        // Get system behavior to copy communication and reactions
        const { data: systemBehavior } = await supabase
          .from('role_behaviors')
          .select('communication, reactions')
          .eq('role', role)
          .eq('is_system', true)
          .maybeSingle();

        const insertData: {
          role: string;
          name: string;
          user_id: string;
          is_system: boolean;
          is_shared: boolean;
          communication: Json;
          reactions: Json;
          interactions: Json;
        } = {
          role: role,
          name: `${roleName} (custom)`,
          user_id: user.id,
          is_system: false,
          is_shared: false,
          communication: (systemBehavior?.communication || DEFAULT_COMMUNICATION) as Json,
          reactions: (systemBehavior?.reactions || []) as Json,
          interactions: interactions as unknown as Json,
        };
        
        const { error: insertError } = await supabase
          .from('role_behaviors')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      // Refetch to get updated data
      await fetchBehavior();
      return true;
    } catch (error: any) {
      console.error('Failed to save interactions:', error);
      toast.error(error.message || 'Ошибка сохранения');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [role, user, fetchBehavior]);

  /**
   * Fetch all role behaviors to build a complete interactions map
   * Used for conflict detection during hierarchy editing
   */
  const fetchAllBehaviors = useCallback(async (): Promise<Map<AgentRole, RoleInteractions>> => {
    const behaviorsMap = new Map<AgentRole, RoleInteractions>();

    try {
      const { data, error } = await supabase
        .from('role_behaviors')
        .select('role, interactions, user_id, is_system')
        .order('is_system', { ascending: true });

      if (error) throw error;

      if (data) {
        // Group by role, prioritizing user's own behavior > shared > system
        const roleGroups = new Map<string, typeof data>();
        
        for (const behavior of data) {
          const existing = roleGroups.get(behavior.role) || [];
          existing.push(behavior);
          roleGroups.set(behavior.role, existing);
        }

        // For each role, pick the best behavior
        for (const [roleKey, behaviors] of roleGroups) {
          const sorted = behaviors.sort((a, b) => {
            // User's own behavior first
            if (user && a.user_id === user.id) return -1;
            if (user && b.user_id === user.id) return 1;
            // Then non-system (shared behaviors)
            if (!a.is_system && b.is_system) return -1;
            if (a.is_system && !b.is_system) return 1;
            return 0;
          });

          const selected = sorted[0];
          if (selected && AGENT_ROLES.includes(roleKey as AgentRole)) {
            behaviorsMap.set(
              roleKey as AgentRole,
              (selected.interactions as unknown as RoleInteractions) || {
                defers_to: [],
                challenges: [],
                collaborates: [],
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch all behaviors:', error);
    }

    return behaviorsMap;
  }, [user]);

  return {
    behavior,
    isLoading,
    isSaving,
    saveInteractions,
    refetch: fetchBehavior,
    fetchAllBehaviors,
  };
}
