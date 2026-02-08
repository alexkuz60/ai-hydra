import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Brain } from 'lucide-react';
import { ModelDossier } from '@/components/ratings/ModelDossier';
import { ModelListSidebar, useAllModels } from '@/components/ratings/ModelListSidebar';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

const STORAGE_KEY = 'portfolio-panel-size';
const SELECTED_KEY = 'portfolio-selected-model';
const DEFAULT_LIST_SIZE = 25;

export function ModelPortfolio() {
  const { language } = useLanguage();
  const { loading } = useAllModels();
  const isRu = language === 'ru';

  const [selectedModelId, setSelectedModelId] = useState<string | null>(() => {
    try { return localStorage.getItem(SELECTED_KEY) || null; } catch { return null; }
  });

  const [listSize, setListSize] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed >= 15 && parsed <= 50) return parsed;
      }
    } catch {}
    return DEFAULT_LIST_SIZE;
  });

  useEffect(() => {
    try { localStorage.setItem(SELECTED_KEY, selectedModelId || ''); } catch {}
  }, [selectedModelId]);

  const handleListResize = (size: number) => {
    setListSize(size);
    try { localStorage.setItem(STORAGE_KEY, String(size)); } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={listSize} minSize={15} maxSize={50} onResize={handleListResize}>
        <ModelListSidebar
          selectedModelId={selectedModelId}
          onSelect={setSelectedModelId}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={100 - listSize} minSize={40}>
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
