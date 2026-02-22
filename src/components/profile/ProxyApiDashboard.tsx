import React from 'react';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Wifi, Zap, AlertTriangle, Key, WifiOff, Save } from 'lucide-react';

import { ProxyApiLogo } from '@/components/ui/ProviderLogos';
import { ApiKeyField, type KeyMetadata } from '@/components/profile/ApiKeyField';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { useProxyApiData } from '@/hooks/useProxyApiData';
import { ProxyAnalyticsSection } from './proxyapi/ProxyAnalyticsSection';
import { ProxyCatalogSection } from './proxyapi/ProxyCatalogSection';
import { ProxyLogsTable } from './proxyapi/ProxyLogsTable';
import { ProxySettingsSection } from './proxyapi/ProxySettingsSection';

// ─── Component ─────────────────────────────────────────

interface ProxyApiDashboardProps {
  hasKey: boolean;
  proxyapiPriority: boolean;
  onPriorityChange: (value: boolean) => void;
  apiKeyValue: string;
  onApiKeyChange: (value: string) => void;
  keyMetadata?: KeyMetadata;
  onExpirationChange: (date: string | null) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function ProxyApiDashboard({ hasKey, proxyapiPriority, onPriorityChange, apiKeyValue, onApiKeyChange, keyMetadata: keyMeta, onExpirationChange, onSave, saving }: ProxyApiDashboardProps) {
  const api = useProxyApiData(hasKey);

  // ── Shared sections ──────────────────────────────
  const renderKeySection = () => (
    <Accordion type="multiple" defaultValue={['apikey']} className="mb-4">
      <AccordionItem value="apikey" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <span className="font-semibold">API-ключ</span>
            {hasKey && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ml-2">Активен</Badge>}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <ApiKeyField
            provider="proxyapi"
            label="ProxyAPI"
            value={apiKeyValue}
            onChange={onApiKeyChange}
            placeholder="sk-..."
            metadata={keyMeta}
            onExpirationChange={onExpirationChange}
            hint={
              <>
                Получите ключ на{' '}
                <a href="https://console.proxyapi.ru/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  console.proxyapi.ru/keys
                </a>
              </>
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
        <p className="text-sm font-semibold text-amber-400 mb-1">Альтернатива OpenRouter для России</p>
        <p className="text-xs text-muted-foreground mb-2">
          ProxyAPI — российский шлюз для доступа к моделям OpenAI, Anthropic, Google и DeepSeek без VPN.
          Поддерживает оплату в рублях. Используется как замена OpenRouter при блокировках.
        </p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="dash-proxyapi-priority"
            checked={proxyapiPriority}
            onCheckedChange={(checked) => onPriorityChange(!!checked)}
          />
          <Label htmlFor="dash-proxyapi-priority" className="text-sm text-muted-foreground cursor-pointer">
            Приоритет над OpenRouter
          </Label>
        </div>
      </div>
    </div>
  );

  // ── No key state ─────────────────────────────────
  if (!hasKey) {
    return (
      <HydraCard variant="glass" className="p-6">
        <HydraCardHeader>
          <ProxyApiLogo className="h-5 w-5" />
          <HydraCardTitle>ProxyAPI Dashboard</HydraCardTitle>
        </HydraCardHeader>
        <HydraCardContent>
          {renderInfoBlock()}
          {renderKeySection()}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Добавьте ключ ProxyAPI выше и сохраните для доступа к дашборду.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Сохранить
            </Button>
          </div>
        </HydraCardContent>
      </HydraCard>
    );
  }

  // ── Main dashboard ───────────────────────────────
  return (
    <HydraCard variant="glass" className="p-6">
      <HydraCardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <ProxyApiLogo className="h-5 w-5" />
            <HydraCardTitle>ProxyAPI Dashboard</HydraCardTitle>
          </div>
        </div>
      </HydraCardHeader>
      <HydraCardContent>
        {renderInfoBlock()}
        {renderKeySection()}

        <Accordion type="multiple" defaultValue={['status', 'catalog']} className="space-y-2">
          {/* ── Status ── */}
          <AccordionItem value="status" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                <span className="font-semibold">Статус подключения</span>
                {api.pingResult && <StatusBadge status={api.pingResult.status} />}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="flex items-center gap-3">
                <Button onClick={api.handlePing} disabled={api.pinging} size="sm" className="hydra-glow-sm">
                  {api.pinging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  Ping ProxyAPI
                </Button>
                {api.pingResult && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Латенси: <strong className="text-foreground">{api.pingResult.latency_ms}ms</strong>
                    </span>
                    {api.pingResult.model_count !== undefined && (
                      <span className="text-muted-foreground">
                        Моделей: <strong className="text-foreground">{api.pingResult.model_count}</strong>
                      </span>
                    )}
                    {api.pingResult.error && <span className="text-destructive text-xs">{api.pingResult.error}</span>}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Catalog ── */}
          <ProxyCatalogSection
            proxyModels={api.proxyModels}
            userAddedModels={api.userAddedModels}
            filteredCatalogModels={api.filteredCatalogModels}
            catalogSearch={api.catalogSearch}
            onCatalogSearchChange={api.setCatalogSearch}
            catalogLoading={api.catalogLoading}
            catalogLoaded={api.catalogLoaded}
            proxyCatalogCount={api.proxyCatalog.length}
            testResults={api.testResults}
            testingModel={api.testingModel}
            massTestRunning={api.massTestRunning}
            massTestProgress={api.massTestProgress}
            onTestModel={api.handleTestModel}
            onMassTest={api.handleMassTest}
            onAddUserModel={api.addUserModel}
            onRemoveUserModel={api.removeUserModel}
            onRefreshCatalog={() => api.fetchCatalog(true)}
          />

          {/* ── Settings ── */}
          <ProxySettingsSection
            settings={api.settings}
            onSettingsChange={api.setSettings}
            syncLoaded={api.settingsLoaded}
          />

          {/* ── Logs ── */}
          <ProxyLogsTable
            logs={api.logs}
            logsLoading={api.logsLoading}
            onRefresh={api.fetchLogs}
            onExportCSV={api.handleExportCSV}
          />

          {/* ── Analytics ── */}
          <ProxyAnalyticsSection
            analyticsData={api.analyticsData}
            onDeleteStats={api.deleteModelStats}
          />
        </Accordion>
        <div className="flex justify-end pt-4">
          <Button onClick={onSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Сохранить
          </Button>
        </div>
      </HydraCardContent>

      {/* Gone model dialog */}
      <Dialog open={!!api.goneModel} onOpenChange={(open) => !open && api.setGoneModel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-destructive" />
              Модель удалена
            </DialogTitle>
            <DialogDescription>
              Модель <strong>{api.goneModel?.displayName}</strong> была навсегда удалена из сервиса ProxyAPI (HTTP 410 Gone).
              Она больше не доступна для запросов. Скрыть её из каталога?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Оставить</Button>
            </DialogClose>
            <Button variant="destructive" onClick={api.handleConfirmRemove}>
              Скрыть модель
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HydraCard>
  );
}

// ─── Sub-components ────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'online') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Онлайн</Badge>;
  if (status === 'timeout') return <Badge variant="destructive">Таймаут</Badge>;
  return <Badge variant="destructive">Ошибка</Badge>;
}
