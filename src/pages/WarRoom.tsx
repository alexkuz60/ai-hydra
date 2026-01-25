import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HydraCard } from '@/components/ui/hydra-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MultiModelSelector } from '@/components/warroom/MultiModelSelector';
import { PerModelSettings, PerModelSettingsData, DEFAULT_MODEL_SETTINGS } from '@/components/warroom/PerModelSettings';
import { ChatMessage } from '@/components/warroom/ChatMessage';
import { useAvailableModels, LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS } from '@/hooks/useAvailableModels';
import { 
  Send, 
  Loader2, 
  Plus,
  Sparkles,
  Target,
  Pencil,
  Check,
  X,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [perModelSettings, setPerModelSettings] = useState<PerModelSettingsData>({});
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
    if (selectedModels.length === 0 && (lovableModels.length > 0 || personalModels.length > 0)) {
      if (lovableModels.length > 0) {
        setSelectedModels([lovableModels[0].id]);
      } else if (personalModels.length > 0) {
        setSelectedModels([personalModels[0].id]);
      }
    }
  }, [lovableModels, personalModels, selectedModels]);

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

  const handleStartEditTitle = () => {
    if (currentTask) {
      setEditedTitle(currentTask.title);
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitle = async () => {
    if (!currentTask || !editedTitle.trim()) return;
    
    const newTitle = editedTitle.trim().slice(0, 100); // Limit to 100 chars
    
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ title: newTitle })
        .eq('id', currentTask.id);

      if (error) throw error;

      // Update local state
      setCurrentTask({ ...currentTask, title: newTitle });
      setTasks(tasks.map(t => t.id === currentTask.id ? { ...t, title: newTitle } : t));
      setIsEditingTitle(false);
      toast.success(t('common.success'));
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

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle('');
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

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Tasks Sidebar */}
        <aside className="w-64 border-r border-border bg-sidebar hidden lg:flex flex-col">
          <div className="p-4 border-b border-sidebar-border space-y-3">
            <Button 
              onClick={handleCreateTask}
              className="w-full hydra-glow-sm"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('tasks.new')}
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('tasks.search')}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <ScrollArea className="flex-1 hydra-scrollbar">
            <div className="p-2 space-y-1">
              {tasks
                .filter(task => 
                  task.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((task) => (
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
              {tasks.length > 0 && tasks.filter(task => 
                task.title.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('tasks.noResults')}
                </p>
              )}
            </div>
          </ScrollArea>
          
          {/* Per-Model Settings Panel */}
          <PerModelSettings 
            selectedModels={selectedModels}
            settings={perModelSettings}
            onChange={setPerModelSettings}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {currentTask ? (
            <>
              {/* Model Selector Header */}
              <div className="border-b border-border p-3 bg-background/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                  <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="h-7 text-sm max-w-xs"
                        maxLength={100}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle();
                          if (e.key === 'Escape') handleCancelEditTitle();
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-primary hover:text-primary/80"
                        onClick={handleSaveTitle}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-hydra-critical"
                        onClick={handleCancelEditTitle}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{currentTask.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0"
                        onClick={handleStartEditTitle}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <MultiModelSelector 
                  value={selectedModels} 
                  onChange={setSelectedModels} 
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
                    messages.map((message) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message}
                        onDelete={handleDeleteMessage}
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
