import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { differenceInDays, isPast, isBefore, addDays } from 'date-fns';

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  anthropic: 'Anthropic',
  xai: 'xAI (Grok)',
  openrouter: 'OpenRouter',
  groq: 'Groq',
  deepseek: 'DeepSeek',
  mistral: 'Mistral',
  firecrawl: 'Firecrawl',
  tavily: 'Tavily',
  perplexity: 'Perplexity',
};

const UNLIMITED_PROVIDERS = new Set(['mistral']);

export function ApiKeyExpirationNotifier() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!user || checkedRef.current) return;
    checkedRef.current = true;

    const check = async () => {
      try {
        const [keysRes, metaRes, statusRes] = await Promise.all([
          supabase.rpc('get_my_api_keys'),
          supabase.rpc('get_my_key_metadata'),
          supabase.rpc('get_my_api_key_status'),
        ]);

        const status = statusRes.data?.[0] as Record<string, boolean> | undefined;
        const metadata = (metaRes.data || {}) as Record<string, { expires_at?: string | null }>;

        if (!status) return;

        const RPC_TO_PROVIDER: Record<string, string> = {
          has_openai: 'openai', has_gemini: 'gemini', has_anthropic: 'anthropic',
          has_xai: 'xai', has_openrouter: 'openrouter', has_groq: 'groq',
          has_deepseek: 'deepseek', has_mistral: 'mistral', has_firecrawl: 'firecrawl',
          has_tavily: 'tavily', has_perplexity: 'perplexity',
        };

        const expired: string[] = [];
        const expiringSoon: { name: string; days: number }[] = [];

        for (const [field, provider] of Object.entries(RPC_TO_PROVIDER)) {
          if (!status[field] || UNLIMITED_PROVIDERS.has(provider)) continue;
          const meta = metadata[provider];
          if (!meta?.expires_at) continue;

          const expiresAt = new Date(meta.expires_at);
          const label = PROVIDER_LABELS[provider] || provider;

          if (isPast(expiresAt)) {
            expired.push(label);
          } else if (isBefore(expiresAt, addDays(new Date(), 14))) {
            expiringSoon.push({ name: label, days: differenceInDays(expiresAt, new Date()) });
          }
        }

        if (expired.length > 0) {
          toast.error(
            language === 'ru'
              ? `Истёк срок действия ключей: ${expired.join(', ')}`
              : `Expired API keys: ${expired.join(', ')}`,
            { duration: 10000 }
          );
        }

        if (expiringSoon.length > 0) {
          const details = expiringSoon
            .map(k => language === 'ru' ? `${k.name} (${k.days} дн.)` : `${k.name} (${k.days}d)`)
            .join(', ');
          toast.warning(
            language === 'ru'
              ? `Скоро истекут ключи: ${details}`
              : `Keys expiring soon: ${details}`,
            { duration: 8000 }
          );
        }
      } catch {
        // silent — non-critical
      }
    };

    check();
  }, [user, language]);

  return null;
}
