import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, BarChart3, Coins, TrendingUp, Hash } from 'lucide-react';

// Price per 1M tokens (in USD)
const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  // Lovable AI / Google models
  'google/gemini-2.5-pro': { input: 1.25, output: 5.0 },
  'google/gemini-2.5-flash': { input: 0.075, output: 0.3 },
  'google/gemini-2.5-flash-lite': { input: 0.01875, output: 0.075 },
  'google/gemini-3-pro-preview': { input: 1.25, output: 5.0 },
  'google/gemini-3-flash-preview': { input: 0.1, output: 0.4 },
  // OpenAI models via Lovable AI
  'openai/gpt-5': { input: 2.5, output: 10.0 },
  'openai/gpt-5-mini': { input: 0.15, output: 0.6 },
  'openai/gpt-5-nano': { input: 0.1, output: 0.4 },
  'openai/gpt-5.2': { input: 3.0, output: 12.0 },
  // Personal API models
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
  'claude-3-5-sonnet': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku': { input: 0.25, output: 1.25 },
  'claude-3-opus': { input: 15.0, output: 75.0 },
  'grok-2': { input: 2.0, output: 10.0 },
  'grok-beta': { input: 5.0, output: 15.0 },
};

interface ModelUsage {
  model: string;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

interface MessageMetadata {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  provider?: string;
}

function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const prices = MODEL_PRICES[model] || { input: 0.5, output: 1.5 };
  return (promptTokens * prices.input + completionTokens * prices.output) / 1_000_000;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

export function UsageStats() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [totals, setTotals] = useState({
    requests: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  });

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user]);

  const fetchUsageData = async () => {
    if (!user) return;

    try {
      // Fetch all messages with token metadata
      const { data: messages, error } = await supabase
        .from('messages')
        .select('model_name, metadata')
        .eq('user_id', user.id)
        .not('model_name', 'is', null);

      if (error) throw error;

      // Aggregate by model
      const usageByModel: Record<string, ModelUsage> = {};

      for (const msg of messages || []) {
        const model = msg.model_name || 'unknown';
        const metadata = msg.metadata as MessageMetadata | null;
        
        const promptTokens = metadata?.prompt_tokens || 0;
        const completionTokens = metadata?.completion_tokens || 0;
        const totalTokens = metadata?.total_tokens || (promptTokens + completionTokens);

        if (!usageByModel[model]) {
          usageByModel[model] = {
            model,
            requestCount: 0,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            estimatedCost: 0,
          };
        }

        usageByModel[model].requestCount += 1;
        usageByModel[model].promptTokens += promptTokens;
        usageByModel[model].completionTokens += completionTokens;
        usageByModel[model].totalTokens += totalTokens;
        usageByModel[model].estimatedCost += calculateCost(model, promptTokens, completionTokens);
      }

      // Sort by total tokens (descending)
      const sortedUsage = Object.values(usageByModel).sort((a, b) => b.totalTokens - a.totalTokens);
      setModelUsage(sortedUsage);

      // Calculate totals
      const totalStats = sortedUsage.reduce(
        (acc, m) => ({
          requests: acc.requests + m.requestCount,
          promptTokens: acc.promptTokens + m.promptTokens,
          completionTokens: acc.completionTokens + m.completionTokens,
          totalTokens: acc.totalTokens + m.totalTokens,
          estimatedCost: acc.estimatedCost + m.estimatedCost,
        }),
        { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 }
      );
      setTotals(totalStats);
    } catch (error: unknown) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (modelUsage.length === 0) {
    return (
      <HydraCard variant="glass" className="p-6">
        <HydraCardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('profile.noUsageData')}</p>
        </HydraCardContent>
      </HydraCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HydraCard variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.requestCount')}</p>
              <p className="text-2xl font-bold">{totals.requests.toLocaleString()}</p>
            </div>
          </div>
        </HydraCard>

        <HydraCard variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.totalTokens')}</p>
              <p className="text-2xl font-bold">{formatNumber(totals.totalTokens)}</p>
            </div>
          </div>
        </HydraCard>

        <HydraCard variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <BarChart3 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.inputTokens')}</p>
              <p className="text-xl font-semibold">{formatNumber(totals.promptTokens)}</p>
            </div>
          </div>
        </HydraCard>

        <HydraCard variant="glass" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Coins className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.estimatedCost')}</p>
              <p className="text-2xl font-bold">${totals.estimatedCost.toFixed(2)}</p>
            </div>
          </div>
        </HydraCard>
      </div>

      {/* Usage by Model */}
      <HydraCard variant="glass" className="p-6">
        <HydraCardHeader>
          <BarChart3 className="h-5 w-5 text-primary" />
          <HydraCardTitle>{t('profile.byModel')}</HydraCardTitle>
        </HydraCardHeader>
        <HydraCardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">{t('settings.modelSettings')}</TableHead>
                  <TableHead className="text-right">{t('profile.requestCount')}</TableHead>
                  <TableHead className="text-right">{t('profile.inputTokens')}</TableHead>
                  <TableHead className="text-right">{t('profile.outputTokens')}</TableHead>
                  <TableHead className="text-right">{t('profile.totalTokens')}</TableHead>
                  <TableHead className="text-right">{t('profile.estimatedCost')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelUsage.map((usage, index) => (
                  <TableRow key={usage.model}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index === 0 && <span className="text-amber-500">🏆</span>}
                        <span className="truncate max-w-[180px]" title={usage.model}>
                          {usage.model}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{usage.requestCount}</TableCell>
                    <TableCell className="text-right">{formatNumber(usage.promptTokens)}</TableCell>
                    <TableCell className="text-right">{formatNumber(usage.completionTokens)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNumber(usage.totalTokens)}</TableCell>
                    <TableCell className="text-right text-amber-500">${usage.estimatedCost.toFixed(3)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </HydraCardContent>
      </HydraCard>
    </div>
  );
}
