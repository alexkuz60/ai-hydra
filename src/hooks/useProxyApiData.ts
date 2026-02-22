import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getAllRegistryEntries, type ModelRegistryEntry } from '@/config/modelRegistry';
import { useCloudSettings } from '@/hooks/useCloudSettings';
import {
  type ProxyApiCatalogModel,
  type PingResult,
  type TestResult,
  type LogEntry,
  type ProxyApiSettings,
  type AnalyticsEntry,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  USER_MODELS_KEY,
} from '@/components/profile/proxyapi/types';

export function useProxyApiData(hasKey: boolean) {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [pinging, setPinging] = useState(false);
  const { value: cloudTestResults, update: updateCloudTestResults } = useCloudSettings<Record<string, TestResult>>(
    'proxyapi-test-results', {}, 'proxyapi_test_results',
  );
  const testResults = cloudTestResults;
  const setTestResults = useCallback((updater: Record<string, TestResult> | ((prev: Record<string, TestResult>) => Record<string, TestResult>)) => {
    updateCloudTestResults(updater as any);
  }, [updateCloudTestResults]);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  // Cloud-synced settings
  const { value: cloudSettings, update: updateCloudSettings, loaded: settingsLoaded } = useCloudSettings<ProxyApiSettings>(
    'proxyapi-settings', DEFAULT_SETTINGS, SETTINGS_KEY,
  );
  const { value: cloudHidden, update: updateCloudHidden } = useCloudSettings<string[]>(
    'proxyapi-hidden-models', [], 'proxyapi_hidden_models',
  );
  const { value: cloudUserModels, update: updateCloudUserModels } = useCloudSettings<string[]>(
    'proxyapi-user-models', [], USER_MODELS_KEY,
  );

  // Derived state from cloud values
  const settings = cloudSettings;
  const setSettings = useCallback((val: ProxyApiSettings | ((prev: ProxyApiSettings) => ProxyApiSettings)) => {
    updateCloudSettings(val as any);
  }, [updateCloudSettings]);

  const hiddenModels = useMemo(() => new Set(cloudHidden), [cloudHidden]);
  const userModelIds = useMemo(() => new Set(cloudUserModels), [cloudUserModels]);

  const [goneModel, setGoneModel] = useState<ModelRegistryEntry | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [proxyCatalog, setProxyCatalog] = useState<ProxyApiCatalogModel[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [massTestRunning, setMassTestRunning] = useState(false);
  const [massTestProgress, setMassTestProgress] = useState({ done: 0, total: 0 });
  const [logsRefreshTrigger, setLogsRefreshTrigger] = useState(0);

  // ── Derived ────────────────────────────────────────
  const proxyModels = getAllRegistryEntries().filter(m => m.provider === 'proxyapi' && !hiddenModels.has(m.id));

  const filteredCatalogModels = useMemo(() => {
    if (!catalogSearch.trim()) return [];
    const q = catalogSearch.toLowerCase();
    return proxyCatalog.filter(m =>
      !userModelIds.has(m.id) &&
      (m.id.toLowerCase().includes(q) || m.owned_by.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [catalogSearch, proxyCatalog, userModelIds]);

  const userAddedModels = useMemo(() => {
    return proxyCatalog.filter(m => userModelIds.has(m.id));
  }, [proxyCatalog, userModelIds]);

  const analyticsData: AnalyticsEntry[] = useMemo(() => {
    const byModel: Record<string, AnalyticsEntry> = {};
    logs.forEach(log => {
      if (log.request_type === 'ping') return;
      const key = log.model_id.replace('proxyapi/', '');
      if (!byModel[key]) byModel[key] = { model: key, rawModelId: log.model_id, total: 0, success: 0, errors: 0, avgLatency: 0, latencies: [] };
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

  // ── Callbacks ──────────────────────────────────────
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
      if (!resp.ok) { setCatalogLoading(false); return; }
      const data = await resp.json();
      if (data.models) {
        setProxyCatalog(data.models as ProxyApiCatalogModel[]);
        setCatalogLoaded(true);
      }
    } catch { /* silent */ } finally {
      setCatalogLoading(false);
    }
  }, [user, catalogLoaded]);

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
    } catch { /* silent */ } finally {
      setLogsLoading(false);
    }
  }, [user]);

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
      setTestResults(prev => ({ ...prev, [modelId]: { status: 'error', latency_ms: 0, error: 'Network error' } }));
    } finally {
      setTestingModel(null);
    }
  }, [user, fetchLogs]);

  const handleMassTest = useCallback(async () => {
    if (!user || massTestRunning) return;
    const allModels = [...proxyModels.map(m => m.id), ...userAddedModels.map(m => m.id)];
    if (allModels.length === 0) return;
    setMassTestRunning(true);
    setMassTestProgress({ done: 0, total: allModels.length });
    const { data: { session } } = await supabase.auth.getSession();
    for (let i = 0; i < allModels.length; i++) {
      const modelId = allModels[i];
      setTestingModel(modelId);
      try {
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
      } catch {
        setTestResults(prev => ({ ...prev, [modelId]: { status: 'error', latency_ms: 0, error: 'Network error' } }));
      }
      setMassTestProgress({ done: i + 1, total: allModels.length });
    }
    setTestingModel(null);
    setMassTestRunning(false);
    fetchLogs();
  }, [user, massTestRunning, proxyModels, userAddedModels, fetchLogs]);

  const addUserModel = useCallback((modelId: string) => {
    updateCloudUserModels(prev => [...new Set([...prev, modelId])]);
    setCatalogSearch('');
  }, [updateCloudUserModels]);

  const removeUserModel = useCallback(async (modelId: string) => {
    updateCloudUserModels(prev => prev.filter(id => id !== modelId));
    if (user) {
      try {
        await supabase.from('proxy_api_logs').delete().eq('user_id', user.id).eq('model_id', modelId);
        setLogsRefreshTrigger(prev => prev + 1);
      } catch { /* silent */ }
    }
  }, [updateCloudUserModels, user]);

  const deleteModelStats = useCallback(async (rawModelId: string, displayModel: string) => {
    if (user) {
      try {
        await supabase.from('proxy_api_logs').delete().eq('user_id', user.id).eq('model_id', rawModelId);
      } catch { /* silent */ }
    }
    // Also remove from user list if applicable
    updateCloudUserModels(prev => {
      const key = prev.includes(displayModel) ? displayModel
        : prev.find(id => id === displayModel || id.endsWith(`/${displayModel}`)) || null;
      return key ? prev.filter(id => id !== key) : prev;
    });
    setLogsRefreshTrigger(prev => prev + 1);
  }, [user, updateCloudUserModels]);

  const handleConfirmRemove = useCallback(() => {
    if (!goneModel) return;
    updateCloudHidden(prev => [...new Set([...prev, goneModel.id])]);
    setGoneModel(null);
  }, [goneModel, updateCloudHidden]);

  const handleExportCSV = useCallback(() => {
    if (logs.length === 0) return;
    const headers = ['Дата', 'Модель', 'Тип', 'Статус', 'Латенси (ms)', 'Токены вход', 'Токены выход', 'Ошибка'];
    const rows = logs.map(l => [
      new Date(l.created_at).toISOString(), l.model_id, l.request_type, l.status,
      l.latency_ms ?? '', l.tokens_input ?? '', l.tokens_output ?? '', l.error_message ?? '',
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

  // ── Effects ────────────────────────────────────────
  useEffect(() => {
    if (hasKey && user && !catalogLoaded) fetchCatalog();
  }, [hasKey, user, catalogLoaded, fetchCatalog]);

  useEffect(() => {
    if (hasKey && user) fetchLogs();
  }, [hasKey, user, fetchLogs, logsRefreshTrigger]);

  // Settings are now auto-synced via useCloudSettings

  return {
    // State
    pingResult, pinging,
    testResults, testingModel,
    goneModel, setGoneModel,
    logs, logsLoading,
    settings, setSettings, settingsLoaded,
    catalogSearch, setCatalogSearch,
    proxyCatalog, catalogLoading, catalogLoaded,
    massTestRunning, massTestProgress,
    userModelIds,
    // Derived
    proxyModels, filteredCatalogModels, userAddedModels, analyticsData,
    // Actions
    handlePing, handleTestModel, handleMassTest,
    addUserModel, removeUserModel, deleteModelStats,
    handleConfirmRemove, handleExportCSV,
    fetchCatalog, fetchLogs,
  };
}
