import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Target, Zap, ZapOff, Square, Circle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { TechSupportDialog } from '@/components/warroom/TechSupportDialog';
import { ModelOption } from '@/hooks/useAvailableModels';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskHeaderProps {
  taskTitle: string;
  sessionId: string | null;
  allAvailableModels: ModelOption[];
  useHybridStreaming: boolean;
  setUseHybridStreaming: (v: boolean) => void;
  streamingResponsesCount: number;
  onStopAllStreaming: () => void;
  onResponseComplete: (modelId: string, role: string) => void;
}

export function TaskHeader({
  taskTitle,
  sessionId,
  allAvailableModels,
  useHybridStreaming,
  setUseHybridStreaming,
  streamingResponsesCount,
  onStopAllStreaming,
  onResponseComplete,
}: TaskHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="border-b border-border p-3 bg-background/50 flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
        <Target className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium truncate">{taskTitle}</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Tech Support */}
        <TechSupportDialog
          sessionId={sessionId}
          availableModels={allAvailableModels}
          onResponseComplete={onResponseComplete}
          trigger={
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span className="text-xs hidden sm:inline">{t('techSupport.callTech')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t('techSupport.callTechTooltip')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        />
        
        {/* Streaming Mode Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => {
                  setUseHybridStreaming(!useHybridStreaming);
                  toast.success(
                    !useHybridStreaming 
                      ? t('streaming.enabledToast') 
                      : t('streaming.disabledToast')
                  );
                }}
                className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={useHybridStreaming ? 'streaming' : 'standard'}
                    initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <Badge 
                      variant={useHybridStreaming ? 'default' : 'secondary'}
                      className={`flex items-center gap-1.5 cursor-pointer ${
                        useHybridStreaming 
                          ? 'bg-hydra-cyan/30 text-hydra-cyan border-hydra-cyan/50' 
                          : 'bg-muted/80 text-foreground/60 border-border'
                      }`}
                    >
                      <motion.span
                        key={useHybridStreaming ? 'zap' : 'zap-off'}
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ 
                          rotate: 0, 
                          opacity: 1,
                          scale: useHybridStreaming ? [1, 1.2, 1] : 1,
                        }}
                        transition={{ 
                          duration: 0.3, 
                          ease: 'easeOut',
                          scale: useHybridStreaming ? {
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          } : undefined,
                        }}
                      >
                        {useHybridStreaming ? (
                          <Zap className="h-3 w-3 drop-shadow-[0_0_4px_hsl(var(--hydra-cyan))]" />
                        ) : (
                          <ZapOff className="h-3 w-3" />
                        )}
                      </motion.span>
                      <span className="text-xs">
                        {useHybridStreaming ? 'Streaming' : 'Standard'}
                      </span>
                    </Badge>
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{t('streaming.clickToToggle')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Stop All Streaming */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => {
                  if (streamingResponsesCount > 0) {
                    onStopAllStreaming();
                    toast.info(t('streaming.stoppedAll'));
                  }
                }}
                disabled={streamingResponsesCount === 0}
                className={cn(
                  "relative h-7 w-7 rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
                  streamingResponsesCount > 0 
                    ? "bg-hydra-critical/20 text-hydra-critical hover:bg-hydra-critical/30 cursor-pointer" 
                    : "bg-muted/50 text-muted-foreground/40 cursor-default"
                )}
                whileTap={streamingResponsesCount > 0 ? { scale: 0.9 } : undefined}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={streamingResponsesCount > 0 ? 'active' : 'idle'}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {streamingResponsesCount > 0 ? (
                      <Square className="h-3.5 w-3.5 fill-current" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                  </motion.span>
                </AnimatePresence>
                
                <AnimatePresence>
                  {streamingResponsesCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-hydra-critical text-[10px] font-bold text-white flex items-center justify-center shadow-sm"
                    >
                      {streamingResponsesCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">
                {streamingResponsesCount > 0 
                  ? t('streaming.stopAll') 
                  : t('streaming.noActiveStreams')}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
