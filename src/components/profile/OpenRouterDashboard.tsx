import React from 'react';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Loader2, Wifi, Zap, AlertTriangle, Key, Globe, Save,
  CheckCircle2, XCircle, CreditCard, Info, RefreshCw, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { ApiKeyField, type KeyMetadata } from '@/components/profile/ApiKeyField';
import { useOpenRouterData, ALL_OPENROUTER_MODELS, type OpenRouterTestResult } from '@/hooks/useOpenRouterData';
import { ProxyLogsTable } from './proxyapi/ProxyLogsTable';
import { ProxyAnalyticsSection } from './proxyapi/ProxyAnalyticsSection';

interface OpenRouterDashboardProps {
  hasKey: boolean;
  apiKeyValue: string;
  onApiKeyChange: (value: string) => void;
  keyMetadata?: KeyMetadata;
  onExpirationChange: (date: string | null) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  language: string;
}

export function OpenRouterDashboard({
  hasKey, apiKeyValue, onApiKeyChange, keyMetadata: keyMeta,
  onExpirationChange, onSave, saving, language,
}: OpenRouterDashboardProps) {
  const api = useOpenRouterData(hasKey);
  const isRu = language === 'ru';

  const renderKeySection = () => (
    <Accordion type="multiple" defaultValue={['apikey']} className="mb-4">
      <AccordionItem value="apikey" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <span className="font-semibold">API-{isRu ? 'ключ' : 'key'}</span>
            {hasKey && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ml-2">{isRu ? 'Активен' : 'Active'}</Badge>}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <ApiKeyField
            provider="openrouter"
            label="OpenRouter API Key"
            value={apiKeyValue}
            onChange={onApiKeyChange}
            placeholder="sk-or-..."
            metadata={keyMeta}
            onExpirationChange={onExpirationChange}
            hint={
              <>
                {isRu ? 'Получите ключ на' : 'Get your key at'}{' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  openrouter.ai/keys
                </a>
              </>
            }
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  const renderInfoBlock = () => (
    <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
      <Globe className="h-5 w-5 text-primary flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-primary mb-1">
          {isRu ? 'Универсальный AI-шлюз' : 'Universal AI Gateway'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isRu
            ? 'Единый шлюз к множеству моделей. Бесплатные и платные модели через один API-ключ.'
            : 'Unified gateway to many models. Free and paid models via one API key.'}
        </p>
      </div>
    </div>
  );

  // No key state
  if (!hasKey) {
    return (
      <HydraCard variant="glass" className="p-6">
        <HydraCardHeader>
          <Globe className="h-5 w-5 text-primary" />
          <HydraCardTitle>OpenRouter Dashboard</HydraCardTitle>
        </HydraCardHeader>
        <HydraCardContent>
          {renderInfoBlock()}
          {renderKeySection()}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              {isRu
                ? 'Добавьте ключ OpenRouter выше и сохраните для доступа к дашборду.'
                : 'Add your OpenRouter key above and save to access the dashboard.'}
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </HydraCardContent>
      </HydraCard>
    );
  }

  return (
    <HydraCard variant="glass" className="p-6">
      <HydraCardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <HydraCardTitle>OpenRouter Dashboard</HydraCardTitle>
          </div>
        </div>
      </HydraCardHeader>
      <HydraCardContent>
        {renderInfoBlock()}
        {renderKeySection()}

        <Accordion type="multiple" defaultValue={['status', 'test']} className="space-y-2">
          {/* Connection Status */}
          <AccordionItem value="status" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                <span className="font-semibold">{isRu ? 'Статус подключения' : 'Connection Status'}</span>
                {api.pingResult && <StatusBadge status={api.pingResult.status} isRu={isRu} />}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="flex items-center gap-3">
                <Button onClick={api.handlePing} disabled={api.pinging} size="sm" className="hydra-glow-sm">
                  {api.pinging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  Ping OpenRouter
                </Button>
                {api.pingResult && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {isRu ? 'Латенси' : 'Latency'}: <strong className="text-foreground">{api.pingResult.latency_ms}ms</strong>
                    </span>
                    {api.pingResult.error && <span className="text-destructive text-xs">{api.pingResult.error}</span>}
                  </div>
                )}
              </div>

              {/* Key info inline */}
              {api.keyInfo && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{isRu ? 'Статус ключа' : 'Key Status'}</span>
                      <Badge variant={api.keyInfo.is_free_tier ? 'secondary' : 'default'} className="text-[10px] h-4">
                        {api.keyInfo.is_free_tier ? (isRu ? 'Бесплатный' : 'Free') : (isRu ? 'Платный' : 'Paid')}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={api.fetchKeyInfo} disabled={api.keyLoading}>
                      <RefreshCw className={cn("h-3.5 w-3.5", api.keyLoading && "animate-spin")} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {api.keyInfo.label && (
                      <>
                        <span className="text-muted-foreground">{isRu ? 'Метка' : 'Label'}:</span>
                        <span className="font-mono text-right">{api.keyInfo.label}</span>
                      </>
                    )}
                    <span className="text-muted-foreground">{isRu ? 'Сегодня' : 'Today'}:</span>
                    <span className="font-mono text-right">${api.keyInfo.usage_daily?.toFixed(4) ?? '0'}</span>
                    <span className="text-muted-foreground">{isRu ? 'Месяц' : 'Month'}:</span>
                    <span className="font-mono text-right">${api.keyInfo.usage_monthly?.toFixed(4) ?? '0'}</span>
                    {api.keyInfo.limit !== null && (
                      <>
                        <span className="text-muted-foreground">{isRu ? 'Лимит' : 'Limit'}:</span>
                        <span className="font-mono text-right">${api.keyInfo.limit?.toFixed(2)}</span>
                        <span className="text-muted-foreground">{isRu ? 'Остаток' : 'Remaining'}:</span>
                        <span className="font-mono text-right font-medium text-primary">${api.keyInfo.limit_remaining?.toFixed(4)}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Model Availability Test */}
          <AccordionItem value="test" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="font-semibold">{isRu ? 'Тест доступности моделей' : 'Model Availability Test'}</span>
                {api.testing && <Badge variant="outline" className="ml-1 text-[10px] h-4 animate-pulse">{isRu ? 'Тестирование...' : 'Testing...'}</Badge>}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <p className="text-xs text-muted-foreground">
                {isRu
                  ? 'Отправляет мини-запрос к бесплатным и популярным платным моделям для проверки доступности ключа.'
                  : 'Sends a minimal request to free and popular paid models to check key availability.'}
              </p>

              <Button onClick={api.testModels} disabled={api.testing} size="sm" className="gap-2 hydra-glow-sm">
                {api.testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {isRu ? 'Проверить все модели' : 'Test All Models'}
              </Button>

              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium">{isRu ? 'Модель' : 'Model'}</th>
                      <th className="text-left p-3 font-medium">{isRu ? 'Статус' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {api.testResults.map((r, idx) => {
                      const modelMeta = ALL_OPENROUTER_MODELS[idx];
                      return (
                        <tr key={r.model} className={cn(
                          "border-b last:border-0",
                          r.status === 'quota' && "bg-amber-500/5",
                          r.status === 'not_found' && "bg-muted/20"
                        )}>
                          <td className="p-3">
                            <span className="font-medium text-xs">{r.name}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{r.model}</span>
                              <Badge variant={modelMeta?.free ? 'secondary' : 'outline'} className="text-[10px] px-1 py-0 h-4">
                                {modelMeta?.free ? 'free' : '💎 paid'}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-3 flex items-center gap-2">
                            <TestStatusIcon status={r.status} />
                            <TestStatusLabel result={r} isRu={isRu} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {isRu
                    ? 'Бесплатные модели (с суффиксом :free) имеют общий лимит. Точные лимиты зависят от нагрузки на модель.'
                    : 'Free models (with :free suffix) share a common limit. Exact limits depend on model load.'}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Logs */}
          <ProxyLogsTable
            logs={api.logs}
            logsLoading={api.logsLoading}
            onRefresh={api.fetchLogs}
            onExportCSV={api.handleExportCSV}
          />

          {/* Analytics */}
          <ProxyAnalyticsSection
            analyticsData={api.analyticsData}
            onDeleteStats={api.deleteModelStats}
          />
        </Accordion>

        <div className="flex justify-end pt-4">
          <Button onClick={onSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}

function StatusBadge({ status, isRu }: { status: string; isRu: boolean }) {
  if (status === 'online') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{isRu ? 'Онлайн' : 'Online'}</Badge>;
  if (status === 'timeout') return <Badge variant="destructive">{isRu ? 'Таймаут' : 'Timeout'}</Badge>;
  return <Badge variant="destructive">{isRu ? 'Ошибка' : 'Error'}</Badge>;
}

function TestStatusIcon({ status }: { status: OpenRouterTestResult['status'] }) {
  switch (status) {
    case 'testing': return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    case 'ok': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'quota': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'no_credits': return <CreditCard className="h-4 w-4 text-amber-500" />;
    case 'not_found': return <XCircle className="h-4 w-4 text-muted-foreground" />;
    case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
    default: return <span className="h-4 w-4" />;
  }
}

function TestStatusLabel({ result: r, isRu }: { result: OpenRouterTestResult; isRu: boolean }) {
  switch (r.status) {
    case 'idle': return <span className="text-muted-foreground">—</span>;
    case 'testing': return <span className="text-muted-foreground">{isRu ? 'Проверка...' : 'Testing...'}</span>;
    case 'ok': return <span className="text-emerald-500 font-medium">{isRu ? 'Доступна' : 'Available'} ({r.latency}ms)</span>;
    case 'quota': return <span className="text-amber-500 font-medium">429 — {isRu ? 'Лимит исчерпан' : 'Rate limited'}</span>;
    case 'no_credits': return <span className="text-amber-500 font-medium">402 — {isRu ? 'Нет кредитов' : 'No credits'}</span>;
    case 'not_found': return <span className="text-muted-foreground font-medium">404 — {isRu ? 'Не найдена' : 'Not found'}</span>;
    case 'error': return <span className="text-destructive font-medium" title={r.error}>{isRu ? 'Ошибка' : 'Error'}: {r.error?.slice(0, 60)}</span>;
    default: return null;
  }
}
