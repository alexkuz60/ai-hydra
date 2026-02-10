import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
 import { Brain, RefreshCw, Check, Settings2, BookOpen } from 'lucide-react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { ROLE_CONFIG, type AgentRole } from '@/config/roles';
 
interface MemoryStats {
  total: number;
  byType: {
    decision: number;
    context: number;
    instruction: number;
    evaluation?: number;
    summary?: number;
    message?: number;
  };
}
 
 interface MemoryControlsProps {
   memoryStats: MemoryStats | null;
   knowledgeByRole?: Record<string, number>;
   isLoading?: boolean;
   isRefreshed?: boolean;
   onRefresh: () => void;
   onOpenDialog: () => void;
 }
 
 export function MemoryControls({
   memoryStats,
   knowledgeByRole = {},
   isLoading = false,
   isRefreshed = false,
   onRefresh,
   onOpenDialog,
 }: MemoryControlsProps) {
   const { t, language } = useLanguage();

   const knowledgeTotal = useMemo(() => 
     Object.values(knowledgeByRole).reduce((s, n) => s + n, 0),
     [knowledgeByRole]
   );
 
   // Don't render if no memory data and no knowledge
   if ((!memoryStats || memoryStats.total === 0) && knowledgeTotal === 0) {
     return null;
   }
 
   return (
     <div className="flex items-center gap-1.5" data-guide="memory-controls">
       {/* Memory Stats Badge */}
       {memoryStats && memoryStats.total > 0 && (
         <TooltipProvider>
           <Tooltip>
             <TooltipTrigger asChild>
               <Badge 
                 variant="secondary" 
                 className="gap-1 bg-hydra-memory/20 text-hydra-memory border-hydra-memory/30 cursor-help h-6 px-2"
               >
                 <Brain className="h-3 w-3" />
                 <span className="text-xs font-medium">{memoryStats.total}</span>
               </Badge>
             </TooltipTrigger>
             <TooltipContent side="bottom">
               <div className="text-xs space-y-1">
                  <p className="font-medium">{t('memory.savedChunks')}</p>
                  {memoryStats.byType.decision > 0 && (
                    <p>• {t('memory.decisions')}: {memoryStats.byType.decision}</p>
                  )}
                  {memoryStats.byType.context > 0 && (
                    <p>• {t('memory.context')}: {memoryStats.byType.context}</p>
                  )}
                  {memoryStats.byType.instruction > 0 && (
                    <p>• {t('memory.instructions')}: {memoryStats.byType.instruction}</p>
                  )}
                  {memoryStats.byType.evaluation > 0 && (
                    <p>• {t('memory.evaluations')}: {memoryStats.byType.evaluation}</p>
                  )}
               </div>
             </TooltipContent>
           </Tooltip>
         </TooltipProvider>
       )}

       {/* Knowledge Stats Badge */}
       {knowledgeTotal > 0 && (
         <TooltipProvider>
           <Tooltip>
             <TooltipTrigger asChild>
               <Badge 
                 variant="secondary" 
                 className="gap-1 bg-primary/15 text-primary border-primary/25 cursor-help h-6 px-2"
               >
                 <BookOpen className="h-3 w-3" />
                 <span className="text-xs font-medium">{knowledgeTotal}</span>
               </Badge>
             </TooltipTrigger>
             <TooltipContent side="bottom">
               <div className="text-xs space-y-1">
                 <p className="font-medium">
                   {language === 'ru' ? 'Профильные знания (RAG)' : 'Domain Knowledge (RAG)'}
                 </p>
                 {Object.entries(knowledgeByRole).map(([role, count]) => {
                   const config = ROLE_CONFIG[role as AgentRole];
                   if (!config) return null;
                   const Icon = config.icon;
                   return (
                     <div key={role} className="flex items-center gap-1.5">
                       <Icon className={`h-3 w-3 ${config.color}`} />
                       <span>{t(config.label)}: {count}</span>
                     </div>
                   );
                 })}
               </div>
             </TooltipContent>
           </Tooltip>
         </TooltipProvider>
       )}
 
       {/* Refresh Button */}
       <TooltipProvider>
         <Tooltip>
           <TooltipTrigger asChild>
              <motion.button
                onClick={onRefresh}
                disabled={isLoading}
                className={cn(
                  "h-7 w-7 rounded-md flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-hydra-memory/50 disabled:opacity-50",
                  isLoading
                    ? "text-hydra-memory bg-hydra-memory/20 shadow-[0_0_8px_hsl(var(--hydra-memory)/0.4)]"
                    : isRefreshed
                      ? "text-hydra-success bg-hydra-success/15"
                      : "text-hydra-memory hover:text-hydra-memory hover:bg-hydra-memory/15 hover:shadow-[0_0_6px_hsl(var(--hydra-memory)/0.3)]"
                )}
                whileTap={!isLoading ? { scale: 0.9 } : undefined}
              >
               <AnimatePresence mode="wait">
                 <motion.span
                   key={isRefreshed ? 'check' : isLoading ? 'loading' : 'refresh'}
                   initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                   animate={{ 
                     opacity: 1, 
                     scale: 1, 
                     rotate: isLoading ? 360 : 0 
                   }}
                   exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                   transition={{ 
                     duration: isLoading ? 1 : 0.2,
                     repeat: isLoading ? Infinity : 0,
                     ease: isLoading ? 'linear' : 'easeOut'
                   }}
                 >
                    {isRefreshed ? (
                      <Check className="h-4 w-4 text-hydra-success" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                 </motion.span>
               </AnimatePresence>
             </motion.button>
           </TooltipTrigger>
           <TooltipContent side="bottom">
             <p className="text-xs">
               {isRefreshed ? t('memory.refreshed') : t('memory.refresh')}
             </p>
           </TooltipContent>
         </Tooltip>
       </TooltipProvider>
 
       {/* Settings Button */}
       <TooltipProvider>
         <Tooltip>
           <TooltipTrigger asChild>
             <Button
               variant="ghost"
               size="icon"
               className="h-6 w-6 text-hydra-memory/80 hover:text-hydra-memory hover:bg-hydra-memory/10"
               onClick={onOpenDialog}
             >
               <Settings2 className="h-3.5 w-3.5" />
             </Button>
           </TooltipTrigger>
           <TooltipContent side="bottom">
             <p className="text-xs">{t('memory.manageMemory')}</p>
           </TooltipContent>
         </Tooltip>
       </TooltipProvider>
     </div>
   );
 }