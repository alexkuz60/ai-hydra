import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'lovable' | 'openai' | 'gemini' | 'anthropic' | 'xai' | 'openrouter' | 'groq' | 'deepseek' | 'mistral' | 'proxyapi' | 'dotpoint';
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
  // ─── Direct Provider Keys (Priority 1) ───
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
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', requiresApiKey: true },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', requiresApiKey: true },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', requiresApiKey: true },
  
  // xAI Grok models
  { id: 'grok-3', name: 'Grok 3', provider: 'xai', requiresApiKey: true },
  { id: 'grok-3-fast', name: 'Grok 3 Fast', provider: 'xai', requiresApiKey: true },
  { id: 'grok-3-mini', name: 'Grok 3 Mini', provider: 'xai', requiresApiKey: true },
  { id: 'grok-3-mini-fast', name: 'Grok 3 Mini Fast', provider: 'xai', requiresApiKey: true },

  // DeepSeek models
  { id: 'deepseek-chat', name: 'DeepSeek-V3', provider: 'deepseek', requiresApiKey: true },
  { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Reasoning)', provider: 'deepseek', requiresApiKey: true },
  
  // Mistral AI models
  { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', requiresApiKey: true },
  { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'mistral', requiresApiKey: true },
  { id: 'codestral-latest', name: 'Codestral', provider: 'mistral', requiresApiKey: true },
  { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'mistral', requiresApiKey: true },

  // Groq models (ultra-fast inference)
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'groq', requiresApiKey: true },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'groq', requiresApiKey: true },
  { id: 'llama-3.2-90b-vision-preview', name: 'Llama 3.2 90B Vision', provider: 'groq', requiresApiKey: true },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq', requiresApiKey: true },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', provider: 'groq', requiresApiKey: true },

  // ─── OpenRouter (Priority 2) ───
  // Free tier
  { id: 'qwen/qwen3-0.6b-04-28:free', name: 'Qwen3 0.6B (Free)', provider: 'openrouter', requiresApiKey: true },
  { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (Free)', provider: 'openrouter', requiresApiKey: true },
  { id: 'tngtech/tng-r1t-chimera:free', name: 'R1T Chimera (Free)', provider: 'openrouter', requiresApiKey: true },
  // Paid tier
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'openrouter', requiresApiKey: true },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'openrouter', requiresApiKey: true },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro (OR)', provider: 'openrouter', requiresApiKey: true },
  { id: 'openai/gpt-4o', name: 'GPT-4o (OR)', provider: 'openrouter', requiresApiKey: true },
  { id: 'openai/o3-mini', name: 'o3 Mini (OR)', provider: 'openrouter', requiresApiKey: true },
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', provider: 'openrouter', requiresApiKey: true },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'openrouter', requiresApiKey: true },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'openrouter', requiresApiKey: true },

  // ─── ProxyAPI (Priority 3/4 based on proxyapi_priority) ───
  { id: 'proxyapi/gpt-4o', name: 'GPT-4o (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/gpt-4o-mini', name: 'GPT-4o Mini (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/o3-mini', name: 'o3 Mini (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/gpt-5', name: 'GPT-5 (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/gpt-5-mini', name: 'GPT-5 Mini (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/gpt-5.2', name: 'GPT-5.2 (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/gpt-oss-20b', name: 'GPT-OSS 20B (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/gpt-oss-120b', name: 'GPT-OSS 120B (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/claude-sonnet-4', name: 'Claude Sonnet 4 (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/claude-opus-4', name: 'Claude Opus 4 (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/claude-3-5-haiku', name: 'Claude 3.5 Haiku (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/gemini-3-pro-preview', name: 'Gemini 3 Pro (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/gemini-3-flash-preview', name: 'Gemini 3 Flash (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/gemini-2.5-pro', name: 'Gemini 2.5 Pro (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/gemini-2.5-flash', name: 'Gemini 2.5 Flash (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },
  { id: 'proxyapi/gemini-2.0-flash', name: 'Gemini 2.0 Flash (ProxyAPI)', provider: 'proxyapi', requiresApiKey: true },

  // ─── DotPoint (Priority 3/4 based on proxyapi_priority) ───
  { id: 'dotpoint/deepseek-chat', name: 'DeepSeek-V3 (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/deepseek-reasoner', name: 'DeepSeek-R1 (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/deepseek-coder', name: 'DeepSeek Coder (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/gpt-4.1', name: 'GPT-4.1 (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/gpt-4.1-mini', name: 'GPT-4.1 Mini (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/gpt-4.1-nano', name: 'GPT-4.1 Nano (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/gpt-4o-mini', name: 'GPT-4o Mini (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/gemini/gemini-2.5-flash', name: 'Gemini 2.5 Flash (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/gemini/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/mistral/mistral-large-latest', name: 'Mistral Large (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/mistral/codestral-latest', name: 'Codestral (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/groq/llama-3.3-70b-versatile', name: 'Llama 3.3 70B (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/groq/llama-3.1-8b-instant', name: 'Llama 3.1 8B (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
  { id: 'dotpoint/groq/qwen/qwen3-32b', name: 'Qwen3 32B (DotPoint)', provider: 'dotpoint', requiresApiKey: true },
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

// ─── Priority ordering helpers ───

/** Direct provider keys (BYOK) — Priority 1 */
export const DIRECT_PROVIDERS = ['openai', 'anthropic', 'gemini', 'xai', 'deepseek', 'mistral', 'groq'] as const;

/**
 * Returns the provider display order based on priority logic:
 * 0. Lovable AI (admin)
 * 1. Direct keys (OpenAI, Anthropic, Gemini, xAI, DeepSeek, Mistral, Groq)
 * 2. OpenRouter
 * 3/4. ProxyAPI / DotPoint (order depends on proxyapi_priority flag)
 */
export function getProviderOrder(proxyapiPriority: boolean): string[] {
  const gatewayOrder = proxyapiPriority
    ? ['proxyapi', 'dotpoint']
    : ['dotpoint', 'proxyapi'];
  
  return [
    'lovable',
    ...DIRECT_PROVIDERS,
    'openrouter',
    ...gatewayOrder,
  ];
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
  deepseek: boolean;
  mistral: boolean;
  proxyapi: boolean;
  dotpoint: boolean;
}

export function useAvailableModels() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [proxyapiPriority, setProxyapiPriority] = useState(false);
  const [userApiKeys, setUserApiKeys] = useState<UserApiKeys>({
    openai: false,
    gemini: false,
    anthropic: false,
    xai: false,
    openrouter: false,
    groq: false,
    tavily: false,
    perplexity: false,
    deepseek: false,
    mistral: false,
    proxyapi: false,
    dotpoint: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Check if user is admin (AlexKuz) from profiles + get proxyapi_priority
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, proxyapi_priority')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setIsAdmin(profile.username === 'AlexKuz');
          setProxyapiPriority(profile.proxyapi_priority || false);
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
            has_deepseek?: boolean;
            has_mistral?: boolean;
            has_proxyapi?: boolean;
            has_dotpoint?: boolean;
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
            deepseek: status.has_deepseek || false,
            mistral: status.has_mistral || false,
            proxyapi: status.has_proxyapi || false,
            dotpoint: status.has_dotpoint || false,
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
    const key = model.provider as keyof UserApiKeys;
    return userApiKeys[key] || false;
  });

  // For admin: Lovable AI models + personal key models
  // For regular users: only personal key models
  const lovableModels = isAdmin ? LOVABLE_AI_MODELS : [];
  
  return {
    isAdmin,
    proxyapiPriority,
    lovableModels,
    personalModels: availablePersonalModels,
    hasAnyModels: lovableModels.length > 0 || availablePersonalModels.length > 0,
    loading,
  };
}
