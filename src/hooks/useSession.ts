import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PerModelSettingsData } from '@/components/warroom/PerModelSettings';
import { useAvailableModels } from '@/hooks/useAvailableModels';

export interface Task {
  id: string;
  title: string;
}

interface SessionConfig {
  selectedModels?: string[];
  perModelSettings?: PerModelSettingsData;
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
  } | null;

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModels, setSelectedModels] = useState<string[]>(initialState?.selectedModels || []);
  const [perModelSettings, setPerModelSettings] = useState<PerModelSettingsData>(initialState?.perModelSettings || {});
  const [initialStateApplied, setInitialStateApplied] = useState(false);

  // Apply config from session data
  const applySessionConfig = useCallback((config: SessionConfig | null) => {
    if (!config) return;
    if (config.selectedModels) {
      setSelectedModels(config.selectedModels);
    }
    if (config.perModelSettings) {
      setPerModelSettings(config.perModelSettings);
    }
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
        applySessionConfig(data.session_config as SessionConfig);
      }
    } catch (error: any) {
      toast.error(error.message);
      navigate('/tasks');
    } finally {
      setLoading(false);
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
        applySessionConfig(session.session_config as SessionConfig);
        setLoading(false);
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
      applySessionConfig(fallbackSession.session_config as SessionConfig);
    } catch (error) {
      navigate('/tasks');
    } finally {
      setLoading(false);
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

  return {
    currentTask,
    loading,
    selectedModels,
    setSelectedModels,
    perModelSettings,
    setPerModelSettings,
  };
}
