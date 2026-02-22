import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProxyApiDashboard } from '@/components/profile/ProxyApiDashboard';
import { OpenRouterLimitsDialog } from '@/components/profile/OpenRouterLimitsDialog';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { ApiKeyField, type KeyMetadata } from '@/components/profile/ApiKeyField';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Globe, Zap, Sparkles, AlertTriangle, Save, Loader2, Wallet, RefreshCw } from 'lucide-react';
import { DotPointDashboard } from '@/components/profile/DotPointDashboard';
import { supabase } from '@/integrations/supabase/client';

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
            onSave={onSave}
            saving={saving}
          />
        </TabsContent>

        <TabsContent value="dotpoint">
          <DotPointDashboard
            hasKey={!!apiKeys['dotpoint']}
            apiKeyValue={apiKeys['dotpoint'] || ''}
            onApiKeyChange={(v) => onKeyChange('dotpoint', v)}
            keyMetadata={keyMetadata['dotpoint']}
            onExpirationChange={(d) => onExpirationChange('dotpoint', d)}
            onSave={onSave}
            saving={saving}
            language={language}
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

// ── OpenRouter Balance Widget ─────────────────────────
function OpenRouterBalanceWidget({ hasKey, language }: { hasKey: boolean; language: string }) {
  const [balance, setBalance] = useState<{ usage_daily: number; usage_monthly: number; limit: number | null; limit_remaining: number | null } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!hasKey) return;
    setLoading(true);
    try {
      const { data } = await supabase.rpc('get_my_api_keys');
      const apiKey = data?.[0]?.openrouter_api_key;
      if (!apiKey) return;
      const res = await fetch('https://openrouter.ai/api/v1/key', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const json = await res.json();
        setBalance(json.data);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [hasKey]);

  useEffect(() => {
    if (hasKey) fetchBalance();
  }, [hasKey, fetchBalance]);

  if (!hasKey) return null;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{language === 'ru' ? 'Баланс' : 'Balance'}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchBalance} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {balance ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">{language === 'ru' ? 'Сегодня' : 'Today'}:</span>
          <span className="font-mono text-right">${balance.usage_daily?.toFixed(4) ?? '0'}</span>
          <span className="text-muted-foreground">{language === 'ru' ? 'Месяц' : 'Month'}:</span>
          <span className="font-mono text-right">${balance.usage_monthly?.toFixed(4) ?? '0'}</span>
          {balance.limit !== null && (
            <>
              <span className="text-muted-foreground">{language === 'ru' ? 'Остаток' : 'Remaining'}:</span>
              <span className="font-mono text-right font-medium text-primary">${balance.limit_remaining?.toFixed(4)}</span>
            </>
          )}
        </div>
      ) : loading ? (
        <div className="flex justify-center py-1"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : null}
    </div>
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
        <OpenRouterBalanceWidget hasKey={!!apiKey} language={language} />
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

// DotPoint panel is now in DotPointDashboard component
