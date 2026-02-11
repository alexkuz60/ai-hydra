import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Info, Zap, ExternalLink, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const SCRAPE_MODES = [
  { mode: 'scrape', name: 'Scrape (Page)', endpoint: '/v1/scrape', description: { ru: 'Извлечение контента одной страницы', en: 'Extract content from a single page' } },
  { mode: 'crawl', name: 'Crawl (Site)', endpoint: '/v1/crawl', description: { ru: 'Рекурсивный обход всего сайта', en: 'Recursively crawl an entire website' } },
  { mode: 'map', name: 'Map (Sitemap)', endpoint: '/v1/map', description: { ru: 'Быстрое обнаружение всех URL сайта', en: 'Fast discovery of all URLs on a site' } },
  { mode: 'search', name: 'Search (Web)', endpoint: '/v1/search', description: { ru: 'Поиск в вебе с извлечением контента', en: 'Web search with content scraping' } },
];

const SCRAPE_FORMATS = [
  { format: 'markdown', description: { ru: 'Чистый текст для LLM', en: 'Clean LLM-ready text' } },
  { format: 'html', description: { ru: 'Обработанный HTML', en: 'Processed HTML' } },
  { format: 'links', description: { ru: 'Все ссылки на странице', en: 'All links on the page' } },
  { format: 'screenshot', description: { ru: 'Скриншот страницы (base64)', en: 'Page screenshot (base64)' } },
  { format: 'json', description: { ru: 'Структурированные данные (LLM)', en: 'Structured data extraction (LLM)' } },
  { format: 'branding', description: { ru: 'Цвета, шрифты, логотипы', en: 'Colors, fonts, logos' } },
  { format: 'summary', description: { ru: 'AI-резюме страницы', en: 'AI-generated page summary' } },
];

interface TestResult {
  mode: string;
  name: string;
  status: 'idle' | 'testing' | 'ok' | 'quota' | 'error';
  latency?: number;
  error?: string;
}

interface FirecrawlLimitsDialogProps {
  hasKey: boolean;
}

export function FirecrawlLimitsDialog({ hasKey }: FirecrawlLimitsDialogProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<TestResult[]>(
    SCRAPE_MODES.map(m => ({ mode: m.mode, name: m.name, status: 'idle' }))
  );
  const [testing, setTesting] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  const testModes = async () => {
    if (!hasKey) return;
    setTesting(true);

    const { data } = await supabase.rpc('get_my_api_keys');
    const apiKey = data?.[0]?.firecrawl_api_key;
    if (!apiKey) { setTesting(false); return; }

    const newResults: TestResult[] = [...results];

    for (let i = 0; i < SCRAPE_MODES.length; i++) {
      const m = SCRAPE_MODES[i];
      newResults[i] = { mode: m.mode, name: m.name, status: 'testing' };
      setResults([...newResults]);

      const start = Date.now();
      try {
        let body: any;
        if (m.mode === 'scrape') {
          body = { url: 'https://example.com', formats: ['markdown'], onlyMainContent: true };
        } else if (m.mode === 'crawl') {
          body = { url: 'https://example.com', limit: 1 };
        } else if (m.mode === 'map') {
          body = { url: 'https://example.com', limit: 5 };
        } else {
          body = { query: 'test', limit: 1 };
        }

        const res = await fetch(`https://api.firecrawl.dev${m.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });
        const latency = Date.now() - start;

        if (res.ok) {
          newResults[i] = { mode: m.mode, name: m.name, status: 'ok', latency };
        } else if (res.status === 429) {
          newResults[i] = { mode: m.mode, name: m.name, status: 'quota', latency, error: 'Rate limited' };
        } else if (res.status === 402) {
          newResults[i] = { mode: m.mode, name: m.name, status: 'quota', latency, error: 'Credits exhausted' };
        } else {
          const b = await res.json().catch(() => ({}));
          newResults[i] = {
            mode: m.mode, name: m.name, status: 'error', latency,
            error: b?.error || b?.message || `HTTP ${res.status}`,
          };
        }
      } catch (err: any) {
        newResults[i] = { mode: m.mode, name: m.name, status: 'error', error: err.message || 'Network error' };
      }
      setResults([...newResults]);
    }

    setTesting(false);
  };

  const fetchAccountInfo = async () => {
    if (!hasKey) return;
    setAccountLoading(true);
    try {
      const { data } = await supabase.rpc('get_my_api_keys');
      const apiKey = data?.[0]?.firecrawl_api_key;
      if (!apiKey) { setAccountLoading(false); return; }

      const res = await fetch('https://api.firecrawl.dev/v1/team/credit-usage', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const json = await res.json();
        setAccountInfo(json);
      }
    } catch (err) {
      console.error('Failed to fetch Firecrawl account info', err);
    } finally {
      setAccountLoading(false);
    }
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
          {language === 'ru' ? 'Доступен' : 'Available'} ({r.latency}ms)
        </span>
      );
      case 'quota': return (
        <span className="text-amber-500 font-medium">
          {r.error || (language === 'ru' ? 'Лимит исчерпан' : 'Rate limited')}
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
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && hasKey && !accountInfo) fetchAccountInfo(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4 text-orange-500" />
          <Zap className="h-3.5 w-3.5" />
          {language === 'ru' ? 'Лимиты Firecrawl' : 'Firecrawl Limits'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-orange-500" />
            {language === 'ru' ? 'Firecrawl — проверка режимов' : 'Firecrawl — Mode Check'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="test" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="test">
              {language === 'ru' ? 'Тест режимов' : 'Mode Test'}
            </TabsTrigger>
            <TabsTrigger value="reference">
              {language === 'ru' ? 'Справка' : 'Reference'}
            </TabsTrigger>
          </TabsList>

          {/* ─── Mode Test ─── */}
          <TabsContent value="test" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'ru'
                ? 'Отправляет мини-запрос к каждому режиму Firecrawl для проверки доступности с вашим ключом.'
                : 'Sends a minimal request to each Firecrawl mode to check availability with your key.'}
            </p>

            <Button onClick={testModes} disabled={testing || !hasKey} size="sm" className="gap-2">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {language === 'ru' ? 'Проверить все режимы' : 'Test All Modes'}
            </Button>

            {!hasKey && (
              <p className="text-xs text-amber-500">
                {language === 'ru' ? 'Сначала добавьте API-ключ Firecrawl выше.' : 'Add your Firecrawl API key first.'}
              </p>
            )}

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Режим' : 'Mode'}</th>
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Статус' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.mode} className={cn(
                      "border-b last:border-0",
                      r.status === 'quota' && "bg-amber-500/5",
                    )}>
                      <td className="p-3">
                        <span className="font-medium">{r.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {SCRAPE_MODES.find(m => m.mode === r.mode)?.description[language] || ''}
                        </span>
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

            {/* Account credit info */}
            {accountInfo && (
              <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
                <p className="text-sm font-medium">{language === 'ru' ? 'Кредиты аккаунта' : 'Account Credits'}</p>
                <pre className="text-xs text-muted-foreground overflow-auto max-h-32">
                  {JSON.stringify(accountInfo, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>

          {/* ─── Reference ─── */}
          <TabsContent value="reference" className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div className="text-xs text-muted-foreground space-y-2">
                <p>
                  {language === 'ru'
                    ? 'Firecrawl предоставляет API для скраппинга, поиска и обхода веб-страниц. Бесплатный план включает 500 кредитов (≈500 страниц scrape).'
                    : 'Firecrawl provides APIs for scraping, searching, and crawling web pages. Free plan includes 500 credits (≈500 scrape pages).'}
                </p>
              </div>
            </div>

            {/* Scrape Modes */}
            <h4 className="text-sm font-semibold mt-4">
              {language === 'ru' ? 'Режимы извлечения' : 'Extraction Modes'}
            </h4>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Режим' : 'Mode'}</th>
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Кредиты' : 'Credits'}</th>
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Описание' : 'Description'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Scrape</td>
                    <td className="p-3"><Badge variant="secondary">1 / стр.</Badge></td>
                    <td className="p-3 text-muted-foreground text-xs">{language === 'ru' ? 'Одна веб-страница' : 'Single web page'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Crawl</td>
                    <td className="p-3"><Badge variant="secondary">1 / стр.</Badge></td>
                    <td className="p-3 text-muted-foreground text-xs">{language === 'ru' ? 'Рекурсивный обход сайта' : 'Recursive site crawl'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Map</td>
                    <td className="p-3"><Badge variant="secondary">1</Badge></td>
                    <td className="p-3 text-muted-foreground text-xs">{language === 'ru' ? 'Карта URL сайта (до 5000)' : 'Site URL map (up to 5000)'}</td>
                  </tr>
                  <tr className="border-b last:border-0">
                    <td className="p-3 font-medium">Search</td>
                    <td className="p-3"><Badge variant="secondary">1 / рез.</Badge></td>
                    <td className="p-3 text-muted-foreground text-xs">{language === 'ru' ? 'Веб-поиск + скраппинг' : 'Web search + scraping'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Scrape Formats */}
            <h4 className="text-sm font-semibold mt-4">
              {language === 'ru' ? 'Форматы извлечения (scrape)' : 'Scrape Formats'}
            </h4>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Формат' : 'Format'}</th>
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Описание' : 'Description'}</th>
                  </tr>
                </thead>
                <tbody>
                  {SCRAPE_FORMATS.map(f => (
                    <tr key={f.format} className="border-b last:border-0">
                      <td className="p-3">
                        <Badge variant="outline" className="font-mono text-xs">{f.format}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{f.description[language]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Free plan limits */}
            <h4 className="text-sm font-semibold mt-4">
              {language === 'ru' ? 'Бесплатный план' : 'Free Plan'}
            </h4>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Параметр' : 'Parameter'}</th>
                    <th className="text-left p-3 font-medium">{language === 'ru' ? 'Значение' : 'Value'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 text-muted-foreground">{language === 'ru' ? 'Кредиты' : 'Credits'}</td>
                    <td className="p-3"><Badge variant="secondary">500</Badge></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 text-muted-foreground">{language === 'ru' ? 'Лимит скорости' : 'Rate Limit'}</td>
                    <td className="p-3"><Badge variant="secondary">{language === 'ru' ? '~10 запр./мин' : '~10 req/min'}</Badge></td>
                  </tr>
                  <tr className="border-b last:border-0">
                    <td className="p-3 text-muted-foreground">{language === 'ru' ? 'Макс. глубина crawl' : 'Max Crawl Depth'}</td>
                    <td className="p-3"><Badge variant="secondary">2</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <a
              href="https://docs.firecrawl.dev/introduction"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {language === 'ru' ? 'Документация Firecrawl' : 'Firecrawl Docs'}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
