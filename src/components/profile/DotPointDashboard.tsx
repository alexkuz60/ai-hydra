import React from 'react';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Wifi, Zap, AlertTriangle, Key, Network, Save } from 'lucide-react';

import { ApiKeyField, type KeyMetadata } from '@/components/profile/ApiKeyField';
import { useDotPointData } from '@/hooks/useDotPointData';
import { ProxyAnalyticsSection } from './proxyapi/ProxyAnalyticsSection';
import { ProxyLogsTable } from './proxyapi/ProxyLogsTable';
import { ProxySettingsSection } from './proxyapi/ProxySettingsSection';
import { DotPointCatalogSection } from './dotpoint/DotPointCatalogSection';

interface DotPointDashboardProps {
  hasKey: boolean;
  apiKeyValue: string;
  onApiKeyChange: (value: string) => void;
  keyMetadata?: KeyMetadata;
  onExpirationChange: (date: string | null) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  language: string;
}

export function DotPointDashboard({ hasKey, apiKeyValue, onApiKeyChange, keyMetadata: keyMeta, onExpirationChange, onSave, saving, language }: DotPointDashboardProps) {
  const api = useDotPointData(hasKey);
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
            provider="dotpoint"
            label="DotPoint API Key"
            value={apiKeyValue}
            onChange={onApiKeyChange}
            placeholder="dp-..."
            metadata={keyMeta}
            onExpirationChange={onExpirationChange}
            hint={
              isRu
                ? 'Получите API-ключ в личном кабинете DotPoint'
                : 'Get your API key from the DotPoint dashboard'
            }
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  const renderInfoBlock = () => (
    <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-400 mb-1">
          {isRu ? 'Альтернативный роутер для России' : 'Alternative router for Russia'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isRu
            ? 'DotPoint — российский AI-роутер с доступом к моделям OpenAI, Anthropic, Google и другим без VPN. Поддерживает оплату в рублях.'
            : 'DotPoint — Russian AI router providing access to OpenAI, Anthropic, Google and other models without VPN. Supports payment in rubles.'}
        </p>
      </div>
    </div>
  );

  // No key state
  if (!hasKey) {
    return (
      <HydraCard variant="glass" className="p-6">
        <HydraCardHeader>
          <Network className="h-5 w-5 text-primary" />
          <HydraCardTitle>DotPoint Dashboard</HydraCardTitle>
        </HydraCardHeader>
        <HydraCardContent>
          {renderInfoBlock()}
          {renderKeySection()}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              {isRu
                ? 'Добавьте ключ DotPoint выше и сохраните для доступа к дашборду.'
                : 'Add your DotPoint key above and save to access the dashboard.'}
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

  // Main dashboard
  return (
    <HydraCard variant="glass" className="p-6">
      <HydraCardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <HydraCardTitle>DotPoint Dashboard</HydraCardTitle>
          </div>
        </div>
      </HydraCardHeader>
      <HydraCardContent>
        {renderInfoBlock()}
        {renderKeySection()}

        <Accordion type="multiple" defaultValue={['status', 'catalog']} className="space-y-2">
          {/* Status */}
          <AccordionItem value="status" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                <span className="font-semibold">{isRu ? 'Статус подключения' : 'Connection Status'}</span>
                {api.pingResult && <StatusBadge status={api.pingResult.status} />}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="flex items-center gap-3">
                <Button onClick={api.handlePing} disabled={api.pinging} size="sm" className="hydra-glow-sm">
                  {api.pinging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  Ping DotPoint
                </Button>
                {api.pingResult && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {isRu ? 'Латенси' : 'Latency'}: <strong className="text-foreground">{api.pingResult.latency_ms}ms</strong>
                    </span>
                    {api.pingResult.model_count !== undefined && (
                      <span className="text-muted-foreground">
                        {isRu ? 'Моделей' : 'Models'}: <strong className="text-foreground">{api.pingResult.model_count}</strong>
                      </span>
                    )}
                    {api.pingResult.error && <span className="text-destructive text-xs">{api.pingResult.error}</span>}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Catalog */}
          <DotPointCatalogSection
            userAddedModels={api.userAddedModels}
            filteredCatalogModels={api.filteredCatalogModels}
            catalogSearch={api.catalogSearch}
            onCatalogSearchChange={api.setCatalogSearch}
            catalogLoading={api.catalogLoading}
            catalogLoaded={api.catalogLoaded}
            catalogCount={api.dotpointCatalog.length}
            testResults={api.testResults}
            testingModel={api.testingModel}
            massTestRunning={api.massTestRunning}
            massTestProgress={api.massTestProgress}
            onTestModel={api.handleTestModel}
            onMassTest={api.handleMassTest}
            onAddUserModel={api.addUserModel}
            onRefreshCatalog={() => api.fetchCatalog(true)}
          />

          {/* Settings */}
          <ProxySettingsSection
            settings={api.settings}
            onSettingsChange={api.setSettings}
            syncLoaded={api.settingsLoaded}
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

function StatusBadge({ status }: { status: string }) {
  if (status === 'online') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Онлайн</Badge>;
  if (status === 'timeout') return <Badge variant="destructive">Таймаут</Badge>;
  return <Badge variant="destructive">Ошибка</Badge>;
}
