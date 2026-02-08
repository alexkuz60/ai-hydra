import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Brain, Check, X, Search, ChevronsUpDown, Crown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS, useAvailableModels, type ModelOption } from '@/hooks/useAvailableModels';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

// ── Types ──

export interface ModelEntry {
  model: ModelOption;
  isAvailable: boolean;
  section: 'lovable' | 'byok';
}

// ── Hook: build flat list of all models ──

export function useAllModels() {
  const { isAdmin, personalModels, loading } = useAvailableModels();
  const availablePersonalIds = new Set(personalModels.map(m => m.id));
  const isLovableAvailable = isAdmin;

  const allModels: ModelEntry[] = useMemo(() => {
    const result: ModelEntry[] = [];
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

// ── Provider labels ──

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

// ── Sub-components ──

function ModelRow({ model, isAvailable, isActive, isOnPodium, isVeteran, onClick }: {
  model: ModelOption; isAvailable: boolean; isActive: boolean; isOnPodium?: boolean; isVeteran?: boolean; onClick: () => void;
}) {
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
      <div className="flex items-center gap-1.5 shrink-0">
        {isVeteran && <Activity className="h-3.5 w-3.5 text-hydra-cyan" />}
        {isOnPodium && <Crown className="h-3.5 w-3.5 text-amber-400" />}
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

// ── Main sidebar component ──

interface ModelListSidebarProps {
  selectedModelId: string | null;
  onSelect: (id: string) => void;
  /** Map of modelId -> role for podium crown indicators */
  contestModels?: Record<string, string>;
  /** Set of model IDs that have statistics data (veterans) */
  veteranModelIds?: Set<string>;
}

export function ModelListSidebar({ selectedModelId, onSelect, contestModels = {}, veteranModelIds }: ModelListSidebarProps) {
  const { language } = useLanguage();
  const { allModels, loading, isLovableAvailable, availablePersonalIds } = useAllModels();
  const [search, setSearch] = useState('');
  const [availFilter, setAvailFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [allExpanded, setAllExpanded] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const isRu = language === 'ru';

  const filtered = useMemo(() => {
    let list = allModels;
    if (availFilter === 'available') list = list.filter(e => e.isAvailable);
    else if (availFilter === 'unavailable') list = list.filter(e => !e.isAvailable);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => e.model.name.toLowerCase().includes(q) || e.model.id.toLowerCase().includes(q));
    }
    return list;
  }, [allModels, search, availFilter]);

  const lovableModels = filtered.filter(e => e.section === 'lovable');
  const byokGrouped = useMemo(() => {
    const groups: Record<string, ModelEntry[]> = {};
    for (const e of filtered.filter(e => e.section === 'byok')) {
      (groups[e.model.provider] ??= []).push(e);
    }
    return groups;
  }, [filtered]);

  const isGroupOpen = useCallback((key: string, defaultOpen: boolean) => {
    return openGroups[key] ?? (allExpanded ? true : defaultOpen);
  }, [openGroups, allExpanded]);

  const toggleGroup = useCallback((key: string, open: boolean) => {
    setOpenGroups(prev => ({ ...prev, [key]: open }));
  }, []);

  const toggleAll = useCallback(() => {
    const newState = !allExpanded;
    setAllExpanded(newState);
    setOpenGroups({});
  }, [allExpanded]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TooltipProvider delayDuration={300}>
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
                {veteranModelIds && veteranModelIds.size > 0 && (
                  <span className="ml-1.5 text-hydra-cyan">
                    <Activity className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                    {veteranModelIds.size}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-hydra-cyan font-medium">
                  {(isLovableAvailable ? LOVABLE_AI_MODELS.length : 0) + availablePersonalIds.size} {isRu ? 'доступно' : 'available'}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleAll}
                      className="p-0.5 rounded hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronsUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {allExpanded ? (isRu ? 'Свернуть все' : 'Collapse all') : (isRu ? 'Развернуть все' : 'Expand all')}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
          <div className="flex gap-1">
            {(['all', 'available', 'unavailable'] as const).map(f => (
              <button
                key={f}
                onClick={() => setAvailFilter(f)}
                className={cn(
                  "flex-1 text-[11px] py-1 px-1.5 rounded-md transition-colors",
                  availFilter === f
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/40"
                )}
              >
                {f === 'all' ? (isRu ? 'Все' : 'All')
                  : f === 'available' ? (isRu ? 'Доступные' : 'Available')
                  : (isRu ? 'Недоступные' : 'Unavailable')}
              </button>
            ))}
          </div>
        </div>

        {/* Model list */}
        <div className="flex-1 relative min-h-0">
          <div className="absolute inset-0 overflow-y-auto hydra-scrollbar">
            <div className="p-2 space-y-1">
              {/* Lovable AI section */}
              {lovableModels.length > 0 && (
                <Collapsible open={isGroupOpen('lovable', true)} onOpenChange={(o) => toggleGroup('lovable', o)}>
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
                          isOnPodium={e.model.id in contestModels}
                          isVeteran={veteranModelIds?.has(e.model.id)}
                          onClick={() => onSelect(e.model.id)}
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
                  <Collapsible key={provider} open={isGroupOpen(provider, hasKey)} onOpenChange={(o) => toggleGroup(provider, o)}>
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
                            isOnPodium={e.model.id in contestModels}
                            isVeteran={veteranModelIds?.has(e.model.id)}
                            onClick={() => onSelect(e.model.id)}
                          />
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
