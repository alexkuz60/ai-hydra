import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Key, Globe, Search, AlertTriangle, Loader2, Check } from 'lucide-react';
import { ApiKeyField, type KeyMetadata } from '@/components/profile/ApiKeyField';
import { GeminiLimitsDialog } from '@/components/profile/GeminiLimitsDialog';

import { MistralLimitsDialog } from '@/components/profile/MistralLimitsDialog';
import { FirecrawlLimitsDialog } from '@/components/profile/FirecrawlLimitsDialog';

const LLM_PROVIDERS = [
  { provider: 'openai', labelKey: 'profile.openai', placeholder: 'sk-...' },
  { provider: 'gemini', labelKey: 'profile.gemini', placeholder: 'AIza...' },
  { provider: 'anthropic', labelKey: 'profile.anthropic', placeholder: 'sk-ant-...' },
  { provider: 'xai', label: 'xAI (Grok)', placeholder: 'xai-...' },
  
  { provider: 'groq', label: 'Groq (Ultra-Fast Inference)', placeholder: 'gsk_...', hint: { ru: 'console.groq.com/keys', en: 'console.groq.com/keys', url: 'https://console.groq.com/keys' } },
  { provider: 'deepseek', label: 'DeepSeek AI', placeholder: 'sk-...', hint: { ru: 'platform.deepseek.com', en: 'platform.deepseek.com', url: 'https://platform.deepseek.com/api_keys' } },
  { provider: 'mistral', label: 'Mistral AI', placeholder: '...', hint: { ru: 'console.mistral.ai', en: 'console.mistral.ai', url: 'https://console.mistral.ai/api-keys' } },
] as const;

const TOOL_PROVIDERS = [
  { provider: 'firecrawl', label: 'Firecrawl (Web Scraping)', placeholder: 'fc-...', hint: { ru: 'firecrawl.dev', en: 'firecrawl.dev', url: 'https://firecrawl.dev/app/api-keys' } },
] as const;

const SEARCH_PROVIDERS = [
  { provider: 'tavily', labelKey: 'profile.tavily', placeholder: 'tvly-...', hintKey: 'profile.tavilyHint', hintUrl: 'https://tavily.com/app' },
  { provider: 'perplexity', labelKey: 'profile.perplexity', placeholder: 'pplx-...', hintKey: 'profile.perplexityHint', hintUrl: 'https://perplexity.ai/settings/api' },
] as const;

interface ApiKeysTabProps {
  apiKeys: Record<string, string>;
  keyMetadata: Record<string, KeyMetadata>;
  saving: boolean;
  language: string;
  t: (key: string) => string;
  onKeyChange: (provider: string, v: string) => void;
  onExpirationChange: (provider: string, date: string | null) => void;
  onSave: () => void;
}

function renderProviderHint(p: Record<string, unknown>, language: string, t: (k: string) => string) {
  const hintKey = p.hintKey as string | undefined;
  const hintUrl = p.hintUrl as string | undefined;
  const hint = p.hint as { ru: string; en: string; url: string } | undefined;
  if (hintKey) {
    return (
      <>
        {t(hintKey)} — <a href={hintUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{hintUrl?.replace('https://', '')}</a>
      </>
    );
  }
  if (hint) {
    return (
      <>
        {language === 'ru' ? 'Получите ключ на' : 'Get your key at'}{' '}
        <a href={hint.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {language === 'ru' ? hint.ru : hint.en}
        </a>
      </>
    );
  }
  return null;
}

export function ApiKeysTab({ apiKeys, keyMetadata, saving, language, t, onKeyChange, onExpirationChange, onSave }: ApiKeysTabProps) {
  return (
    <HydraCard variant="glass" className="p-6">
      <HydraCardHeader>
        <Key className="h-5 w-5 text-primary" />
        <HydraCardTitle>{t('profile.apiKeys')}</HydraCardTitle>
      </HydraCardHeader>
      <HydraCardContent className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          {language === 'ru'
            ? 'Добавьте свои API ключи для использования различных LLM моделей (BYOK — Bring Your Own Key)'
            : 'Add your API keys to use various LLM models (BYOK — Bring Your Own Key)'}
        </p>

        {LLM_PROVIDERS.map(p => (
          <React.Fragment key={p.provider}>
            <ApiKeyField
              provider={p.provider}
              label={'labelKey' in p ? t(p.labelKey) : p.label}
              value={apiKeys[p.provider] || ''}
              onChange={(v) => onKeyChange(p.provider, v)}
              placeholder={p.placeholder}
              metadata={keyMetadata[p.provider]}
              onExpirationChange={(date) => onExpirationChange(p.provider, date)}
              hint={renderProviderHint(p, language, t)}
              unlimited={p.provider === 'mistral'}
            />
            {p.provider === 'gemini' && apiKeys['gemini'] && (
              <div className="mt-1 mb-2"><GeminiLimitsDialog hasKey={!!apiKeys['gemini']} /></div>
            )}
            {p.provider === 'mistral' && apiKeys['mistral'] && (
              <div className="mt-1 mb-2"><MistralLimitsDialog hasKey={!!apiKeys['mistral']} /></div>
            )}
          </React.Fragment>
        ))}

        <Separator className="my-6" />
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{language === 'ru' ? 'Инструменты' : 'Tools'}</h3>
        </div>

        {TOOL_PROVIDERS.map(p => (
          <React.Fragment key={p.provider}>
            <ApiKeyField
              provider={p.provider}
              label={p.label}
              value={apiKeys[p.provider] || ''}
              onChange={(v) => onKeyChange(p.provider, v)}
              placeholder={p.placeholder}
              metadata={keyMetadata[p.provider]}
              onExpirationChange={(date) => onExpirationChange(p.provider, date)}
              hint={renderProviderHint(p, language, t)}
            />
            {p.provider === 'firecrawl' && apiKeys['firecrawl'] && (
              <div className="mt-1 mb-2"><FirecrawlLimitsDialog hasKey={!!apiKeys['firecrawl']} /></div>
            )}
          </React.Fragment>
        ))}

        <Separator className="my-6" />
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('profile.webSearch')}</h3>
        </div>

        <div className="p-4 rounded-lg bg-hydra-critical/10 border border-hydra-critical/30 mb-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-hydra-critical flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80">{t('profile.webSearchWarning')}</p>
          </div>
        </div>

        {SEARCH_PROVIDERS.map(p => (
          <ApiKeyField
            key={p.provider}
            provider={p.provider}
            label={t(p.labelKey)}
            value={apiKeys[p.provider] || ''}
            onChange={(v) => onKeyChange(p.provider, v)}
            placeholder={p.placeholder}
            metadata={keyMetadata[p.provider]}
            onExpirationChange={(date) => onExpirationChange(p.provider, date)}
            hint={renderProviderHint(p, language, t)}
          />
        ))}

        <Button onClick={onSave} disabled={saving} className="hydra-glow-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
          {t('profile.save')}
        </Button>
      </HydraCardContent>
    </HydraCard>
  );
}
