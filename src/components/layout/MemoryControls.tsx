 import React from 'react';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
 import { Brain, RefreshCw, Check, Settings2 } from 'lucide-react';
 import { motion, AnimatePresence } from 'framer-motion';
 
 interface MemoryStats {
   total: number;
   byType: {
     decision: number;
     context: number;
     instruction: number;
     summary?: number;
     message?: number;
   };
 }
 
 interface MemoryControlsProps {
   memoryStats: MemoryStats | null;
   isLoading?: boolean;
   isRefreshed?: boolean;
   onRefresh: () => void;
   onOpenDialog: () => void;
 }
 
 export function MemoryControls({
   memoryStats,
   isLoading = false,
   isRefreshed = false,
   onRefresh,
   onOpenDialog,
 }: MemoryControlsProps) {
   const { t } = useLanguage();
 
   // Don't render if no memory data
   if (!memoryStats || memoryStats.total === 0) {
     return null;
   }
 
   return (
     <div className="flex items-center gap-1.5">
       {/* Memory Stats Badge */}
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
             </div>
           </TooltipContent>
         </Tooltip>
       </TooltipProvider>
 
       {/* Refresh Button */}
       <TooltipProvider>
         <Tooltip>
           <TooltipTrigger asChild>
             <motion.button
               onClick={onRefresh}
               disabled={isLoading}
               className="h-6 w-6 rounded flex items-center justify-center text-hydra-memory/80 hover:text-hydra-memory hover:bg-hydra-memory/10 transition-colors focus:outline-none focus:ring-2 focus:ring-hydra-memory/50 disabled:opacity-50"
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
                     <Check className="h-3.5 w-3.5 text-hydra-success" />
                   ) : (
                     <RefreshCw className="h-3.5 w-3.5" />
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