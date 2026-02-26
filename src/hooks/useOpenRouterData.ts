import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSettings } from '@/hooks/useCloudSettings';
import { PERSONAL_KEY_MODELS } from '@/hooks/useAvailableModels';
import type { LogEntry, AnalyticsEntry, TestResult, ProxyApiCatalogModel } from '@/components/profile/proxyapi/types';

export interface OpenRouterKeyInfo {
  label: string;
  is_free_tier: boolean;
  usage_daily: number;
  usage_monthly: number;
  limit: number | null;
  limit_remaining: number | null;
}

export interface OpenRouterCatalogModel {
  id: string;
  name: string;
  pricing?: { prompt: string; completion: string };
  context_length?: number;
}

const OPENROUTER_REGISTRY_MODELS = PERSONAL_KEY_MODELS.filter(
  m => m.provider === 'openrouter'
);

export function useOpenRouterData(hasKey: boolean) {
  const { user } = useAuth();

  // Ping / connection status
  const [pingResult, setPingResult] = useState<{ status: string; latency_ms: number; error?: string } | null>(null);
  const [pinging, setPinging] = useState(false);

  // Key info
  const [keyInfo, setKeyInfo] = useState<OpenRouterKeyInfo | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);

  // Test results (persisted in cloud) — per-model like ProxyAPI
  const { value: testResults, update: updateTestResults } = useCloudSettings<Record<string, TestResult>>(
    'openrouter-test-results-v2', {}, 'openrouter_test_results_v2',
  );
  const setTestResults = useCallback((updater: Record<string, TestResult> | ((prev: Record<string, TestResult>) => Record<string, TestResult>)) => {
    updateTestResults(updater as any);
  }, [updateTestResults]);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [massTestRunning, setMassTestRunning] = useState(false);
  const [massTestProgress, setMassTestProgress] = useState({ done: 0, total: 0 });

  // Catalog
  const [catalog, setCatalog] = useState<OpenRouterCatalogModel[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // User-added models (cloud-synced)
  const { value: cloudUserModels, update: updateCloudUserModels } = useCloudSettings<string[]>(
    'openrouter-user-models', [], 'openrouter_user_models',
  );
  const userModelIds = useMemo(() => new Set(cloudUserModels), [cloudUserModels]);

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsRefreshTrigger, setLogsRefreshTrigger] = useState(0);

  // ── Derived ──
  const registryModels = OPENROUTER_REGISTRY_MODELS;

  const filteredCatalogModels = useMemo(() => {
    if (!catalogSearch.trim()) return [];
    const q = catalogSearch.toLowerCase();
    return catalog.filter(m =>
      !userModelIds.has(m.id) &&
      (m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [catalogSearch, catalog, userModelIds]);

  const userAddedModels = useMemo(() => {
    const catalogMap = new Map(catalog.map(m => [m.id, m]));
    return Array.from(userModelIds).map(id => {
      const cm = catalogMap.get(id);
      return { id, object: 'model', created: 0, owned_by: cm?.name || 'unknown' } as ProxyApiCatalogModel;
    });
  }, [catalog, userModelIds]);

  const analyticsData: AnalyticsEntry[] = useMemo(() => {
    const byModel: Record<string, AnalyticsEntry> = {};
    logs.forEach(log => {
      if (log.request_type === 'ping') return;
      const key = log.model_id;
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

  // ── API key helper ──
  const getApiKey = useCallback(async (): Promise<string | null> => {
    const { data } = await supabase.rpc('get_my_api_keys');
    return data?.[0]?.openrouter_api_key || null;
  }, []);

  // ── Ping ──
  const handlePing = useCallback(async () => {
    if (!hasKey) return;
    setPinging(true);
    setPingResult(null);
    const start = Date.now();
    try {
      const apiKey = await getApiKey();
      if (!apiKey) { setPinging(false); return; }
      const res = await fetch('https://openrouter.ai/api/v1/key', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const latency = Date.now() - start;
      if (res.ok) {
        const json = await res.json();
        setKeyInfo(json.data);
        setPingResult({ status: 'online', latency_ms: latency });
      } else {
        setPingResult({ status: 'error', latency_ms: latency, error: `HTTP ${res.status}` });
      }
    } catch (err: any) {
      setPingResult({ status: 'error', latency_ms: Date.now() - start, error: err.message || 'Network error' });
    } finally {
      setPinging(false);
    }
  }, [hasKey, getApiKey]);

  const fetchKeyInfo = useCallback(async () => {
    if (!hasKey) return;
    setKeyLoading(true);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) { setKeyLoading(false); return; }
      const res = await fetch('https://openrouter.ai/api/v1/key', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const json = await res.json();
        setKeyInfo(json.data);
      }
    } catch { /* silent */ } finally {
      setKeyLoading(false);
    }
  }, [hasKey, getApiKey]);

  // ── Catalog ──
  const fetchCatalog = useCallback(async (force = false) => {
    if (catalogLoaded && !force) return;
    setCatalogLoading(true);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models');
      if (res.ok) {
        const json = await res.json();
        const models = (json.data || []).map((m: any) => ({
          id: m.id,
          name: m.name || m.id,
          pricing: m.pricing,
          context_length: m.context_length,
        }));
        setCatalog(models);
        setCatalogLoaded(true);
      }
    } catch { /* silent */ } finally {
      setCatalogLoading(false);
    }
  }, [catalogLoaded]);

  // ── Per-model test (client-side via OpenRouter API) ──
  const handleTestModel = useCallback(async (modelId: string) => {
    if (!hasKey) return;
    setTestingModel(modelId);
    const start = Date.now();
    try {
      const apiKey = await getApiKey();
      if (!apiKey) { setTestingModel(null); return; }
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Say ok' }],
          max_tokens: 5,
        }),
      });
      const latency_ms = Date.now() - start;

      if (res.ok) {
        const json = await res.json();
        const usage = json.usage;
        setTestResults(prev => ({
          ...prev,
          [modelId]: {
            status: 'success',
            latency_ms,
            tokens: usage ? { input: usage.prompt_tokens || 0, output: usage.completion_tokens || 0 } : undefined,
          },
        }));
      } else if (res.status === 429) {
        setTestResults(prev => ({ ...prev, [modelId]: { status: 'timeout', latency_ms, error: 'Rate limited (429)' } }));
      } else if (res.status === 402) {
        setTestResults(prev => ({ ...prev, [modelId]: { status: 'error', latency_ms, error: 'No credits (402)' } }));
      } else if (res.status === 404) {
        setTestResults(prev => ({ ...prev, [modelId]: { status: 'gone', latency_ms, error: 'Not found (404)' } }));
      } else {
        const body = await res.json().catch(() => ({}));
        setTestResults(prev => ({ ...prev, [modelId]: { status: 'error', latency_ms, error: body?.error?.message || `HTTP ${res.status}` } }));
      }
    } catch (err: any) {
      setTestResults(prev => ({ ...prev, [modelId]: { status: 'error', latency_ms: Date.now() - start, error: err.message || 'Network error' } }));
    } finally {
      setTestingModel(null);
    }
  }, [hasKey, getApiKey, setTestResults]);

  // ── Mass test ──
  const handleMassTest = useCallback(async () => {
    if (!hasKey || massTestRunning) return;
    const allModels = [...registryModels.map(m => m.id), ...userAddedModels.map(m => m.id)];
    if (allModels.length === 0) return;
    setMassTestRunning(true);
    setMassTestProgress({ done: 0, total: allModels.length });
    const apiKey = await getApiKey();
    if (!apiKey) { setMassTestRunning(false); return; }

    for (let i = 0; i < allModels.length; i++) {
      const modelId = allModels[i];
      setTestingModel(modelId);
      const start = Date.now();
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: 'Say ok' }],
            max_tokens: 5,
          }),
        });
        const latency_ms = Date.now() - start;
        if (res.ok) {
          setTestResults(prev => ({ ...prev, [modelId]: { status: 'success', latency_ms } }));
        } else if (res.status === 429) {
          setTestResults(prev => ({ ...prev, [modelId]: { status: 'timeout', latency_ms, error: 'Rate limited' } }));
        } else if (res.status === 402) {
          setTestResults(prev => ({ ...prev, [modelId]: { status: 'error', latency_ms, error: 'No credits' } }));
        } else if (res.status === 404) {
          setTestResults(prev => ({ ...prev, [modelId]: { status: 'gone', latency_ms, error: 'Not found' } }));
        } else {
          setTestResults(prev => ({ ...prev, [modelId]: { status: 'error', latency_ms, error: `HTTP ${res.status}` } }));
        }
      } catch {
        setTestResults(prev => ({ ...prev, [modelId]: { status: 'error', latency_ms: 0, error: 'Network error' } }));
      }
      setMassTestProgress({ done: i + 1, total: allModels.length });
    }
    setTestingModel(null);
    setMassTestRunning(false);
  }, [hasKey, massTestRunning, registryModels, userAddedModels, getApiKey, setTestResults]);

  // ── User model management ──
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

  // ── Logs ──
  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('proxy_api_logs')
        .select('id, model_id, request_type, status, latency_ms, tokens_input, tokens_output, error_message, created_at')
        .eq('user_id', user.id)
        .eq('provider', 'openrouter')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setLogs((data as LogEntry[]) || []);
    } catch { /* silent */ } finally {
      setLogsLoading(false);
    }
  }, [user]);

  const handleExportCSV = useCallback(() => {
    if (logs.length === 0) return;
    const headers = ['Date', 'Model', 'Type', 'Status', 'Latency (ms)', 'Tokens In', 'Tokens Out', 'Error'];
    const rows = logs.map(l => [
      new Date(l.created_at).toISOString(), l.model_id, l.request_type, l.status,
      l.latency_ms ?? '', l.tokens_input ?? '', l.tokens_output ?? '', l.error_message ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openrouter-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const deleteModelStats = useCallback(async (rawModelId: string) => {
    if (user) {
      try {
        await supabase.from('proxy_api_logs').delete().eq('user_id', user.id).eq('model_id', rawModelId);
      } catch { /* silent */ }
    }
    updateCloudUserModels(prev => {
      const key = prev.find(id => id === rawModelId) || null;
      return key ? prev.filter(id => id !== key) : prev;
    });
    setLogsRefreshTrigger(prev => prev + 1);
  }, [user, updateCloudUserModels]);

  // ── Effects ──
  useEffect(() => {
    if (hasKey && user) {
      fetchKeyInfo();
      fetchLogs();
    }
  }, [hasKey, user, fetchKeyInfo, fetchLogs]);

  useEffect(() => {
    if (hasKey && user && !catalogLoaded) fetchCatalog();
  }, [hasKey, user, catalogLoaded, fetchCatalog]);

  useEffect(() => {
    if (hasKey && user) fetchLogs();
  }, [hasKey, user, fetchLogs, logsRefreshTrigger]);

  return {
    // Connection
    pingResult, pinging, handlePing,
    keyInfo, keyLoading, fetchKeyInfo,
    // Catalog
    catalog, catalogLoading, catalogLoaded, catalogSearch, setCatalogSearch,
    filteredCatalogModels, userAddedModels, userModelIds,
    registryModels,
    fetchCatalog,
    addUserModel, removeUserModel,
    // Tests
    testResults, testingModel, handleTestModel,
    massTestRunning, massTestProgress, handleMassTest,
    // Logs & analytics
    logs, logsLoading, fetchLogs,
    analyticsData, handleExportCSV, deleteModelStats,
  };
}
