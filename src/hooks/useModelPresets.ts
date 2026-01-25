import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ModelSettingsData, AgentRole } from '@/components/warroom/ModelSettings';

export interface ModelPreset {
  id: string;
  user_id: string;
  name: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export function useModelPresets() {
  const { user } = useAuth();
  const [presets, setPresets] = useState<ModelPreset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPresets = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('model_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPresets(data || []);
    } catch (error: any) {
      console.error('Failed to fetch presets:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const savePreset = async (name: string, settings: ModelSettingsData): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('model_presets')
        .insert({
          user_id: user.id,
          name,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          system_prompt: settings.systemPrompt,
          role: settings.role,
        });

      if (error) throw error;
      
      await fetchPresets();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
  };

  const updatePreset = async (id: string, name: string, settings: ModelSettingsData): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('model_presets')
        .update({
          name,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          system_prompt: settings.systemPrompt,
          role: settings.role,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchPresets();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
  };

  const deletePreset = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('model_presets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setPresets(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
  };

  const presetToSettings = (preset: ModelPreset): ModelSettingsData => ({
    temperature: Number(preset.temperature),
    maxTokens: preset.max_tokens,
    systemPrompt: preset.system_prompt || '',
    role: preset.role as AgentRole,
  });

  return {
    presets,
    loading,
    savePreset,
    updatePreset,
    deletePreset,
    presetToSettings,
    refetch: fetchPresets,
  };
}
