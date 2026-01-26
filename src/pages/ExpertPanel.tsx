import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { PerModelSettingsData, DEFAULT_MODEL_SETTINGS } from '@/components/warroom/PerModelSettings';
import { ChatMessage } from '@/components/warroom/ChatMessage';
import { useAvailableModels, LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS } from '@/hooks/useAvailableModels';
import { 
  Send, 
  Loader2, 
  Sparkles,
  Target
} from 'lucide-react';

type MessageRole = 'user' | 'assistant' | 'critic' | 'arbiter';

interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  model_name: string | null;
  content: string;
  reasoning_path: string | null;
  confidence_score: number | null;
  created_at: string;
  metadata?: unknown;
}

interface Task {
  id: string;
  title: string;
}


export default function ExpertPanel() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { lovableModels, personalModels } = useAvailableModels();

  // Get initial state from navigation (passed from Tasks page)
  const initialState = location.state as {
    selectedModels?: string[];
    perModelSettings?: PerModelSettingsData;
  } | null;

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(initialState?.selectedModels || []);
  const [perModelSettings, setPerModelSettings] = useState<PerModelSettingsData>(initialState?.perModelSettings || {});
  const [initialStateApplied, setInitialStateApplied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      const taskId = searchParams.get('task');
      if (taskId) {
        fetchTask(taskId);
      } else {
        // No task specified, load last task
        fetchLastTask();
      }
    }
  }, [user, authLoading, navigate, searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set default model when available models change (only if no initial state was passed)
  useEffect(() => {
    // Skip if initial state from Tasks page was applied
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

  // Subscribe to realtime messages
  useEffect(() => {
    if (!currentTask) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${currentTask.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentTask]);

  const fetchTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, session_config')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setCurrentTask(data);
      
      // Apply saved model configuration if not passed via navigation state
      if (!initialState?.selectedModels && data.session_config) {
        const config = data.session_config as { selectedModels?: string[]; perModelSettings?: PerModelSettingsData };
        if (config.selectedModels) {
          setSelectedModels(config.selectedModels);
        }
        if (config.perModelSettings) {
          setPerModelSettings(config.perModelSettings);
        }
      }
      
      fetchMessages(taskId);
    } catch (error: any) {
      toast.error(error.message);
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchLastTask = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, session_config')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // No tasks — redirect to tasks page
        navigate('/tasks');
        return;
      }

      setCurrentTask(data);

      // Apply saved model configuration
      if (data.session_config) {
        const config = data.session_config as { selectedModels?: string[]; perModelSettings?: PerModelSettingsData };
        if (config.selectedModels) {
          setSelectedModels(config.selectedModels);
        }
        if (config.perModelSettings) {
          setPerModelSettings(config.perModelSettings);
        }
      }

      fetchMessages(data.id);
    } catch (error) {
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(messages.filter(m => m.id !== messageId));
      toast.success(t('messages.deleted'));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRatingChange = async (messageId: string, rating: number) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const currentMetadata = (message?.metadata as Record<string, unknown>) || {};

      const { error } = await supabase
        .from('messages')
        .update({
          metadata: { ...currentMetadata, rating }
        })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(msgs => msgs.map(m =>
        m.id === messageId
          ? { ...m, metadata: { ...currentMetadata, rating } }
          : m
      ));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !currentTask || !input.trim() || selectedModels.length === 0) return;
    setSending(true);

    const messageContent = input.trim();
    setInput('');

    try {
      // Insert user message
      const { error } = await supabase
        .from('messages')
        .insert({
          session_id: currentTask.id,
          user_id: user.id,
          role: 'user' as MessageRole,
          content: messageContent,
        });

      if (error) throw error;

      // Prepare models with their metadata and individual settings
      const modelsToCall = selectedModels.map(modelId => {
        const isLovable = LOVABLE_AI_MODELS.some(m => m.id === modelId);
        const personalModel = PERSONAL_KEY_MODELS.find(m => m.id === modelId);
        const settings = perModelSettings[modelId] || DEFAULT_MODEL_SETTINGS;
        return {
          model_id: modelId,
          use_lovable_ai: isLovable,
          provider: personalModel?.provider || null,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          system_prompt: settings.systemPrompt,
          role: settings.role,
        };
      });

      // Call the Hydra orchestrator with multiple models (each with its own settings)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hydra-orchestrator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            session_id: currentTask.id,
            message: messageContent,
            models: modelsToCall,
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Превышен лимит запросов. Попробуйте позже.');
        } else if (response.status === 402) {
          toast.error('Требуется пополнение баланса Lovable AI.');
        } else {
          throw new Error(data.error || 'Failed to get AI response');
        }
        return;
      }

      // Check for partial errors
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((err: { model: string; error: string }) => {
          toast.error(`${err.model}: ${err.error}`);
        });
      }
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // If no task, show redirect message (will redirect via useEffect)
  if (!currentTask) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Task Header */}
          <div className="border-b border-border p-3 bg-background/50 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
              <Target className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{currentTask.title}</span>
            </div>
          </div>


          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 hydra-scrollbar">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-16">
                  <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse-glow" />
                  <p className="text-muted-foreground">
                    Начните диалог с AI-Hydra
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message}
                    onDelete={handleDeleteMessage}
                    onRatingChange={handleRatingChange}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-background/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('expertPanel.placeholder')}
                className="flex-1 min-h-[60px] max-h-[200px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={sending || !input.trim() || selectedModels.length === 0}
                className="hydra-glow-sm self-end"
                size="lg"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
