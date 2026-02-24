import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Loader2, MessageSquare, Search, ListTodo, Flame, BookOpen, FolderOpen, Target, ChevronRight, ChevronDown, CornerDownRight } from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { MultiModelSelector } from '@/components/warroom/MultiModelSelector';
import { PerModelSettingsData, DEFAULT_MODEL_SETTINGS } from '@/components/warroom/PerModelSettings';
import { ALL_VALID_MODEL_IDS, getModelDisplayName, getModelInfo } from '@/hooks/useAvailableModels';
import { TaskRow, Task } from '@/components/tasks/TaskRow';
import { StaffGroupHeader } from '@/components/staff/StaffGroupHeader';
import { TaskDetailsPanel } from '@/components/tasks/TaskDetailsPanel';
import { TaskDeleteDialog } from '@/components/tasks/TaskDeleteDialog';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useTaskDeletion, DeletionMode } from '@/hooks/useTaskDeletion';
import { Bot, Sparkles, Cpu } from 'lucide-react';
import { useNavigatorResize } from '@/hooks/useNavigatorResize';
import { NavigatorHeader } from '@/components/layout/NavigatorHeader';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useStrategicPlans, StrategicPlan } from '@/hooks/useStrategicPlans';
import { Badge } from '@/components/ui/badge';
 
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
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
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

   // Strategic Plans
   const { plans, createPlan, deletePlan, refetch: refetchPlans } = useStrategicPlans(user?.id);
   const [showNewPlan, setShowNewPlan] = useState(false);
   const [newPlanTitle, setNewPlanTitle] = useState('');
   const [creatingPlan, setCreatingPlan] = useState(false);
   const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
   const [expandedAspects, setExpandedAspects] = useState<Set<string>>(new Set());

  // Task deletion hook
  const { deleteTask, deleteAllTasks, deleting } = useTaskDeletion({
    userId: user?.id,
    onTaskDeleted: (taskId) => {
      if (taskId === '__all__') {
        setTasks([]);
        setSelectedTask(null);
      } else {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (selectedTask?.id === taskId) setSelectedTask(null);
      }
      setTaskToDelete(null);
      setShowBulkDelete(false);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchTasks();
    }
  }, [user, authLoading, navigate]);

   // Group expand states
   const [showSystemTasks, setShowSystemTasks] = useState(true);
   const [showUserTasks, setShowUserTasks] = useState(true);

   // Filter and split tasks into groups
   const { systemTasks, userTasks, planTasks, standaloneTasks } = useMemo(() => {
     const q = searchQuery.trim().toLowerCase();
     const filtered = q
       ? tasks.filter(task => {
           const title = (language === 'en' && task.title_en) ? task.title_en : task.title;
           return title.toLowerCase().includes(q);
         })
       : tasks;
     return {
       systemTasks: filtered.filter(t => t.is_system),
       userTasks: filtered.filter(t => !t.is_system),
       planTasks: filtered.filter(t => !t.is_system && t.plan_id),
       standaloneTasks: filtered.filter(t => !t.is_system && !t.plan_id),
     };
   }, [tasks, searchQuery, language]);

   const filteredTasks = useMemo(() => [...systemTasks, ...userTasks], [systemTasks, userTasks]);

   // Build tree for a plan
   const getAspectsForPlan = (planId: string) => 
     planTasks.filter(t => t.plan_id === planId && !t.parent_id);
   const getSubtasksForAspect = (aspectId: string) =>
     planTasks.filter(t => t.parent_id === aspectId);

   const togglePlanExpanded = (planId: string) => {
     setExpandedPlans(prev => {
       const next = new Set(prev);
       next.has(planId) ? next.delete(planId) : next.add(planId);
       return next;
     });
   };

   const toggleAspectExpanded = (aspectId: string) => {
     setExpandedAspects(prev => {
       const next = new Set(prev);
       next.has(aspectId) ? next.delete(aspectId) : next.add(aspectId);
       return next;
     });
   };
 
  const fetchTasks = async () => {
    if (!user) return;

    try {
      // Fetch user's own tasks + system tasks (visible to everyone via RLS)
      const [userResult, systemResult] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_system', false)
          .order('updated_at', { ascending: false }),
        supabase
          .from('sessions')
          .select('*')
          .eq('is_system', true)
          .order('updated_at', { ascending: false }),
      ]);

      if (userResult.error) throw userResult.error;
      if (systemResult.error) throw systemResult.error;
      
      const parseConfig = (task: any): Task => ({
        ...task,
        session_config: task.session_config as Task['session_config'],
      });
      
      const allTasks = [
        ...(systemResult.data || []).map(parseConfig),
        ...(userResult.data || []).map(parseConfig),
      ];
      
      setTasks(allTasks);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

   const handleCreatePlan = async () => {
     if (!newPlanTitle.trim()) return;
     setCreatingPlan(true);
     try {
       const plan = await createPlan(newPlanTitle.trim());
       if (plan) {
         setNewPlanTitle('');
         setShowNewPlan(false);
         setExpandedPlans(prev => new Set(prev).add(plan.id));
       }
     } finally {
       setCreatingPlan(false);
     }
   };

   const handleCreateTaskInPlan = async (planId: string, parentId?: string) => {
     if (!user) return;
     const title = parentId ? t('plans.subtask') : t('plans.aspect');
     try {
       const { data, error } = await supabase
         .from('sessions')
         .insert([{
           user_id: user.id,
           title: `${title} ${new Date().toLocaleTimeString().slice(0, 5)}`,
           plan_id: planId,
           parent_id: parentId || null,
           session_config: JSON.parse(JSON.stringify({ selectedModels: [], perModelSettings: {}, useHybridStreaming: true })),
         }])
         .select()
         .single();

       if (error) throw error;

       const newTask: Task = {
         ...data,
         plan_id: data.plan_id,
         parent_id: data.parent_id,
         sort_order: data.sort_order,
         session_config: data.session_config as Task['session_config'],
       };
       setTasks(prev => [newTask, ...prev]);
       setSelectedTask(newTask);
       if (parentId) setExpandedAspects(prev => new Set(prev).add(parentId));
       toast.success(t('common.success'));
     } catch (err: any) {
       toast.error(err.message);
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
         plan_id: data.plan_id,
         parent_id: data.parent_id,
         sort_order: data.sort_order,
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
     if (task.is_system) return; // Safety check
     setTaskToDelete(task);
   };

    const handleDuplicateTask = async (task: Task, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('sessions')
          .insert([{
            user_id: user.id,
            title: `${task.title} (${t('common.copy')})`,
            description: task.description,
            session_config: JSON.parse(JSON.stringify(task.session_config)),
            is_system: false,
            is_shared: false,
          }])
          .select()
          .single();

        if (error) throw error;

        const newTask: Task = {
          ...data,
          session_config: data.session_config as Task['session_config'],
        };
        // Re-fetch to get proper ordering
        await fetchTasks();
        setSelectedTask(newTask);
        toast.success(t('tasks.duplicated'));
      } catch (error: any) {
        toast.error(error.message);
      }
    };

    const handleConfirmDelete = async (mode: DeletionMode) => {
      if (!taskToDelete) return;
      await deleteTask(taskToDelete.id, mode);
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
    <Layout hideHeader>
       <div className="h-screen flex flex-col">
         {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-3">
                <ListTodo className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">{t('tasks.title')}</h1>
             </div>
              <p className="text-sm text-muted-foreground mt-1">{t('tasks.pageDescription')}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative" data-guide="tasks-search">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('tasks.search')}
                  className="pl-9 w-48 lg:w-64"
                />
              </div>
              {userTasks.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setShowBulkDelete(true)}
                    >
                      <Flame className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('tasks.startFresh')}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('tasks.deleteAllDescription')}</TooltipContent>
                </Tooltip>
              )}
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
              data-guide="tasks-list"
            >
             <div className="h-full flex flex-col hydra-nav-surface">
               <NavigatorHeader
                 title={t('tasks.title')}
                 isMinimized={nav.isMinimized}
                 onToggle={nav.toggle}
               >
                 <SidebarTrigger className="text-muted-foreground hover:text-primary h-7 w-7 shrink-0" />
               </NavigatorHeader>
               {nav.isMinimized ? (
                 <TooltipProvider delayDuration={200}>
                   <div className="flex-1 overflow-auto p-1 space-y-1">
                     {filteredTasks.map((task) => (
                       <Tooltip key={task.id}>
                         <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "relative flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors",
                                selectedTask?.id === task.id ? "bg-primary/10" : "hover:bg-muted/30"
                              )}
                              onClick={() => handleSelectTask(task)}
                            >
                               {task.is_system 
                                 ? <BookOpen className="h-5 w-5 text-hydra-info" />
                                 : <MessageSquare className={cn("h-5 w-5", task.is_active ? "text-primary" : "text-muted-foreground")} />
                               }
                              {selectedTask?.id === task.id && hasUnsavedChangesRef.current && (
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-hydra-warning animate-pulse-glow" />
                              )}
                             </div>
                         </TooltipTrigger>
                         <TooltipContent side="right" className="max-w-[220px]">
                           <div className="space-y-1">
                             <span className="font-medium text-sm">{(language === 'en' && task.title_en) ? task.title_en : task.title}</span>
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
                <div className="p-3 border-b" data-guide="tasks-create-form">
                     {showNewPlan ? (
                       <div className="flex gap-2">
                         <Input
                           value={newPlanTitle}
                           onChange={(e) => setNewPlanTitle(e.target.value)}
                           placeholder={t('plans.newPlaceholder')}
                           className="flex-1 text-sm"
                           autoFocus
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') handleCreatePlan();
                             if (e.key === 'Escape') { setShowNewPlan(false); setNewPlanTitle(''); }
                           }}
                         />
                         <Button size="icon" onClick={handleCreatePlan} disabled={creatingPlan || !newPlanTitle.trim()}>
                           {creatingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                         </Button>
                       </div>
                     ) : (
                       <Button
                         variant="ghost"
                         size="sm"
                         className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                         onClick={() => setShowNewPlan(true)}
                       >
                         <Target className="h-4 w-4" />
                         {t('plans.new')}
                       </Button>
                     )}
                </div>
 
               {/* Tasks list */}
               <div className="flex-1 overflow-auto">
                 {filteredTasks.length === 0 && plans.length === 0 ? (
                   <div className="h-full flex items-center justify-center text-muted-foreground p-8">
                     <div className="text-center">
                       <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                       <p>{tasks.length === 0 ? t('tasks.empty') : t('tasks.noResults')}</p>
                     </div>
                   </div>
                 ) : (
                    <Table>
                      <TableBody>
                        {/* System tasks group */}
                        {systemTasks.length > 0 && (
                          <>
                            <StaffGroupHeader
                              expanded={showSystemTasks}
                              onToggle={() => setShowSystemTasks(v => !v)}
                              icon={<BookOpen className="h-4 w-4 text-hydra-info" />}
                              label={t('tasks.tutorialExamples')}
                              count={systemTasks.length}
                              guideId="tasks-system-group"
                            />
                            {showSystemTasks && systemTasks.map((task) => (
                              <TaskRow
                                key={task.id}
                                task={task}
                                isSelected={selectedTask?.id === task.id}
                                validModels={filterValidModels(task.session_config?.selectedModels || [])}
                                hasUnsavedChanges={selectedTask?.id === task.id && hasUnsavedChangesRef.current}
                                onSelect={handleSelectTask}
                                onDuplicate={handleDuplicateTask}
                              />
                            ))}
                          </>
                        )}

                        {/* Strategic Plans */}
                        {plans.map((plan) => {
                          const aspects = getAspectsForPlan(plan.id);
                          const isPlanExpanded = expandedPlans.has(plan.id);
                          return (
                            <React.Fragment key={`plan-${plan.id}`}>
                              <StaffGroupHeader
                                expanded={isPlanExpanded}
                                onToggle={() => togglePlanExpanded(plan.id)}
                                icon={<Target className="h-4 w-4 text-primary" />}
                                label={(language === 'en' && plan.title_en) ? plan.title_en : plan.title}
                                count={aspects.length}
                                guideId={`plan-${plan.id}`}
                                actions={
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => { e.stopPropagation(); handleCreateTaskInPlan(plan.id); }}
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('plans.addAspect')}</TooltipContent>
                                  </Tooltip>
                                }
                              />
                              {isPlanExpanded && aspects.map((aspect) => {
                                const subtasks = getSubtasksForAspect(aspect.id);
                                const isAspectExpanded = expandedAspects.has(aspect.id);
                                return (
                                  <React.Fragment key={aspect.id}>
                                    {/* Aspect row with indent */}
                                    <tr
                                      className={cn(
                                        'cursor-pointer transition-colors group border-b',
                                        selectedTask?.id === aspect.id ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
                                      )}
                                      onClick={() => handleSelectTask(aspect)}
                                    >
                                      <td colSpan={2} className="py-2">
                                        <div className="flex items-center gap-2 pl-8">
                                          {subtasks.length > 0 && (
                                            <button
                                              className="p-0.5 rounded hover:bg-muted/50"
                                              onClick={(e) => { e.stopPropagation(); toggleAspectExpanded(aspect.id); }}
                                            >
                                              {isAspectExpanded
                                                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                            </button>
                                          )}
                                          <MessageSquare className={cn("h-4 w-4 shrink-0", aspect.is_active ? "text-primary" : "text-muted-foreground")} />
                                          <span className="font-medium text-sm truncate flex-1">
                                            {(language === 'en' && aspect.title_en) ? aspect.title_en : aspect.title}
                                          </span>
                                          {subtasks.length > 0 && (
                                            <Badge variant="secondary" className="text-[10px]">{subtasks.length}</Badge>
                                          )}
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                onClick={(e) => { e.stopPropagation(); handleCreateTaskInPlan(plan.id, aspect.id); }}
                                              >
                                                <Plus className="h-3 w-3" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('plans.addSubtask')}</TooltipContent>
                                          </Tooltip>
                                        </div>
                                      </td>
                                    </tr>
                                    {/* Subtasks */}
                                    {isAspectExpanded && subtasks.map((sub) => (
                                      <tr
                                        key={sub.id}
                                        className={cn(
                                          'cursor-pointer transition-colors border-b',
                                          selectedTask?.id === sub.id ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
                                        )}
                                        onClick={() => handleSelectTask(sub)}
                                      >
                                        <td colSpan={2} className="py-2">
                                          <div className="flex items-center gap-2 pl-14">
                                            <CornerDownRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                            <span className="text-sm truncate">
                                              {(language === 'en' && sub.title_en) ? sub.title_en : sub.title}
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                );
                              })}
                              {isPlanExpanded && aspects.length === 0 && (
                                <tr>
                                  <td colSpan={2} className="py-3">
                                    <p className="text-xs text-muted-foreground text-center">{t('plans.emptyPlan')}</p>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}

                        {/* Standalone user tasks (not in any plan) */}
                        {standaloneTasks.length > 0 && (
                          <>
                            <StaffGroupHeader
                              expanded={showUserTasks}
                              onToggle={() => setShowUserTasks(v => !v)}
                              icon={<FolderOpen className="h-4 w-4 text-primary" />}
                              label={plans.length > 0 ? t('plans.standaloneTasks') : t('tasks.myTasks')}
                              count={standaloneTasks.length}
                              guideId="tasks-user-group"
                            />
                            {showUserTasks && standaloneTasks.map((task) => (
                              <TaskRow
                                key={task.id}
                                task={task}
                                isSelected={selectedTask?.id === task.id}
                                validModels={filterValidModels(task.session_config?.selectedModels || [])}
                                hasUnsavedChanges={selectedTask?.id === task.id && hasUnsavedChangesRef.current}
                                onSelect={handleSelectTask}
                                onDelete={handleDeleteClick}
                              />
                            ))}
                          </>
                        )}
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
            <ResizablePanel defaultSize={100 - nav.panelSize} minSize={40} maxSize={96} data-guide="tasks-details">
               <TaskDetailsPanel
                 task={selectedTask}
                 onUpdateTitle={handleUpdateTitle}
                 onUpdateConfig={handleUpdateConfig}
                 onDelete={() => selectedTask && !selectedTask.is_system && setTaskToDelete(selectedTask)}
                 onDuplicate={(task) => handleDuplicateTask(task, { stopPropagation: () => {} } as React.MouseEvent)}
                 saving={saving}
                 hasUnsavedChangesRef={hasUnsavedChangesRef}
               />
            </ResizablePanel>
         </ResizablePanelGroup>
       </div>
       {/* Delete Task Dialog */}
       <TaskDeleteDialog
         open={!!taskToDelete}
         onOpenChange={(open) => !open && setTaskToDelete(null)}
         taskTitle={taskToDelete?.title || ''}
         deleting={deleting}
         onConfirm={handleConfirmDelete}
       />

       {/* Bulk Delete Dialog */}
       <TaskDeleteDialog
         open={showBulkDelete}
         onOpenChange={setShowBulkDelete}
         taskTitle=""
         deleting={deleting}
         onConfirm={() => deleteAllTasks()}
         bulk
         taskCount={userTasks.length}
       />
      
      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={handleConfirmTaskSwitch}
        onCancel={handleCancelTaskSwitch}
      />
    </Layout>
  );
}
