import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';

export interface SupervisorNotification {
  id: string;
  chronicle_id: string | null;
  entry_code: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useSupNotifications() {
  const { user } = useAuth();
  const { isSupervisor } = useUserRoles();
  const [notifications, setNotifications] = useState<SupervisorNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!user || !isSupervisor) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supervisor_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setNotifications((data || []) as SupervisorNotification[]);
    } catch (e) {
      console.error('[useSupNotifications]', e);
    } finally {
      setLoading(false);
    }
  }, [user, isSupervisor]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !isSupervisor) return;
    const channel = supabase
      .channel('sup-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'supervisor_notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as SupervisorNotification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'supervisor_notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as SupervisorNotification;
          setNotifications(prev =>
            prev.map(n => {
              if (n.id !== updated.id) return n;
              // Never roll back is_read: true to false via realtime (prevents race conditions)
              return { ...n, ...updated, is_read: n.is_read || updated.is_read };
            })
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'supervisor_notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => prev.filter(n => n.id !== (payload.old as { id: string }).id));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isSupervisor]);

  const markRead = useCallback(async (id: string) => {
    await supabase.from('supervisor_notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('supervisor_notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    await supabase.from('supervisor_notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, loading, unreadCount, markRead, markAllRead, deleteNotification, refetch: fetch };
}
