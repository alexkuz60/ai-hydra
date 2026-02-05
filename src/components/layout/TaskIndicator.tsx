 import React from 'react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Badge } from '@/components/ui/badge';
 import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
 import { Target, Loader2 } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 
 interface TaskIndicatorProps {
   taskId: string | null;
   taskTitle: string | null;
   loading?: boolean;
 }
 
 export function TaskIndicator({ taskId, taskTitle, loading = false }: TaskIndicatorProps) {
   const { t } = useLanguage();
   const navigate = useNavigate();
 
   if (loading) {
     return (
       <Badge 
         variant="secondary" 
         className="gap-1.5 bg-muted/50 text-muted-foreground border-border/50 h-6 px-2.5"
       >
         <Loader2 className="h-3 w-3 animate-spin" />
         <span className="text-xs">{t('common.loading')}</span>
       </Badge>
     );
   }
 
   if (!taskId || !taskTitle) {
     return null;
   }
 
   // Truncate long titles
   const displayTitle = taskTitle.length > 30 
     ? `${taskTitle.slice(0, 30)}...` 
     : taskTitle;
 
   return (
     <TooltipProvider>
       <Tooltip>
         <TooltipTrigger asChild>
           <Badge 
             variant="secondary" 
             className="gap-1.5 bg-hydra-cyan/15 text-hydra-cyan border-hydra-cyan/30 cursor-pointer h-6 px-2.5 hover:bg-hydra-cyan/25 transition-colors"
             onClick={() => navigate('/tasks')}
           >
             <Target className="h-3 w-3" />
             <span className="text-xs font-medium max-w-[150px] truncate">
               {displayTitle}
             </span>
           </Badge>
         </TooltipTrigger>
         <TooltipContent side="bottom">
           <div className="text-xs space-y-1">
             <p className="font-medium">{t('tasks.activeSession')}</p>
             <p className="text-muted-foreground">{taskTitle}</p>
             <p className="text-muted-foreground/70 text-[10px]">
               {t('tasks.clickToManage')}
             </p>
           </div>
         </TooltipContent>
       </Tooltip>
     </TooltipProvider>
   );
 }