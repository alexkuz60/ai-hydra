import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'lovable' | 'openai' | 'gemini' | 'anthropic' | 'xai' | 'openrouter' | 'groq';
  requiresApiKey: boolean;
}

// Lovable AI models (only for admin AlexKuz)
export const LOVABLE_AI_MODELS: ModelOption[] = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', provider: 'lovable', requiresApiKey: false },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'lovable', requiresApiKey: false },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'lovable', requiresApiKey: false },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'lovable', requiresApiKey: false },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'lovable', requiresApiKey: false },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'lovable', requiresApiKey: false },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'lovable', requiresApiKey: false },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', provider: 'lovable', requiresApiKey: false },
  { id: 'openai/gpt-5.2', name: 'GPT-5.2', provider: 'lovable', requiresApiKey: false },
];

// Models requiring personal API keys - expanded list
export const PERSONAL_KEY_MODELS: ModelOption[] = [
  // OpenAI models
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', requiresApiKey: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', requiresApiKey: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', requiresApiKey: true },
  { id: 'o1', name: 'o1 (Reasoning)', provider: 'openai', requiresApiKey: true },
  { id: 'o1-mini', name: 'o1 Mini', provider: 'openai', requiresApiKey: true },
  { id: 'o3-mini', name: 'o3 Mini', provider: 'openai', requiresApiKey: true },
  
  // Anthropic Claude models
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', requiresApiKey: true },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'anthropic', requiresApiKey: true },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', requiresApiKey: true },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic', requiresApiKey: true },
  
  // Google Gemini models
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', requiresApiKey: true },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', requiresApiKey: true },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini', requiresApiKey: true },
  
  // xAI Grok models
  { id: 'grok-3', name: 'Grok 3', provider: 'xai', requiresApiKey: true },
  { id: 'grok-3-fast', name: 'Grok 3 Fast', provider: 'xai', requiresApiKey: true },
  { id: 'grok-3-mini', name: 'Grok 3 Mini', provider: 'xai', requiresApiKey: true },
  { id: 'grok-3-mini-fast', name: 'Grok 3 Mini Fast', provider: 'xai', requiresApiKey: true },
  
  // OpenRouter models (free tier) - verified January 2025
  { id: 'qwen/qwen3-0.6b-04-28:free', name: 'Qwen3 0.6B (Free)', provider: 'openrouter', requiresApiKey: true },
  { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (Free)', provider: 'openrouter', requiresApiKey: true },
  { id: 'tngtech/tng-r1t-chimera:free', name: 'R1T Chimera (Free)', provider: 'openrouter', requiresApiKey: true },
  
  // Groq models (ultra-fast inference)
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'groq', requiresApiKey: true },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'groq', requiresApiKey: true },
  { id: 'llama-3.2-90b-vision-preview', name: 'Llama 3.2 90B Vision', provider: 'groq', requiresApiKey: true },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq', requiresApiKey: true },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', provider: 'groq', requiresApiKey: true },
];

// All valid model IDs for filtering deprecated models (centralized)
export const ALL_VALID_MODEL_IDS = [...LOVABLE_AI_MODELS, ...PERSONAL_KEY_MODELS].map(m => m.id);

// Get model info utility - single source of truth for model lookups
export function getModelInfo(modelId: string): {
  isLovable: boolean;
  provider: ModelOption['provider'] | null;
  model: ModelOption | undefined;
} {
  const lovableModel = LOVABLE_AI_MODELS.find(m => m.id === modelId);
  if (lovableModel) {
    return { isLovable: true, provider: 'lovable', model: lovableModel };
  }
  
  const personalModel = PERSONAL_KEY_MODELS.find(m => m.id === modelId);
  return {
    isLovable: false,
    provider: personalModel?.provider || null,
    model: personalModel,
  };
}

// Get model display name utility
export function getModelDisplayName(modelId: string): string {
  const { model } = getModelInfo(modelId);
  return model?.name || modelId;
}

interface UserApiKeys {
  openai: boolean;
  gemini: boolean;
  anthropic: boolean;
  xai: boolean;
  openrouter: boolean;
  groq: boolean;
  tavily: boolean;
  perplexity: boolean;
}

export function useAvailableModels() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userApiKeys, setUserApiKeys] = useState<UserApiKeys>({
    openai: false,
    gemini: false,
    anthropic: false,
    xai: false,
    openrouter: false,
    groq: false,
    tavily: false,
    perplexity: false,
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
          const status = keyStatus[0] as { 
            has_openai?: boolean; 
            has_gemini?: boolean; 
            has_anthropic?: boolean; 
            has_xai?: boolean; 
            has_openrouter?: boolean;
            has_groq?: boolean;
            has_tavily?: boolean;
            has_perplexity?: boolean;
          };
          setUserApiKeys({
            openai: status.has_openai || false,
            gemini: status.has_gemini || false,
            anthropic: status.has_anthropic || false,
            xai: status.has_xai || false,
            openrouter: status.has_openrouter || false,
            groq: status.has_groq || false,
            tavily: status.has_tavily || false,
            perplexity: status.has_perplexity || false,
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
    if (model.provider === 'xai') return userApiKeys.xai;
    if (model.provider === 'openrouter') return userApiKeys.openrouter;
    if (model.provider === 'groq') return userApiKeys.groq;
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
