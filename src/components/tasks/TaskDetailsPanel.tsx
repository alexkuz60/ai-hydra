import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Play, Trash2, Pencil, Check, X, Bot, Sparkles, Cpu, Loader2, Save } from 'lucide-react';
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
 
interface TaskDetailsPanelProps {
  task: Task | null;
  onUpdateTitle: (taskId: string, title: string) => Promise<void>;
  onUpdateConfig: (taskId: string, config: Task['session_config']) => Promise<void>;
  onDelete: () => void;
  onRequestTaskChange?: (task: Task) => void;
  saving?: boolean;
  hasUnsavedChangesRef?: React.MutableRefObject<boolean>;
}
 
export function TaskDetailsPanel({
  task,
  onUpdateTitle,
  onUpdateConfig,
  onDelete,
  onRequestTaskChange,
  saving = false,
  hasUnsavedChangesRef,
}: TaskDetailsPanelProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Editing title state
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  // Model configuration state
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [perModelSettings, setPerModelSettings] = useState<PerModelSettingsData>({});
  const [useHybridStreaming, setUseHybridStreaming] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

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

  // Initialize state when task changes or when config is updated
  React.useEffect(() => {
    if (task) {
      setSelectedModels(filterValidModels(task.session_config?.selectedModels || []));
      setPerModelSettings(task.session_config?.perModelSettings || {});
      setUseHybridStreaming(task.session_config?.useHybridStreaming ?? true);
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
     setHasChanges(true);
   };
 
   const handleSettingsChange = (settings: PerModelSettingsData) => {
     setPerModelSettings(settings);
     setHasChanges(true);
   };
 
   const handleHybridChange = (value: boolean) => {
     setUseHybridStreaming(value);
     setHasChanges(true);
   };
 
   const handleSaveConfig = async () => {
     await onUpdateConfig(task.id, {
       selectedModels,
       perModelSettings,
       useHybridStreaming,
     });
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
 
   return (
     <div className="h-full flex flex-col">
       {/* Header */}
       <div className="p-4 border-b">
         <div className="flex items-start justify-between gap-4">
           <div className="flex items-start gap-4">
             <div className={cn(
               "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
               task.is_active ? "bg-primary/10" : "bg-muted/50"
             )}>
               <MessageSquare className={cn(
                 "h-6 w-6",
                 task.is_active ? "text-primary" : "text-muted-foreground"
               )} />
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
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-8 w-8"
                     onClick={handleSaveTitle}
                   >
                     <Check className="h-4 w-4" />
                   </Button>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-8 w-8"
                     onClick={handleCancelEditTitle}
                   >
                     <X className="h-4 w-4" />
                   </Button>
                 </div>
               ) : (
                 <div className="flex items-center gap-2">
                   <h2 className="text-xl font-semibold truncate">{task.title}</h2>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-7 w-7 opacity-50 hover:opacity-100"
                     onClick={handleStartEditTitle}
                   >
                     <Pencil className="h-3.5 w-3.5" />
                   </Button>
                 </div>
               )}
               <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                 <span>{format(new Date(task.updated_at), 'dd.MM.yyyy HH:mm')}</span>
                 {selectedModels.length > 0 && (
                   <>
                     <span>•</span>
                     <Badge variant="secondary" className="text-xs">
                       {selectedModels.length} {selectedModels.length === 1 ? t('tasks.model') : t('tasks.models')}
                     </Badge>
                   </>
                 )}
               </div>
             </div>
           </div>
           
            {/* Actions */}
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button 
                  onClick={handleSaveConfig}
                  size="sm"
                  className="min-w-[140px] h-9"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {t('tasks.saveConfig')}
                </Button>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="h-9 w-9"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleOpenTask}
                disabled={selectedModels.length === 0}
                className="hydra-glow-sm"
              >
                <Play className="h-4 w-4 mr-2" />
                {t('tasks.open')}
              </Button>
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
           {/* Model Selector */}
           <section>
             <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('tasks.selectModels')}</h3>
             <MultiModelSelector 
               value={selectedModels} 
               onChange={handleModelsChange}
               className="w-full"
             />
           </section>
 
           {/* Selected models preview */}
           {selectedModels.length > 0 && (
             <section className="space-y-2">
               <h3 className="text-sm font-medium text-muted-foreground">{t('tasks.selectedModels')}</h3>
               <div className="space-y-2">
                 {selectedModels.map((modelId) => (
                   <div 
                     key={modelId}
                     className="flex items-center gap-3 text-sm py-2 px-3 rounded-md bg-muted/30"
                   >
                     {getModelIcon(modelId)}
                     <span className="font-medium flex-1 truncate">{getModelDisplayName(modelId)}</span>
                     <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-background/50">
                       {getModelRole(modelId)}
                     </span>
                   </div>
                 ))}
               </div>
             </section>
           )}
 
           {/* Session settings */}
           <SessionSettings
             useHybridStreaming={useHybridStreaming}
             onHybridStreamingChange={handleHybridChange}
             className="border-t pt-4"
           />
 
           {/* Per-model settings */}
           {selectedModels.length > 0 && (
             <PerModelSettings
               selectedModels={selectedModels}
               settings={perModelSettings}
               onChange={handleSettingsChange}
               className="border-t"
             />
           )}
 
          </div>
        </ScrollArea>
      </div>
    );
  }