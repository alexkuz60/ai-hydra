import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSettings } from '@/hooks/useCloudSettings';
import {
  type ProxyApiCatalogModel,
  type PingResult,
  type TestResult,
  type LogEntry,
  type ProxyApiSettings,
  type AnalyticsEntry,
  DEFAULT_SETTINGS,
} from '@/components/profile/proxyapi/types';

const DOTPOINT_SETTINGS_KEY = 'dotpoint_settings';
const DOTPOINT_USER_MODELS_KEY = 'dotpoint_user_models';

export function useDotPointData(hasKey: boolean) {
  const { user } = useAuth();

  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [pinging, setPinging] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testingModel, setTestingModel] = useState<string | null>(null);

  const { value: cloudSettings, update: updateCloudSettings, loaded: settingsLoaded } = useCloudSettings<ProxyApiSettings>(
    'dotpoint-settings', DEFAULT_SETTINGS, DOTPOINT_SETTINGS_KEY,
  );
  const { value: cloudUserModels, update: updateCloudUserModels } = useCloudSettings<string[]>(
    'dotpoint-user-models', [], DOTPOINT_USER_MODELS_KEY,
  );

  const settings = cloudSettings;
  const setSettings = useCallback((val: ProxyApiSettings | ((prev: ProxyApiSettings) => ProxyApiSettings)) => {
    updateCloudSettings(val as any);
  }, [updateCloudSettings]);

  const userModelIds = useMemo(() => new Set(cloudUserModels), [cloudUserModels]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [dotpointCatalog, setDotpointCatalog] = useState<ProxyApiCatalogModel[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [massTestRunning, setMassTestRunning] = useState(false);
  const [massTestProgress, setMassTestProgress] = useState({ done: 0, total: 0 });
  const [logsRefreshTrigger, setLogsRefreshTrigger] = useState(0);

  // All user-added models from the catalog
  const userAddedModels = useMemo(() => {
    return dotpointCatalog.filter(m => userModelIds.has(m.id));
  }, [dotpointCatalog, userModelIds]);

  const filteredCatalogModels = useMemo(() => {
    if (!catalogSearch.trim()) return [];
    const q = catalogSearch.toLowerCase();
    return dotpointCatalog.filter(m =>
      !userModelIds.has(m.id) &&
      (m.id.toLowerCase().includes(q) || m.owned_by.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [catalogSearch, dotpointCatalog, userModelIds]);

  const analyticsData: AnalyticsEntry[] = useMemo(() => {
    const byModel: Record<string, AnalyticsEntry> = {};
    logs.forEach(log => {
      if (log.request_type === 'ping') return;
      const key = log.model_id.replace('dotpoint/', '');
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

  const fetchCatalog = useCallback(async (force = false) => {
    if (!user || (catalogLoaded && !force)) return;
    setCatalogLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dotpoint-api-test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ action: 'models' }),
        }
      );
      if (!resp.ok) { setCatalogLoading(false); return; }
      const data = await resp.json();
      if (data.models) {
        setDotpointCatalog(data.models as ProxyApiCatalogModel[]);
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
        .eq('provider', 'dotpoint')
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dotpoint-api-test`,
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dotpoint-api-test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ action: 'test', model_id: modelId }),
        }
      );
      const data = await resp.json() as TestResult;
      setTestResults(prev => ({ ...prev, [modelId]: data }));
      fetchLogs();
    } catch {
      setTestResults(prev => ({ ...prev, [modelId]: { status: 'error', latency_ms: 0, error: 'Network error' } }));
    } finally {
      setTestingModel(null);
    }
  }, [user, fetchLogs]);

  const handleMassTest = useCallback(async () => {
    if (!user || massTestRunning) return;
    const allModels = userAddedModels.map(m => m.id);
    if (allModels.length === 0) return;
    setMassTestRunning(true);
    setMassTestProgress({ done: 0, total: allModels.length });
    const { data: { session } } = await supabase.auth.getSession();
    for (let i = 0; i < allModels.length; i++) {
      const modelId = allModels[i];
      setTestingModel(modelId);
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dotpoint-api-test`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
            body: JSON.stringify({ action: 'test', model_id: modelId }),
          }
        );
        const data = await resp.json() as TestResult;
        setTestResults(prev => ({ ...prev, [modelId]: data }));
      } catch {
        setTestResults(prev => ({ ...prev, [modelId]: { status: 'error', latency_ms: 0, error: 'Network error' } }));
      }
      setMassTestProgress({ done: i + 1, total: allModels.length });
    }
    setTestingModel(null);
    setMassTestRunning(false);
    fetchLogs();
  }, [user, massTestRunning, userAddedModels, fetchLogs]);

  const addUserModel = useCallback((modelId: string) => {
    updateCloudUserModels(prev => [...new Set([...prev, modelId])]);
    setCatalogSearch('');
  }, [updateCloudUserModels]);

  const deleteModelStats = useCallback(async (rawModelId: string, displayModel: string) => {
    if (user) {
      try {
        await supabase.from('proxy_api_logs').delete().eq('user_id', user.id).eq('model_id', rawModelId);
      } catch { /* silent */ }
    }
    updateCloudUserModels(prev => {
      const key = prev.includes(displayModel) ? displayModel
        : prev.find(id => id === displayModel || id.endsWith(`/${displayModel}`)) || null;
      return key ? prev.filter(id => id !== key) : prev;
    });
    setLogsRefreshTrigger(prev => prev + 1);
  }, [user, updateCloudUserModels]);

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
    a.download = `dotpoint-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  useEffect(() => {
    if (hasKey && user && !catalogLoaded) fetchCatalog();
  }, [hasKey, user, catalogLoaded, fetchCatalog]);

  useEffect(() => {
    if (hasKey && user) fetchLogs();
  }, [hasKey, user, fetchLogs, logsRefreshTrigger]);

  return {
    pingResult, pinging,
    testResults, testingModel,
    logs, logsLoading,
    settings, setSettings, settingsLoaded,
    catalogSearch, setCatalogSearch,
    dotpointCatalog, catalogLoading, catalogLoaded,
    massTestRunning, massTestProgress,
    userModelIds,
    userAddedModels, filteredCatalogModels, analyticsData,
    handlePing, handleTestModel, handleMassTest,
    addUserModel, deleteModelStats,
    handleExportCSV,
    fetchCatalog, fetchLogs,
  };
}
