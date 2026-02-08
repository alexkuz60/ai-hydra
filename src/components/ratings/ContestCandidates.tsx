import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Brain, Key, Check, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS, useAvailableModels, type ModelOption } from '@/hooks/useAvailableModels';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { CandidateDetail } from './CandidateDetail';

const PROVIDER_LABELS: Record<string, { ru: string; en: string }> = {
  lovable: { ru: 'Lovable AI', en: 'Lovable AI' },
  openai: { ru: 'OpenAI', en: 'OpenAI' },
  anthropic: { ru: 'Anthropic', en: 'Anthropic' },
  gemini: { ru: 'Google Gemini', en: 'Google Gemini' },
  xai: { ru: 'xAI (Grok)', en: 'xAI (Grok)' },
  openrouter: { ru: 'OpenRouter', en: 'OpenRouter' },
  groq: { ru: 'Groq', en: 'Groq' },
  deepseek: { ru: 'DeepSeek', en: 'DeepSeek' },
  mistral: { ru: 'Mistral AI', en: 'Mistral AI' },
};

// Build a flat list of all models with availability info
function useAllModels() {
  const { isAdmin, personalModels, loading } = useAvailableModels();
  const availablePersonalIds = new Set(personalModels.map(m => m.id));
  const isLovableAvailable = isAdmin;

  const allModels: Array<{ model: ModelOption; isAvailable: boolean; section: 'lovable' | 'byok' }> = useMemo(() => {
    const result: Array<{ model: ModelOption; isAvailable: boolean; section: 'lovable' | 'byok' }> = [];
    for (const m of LOVABLE_AI_MODELS) {
      result.push({ model: m, isAvailable: isLovableAvailable, section: 'lovable' });
    }
    for (const m of PERSONAL_KEY_MODELS) {
      result.push({ model: m, isAvailable: availablePersonalIds.has(m.id), section: 'byok' });
    }
    return result;
  }, [isLovableAvailable, availablePersonalIds]);

  return { allModels, loading, isLovableAvailable, availablePersonalIds };
}

function ModelRow({ model, isAvailable, isActive, onClick }: { model: ModelOption; isAvailable: boolean; isActive: boolean; onClick: () => void }) {
  const providerColor = PROVIDER_COLORS[model.provider] || 'text-muted-foreground';
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-2 rounded-lg transition-colors text-left",
        isActive
          ? "bg-primary/10 text-primary"
          : isAvailable ? "hover:bg-muted/30" : "opacity-50 hover:bg-muted/10"
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Brain className={cn("h-4 w-4 shrink-0", providerColor)} />
        <span className="text-sm font-medium truncate">{model.name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isAvailable ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}

function ProviderHeader({ provider, hasKey, loading, language }: {
  provider: string; hasKey: boolean; loading: boolean; language: string;
}) {
  const Logo = PROVIDER_LOGOS[provider];
  const label = PROVIDER_LABELS[provider]?.[language === 'ru' ? 'ru' : 'en'] || provider;
  const color = PROVIDER_COLORS[provider];

  return (
    <div className="flex items-center gap-2 w-full">
      {Logo && (
        <div className={cn("shrink-0", color)}>
          <Logo className="h-4 w-4" />
        </div>
      )}
      <span className={cn("text-xs font-medium uppercase tracking-wider", color)}>{label}</span>
      {!loading && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(
              "w-2 h-2 rounded-full shrink-0",
              hasKey ? "bg-green-500" : "bg-muted-foreground/40"
            )} />
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {hasKey
              ? (language === 'ru' ? 'API-ключ настроен' : 'API key configured')
              : (language === 'ru' ? 'API-ключ не найден' : 'No API key found')}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function ContestCandidates() {
  const { language } = useLanguage();
  const { allModels, loading, isLovableAvailable, availablePersonalIds } = useAllModels();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const isRu = language === 'ru';

  const selectedEntry = allModels.find(e => e.model.id === selectedModelId);

  // Filter
  const filtered = useMemo(() => {
    if (!search) return allModels;
    const q = search.toLowerCase();
    return allModels.filter(e => e.model.name.toLowerCase().includes(q) || e.model.id.toLowerCase().includes(q));
  }, [allModels, search]);

  const lovableModels = filtered.filter(e => e.section === 'lovable');
  const byokGrouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const e of filtered.filter(e => e.section === 'byok')) {
      (groups[e.model.provider] ??= []).push(e);
    }
    return groups;
  }, [filtered]);

  return (
    <TooltipProvider delayDuration={300}>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Master: candidate list */}
        <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
          <div className="h-full flex flex-col">
            {/* Search & summary */}
            <div className="p-3 border-b border-border space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isRu ? 'Поиск модели...' : 'Search model...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              {!loading && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {isRu ? `${filtered.length} из ${allModels.length}` : `${filtered.length} of ${allModels.length}`}
                  </span>
                  <span className="text-hydra-cyan font-medium">
                    {(isLovableAvailable ? LOVABLE_AI_MODELS.length : 0) + availablePersonalIds.size} {isRu ? 'доступно' : 'available'}
                  </span>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {/* Lovable AI section */}
                {lovableModels.length > 0 && (
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors group">
                      <div className="flex items-center gap-2">
                        {PROVIDER_LOGOS.lovable && <PROVIDER_LOGOS.lovable className="h-4 w-4 text-hydra-cyan" />}
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider group-hover:text-foreground">
                          Lovable AI
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/70">{lovableModels.length}</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-0.5 pt-0.5 pb-1">
                      {lovableModels.map(e => (
                        <div key={e.model.id} className="pl-4">
                          <ModelRow
                            model={e.model}
                            isAvailable={e.isAvailable}
                            isActive={selectedModelId === e.model.id}
                            onClick={() => setSelectedModelId(e.model.id)}
                          />
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* BYOK sections by provider */}
                {Object.entries(byokGrouped).map(([provider, entries]) => {
                  const hasKey = entries.some(e => e.isAvailable);
                  return (
                    <Collapsible key={provider} defaultOpen={hasKey}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors group">
                        <ProviderHeader provider={provider} hasKey={hasKey} loading={loading} language={language} />
                        <span className="text-[10px] text-muted-foreground/70">{entries.length}</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-0.5 pt-0.5 pb-1">
                        {entries.map(e => (
                          <div key={e.model.id} className="pl-4">
                            <ModelRow
                              model={e.model}
                              isAvailable={e.isAvailable}
                              isActive={selectedModelId === e.model.id}
                              onClick={() => setSelectedModelId(e.model.id)}
                            />
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Detail panel */}
        <ResizablePanel defaultSize={65} minSize={40}>
          {selectedEntry ? (
            <CandidateDetail model={selectedEntry.model} isAvailable={selectedEntry.isAvailable} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {isRu ? 'Выберите модель для просмотра карточки' : 'Select a model to view details'}
                </p>
              </div>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
