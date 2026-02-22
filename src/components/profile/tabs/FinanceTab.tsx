import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Loader2, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ProviderSpend {
  provider: string;
  requests: number;
  tokensIn: number;
  tokensOut: number;
  estimatedCost: number;
}

// Rough price per 1M tokens
const PRICE_MAP: Record<string, { input: number; output: number }> = {
  openai: { input: 2.5, output: 10.0 },
  anthropic: { input: 3.0, output: 15.0 },
  gemini: { input: 1.25, output: 5.0 },
  google: { input: 1.25, output: 5.0 },
  deepseek: { input: 0.14, output: 0.28 },
  mistral: { input: 0.3, output: 0.9 },
  groq: { input: 0.05, output: 0.08 },
  xai: { input: 2.0, output: 10.0 },
  openrouter: { input: 0.5, output: 1.5 },
  proxyapi: { input: 0.5, output: 1.5 },
};

export function FinanceTab() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProviderSpend[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Aggregate from messages metadata + proxy_api_logs
      const [msgRes, proxyRes] = await Promise.all([
        supabase.from('messages').select('model_name, metadata').eq('user_id', user.id).eq('role', 'assistant'),
        supabase.from('proxy_api_logs').select('model_id, provider, tokens_input, tokens_output, status').eq('user_id', user.id),
      ]);

      const providerMap: Record<string, ProviderSpend> = {};

      const ensure = (key: string) => {
        if (!providerMap[key]) providerMap[key] = { provider: key, requests: 0, tokensIn: 0, tokensOut: 0, estimatedCost: 0 };
        return providerMap[key];
      };

      // Messages
      for (const msg of msgRes.data || []) {
        const meta = msg.metadata as any;
        if (!meta) continue;
        const provider = (meta.provider as string) || inferProvider(msg.model_name || '');
        const p = ensure(provider);
        p.requests++;
        p.tokensIn += meta.prompt_tokens || 0;
        p.tokensOut += meta.completion_tokens || 0;
      }

      // Proxy logs
      for (const log of proxyRes.data || []) {
        if (log.status !== 'success') continue;
        const p = ensure(log.provider || 'proxyapi');
        p.requests++;
        p.tokensIn += log.tokens_input || 0;
        p.tokensOut += log.tokens_output || 0;
      }

      // Calculate costs
      for (const p of Object.values(providerMap)) {
        const prices = PRICE_MAP[p.provider] || { input: 1.0, output: 3.0 };
        p.estimatedCost = (p.tokensIn * prices.input + p.tokensOut * prices.output) / 1_000_000;
      }

      setData(Object.values(providerMap).sort((a, b) => b.estimatedCost - a.estimatedCost));
    } catch (err) {
      console.error('Finance fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalCost = data.reduce((s, d) => s + d.estimatedCost, 0);
  const totalRequests = data.reduce((s, d) => s + d.requests, 0);
  const totalTokens = data.reduce((s, d) => s + d.tokensIn + d.tokensOut, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <HydraCard variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><DollarSign className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Расход (оценка)' : 'Est. Spend'}</p>
              <p className="text-xl font-bold">${totalCost.toFixed(4)}</p>
            </div>
          </div>
        </HydraCard>
        <HydraCard variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-hydra-accent/10"><TrendingUp className="h-5 w-5 text-hydra-accent" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Запросов' : 'Requests'}</p>
              <p className="text-xl font-bold">{totalRequests.toLocaleString()}</p>
            </div>
          </div>
        </HydraCard>
        <HydraCard variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-hydra-guide/10"><Wallet className="h-5 w-5 text-hydra-guide" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Токенов' : 'Tokens'}</p>
              <p className="text-xl font-bold">{(totalTokens / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </HydraCard>
      </div>

      {/* Breakdown table */}
      <HydraCard variant="glass" className="p-6">
        <HydraCardHeader>
          <TrendingDown className="h-5 w-5 text-primary" />
          <HydraCardTitle>{language === 'ru' ? 'Расходы по провайдерам' : 'Spend by Provider'}</HydraCardTitle>
        </HydraCardHeader>
        <HydraCardContent>
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {language === 'ru' ? 'Нет данных об использовании' : 'No usage data yet'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ru' ? 'Провайдер' : 'Provider'}</TableHead>
                  <TableHead className="text-right">{language === 'ru' ? 'Запросы' : 'Requests'}</TableHead>
                  <TableHead className="text-right">{language === 'ru' ? 'Токены (вх)' : 'Tokens (in)'}</TableHead>
                  <TableHead className="text-right">{language === 'ru' ? 'Токены (вых)' : 'Tokens (out)'}</TableHead>
                  <TableHead className="text-right">{language === 'ru' ? 'Расход $' : 'Cost $'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(row => (
                  <TableRow key={row.provider}>
                    <TableCell className="font-medium capitalize">{row.provider}</TableCell>
                    <TableCell className="text-right">{row.requests.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.tokensIn.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.tokensOut.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">${row.estimatedCost.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </HydraCardContent>
      </HydraCard>
    </div>
  );
}

function inferProvider(model: string): string {
  if (model.includes('gpt') || model.includes('o3') || model.includes('o1')) return 'openai';
  if (model.includes('claude')) return 'anthropic';
  if (model.includes('gemini')) return 'google';
  if (model.includes('grok')) return 'xai';
  if (model.includes('deepseek')) return 'deepseek';
  if (model.includes('mistral') || model.includes('mixtral')) return 'mistral';
  if (model.includes('llama') || model.includes('groq')) return 'groq';
  return 'other';
}
