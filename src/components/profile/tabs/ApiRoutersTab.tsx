import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProxyApiDashboard } from '@/components/profile/ProxyApiDashboard';
import { OpenRouterLimitsDialog } from '@/components/profile/OpenRouterLimitsDialog';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { ApiKeyField, type KeyMetadata } from '@/components/profile/ApiKeyField';
import { Badge } from '@/components/ui/badge';
import { Network, Globe, Zap } from 'lucide-react';

interface ApiRoutersTabProps {
  apiKeys: Record<string, string>;
  keyMetadata: Record<string, KeyMetadata>;
  language: string;
  t: (key: string) => string;
  onKeyChange: (provider: string, v: string) => void;
  onExpirationChange: (provider: string, date: string | null) => void;
  proxyapiPriority: boolean;
  onPriorityChange: (val: boolean) => void;
  userId?: string;
}

export function ApiRoutersTab({
  apiKeys, keyMetadata, language, t, onKeyChange, onExpirationChange,
  proxyapiPriority, onPriorityChange, userId,
}: ApiRoutersTabProps) {
  const [activeRouter, setActiveRouter] = useState('openrouter');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Network className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{language === 'ru' ? 'API Роутеры' : 'API Routers'}</h3>
      </div>

      <Tabs value={activeRouter} onValueChange={setActiveRouter}>
        <TabsList className="flex w-full h-auto flex-wrap gap-0.5">
          <TabsTrigger value="openrouter" className="flex items-center gap-2 flex-1">
            <Globe className="h-4 w-4 shrink-0" />
            <span>OpenRouter</span>
            {apiKeys['openrouter'] && <Badge variant="outline" className="ml-1 text-[10px] h-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">ON</Badge>}
          </TabsTrigger>
          <TabsTrigger value="proxyapi" className="flex items-center gap-2 flex-1">
            <Zap className="h-4 w-4 shrink-0" />
            <span>ProxyAPI</span>
            {apiKeys['proxyapi'] && <Badge variant="outline" className="ml-1 text-[10px] h-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">ON</Badge>}
          </TabsTrigger>
          <TabsTrigger value="dotpoint" className="flex items-center gap-2 flex-1">
            <Network className="h-4 w-4 shrink-0" />
            <span>DotPoint</span>
            {apiKeys['dotpoint'] && <Badge variant="outline" className="ml-1 text-[10px] h-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">ON</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="openrouter">
          <OpenRouterPanel
            apiKey={apiKeys['openrouter'] || ''}
            metadata={keyMetadata['openrouter']}
            language={language}
            onKeyChange={(v) => onKeyChange('openrouter', v)}
            onExpirationChange={(d) => onExpirationChange('openrouter', d)}
          />
        </TabsContent>

        <TabsContent value="proxyapi">
          <ProxyApiDashboard
            hasKey={!!apiKeys['proxyapi']}
            proxyapiPriority={proxyapiPriority && !!apiKeys['proxyapi']}
            onPriorityChange={onPriorityChange}
            apiKeyValue={apiKeys['proxyapi'] || ''}
            onApiKeyChange={(v) => onKeyChange('proxyapi', v)}
            keyMetadata={keyMetadata['proxyapi']}
            onExpirationChange={(d) => onExpirationChange('proxyapi', d)}
          />
        </TabsContent>

        <TabsContent value="dotpoint">
          <DotPointPanel
            apiKey={apiKeys['dotpoint'] || ''}
            metadata={keyMetadata['dotpoint']}
            language={language}
            onKeyChange={(v) => onKeyChange('dotpoint', v)}
            onExpirationChange={(d) => onExpirationChange('dotpoint', d)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── OpenRouter Panel ─────────────────────────────────

function OpenRouterPanel({ apiKey, metadata, language, onKeyChange, onExpirationChange }: {
  apiKey: string;
  metadata?: KeyMetadata;
  language: string;
  onKeyChange: (v: string) => void;
  onExpirationChange: (d: string | null) => void;
}) {
  return (
    <HydraCard variant="glass" className="p-6">
      <HydraCardHeader>
        <Globe className="h-5 w-5 text-primary" />
        <HydraCardTitle>OpenRouter</HydraCardTitle>
      </HydraCardHeader>
      <HydraCardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {language === 'ru'
            ? 'Единый шлюз к множеству моделей. Бесплатные и платные модели через один API-ключ.'
            : 'Unified gateway to many models. Free and paid models via one API key.'}
        </p>
        <ApiKeyField
          provider="openrouter"
          label="OpenRouter API Key"
          value={apiKey}
          onChange={onKeyChange}
          placeholder="sk-or-..."
          metadata={metadata}
          onExpirationChange={onExpirationChange}
          hint={
            <>
              {language === 'ru' ? 'Получите ключ на' : 'Get your key at'}{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                openrouter.ai/keys
              </a>
            </>
          }
        />
        {apiKey && <OpenRouterLimitsDialog hasKey={!!apiKey} />}
      </HydraCardContent>
    </HydraCard>
  );
}

// ── DotPoint Panel ─────────────────────────────────

function DotPointPanel({ apiKey, metadata, language, onKeyChange, onExpirationChange }: {
  apiKey: string;
  metadata?: KeyMetadata;
  language: string;
  onKeyChange: (v: string) => void;
  onExpirationChange: (d: string | null) => void;
}) {
  return (
    <HydraCard variant="glass" className="p-6">
      <HydraCardHeader>
        <Network className="h-5 w-5 text-primary" />
        <HydraCardTitle>DotPoint AI</HydraCardTitle>
      </HydraCardHeader>
      <HydraCardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {language === 'ru'
            ? 'Роутер для доступа к AI-моделям через единый API. Подключите ключ для начала работы.'
            : 'AI model router via unified API. Connect your key to get started.'}
        </p>
        <ApiKeyField
          provider="dotpoint"
          label="DotPoint API Key"
          value={apiKey}
          onChange={onKeyChange}
          placeholder="dp-..."
          metadata={metadata}
          onExpirationChange={onExpirationChange}
          hint={
            language === 'ru'
              ? 'Получите API-ключ в личном кабинете DotPoint'
              : 'Get your API key from the DotPoint dashboard'
          }
        />
        {!apiKey && (
          <div className="p-6 rounded-lg border-2 border-dashed border-muted text-center">
            <Network className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {language === 'ru'
                ? 'Введите API-ключ для доступа к каталогу моделей, аналитике и тестированию'
                : 'Enter your API key to access model catalog, analytics and testing'}
            </p>
          </div>
        )}
      </HydraCardContent>
    </HydraCard>
  );
}
