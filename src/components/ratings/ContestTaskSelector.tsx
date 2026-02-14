import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, ClipboardList, Paperclip, Users, Crown, Info, FileText, Image, File, Trophy, UserCheck, Plus, X, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PROVIDER_LOGOS, PROVIDER_COLORS } from '@/components/ui/ProviderLogos';
import { cn } from '@/lib/utils';
import { getModelRegistryEntry, type ModelRegistryEntry } from '@/config/modelRegistry';
import { useTaskFiles } from '@/hooks/useTaskFiles';
import { useContestConfigContext } from '@/contexts/ContestConfigContext';
import { useAllModels } from '@/components/ratings/ModelListSidebar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

export type ContestMode = 'contest' | 'interview';

interface Session {
  id: string;
  title: string;
  description: string | null;
}

interface ContestModel {
  modelId: string;
  role: string;
}

function getContestModels(models: Record<string, string>): ContestModel[] {
  return Object.entries(models).map(([modelId, role]) => ({ modelId, role }));
}

function getRegistryEntry(modelId: string): ModelRegistryEntry | undefined {
  return getModelRegistryEntry(modelId);
}

function TaskFilesDisplay({ sessionId, isRu }: { sessionId: string | null; isRu: boolean }) {
  const { files, loading } = useTaskFiles(sessionId);

  function getIcon(mime: string | null) {
    if (!mime) return <File className="h-3 w-3 text-muted-foreground" />;
    if (mime.startsWith('image/')) return <Image className="h-3 w-3 text-hydra-info" />;
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

/** Inline model picker for adding contest participants */
function ContestModelPicker({
  models,
  onAdd,
  isRu,
}: {
  models: Record<string, string>;
  onAdd: (modelId: string) => void;
  isRu: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { allModels } = useAllModels();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allModels.filter(e =>
      !(e.model.id in models) &&
      (e.model.name.toLowerCase().includes(q) || e.model.id.toLowerCase().includes(q))
    );
  }, [allModels, models, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <Plus className="h-3.5 w-3.5" />
          {isRu ? 'Добавить модель' : 'Add model'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b border-border/40">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isRu ? 'Поиск модели...' : 'Search model...'}
              className="h-8 pl-7 text-xs"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="max-h-[240px]">
          <div className="p-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                {isRu ? 'Нет доступных моделей' : 'No available models'}
              </p>
            ) : (
              filtered.map(e => {
                const Logo = PROVIDER_LOGOS[e.model.provider];
                const color = PROVIDER_COLORS[e.model.provider] || 'text-muted-foreground';
                return (
                  <button
                    key={e.model.id}
                    onClick={() => { onAdd(e.model.id); setSearch(''); setOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                      e.isAvailable ? "hover:bg-muted/40" : "opacity-50 hover:bg-muted/20"
                    )}
                  >
                    {Logo && <Logo className={cn("h-3.5 w-3.5 shrink-0", color)} />}
                    <span className="text-xs font-medium truncate">{e.model.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function ContestTaskSelector() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const { taskId, mode, updateTaskId, updateMode, models, updateModels } = useContestConfigContext();

  const [sessions, setSessions] = useState<Session[]>([]);

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

  const selectedSession = sessions.find(s => s.id === taskId);
  const contestModels = getContestModels(models);

  const handleAddModel = (modelId: string) => {
    updateModels({ ...models, [modelId]: '' });
  };

  const handleRemoveModel = (modelId: string) => {
    const next = { ...models };
    delete next[modelId];
    updateModels(next);
  };

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
        {/* Mode selector: Contest vs Interview */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {isRu ? 'Режим' : 'Mode'}
          </label>
           <div className="flex gap-2">
             <Button
               variant={mode === 'contest' ? 'default' : 'outline'}
               size="sm"
               className="flex-1 gap-2 h-9"
               onClick={() => updateMode('contest')}
             >
               <Trophy className="h-3.5 w-3.5" />
               {isRu ? 'Конкурс' : 'Contest'}
             </Button>
             <Button
               variant={mode === 'interview' ? 'default' : 'outline'}
               size="sm"
               className="flex-1 gap-2 h-9"
               onClick={() => updateMode('interview')}
             >
               <UserCheck className="h-3.5 w-3.5" />
               {isRu ? 'Собеседование' : 'Interview'}
             </Button>
           </div>
           <p className="text-[10px] text-muted-foreground/60">
             {mode === 'contest'
              ? (isRu ? 'Отбор моделей для ролей Панели экспертов (Эксперт, Критик, Консультант...)' : 'Select models for Expert Panel roles (Expert, Critic, Consultant...)')
              : (isRu ? 'Отбор моделей для ролей техперсонала (Модератор, Архивариус, Аналитик...)' : 'Select models for technical staff roles (Moderator, Archivist, Analyst...)')
            }
          </p>
        </div>

        {/* Task selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {isRu ? 'Задача' : 'Task'}
          </label>
           <Select value={taskId || ''} onValueChange={updateTaskId}>
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
         <TaskFilesDisplay sessionId={taskId || null} isRu={isRu} />

        {/* Participants */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              {isRu ? 'Участники подиума' : 'Podium Participants'}
              {contestModels.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-hydra-arbiter/20 text-hydra-arbiter border-hydra-arbiter/30">
                  {contestModels.length}
                </Badge>
              )}
            </label>
            <ContestModelPicker models={models} onAdd={handleAddModel} isRu={isRu} />
          </div>

          {contestModels.length === 0 ? (
            <div className="p-3 rounded-md border border-dashed border-border/40 bg-muted/10 text-center">
              <Crown className="h-4 w-4 text-hydra-arbiter/40 mx-auto mb-1" />
              <p className="text-[11px] text-muted-foreground/60">
                {isRu
                  ? 'Добавьте модели кнопкой выше или на вкладке «Портфолио»'
                  : 'Add models with the button above or from the "Portfolio" tab'}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[200px]">
            <div className="flex flex-wrap gap-2 pr-2">
              {contestModels.map(({ modelId, role }) => {
                const entry = getRegistryEntry(modelId);
                const provider = entry?.provider || 'openai';
                const Logo = PROVIDER_LOGOS[provider];
                const color = PROVIDER_COLORS[provider] || 'text-muted-foreground';
                const roleLabel = ROLE_LABELS[role]?.[isRu ? 'ru' : 'en'] || role || '—';

                return (
                  <div
                    key={modelId}
                    className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/20 border border-border/30 transition-colors hover:border-border/60"
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
                    <button
                      onClick={() => handleRemoveModel(modelId)}
                      className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      title={isRu ? 'Убрать' : 'Remove'}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
            </ScrollArea>
          )}
        </div>
      </HydraCardContent>
    </HydraCard>
  );
}
