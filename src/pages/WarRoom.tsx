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
import { 
  Send, 
  Loader2, 
  Brain, 
  Shield, 
  Scale, 
  User, 
  Plus,
  MessageSquare,
  Sparkles
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

interface Session {
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

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchSessions();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (sessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
        fetchMessages(sessionId);
      }
    } else if (sessions.length > 0 && !currentSession) {
      setCurrentSession(sessions[0]);
      fetchMessages(sessions[0].id);
    }
  }, [searchParams, sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!currentSession) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${currentSession.id}`,
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
  }, [currentSession]);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCreateSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          title: `Сессия ${new Date().toLocaleDateString()}`,
        })
        .select('id, title')
        .single();

      if (error) throw error;

      setSessions([data, ...sessions]);
      setCurrentSession(data);
      setMessages([]);
      navigate(`/war-room?session=${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !currentSession || !input.trim()) return;
    setSending(true);

    try {
      // Insert user message
      const { error } = await supabase
        .from('messages')
        .insert({
          session_id: currentSession.id,
          user_id: user.id,
          role: 'user' as MessageRole,
          content: input.trim(),
        });

      if (error) throw error;

      setInput('');
      
      // TODO: Here you would trigger the AI processing pipeline
      // For now, we just save the user message
      
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
        {/* Sessions Sidebar */}
        <aside className="w-64 border-r border-border bg-sidebar hidden lg:flex flex-col">
          <div className="p-4 border-b border-sidebar-border">
            <Button 
              onClick={handleCreateSession}
              className="w-full hydra-glow-sm"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('sessions.new')}
            </Button>
          </div>
          <ScrollArea className="flex-1 hydra-scrollbar">
            <div className="p-2 space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setCurrentSession(session);
                    fetchMessages(session.id);
                    navigate(`/war-room?session=${session.id}`);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    currentSession?.id === session.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {currentSession ? (
            <>
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
                    disabled={sending || !input.trim()}
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
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">{t('warRoom.noSession')}</h2>
                <Button onClick={handleCreateSession} className="hydra-glow-sm mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('sessions.new')}
                </Button>
              </HydraCard>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
