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

const MISTRAL_MODELS = [
  { model: 'mistral-large-latest', name: 'Mistral Large' },
  { model: 'mistral-small-latest', name: 'Mistral Small' },
  { model: 'codestral-latest', name: 'Codestral' },
  { model: 'mistral-medium-latest', name: 'Mistral Medium' },
];

interface TestResult {
  model: string;
  name: string;
  status: 'idle' | 'testing' | 'ok' | 'quota' | 'error';
  latency?: number;
  error?: string;
}

interface MistralLimitsDialogProps {
  hasKey: boolean;
}

export function MistralLimitsDialog({ hasKey }: MistralLimitsDialogProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<TestResult[]>(
    MISTRAL_MODELS.map(m => ({ model: m.model, name: m.name, status: 'idle' }))
  );
  const [testing, setTesting] = useState(false);

  const Logo = PROVIDER_LOGOS['mistral'];
  const color = PROVIDER_COLORS['mistral'];

  const testModels = async () => {
    if (!hasKey) return;
    setTesting(true);

    const { data } = await supabase.rpc('get_my_api_keys');
    const apiKey = data?.[0]?.mistral_api_key;
    if (!apiKey) { setTesting(false); return; }

    const newResults: TestResult[] = [...results];

    for (let i = 0; i < MISTRAL_MODELS.length; i++) {
      const m = MISTRAL_MODELS[i];
      newResults[i] = { model: m.model, name: m.name, status: 'testing' };
      setResults([...newResults]);

      const start = Date.now();
      try {
        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: m.model,
            messages: [{ role: 'user', content: 'Say ok' }],
            max_tokens: 5,
          }),
        });
        const latency = Date.now() - start;

        if (res.ok) {
          newResults[i] = { model: m.model, name: m.name, status: 'ok', latency };
        } else if (res.status === 429) {
          newResults[i] = { model: m.model, name: m.name, status: 'quota', latency, error: 'Rate limited' };
        } else {
          const body = await res.json().catch(() => ({}));
          newResults[i] = {
            model: m.model, name: m.name, status: 'error', latency,
            error: body?.message || body?.detail || `HTTP ${res.status}`,
          };
        }
      } catch (err: any) {
        newResults[i] = { model: m.model, name: m.name, status: 'error', error: err.message || 'Network error' };
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
        <span className="text-amber-500 font-medium">
          429 — {language === 'ru' ? 'Лимит исчерпан' : 'Rate limited'}
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
          {Logo && <Logo className={cn("h-4 w-4", color)} />}
          <Zap className="h-3.5 w-3.5" />
          {language === 'ru' ? 'Лимиты Mistral' : 'Mistral Limits'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Logo && <Logo className={cn("h-5 w-5", color)} />}
            {language === 'ru' ? 'Mistral AI — проверка моделей' : 'Mistral AI — Model Check'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="test" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="test">
              {language === 'ru' ? 'Тест доступности' : 'Availability Test'}
            </TabsTrigger>
            <TabsTrigger value="reference">
              {language === 'ru' ? 'Справка' : 'Reference'}
            </TabsTrigger>
          </TabsList>

          {/* ─── Availability Test ─── */}
          <TabsContent value="test" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'ru'
                ? 'Отправляет мини-запрос к каждой модели Mistral для проверки доступности с вашим ключом.'
                : 'Sends a minimal request to each Mistral model to check availability with your key.'}
            </p>

            <Button onClick={testModels} disabled={testing || !hasKey} size="sm" className="gap-2">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {language === 'ru' ? 'Проверить все модели' : 'Test All Models'}
            </Button>

            {!hasKey && (
              <p className="text-xs text-amber-500">
                {language === 'ru' ? 'Сначала добавьте API-ключ Mistral выше.' : 'Add your Mistral API key first.'}
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
                  {results.map(r => (
                    <tr key={r.model} className={cn(
                      "border-b last:border-0",
                      r.status === 'quota' && "bg-amber-500/5",
                    )}>
                      <td className="p-3">
                        <span className="font-medium">{r.name}</span>
                        <span className="block text-xs text-muted-foreground font-mono">{r.model}</span>
                      </td>
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

          {/* ─── Reference ─── */}
          <TabsContent value="reference" className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div className="text-xs text-muted-foreground space-y-2">
                <p>
                  {language === 'ru'
                    ? 'Mistral AI предоставляет бесплатный доступ к API без ограничения по сроку действия ключа. Лимиты зависят от уровня использования (Usage Tier) вашего рабочего пространства.'
                    : 'Mistral AI provides free API access with no key expiration. Limits depend on your workspace Usage Tier.'}
                </p>
                <p>
                  {language === 'ru'
                    ? 'Лимиты задаются в RPS (запросов в секунду) и TPM (токенов в минуту) на уровне воркспейса. Бесплатный уровень: ~1 RPS, 500K TPM.'
                    : 'Limits are set as RPS (requests per second) and TPM (tokens per minute) at workspace level. Free tier: ~1 RPS, 500K TPM.'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Параметр' : 'Parameter'}</th>
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Бесплатный уровень' : 'Free Tier'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 text-muted-foreground">RPS</td>
                    <td className="p-3"><Badge variant="secondary">~1</Badge></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-muted-foreground">TPM</td>
                    <td className="p-3"><Badge variant="secondary">500K</Badge></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-muted-foreground">{language === 'ru' ? 'Срок ключа' : 'Key Expiry'}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                        {language === 'ru' ? 'Бессрочный' : 'Unlimited'}
                      </Badge>
                    </td>
                  </tr>
                  <tr className="border-b last:border-0">
                    <td className="p-3 text-muted-foreground">{language === 'ru' ? 'Стоимость' : 'Pricing'}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                        {language === 'ru' ? 'Бесплатно (для эксперим.)' : 'Free (experimental)'}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <a
              href="https://docs.mistral.ai/deployment/ai-studio/tier"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {language === 'ru' ? 'Документация Mistral AI' : 'Mistral AI Docs'}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
