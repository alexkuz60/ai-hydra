import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVeteranModels } from '@/hooks/useModelDossier';
import { ModelDossier } from '@/components/ratings/ModelDossier';
import { getModelDisplayName, getModelInfo } from '@/hooks/useAvailableModels';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

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
      <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
        <div className="h-full flex flex-col">
          <div className="p-3 border-b border-border">
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
              {filteredIds.map(id => {
                const info = getModelInfo(id);
                const provider = info.provider || 'openai';
                const Logo = PROVIDER_LOGOS[provider];
                const color = PROVIDER_COLORS[provider] || 'text-muted-foreground';
                const isActive = selectedModelId === id;

                return (
                  <button
                    key={id}
                    onClick={() => setSelectedModelId(id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-colors text-left",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/30 text-foreground"
                    )}
                  >
                    {Logo && <Logo className={cn("h-5 w-5 shrink-0", color)} />}
                    <span className="text-sm font-medium truncate">
                      {getModelDisplayName(id)}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Detail: dossier */}
      <ResizablePanel defaultSize={65} minSize={40}>
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
