import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ModelSelector } from '@/components/warroom/ModelSelector';
import { useAvailableModels, LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS } from '@/hooks/useAvailableModels';
import { 
  Send, 
  Loader2, 
  Brain, 
  Shield, 
  Scale, 
  User, 
  Plus,
  MessageSquare,
  Sparkles,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

interface Task {
  id: string;
  title: string;
}

const roleConfig = {
  user: {
    icon: User,
    label: 'role.user',
    variant: 'user' as const,
    color: 'text-primary',
  },
  assistant: {
    icon: Brain,
    label: 'role.assistant',
    variant: 'expert' as const,
    color: 'text-hydra-expert',
  },
  critic: {
    icon: Shield,
    label: 'role.critic',
    variant: 'critic' as const,
    color: 'text-hydra-critical',
  },
  arbiter: {
    icon: Scale,
    label: 'role.arbiter',
    variant: 'arbiter' as const,
    color: 'text-hydra-arbiter',
  },
};

export default function WarRoom() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isAdmin, lovableModels, personalModels, hasAnyModels } = useAvailableModels();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchTasks();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setCurrentTask(task);
        fetchMessages(taskId);
      }
    } else if (tasks.length > 0 && !currentTask) {
      setCurrentTask(tasks[0]);
      fetchMessages(tasks[0].id);
    }
  }, [searchParams, tasks]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set default model when available models change
  useEffect(() => {
    if (!selectedModel && (lovableModels.length > 0 || personalModels.length > 0)) {
      if (lovableModels.length > 0) {
        setSelectedModel(lovableModels[0].id);
      } else if (personalModels.length > 0) {
        setSelectedModel(personalModels[0].id);
      }
    }
  }, [lovableModels, personalModels, selectedModel]);

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

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast.error(error.message);
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

  const handleCreateTask = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          title: `Задача ${new Date().toLocaleDateString()}`,
        })
        .select('id, title')
        .single();

      if (error) throw error;

      setTasks([data, ...tasks]);
      setCurrentTask(data);
      setMessages([]);
      navigate(`/war-room?task=${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !currentTask || !input.trim() || !selectedModel) return;
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

      // Determine which model to use and which endpoint
      const isLovableModel = LOVABLE_AI_MODELS.some(m => m.id === selectedModel);
      const personalModel = PERSONAL_KEY_MODELS.find(m => m.id === selectedModel);

      // Call the Hydra orchestrator to get LLM response
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
            selected_model: selectedModel,
            use_lovable_ai: isLovableModel,
            provider: personalModel?.provider || null,
            temperature: 0.7,
            max_tokens: 2048,
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

      // Check for any errors in response
      if (data.error) {
        toast.error(data.error);
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

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Tasks Sidebar */}
        <aside className="w-64 border-r border-border bg-sidebar hidden lg:flex flex-col">
          <div className="p-4 border-b border-sidebar-border">
            <Button 
              onClick={handleCreateTask}
              className="w-full hydra-glow-sm"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('tasks.new')}
            </Button>
          </div>
          <ScrollArea className="flex-1 hydra-scrollbar">
            <div className="p-2 space-y-1">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setCurrentTask(task);
                    fetchMessages(task.id);
                    navigate(`/war-room?task=${task.id}`);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    currentTask?.id === task.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 shrink-0" />
                    <span className="truncate">{task.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {currentTask ? (
            <>
              {/* Model Selector Header */}
              <div className="border-b border-border p-3 bg-background/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span className="font-medium">{currentTask.title}</span>
                </div>
                <ModelSelector 
                  value={selectedModel} 
                  onChange={setSelectedModel} 
                />
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
                    messages.map((message) => {
                      const config = roleConfig[message.role];
                      const Icon = config.icon;

                      return (
                        <HydraCard 
                          key={message.id} 
                          variant={config.variant}
                          className="animate-slide-up"
                        >
                          <HydraCardHeader>
                            <Icon className={cn('h-5 w-5', config.color)} />
                            <HydraCardTitle className={config.color}>
                              {t(config.label)}
                              {message.model_name && (
                                <span className="text-muted-foreground font-normal ml-2">
                                  ({message.model_name})
                                </span>
                              )}
                            </HydraCardTitle>
                            {message.confidence_score && (
                              <span className="text-xs text-muted-foreground ml-auto">
                                Confidence: {(message.confidence_score * 100).toFixed(0)}%
                              </span>
                            )}
                          </HydraCardHeader>
                          <HydraCardContent className="text-foreground/90 whitespace-pre-wrap">
                            {message.content}
                          </HydraCardContent>
                          {message.reasoning_path && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs text-muted-foreground font-mono">
                                Chain of Thought: {message.reasoning_path}
                              </p>
                            </div>
                          )}
                        </HydraCard>
                      );
                    })
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
                    placeholder={t('warRoom.placeholder')}
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
                    disabled={sending || !input.trim() || !selectedModel}
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <HydraCard variant="glass" className="p-8 text-center max-w-md">
                <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">{t('warRoom.noSession')}</h2>
                <Button onClick={handleCreateTask} className="hydra-glow-sm mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('tasks.new')}
                </Button>
              </HydraCard>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
