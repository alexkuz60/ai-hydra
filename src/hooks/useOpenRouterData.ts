import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSettings } from '@/hooks/useCloudSettings';
import { PERSONAL_KEY_MODELS } from '@/hooks/useAvailableModels';
import type { LogEntry, AnalyticsEntry } from '@/components/profile/proxyapi/types';

export interface OpenRouterTestResult {
  model: string;
  name: string;
  status: 'idle' | 'testing' | 'ok' | 'quota' | 'no_credits' | 'not_found' | 'error';
  latency?: number;
  error?: string;
}

export interface OpenRouterKeyInfo {
  label: string;
  is_free_tier: boolean;
  usage_daily: number;
  usage_monthly: number;
  limit: number | null;
  limit_remaining: number | null;
}

const OPENROUTER_FREE_MODELS = PERSONAL_KEY_MODELS.filter(
  m => m.provider === 'openrouter' && m.id.includes(':free')
);

const OPENROUTER_PAID_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
];

export const ALL_OPENROUTER_MODELS = [
  ...OPENROUTER_FREE_MODELS.map(m => ({ id: m.id, name: m.name, free: true })),
  ...OPENROUTER_PAID_MODELS.map(m => ({ ...m, free: false })),
];

export function useOpenRouterData(hasKey: boolean) {
  const { user } = useAuth();

  // Ping / connection status
  const [pingResult, setPingResult] = useState<{ status: string; latency_ms: number; error?: string } | null>(null);
  const [pinging, setPinging] = useState(false);

  // Model test results (persisted in cloud)
  const { value: testResults, update: updateTestResults } = useCloudSettings<OpenRouterTestResult[]>(
    'openrouter-test-results',
    ALL_OPENROUTER_MODELS.map(m => ({ model: m.id, name: m.name, status: 'idle' as const })),
    'openrouter_test_results',
  );
  const [testing, setTesting] = useState(false);

  // Key info
  const [keyInfo, setKeyInfo] = useState<OpenRouterKeyInfo | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

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

  const getApiKey = useCallback(async (): Promise<string | null> => {
    const { data } = await supabase.rpc('get_my_api_keys');
    return data?.[0]?.openrouter_api_key || null;
  }, []);

  // Ping = fetch key info from /api/v1/key
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

  const testModels = useCallback(async () => {
    if (!hasKey || testing) return;
    setTesting(true);
    const apiKey = await getApiKey();
    if (!apiKey) { setTesting(false); return; }

    const newResults: OpenRouterTestResult[] = ALL_OPENROUTER_MODELS.map(m => ({
      model: m.id, name: m.name, status: 'idle' as const,
    }));

    for (let i = 0; i < ALL_OPENROUTER_MODELS.length; i++) {
      const m = ALL_OPENROUTER_MODELS[i];
      newResults[i] = { model: m.id, name: m.name, status: 'testing' };
      updateTestResults([...newResults]);

      const start = Date.now();
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: m.id,
            messages: [{ role: 'user', content: 'Say ok' }],
            max_tokens: 5,
          }),
        });
        const latency = Date.now() - start;

        if (res.ok) {
          newResults[i] = { model: m.id, name: m.name, status: 'ok', latency };
        } else if (res.status === 429) {
          newResults[i] = { model: m.id, name: m.name, status: 'quota', latency, error: 'Rate limited' };
        } else if (res.status === 402) {
          newResults[i] = { model: m.id, name: m.name, status: 'no_credits', latency, error: 'Insufficient credits' };
        } else if (res.status === 404) {
          newResults[i] = { model: m.id, name: m.name, status: 'not_found', latency, error: 'Model not found' };
        } else {
          const body = await res.json().catch(() => ({}));
          newResults[i] = { model: m.id, name: m.name, status: 'error', latency, error: body?.error?.message || `HTTP ${res.status}` };
        }
      } catch (err: any) {
        newResults[i] = { model: m.id, name: m.name, status: 'error', error: err.message || 'Network error' };
      }
      updateTestResults([...newResults]);
    }
    setTesting(false);
  }, [hasKey, testing, getApiKey, updateTestResults]);

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
    fetchLogs();
  }, [user, fetchLogs]);

  // Auto-fetch on mount
  useEffect(() => {
    if (hasKey && user) {
      fetchKeyInfo();
      fetchLogs();
    }
  }, [hasKey, user, fetchKeyInfo, fetchLogs]);

  return {
    pingResult, pinging, handlePing,
    testResults, testing, testModels,
    keyInfo, keyLoading, fetchKeyInfo,
    logs, logsLoading, fetchLogs,
    analyticsData, handleExportCSV, deleteModelStats,
  };
}
