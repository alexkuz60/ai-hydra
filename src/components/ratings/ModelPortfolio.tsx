import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Brain } from 'lucide-react';
import { ModelDossier } from '@/components/ratings/ModelDossier';
import { ModelListSidebar, useAllModels } from '@/components/ratings/ModelListSidebar';
import { useVeteranModels } from '@/hooks/useModelDossier';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

const STORAGE_KEY = 'portfolio-panel-size';
const SELECTED_KEY = 'portfolio-selected-model';
const CONTEST_MODELS_KEY = 'hydra-contest-models';
const DUEL_MODELS_KEY = 'hydra-duel-models-selected';
const DEFAULT_LIST_SIZE = 25;

export function ModelPortfolio() {
  const { language } = useLanguage();
  const { loading } = useAllModels();
  const { veteranIds } = useVeteranModels();
  const veteranSet = useMemo(() => new Set(veteranIds), [veteranIds]);
  const isRu = language === 'ru';

  const [selectedModelId, setSelectedModelId] = useState<string | null>(() => {
    try { return localStorage.getItem(SELECTED_KEY) || null; } catch { return null; }
  });

  const [contestModels, setContestModels] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(CONTEST_MODELS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });

  const [duelModels, setDuelModels] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(DUEL_MODELS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate from old Set<string> format (array of strings) to Record<string, DuelType>
        if (Array.isArray(parsed)) {
          const migrated: Record<string, string> = {};
          parsed.forEach((id: string) => { migrated[id] = 'critic'; });
          return migrated;
        }
        return parsed;
      }
    } catch {}
    return {};
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

  useEffect(() => {
    try { localStorage.setItem(CONTEST_MODELS_KEY, JSON.stringify(contestModels)); } catch {}
  }, [contestModels]);

  useEffect(() => {
    try { localStorage.setItem(DUEL_MODELS_KEY, JSON.stringify(duelModels)); } catch {}
  }, [duelModels]);

  // Sync contestModels and duelModels from other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONTEST_MODELS_KEY && e.newValue) {
        try { setContestModels(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === DUEL_MODELS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            const migrated: Record<string, string> = {};
            parsed.forEach((id: string) => { migrated[id] = 'critic'; });
            setDuelModels(migrated);
          } else {
            setDuelModels(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleToggleContest = (id: string) => {
    setContestModels(prev => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = '';
      return next;
    });
  };

  const handleContestRoleChange = (id: string, role: string) => {
    setContestModels(prev => ({ ...prev, [id]: role }));
  };

  const handleToggleDuel = (id: string) => {
    setDuelModels(prev => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = 'critic';
      return next;
    });
  };

  const handleDuelTypeChange = (id: string, type: string) => {
    setDuelModels(prev => ({ ...prev, [id]: type }));
  };

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
           contestModels={contestModels}
           duelModels={duelModels}
           veteranModelIds={veteranSet}
         />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={100 - listSize} minSize={40}>
        {selectedModelId ? (
          <ModelDossier
            modelId={selectedModelId}
            contestModels={contestModels}
            duelModels={duelModels}
            onToggleContest={handleToggleContest}
            onToggleDuel={handleToggleDuel}
            onDuelTypeChange={handleDuelTypeChange}
            onContestRoleChange={handleContestRoleChange}
          />
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
