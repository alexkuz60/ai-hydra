import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProxyApiDashboard } from '@/components/profile/ProxyApiDashboard';
import { OpenRouterDashboard } from '@/components/profile/OpenRouterDashboard';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { type KeyMetadata } from '@/components/profile/ApiKeyField';
import { Badge } from '@/components/ui/badge';
import { Network, Globe, Zap, Sparkles } from 'lucide-react';
import { DotPointDashboard } from '@/components/profile/DotPointDashboard';

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
          <TabsContent value="lovable" forceMount className="data-[state=inactive]:hidden">
            <LovableAIPanel language={language} />
          </TabsContent>
        )}

        <TabsContent value="openrouter" forceMount className="data-[state=inactive]:hidden">
          <OpenRouterDashboard
            hasKey={!!apiKeys['openrouter']}
            apiKeyValue={apiKeys['openrouter'] || ''}
            onApiKeyChange={(v) => onKeyChange('openrouter', v)}
            keyMetadata={keyMetadata['openrouter']}
            onExpirationChange={(d) => onExpirationChange('openrouter', d)}
            onSave={onSave}
            saving={saving}
            language={language}
          />
        </TabsContent>

        <TabsContent value="proxyapi" forceMount className="data-[state=inactive]:hidden">
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

        <TabsContent value="dotpoint" forceMount className="data-[state=inactive]:hidden">
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

// OpenRouter panel is now in OpenRouterDashboard component
// DotPoint panel is now in DotPointDashboard component
