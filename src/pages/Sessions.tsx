import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, MessageSquare, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Session {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function Sessions() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchSessions();
    }
  }, [user, authLoading, navigate]);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
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

  const handleCreateSession = async () => {
    if (!user || !newSessionTitle.trim()) return;
    setCreating(true);

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          title: newSessionTitle.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setSessions([data, ...sessions]);
      setNewSessionTitle('');
      toast.success(t('common.success'));
      
      // Navigate to war room with new session
      navigate(`/war-room?session=${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success(t('common.success'));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleOpenSession = (sessionId: string) => {
    navigate(`/war-room?session=${sessionId}`);
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
      <div className="container max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('sessions.title')}</h1>
        </div>

        {/* Create New Session */}
        <HydraCard variant="glass" className="p-6 mb-8">
          <HydraCardHeader>
            <Plus className="h-5 w-5 text-primary" />
            <HydraCardTitle>{t('sessions.new')}</HydraCardTitle>
          </HydraCardHeader>
          <HydraCardContent>
            <div className="flex gap-3">
              <Input
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="Название сессии..."
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
              />
              <Button 
                onClick={handleCreateSession} 
                disabled={creating || !newSessionTitle.trim()}
                className="hydra-glow-sm"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </HydraCardContent>
        </HydraCard>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <HydraCard variant="glass" className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('sessions.empty')}</p>
            </HydraCard>
          ) : (
            sessions.map((session) => (
              <HydraCard 
                key={session.id} 
                variant="glass" 
                glow 
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleOpenSession(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{session.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(session.updated_at), 'dd.MM.yyyy HH:mm')}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-hydra-critical shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </HydraCard>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
