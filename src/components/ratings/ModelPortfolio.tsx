import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Brain } from 'lucide-react';
import { ModelDossier } from '@/components/ratings/ModelDossier';
import { ModelListSidebar, useAllModels } from '@/components/ratings/ModelListSidebar';
import { useVeteranModels } from '@/hooks/useModelDossier';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { loading } = useAllModels();
  const { veteranIds } = useVeteranModels();
  const veteranSet = useMemo(() => new Set(veteranIds), [veteranIds]);
  const isRu = language === 'ru';

  // Track if a duel is currently running (not completed) — blocks model changes
  const [isDuelRunning, setIsDuelRunning] = useState(false);
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase
        .from('contest_sessions')
        .select('id')
        .eq('user_id', user.id)
        .filter('config->>mode', 'eq', 'duel')
        .eq('status', 'running')
        .limit(1)
        .maybeSingle();
      setIsDuelRunning(!!data);
    };
    check();
    // Re-check when storage changes (duel started/completed from other tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === DUEL_MODELS_KEY) check();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user]);

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
    try {
      const serialized = JSON.stringify(duelModels);
      localStorage.setItem(DUEL_MODELS_KEY, serialized);
      // Notify same-tab listeners (StorageEvent only fires cross-tab natively)
      window.dispatchEvent(new StorageEvent('storage', {
        key: DUEL_MODELS_KEY,
        newValue: serialized,
      }));
    } catch {}
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
    if (isDuelRunning) {
      toast({
        variant: 'destructive',
        description: isRu
          ? 'Нельзя менять дуэлянтов во время дуэли. Дождитесь завершения.'
          : 'Cannot change duelists while a duel is running. Wait for it to finish.',
      });
      return;
    }
    setDuelModels(prev => {
      const next = { ...prev };
      if (id in next) {
        delete next[id];
      } else {
        if (Object.keys(next).length >= 2) {
          toast({
            variant: 'destructive',
            description: isRu
              ? 'Максимум 2 дуэлянта. Сначала уберите одного из выбранных.'
              : 'Maximum 2 duelists. Remove one first.',
          });
          return prev;
        }
        next[id] = 'critic';
      }
      return next;
    });
  };

  const handleDuelTypeChange = (id: string, type: string) => {
    if (isDuelRunning) {
      toast({
        variant: 'destructive',
        description: isRu
          ? 'Нельзя менять тип дуэлянта во время дуэли.'
          : 'Cannot change duelist type during a running duel.',
      });
      return;
    }
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
            isDuelRunning={isDuelRunning}
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
