import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PerModelSettingsData } from '@/components/warroom/PerModelSettings';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import type { Json } from '@/integrations/supabase/types';

/** Minimal session/task identifier used inside the Expert Panel */
export interface Task {
  id: string;
  title: string;
}

/** Subset of SessionConfig persisted to the sessions table */
interface StoredSessionConfig {
  selectedModels?: string[];
  perModelSettings?: PerModelSettingsData;
  useHybridStreaming?: boolean;
}

interface UseSessionProps {
  userId: string | undefined;
  authLoading: boolean;
}

interface UseSessionReturn {
  currentTask: Task | null;
  loading: boolean;
  selectedModels: string[];
  setSelectedModels: React.Dispatch<React.SetStateAction<string[]>>;
  perModelSettings: PerModelSettingsData;
  setPerModelSettings: React.Dispatch<React.SetStateAction<PerModelSettingsData>>;
  useHybridStreaming: boolean;
  setUseHybridStreaming: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useSession({ userId, authLoading }: UseSessionProps): UseSessionReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { lovableModels, personalModels } = useAvailableModels();

  // Get initial state from navigation (passed from Tasks page)
  const initialState = location.state as {
    selectedModels?: string[];
    perModelSettings?: PerModelSettingsData;
    useHybridStreaming?: boolean;
  } | null;

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModels, setSelectedModels] = useState<string[]>(initialState?.selectedModels || []);
  const [perModelSettings, setPerModelSettings] = useState<PerModelSettingsData>(initialState?.perModelSettings || {});
  const [useHybridStreaming, setUseHybridStreaming] = useState<boolean>(initialState?.useHybridStreaming ?? true);
  const [initialStateApplied, setInitialStateApplied] = useState(false);
  
  // Track if initial load is complete to prevent saving during load
  const isInitialLoadComplete = useRef(false);
  // Track last saved config to prevent unnecessary saves
  const lastSavedConfig = useRef<string>('');

  // Save session config to database
  const saveSessionConfig = useCallback(async (
    taskId: string,
    models: string[],
    settings: PerModelSettingsData,
    hybridStreaming: boolean
  ) => {
    const configJson = JSON.stringify({ 
      selectedModels: models, 
      perModelSettings: settings,
      useHybridStreaming: hybridStreaming
    });
    
    // Skip if nothing changed
    if (configJson === lastSavedConfig.current) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          session_config: { 
            selectedModels: models, 
            perModelSettings: settings,
            useHybridStreaming: hybridStreaming
          } as unknown as Json,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) {
        console.error('Failed to save session config:', error);
      } else {
        lastSavedConfig.current = configJson;
      }
    } catch (error) {
      console.error('Failed to save session config:', error);
    }
  }, []);

  // Apply config from session data
  const applySessionConfig = useCallback((config: StoredSessionConfig | null) => {
    if (!config) return;
    if (config.selectedModels) {
      setSelectedModels(config.selectedModels);
    }
    if (config.perModelSettings) {
      setPerModelSettings(config.perModelSettings);
    }
    if (typeof config.useHybridStreaming === 'boolean') {
      setUseHybridStreaming(config.useHybridStreaming);
    }
    // Update lastSavedConfig to prevent immediate re-save
    lastSavedConfig.current = JSON.stringify(config);
  }, []);

  // Fetch specific task by ID
  const fetchTask = useCallback(async (taskId: string) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, session_config')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      setCurrentTask(data);

      // Apply saved model configuration if not passed via navigation state
      if (!initialState?.selectedModels && data.session_config) {
        applySessionConfig(data.session_config as StoredSessionConfig);
      }
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      navigate('/tasks');
    } finally {
      setLoading(false);
      isInitialLoadComplete.current = true;
    }
  }, [userId, initialState, applySessionConfig, navigate]);

  // Fetch last active task (by last message)
  const fetchLastTask = useCallback(async () => {
    if (!userId) return;

    try {
      // Step 1: Find session with the most recent message
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('session_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMessage) {
        const { data: session, error } = await supabase
          .from('sessions')
          .select('id, title, session_config')
          .eq('id', lastMessage.session_id)
          .eq('user_id', userId)
          .single();

        if (error || !session) {
          navigate('/tasks');
          return;
        }

        setCurrentTask(session);
        applySessionConfig(session.session_config as StoredSessionConfig);
        setLoading(false);
        isInitialLoadComplete.current = true;
        return;
      }

      // Step 2 (Fallback): No messages — find newest session by created_at
      const { data: fallbackSession, error: fallbackError } = await supabase
        .from('sessions')
        .select('id, title, session_config')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackError || !fallbackSession) {
        navigate('/tasks');
        return;
      }

      setCurrentTask(fallbackSession);
      applySessionConfig(fallbackSession.session_config as StoredSessionConfig);
    } catch (error) {
      navigate('/tasks');
    } finally {
      setLoading(false);
      isInitialLoadComplete.current = true;
    }
  }, [userId, applySessionConfig, navigate]);

  // Initial load effect
  useEffect(() => {
    if (!authLoading && !userId) {
      navigate('/login');
      return;
    }

    if (userId) {
      const taskId = searchParams.get('task');
      if (taskId) {
        fetchTask(taskId);
      } else {
        fetchLastTask();
      }
    }
  }, [userId, authLoading, navigate, searchParams, fetchTask, fetchLastTask]);

  // Set default model when available models change (only if no initial state)
  useEffect(() => {
    if (initialStateApplied || (initialState?.selectedModels && initialState.selectedModels.length > 0)) {
      if (!initialStateApplied) setInitialStateApplied(true);
      return;
    }

    if (selectedModels.length === 0 && (lovableModels.length > 0 || personalModels.length > 0)) {
      if (lovableModels.length > 0) {
        setSelectedModels([lovableModels[0].id]);
      } else if (personalModels.length > 0) {
        setSelectedModels([personalModels[0].id]);
      }
    }
  }, [lovableModels, personalModels, selectedModels, initialState, initialStateApplied]);

  // Auto-save session config when selectedModels or perModelSettings change
  useEffect(() => {
    // Skip during initial load
    if (!isInitialLoadComplete.current || !currentTask?.id || loading) {
      return;
    }

    // Debounce save
    const timeout = setTimeout(() => {
      saveSessionConfig(currentTask.id, selectedModels, perModelSettings, useHybridStreaming);
    }, 500);

    return () => clearTimeout(timeout);
  }, [selectedModels, perModelSettings, useHybridStreaming, currentTask?.id, loading, saveSessionConfig]);

  return {
    currentTask,
    loading,
    selectedModels,
    setSelectedModels,
    perModelSettings,
    setPerModelSettings,
    useHybridStreaming,
    setUseHybridStreaming,
  };
}
