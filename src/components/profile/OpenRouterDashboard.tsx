import React from 'react';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Loader2, Wifi, Zap, AlertTriangle, Key, Globe, Save,
  RefreshCw, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { ApiKeyField, type KeyMetadata } from '@/components/profile/ApiKeyField';
import { useOpenRouterData } from '@/hooks/useOpenRouterData';
import { ProxyLogsTable } from './proxyapi/ProxyLogsTable';
import { ProxyAnalyticsSection } from './proxyapi/ProxyAnalyticsSection';
import { OpenRouterCatalogSection } from './openrouter/OpenRouterCatalogSection';

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

        <Accordion type="multiple" defaultValue={['status', 'catalog']} className="space-y-2">
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

          {/* Catalog Section */}
          <OpenRouterCatalogSection
            registryModels={api.registryModels}
            userAddedModels={api.userAddedModels}
            filteredCatalogModels={api.filteredCatalogModels}
            userModelIds={api.userModelIds}
            catalogSearch={api.catalogSearch}
            onCatalogSearchChange={api.setCatalogSearch}
            catalogLoading={api.catalogLoading}
            catalogLoaded={api.catalogLoaded}
            catalogCount={api.catalog.length}
            testResults={api.testResults}
            testingModel={api.testingModel}
            massTestRunning={api.massTestRunning}
            massTestProgress={api.massTestProgress}
            onTestModel={api.handleTestModel}
            onMassTest={api.handleMassTest}
            onAddUserModel={api.addUserModel}
            onRemoveUserModel={api.removeUserModel}
            onRefreshCatalog={() => api.fetchCatalog(true)}
            language={language}
          />

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
