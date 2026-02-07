 import React, { useState, useEffect, useMemo, useRef } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '@/contexts/AuthContext';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Layout } from '@/components/layout/Layout';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Table, TableBody } from '@/components/ui/table';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import { Plus, Loader2, MessageSquare, Search, ListTodo } from 'lucide-react';
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
   ResizablePanelGroup,
   ResizablePanel,
   ResizableHandle,
 } from '@/components/ui/resizable';
 import { MultiModelSelector } from '@/components/warroom/MultiModelSelector';
 import { PerModelSettingsData, DEFAULT_MODEL_SETTINGS } from '@/components/warroom/PerModelSettings';
 import { ALL_VALID_MODEL_IDS, getModelDisplayName, getModelInfo } from '@/hooks/useAvailableModels';
 import { TaskRow, Task } from '@/components/tasks/TaskRow';
 import { TaskDetailsPanel } from '@/components/tasks/TaskDetailsPanel';
 import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
 import { Bot, Sparkles, Cpu } from 'lucide-react';
 import { useNavigatorResize } from '@/hooks/useNavigatorResize';
 import { NavigatorHeader } from '@/components/layout/NavigatorHeader';
 import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
 import { cn } from '@/lib/utils';
 
 // Filter out deprecated/unavailable model IDs
 const filterValidModels = (modelIds: string[]): string[] => {
   return modelIds.filter(id => ALL_VALID_MODEL_IDS.includes(id));
 };
 
 // Get model icon based on provider
 const getModelIcon = (modelId: string) => {
   const { isLovable, model } = getModelInfo(modelId);
   
   if (!model) return <Bot className="h-4 w-4 text-muted-foreground" />;
   
   if (isLovable) {
     return <Sparkles className="h-4 w-4 text-primary" />;
   }
   return <Cpu className="h-4 w-4 text-accent-foreground" />;
 };

export default function Tasks() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
   const [saving, setSaving] = useState(false);
  
   // Search
   const [searchQuery, setSearchQuery] = useState('');
  
   // Selected task
   const [selectedTask, setSelectedTask] = useState<Task | null>(null);
   
  // Unsaved changes protection
   const hasUnsavedChangesRef = useRef(false);
   const [pendingTask, setPendingTask] = useState<Task | null>(null);
   const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Navigator resize
  const nav = useNavigatorResize({ storageKey: 'tasks', defaultMaxSize: 40 });

  // Model configuration state for new task
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [perModelSettings, setPerModelSettings] = useState<PerModelSettingsData>({});
  const [useHybridStreaming, setUseHybridStreaming] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchTasks();
    }
  }, [user, authLoading, navigate]);

   // Filter tasks
   const filteredTasks = useMemo(() => {
     if (!searchQuery.trim()) return tasks;
     return tasks.filter(task => 
       task.title.toLowerCase().includes(searchQuery.toLowerCase())
     );
   }, [tasks, searchQuery]);
 
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
        useHybridStreaming,
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
          useHybridStreaming,
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

   const handleUpdateTitle = async (taskId: string, newTitle: string) => {
     setSaving(true);
    try {
      const { error } = await supabase
        .from('sessions')
         .update({ title: newTitle.slice(0, 100) })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(t => t.id === taskId ? { ...t, title: newTitle } : t));
       if (selectedTask?.id === taskId) {
         setSelectedTask({ ...selectedTask, title: newTitle });
       }
      toast.success(t('tasks.titleSaved'));
    } catch (error: any) {
      toast.error(error.message);
     } finally {
       setSaving(false);
    }
  };

   const handleUpdateConfig = async (taskId: string, config: Task['session_config']) => {
     setSaving(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ 
           session_config: JSON.parse(JSON.stringify(config)),
          updated_at: new Date().toISOString()
        })
         .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(t => 
         t.id === taskId 
           ? { ...t, session_config: config, updated_at: new Date().toISOString() } 
          : t
      ));
       if (selectedTask?.id === taskId) {
         setSelectedTask({ ...selectedTask, session_config: config, updated_at: new Date().toISOString() });
       }
      
      toast.success(t('tasks.configSaved'));
    } catch (error: any) {
      toast.error(error.message);
     } finally {
       setSaving(false);
    }
  };

   const handleSelectTask = (task: Task) => {
     // Check for unsaved changes before switching
     if (hasUnsavedChangesRef.current && selectedTask?.id !== task.id) {
       setPendingTask(task);
       setShowUnsavedDialog(true);
       return;
     }
     setSelectedTask(task);
   };

   const handleConfirmTaskSwitch = () => {
     setShowUnsavedDialog(false);
     if (pendingTask) {
       setSelectedTask(pendingTask);
       setPendingTask(null);
     }
   };

   const handleCancelTaskSwitch = () => {
     setShowUnsavedDialog(false);
     setPendingTask(null);
   };
  
   const handleDeleteClick = (task: Task, e: React.MouseEvent) => {
     e.stopPropagation();
     setTaskToDelete(task);
   };

   const handleConfirmDelete = async () => {
     if (!taskToDelete) return;
     
     try {
       const { error } = await supabase
         .from('sessions')
         .delete()
         .eq('id', taskToDelete.id);
 
       if (error) throw error;
 
       setTasks(tasks.filter(t => t.id !== taskToDelete.id));
       if (selectedTask?.id === taskToDelete.id) {
         setSelectedTask(null);
       }
       toast.success(t('common.success'));
     } catch (error: any) {
       toast.error(error.message);
     } finally {
       setTaskToDelete(null);
     }
   };
 
   // Get role label for a model (for new task form)
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
       <div className="h-[calc(100vh-4rem)] flex flex-col">
         {/* Header */}
         <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
           <div>
             <div className="flex items-center gap-3">
               <ListTodo className="h-6 w-6 text-primary" />
               <h1 className="text-2xl font-bold">{t('tasks.title')}</h1>
            </div>
             <p className="text-sm text-muted-foreground mt-1">{t('tasks.pageDescription')}</p>
           </div>
         </div>

         {/* Main content */}
         <ResizablePanelGroup direction="horizontal" className="flex-1">
           {/* Left panel - List */}
            <ResizablePanel 
              ref={nav.panelRef}
              defaultSize={nav.panelSize} 
              minSize={4} 
              maxSize={60}
              onResize={nav.onPanelResize}
            >
             <div className="h-full flex flex-col hydra-nav-surface">
               <NavigatorHeader
                 title={t('tasks.title')}
                 isMinimized={nav.isMinimized}
                 onToggle={nav.toggle}
               />
               {nav.isMinimized ? (
                 <TooltipProvider delayDuration={200}>
                   <div className="flex-1 overflow-auto p-1 space-y-1">
                     {filteredTasks.map((task) => (
                       <Tooltip key={task.id}>
                         <TooltipTrigger asChild>
                           <div
                             className={cn(
                               "flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                               selectedTask?.id === task.id ? "bg-primary/10" : "hover:bg-muted/30"
                             )}
                             onClick={() => handleSelectTask(task)}
                           >
                             <MessageSquare className={cn("h-5 w-5", task.is_active ? "text-primary" : "text-muted-foreground")} />
                           </div>
                         </TooltipTrigger>
                         <TooltipContent side="right" className="max-w-[220px]">
                           <div className="space-y-1">
                             <span className="font-medium text-sm">{task.title}</span>
                             <ul className="text-xs text-muted-foreground space-y-0.5">
                               <li>• {(task.session_config?.selectedModels?.length || 0)} моделей</li>
                             </ul>
                           </div>
                         </TooltipContent>
                       </Tooltip>
                     ))}
                   </div>
                 </TooltipProvider>
               ) : (
               <div className="flex-1 flex flex-col">
               {/* Search and Create */}
               <div className="p-4 border-b space-y-3">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder={t('tasks.search')}
                     className="pl-9"
                   />
                 </div>
                 
                 {/* Create new task inline */}
                 <div className="space-y-2">
                   <div className="flex gap-2">
                     <Input
                       value={newTaskTitle}
                       onChange={(e) => setNewTaskTitle(e.target.value)}
                       placeholder={t('tasks.newPlaceholder')}
                       className="flex-1"
                       onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                     />
                     <Button 
                       onClick={handleCreateTask} 
                       disabled={creating || !newTaskTitle.trim() || selectedModels.length === 0}
                       size="icon"
                     >
                       {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                     </Button>
                   </div>
                   <MultiModelSelector 
                     value={selectedModels} 
                     onChange={setSelectedModels}
                     className="w-full"
                   />
                   {selectedModels.length === 0 && (
                     <p className="text-xs text-muted-foreground">
                       {t('tasks.selectModelsFirst')}
                     </p>
                   )}
                   {selectedModels.length > 0 && (
                     <div className="flex flex-wrap gap-1">
                       {selectedModels.slice(0, 3).map((modelId) => (
                         <div 
                           key={modelId}
                           className="flex items-center gap-1 text-[10px] py-0.5 px-1.5 rounded bg-muted/50"
                         >
                           {getModelIcon(modelId)}
                           <span className="truncate max-w-[80px]">{getModelDisplayName(modelId)}</span>
                         </div>
                       ))}
                       {selectedModels.length > 3 && (
                         <span className="text-[10px] text-muted-foreground py-0.5 px-1.5">
                           +{selectedModels.length - 3}
                         </span>
                       )}
                     </div>
                   )}
                 </div>
               </div>
 
               {/* Tasks list */}
               <div className="flex-1 overflow-auto">
                 {filteredTasks.length === 0 ? (
                   <div className="h-full flex items-center justify-center text-muted-foreground p-8">
                     <div className="text-center">
                       <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                       <p>
                         {tasks.length === 0
                           ? t('tasks.empty')
                           : t('tasks.noResults')}
                       </p>
                     </div>
                   </div>
                 ) : (
                   <Table>
                     <TableBody>
                       {filteredTasks.map((task) => (
                         <TaskRow
                           key={task.id}
                           task={task}
                           isSelected={selectedTask?.id === task.id}
                           validModels={filterValidModels(task.session_config?.selectedModels || [])}
                           onSelect={handleSelectTask}
                           onDelete={handleDeleteClick}
                         />
                       ))}
                     </TableBody>
                   </Table>
                 )}
                </div>
              </div>
              )}
            </div>
           </ResizablePanel>
 
           <ResizableHandle withHandle />
 
           {/* Right panel - Details */}
           <ResizablePanel defaultSize={100 - nav.panelSize} minSize={40} maxSize={96}>
              <TaskDetailsPanel
                task={selectedTask}
                onUpdateTitle={handleUpdateTitle}
                onUpdateConfig={handleUpdateConfig}
                onDelete={() => selectedTask && setTaskToDelete(selectedTask)}
                saving={saving}
                hasUnsavedChangesRef={hasUnsavedChangesRef}
              />
            </ResizablePanel>
         </ResizablePanelGroup>
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
               onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('tasks.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={handleConfirmTaskSwitch}
        onCancel={handleCancelTaskSwitch}
      />
    </Layout>
  );
}
