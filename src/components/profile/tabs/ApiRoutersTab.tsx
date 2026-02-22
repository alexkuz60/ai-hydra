import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProxyApiDashboard } from '@/components/profile/ProxyApiDashboard';
import { OpenRouterLimitsDialog } from '@/components/profile/OpenRouterLimitsDialog';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { ApiKeyField, type KeyMetadata } from '@/components/profile/ApiKeyField';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Globe, Zap, Sparkles, AlertTriangle, Save, Loader2 } from 'lucide-react';

interface ApiRoutersTabProps {
  apiKeys: Record<string, string>;
  keyMetadata: Record<string, KeyMetadata>;
  language: string;
  t: (key: string) => string;
  onKeyChange: (provider: string, v: string) => void;
  onExpirationChange: (provider: string, date: string | null) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  proxyapiPriority: boolean;
  onPriorityChange: (val: boolean) => void;
  userId?: string;
  isAdmin?: boolean;
}

export function ApiRoutersTab({
  apiKeys, keyMetadata, language, t, onKeyChange, onExpirationChange,
  onSave, saving, proxyapiPriority, onPriorityChange, userId, isAdmin,
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
          {isAdmin && (
            <TabsTrigger value="lovable" className="flex items-center gap-2 flex-1">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Lovable AI</span>
              <Badge variant="outline" className="ml-1 text-[10px] h-4 bg-primary/10 text-primary border-primary/30">ON</Badge>
            </TabsTrigger>
          )}
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

        {isAdmin && (
          <TabsContent value="lovable">
            <LovableAIPanel language={language} />
          </TabsContent>
        )}

        <TabsContent value="openrouter">
          <OpenRouterPanel
            apiKey={apiKeys['openrouter'] || ''}
            metadata={keyMetadata['openrouter']}
            language={language}
            onKeyChange={(v) => onKeyChange('openrouter', v)}
            onExpirationChange={(d) => onExpirationChange('openrouter', d)}
            onSave={onSave}
            saving={saving}
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
            onSave={onSave}
            saving={saving}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Lovable AI Panel (Admin only) ─────────────────────────────────

function LovableAIPanel({ language }: { language: string }) {
  const models = [
    'google/gemini-2.5-pro', 'google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite',
    'google/gemini-3-pro-preview', 'google/gemini-3-flash-preview',
    'openai/gpt-5', 'openai/gpt-5-mini', 'openai/gpt-5-nano', 'openai/gpt-5.2',
  ];

  return (
    <HydraCard variant="glass" className="p-6">
      <HydraCardHeader>
        <Sparkles className="h-5 w-5 text-primary" />
        <HydraCardTitle>Lovable AI</HydraCardTitle>
        <Badge variant="outline" className="ml-2 text-[10px] h-4 bg-primary/10 text-primary border-primary/30">
          {language === 'ru' ? 'Встроенный' : 'Built-in'}
        </Badge>
      </HydraCardHeader>
      <HydraCardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {language === 'ru'
            ? 'Встроенный роутер Lovable Cloud. Доступ к моделям без собственного API-ключа. Доступен только администратору проекта.'
            : 'Built-in Lovable Cloud router. Access models without your own API key. Available to project admin only.'}
        </p>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {language === 'ru' ? 'Доступные модели' : 'Available Models'}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {models.map(m => (
              <Badge key={m} variant="secondary" className="text-xs font-mono">
                {m}
              </Badge>
            ))}
          </div>
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}

// ── OpenRouter Panel ─────────────────────────────────

function OpenRouterPanel({ apiKey, metadata, language, onKeyChange, onExpirationChange, onSave, saving }: {
  apiKey: string;
  metadata?: KeyMetadata;
  language: string;
  onKeyChange: (v: string) => void;
  onExpirationChange: (d: string | null) => void;
  onSave: () => Promise<void>;
  saving: boolean;
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
        <div className="flex justify-end pt-2">
          <Button onClick={onSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {language === 'ru' ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}

// ── DotPoint Panel ─────────────────────────────────

function DotPointPanel({ apiKey, metadata, language, onKeyChange, onExpirationChange, onSave, saving }: {
  apiKey: string;
  metadata?: KeyMetadata;
  language: string;
  onKeyChange: (v: string) => void;
  onExpirationChange: (d: string | null) => void;
  onSave: () => Promise<void>;
  saving: boolean;
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
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-400 mb-1">
              {language === 'ru' ? 'Альтернативный роутер для России' : 'Alternative router for Russia'}
            </p>
            <p className="text-xs text-muted-foreground">
              {language === 'ru'
                ? 'DotPoint — российский AI-роутер с доступом к моделям OpenAI, Anthropic, Google и другим без VPN. Поддерживает оплату в рублях. Используется как замена OpenRouter при блокировках.'
                : 'DotPoint — Russian AI router providing access to OpenAI, Anthropic, Google and other models without VPN. Supports payment in rubles. Used as an OpenRouter alternative when blocked.'}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {language === 'ru' ? 'Примеры интеграции' : 'Integration Examples'}
          </p>
          <div className="space-y-2">
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">JavaScript (fetch)</summary>
              <pre className="mt-2 p-3 rounded-lg bg-muted/50 border border-border text-[11px] leading-relaxed overflow-x-auto font-mono text-foreground/80">{`const apiKey = "your_api_key";
const baseUrl = "https://llms.dotpoin.com/v1";
const prompt = "You are a helpful assistant.";

const resp = await fetch(\`\${baseUrl}/chat/completions\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${apiKey}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "Hello!" }
    ],
    stream: false
  })
});
const data = await resp.json();`}</pre>
            </details>
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">cURL</summary>
              <pre className="mt-2 p-3 rounded-lg bg-muted/50 border border-border text-[11px] leading-relaxed overflow-x-auto font-mono text-foreground/80">{`curl -X POST https://llms.dotpoin.com/v1/chat/completions \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {"role":"system","content":"You are a helpful assistant."},
      {"role":"user","content":"Hello!"}
    ],
    "stream": false
  }'`}</pre>
            </details>
          </div>
        </div>
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
        <div className="flex justify-end pt-2">
          <Button onClick={onSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {language === 'ru' ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}
