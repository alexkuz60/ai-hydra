 import React from 'react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { TableRow, TableCell } from '@/components/ui/table';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
 import { MessageSquare, Settings, Trash2, Bot, Sparkles, Cpu } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { format } from 'date-fns';
 import { getModelInfo, getModelDisplayName } from '@/hooks/useAvailableModels';
 import type { PerModelSettingsData, DEFAULT_MODEL_SETTINGS } from '@/components/warroom/PerModelSettings';
 
 export interface Task {
   id: string;
   title: string;
   description: string | null;
   is_active: boolean;
   created_at: string;
   updated_at: string;
   session_config: {
     selectedModels?: string[];
     perModelSettings?: PerModelSettingsData;
     useHybridStreaming?: boolean;
   } | null;
 }
 
 function getModelIcon(modelId: string) {
   const { isLovable, model } = getModelInfo(modelId);
   
   if (!model) return <Bot className="h-3.5 w-3.5 text-muted-foreground" />;
   
   if (isLovable) {
     return <Sparkles className="h-3.5 w-3.5 text-primary" />;
   }
   return <Cpu className="h-3.5 w-3.5 text-accent-foreground" />;
 }
 
interface TaskRowProps {
  task: Task;
  isSelected: boolean;
  validModels: string[];
  hasUnsavedChanges?: boolean;
  onSelect: (task: Task) => void;
  onConfigure?: (task: Task, e: React.MouseEvent) => void;
  onDelete?: (task: Task, e: React.MouseEvent) => void;
}
 
export function TaskRow({
  task,
  isSelected,
  validModels,
  hasUnsavedChanges,
  onSelect,
  onConfigure,
  onDelete,
}: TaskRowProps) {
   const { t } = useLanguage();
 
   const modelCount = validModels.length;
 
   return (
     <TableRow
       className={cn(
         'cursor-pointer transition-colors group',
         isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'
       )}
       onClick={() => onSelect(task)}
     >
       <TableCell className="pl-6">
         <div className={cn(
           "w-10 h-10 rounded-lg flex items-center justify-center",
           task.is_active ? "bg-primary/10" : "bg-muted/50"
         )}>
           <MessageSquare className={cn(
             "h-5 w-5",
             task.is_active ? "text-primary" : "text-muted-foreground"
           )} />
         </div>
       </TableCell>
       <TableCell>
         <div className="flex items-center justify-between gap-2">
           <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{task.title}</span>
                {hasUnsavedChanges && (
                  <span className="w-2 h-2 rounded-full bg-hydra-warning animate-pulse-glow shrink-0" title="Unsaved changes" />
                )}
               {modelCount > 0 && (
                 <Badge variant="secondary" className="text-[10px]">
                   {modelCount} {modelCount === 1 ? t('tasks.model') : t('tasks.models')}
                 </Badge>
               )}
             </div>
             <div className="flex items-center gap-3 text-xs text-muted-foreground">
               <span>{format(new Date(task.updated_at), 'dd.MM.yyyy HH:mm')}</span>
             </div>
             {/* Models preview */}
             {modelCount > 0 && (
               <div className="flex flex-wrap gap-1 mt-1">
                 {validModels.slice(0, 3).map((modelId) => (
                   <div 
                     key={modelId}
                     className="flex items-center gap-1 text-[10px] py-0.5 px-1.5 rounded bg-muted/50"
                   >
                     {getModelIcon(modelId)}
                     <span className="truncate max-w-[80px]">{getModelDisplayName(modelId)}</span>
                   </div>
                 ))}
                 {modelCount > 3 && (
                   <span className="text-[10px] text-muted-foreground py-0.5 px-1.5">
                     +{modelCount - 3}
                   </span>
                 )}
               </div>
             )}
           </div>
           {/* Action buttons */}
           <div className="flex items-center gap-1 shrink-0">
             {onConfigure && (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="opacity-0 group-hover:opacity-100 transition-opacity"
                     onClick={(e) => onConfigure(task, e)}
                   >
                     <Settings className="h-4 w-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>{t('tasks.modelConfig')}</TooltipContent>
               </Tooltip>
             )}
             {onDelete && (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                     onClick={(e) => onDelete(task, e)}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>{t('common.delete')}</TooltipContent>
               </Tooltip>
             )}
           </div>
         </div>
       </TableCell>
     </TableRow>
   );
 }