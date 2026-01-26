import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, MessageSquare, Loader2, Calendar, Settings, Bot, Sparkles, Cpu, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { MultiModelSelector } from '@/components/warroom/MultiModelSelector';
import { PerModelSettings, PerModelSettingsData, DEFAULT_MODEL_SETTINGS } from '@/components/warroom/PerModelSettings';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAvailableModels, ModelOption, LOVABLE_AI_MODELS, PERSONAL_KEY_MODELS } from '@/hooks/useAvailableModels';

interface Task {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  session_config: {
    selectedModels?: string[];
    perModelSettings?: PerModelSettingsData;
  } | null;
}

// Get model icon based on provider
const getModelIcon = (modelId: string) => {
  const allModels = [...LOVABLE_AI_MODELS, ...PERSONAL_KEY_MODELS];
  const model = allModels.find(m => m.id === modelId);
  
  if (!model) return <Bot className="h-4 w-4 text-muted-foreground" />;
  
  if (model.provider === 'lovable') {
    return <Sparkles className="h-4 w-4 text-primary" />;
  }
  return <Cpu className="h-4 w-4 text-accent-foreground" />;
};

// Get model display name
const getModelName = (modelId: string) => {
  const allModels = [...LOVABLE_AI_MODELS, ...PERSONAL_KEY_MODELS];
  const model = allModels.find(m => m.id === modelId);
  return model?.name || modelId;
};

export default function Tasks() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { lovableModels, personalModels } = useAvailableModels();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  
  // Inline editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState('');
  
  // Model configuration state
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [perModelSettings, setPerModelSettings] = useState<PerModelSettingsData>({});
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchTasks();
    }
  }, [user, authLoading, navigate]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Parse session_config for each task
      const tasksWithConfig = (data || []).map(task => ({
        ...task,
        session_config: task.session_config as Task['session_config']
      }));
      
      setTasks(tasksWithConfig);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!user || !newTaskTitle.trim()) return;
    setCreating(true);

    try {
      const sessionConfig = {
        selectedModels,
        perModelSettings,
      };

      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          user_id: user.id,
          title: newTaskTitle.trim(),
          session_config: JSON.parse(JSON.stringify(sessionConfig)),
        }])
        .select()
        .single();

      if (error) throw error;

      const newTask = {
        ...data,
        session_config: data.session_config as Task['session_config']
      };

      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
      toast.success(t('common.success'));
      
      // Navigate to expert panel with new task and model settings
      navigate(`/expert-panel?task=${data.id}`, {
        state: {
          selectedModels,
          perModelSettings,
        }
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', taskToDelete.id);

      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
      toast.success(t('common.success'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setTaskToDelete(null);
    }
  };

  const handleOpenTask = (task: Task) => {
    // Load saved configuration from task
    const savedModels = task.session_config?.selectedModels || [];
    const savedSettings = task.session_config?.perModelSettings || {};
    
    navigate(`/expert-panel?task=${task.id}`, {
      state: {
        selectedModels: savedModels,
        perModelSettings: savedSettings,
      }
    });
  };

  // Inline editing handlers
  const handleStartEditTitle = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTaskId(task.id);
    setEditedTaskTitle(task.title);
  };

  const handleSaveTitle = async (taskId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!editedTaskTitle.trim()) return;
    
    const newTitle = editedTaskTitle.trim().slice(0, 100);
    
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ title: newTitle })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(t => t.id === taskId ? { ...t, title: newTitle } : t));
      setEditingTaskId(null);
      setEditedTaskTitle('');
      toast.success(t('tasks.titleSaved'));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancelEditTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTaskId(null);
    setEditedTaskTitle('');
  };

  // Get role label for a model
  const getModelRole = (modelId: string) => {
    const settings = perModelSettings[modelId];
    const role = settings?.role || DEFAULT_MODEL_SETTINGS.role;
    return t(`role.${role}`);
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
          <h1 className="text-3xl font-bold">{t('tasks.title')}</h1>
        </div>

        {/* Create New Task */}
        <HydraCard variant="glass" className="p-6 mb-8">
          <HydraCardHeader>
            <Plus className="h-5 w-5 text-primary" />
            <HydraCardTitle>{t('tasks.new')}</HydraCardTitle>
          </HydraCardHeader>
          <HydraCardContent>
            <div className="space-y-4">
              {/* Task title input */}
              <div className="flex gap-3">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Название задачи..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                />
                <Button 
                  onClick={handleCreateTask} 
                  disabled={creating || !newTaskTitle.trim() || selectedModels.length === 0}
                  className="hydra-glow-sm"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Model selector and settings button */}
              <div className="flex items-center gap-3">
                <MultiModelSelector 
                  value={selectedModels} 
                  onChange={setSelectedModels}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSettingsOpen(true)}
                  disabled={selectedModels.length === 0}
                  title={t('tasks.modelConfig')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Selected models preview */}
              {selectedModels.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  {selectedModels.map((modelId) => (
                    <div 
                      key={modelId}
                      className="flex items-center gap-3 text-sm py-1.5 px-2 rounded-md bg-muted/30"
                    >
                      {getModelIcon(modelId)}
                      <span className="font-medium flex-1 truncate">{getModelName(modelId)}</span>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-background/50">
                        {getModelRole(modelId)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedModels.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('tasks.selectModelsFirst')}
                </p>
              )}
            </div>
          </HydraCardContent>
        </HydraCard>
        
        {/* Model Settings Sheet */}
        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>{t('tasks.modelConfig')}</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <PerModelSettings
                selectedModels={selectedModels}
                settings={perModelSettings}
                onChange={setPerModelSettings}
                className="border-t-0"
              />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <HydraCard variant="glass" className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('tasks.empty')}</p>
            </HydraCard>
          ) : (
            tasks.map((task) => (
              <HydraCard 
                key={task.id} 
                variant="glass" 
                glow 
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => editingTaskId !== task.id && handleOpenTask(task)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {editingTaskId === task.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editedTaskTitle}
                          onChange={(e) => setEditedTaskTitle(e.target.value)}
                          className="h-8 text-sm flex-1"
                          maxLength={100}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle(task.id);
                            if (e.key === 'Escape') handleCancelEditTitle(e as any);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary hover:text-primary/80 shrink-0"
                          onClick={(e) => handleSaveTitle(task.id, e)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-hydra-critical shrink-0"
                          onClick={handleCancelEditTitle}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{task.title}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleStartEditTitle(task, e)}
                          title={t('tasks.editTitle')}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(task.updated_at), 'dd.MM.yyyy HH:mm')}</span>
                    </div>
                    
                    {/* Saved models preview */}
                    {task.session_config?.selectedModels && task.session_config.selectedModels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {task.session_config.selectedModels.map((modelId) => (
                          <div 
                            key={modelId}
                            className="flex items-center gap-1.5 text-xs py-0.5 px-2 rounded-full bg-muted/50"
                          >
                            {getModelIcon(modelId)}
                            <span className="truncate max-w-[120px]">{getModelName(modelId)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-hydra-critical shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaskToDelete(task);
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasks.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasks.deleteConfirmDescription')}
              {taskToDelete && (
                <span className="block mt-2 font-medium text-foreground">
                  "{taskToDelete.title}"
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('tasks.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
