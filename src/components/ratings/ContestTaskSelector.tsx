import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Brain, ClipboardList, Paperclip, Users, Crown, Info, FileText, Image, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry, type ModelRegistryEntry } from '@/config/modelRegistry';
import { useTaskFiles } from '@/hooks/useTaskFiles';

interface Session {
  id: string;
  title: string;
  description: string | null;
}

interface ContestModel {
  modelId: string;
  role: string;
}

function getContestModels(): ContestModel[] {
  try {
    const stored = localStorage.getItem('hydra-contest-models');
    if (!stored) return [];
    const obj = JSON.parse(stored) as Record<string, string>;
    return Object.entries(obj).map(([modelId, role]) => ({ modelId, role }));
  } catch { return []; }
}

function getRegistryEntry(modelId: string): ModelRegistryEntry | undefined {
  return getModelRegistryEntry(modelId);
}

function TaskFilesDisplay({ sessionId, isRu }: { sessionId: string | null; isRu: boolean }) {
  const { files, loading } = useTaskFiles(sessionId);

  function getIcon(mime: string | null) {
    if (!mime) return <File className="h-3 w-3 text-muted-foreground" />;
    if (mime.startsWith('image/')) return <Image className="h-3 w-3 text-blue-400" />;
    return <FileText className="h-3 w-3 text-muted-foreground" />;
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Paperclip className="h-3 w-3" />
        {isRu ? 'Прикреплённые файлы' : 'Attached Files'}
        {files.length > 0 && (
          <span className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{files.length}</span>
        )}
      </label>
      {loading ? null : files.length === 0 ? (
        <div className="p-2.5 rounded-md border border-dashed border-border/40 bg-muted/10 text-center">
          <p className="text-[11px] text-muted-foreground/60">
            {sessionId
              ? (isRu ? 'Нет файлов. Прикрепите в панели Задач.' : 'No files. Attach in Tasks panel.')
              : (isRu ? 'Выберите задачу для просмотра файлов' : 'Select a task to view files')}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/20 border border-border/20">
              {getIcon(f.mime_type)}
              <span className="text-[11px] truncate max-w-[120px]">{f.file_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContestTaskSelector() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => {
    try { return localStorage.getItem('hydra-contest-task-id') || ''; } catch { return ''; }
  });
  const [contestModels, setContestModels] = useState<ContestModel[]>(getContestModels);

  // Load sessions
  useEffect(() => {
    if (!user) return;
    supabase
      .from('sessions')
      .select('id, title, description')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => { if (data) setSessions(data); });
  }, [user]);

  // Persist selected task
  useEffect(() => {
    try { localStorage.setItem('hydra-contest-task-id', selectedTaskId); } catch {}
  }, [selectedTaskId]);

  // Sync contest models from localStorage
  useEffect(() => {
    const handler = () => setContestModels(getContestModels());
    window.addEventListener('storage', handler);
    const interval = setInterval(handler, 1000);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);

  const selectedSession = sessions.find(s => s.id === selectedTaskId);

  const ROLE_LABELS: Record<string, { ru: string; en: string }> = {
    assistant: { ru: 'Эксперт', en: 'Expert' },
    critic: { ru: 'Критик', en: 'Critic' },
    arbiter: { ru: 'Арбитр', en: 'Arbiter' },
    consultant: { ru: 'Консультант', en: 'Consultant' },
    moderator: { ru: 'Модератор', en: 'Moderator' },
    advisor: { ru: 'Советник', en: 'Advisor' },
    analyst: { ru: 'Аналитик', en: 'Analyst' },
  };

  return (
    <HydraCard variant="default" className="border-border/50">
      <HydraCardHeader>
        <div className="flex items-center gap-2 text-hydra-cyan">
          <ClipboardList className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">
            {isRu ? 'Шаг 1' : 'Step 1'}
          </span>
        </div>
        <HydraCardTitle>
          {isRu ? 'Участники и Задача' : 'Participants & Task'}
        </HydraCardTitle>
      </HydraCardHeader>

      <HydraCardContent className="space-y-4">
        {/* Task selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {isRu ? 'Задача' : 'Task'}
          </label>
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder={isRu ? 'Выберите задачу...' : 'Select a task...'} />
            </SelectTrigger>
            <SelectContent>
              {sessions.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title || (isRu ? 'Без названия' : 'Untitled')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSession && selectedSession.description && (
            <div className="p-2.5 rounded-md bg-muted/30 border border-border/30">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedSession.description}
              </p>
            </div>
          )}
        </div>

        {/* Files */}
        <TaskFilesDisplay sessionId={selectedTaskId || null} isRu={isRu} />

        {/* Participants */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            {isRu ? 'Участники подиума' : 'Podium Participants'}
            {contestModels.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">
                {contestModels.length}
              </Badge>
            )}
          </label>

          {contestModels.length === 0 ? (
            <div className="p-3 rounded-md border border-dashed border-border/40 bg-muted/10 text-center">
              <Crown className="h-4 w-4 text-amber-400/40 mx-auto mb-1" />
              <p className="text-[11px] text-muted-foreground/60">
                {isRu
                  ? 'Пригласите моделей на вкладке «Отборочные кандидаты»'
                  : 'Invite models from the "Qualifying Candidates" tab'}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {contestModels.map(({ modelId, role }) => {
                const entry = getRegistryEntry(modelId);
                const provider = entry?.provider || 'openai';
                const Logo = PROVIDER_LOGOS[provider];
                const color = PROVIDER_COLORS[provider] || 'text-muted-foreground';
                const roleLabel = ROLE_LABELS[role]?.[isRu ? 'ru' : 'en'] || role || '—';

                return (
                  <div
                    key={modelId}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/20 border border-border/30"
                  >
                    {Logo && <Logo className={cn("h-3.5 w-3.5 shrink-0", color)} />}
                    <span className="text-xs font-medium truncate max-w-[120px]">
                      {entry?.displayName || modelId}
                    </span>
                    {role && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {roleLabel}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}
