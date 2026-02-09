import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2, Wifi, WifiOff, Zap, Play, CheckCircle, XCircle, Clock, AlertTriangle, History, Settings2, BarChart3, RefreshCw, Download, Key, Search, Plus, HelpCircle } from 'lucide-react';
import { ProxyApiLogo, PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { cn } from '@/lib/utils';
import { getAllRegistryEntries, type ModelRegistryEntry, STRENGTH_LABELS } from '@/config/modelRegistry';
import { ApiKeyField, type KeyMetadata } from '@/components/profile/ApiKeyField';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

// ─── Types ─────────────────────────────────────────────

interface ProxyApiCatalogModel {
  id: string;
  owned_by: string;
  created?: number;
}

interface PingResult {
  status: 'online' | 'error' | 'timeout';
  latency_ms: number;
  model_count?: number;
  error?: string;
}

interface TestResult {
  status: 'success' | 'error' | 'timeout' | 'gone';
  latency_ms: number;
  content?: string;
  tokens?: { input: number; output: number };
  error?: string;
  details?: string;
}

interface LogEntry {
  id: string;
  model_id: string;
  request_type: string;
  status: string;
  latency_ms: number | null;
  tokens_input: number | null;
  tokens_output: number | null;
  error_message: string | null;
  created_at: string;
}

interface ProxyApiSettings {
  timeout_sec: number;
  max_retries: number;
  fallback_enabled: boolean;
}

const DEFAULT_SETTINGS: ProxyApiSettings = {
  timeout_sec: 30,
  max_retries: 2,
  fallback_enabled: true,
};

const SETTINGS_KEY = 'proxyapi_settings';
const USER_MODELS_KEY = 'proxyapi_user_models';

// ─── Status explanations ──────────────────────────────

const STATUS_EXPLANATIONS: Record<string, { label: string; description: string }> = {
  success: { label: 'Успешно', description: 'Запрос выполнен без ошибок. Модель ответила корректно.' },
  error: { label: 'Ошибка', description: 'Запрос завершился с ошибкой. Возможные причины: невалидный API-ключ, превышение лимита запросов, внутренняя ошибка провайдера или проблемы с сетью.' },
  timeout: { label: 'Таймаут', description: 'Модель не успела ответить за отведённое время. Попробуйте увеличить таймаут в настройках или использовать более быструю модель.' },
  gone: { label: '410 Gone', description: 'Модель навсегда удалена из сервиса ProxyAPI (HTTP 410). Она больше не доступна для запросов. Рекомендуется скрыть её из каталога.' },
  fallback: { label: 'Фолбэк', description: 'Основной провайдер (ProxyAPI) вернул ошибку, запрос автоматически перенаправлен на резервный шлюз (Lovable AI).' },
  stream: { label: 'Стриминг', description: 'Потоковый запрос к модели через ProxyAPI. Токены отправляются по мере генерации.' },
  ping: { label: 'Пинг', description: 'Проверка доступности сервиса ProxyAPI. Измеряет латенси до API-сервера.' },
  test: { label: 'Тест', description: 'Одиночный тестовый запрос к модели для проверки её работоспособности.' },
};

// ─── Component ─────────────────────────────────────────

interface ProxyApiDashboardProps {
  hasKey: boolean;
  proxyapiPriority: boolean;
  onPriorityChange: (value: boolean) => void;
  apiKeyValue: string;
  onApiKeyChange: (value: string) => void;
  keyMetadata?: KeyMetadata;
  onExpirationChange: (date: string | null) => void;
}

export function ProxyApiDashboard({ hasKey, proxyapiPriority, onPriorityChange, apiKeyValue, onApiKeyChange, keyMetadata: keyMeta, onExpirationChange }: ProxyApiDashboardProps) {
  const { user } = useAuth();
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [pinging, setPinging] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [hiddenModels, setHiddenModels] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('proxyapi_hidden_models');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [goneModel, setGoneModel] = useState<ModelRegistryEntry | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [settings, setSettings] = useState<ProxyApiSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  const [catalogSearch, setCatalogSearch] = useState('');
  const [userModelIds, setUserModelIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(USER_MODELS_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [proxyCatalog, setProxyCatalog] = useState<ProxyApiCatalogModel[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  const proxyModels = getAllRegistryEntries().filter(m => m.provider === 'proxyapi' && !hiddenModels.has(m.id));

  // Fetch full ProxyAPI catalog
  const fetchCatalog = useCallback(async (force = false) => {
    if (!user || (catalogLoaded && !force)) return;
    setCatalogLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-api-test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ action: 'models' }),
        }
      );
      const data = await resp.json();
      if (data.models) {
        setProxyCatalog(data.models as ProxyApiCatalogModel[]);
        setCatalogLoaded(true);
      }
    } catch {
      // silent
    } finally {
      setCatalogLoading(false);
    }
  }, [user, catalogLoaded]);

  // Fetch catalog when key is available
  useEffect(() => {
    if (hasKey && user && !catalogLoaded) fetchCatalog();
  }, [hasKey, user, catalogLoaded, fetchCatalog]);

  // Filter catalog models by search
  const filteredCatalogModels = useMemo(() => {
    if (!catalogSearch.trim()) return [];
    const q = catalogSearch.toLowerCase();
    return proxyCatalog.filter(m =>
      !userModelIds.has(m.id) &&
      (m.id.toLowerCase().includes(q) ||
       m.owned_by.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [catalogSearch, proxyCatalog, userModelIds]);

  // User-added models (stored as IDs, resolved from catalog)
  const userAddedModels = useMemo(() => {
    return proxyCatalog.filter(m => userModelIds.has(m.id));
  }, [proxyCatalog, userModelIds]);

  // Persist user models
  const addUserModel = useCallback((modelId: string) => {
    const next = new Set(userModelIds);
    next.add(modelId);
    setUserModelIds(next);
    localStorage.setItem(USER_MODELS_KEY, JSON.stringify([...next]));
    setCatalogSearch('');
  }, [userModelIds]);

  const removeUserModel = useCallback((modelId: string) => {
    const next = new Set(userModelIds);
    next.delete(modelId);
    setUserModelIds(next);
    localStorage.setItem(USER_MODELS_KEY, JSON.stringify([...next]));
  }, [userModelIds]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('proxy_api_logs')
        .select('id, model_id, request_type, status, latency_ms, tokens_input, tokens_output, error_message, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setLogs((data as LogEntry[]) || []);
    } catch {
      // silent
    } finally {
      setLogsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (hasKey && user) fetchLogs();
  }, [hasKey, user, fetchLogs]);

  const handlePing = useCallback(async () => {
    if (!user) return;
    setPinging(true);
    setPingResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-api-test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ action: 'ping' }),
        }
      );
      const data = await resp.json();
      setPingResult(data as PingResult);
      fetchLogs();
    } catch {
      setPingResult({ status: 'error', latency_ms: 0, error: 'Network error' });
    } finally {
      setPinging(false);
    }
  }, [user, fetchLogs]);

  const handleTestModel = useCallback(async (modelId: string) => {
    if (!user) return;
    setTestingModel(modelId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-api-test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ action: 'test', model_id: modelId }),
        }
      );
      const data = await resp.json() as TestResult;
      setTestResults(prev => ({ ...prev, [modelId]: data }));
      if (data.status === 'gone') {
        const model = getAllRegistryEntries().find(m => m.id === modelId);
        if (model) setGoneModel(model);
      }
      fetchLogs();
    } catch {
      setTestResults(prev => ({
        ...prev,
        [modelId]: { status: 'error', latency_ms: 0, error: 'Network error' },
      }));
    } finally {
      setTestingModel(null);
    }
  }, [user, fetchLogs]);

  const handleConfirmRemove = useCallback(() => {
    if (!goneModel) return;
    const next = new Set(hiddenModels);
    next.add(goneModel.id);
    setHiddenModels(next);
    localStorage.setItem('proxyapi_hidden_models', JSON.stringify([...next]));
    setGoneModel(null);
  }, [goneModel, hiddenModels]);

  // Analytics data
  const analyticsData = useMemo(() => {
    const byModel: Record<string, { model: string; total: number; success: number; errors: number; avgLatency: number; latencies: number[] }> = {};
    logs.forEach(log => {
      if (log.request_type === 'ping') return;
      const key = log.model_id.replace('proxyapi/', '');
      if (!byModel[key]) byModel[key] = { model: key, total: 0, success: 0, errors: 0, avgLatency: 0, latencies: [] };
      byModel[key].total++;
      if (log.status === 'success') byModel[key].success++;
      else byModel[key].errors++;
      if (log.latency_ms) byModel[key].latencies.push(log.latency_ms);
    });
    return Object.values(byModel).map(m => ({
      ...m,
      avgLatency: m.latencies.length ? Math.round(m.latencies.reduce((a, b) => a + b, 0) / m.latencies.length) : 0,
    }));
  }, [logs]);

  // Export logs as CSV
  const handleExportCSV = useCallback(() => {
    if (logs.length === 0) return;
    const headers = ['Дата', 'Модель', 'Тип', 'Статус', 'Латенси (ms)', 'Токены вход', 'Токены выход', 'Ошибка'];
    const rows = logs.map(l => [
      new Date(l.created_at).toISOString(),
      l.model_id,
      l.request_type,
      l.status,
      l.latency_ms ?? '',
      l.tokens_input ?? '',
      l.tokens_output ?? '',
      l.error_message ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxyapi-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  // API Key section (always shown)
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

  // Info block — always at top
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
        </HydraCardContent>
      </HydraCard>
    );
  }

  return (
    <HydraCard variant="glass" className="p-6">
      <HydraCardHeader>
        <ProxyApiLogo className="h-5 w-5" />
        <HydraCardTitle>ProxyAPI Dashboard</HydraCardTitle>
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
                {pingResult && <StatusBadge status={pingResult.status} />}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="flex items-center gap-3">
                <Button onClick={handlePing} disabled={pinging} size="sm" className="hydra-glow-sm">
                  {pinging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  Ping ProxyAPI
                </Button>
                {pingResult && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Латенси: <strong className="text-foreground">{pingResult.latency_ms}ms</strong>
                    </span>
                    {pingResult.model_count !== undefined && (
                      <span className="text-muted-foreground">
                        Моделей: <strong className="text-foreground">{pingResult.model_count}</strong>
                      </span>
                    )}
                    {pingResult.error && <span className="text-destructive text-xs">{pingResult.error}</span>}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Model Catalog ── */}
          <AccordionItem value="catalog" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-semibold">Каталог моделей</span>
               <Badge variant="secondary" className="ml-2">
                  {proxyModels.length + userAddedModels.length}
                  {catalogLoaded && <span className="text-muted-foreground ml-1">/ {proxyCatalog.length} в каталоге</span>}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              {/* Search across all models */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    placeholder={catalogLoading ? 'Загрузка каталога...' : `Поиск среди ${proxyCatalog.length} моделей ProxyAPI...`}
                    className="pl-9"
                    disabled={catalogLoading}
                  />
                  {catalogLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchCatalog(true)}
                  disabled={catalogLoading}
                  title="Обновить каталог"
                >
                  <RefreshCw className={cn("h-4 w-4", catalogLoading && "animate-spin")} />
                </Button>
              </div>

              {/* Search results from live ProxyAPI catalog */}
              {filteredCatalogModels.length > 0 && (
                <div className="border rounded-lg bg-card/50 max-h-[240px] overflow-y-auto">
                  {filteredCatalogModels.map(model => (
                    <div key={model.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-0" onClick={() => addUserModel(model.id)}>
                      <ProxyApiLogo className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="text-sm truncate flex-1 font-mono">{model.id}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{model.owned_by}</Badge>
                      <Plus className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
              {catalogSearch.trim() && filteredCatalogModels.length === 0 && !catalogLoading && (
                <p className="text-xs text-muted-foreground text-center py-2">Ничего не найдено среди {proxyCatalog.length} моделей</p>
              )}

              {/* User-added models from ProxyAPI catalog */}
              {userAddedModels.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Пользовательский список ({userAddedModels.length})</p>
                  {userAddedModels.map(model => (
                    <div key={model.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
                      <ProxyApiLogo className="h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-mono truncate">{model.id}</p>
                        <p className="text-xs text-muted-foreground">{model.owned_by}</p>
                      </div>
                      {testResults[model.id] && (() => {
                        const tr = testResults[model.id];
                        const expl = STATUS_EXPLANATIONS[tr.status];
                        return (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help text-xs">
                                  {tr.status === 'success' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : tr.status === 'gone' ? <WifiOff className="h-3.5 w-3.5 text-destructive" /> : tr.status === 'timeout' ? <Clock className="h-3.5 w-3.5 text-amber-500" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                                  <span>{tr.latency_ms}ms</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[250px]">
                                <p className="text-xs">{expl?.description || tr.error}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeUserModel(model.id)}
                        title="Убрать из списка"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-shrink-0 h-8 w-8 p-0"
                        onClick={() => handleTestModel(model.id)}
                        disabled={testingModel === model.id}
                        title="Тест модели"
                      >
                        {testingModel === model.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* ProxyAPI native models */}
              <div className="space-y-1">
                {userAddedModels.length > 0 && <p className="text-xs text-muted-foreground font-medium">ProxyAPI модели</p>}
                {proxyModels.map(model => (
                  <ModelRow
                    key={model.id}
                    model={model}
                    testResult={testResults[model.id]}
                    isTesting={testingModel === model.id}
                    onTest={() => handleTestModel(model.id)}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Settings ── */}
          <AccordionItem value="settings" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <span className="font-semibold">Настройки</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Таймаут (сек)</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[settings.timeout_sec]}
                      onValueChange={([v]) => setSettings(s => ({ ...s, timeout_sec: v }))}
                      min={10}
                      max={120}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-10 text-right">{settings.timeout_sec}s</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Макс. повторов (retry)</Label>
                  <Select
                    value={String(settings.max_retries)}
                    onValueChange={(v) => setSettings(s => ({ ...s, max_retries: Number(v) }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 — без повторов</SelectItem>
                      <SelectItem value="1">1 повтор</SelectItem>
                      <SelectItem value="2">2 повтора</SelectItem>
                      <SelectItem value="3">3 повтора</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="fallback-enabled"
                  checked={settings.fallback_enabled}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, fallback_enabled: !!checked }))}
                />
                <Label htmlFor="fallback-enabled" className="text-sm cursor-pointer">
                  Автоматический фолбэк на Lovable AI при ошибках
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Настройки сохраняются локально и применяются при следующих запросах через ProxyAPI.
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* ── Recent Logs ── */}
          <AccordionItem value="logs" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <span className="font-semibold">Последние запросы</span>
                <Badge variant="secondary" className="ml-2">{logs.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="flex justify-end gap-2 mb-2">
                <Button size="sm" variant="ghost" onClick={handleExportCSV} disabled={logs.length === 0}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  CSV
                </Button>
                <Button size="sm" variant="ghost" onClick={fetchLogs} disabled={logsLoading}>
                  <RefreshCw className={cn("h-3.5 w-3.5 mr-1", logsLoading && "animate-spin")} />
                  Обновить
                </Button>
              </div>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Нет записей</p>
              ) : (
                <div className="overflow-x-auto">
                  <TooltipProvider delayDuration={200}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-2 pr-3">Модель</th>
                          <th className="text-left py-2 pr-3">
                            <div className="flex items-center gap-1">
                              Тип
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[220px]">
                                  <p className="text-xs">Тип запроса: stream (потоковый), test (тестовый), ping (проверка связи)</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </th>
                          <th className="text-left py-2 pr-3">
                            <div className="flex items-center gap-1">
                              Статус
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[250px]">
                                  <div className="text-xs space-y-1">
                                    <p><strong className="text-emerald-400">success</strong> — OK</p>
                                    <p><strong className="text-destructive">error</strong> — ошибка запроса</p>
                                    <p><strong className="text-amber-500">timeout</strong> — превышение таймаута</p>
                                    <p><strong className="text-destructive">gone</strong> — модель удалена (410)</p>
                                    <p><strong className="text-blue-400">fallback</strong> — авто-переключение</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </th>
                          <th className="text-right py-2 pr-3">Латенси</th>
                          <th className="text-right py-2 pr-3">Токены</th>
                          <th className="text-right py-2">Дата</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map(log => (
                          <LogRow key={log.id} log={log} />
                        ))}
                      </tbody>
                    </table>
                  </TooltipProvider>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── Analytics ── */}
          <AccordionItem value="analytics" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="font-semibold">Аналитика</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {analyticsData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Недостаточно данных для аналитики</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Средняя латенси по моделям (ms)</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analyticsData} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="model" width={120} tick={{ fontSize: 10 }} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Bar dataKey="avgLatency" name="Латенси (ms)" radius={[0, 4, 4, 0]}>
                          {analyticsData.map((_, i) => (
                            <Cell key={i} fill={`hsl(var(--primary) / ${0.4 + (i % 3) * 0.2})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {analyticsData.map(m => (
                      <div key={m.model} className="p-3 rounded-lg border bg-card/50 space-y-1">
                        <p className="text-xs font-medium truncate">{m.model}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Всего</span>
                          <span className="font-mono">{m.total}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-400">✓ OK</span>
                          <span className="font-mono">{m.success}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-destructive">✗ Ошибки</span>
                          <span className="font-mono">{m.errors}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </HydraCardContent>

      {/* Gone model dialog */}
      <Dialog open={!!goneModel} onOpenChange={(open) => !open && setGoneModel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-destructive" />
              Модель удалена
            </DialogTitle>
            <DialogDescription>
              Модель <strong>{goneModel?.displayName}</strong> была навсегда удалена из сервиса ProxyAPI (HTTP 410 Gone).
              Она больше не доступна для запросов. Скрыть её из каталога?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Оставить</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmRemove}>
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

function LogRow({ log }: { log: LogEntry }) {
  const modelShort = log.model_id.replace('proxyapi/', '');
  const date = new Date(log.created_at);
  const timeStr = `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  const tokens = (log.tokens_input || log.tokens_output)
    ? `${log.tokens_input || 0}/${log.tokens_output || 0}`
    : '—';

  const statusColor = log.status === 'success' ? 'text-emerald-400'
    : log.status === 'gone' ? 'text-destructive'
    : log.status === 'timeout' ? 'text-amber-500'
    : log.status === 'fallback' ? 'text-blue-400'
    : 'text-destructive';

  const statusExpl = STATUS_EXPLANATIONS[log.status];
  const typeExpl = STATUS_EXPLANATIONS[log.request_type];

  return (
    <tr className="border-b border-border/50 hover:bg-card/50">
      <td className="py-1.5 pr-3 font-medium truncate max-w-[140px]">{modelShort}</td>
      <td className="py-1.5 pr-3">
        {typeExpl ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dotted border-muted-foreground/40">{log.request_type}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px]">
              <p className="text-xs">{typeExpl.description}</p>
            </TooltipContent>
          </Tooltip>
        ) : log.request_type}
      </td>
      <td className={cn("py-1.5 pr-3", statusColor)}>
        {statusExpl ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help border-b border-dotted border-current">{log.status}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[250px]">
              <p className="text-xs font-medium mb-1">{statusExpl.label}</p>
              <p className="text-xs text-muted-foreground">{statusExpl.description}</p>
              {log.error_message && <p className="text-xs text-destructive mt-1">Ошибка: {log.error_message}</p>}
            </TooltipContent>
          </Tooltip>
        ) : log.status}
      </td>
      <td className="py-1.5 pr-3 text-right font-mono">{log.latency_ms ?? '—'}ms</td>
      <td className="py-1.5 pr-3 text-right font-mono">{tokens}</td>
      <td className="py-1.5 text-right text-muted-foreground">{timeStr}</td>
    </tr>
  );
}

function ModelRow({
  model,
  testResult,
  isTesting,
  onTest,
  onRemove,
}: {
  model: ModelRegistryEntry;
  testResult?: TestResult;
  isTesting: boolean;
  onTest: () => void;
  onRemove?: () => void;
}) {
  const isDeprecated = model.displayName.includes('⚠️');
  const creatorProvider = model.creator.includes('OpenAI') ? 'openai'
    : model.creator.includes('Anthropic') ? 'anthropic'
    : model.creator.includes('Google') ? 'gemini'
    : model.creator.includes('DeepSeek') ? 'deepseek'
    : model.provider;

  const Logo = PROVIDER_LOGOS[creatorProvider];
  const color = PROVIDER_COLORS[creatorProvider];
  const pricing = typeof model.pricing === 'object' ? `${model.pricing.input}/${model.pricing.output}` : model.pricing;

  const testStatusExpl = testResult ? STATUS_EXPLANATIONS[testResult.status] : null;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors",
      isDeprecated && "opacity-60"
    )}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {Logo && <Logo className={cn("h-4 w-4 flex-shrink-0", color)} />}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{model.displayName}</p>
          <p className="text-xs text-muted-foreground">{pricing}</p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-1 flex-shrink-0">
        {model.strengths.slice(0, 3).map(s => (
          <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">
            {STRENGTH_LABELS[s]?.ru || s}
          </Badge>
        ))}
      </div>

      {testResult && (
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-2 flex-shrink-0 text-xs">
            {testResult.status === 'success' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{testResult.latency_ms}ms</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  <p className="text-xs">{testStatusExpl?.description}</p>
                  {testResult.tokens && <p className="text-xs text-muted-foreground mt-1">Токены: {testResult.tokens.input}/{testResult.tokens.output}</p>}
                </TooltipContent>
              </Tooltip>
            ) : testResult.status === 'gone' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <WifiOff className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-destructive">410 Gone</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p className="text-xs">{testStatusExpl?.description}</p>
                </TooltipContent>
              </Tooltip>
            ) : testResult.status === 'timeout' ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-amber-500">Таймаут</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p className="text-xs">{testStatusExpl?.description}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-destructive truncate max-w-[100px]">{testResult.error}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px]">
                  <p className="text-xs font-medium mb-1">Ошибка</p>
                  <p className="text-xs text-muted-foreground">{testStatusExpl?.description}</p>
                  {testResult.error && <p className="text-xs text-destructive mt-1">{testResult.error}</p>}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      )}

      {onRemove && (
        <Button
          size="sm"
          variant="ghost"
          className="flex-shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          title="Убрать из списка"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="flex-shrink-0 h-8 w-8 p-0"
        onClick={onTest}
        disabled={isTesting}
        title="Тест модели"
      >
        {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  );
}
