import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface StrategicPlan {
  id: string;
  user_id: string;
  title: string;
  title_en: string | null;
  goal: string | null;
  goal_en: string | null;
  status: string;
  progress: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface UseStrategicPlansReturn {
  plans: StrategicPlan[];
  loading: boolean;
  createPlan: (title: string, goal?: string) => Promise<StrategicPlan | null>;
  updatePlan: (id: string, updates: Partial<Pick<StrategicPlan, 'title' | 'goal' | 'status' | 'progress'>>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useStrategicPlans(userId: string | undefined): UseStrategicPlansReturn {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('strategic_plans')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPlans((data || []) as StrategicPlan[]);
    } catch (err: any) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchPlans();
  }, [userId, fetchPlans]);

  const createPlan = useCallback(async (title: string, goal?: string): Promise<StrategicPlan | null> => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('strategic_plans')
        .insert([{ user_id: userId, title, goal: goal || null }])
        .select()
        .single();

      if (error) throw error;
      const plan = data as StrategicPlan;
      setPlans(prev => [plan, ...prev]);
      toast.success(t('plans.created'));
      return plan;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  }, [userId, t]);

  const updatePlan = useCallback(async (id: string, updates: Partial<Pick<StrategicPlan, 'title' | 'goal' | 'status' | 'progress'>>) => {
    try {
      const { error } = await supabase
        .from('strategic_plans')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
      toast.success(t('plans.saved'));
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [t]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('strategic_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success(t('plans.deleted'));
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [t]);

  return { plans, loading, createPlan, updatePlan, deletePlan, refetch: fetchPlans };
}
