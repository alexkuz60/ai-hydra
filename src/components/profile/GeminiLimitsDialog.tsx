import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Info, Zap, ExternalLink } from 'lucide-react';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

// Static free-tier limits (as of Dec 2025 update)
const GEMINI_FREE_LIMITS = [
  { model: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', rpm: 5, rpd: 100, tpm: 250_000, context: '1M' },
  { model: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', rpm: 10, rpd: 250, tpm: 250_000, context: '1M' },
  { model: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', rpm: 10, rpd: 500, tpm: 250_000, context: '1M' },
];

interface TestResult {
  model: string;
  status: 'idle' | 'testing' | 'ok' | 'quota' | 'error';
  latency?: number;
  error?: string;
}

interface GeminiLimitsDialogProps {
  hasKey: boolean;
}

export function GeminiLimitsDialog({ hasKey }: GeminiLimitsDialogProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<TestResult[]>(
    GEMINI_FREE_LIMITS.map(m => ({ model: m.model, status: 'idle' }))
  );
  const [testing, setTesting] = useState(false);

  const GeminiLogo = PROVIDER_LOGOS['gemini'];
  const geminiColor = PROVIDER_COLORS['gemini'];

  const testModels = async () => {
    if (!hasKey) return;
    setTesting(true);

    // Get the Gemini API key from vault
    const { data: keysData } = await supabase.rpc('get_my_api_keys');
    const apiKey = keysData?.[0]?.google_gemini_api_key;

    if (!apiKey) {
      setTesting(false);
      return;
    }

    const newResults: TestResult[] = [...results];

    for (let i = 0; i < GEMINI_FREE_LIMITS.length; i++) {
      const limit = GEMINI_FREE_LIMITS[i];
      newResults[i] = { model: limit.model, status: 'testing' };
      setResults([...newResults]);

      const start = Date.now();
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${limit.model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Say "ok"' }] }],
              generationConfig: { maxOutputTokens: 5 },
            }),
          }
        );
        const latency = Date.now() - start;

        if (res.ok) {
          newResults[i] = { model: limit.model, status: 'ok', latency };
        } else if (res.status === 429) {
          const body = await res.json().catch(() => ({}));
          newResults[i] = {
            model: limit.model,
            status: 'quota',
            latency,
            error: body?.error?.message || 'Quota exceeded',
          };
        } else {
          const body = await res.json().catch(() => ({}));
          newResults[i] = {
            model: limit.model,
            status: 'error',
            latency,
            error: body?.error?.message || `HTTP ${res.status}`,
          };
        }
      } catch (err: any) {
        newResults[i] = {
          model: limit.model,
          status: 'error',
          error: err.message || 'Network error',
        };
      }
      setResults([...newResults]);
    }

    setTesting(false);
  };

  const statusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'testing': return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'ok': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'quota': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
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
        <span className="text-amber-500 font-medium" title={r.error}>
          429 — {language === 'ru' ? 'Квота исчерпана' : 'Quota exceeded'}
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {GeminiLogo && <GeminiLogo className={cn("h-4 w-4", geminiColor)} />}
          <Zap className="h-3.5 w-3.5" />
          {language === 'ru' ? 'Лимиты Gemini' : 'Gemini Limits'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {GeminiLogo && <GeminiLogo className={cn("h-5 w-5", geminiColor)} />}
            {language === 'ru' ? 'Лимиты бесплатного API Google Gemini' : 'Google Gemini Free Tier Limits'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="test" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="test">
              {language === 'ru' ? 'Тест доступности' : 'Availability Test'}
            </TabsTrigger>
            <TabsTrigger value="reference">
              {language === 'ru' ? 'Справка по лимитам' : 'Limits Reference'}
            </TabsTrigger>
          </TabsList>

          {/* ─── Availability Test ─── */}
          <TabsContent value="test" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'ru'
                ? 'Отправляет мини-запрос к каждой модели для проверки доступности и текущей квоты.'
                : 'Sends a minimal request to each model to check availability and current quota status.'}
            </p>

            <Button
              onClick={testModels}
              disabled={testing || !hasKey}
              size="sm"
              className="gap-2"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {language === 'ru' ? 'Проверить все модели' : 'Test All Models'}
            </Button>

            {!hasKey && (
              <p className="text-xs text-amber-500">
                {language === 'ru' ? 'Сначала добавьте API-ключ Google Gemini выше.' : 'Add your Google Gemini API key first.'}
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
                  {results.map((r, i) => (
                    <tr key={r.model} className={cn("border-b last:border-0", r.status === 'quota' && "bg-amber-500/5")}>
                      <td className="p-3 font-mono text-xs">{GEMINI_FREE_LIMITS[i].name}</td>
                      <td className="p-3 flex items-center gap-2">
                        {statusIcon(r.status)}
                        {statusLabel(r)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ─── Static Reference ─── */}
          <TabsContent value="reference" className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border">
              <Info className="h-4 w-4 mt-0.5 text-sky-400 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                {language === 'ru'
                  ? 'Данные актуальны на февраль 2026 (после сокращения квот в декабре 2025). Лимиты действуют per-project, сброс — в полночь по тихоокеанскому времени (PT).'
                  : 'Data as of February 2026 (post December 2025 quota reduction). Limits are per-project, daily reset at midnight Pacific Time.'}
              </p>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Модель' : 'Model'}</th>
                    <th className="text-center p-3 font-medium">RPM</th>
                    <th className="text-center p-3 font-medium">RPD</th>
                    <th className="text-center p-3 font-medium">TPM</th>
                    <th className="text-center p-3 font-medium">{language === 'ru' ? 'Контекст' : 'Context'}</th>
                  </tr>
                </thead>
                <tbody>
                  {GEMINI_FREE_LIMITS.map(m => (
                    <tr key={m.model} className="border-b last:border-0">
                      <td className="p-3">
                        <span className="font-medium">{m.name}</span>
                        <span className="block text-xs text-muted-foreground font-mono">{m.model}</span>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="secondary">{m.rpm}</Badge>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="secondary">{m.rpd.toLocaleString()}</Badge>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="secondary">{(m.tpm / 1000).toFixed(0)}K</Badge>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="outline">{m.context}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>RPM</strong> — {language === 'ru' ? 'запросов в минуту' : 'Requests Per Minute'}</p>
              <p><strong>RPD</strong> — {language === 'ru' ? 'запросов в день' : 'Requests Per Day'}</p>
              <p><strong>TPM</strong> — {language === 'ru' ? 'токенов в минуту' : 'Tokens Per Minute'}</p>
            </div>

            <a
              href="https://ai.google.dev/gemini-api/docs/rate-limits"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {language === 'ru' ? 'Официальная документация Google' : 'Official Google Docs'}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
