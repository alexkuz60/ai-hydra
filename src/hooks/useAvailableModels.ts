import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'lovable' | 'openai' | 'gemini' | 'anthropic';
  requiresApiKey: boolean;
}

// Lovable AI models (only for admin AlexKuz)
export const LOVABLE_AI_MODELS: ModelOption[] = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', provider: 'lovable', requiresApiKey: false },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'lovable', requiresApiKey: false },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'lovable', requiresApiKey: false },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'lovable', requiresApiKey: false },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'lovable', requiresApiKey: false },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'lovable', requiresApiKey: false },
  { id: 'openai/gpt-5.2', name: 'GPT-5.2', provider: 'lovable', requiresApiKey: false },
];

// Models requiring personal API keys
export const PERSONAL_KEY_MODELS: ModelOption[] = [
  { id: 'gpt-4o', name: 'GPT-4o (OpenAI)', provider: 'openai', requiresApiKey: true },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Google)', provider: 'gemini', requiresApiKey: true },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Anthropic)', provider: 'anthropic', requiresApiKey: true },
];

interface UserApiKeys {
  openai: boolean;
  gemini: boolean;
  anthropic: boolean;
}

export function useAvailableModels() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userApiKeys, setUserApiKeys] = useState<UserApiKeys>({
    openai: false,
    gemini: false,
    anthropic: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Check if user is admin (AlexKuz) from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setIsAdmin(profile.username === 'AlexKuz');
        }

        // Fetch API key status using Vault-backed function
        const { data: keyStatus } = await supabase
          .rpc('get_my_api_key_status');

        if (keyStatus && keyStatus.length > 0) {
          setUserApiKeys({
            openai: keyStatus[0].has_openai || false,
            gemini: keyStatus[0].has_gemini || false,
            anthropic: keyStatus[0].has_anthropic || false,
          });
        }
      } catch (error) {
        console.error('Error fetching models data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Get available personal key models based on configured keys
  const availablePersonalModels = PERSONAL_KEY_MODELS.filter(model => {
    if (model.provider === 'openai') return userApiKeys.openai;
    if (model.provider === 'gemini') return userApiKeys.gemini;
    if (model.provider === 'anthropic') return userApiKeys.anthropic;
    return false;
  });

  // For admin: Lovable AI models + personal key models
  // For regular users: only personal key models
  const lovableModels = isAdmin ? LOVABLE_AI_MODELS : [];
  
  return {
    isAdmin,
    lovableModels,
    personalModels: availablePersonalModels,
    hasAnyModels: lovableModels.length > 0 || availablePersonalModels.length > 0,
    loading,
  };
}
