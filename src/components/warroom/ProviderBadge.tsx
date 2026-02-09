import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw } from 'lucide-react';
import type { ProviderInfo, ProviderGateway } from '@/types/messages';
import { cn } from '@/lib/utils';

const GATEWAY_LABELS: Record<ProviderGateway, string> = {
  lovable_ai: 'Lovable AI',
  proxyapi: 'ProxyAPI',
  openrouter: 'OpenRouter',
  deepseek: 'DeepSeek',
  mistral: 'Mistral',
  groq: 'Groq',
};

const GATEWAY_COLORS: Record<ProviderGateway, string> = {
  lovable_ai: 'bg-primary/15 text-primary border-primary/25',
  proxyapi: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  openrouter: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  deepseek: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  mistral: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  groq: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
};

interface ProviderBadgeProps {
  providerInfo: ProviderInfo;
  className?: string;
}

export function ProviderBadge({ providerInfo, className }: ProviderBadgeProps) {
  const label = GATEWAY_LABELS[providerInfo.gateway] || providerInfo.gateway;
  const colorClass = GATEWAY_COLORS[providerInfo.gateway] || 'bg-muted text-muted-foreground border-border';
  const hasFallback = !!providerInfo.fallback_from;
  const fallbackLabel = providerInfo.fallback_from ? GATEWAY_LABELS[providerInfo.fallback_from] : '';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border',
            colorClass,
            className
          )}>
            {hasFallback && <RefreshCw className="h-2.5 w-2.5" />}
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs">
            {hasFallback
              ? `Запрос шёл через ${fallbackLabel}, но был перенаправлен на ${label} (${providerInfo.fallback_reason || 'ошибка'})`
              : `Ответ получен через ${label}`
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
