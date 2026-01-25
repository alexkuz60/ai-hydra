import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'user' | 'moderator' | 'admin' | 'supervisor';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export function useUserRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setIsSupervisor(false);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    fetchRoles();
  }, [user]);

  const fetchRoles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      const userRoles = (data || []).map((r: { role: AppRole }) => r.role);
      setRoles(userRoles);
      setIsSupervisor(userRoles.includes('supervisor'));
      setIsAdmin(userRoles.includes('admin') || userRoles.includes('supervisor'));
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  return {
    roles,
    loading,
    isSupervisor,
    isAdmin,
    hasRole,
    refetch: fetchRoles,
  };
}
