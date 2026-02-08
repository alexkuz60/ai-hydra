import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVeteranModels } from '@/hooks/useModelDossier';
import { ModelDossier } from '@/components/ratings/ModelDossier';
import { getModelDisplayName, getModelInfo } from '@/hooks/useAvailableModels';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Search, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const PROVIDER_LABELS: Record<string, { ru: string; en: string }> = {
  lovable: { ru: 'Lovable AI', en: 'Lovable AI' },
  openai: { ru: 'OpenAI', en: 'OpenAI' },
  anthropic: { ru: 'Anthropic', en: 'Anthropic' },
  gemini: { ru: 'Google Gemini', en: 'Google Gemini' },
  xai: { ru: 'xAI', en: 'xAI' },
  openrouter: { ru: 'OpenRouter', en: 'OpenRouter' },
  groq: { ru: 'Groq', en: 'Groq' },
  deepseek: { ru: 'DeepSeek', en: 'DeepSeek' },
  mistral: { ru: 'Mistral AI', en: 'Mistral AI' },
};

const STORAGE_KEY = 'portfolio-provider-sections';

export function ModelPortfolio() {
  const { language } = useLanguage();
  const { veteranIds, loading } = useVeteranModels();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const isRu = language === 'ru';

  const filteredIds = veteranIds.filter(id => {
    if (!search) return true;
    const name = getModelDisplayName(id).toLowerCase();
    return name.includes(search.toLowerCase()) || id.toLowerCase().includes(search.toLowerCase());
  });

  // Group by provider
  const grouped = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const id of filteredIds) {
      const info = getModelInfo(id);
      const provider = info.provider || 'openai';
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(id);
    }
    return groups;
  }, [filteredIds]);

  const providerOrder = useMemo(() => 
    Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length),
  [grouped]);

  // Collapsible state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(openSections)); } catch {}
  }, [openSections]);

  const isSectionOpen = useCallback((provider: string) => {
    return openSections[provider] !== false; // default open
  }, [openSections]);

  const toggleSection = useCallback((provider: string) => {
    setOpenSections(prev => ({ ...prev, [provider]: !isSectionOpen(provider) }));
  }, [isSectionOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (veteranIds.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h2 className="text-lg font-semibold mb-2">
            {isRu ? 'Портфолио пусто' : 'Portfolio is empty'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Здесь появятся модели, которые уже участвовали в ваших задачах. Начните чат, чтобы заполнить портфолио.'
              : 'Models that have participated in your tasks will appear here. Start a chat to build your portfolio.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Master: model list */}
      <ResizablePanel defaultSize={40} minSize={25} maxSize={55}>
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">{isRu ? 'Кандидаты' : 'Candidates'}</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRu ? 'Поиск модели...' : 'Search model...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isRu ? `${filteredIds.length} из ${veteranIds.length} моделей` : `${filteredIds.length} of ${veteranIds.length} models`}
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {providerOrder.map(provider => {
                const ids = grouped[provider];
                const Logo = PROVIDER_LOGOS[provider];
                const color = PROVIDER_COLORS[provider] || 'text-muted-foreground';
                const label = PROVIDER_LABELS[provider]?.[isRu ? 'ru' : 'en'] || provider;
                const isOpen = isSectionOpen(provider);

                return (
                  <Collapsible key={provider} open={isOpen} onOpenChange={() => toggleSection(provider)}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors group">
                      <div className="flex items-center gap-2">
                        {Logo && <Logo className={cn("h-3.5 w-3.5", color)} />}
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground/70">{ids.length}</span>
                        {isOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-0.5 pt-0.5 pb-1">
                      {ids.map(id => {
                        const isActive = selectedModelId === id;
                        return (
                          <button
                            key={id}
                            onClick={() => setSelectedModelId(id)}
                            className={cn(
                              "w-full flex items-center gap-2.5 p-2 pl-8 rounded-lg transition-colors text-left",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted/30 text-foreground"
                            )}
                          >
                            <span className="text-sm font-medium truncate">
                              {getModelDisplayName(id)}
                            </span>
                          </button>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Detail: dossier */}
      <ResizablePanel defaultSize={60} minSize={40}>
        {selectedModelId ? (
          <ModelDossier modelId={selectedModelId} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {isRu ? 'Выберите модель для просмотра досье' : 'Select a model to view its dossier'}
              </p>
            </div>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
