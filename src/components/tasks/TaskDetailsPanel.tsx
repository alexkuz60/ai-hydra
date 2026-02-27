import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Play, Trash2, Pencil, Check, X, Bot, Sparkles, Cpu, Loader2, Save, Lock, Copy, FileText, Target, Zap, StopCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { TaskFilesPanel } from './TaskFilesPanel';
import { FileUpload, AttachedFile } from '@/components/warroom/FileUpload';
import { useTaskFiles } from '@/hooks/useTaskFiles';

import { ConceptPatentSearch } from './ConceptPatentSearch';
import { ConceptVisionaryCall } from './ConceptVisionaryCall';
import { ConceptStrategistCall } from './ConceptStrategistCall';
import { ConceptResponsesPreview } from './ConceptResponsesPreview';
import { ConceptPipelineTimeline, ConceptPhase } from './ConceptPipelineTimeline';
import { useConceptPipeline } from '@/hooks/useConceptPipeline';
import { useConceptResponses } from '@/hooks/useConceptResponses';
import { useConceptInvoke } from '@/hooks/useConceptInvoke';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MultiModelSelector } from '@/components/warroom/MultiModelSelector';
import { PerModelSettings, PerModelSettingsData, DEFAULT_MODEL_SETTINGS } from '@/components/warroom/PerModelSettings';
import { SessionSettings } from '@/components/warroom/SessionSettings';
import { getModelInfo, getModelDisplayName, ALL_VALID_MODEL_IDS } from '@/hooks/useAvailableModels';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import type { Task } from './TaskRow';

// Filter out deprecated/unavailable model IDs
const filterValidModels = (modelIds: string[]): string[] => {
  return modelIds.filter(id => ALL_VALID_MODEL_IDS.includes(id));
};
 
 function getModelIcon(modelId: string) {
   const { isLovable, model } = getModelInfo(modelId);
   
   if (!model) return <Bot className="h-4 w-4 text-muted-foreground" />;
   
   if (isLovable) {
     return <Sparkles className="h-4 w-4 text-primary" />;
   }
   return <Cpu className="h-4 w-4 text-accent-foreground" />;
 }
 
/** Small wrapper: FileUpload dropdown that auto-uploads picked files to task storage */
function ConceptFileUpload({ taskId }: { taskId: string }) {
  const [attached, setAttached] = React.useState<AttachedFile[]>([]);
  const { uploadFile } = useTaskFiles(taskId);

  React.useEffect(() => {
    if (attached.length === 0) return;
    // Upload each newly attached file then clear
    (async () => {
      for (const a of attached) {
        if (a.file) await uploadFile(a.file);
      }
      setAttached([]);
    })();
  }, [attached]);

  return (
    <FileUpload
      files={attached}
      onFilesChange={setAttached}
      disabled={false}
    />
  );
}


interface TaskDetailsPanelProps {
  task: Task | null;
  onUpdateTitle: (taskId: string, title: string) => Promise<void>;
  onUpdateConfig: (taskId: string, config: Task['session_config'], description?: string) => Promise<void>;
  onDelete: () => void;
  onDuplicate?: (task: Task) => void;
  onRequestTaskChange?: (task: Task) => void;
  saving?: boolean;
  hasUnsavedChangesRef?: React.MutableRefObject<boolean>;
}
 
export function TaskDetailsPanel({
  task,
  onUpdateTitle,
  onUpdateConfig,
  onDelete,
  onDuplicate,
  onRequestTaskChange,
  saving = false,
  hasUnsavedChangesRef,
}: TaskDetailsPanelProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const displayTitle = task ? ((language === 'en' && task.title_en) ? task.title_en : task.title) : '';

  // Editing title state
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  // Model configuration state
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [perModelSettings, setPerModelSettings] = useState<PerModelSettingsData>({});
  const [useHybridStreaming, setUseHybridStreaming] = useState(true);
  const [taskDescription, setTaskDescription] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [includePatent, setIncludePatent] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'visionary' | 'strategist' | 'patent'>('visionary');

  // Concept responses for plan-level tasks
  const currentIsPlan = !!(task?.session_config as any)?.__isPlan;
  const conceptPlanId = currentIsPlan ? ((task?.session_config as any)?.__planId || task?.plan_id || task?.id || null) : null;
  const { responses: conceptResponses, refetch: refetchResponses } = useConceptResponses(conceptPlanId);

  // Pipeline for concept analysis
  const pipeline = useConceptPipeline({
    planId: conceptPlanId || '',
    planTitle: displayTitle,
    planGoal: taskDescription,
    includePatent,
    onStepComplete: refetchResponses,
  });

  // Inline concept invocation (kept for individual step calls)
  const { invoke: invokeExpert, loading: expertLoading } = useConceptInvoke({
    planId: conceptPlanId || '',
    planTitle: displayTitle,
    planGoal: taskDescription,
    onComplete: refetchResponses,
  });

  // Sync pipeline statuses from existing responses
  useEffect(() => {
    pipeline.syncFromResponses();
  }, [conceptResponses]);

  // Unsaved changes protection
  const unsavedChanges = useUnsavedChanges(false);
  const [pendingTaskSwitch, setPendingTaskSwitch] = useState<Task | null>(null);

  // Stable serialization key for deep comparison of session_config
  const configKey = useMemo(() => 
    task ? JSON.stringify(task.session_config) : '', 
    [task?.session_config]
  );

  // Sync hasChanges with unsavedChanges hook and ref
  React.useEffect(() => {
    unsavedChanges.setHasUnsavedChanges(hasChanges);
    if (hasUnsavedChangesRef) {
      hasUnsavedChangesRef.current = hasChanges;
    }
  }, [hasChanges, hasUnsavedChangesRef]);

  // Track task load generation to suppress normalization-triggered changes
  const loadGenRef = React.useRef(0);
  const userInteractedRef = React.useRef(false);

  // Initialize state when task changes or when config is updated
  React.useEffect(() => {
    if (task) {
      loadGenRef.current += 1;
      userInteractedRef.current = false;
      setSelectedModels(filterValidModels(task.session_config?.selectedModels || []));
      setPerModelSettings(task.session_config?.perModelSettings || {});
      setUseHybridStreaming(task.session_config?.useHybridStreaming ?? true);
      setTaskDescription(task.description || '');
      setIncludePatent(!!(task.session_config as any)?.includePatent);
      setHasChanges(false);
    }
  }, [task?.id, configKey]);
 
   if (!task) {
     return (
       <div className="h-full flex items-center justify-center text-muted-foreground p-8">
         <div className="text-center">
           <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
           <p>{t('tasks.selectTask')}</p>
         </div>
       </div>
     );
   }
 
   const handleStartEditTitle = () => {
     setEditingTitle(true);
     setEditedTitle(task.title);
   };
 
   const handleSaveTitle = async () => {
     if (!editedTitle.trim()) return;
     await onUpdateTitle(task.id, editedTitle.trim());
     setEditingTitle(false);
   };
 
   const handleCancelEditTitle = () => {
     setEditingTitle(false);
     setEditedTitle('');
   };
 
    const handleModelsChange = (models: string[]) => {
      setSelectedModels(models);
      userInteractedRef.current = true;
      setHasChanges(true);
    };
  
     const handleSettingsChange = (settings: PerModelSettingsData) => {
       setPerModelSettings(settings);
       if (userInteractedRef.current) setHasChanges(true);
     };
   
     const handleHybridChange = (value: boolean) => {
       setUseHybridStreaming(value);
       userInteractedRef.current = true;
       setHasChanges(true);
     };
 
   const handleDescriptionChange = (value: string) => {
     setTaskDescription(value);
     userInteractedRef.current = true;
     setHasChanges(true);
   };

   const handleSaveConfig = async () => {
     await onUpdateConfig(task.id, {
       selectedModels,
       perModelSettings,
       useHybridStreaming,
       ...(isPlanLevel ? { includePatent } : {}),
     }, taskDescription);
     setHasChanges(false);
   };
 
   const handleOpenTask = () => {
     navigate(`/expert-panel?task=${task.id}`, {
       state: {
         selectedModels,
         perModelSettings,
         useHybridStreaming,
       }
     });
   };
 
   const getModelRole = (modelId: string) => {
     const settings = perModelSettings[modelId];
     const role = settings?.role || DEFAULT_MODEL_SETTINGS.role;
     return t(`role.${role}`);
   };
 
   const isPlanLevel = !!(task.session_config as any)?.__isPlan;

   return (
     <div className="h-full flex flex-col">
       {/* Header */}
       <div className="p-4 border-b">
         <div className="flex items-start justify-between gap-4">
           <div className="flex items-start gap-4">
             <div className={cn(
               "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
               isPlanLevel ? "bg-primary/15" : task.is_active ? "bg-primary/10" : "bg-muted/50"
             )}>
               {isPlanLevel 
                 ? <Target className="h-6 w-6 text-primary" />
                 : <MessageSquare className={cn("h-6 w-6", task.is_active ? "text-primary" : "text-muted-foreground")} />
               }
             </div>
             <div className="flex-1 min-w-0">
               {editingTitle ? (
                 <div className="flex items-center gap-2">
                   <Input
                     value={editedTitle}
                     onChange={(e) => setEditedTitle(e.target.value)}
                     className="h-8 text-lg font-semibold"
                     maxLength={100}
                     autoFocus
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') handleSaveTitle();
                       if (e.key === 'Escape') handleCancelEditTitle();
                     }}
                   />
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveTitle}>
                     <Check className="h-4 w-4" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEditTitle}>
                     <X className="h-4 w-4" />
                   </Button>
                 </div>
               ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold truncate">{displayTitle}</h2>
                    {isPlanLevel && (
                      <Badge variant="outline" className="text-sm text-primary border-primary/30">
                        {t('plans.concept')}
                      </Badge>
                    )}
                    {task.is_system && (
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    {!task.is_system && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-50 hover:opacity-100"
                        onClick={handleStartEditTitle}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
               )}
               <div className="flex items-center gap-2 mt-1 text-base text-muted-foreground">
                 <span>{format(new Date(task.updated_at), 'dd.MM.yyyy HH:mm')}</span>
                 {!isPlanLevel && selectedModels.length > 0 && (
                   <>
                     <span>•</span>
                     <Badge variant="secondary" className="text-sm">
                       {selectedModels.length} {selectedModels.length === 1 ? t('tasks.model') : t('tasks.models')}
                     </Badge>
                   </>
                 )}
               </div>
             </div>
           </div>
           
             {/* Actions */}
             <div className="flex items-center gap-2">
               {hasChanges && !task.is_system && (
                 <Button 
                   onClick={handleSaveConfig}
                   size="sm"
                   className="min-w-[140px] h-9"
                   disabled={saving}
                 >
                   {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                   {isPlanLevel ? t('plans.save') : t('tasks.saveTask')}
                 </Button>
               )}
               {task.is_system && onDuplicate && (
                 <Button
                   variant="outline"
                   size="sm"
                   className="h-9 gap-2"
                   onClick={() => onDuplicate(task)}
                 >
                   <Copy className="h-4 w-4" />
                   {t('tasks.duplicateToOwn')}
                 </Button>
               )}
               {!task.is_system && !isPlanLevel && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-9 w-9"
                  onClick={onDelete}
                  data-guide="tasks-delete-btn"
                >
                 <Trash2 className="h-4 w-4" />
               </Button>
               )}
               {!isPlanLevel && (
                 <Button
                   onClick={handleOpenTask}
                   disabled={selectedModels.length === 0}
                   className="hydra-glow-sm"
                   data-guide="tasks-open-btn"
                 >
                   <Play className="h-4 w-4 mr-2" />
                   {t('tasks.open')}
                 </Button>
               )}
             </div>
          </div>
        </div>

        {/* Unsaved Changes Dialog */}
        <UnsavedChangesDialog
          open={unsavedChanges.showConfirmDialog}
          onConfirm={unsavedChanges.confirmAndProceed}
          onCancel={unsavedChanges.cancelNavigation}
        />
 
       <ScrollArea className="flex-1">
         <div className="p-4 space-y-6">
           {/* Task / Plan Formulation */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {isPlanLevel ? t('plans.goalFormulation') : t('tasks.formulation')}
                </h3>
                {isPlanLevel && (
                  <ConceptFileUpload taskId={task.id} />
                )}
              </div>
             <Textarea
               value={taskDescription}
               onChange={(e) => handleDescriptionChange(e.target.value)}
               placeholder={isPlanLevel ? t('plans.goalPlaceholder') : t('tasks.formulationPlaceholder')}
               className={cn("resize-y text-sm", isPlanLevel ? "min-h-[160px]" : "min-h-[80px]")}
               disabled={task.is_system}
             />
            </section>

            {/* Patent toggle — only for plan-level */}
            {isPlanLevel && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-patent"
                  checked={includePatent}
                  onCheckedChange={(checked) => {
                    setIncludePatent(!!checked);
                    userInteractedRef.current = true;
                    setHasChanges(true);
                  }}
                />
                <label htmlFor="include-patent" className="text-sm text-muted-foreground cursor-pointer select-none">
                  {language === 'ru' ? 'Включить патентный прогноз' : 'Include patent forecast'}
                </label>
              </div>
            )}

              {/* Concept Pipeline — only for plan-level */}
              {isPlanLevel && (
                <section className="border-t pt-4 space-y-4">
                  {/* Pipeline Timeline */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <ConceptPipelineTimeline
                        activePhase={pipeline.state.activePhase}
                        phaseStatuses={pipeline.state.phaseStatuses}
                        hasConceptFilled={!!taskDescription?.trim()}
                        includePatent={includePatent}
                        onPhaseClick={(phase) => {
                          if (pipeline.state.phaseStatuses[phase] === 'done') {
                            setPreviewTab(phase);
                            setPreviewOpen(true);
                          } else if (!pipeline.state.isRunning && pipeline.state.phaseStatuses[phase] === 'idle') {
                            // Validate dependencies
                            const deps: Record<string, boolean> = {
                              visionary: true,
                              strategist: pipeline.state.phaseStatuses.visionary === 'done',
                              patent: pipeline.state.phaseStatuses.visionary === 'done' && pipeline.state.phaseStatuses.strategist === 'done',
                            };
                            if (deps[phase]) {
                              pipeline.runStep(phase);
                            }
                          }
                        }}
                        onRestart={() => pipeline.runFullPipeline()}
                      />
                    </div>
                    {/* Auto-run button */}
                    {!pipeline.state.isRunning ? (
                      <Button
                        onClick={() => pipeline.runFullPipeline()}
                        size="sm"
                        className="gap-2 shrink-0"
                        disabled={!taskDescription?.trim() || pipeline.state.isRunning}
                      >
                        <Zap className="h-4 w-4" />
                        {language === 'ru' ? 'Полный анализ' : 'Full Analysis'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => pipeline.abort()}
                        variant="outline"
                        size="sm"
                        className="gap-2 shrink-0 border-destructive/30 text-destructive"
                      >
                        <StopCircle className="h-4 w-4" />
                        {language === 'ru' ? 'Остановить' : 'Stop'}
                      </Button>
                    )}
                  </div>

                  {/* Individual expert sections */}
                  <ConceptVisionaryCall
                    planId={(task.session_config as any)?.__planId || task.plan_id || task.id}
                    planTitle={displayTitle}
                    planGoal={taskDescription}
                    response={conceptResponses.visionary}
                    onExpand={() => { setPreviewTab('visionary'); setPreviewOpen(true); }}
                    onInvoke={() => pipeline.runStep('visionary')}
                    invoking={pipeline.state.phaseStatuses.visionary === 'running' || expertLoading === 'visionary'}
                  />

                  <ConceptStrategistCall
                    planId={(task.session_config as any)?.__planId || task.plan_id || task.id}
                    planTitle={displayTitle}
                    planGoal={taskDescription}
                    response={conceptResponses.strategist}
                    onExpand={() => { setPreviewTab('strategist'); setPreviewOpen(true); }}
                    onInvoke={() => pipeline.runStep('strategist')}
                    invoking={pipeline.state.phaseStatuses.strategist === 'running' || expertLoading === 'strategist'}
                  />

                  {includePatent && (
                    <ConceptPatentSearch
                      planId={(task.session_config as any)?.__planId || task.plan_id || task.id}
                      planTitle={displayTitle}
                      planGoal={taskDescription}
                      response={conceptResponses.patent}
                      onExpand={() => { setPreviewTab('patent'); setPreviewOpen(true); }}
                      onInvoke={() => pipeline.runStep('patent')}
                      invoking={pipeline.state.phaseStatuses.patent === 'running' || expertLoading === 'patent'}
                    />
                  )}
                </section>
              )}

              {/* Expert Responses Preview Dialog */}
              {isPlanLevel && (
                <ConceptResponsesPreview
                  responses={conceptResponses}
                  defaultTab={previewTab}
                  open={previewOpen}
                  onOpenChange={setPreviewOpen}
                  planId={conceptPlanId}
                  includePatent={includePatent}
                  onApprovalComplete={() => {
                    refetchResponses();
                    // Reset dirty flag — approval saved config implicitly
                    handleSaveConfig();
                  }}
                />
              )}

            {/* Model selector & settings — only for non-plan tasks */}
            {!isPlanLevel && (
             <>
               <section data-guide="tasks-detail-models">
                 <h3 className="text-base font-medium text-muted-foreground mb-3">{t('tasks.selectModels')}</h3>
                 <MultiModelSelector 
                   value={selectedModels} 
                   onChange={handleModelsChange}
                   className="w-full"
                 />
               </section>
 
               {selectedModels.length > 0 && (
                 <section className="space-y-2">
                   <h3 className="text-base font-medium text-muted-foreground">{t('tasks.selectedModels')}</h3>
                   <div className="space-y-2">
                     {selectedModels.map((modelId) => (
                       <div 
                         key={modelId}
                         className="flex items-center gap-3 text-base py-2 px-3 rounded-md bg-muted/30"
                       >
                         {getModelIcon(modelId)}
                         <span className="font-medium flex-1 truncate">{getModelDisplayName(modelId)}</span>
                         <span className="text-sm text-muted-foreground px-2 py-0.5 rounded bg-background/50">
                           {getModelRole(modelId)}
                         </span>
                       </div>
                     ))}
                   </div>
                 </section>
               )}

               <div data-guide="tasks-files-tab">
                 <TaskFilesPanel sessionId={task.id} className="border-t pt-4" />
               </div>

               <div data-guide="tasks-hybrid-toggle">
                 <SessionSettings
                   useHybridStreaming={useHybridStreaming}
                   onHybridStreamingChange={handleHybridChange}
                   className="border-t pt-4"
                 />
               </div>

               {selectedModels.length > 0 && (
                 <PerModelSettings
                   selectedModels={selectedModels}
                   settings={perModelSettings}
                   onChange={handleSettingsChange}
                   className="border-t"
                 />
               )}
             </>
           )}
 
          </div>
        </ScrollArea>
      </div>
    );
  }