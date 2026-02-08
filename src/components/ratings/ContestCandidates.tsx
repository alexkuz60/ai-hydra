import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Brain } from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { ModelListSidebar, useAllModels } from './ModelListSidebar';
import { CandidateDetail } from './CandidateDetail';

const STORAGE_KEY = 'hydra-contest-panel-size';
const DEFAULT_LIST_SIZE = 35;

export function ContestCandidates() {
  const { language } = useLanguage();
  const { allModels, loading } = useAllModels();
  const isRu = language === 'ru';

  const [selectedModelId, setSelectedModelId] = useState<string | null>(() => {
    try { return localStorage.getItem('hydra-contest-selected-model') || null; } catch { return null; }
  });

  const [contestModels, setContestModels] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('hydra-contest-models');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });

  const [listSize, setListSize] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed >= 20 && parsed <= 50) return parsed;
      }
    } catch {}
    return DEFAULT_LIST_SIZE;
  });

  useEffect(() => {
    try { localStorage.setItem('hydra-contest-models', JSON.stringify(contestModels)); } catch {}
  }, [contestModels]);

  useEffect(() => {
    try { localStorage.setItem('hydra-contest-selected-model', selectedModelId || ''); } catch {}
  }, [selectedModelId]);

  const handleListResize = (size: number) => {
    setListSize(size);
    try { localStorage.setItem(STORAGE_KEY, String(size)); } catch {}
  };

  const selectedEntry = allModels.find(e => e.model.id === selectedModelId);

  return (
    <div className="h-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={listSize} minSize={20} maxSize={50} onResize={handleListResize}>
          <ModelListSidebar
            selectedModelId={selectedModelId}
            onSelect={setSelectedModelId}
            contestModels={contestModels}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={100 - listSize} minSize={40}>
          {selectedEntry ? (
            <CandidateDetail
              model={selectedEntry.model}
              isAvailable={selectedEntry.isAvailable}
              isSelectedForContest={selectedEntry.model.id in contestModels}
              contestRole={contestModels[selectedEntry.model.id] || ''}
              onToggleContest={(id) => setContestModels(prev => {
                const next = { ...prev };
                if (id in next) delete next[id];
                else next[id] = '';
                return next;
              })}
              onContestRoleChange={(id, role) => setContestModels(prev => ({ ...prev, [id]: role }))}
            />
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
    </div>
  );
}
