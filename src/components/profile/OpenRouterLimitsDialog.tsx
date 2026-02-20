import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Info, Zap, ExternalLink, CreditCard } from 'lucide-react';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { PERSONAL_KEY_MODELS } from '@/hooks/useAvailableModels';

// All OpenRouter models from useAvailableModels
const OPENROUTER_FREE_MODELS = PERSONAL_KEY_MODELS.filter(
  m => m.provider === 'openrouter' && m.id.includes(':free')
);

const OPENROUTER_PAID_MODELS: { id: string; name: string }[] = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
];

const ALL_OPENROUTER_MODELS = [
  ...OPENROUTER_FREE_MODELS.map(m => ({ id: m.id, name: m.name, free: true })),
  ...OPENROUTER_PAID_MODELS.map(m => ({ ...m, free: false })),
];

// Static info about OpenRouter free tier
const FREE_TIER_INFO = {
  rpm: 20,
  rpd: 200,
  note_ru: 'Бесплатные модели (с суффиксом :free) имеют общий лимит. Точные лимиты зависят от нагрузки на модель.',
  note_en: 'Free models (with :free suffix) share a common limit. Exact limits depend on model load.',
};

interface TestResult {
  model: string;
  name: string;
  status: 'idle' | 'testing' | 'ok' | 'quota' | 'not_found' | 'error';
  latency?: number;
  error?: string;
}

interface KeyInfo {
  label: string;
  is_free_tier: boolean;
  usage_daily: number;
  usage_monthly: number;
  limit: number | null;
  limit_remaining: number | null;
}

interface OpenRouterLimitsDialogProps {
  hasKey: boolean;
}

export function OpenRouterLimitsDialog({ hasKey }: OpenRouterLimitsDialogProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<TestResult[]>(
    ALL_OPENROUTER_MODELS.map(m => ({ model: m.id, name: m.name, status: 'idle' }))
  );
  const [testing, setTesting] = useState(false);
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);

  const Logo = PROVIDER_LOGOS['openrouter'];
  const color = PROVIDER_COLORS['openrouter'];

  const getApiKey = async (): Promise<string | null> => {
    const { data } = await supabase.rpc('get_my_api_keys');
    return data?.[0]?.openrouter_api_key || null;
  };

  const fetchKeyInfo = async () => {
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
    } catch {
      // silent
    } finally {
      setKeyLoading(false);
    }
  };

  const testModels = async () => {
    if (!hasKey) return;
    setTesting(true);

    const apiKey = await getApiKey();
    if (!apiKey) { setTesting(false); return; }

    const newResults: TestResult[] = [...results];

    for (let i = 0; i < ALL_OPENROUTER_MODELS.length; i++) {
      const m = ALL_OPENROUTER_MODELS[i];
      newResults[i] = { model: m.id, name: m.name, status: 'testing' };
      setResults([...newResults]);

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
        } else if (res.status === 404) {
          newResults[i] = { model: m.id, name: m.name, status: 'not_found', latency, error: 'Model not found' };
        } else {
          const body = await res.json().catch(() => ({}));
          newResults[i] = {
            model: m.id, name: m.name, status: 'error', latency,
            error: body?.error?.message || `HTTP ${res.status}`,
          };
        }
      } catch (err: any) {
        newResults[i] = { model: m.id, name: m.name, status: 'error', error: err.message || 'Network error' };
      }
      setResults([...newResults]);
    }

    setTesting(false);
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && hasKey && !keyInfo) {
      fetchKeyInfo();
    }
  };

  const statusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'testing': return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'ok': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'quota': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'not_found': return <XCircle className="h-4 w-4 text-muted-foreground" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <span className="h-4 w-4" />;
    }
  };

  const statusLabel = (r: TestResult) => {
    switch (r.status) {
      case 'idle': return <span className="text-muted-foreground">—</span>;
      case 'testing': return <span className="text-muted-foreground">{language === 'ru' ? 'Проверка...' : 'Testing...'}</span>;
      case 'ok': return (
        <span className="text-emerald-500 font-medium">
          {language === 'ru' ? 'Доступна' : 'Available'} ({r.latency}ms)
        </span>
      );
      case 'quota': return (
        <span className="text-amber-500 font-medium">
          429 — {language === 'ru' ? 'Лимит исчерпан' : 'Rate limited'}
        </span>
      );
      case 'not_found': return (
        <span className="text-muted-foreground font-medium">
          404 — {language === 'ru' ? 'Модель не найдена' : 'Not found'}
        </span>
      );
      case 'error': return (
        <span className="text-destructive font-medium" title={r.error}>
          {language === 'ru' ? 'Ошибка' : 'Error'}: {r.error?.slice(0, 60)}
        </span>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {Logo && <Logo className={cn("h-4 w-4", color)} />}
          <Zap className="h-3.5 w-3.5" />
          {language === 'ru' ? 'Лимиты OpenRouter' : 'OpenRouter Limits'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Logo && <Logo className={cn("h-5 w-5", color)} />}
            {language === 'ru' ? 'OpenRouter — диагностика' : 'OpenRouter — Diagnostics'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="test" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="test">
              {language === 'ru' ? 'Тест доступности' : 'Availability Test'}
            </TabsTrigger>
            <TabsTrigger value="account">
              {language === 'ru' ? 'Статус ключа' : 'Key Status'}
            </TabsTrigger>
          </TabsList>

          {/* ─── Availability Test ─── */}
          <TabsContent value="test" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'ru'
                ? 'Отправляет мини-запрос к бесплатным и популярным платным моделям для проверки доступности ключа.'
                : 'Sends a minimal request to free and popular paid models to check key availability.'}
            </p>

            <Button onClick={testModels} disabled={testing || !hasKey} size="sm" className="gap-2">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {language === 'ru' ? 'Проверить все модели' : 'Test All Models'}
            </Button>

            {!hasKey && (
              <p className="text-xs text-amber-500">
                {language === 'ru' ? 'Сначала добавьте API-ключ OpenRouter выше.' : 'Add your OpenRouter API key first.'}
              </p>
            )}

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Модель' : 'Model'}</th>
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Статус' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => {
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
                            {modelMeta?.free ? 'free' : 'paid'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3 flex items-center gap-2">
                        {statusIcon(r.status)}
                        {statusLabel(r)}
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
                {language === 'ru' ? FREE_TIER_INFO.note_ru : FREE_TIER_INFO.note_en}
              </p>
            </div>
          </TabsContent>

          {/* ─── Key Status ─── */}
          <TabsContent value="account" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'ru'
                ? 'Информация о вашем API-ключе OpenRouter (запрос к /api/v1/key).'
                : 'Your OpenRouter API key information (from /api/v1/key).'}
            </p>

            <Button onClick={fetchKeyInfo} disabled={keyLoading || !hasKey} size="sm" className="gap-2">
              {keyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {language === 'ru' ? 'Обновить' : 'Refresh'}
            </Button>

            {keyInfo ? (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 text-muted-foreground font-medium">{language === 'ru' ? 'Метка ключа' : 'Key Label'}</td>
                      <td className="p-3">{keyInfo.label || '—'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 text-muted-foreground font-medium">{language === 'ru' ? 'Тип' : 'Tier'}</td>
                      <td className="p-3">
                        <Badge variant={keyInfo.is_free_tier ? 'secondary' : 'default'}>
                          {keyInfo.is_free_tier
                            ? (language === 'ru' ? 'Бесплатный' : 'Free')
                            : (language === 'ru' ? 'Платный' : 'Paid')}
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 text-muted-foreground font-medium">{language === 'ru' ? 'Использовано сегодня' : 'Used Today'}</td>
                      <td className="p-3">${keyInfo.usage_daily?.toFixed(4) ?? '0'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 text-muted-foreground font-medium">{language === 'ru' ? 'Использовано за месяц' : 'Used This Month'}</td>
                      <td className="p-3">${keyInfo.usage_monthly?.toFixed(4) ?? '0'}</td>
                    </tr>
                    {keyInfo.limit !== null && (
                      <>
                        <tr className="border-b">
                          <td className="p-3 text-muted-foreground font-medium">{language === 'ru' ? 'Лимит' : 'Limit'}</td>
                          <td className="p-3">${keyInfo.limit?.toFixed(2)}</td>
                        </tr>
                        <tr className="border-b last:border-0">
                          <td className="p-3 text-muted-foreground font-medium">{language === 'ru' ? 'Остаток' : 'Remaining'}</td>
                          <td className="p-3">${keyInfo.limit_remaining?.toFixed(4)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            ) : !hasKey ? (
              <p className="text-xs text-amber-500">
                {language === 'ru' ? 'Сначала добавьте API-ключ OpenRouter.' : 'Add your OpenRouter API key first.'}
              </p>
            ) : null}

            <a
              href="https://openrouter.ai/docs/api/reference/limits"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {language === 'ru' ? 'Документация OpenRouter' : 'OpenRouter Docs'}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
