import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Wifi, WifiOff, Zap, Play, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { ProxyApiLogo, PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { cn } from '@/lib/utils';
import { getAllRegistryEntries, type ModelRegistryEntry, STRENGTH_LABELS } from '@/config/modelRegistry';

// ─── Types ─────────────────────────────────────────────

interface PingResult {
  status: 'online' | 'error' | 'timeout';
  latency_ms: number;
  model_count?: number;
  error?: string;
}

interface TestResult {
  status: 'success' | 'error' | 'timeout';
  latency_ms: number;
  content?: string;
  tokens?: { input: number; output: number };
  error?: string;
  details?: string;
}

// ─── Component ─────────────────────────────────────────

export function ProxyApiDashboard({ hasKey }: { hasKey: boolean }) {
  const { user } = useAuth();
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [pinging, setPinging] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testingModel, setTestingModel] = useState<string | null>(null);

  const proxyModels = getAllRegistryEntries().filter(m => m.provider === 'proxyapi');

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
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ action: 'ping' }),
        }
      );
      const data = await resp.json();
      setPingResult(data as PingResult);
    } catch {
      setPingResult({ status: 'error', latency_ms: 0, error: 'Network error' });
    } finally {
      setPinging(false);
    }
  }, [user]);

  const handleTestModel = useCallback(async (modelId: string) => {
    if (!user) return;
    setTestingModel(modelId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-api-test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ action: 'test', model_id: modelId }),
        }
      );
      const data = await resp.json();
      setTestResults(prev => ({ ...prev, [modelId]: data as TestResult }));
    } catch {
      setTestResults(prev => ({
        ...prev,
        [modelId]: { status: 'error', latency_ms: 0, error: 'Network error' },
      }));
    } finally {
      setTestingModel(null);
    }
  }, [user]);

  if (!hasKey) {
    return (
      <HydraCard variant="glass" className="p-6">
        <HydraCardHeader>
          <ProxyApiLogo className="h-5 w-5" />
          <HydraCardTitle>ProxyAPI Dashboard</HydraCardTitle>
        </HydraCardHeader>
        <HydraCardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Добавьте ключ ProxyAPI во вкладке «API-ключи» для доступа к дашборду.
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
        <Accordion type="multiple" defaultValue={['status', 'catalog']} className="space-y-2">
          {/* ── Status Section ── */}
          <AccordionItem value="status" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                <span className="font-semibold">Статус подключения</span>
                {pingResult && (
                  <StatusBadge status={pingResult.status} />
                )}
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
                    {pingResult.error && (
                      <span className="text-destructive text-xs">{pingResult.error}</span>
                    )}
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
                <Badge variant="secondary" className="ml-2">{proxyModels.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2">
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
        </Accordion>
      </HydraCardContent>
    </HydraCard>
  );
}

// ─── Sub-components ────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'online') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Онлайн</Badge>;
  if (status === 'timeout') return <Badge variant="destructive">Таймаут</Badge>;
  return <Badge variant="destructive">Ошибка</Badge>;
}

function ModelRow({
  model,
  testResult,
  isTesting,
  onTest,
}: {
  model: ModelRegistryEntry;
  testResult?: TestResult;
  isTesting: boolean;
  onTest: () => void;
}) {
  const isDeprecated = model.displayName.includes('⚠️');
  // Determine the "original" provider for the icon
  const creatorProvider = model.creator.includes('OpenAI') ? 'openai'
    : model.creator.includes('Anthropic') ? 'anthropic'
    : model.creator.includes('Google') ? 'gemini'
    : model.creator.includes('DeepSeek') ? 'deepseek'
    : 'proxyapi';

  const Logo = PROVIDER_LOGOS[creatorProvider];
  const color = PROVIDER_COLORS[creatorProvider];
  const pricing = typeof model.pricing === 'object' ? `${model.pricing.input}/${model.pricing.output}` : model.pricing;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors",
      isDeprecated && "opacity-60"
    )}>
      {/* Icon + Name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {Logo && <Logo className={cn("h-4 w-4 flex-shrink-0", color)} />}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{model.displayName}</p>
          <p className="text-xs text-muted-foreground">{pricing}</p>
        </div>
      </div>

      {/* Strengths */}
      <div className="hidden md:flex items-center gap-1 flex-shrink-0">
        {model.strengths.slice(0, 3).map(s => (
          <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">
            {STRENGTH_LABELS[s]?.ru || s}
          </Badge>
        ))}
      </div>

      {/* Test result */}
      {testResult && (
        <div className="flex items-center gap-2 flex-shrink-0 text-xs">
          {testResult.status === 'success' ? (
            <>
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">{testResult.latency_ms}ms</span>
            </>
          ) : testResult.status === 'timeout' ? (
            <>
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-amber-500">Таймаут</span>
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-destructive truncate max-w-[100px]">{testResult.error}</span>
            </>
          )}
        </div>
      )}

      {/* Test button */}
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
